import { Router } from "express";
import {
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishVideo
    );

router.route("/:videoId").get(getVideoById).patch(upload.single("thumbnail")),
    updateVideo;

export default router;
