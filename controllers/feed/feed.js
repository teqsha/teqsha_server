// import { StatusCodes } from "http-status-codes";
// import Like from"../../model/like.js";
// import Reel from "../../model/reel.js";
// import User from "../../model/user.js";
// import errors from "../../errors/index.js";
// import jwt from "jsonwebtoken";
// import Comment from "../../model/comment.js";

// const getHomeFeed = async (req, res) => {
//  const { BadRequestError, NotFoundError } = errors;
//   let { limit = 50, offset = 0 } = req.query;
//   limit = parseInt(limit);
//   offset = parseInt(offset);

//   const accessToken = req.headers.authorization?.split(" ")[1];
//   const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//   const userId = decodedToken.userId;

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new NotFoundError("User not found");
//   }

//   try {
//     const following = user.following;

//     const userHistory = await UserHistory.findOne({ user: userId });
//     const watchedReelIds = userHistory
//       ? userHistory.reels.map((r) => r.reel)
//       : [];

//     const uniqueReelsMap = new Map();
//     let totalReels = 0;

//     const addReelsToMap = async (reels) => {
//       const reelIds = reels.map((reel) => reel._id);
//       const [likesCounts, commentsCounts, likedReels] = await Promise.all([
//         Like.aggregate([
//           { $match: { reel: { $in: reelIds } } },
//           { $group: { _id: "$reel", count: { $sum: 1 } } },
//         ]),
//         Comment.aggregate([
//           { $match: { reel: { $in: reelIds } } },
//           { $group: { _id: "$reel", count: { $sum: 1 } } },
//         ]),
//         Like.find({ user: userId, reel: { $in: reelIds } }).distinct("reel"),
//       ]);

//       const likesCountMap = new Map(
//         likesCounts.map((item) => [item._id.toString(), item.count])
//       );
//       const commentsCountMap = new Map(
//         commentsCounts.map((item) => [item._id.toString(), item.count])
//       );
//       const likedReelsSet = new Set(likedReels.map((id) => id.toString()));

//       for (const reel of reels) {
//         if (!uniqueReelsMap.has(reel._id.toString())) {
//           reel.isLiked = likedReelsSet.has(reel._id.toString());
//           reel.likesCount = likesCountMap.get(reel._id.toString()) || 0;
//           reel.commentsCount = commentsCountMap.get(reel._id.toString()) || 0;
//           uniqueReelsMap.set(reel._id.toString(), reel);
//           totalReels += 1;
//         }
//       }
//     };

//     const fetchReels = async (query, options = {}) => {
//       return Reel.find(query)
//         .sort(options.sort || { createdAt: -1 })
//         .limit(options.limit || limit)
//         .select("-likes -comments")
//         .populate("user", "username name id userImage")
//         .exec();
//     };

//     // Fetch reels from following
//     const reelsFromFollowing = await fetchReels({
//       user: { $in: following },
//       _id: { $nin: watchedReelIds },
//     });

//     await addReelsToMap(reelsFromFollowing);

//     // Fetch most liked reels
//     if (totalReels < limit + offset) {
//       const remainingLimit = limit + offset - totalReels;
//       const mostLikedReels = await Reel.aggregate([
//         { $match: { _id: { $nin: watchedReelIds } } },
//         {
//           $project: {
//             user: 1,
//             videoUri: 1,
//             thumbUri: 1,
//             caption: 1,
//             likesCount: { $size: "$likes" },
//             commentsCount: { $size: "$comments" },
//             createdAt: 1,
//           },
//         },
//         { $sort: { likesCount: -1, commentsCount: -1, createdAt: -1 } },
//         { $limit: remainingLimit },
//         {
//           $lookup: {
//             from: "users",
//             localField: "user",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//         { $unwind: "$user" },
//         {
//           $project: {
//             videoUri: 1,
//             thumbUri: 1,
//             caption: 1,
//             createdAt: 1,
//             likesCount: 1,
//             commentsCount: 1,
//             user: {
//               username: "$user.username",
//               name: "$user.name",
//               id: "$user._id",
//               userImage: "$user.userImage",
//             },
//           },
//         },
//       ]);

//       await addReelsToMap(mostLikedReels);
//     }

//     // Fetch latest reels
//     if (totalReels < limit + offset) {
//       const remainingLimit = limit + offset - totalReels;
//       const latestReels = await fetchReels(
//         {
//           _id: { $nin: watchedReelIds },
//         },
//         { limit: remainingLimit }
//       );

//       await addReelsToMap(latestReels);
//     }

//     const uniqueReels = Array.from(uniqueReelsMap.values());

//     if (offset >= uniqueReels.length) {
//       return res.status(StatusCodes.OK).json({ reels: [] });
//     }

//     const response = uniqueReels.slice(offset, offset + limit).map((reel) => ({
//       _id: reel._id,
//       videoUri: reel.videoUri,
//       thumbUri: reel.thumbUri,
//       caption: reel.caption,
//       createdAt: reel.createdAt,
//       user: {
//         _id: reel.user.id,
//         username: reel.user.username,
//         name: reel.user.name,
//         userImage: reel.user.userImage,
//         isFollowing: user.following.includes(reel.user.id),
//       },
//       likesCount: reel.likesCount,
//       commentsCount: reel.commentsCount,
//       isLiked: !!reel.isLiked,
//     }));

//     res.status(StatusCodes.OK).json({ reels: response });
//   } catch (error) {
//     console.error(error);
//     throw new BadRequestError(error.message);
//   }
// };

// export {
//   getHomeFeed,
// };

import { StatusCodes } from "http-status-codes";
import Like from "../../model/like.js";
import Reel from "../../model/reel.js";
import User from "../../model/user.js";
import Comment from "../../model/comment.js";
import jwt from "jsonwebtoken";
import errors from "../../errors/index.js";

const getHomeFeed = async (req, res) => {
    const { BadRequestError, NotFoundError } = errors;
    let { limit = 50, offset = 0 } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);

    const accessToken = req.headers.authorization?.split(" ")[1];
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const userId = decodedToken.userId;

    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    try {
        const following = user.following;
        const uniqueReelsMap = new Map();
        let totalReels = 0;

        const addReelsToMap = async (reels) => {
            const reelIds = reels.map((reel) => reel._id);
            const [likesCounts, commentsCounts, likedReels] = await Promise.all([
                Like.aggregate([
                    { $match: { reel: { $in: reelIds } } },
                    { $group: { _id: "$reel", count: { $sum: 1 } } },
                ]),
                Comment.aggregate([
                    { $match: { reel: { $in: reelIds } } },
                    { $group: { _id: "$reel", count: { $sum: 1 } } },
                ]),
                Like.find({ user: userId, reel: { $in: reelIds } }).distinct("reel"),
            ]);

            const likesCountMap = new Map(likesCounts.map((item) => [item._id.toString(), item.count]));
            const commentsCountMap = new Map(commentsCounts.map((item) => [item._id.toString(), item.count]));
            const likedReelsSet = new Set(likedReels.map((id) => id.toString()));

            for (const reel of reels) {
                if (!uniqueReelsMap.has(reel._id.toString())) {
                    reel.isLiked = likedReelsSet.has(reel._id.toString());
                    reel.likesCount = likesCountMap.get(reel._id.toString()) || 0;
                    reel.commentsCount = commentsCountMap.get(reel._id.toString()) || 0;
                    uniqueReelsMap.set(reel._id.toString(), reel);
                    totalReels += 1;
                }
            }
        };

        const fetchReels = (query, options = {}) => {
            return Reel.find(query)
                .sort(options.sort || { createdAt: -1 })
                .limit(options.limit || limit)
                .select("-likes -comments")
                .populate("user", "username name id userImage")
                .exec();
        };
        // Fetch reels from following
        // const reelsFromFollowing = await fetchReels({
        //     user: { $in: following },
        // });

         const reelsFromFollowing = await fetchReels({});

        await addReelsToMap(reelsFromFollowing);

        // Fetch latest reels if needed
        if (totalReels < limit + offset) {
            const remainingLimit = limit + offset - totalReels;
            const latestReels = await fetchReels({}, { limit: remainingLimit });
            await addReelsToMap(latestReels);
        }

        const uniqueReels = Array.from(uniqueReelsMap.values());

        if (offset >= uniqueReels.length) {
            return res.status(StatusCodes.OK).json({ reels: [] });
        }

        const response = uniqueReels.slice(offset, offset + limit).map((reel) => ({
            _id: reel._id,
            videoUri: reel.videoUri,
            thumbUri: reel.thumbUri,
            caption: reel.caption,
            createdAt: reel.createdAt,
            user: reel.user
                ? {
                    _id: reel.user.id,
                    username: reel.user.username,
                    name: reel.user.name,
                    userImage: reel.user.userImage,
                    isFollowing: user.following.includes(reel.user.id),
                }
                : null,
            likesCount: reel.likesCount,
            commentsCount: reel.commentsCount,
            isLiked: !!reel.isLiked,
        }));


        res.status(StatusCodes.OK).json({ reels: response });
    } catch (error) {
        console.error(error);
        throw new BadRequestError(error.message);
    }
};

export { getHomeFeed };
