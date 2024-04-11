import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { uploadFileOnCloudinary } from "../services/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

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

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "video not found");

    const videoFound = await Video.findById(videoId);

    if (!videoFound) {
        throw new ApiError(400, "Video not found");
    }

    return res
        .status(404)
        .json(new ApiResponse(404, videoFound, "Found video successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // Validate input
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const thumbnailFileLocalPath = req.file?.path;

    if (!thumbnailFileLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnailUploadResult = await uploadFileOnCloudinary(
        thumbnailFileLocalPath
    );

    if (!thumbnailUploadResult) {
        throw new ApiError(500, "Thumbnail upload failed, please try again");
    }

    const { url: thumbnailUrl } = thumbnailUploadResult;

    // Find and update the video document
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnailUrl,
                title,
                description,
            },
        },
        { new: true, runValidators: true }
    );

    // Check if the video was found and updated
    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateVideo, "Video updated successfully"));
});

export { getAllVideos, publishVideo, getVideoById, updateVideo };
