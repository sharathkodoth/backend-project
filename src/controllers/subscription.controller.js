import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const alreadySubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: userId,
    });

    if (alreadySubscribed) {
        await Subscription.findByIdAndDelete(alreadySubscribed._id);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "removed subscription"));
    } else {
        const channelSubscribed = await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });

        if (!channelSubscribed) {
            throw new ApiError(500, "Subscription failed, try again");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "channel subscribed"));
    }
});

export { toggleSubscription };
