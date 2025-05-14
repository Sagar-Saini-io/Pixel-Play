import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/vedio.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  console.log(`name : ${name}\n descripiton :: ${description}\n`);

  if (!(name || description)) {
    throw new ApiError(400, "Required Field :: Name And Description !!");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Playlist  created SuccessFully !!! ")
    );

  //
});
const T1Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "name": "First TEST Playlist User 3",
  //         "description": "its my 1st playlist boi",
  //         "videos": [],
  //         "owner": "680524450d57382df0f49f59",
  //         "_id": "681c51450eedc140ce19a60c",
  //         "createdAt": "2025-05-08T06:37:57.996Z",
  //         "updatedAt": "2025-05-08T06:37:57.996Z",
  //         "__v": 0
  //     },
  //     "message": "Playlist  created SuccessFully !!! ",
  //     "success": true
  // }
};

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "User playlists fetched SuccessFully !!!")
    );

  //
  //
});
const T3Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "_id": "681c51450eedc140ce19a60c",
  //             "name": "First TEST Playlist User 3",
  //             "description": "its my 1st playlist boi",
  //             "updatedAt": "2025-05-08T06:37:57.996Z",
  //             "totalVideos": 0,
  //             "totalViews": 0
  //         },
  //         {
  //             "_id": "681c53899572da0dc6c99938",
  //             "name": "Update 2nd Playlist User 3",
  //             "description": "Update 2nd playlist boi for testing",
  //             "updatedAt": "2025-05-08T06:52:06.065Z",
  //             "totalVideos": 0,
  //             "totalViews": 0
  //         }
  //     ],
  //     "message": "User playlists fetched SuccessFully !!!",
  //     "success": true
  // }
};

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  console.log(`Playlist ID :: ${playlistId}\n`);

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
        ],
      },
    },
    // {
    //   $match: {
    //     isPublished: true,
    //   },
    // },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, playlistVideos, "playlist fetched SuccessFully !!!") // try playlistVideos[0]
  );

  //
  //
});
const T6Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": [
  //         {
  //             "_id": "681c53899572da0dc6c99938",
  //             "name": "Update 2nd Playlist User 3",
  //             "description": "Update 2nd playlist boi for testing",
  //             "videos": [
  //                 {
  //                     "_id": "681aefb38250cecdb4ad5782",
  //                     "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746595760/sj4i3oudok4lmrpsmusk.mp4",
  //                     "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746595762/zvbqm058zraadldpfffc.png",
  //                     "title": "NCS MUSIC",
  //                     "description": "NCS MUSIC TEST Video User 2",
  //                     "duration": 72.005267,
  //                     "views": 0,
  //                     "createdAt": "2025-05-07T05:29:23.638Z"
  //                 },
  //                 {
  //                     "_id": "681af14d8250cecdb4ad578c",
  //                     "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746596170/gw7yipooluksblfu6gyj.mp4",
  //                     "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746596172/vfgw4yh8ngihdvlidciy.png",
  //                     "title": "NCS MUSIC 1 Min",
  //                     "description": "NCS MUSIC TEST Video 2 User 3",
  //                     "duration": 59.698503,
  //                     "views": 0,
  //                     "createdAt": "2025-05-07T05:36:13.545Z"
  //                 }
  //             ],
  //             "owner": {
  //                 "username": "three123",
  //                 "fullName": "three",
  //                 "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg"
  //             },
  //             "createdAt": "2025-05-08T06:47:37.863Z",
  //             "updatedAt": "2025-05-08T07:16:51.128Z",
  //             "totalVideos": 2,
  //             "totalViews": 0
  //         }
  //     ],
  //     "message": "playlist fetched SuccessFully !!!",
  //     "success": true
  // }
};

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  console.log(`playlistID :: ${playlistId}\n  videoID :: ${videoId}`);

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid Playlist Id And Video ID ");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not Found !!");
  }

  if (!video) {
    throw new ApiError(404, "Video not Found !!");
  }

  if (
    // (playlist.owner?.toString() && video.owner.toString()) !==
    playlist.owner?.toString() !== req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can add video to thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video to playlist please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );

  //
  //
});
const T4Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681c53899572da0dc6c99938",
  //         "name": "Update 2nd Playlist User 3",
  //         "description": "Update 2nd playlist boi for testing",
  //         "videos": [
  //             "681aefb38250cecdb4ad5782",
  //             "681af14d8250cecdb4ad578c"
  //         ],
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-08T06:47:37.863Z",
  //         "updatedAt": "2025-05-08T07:06:02.322Z",
  //         "__v": 0
  //     },
  //     "message": "Added video to playlist successfully",
  //     "success": true
  // }
};

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  console.log(`playlistID :: ${playlistId}\n  videoID :: ${videoId}`);

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid Playlist Id And Video ID ");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not Found !!");
  }

  if (!video) {
    throw new ApiError(404, "Video not Found !!");
  }

  if (
    // (playlist.owner?.toString() && video.owner.toString()) !==
    playlist.owner?.toString() !== req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can add video to thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video to playlist please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Removed video from playlist successfully"
      )
    );

  //
});
const T5Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681c53899572da0dc6c99938",
  //         "name": "Update 2nd Playlist User 3",
  //         "description": "Update 2nd playlist boi for testing",
  //         "videos": [
  //             "681aefb38250cecdb4ad5782"
  //         ],
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-08T06:47:37.863Z",
  //         "updatedAt": "2025-05-08T07:09:00.358Z",
  //         "__v": 0
  //     },
  //     "message": "Removed video from playlist successfully",
  //     "success": true
  // }
};

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  console.log(`Playlist Id :: ${playlistId}`);

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID !!!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(500, "Playlist Not Found !!!");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can delete the playlist !!!");
  }

  await Playlist.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Delted SuccessFully !!! "));

  //
});
const T7Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681c51450eedc140ce19a60c",
  //         "name": "First TEST Playlist User 3",
  //         "description": "its my 1st playlist boi",
  //         "videos": [],
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-08T06:37:57.996Z",
  //         "updatedAt": "2025-05-08T06:37:57.996Z",
  //         "__v": 0
  //     },
  //     "message": "Playlist Delted SuccessFully !!! ",
  //     "success": true
  // }
};

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  console.log(`name : ${name}\n descripiton :: ${description}\n`);

  if (!(name || description)) {
    throw new ApiError(400, "Required Field :: Name And Description !!");
  }

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID !!!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(500, "Playlist Not Found !!!");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "ONLY OWNER CAN EDIT THE PLAYLIST !!!");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "Playlist updated SuccessFully !!! ")
    );

  //
});
const T2Res = () => {
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "681c53899572da0dc6c99938",
  //         "name": "Update 2nd Playlist User 3",
  //         "description": "Update 2nd playlist boi for testing",
  //         "videos": [],
  //         "owner": "680524450d57382df0f49f59",
  //         "createdAt": "2025-05-08T06:47:37.863Z",
  //         "updatedAt": "2025-05-08T06:52:06.065Z",
  //         "__v": 0
  //     },
  //     "message": "Playlist updated SuccessFully !!! ",
  //     "success": true
  // }
};

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
