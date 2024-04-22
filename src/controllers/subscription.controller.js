import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
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

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // const userId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedTo",
                        },
                    },
                    {
                        $addFields: {
                            isSubscribedTo: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedTo.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                ],
            },
        },
        { $unwind: "$subscriber" },

        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    isSubscribedTo: 1,
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "fetched channel subscribers"));
});

const getUserSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
            },
        },
        {
            $unwind: "$subscribedChannel",
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "subscribedChannels Fetched Successfully"
            )
        );
});
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getUserSubscribedChannels,
};
