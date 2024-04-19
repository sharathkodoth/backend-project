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
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
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

    if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
    ) {
        throw new ApiError(
            400,
            "Comment field is required and cannot be blank"
        );
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const owner = req.user?._id;
    const newComment = await Comment.create({
        content,
        video: videoId,
        owner,
    });

    if (!newComment) {
        throw new ApiError(500, "Failed to create comment. Please try again.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
    ) {
        throw new ApiError(400, "Invalid comment content");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not author of this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
                owner: req.user?._id,
            },
        },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment. Please try again.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Updated comment successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not author of this comment"
        );
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
