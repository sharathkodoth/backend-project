import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { createPlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist);

export default router;
