import { isValidObjectId } from "mongoose";
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
            .json(new ApiResponse(200, likedVideo, "Video liked successfully"));
    }
});

export { toggleVideoLike };
