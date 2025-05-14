import mongoose from "mongoose";
import { Video } from "../models/vedio.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const getChannelStats1111111111111111111111111 = asyncHandler(
  async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id;

    const totalSubscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null, // Group all documents
          subscribersCount: {
            // Count the number of documents (each order)
            $sum: 1, // add 1+ for every Document
          },
        },
      },
    ]);

    const video = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $project: {
          totalLikes: {
            $size: "$likes",
          },

          totalViews: "$views",
          totalVideos: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: {
            $sum: "$totalLikes",
          },
          totalViews: {
            $sum: "$totalViews",
          },
          totalVideos: {
            $sum: 1,
          },
        },
      },
    ]);

    const channelStats = {
      totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
      totalLikes: video[0]?.totalLikes || 0,
      totalViews: video[0]?.totalViews || 0,
      totalVideos: video[0]?.totalVideos || 0,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, channelStats, "channel stats fetched successfully")
      );

    //
    //
  }
);
const T3 = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "totalSubscribers": 0,
  //         "totalLikes": 1,
  //         "totalViews": 3,
  //         "totalVideos": 1
  //     },
  //     "message": "channel stats fetched successfully",
  //     "success": true
  // }
};

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const userId = req.user?._id;

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null, // Group all documents
        subscribersCount: {
          $sum: 1,
        },
      },
    },
  ]);

  const videosStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$totalLikes" },
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
      },
    },
  ]);

  const channelStats = {
    totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
    totalLikes: videosStats[0]?.totalLikes || 0,
    totalViews: videosStats[0]?.totalViews || 0,
    totalVideos: videosStats[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "channel stats fetched successfully")
    );
});
const T1 = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "totalSubscribers": 0,
  //         "totalLikes": 1,
  //         "totalViews": 3,
  //         "totalVideos": 1
  //     },
  //     "message": "channel stats fetched successfully",
  //     "success": true
  // }
};
const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const userId = req.user?._id;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        createdAt: {
          $dateToParts: { date: "$createdAt" },
        },
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: {
          year: 1,
          month: 1,
          day: 1,
        },
        isPublished: 1,
        likesCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "channel stats fetched successfully"));
  //
  //
});
const T2Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "_id": "681aefb38250cecdb4ad5782",
  //             "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746595760/sj4i3oudok4lmrpsmusk.mp4",
  //             "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746595762/zvbqm058zraadldpfffc.png",
  //             "title": "NCS MUSIC",
  //             "description": "NCS MUSIC TEST Video User 2",
  //             "isPublished": true,
  //             "createdAt": {
  //                 "year": 2025,
  //                 "month": 5,
  //                 "day": 7
  //             },
  //             "likesCount": 1
  //         }
  //     ],
  //     "message": "channel stats fetched successfully",
  //     "success": true
  // }
};

export { getChannelStats, getChannelVideos };
