import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const video = await Video.findById(videoId);
    const skip = (page - 1) * limit;

    if (!isValidObjectId(videoId) || !video) {
        throw new ApiError(400, "Invalid ID or video not found");
    }
    const totalComments = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId),
    });

    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { comments, totalComments },
                "comments fetched successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content.trim()) {
        throw new ApiError(
            400,
            "Comment field is required and cannot be blank"
        );
    }

    const owner = req.user?._id;

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner,
    });

    if (!newComment) {
        throw new ApiError(
            400,
            "Failed to create comment. Please check your input and try again."
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newComment, "comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;

    
});

export { getVideoComments, addComment };
