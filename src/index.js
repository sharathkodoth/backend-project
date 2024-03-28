import dotenv from "dotenv"; // should be imported at the top
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: "/.env",
});

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.log("Error:", err);
            throw err;
        });

        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at port :${process.env.PORT}`);
        });
    })

    .catch((err) => {
        console.log("Database connection error:", err);
    });

//another method below
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express();

(async () => {
  // IIFE function to connect db
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //process.env from dotenv package
    app.on("error", (err) => {
      console.log("Error:", err);
      throw err;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
})();
*/
