import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = req.user._id;

    // check if the user has already liked the video
    const likedVideoAlready = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (likedVideoAlready) {
        // if the user has already liked the video, remove the like
        await Like.findByIdAndDelete(likedVideoAlready._id);
        return res.status(200).json(new ApiResponse(200, "Video like removed"));
    } else {
        // if the user hasn't liked the video, create a new like
        const likedVideo = await Like.create({
            video: videoId,
            likedBy: userId,
        });

        if (!likedVideo) {
            throw new ApiError(500, "Unable to like the video,try again");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, likedVideo, "Liked Video successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = req.user._id;

    const likedCommentAlready = await Like.findOne({
        comment: commentId,
        likedBy: userId,
    });

    if (likedCommentAlready) {
        await Like.findByIdAndDelete(likedCommentAlready._id);
        return res.status(200).json(new ApiResponse(200, null, "removed like"));
    } else {
        const likedComment = await Like.create({
            comment: commentId,
            likedBy: userId,
        });

        if (!likedComment) {
            throw new ApiError(500, "Unable to like the comment,try again");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, likedComment, "Liked comment successfully")
            );
    }
});

const toggleCommunityPostLike = asyncHandler(async (req, res) => {
    const { communityPostId } = req.params;

    if (!isValidObjectId(communityPostId)) {
        throw new ApiError(400, "Invalid ID");
    }

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated");
    }

    const user = req.user._id;

    const likedCommunityPostAlready = await Like.findOne({
        communityPost: communityPostId,
        likedBy: user,
    });

    if (likedCommunityPostAlready) {
        await Like.findByIdAndDelete(likedCommunityPostAlready._id);
        return res.status(200).json(new ApiResponse(200, null, "removed like"));
    } else {
        const likedCommunityPost = await Like.create({
            communityPost: communityPostId,
            likedBy: user,
        });

        if (!likedCommunityPost) {
            throw new ApiError(400, "unable to like the post, try again");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    likedCommunityPost,
                    "Liked Post Successfully"
                )
            );
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = req.user._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(user),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideos",
        },
        {
            $sort: {
                updatedAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideos: {
                    _id: 1,
                    owner: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    likes: 1,
                    title: 1,
                    createdAt: 1,
                    ownerDetails: {
                        avatar: 1,
                        username: 1,
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked Videos fetched"));
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleCommunityPostLike,
    getLikedVideos,
};
