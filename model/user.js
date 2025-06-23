import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return !this.provider;
        },
    },
    provider: {
        type: String,
        enum: ['google', 'facebook', null],
        default: null,
    },
    following: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
],
    followers: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
],
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.createAccessToken = function () {

    return jwt.sign(
        {
           userId:  this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.createRefreshToken = function () {

    return jwt.sign(
        {
            userId:  this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema);

export default User;