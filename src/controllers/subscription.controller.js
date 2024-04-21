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
                as: "subscribers",
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
        },{$unwind: "$subscribers"},

        {
            $project: {
                _id: 0,
                subscribers: {
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

export { toggleSubscription, getUserChannelSubscribers };
