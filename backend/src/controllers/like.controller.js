import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));

  //
});
const T1Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "isLiked": true
  //     },
  //     "message": "Success",
  //     "success": true
  // }
};

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiResponse(400, "Invalid Comment ID");
  }

  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));

  //
  //
});
const T4Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "isLiked": true
  //     },
  //     "message": "Success",
  //     "success": true
  // }
};

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiResponse(400, "Invalid tweet ID");
  }

  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
  //
});
const T2Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "isLiked": true
  //     },
  //     "message": "Success",
  //     "success": true
  // }
};

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideoAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    { $unwind: "$likedVideo" },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideoAggregate,
        "Liked Video Fetched SuccessFully !!!!"
      )
    );

  //
});
const T3Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "likedVideo": {
  //                 "_id": "681aefb38250cecdb4ad5782",
  //                 "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746595760/sj4i3oudok4lmrpsmusk.mp4",
  //                 "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746595762/zvbqm058zraadldpfffc.png",
  //                 "title": "NCS MUSIC",
  //                 "description": "NCS MUSIC TEST Video User 2",
  //                 "duration": 72.005267,
  //                 "views": 0,
  //                 "isPublished": true,
  //                 "owner": "680522b80d57382df0f49f55",
  //                 "createdAt": "2025-05-07T05:29:23.638Z",
  //                 "ownerDetails": {
  //                     "username": "two123",
  //                     "fullName": "Two",
  //                     "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167026/dflzhfmqiz8ywpvjnsuo.jpg"
  //                 }
  //             }
  //         }
  //     ],
  //     "message": "Liked Video Fetched SuccessFully !!!!",
  //     "success": true
  // }
};

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
