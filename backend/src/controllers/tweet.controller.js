import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  console.log(`content :: ${content}\n`);

  if (!content) {
    throw new ApiError(400, "No Content Written by USer !!!");
  }

  try {
    const createdContent = await Tweet.create({
      content,
      owner: req.user?._id,
    });

    console.log(`Created Content :: ${createdContent}\n`);

    if (!createdContent) {
      throw new ApiError(500, "Tweet Could not be Created !!!!");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, createdContent, "Tweet Created SuccessFully !!!")
      );

    //
  } catch (error) {
    throw new ApiError(500, error, "Error When Creating Tweet !!");
  }
});
const T11Response = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "content": "User 3 My First Tweet Or Post ",
  //         "owner": "680524450d57382df0f49f59",
  //         "_id": "681b248a32264e67585b26cd",
  //         "createdAt": "2025-05-07T09:14:50.514Z",
  //         "updatedAt": "2025-05-07T09:14:50.514Z",
  //         "__v": 0
  //     },
  //     "message": "Tweet Created SuccessFully !!!",
  //     "success": true
  // }
};

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user?._id;

  console.log(`UserId :: ${userId}`);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid UserId !!!");
  }

  //  ******* Aggregation *******
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // USERS
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      // Likes
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      // ADD Fields
      $addFields: {
        likesCount: {
          $size: "$likeDetails",
        },
        ownerDetails: {
          $first: "$ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeDetails.likedBy"] },
            then: true,
            else: false,
          },
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
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);
  //

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets are fetched SuccessFully !!!!"));

  //
});
const T12Response = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "_id": "681b248a32264e67585b26cd",
  //             "content": "User 3 My First Tweet Or Post ",
  //             "createdAt": "2025-05-07T09:14:50.514Z",
  //             "ownerDetails": {
  //                 "_id": "680524450d57382df0f49f59",
  //                 "username": "three123",
  //                 "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg"
  //             },
  //             "likesCount": 0,
  //             "isLiked": false
  //         }
  //     ],
  //     "message": "Tweets are fetched SuccessFully !!!!",
  //     "success": true
  // }
};

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;

  console.log(`Content :: ${content}\n tweetID :: ${tweetId}\n`);

  if (!content) {
    throw new ApiError(400, "Content is required !!!");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  console.log(`Tweet :::: ${tweet}\n`);

  if (!tweet) {
    throw new ApiError(500, "Tweet Not Found !!!");
  }

  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Only Owner Can Edit Thier tweet !!!");
  }

  const editTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  console.log("Updated Edit Tweet :: ", editTweet);

  if (!editTweet) {
    throw new ApiError(500, "Failed to edit tweet please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, editTweet, "Tweet Updated SuccessFully !!! "));

  //
});
const T145Response = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681b27278e5046641345b8ec",
  //         "content": "Updated Tweet User 3  ::: YO BOI !!",
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-07T09:25:59.604Z",
  //         "updatedAt": "2025-05-07T09:38:58.942Z",
  //         "__v": 0
  //     },
  //     "message": "Tweet Updated SuccessFully !!! ",
  //     "success": true
  // }
};

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweetId !!!");
  }

  const tweet = await Tweet.findById(tweetId);
  const deleteTweet = tweet.content;

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Only Owner can delete thier Tweets !!!");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deleteTweet }, "Tweet Deleted Successfully !!!")
    );

  //
});
const T78Response = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "deleteTweet": "User 3 TEST TWEET POST"
  //     },
  //     "message": "Tweet Deleted Successfully !!!",
  //     "success": true
  // }
};

export { createTweet, getUserTweets, updateTweet, deleteTweet };
