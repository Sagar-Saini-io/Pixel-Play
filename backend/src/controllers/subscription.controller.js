import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  console.log(`ChannelId :: ${channelId}\n`);

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid ChannelID Token !!!");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Unsubscribed SuccessFully !!! "
        )
      );
  }

  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "SUBSCRIBED SuccessFully !!!")
    );

  //
});
const T61Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "subscribed": true
  //     },
  //     "message": "SUBSCRIBED SuccessFully !!!",
  //     "success": true
  // }
};

// controller to return subscriber list of a channel --> 100k
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  console.log(`ChannelId :: ${channelId}\n`);

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid ChannelID Token !!!");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        // Find Subscribers Find Command Channel -> A, A, A
        channel: new mongoose.Types.ObjectId(channelId), // jis channel k subscribers find karney h , uska channel name [id] find karo, common object in a collections like : A , A ,A -> 3subs
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedTo",
            },
          },
          {
            $addFields: {
              subscribedTo: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscribedTo.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },

              subscribersCount: {
                $size: "$subscribedTo",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribedTo: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched SuccessFully !!!!")
    );

  //
});
const T12Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "subscriber": {
  //                 "_id": "680524450d57382df0f49f59",
  //                 "username": "three123",
  //                 "fullName": "three",
  //                 "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg",
  //                 "subscribedTo": false,
  //                 "subscribersCount": 1
  //             }
  //         }
  //     ],
  //     "message": "subscribers fetched SuccessFully !!!!",
  //     "success": true
  // }
};

// controller to return channel list to which user has subscribed --> A, B , C
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  console.log(`ChannelId :: ${subscriberId}\n`);

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId Token !!!");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    { $unwind: "$subscribedChannel" },
    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          latestVideo: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            owner: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
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
        subscribedChannels,
        "subscribed channels fetched SuccessFully !!!!"
      )
    );

  //
  //
});
const T13res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "subscriber": {
  //                 "_id": "680524450d57382df0f49f59",
  //                 "username": "three123",
  //                 "fullName": "three",
  //                 "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg",
  //                 "subscribedTo": false,
  //                 "subscribersCount": 1
  //             }
  //         }
  //     ],
  //     "message": "subscribers fetched SuccessFully !!!!",
  //     "success": true
  // }
};

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
