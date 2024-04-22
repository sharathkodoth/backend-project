import { Router } from "express";
import {
    getUserChannelSubscribers,
    getUserSubscribedChannels,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/c/:channelId")
    .post(toggleSubscription)
    .get(getUserChannelSubscribers);

router.route("/u/:subscriberId").get(getUserSubscribedChannels);

export default router;
