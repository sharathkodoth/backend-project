import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { uploadFileOnCloudinary } from "../services/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideos = asyncHandler(async (req, res) => {});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Validate input
    if (!title || !description) {
        throw new ApiError(400, "Title and Description are required");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0].path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0].path;

    if (!videoFileLocalPath || !thumbnailFileLocalPath) {
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    // Upload files to Cloudinary
    const [videoUploadResult, thumbnailUploadResult] = await Promise.all([
        uploadFileOnCloudinary(videoFileLocalPath),
        uploadFileOnCloudinary(thumbnailFileLocalPath),
    ]);

    if (!videoUploadResult || !thumbnailUploadResult) {
        throw new ApiError(500, "File upload failed, please try again");
    }

    const { url: videoUrl, duration: videoDuration } = videoUploadResult;
    const { url: thumbnailUrl } = thumbnailUploadResult;

    const userId = req.user._id;

    // Create a new video document
    const video = await Video.create({
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        title,
        description,
        duration: videoDuration,
        owner: userId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

export { getAllVideos, publishVideo };
