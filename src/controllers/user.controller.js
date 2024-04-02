import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../services/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Destructure fields from request body
    const { username, fullName, email, password } = req.body;

    // Check if any required field is empty
    if (
        [username, fullName, email, password].some(
            (field) => field?.trim() == ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if a user with the same username or email already exists
    const userExists = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userExists) {
        throw new ApiError(409, "username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log(req.files);

    // Check if avatar is uploaded
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required");
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath);
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

    // Check if avatar upload was successful
    if (!avatar) {
        throw new ApiError(400, "avatar is required");
    }

    // Create a new user document in the database
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    });

    // Retrieve the created user document from the database, excluding sensitive fields
    // password and refreshToken are excluded for security reasons
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Ensure that the created user exists in the database
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                createdUser,
                "User has been registered successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // validate that username or email is provided
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    // find user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "user not found, register user");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "incorrect password");
    }

    // generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id
    );

    // fetch logged-in user data excluding password and refresh token
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // set options for http-only and secure cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    // set access token and refresh token cookies in the response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const sharath = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );
    console.log(sharath);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // retrieve the refresh token from cookies or request body
    const incomingClientRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingClientRefreshToken) {
        throw new ApiError(
            401,
            "Unauthorized request: Refresh token is missing"
        );
    }

    try {
        // verify the incoming refresh token with secret
        const decodedRefreshToken = jwt.verify(
            incomingClientRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // find the user associated with the refresh token
        const foundUser = await User.findById(decodedRefreshToken?._id);

        if (!foundUser) {
            throw new ApiError(401, "Invalid refresh token: User not found");
        }

        // check if the incoming refresh token matches the one stored in the user document
        if (incomingClientRefreshToken !== foundUser.refreshToken) {
            throw new ApiError(
                401,
                "Refresh token is expired or does not match"
            );
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        // generate new access and refresh tokens for the user
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(foundUser._id);

        // set cookies with the new tokens and send response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // retrieving user from auth middleware
    const user = await User.findById(req.user?._id);

    // method from user model
    const verifiedOldPassword = await user.isPasswordCorrect(oldPassword);

    if (!verifiedOldPassword) {
        throw new ApiError(400, "Incorrect old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
};
