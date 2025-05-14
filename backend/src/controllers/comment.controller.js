import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/vedio.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
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
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
        isLiked: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));

  //
});
const T3Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "docs": [
  //             {
  //                 "_id": "681c851d86e5abc4ac23c38a",
  //                 "content": "superB !! Edit : updated comment",
  //                 "owner": {
  //                     "username": "three123",
  //                     "fullName": "three",
  //                     "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg"
  //                 },
  //                 "createdAt": "2025-05-08T10:19:09.360Z",
  //                 "likesCount": 0,
  //                 "isLiked": false
  //             },
  //             {
  //                 "_id": "681c84f086e5abc4ac23c386",
  //                 "content": "NICE NICE !!",
  //                 "owner": {
  //                     "username": "three123",
  //                     "fullName": "three",
  //                     "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg"
  //                 },
  //                 "createdAt": "2025-05-08T10:18:24.825Z",
  //                 "likesCount": 0,
  //                 "isLiked": false
  //             }
  //         ],
  //         "totalDocs": 2,
  //         "limit": 10,
  //         "page": 1,
  //         "totalPages": 1,
  //         "pagingCounter": 1,
  //         "hasPrevPage": false,
  //         "hasNextPage": false,
  //         "prevPage": null,
  //         "nextPage": null
  //     },
  //     "message": "Comments fetched successfully",
  //     "success": true
  // }
};

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));

  //
});
const T1Res = () => {
  //   {
  //     "statusCode": 201,
  //     "data": {
  //         "content": "superB !!",
  //         "video": "681aefb38250cecdb4ad5782",
  //         "owner": "680524450d57382df0f49f59",
  //         "_id": "681c851d86e5abc4ac23c38a",
  //         "createdAt": "2025-05-08T10:19:09.360Z",
  //         "updatedAt": "2025-05-08T10:19:09.360Z",
  //         "__v": 0
  //     },
  //     "message": "Comment added successfully",
  //     "success": true
  // }
};

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "content is required");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID !!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can edit their comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to edit comment please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment edited successfully"));
  //
  //
});
const T2Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681c851d86e5abc4ac23c38a",
  //         "content": "superB !! Edit : updated comment",
  //         "video": "681aefb38250cecdb4ad5782",
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-08T10:19:09.360Z",
  //         "updatedAt": "2025-05-08T10:22:10.195Z",
  //         "__v": 0
  //     },
  //     "message": "Comment edited successfully",
  //     "success": true
  // }
};

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID !!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can delete their comment");
  }

  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));

  //
  //
});
const T4Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "commentId": "681c882f668b07ffd5c14629"
  //     },
  //     "message": "Comment deleted successfully",
  //     "success": true
  // }
};

export { getVideoComments, addComment, updateComment, deleteComment };
