import { Router } from "express";
import {
    addComment,
    getVideoComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments).post(addComment);

export default router;
