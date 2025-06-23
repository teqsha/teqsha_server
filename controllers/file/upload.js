import cloudinary from "../../config/cloudinary.js";
import { StatusCodes } from "http-status-codes";
import BadRequestError from "../../errors/index.js";
import streamifier from "streamifier";
import { Transform } from "stream";

const uploadMedia = async (req, res) => {
  if (!req.file || !req.body.mediaType) {
    throw new BadRequestError("No file or media type provided");
  }

  try {
    const mediaType = req.body.mediaType;

    let folder;
    if (mediaType === "user_image") {
      folder = "user_images";
    } else if (mediaType === "reel_thumbnail") {
      folder = "reel_thumbnails";
    } else if (mediaType === "reel_video") {
      folder = "reel_videos";
    } else {
      throw new BadRequestError("Invalid media type");
    }

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let uploadedBytes = 0;
        const totalBytes = req.file.size;

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            use_filename: false,
            unique_filename: false,
            overwrite: false,
            // resource_type: mediaType === "reel_video" ? "video" : "image",
             resource_type: "auto",
          },
          (error, result) => {
            if (result) {
              console.log("Upload Result:", result);
              resolve(result);
            } else {
              console.error("Cloudinary Upload Error:", error);
              reject(error);
            }
          }
        );

        const progressStream = new Transform({
          transform(chunk, encoding, callback) {
            uploadedBytes += chunk.length;
            const progress = (uploadedBytes / totalBytes) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
            callback(null, chunk);
          },
        });

        streamifier
          .createReadStream(req.file.buffer)
          .pipe(progressStream)
          .pipe(uploadStream);
      });
    };

    const result = await streamUpload(req);

    res.status(StatusCodes.OK).json({ mediaUrl: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Media upload failed" });
  }
};

export default uploadMedia;
