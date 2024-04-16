import { Router } from "express";
import { toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/:videoId").post(toggleVideoLike)

export default router;
