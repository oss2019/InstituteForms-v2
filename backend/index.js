import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"

import userRoute from "./route/user.route.js"
import eventRoute from "./route/event.route.js"


const app = express()

app.use(cors());

dotenv.config();
app.use(express.json());

const PORT= process.env.PORT || 4000;
const URI = process.env.MongoDBURI;
 
mongoose.connect(URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.log("error:", error);
});

 app.use("/user", userRoute);
 app.use("/event", eventRoute);




app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})