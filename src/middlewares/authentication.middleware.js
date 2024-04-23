import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // extract token from headers or cookies
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(
                401,
                "Unauthorized request: Access token is missing"
            );
        }

        // verify token using secure secret
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // retrieve user, avoid unnecessary fields
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(
                401,
                "Unauthorized request: Invalid access token"
            );
        }

        // attach user to request object
        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Error in JWT verification: "
        );
    }
});

export { verifyJWT };
