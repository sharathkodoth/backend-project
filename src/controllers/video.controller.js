import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { uploadFileOnCloudinary } from "../services/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

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
        isPublished: false,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "video not found");

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likedByCurrentUser: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            _id: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$owner" },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                commentsCount: {
                    $size: "$comments",
                },
            },
        },
    ]);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }
    // increment the views field by 1
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 },
        },
        { new: true }
    );

    // adds this video to user watchHistory
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { watchHistory: videoId },
        },
        { new: true }
    );

    return res
        .status(201)
        .json(new ApiResponse(200, video, "Found video successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(videoId);

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not owner of this video");
    }

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

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not owner of this video");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId, { new: true });

    if (!deletedVideo) {
        throw new ApiError(500, "Video not deleted, try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleteVideo, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not owner of this video");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid id");
    }

    const isPublished = await Video.findByIdAndUpdate(
        videoId,
        [
            {
                $set: {
                    isPublished: {
                        $cond: [
                            { $not: "$isPublished" }, // negates the current value of publishStatus
                            true, // if condition is true (publishStatus is false), set to true
                            false, // if condition is false (publishStatus is true), set to false
                        ],
                    },
                },
            },
        ],
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                isPublished,
                "changed publish status successfully"
            )
        );
});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
