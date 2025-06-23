import User from '../../model/user.js';
import StatusCodes from "http-status-codes";
import UnauthenticatedError from "../../errors/not-found.js";
import BadRequestError from "../../errors/not-found.js";
import jwt from "jsonwebtoken";
import pkg from 'google-auth-library';
const { OAuth2Client } = pkg;
import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
// import bcrypt from 'bcryptjs';
import sendEmail from '../../utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const checkUsernameAvailability = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    throw new BadRequestError("Username is required");
  }

  const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new BadRequestError("Invalid username format.");
  }

  const existingUser = await User.findOne({ username });
  res.status(StatusCodes.OK).json({ available: !existingUser });
};

const authWithOauth = async (req, res) => {
  const { provider, id_token, name, userImage, username, email } = req.body;

  if (!provider || !id_token || !["google", "facebook"].includes(provider)) {
    throw new BadRequestError("Invalid request body");
  }

  try {
    let verifiedEmail;
    let googleId;
    let payload;

    if (provider === "facebook") {
      const { data } = await axios.get(
        `https://graph.facebook.com/v20.0/me?access_token=${id_token}&fields=id,email`
      );
      verifiedEmail = data.email;
    } else if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      verifiedEmail = payload.email;
      googleId = payload.sub;
    }

    if (verifiedEmail !== email) {
      throw new UnauthenticatedError("Email mismatch or invalid token");
    }

    let existingUser = await User.findOne({ email: verifiedEmail });

    if (!existingUser) {
      if (!username) {
        throw new BadRequestError("Username is required for new users");
      }

      existingUser = new User({
        email: verifiedEmail,
        username,
        fullName: name,
        userImage,
        provider,
        googleId,
      });

      await existingUser.save();
    }

    const accessToken = existingUser.createAccessToken();
    const refreshToken = existingUser.createRefreshToken();

    res.status(StatusCodes.OK).json({
      user: {
        id: existingUser._id,
        fullName: existingUser.fullName,
        username: existingUser.username,
        userImage: existingUser.userImage,
        email: existingUser.email,
        provider: existingUser.provider,
        googleId: existingUser.googleId,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

  } catch (error) {
    console.error("OAuth Authentication Error:", error);
    throw new UnauthenticatedError("OAuth failed: " + error.message);
  }
};

const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const existingUser = await User.findById(payload.userId);

    if (!existingUser) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = existingUser.createAccessToken();
    const newRefreshToken = existingUser.createRefreshToken();

    res.status(StatusCodes.OK).json({
      tokens: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    throw new UnauthenticatedError("Invalid or expired refresh token");
  }
};

const registerUser = async (req, res) => {
  console.log('recived body', req.body);

  const { fullName, username, email, password, } = req.body;
  try {
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields " })
    }
    const existUser = await User.findOne({ 
       $or: [{ username }, { email }]
     })
    if (existUser) {
      return res.status(400).json({ message: "User already exists" })
    }
    const newUser = await User.create({
      fullName,
      username,
      email,
      password
    })
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      }
    })  
  } catch (error) {
    console.log('Registration Error:', error);
    res.status(500).json({
      message: error.message
    })
  }
}

const loginUser = async (req, res) => {
  console.log("✅ loginUser endpoint hit!");
  console.log("Request body:", req.body);
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        name: existingUser.name,
        profilePic: existingUser.profilePic || null,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const resetToken = crypto.randomBytes(32).toString('hex');
//     const resetTokenExpire = Date.now() + 60 * 60 * 1000;

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpire = resetTokenExpire;
//     await user.save();

//     // const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
//     // const resetLink = `teqsha://reset-password/${resetToken}`;
//     // const html = `
//     //   <h2>Hello ${user.username || user.name}</h2>
//     //   <p>You requested to reset your password.</p>
//     //   <p>Click the link below to set a new password:</p>
//     //   <a href="${resetLink}" target="_blank" style="padding:10px 20px; background:#4caf50; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
//     //   <p>This link is valid for 1 hour.</p>
//     // `;

//     const deepLink = `onie://reset-password/${resetToken}`;
//     const webLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

//     const html = `
//   <h2>Hello ${user.username || user.name}</h2>
//   <p>You requested to reset your password.</p>
//   <p>Click below to reset it in the mobile app:</p>
//   <a href="${deepLink}" style="padding:10px 20px; background:#4caf50; color:#fff; text-decoration:none; border-radius:5px;">Reset in App</a>
//   <p>Or click below to reset via browser:</p>
//   <a href="${webLink}">${webLink}</a>
//   <p>This link is valid for 1 hour.</p>
// `;

//     await sendEmail(user.email, 'Password Reset Request', html);

//     res.status(200).json({ message: 'Reset link sent to your email address.' });
//   } catch (error) {
//     console.error('Forgot Password Error:', error.message);
//     res.status(500).json({ message: 'Something went wrong. Please try again later.' });
//   }
// };

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    const appLink = `onie://reset-password/${resetToken}`;

    const html = `
      <h2>Hello ${user.username || user.name}</h2>
      <p>You requested to reset your password.</p>
      <p>Tap the button below to reset your password in the mobile app:</p>
      <a href="${appLink}" style="padding:10px 20px; background:#4caf50; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>This link is valid for 1 hour.</p>
    `;


    await sendEmail(user.email, 'Password Reset Request', html);

    res.status(200).json({ message: 'Reset link sent to your email address.' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};


const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};


export {
  authWithOauth,
  refreshToken,
  checkUsernameAvailability,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};







