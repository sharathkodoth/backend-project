import { Router } from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleCommunityPostLike,
    toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/cp/:communityPostId").post(toggleCommunityPostLike);
router.route("/liked-videos").get(getLikedVideos);

export default router;
