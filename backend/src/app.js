import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    // solving cros orgin problems, set origin
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // limit the upComing json data from the frontend
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // urlencoded , filling the space by %20 in url -: example
app.use(express.static("public")); // Storing static files/data like pdf, images etc in public folder

app.use(cookieParser()); // Access user browser cookies , Apply CRUD operations

//
//
// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.route.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import LikeRouter from "./routes/like.routes.js";
import CommentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlistRouter", playlistRouter);
app.use("/api/v1/LikeRouter", LikeRouter);
app.use("/api/v1/CommentRouter", CommentRouter);
app.use("/api/v1/dashboardRouter", dashboardRouter);

// http://localhost:8000/api/v1/users/register

export { app };
