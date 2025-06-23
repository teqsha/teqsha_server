import Reel from "../../model/reel.js";
import User from "../../model/user.js";
import { StatusCodes } from "http-status-codes";
import errors from "../../errors/index.js";
import jwt from "jsonwebtoken";

const createReel = async (req, res) => {
  const { BadRequestError, NotFoundError } = errors;
  const { videoUri, thumbUri, caption } = req.body;
  if (!videoUri || !thumbUri || !caption) {
    throw new BadRequestError("Invalid Body");
  }
  const accessToken = req.headers.authorization?.split(" ")[1];
  console.log("Access token:", accessToken);

  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  console.log("Decoded token:", decodedToken);

  const userId = decodedToken.userId;
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  try {
    const newReel = new Reel({ user: userId, videoUri, caption, thumbUri });
    await newReel.save();

    res.status(StatusCodes.CREATED).json(newReel);
  } catch (error) {
    throw new BadRequestError(error);
  }
};
// console.log("Creating new reel...");
// console.log("Request body:", req.body);
// console.log("User ID:", userId);
// console.log("New reel:", newReel);

// console.log("Getting reel by ID...");
// console.log("Reel ID:", reelId);
// console.log("User ID:", userId);
// console.log("Reel data:", reel);
// console.log("Likes count:", likesCount);
// console.log("Comments count:", commentsCount);
// console.log("User data:", user);
// console.log("Is following:", isFollowing);
// console.log("Reel data:", reelData);

// const getReelById = async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.userId;

//   try {
//     const reel = await Reel.findById(reelId)
//       .populate("user", "username name userImage id")
//       .select("-likes -comments");

//     if (!reel) {
//       throw new NotFoundError("Reel not found");
//     }

//     const likesCount = await Like.countDocuments({ reel: reelId });

//     const commentsCount = await Comment.countDocuments({ reel: reelId });

//     const user = await User.findById(userId);
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }
//     const isFollowing = user.following.includes(reel.user._id.toString());

//     const reelData = {
//       _id: reel._id,
//       videoUri: reel.videoUri,
//       thumbUri: reel.thumbUri,
//       caption: reel.caption,
//       likesCount,
//       commentsCount,
//       user: {
//         _id: reel.user.id,
//         username: reel.user.username,
//         name: reel.user.name,
//         userImage: reel.user.userImage,
//         isFollowing,
//       },
//       createdAt: reel.createdAt,
//       updatedAt: reel.updatedAt,
//     };

//     res.status(StatusCodes.OK).json(reelData);
//   } catch (error) {
//     console.error(error);
//     throw new BadRequestError(error);
//   }
// };

export {
  createReel,
  // getReelById
};