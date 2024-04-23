import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);

export default router;
