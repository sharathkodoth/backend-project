import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const likedVideoAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (likedVideoAlready) {
        await Like.findByIdAndDelete(likedVideoAlready?._id);

        return res.status(200).json(new ApiResponse(200, "removed like"));
    }

    const likedVideo = await Like.create({
        video: videoId,
        likedBy: req.user._id,
    });

    if (!likedVideo) {
        throw new ApiError(400, "Unable to like, try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideo, "Liked Video Successfully"));
});

export { toggleVideoLike };
