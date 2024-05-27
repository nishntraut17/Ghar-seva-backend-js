import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", false);

const client = mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Db Connected");
    }).catch((error) => {
        console.log(error);
        return error;
    });