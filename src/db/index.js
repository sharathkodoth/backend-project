import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(
            `MongoDB connnected !!! DB HOST: ${connectionInstance.connection.host} ${DB_NAME}`
        );
    } catch (err) {
        console.log("Database connection failed:", err);
        process.exit(1);
    }
};

export default connectDB;
