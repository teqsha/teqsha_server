import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import errors from "../../errors/index.js";
import User from "../../model/user.js";
import Reel from "../../model/reel.js";

const getProfile = async (req, res) => {
    const { BadRequestError, NotFoundError } = errors;
    const accessToken = req.headers.authorization?.split(" ")[1];

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const userId = decodedToken.userId;

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    try {
        const followersCount = await User.countDocuments({ following: user._id });
        const followingCount = await User.countDocuments({ followers: user._id });
        const reelsCount = await Reel.countDocuments({ user: user._id });

        res.status(StatusCodes.OK).json({
            user: {
                name: user.name,
                id: user.id,
                username: user.username,
                userImage: user.userImage,
                email: user.email,
                bio: user.bio,
                followersCount,
                followingCount,
                reelsCount,
            },
        });
    } catch (error) {
        throw new BadRequestError(error);
    }
};
export{ 
    getProfile
};
