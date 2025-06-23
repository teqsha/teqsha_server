// // const jwt = require("jsonwebtoken");
// // const { UnauthenticatedError } = require("../errors");
// // import { User } from "../model/user";

// // const auth = async (req, res, next) => {
// //   // check header
// //   const authHeader = req.headers.authorization;
// //   if (!authHeader || !authHeader.startsWith("Bearer")) {
// //     throw new UnauthenticatedError("Authentication invalid");
// //   }
// //   const token = authHeader.split(" ")[1];

// //   try {
// //     const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
// //     // attach the user to the job routes
// //     req.user = { userId: payload.userId, name: payload.name };

// //     const user = await User.findById(payload.userId);
   
// //     if (!user) {
// //       throw new NotFoundError("User not found");
// //     }
// //     next();
// //   } catch (error) {
// //     throw new UnauthenticatedError("Authentication invalid");
// //   }
// // };

// // module.exports = auth;


// import { ApiError } from "../utils/ApiError.js";
// // import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken"
// import { User } from "../model/user.js"

// export const verifyJWT = (async(req, _, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
//         // console.log(token);
//         if (!token) {
//             // throw new ApiError(401, "Unauthorized request")
//             console.log(token);
//         }
    
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
//         if (!user) {
            
//             // throw new ApiError(401, "Invalid Access Token")
//             console.log(user);
//         }
    
//         req.user = user;
//         next()
//     } catch (error) {
//         // throw new ApiError(401, error?.message || "Invalid access token")
//         console.log(error?.message || "Invalid access token");
//     }
    
// })

// import jwt from "jsonwebtoken";
// import NotFoundError from "../errors/not-found.js";
// import UnauthenticatedError from "../errors/unauthenticated.js";
// import User  from "../model/user.js";

// const auth = async (req, res, next) => {
//   // check header
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer")) {
//     throw new UnauthenticatedError("Authentication invalid");
//   }
//   const token = authHeader.split(" ")[1];

//   try {
//     const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     // attach the user to the job routes
//     req.user = { userId: payload.userId, name: payload.name };

//     const user = await User.findById(payload.userId);
   
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }
//     next();
//   } catch (error) {
//     throw new UnauthenticatedError("Authentication invalid");
//   }
// };

// export default auth;


import jwt from "jsonwebtoken";
import User from "../model/user.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Authentication invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = { userId: payload.userId, fullName: payload.fullName };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication invalid" });
  }
};

export default auth;
