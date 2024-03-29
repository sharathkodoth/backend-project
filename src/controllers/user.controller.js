import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;
    console.log("Username :", username);

    if (
        [username, fullName, email, password].some(
            (field) => field?.trim() == ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
});

export { registerUser };
