import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const user = req.user._id;

    if (!name || !description) {
        throw new ApiError(400, "Name and Description is necessary");
    }

    const playlist = await Playlist.create({
        name,
        description,
        vidoes: [],
        owner: user,
    });

    if (!playlist) {
        throw new ApiError(500, "Unable to create playlist, please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const userPlaylists = await Playlist.find({
        owner: userId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, userPlaylists, "fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid ID");
    }
});

export { createPlaylist, getUserPlaylists, getPlaylistById };
