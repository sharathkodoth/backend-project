import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "14kb" })); // middleware to parse incoming JSON requests with a size limit of 14kb
app.use(express.urlencoded({ extended: true, limit: "14kb" })); // middleware parse incoming request bodies that are encoded in URL-encoded format
app.use(express.static("public")); // middleware serves static files like js files, images, css etc...
app.use(cookieParser()); // middleware parses incoming cookies from client requests

import userRouter from "./routes/user.routes.js";
import videosRouter from "./routes/video.routes.js";
import commentsRouter from "./routes/comment.routes.js";
import likesRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videosRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/likes", likesRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);

export { app };
