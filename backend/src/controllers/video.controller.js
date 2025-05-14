import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/vedio.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import { asyncHandler } from "../utlis/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteCloudinaryFile,
  deleteVideoOnCloudinary,
} from "../utlis/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
  console.log(
    `query : ${query}\n sortBy : ${sortBy}\n sortType : ${sortType}\n`
  );

  const user_Id = req.user?._id;

  try {
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);

    const skip = (pageNumber - 1) * pageLimit;

    console.log(
      `pageNumber : ${pageNumber}\n pageLimit : ${pageLimit}\n Skip : ${skip}\n`
    );

    // ************* creating pipeline *****************
    let pipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { owner: new mongoose.Types.ObjectId(user_Id) },
          ],
        },
      },
      {
        // USER
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                _id: 1, // Keep _id if needed
              },
            },
            // ******************************
            // {
            //   "_id": ObjectId("someVideoId"),
            //   "title": "My Awesome Video",
            //   "owner": ObjectId("someUserId"),
            //   "ownerDetails": [
            //     {
            //       "_id": ObjectId("someUserId"),
            //       "username": "user123",
            //       "fullName": "John Doe",
            //       "avatar": "...",
            //       "coverImage": "...",
            //       "email": "john.doe@example.com"
            //     }
            //   ],
            //   // ... other video fields
            // }
            // ******************************
            {
              $addFields: {
                ownerInfo: {
                  $first: "$ownerDetails",
                },
                // **********************************
                // {
                //   "_id": ObjectId("someVideoId"),
                //   "title": "My Awesome Video",
                //   "owner": ObjectId("someUserId"),
                //   "ownerDetails": {
                //     "_id": ObjectId("someUserId"),
                //     "username": "user123",
                //     "fullName": "John Doe",
                //     "avatar": "...",
                //     "coverImage": "...",
                //     "email": "john.doe@example.com"
                //   },
                //   // ... other video fields
                // }
                // **********************************
              },
            },
          ],
        },
      },
      // {
      //   $unwind: "$ownerDetails", // <--- Place the $unwind stage here
      // },
      {
        // COMMENTS
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "commentsOnVideo",
          pipeline: [
            {
              $project: {
                content: 1,
                _id: 0, // Exclude the _id of the like
              },
            },
            {
              $addFields: {
                commentsOnVideo: "$commentsOnVideo",
              },
            },
            //*********************************************
            // "commentsOnVideo": [
            //   {
            //     "_id": { "$oid": "64b124f8a9b0c1d2e3f40567" },
            //     "content": "Great explanation!",
            //     "video": { "$oid": "64b123a5e67f8901c2d3e456" },
            //     "commentedBy": { "$oid": "64c2d3e4f5a6b7c8d9e0f123" },
            //     "createdAt": { "$date": "2023-07-15T10:15:00.000Z" }
            //   },
            //   {
            //     "_id": { "$oid": "64b12599b0c1d2e3f4056789" },
            //     "content": "Could you cover promises next?",
            //     "video": { "$oid": "64b123a5e67f8901c2d3e456" },
            //     "commentedBy": { "$oid": "64d3e4f5a6b7c8d9e0f1234" },
            //     "createdAt": { "$date": "2023-07-15T10:30:00.000Z" }
            //   }
            //   // ... more comments
            // ],
            // ********************************************
          ],
        },
      },
      // LIKES
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likesOnVideo",
          pipeline: [
            {
              $project: {
                tweet: 1,
                likedBy: 1,
                comment: 1,
                _id: 0, // Exclude the _id of the like
              },
            },
            {
              $addFields: {
                likesOnVideo: "$likesOnVideo", // all the likes on each video
              },
            },
            // ************************************
            // "likesOnVideo": [
            //   {
            //     "_id": { "$oid": "64b126a7c1d2e3f4056789ab" },
            //     "video": { "$oid": "64b123a5e67f8901c2d3e456" },
            //     "likedBy": { "$oid": "64e4f5a6b7c8d9e0f1234567" },
            //     "createdAt": { "$date": "2023-07-15T10:20:00.000Z" }
            //   },
            //   {
            //     "_id": { "$oid": "64b12718d2e3f4056789abcd" },
            //     "video": { "$oid": "64b123a5e67f8901c2d3e456" },
            //     "likedBy": { "$oid": "64f5a6b7c8d9e0f123456789" },
            //     "createdAt": { "$date": "2023-07-15T10:45:00.000Z" }
            //   }
            //   // ... more likes
            // ],
            // ************************************
          ],
        },
      }, // Playlist
      {
        $lookup: {
          from: "playlists",
          localField: "_id",
          foreignField: "videos",
          as: "PlaylistsOnVideo",
          pipeline: [
            {
              $project: {
                title: 1,
                name: 1,
                description: 1,
                owner: 1,
                _id: 0, // Exclude the _id of the playlist entry
              },
            },
            {
              $addFields: {
                PlaylistsOnVideo: "$PlaylistsOnVideo", // all the playlists on each video
              },
            },
          ],
          // **********************************
          //         "PlaylistsOnVideo": [
          //   {
          //     "_id": { "$oid": "64b12829e3f4056789abcdef" },
          //     "title": "JavaScript Mastery",
          //     "description": "A collection of advanced JavaScript tutorials.",
          //     "owner": { "$oid": "64a9b8c7d2e3f405a6b7c890" },
          //     "createdAt": { "$date": "2023-07-10T09:00:00.000Z" }
          //   },
          //   {
          //     "_id": { "$oid": "64b1293abcdeff0123456789" },
          //     "title": "Web Development",
          //     "description": "A broad playlist covering various web development topics.",
          //     "owner": { "$oid": "64c2d3e4f5a6b7c8d9e0f123" },
          //     "createdAt": { "$date": "2023-07-12T14:30:00.000Z" }
          //   }
          //   // ... more playlists
          // ]
          // **********************************
        },
      }, //
      {
        $sort: {
          [sortBy]: sortType === "desc" ? -1 : 1,
          createdAt: -1, // Sort by createdAt in descending order as an option newest first
        }, //sort by ascending (1) or descending (-1)order
      },

      // Skip documents for pagination
      { $skip: skip },

      // Limit documents for pagination
      { $limit: pageLimit },
    ];

    console.log("pipeline of videos", pipeline);

    const video = await Video.aggregate(pipeline);
    console.log(`Video :: `, video);

    const videoAggregate = await Video.aggregatePaginate(pipeline);
    console.log("Video Aggregation Pipeline :: ", videoAggregate);

    // if (!(video || video.length === (0 || null))) {
    if (!video) {
      throw new ApiError(500, "Failed to getallvideos. Please try again later");
    }

    // Response

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { video, videoAggregate },
          "Video aggregation and paginated retrived Successfully !!!!"
        )
      );
    //
    //
  } catch (error) {
    throw new ApiError(
      500,
      error,
      "Some error occurred while getting your video"
    );
  }
});
const T11Query = () => {
  //   Examples with Query Parameters:
  // Get the first page with the default limit (10 videos):
  // http://your-api-domain.com/api/videos?page=1
  // Get the second page with a limit of 5 videos per page:
  // http://your-api-domain.com/api/videos?page=2&limit=5
  // Search for videos containing "tutorial":
  // http://your-api-domain.com/api/videos?query=tutorial
  // Search for videos containing "guide" on the third page with a limit of 8:
  // http://your-api-domain.com/api/videos?page=3&limit=8&query=guide
  // Sort videos by title in ascending order:
  // http://your-api-domain.com/api/videos?sortBy=title&sortType=asc
  // Sort videos by createdAt in descending order (newest first):
  // http://your-api-domain.com/api/videos?sortBy=createdAt&sortType=desc
  // Search for "learn" and sort by title descending on the second page:
  // http://your-api-domain.com/api/videos?page=2&limit=10&query=learn&sortBy=title&sortType=desc
};
const T12POSTMANRESPONSE = () => {
  // {
  //     "statusCode": 200,
  //     "data": {
  //         "video": [
  //             {
  //                 "_id": "681af14d8250cecdb4ad578c",
  //                 "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746596170/gw7yipooluksblfu6gyj.mp4",
  //                 "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746596172/vfgw4yh8ngihdvlidciy.png",
  //                 "title": "NCS MUSIC 1 Min",
  //                 "description": "NCS MUSIC TEST Video 2 User 3",
  //                 "duration": 59.698503,
  //                 "views": 0,
  //                 "isPublished": true,
  //                 "owner": "680524450d57382df0f49f59",
  //                 "comments": [],
  //                 "createdAt": "2025-05-07T05:36:13.545Z",
  //                 "updatedAt": "2025-05-07T05:36:13.545Z",
  //                 "__v": 0,
  //                 "ownerDetails": [
  //                     {
  //                         "_id": "680524450d57382df0f49f59",
  //                         "username": "three123",
  //                         "email": "three@gmail.com",
  //                         "fullName": "three",
  //                         "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg",
  //                         "coverImage": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167428/s49bmw0iz6sd3zlv8pt2.jpg",
  //                         "ownerInfo": null
  //                     }
  //                 ],
  //                 "commentsOnVideo": [],
  //                 "likesOnVideo": [],
  //                 "PlaylistsOnVideo": []
  //             },
  //             {
  //                 "_id": "681aefb38250cecdb4ad5782",
  //                 "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746595760/sj4i3oudok4lmrpsmusk.mp4",
  //                 "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746595762/zvbqm058zraadldpfffc.png",
  //                 "title": "NCS MUSIC",
  //                 "description": "NCS MUSIC TEST Video User 2",
  //                 "duration": 72.005267,
  //                 "views": 0,
  //                 "isPublished": true,
  //                 "owner": "680522b80d57382df0f49f55",
  //                 "comments": [],
  //                 "createdAt": "2025-05-07T05:29:23.638Z",
  //                 "updatedAt": "2025-05-07T05:29:23.638Z",
  //                 "__v": 0,
  //                 "ownerDetails": [
  //                     {
  //                         "_id": "680522b80d57382df0f49f55",
  //                         "username": "two123",
  //                         "email": "two@gmail.com",
  //                         "fullName": "Two",
  //                         "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167026/dflzhfmqiz8ywpvjnsuo.jpg",
  //                         "coverImage": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167032/owwcfzouzmchxnrvomlx.jpg",
  //                         "ownerInfo": null
  //                     }
  //                 ],
  //                 "commentsOnVideo": [],
  //                 "likesOnVideo": [],
  //                 "PlaylistsOnVideo": []
  //             }
  //         ],
  //         "videoAggregate": {
  //             "docs": [
  //                 {
  //                     "_id": "681af14d8250cecdb4ad578c",
  //                     "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746596170/gw7yipooluksblfu6gyj.mp4",
  //                     "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746596172/vfgw4yh8ngihdvlidciy.png",
  //                     "title": "NCS MUSIC 1 Min",
  //                     "description": "NCS MUSIC TEST Video 2 User 3",
  //                     "duration": 59.698503,
  //                     "views": 0,
  //                     "isPublished": true,
  //                     "owner": "680524450d57382df0f49f59",
  //                     "comments": [],
  //                     "createdAt": "2025-05-07T05:36:13.545Z",
  //                     "updatedAt": "2025-05-07T05:36:13.545Z",
  //                     "__v": 0,
  //                     "ownerDetails": [
  //                         {
  //                             "_id": "680524450d57382df0f49f59",
  //                             "username": "three123",
  //                             "email": "three@gmail.com",
  //                             "fullName": "three",
  //                             "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167422/ejk5nhtvnqdg4olwl3yr.jpg",
  //                             "coverImage": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167428/s49bmw0iz6sd3zlv8pt2.jpg",
  //                             "ownerInfo": null
  //                         }
  //                     ],
  //                     "commentsOnVideo": [],
  //                     "likesOnVideo": [],
  //                     "PlaylistsOnVideo": []
  //                 },
  //                 {
  //                     "_id": "681aefb38250cecdb4ad5782",
  //                     "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746595760/sj4i3oudok4lmrpsmusk.mp4",
  //                     "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746595762/zvbqm058zraadldpfffc.png",
  //                     "title": "NCS MUSIC",
  //                     "description": "NCS MUSIC TEST Video User 2",
  //                     "duration": 72.005267,
  //                     "views": 0,
  //                     "isPublished": true,
  //                     "owner": "680522b80d57382df0f49f55",
  //                     "comments": [],
  //                     "createdAt": "2025-05-07T05:29:23.638Z",
  //                     "updatedAt": "2025-05-07T05:29:23.638Z",
  //                     "__v": 0,
  //                     "ownerDetails": [
  //                         {
  //                             "_id": "680522b80d57382df0f49f55",
  //                             "username": "two123",
  //                             "email": "two@gmail.com",
  //                             "fullName": "Two",
  //                             "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167026/dflzhfmqiz8ywpvjnsuo.jpg",
  //                             "coverImage": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167032/owwcfzouzmchxnrvomlx.jpg",
  //                             "ownerInfo": null
  //                         }
  //                     ],
  //                     "commentsOnVideo": [],
  //                     "likesOnVideo": [],
  //                     "PlaylistsOnVideo": []
  //                 }
  //             ],
  //             "totalDocs": 2,
  //             "limit": 10,
  //             "page": 1,
  //             "totalPages": 1,
  //             "pagingCounter": 1,
  //             "hasPrevPage": false,
  //             "hasNextPage": false,
  //             "offset": 0,
  //             "prevPage": null,
  //             "nextPage": null
  //         }
  //     },
  //     "message": "Video aggregation and paginated retrived Successfully !!!!",
  //     "success": true
  // }
};
const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video

  // get title and description and ----> validate
  const { title, description } = req.body;

  console.log(`Title : ${title}\n Descriptions : ${description}`);

  if (!(title || description)) {
    throw new ApiError(400, "Required Fields :::: title, descriptons");
  }

  // get Vedio or thumbnail LOCAL PATH from req.fields | multer ---> validate
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  console.log(
    `VideoLOcalPath :: ${videoLocalPath}\n thumbnailLocalPath :: ${thumbnailLocalPath}`
  );

  if (!videoLocalPath && !thumbnailLocalPath) {
    throw new ApiError(400, "Vedio And Thumbnail both Are required");
  }

  // Upload on CLoudinary VEDIO And thumbnail && ------ Validate

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  console.log(
    `Cloudiary Vedio Response :: ${video}\n Cloudinary Thumbnail Response :: ${thumbnail} `
  );

  if (!video) {
    throw new ApiError(500, "Failed To UPload Vedio on Cloudinary!!!!");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Failed To UPload Thumbnail on Cloudinary!!!!");
  }

  // Create Vedio Object In mOngoDB ---> Validate
  const newVideo = await Video.create({
    title,
    description,
    duration: video.duration,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    isPublished: true,
    owner: req.user?._id,
  });

  if (!newVideo) {
    throw new ApiError(500, "Vedio Object In mOngoDB can't Be Created !!! ");
  }

  const createdVideo = await Video.findById(newVideo._id);
  console.log(createdVideo);

  if (!createdVideo) {
    throw new ApiError(500, "Video Object Not fetched OR can't Be Created !! ");
  }

  // return RES
  res
    .status(201)
    .json(
      new ApiResponse(200, createdVideo, "Video uploaded successfully !!!!!")
    );
  //
});
const T12Response = () => {
  //   Title : Test vedio 1
  //  Descriptions : description Test vedio 1
  // VideoLOcalPath :: public/temp/Kooha-2025-04-20-22-13-33.mp4
  //  thumbnailLocalPath :: public/temp/c8.jpg
  // file is uploaded on cloudinary http://res.cloudinary.com/dujd15qun/video/upload/v1746354153/vudhyrku0jbswhgsiefh.mp4
  // file is uploaded on cloudinary http://res.cloudinary.com/dujd15qun/image/upload/v1746354158/inbg9ybmycrnxizqg84z.jpg
  // Cloudiary Vedio Response :: [object Object]
  //  Cloudinary Thumbnail Response :: [object Object]
  // {
  //   _id: new ObjectId('68173fef35d6651b45fc7a48'),
  //   videoFile: 'http://res.cloudinary.com/dujd15qun/video/upload/v1746354153/vudhyrku0jbswhgsiefh.mp4',
  //   thumbnail: 'http://res.cloudinary.com/dujd15qun/image/upload/v1746354158/inbg9ybmycrnxizqg84z.jpg',
  //   title: 'Test vedio 1',
  //   description: 'description Test vedio 1',
  //   duration: 23.366667,
  //   views: 0,
  //   isPublished: true,
  //   owner: new ObjectId('680522b80d57382df0f49f55'),
  //   createdAt: 2025-05-04T10:22:39.680Z,
  //   updatedAt: 2025-05-04T10:22:39.680Z,
  //   __v: 0
  // }
  // POSTMAN
  // {
  //   "statusCode": 200,
  //   "data": {
  //       "_id": "68173fef35d6651b45fc7a48",
  //       "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746354153/vudhyrku0jbswhgsiefh.mp4",
  //       "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746354158/inbg9ybmycrnxizqg84z.jpg",
  //       "title": "Test vedio 1",
  //       "description": "description Test vedio 1",
  //       "duration": 23.366667,
  //       "views": 0,
  //       "isPublished": true,
  //       "owner": "680522b80d57382df0f49f55",
  //       "createdAt": "2025-05-04T10:22:39.680Z",
  //       "updatedAt": "2025-05-04T10:22:39.680Z",
  //       "__v": 0
  //   },
  //   "message": "Video uploaded successfully !!!!!",
  //   "success": true
};

const getVideoById1 = asyncHandler(async (req, res) => {
  //   const { videoId } = req.params;
  //   //TODO: get video by id
  //   console.log("Received videoId:", videoId);
  //   console.log("Type of videoId:", typeof videoId);
  //   // validate the VedioID And UserID
  //   if (!mongoose.Types.ObjectId.isValid(videoId)) {
  //     throw new ApiError(400, "Invalid VideoID");
  //   }
  //   if (!mongoose.Types.ObjectId.isValid(req.user?._id)) {
  //     throw new ApiError(400, "Invalid UserID");
  //   }
  //   // use Aggregataion
  //   const videoAggregation = await Video.aggregate([
  //     {
  //       $match: {
  //         _id: new mongoose.Types.ObjectId(videoId),
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "likes", // mongodb collection name change into plural form
  //         localField: "_id",
  //         foreignField: "video",
  //         as: "likes",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "users",
  //         localField: "owner",
  //         foreignField: "_id",
  //         as: "owner",
  //         pipeline: [
  //           {
  //             $lookup: {
  //               from: "subscriptions",
  //               localField: "_id",
  //               foreignField: "channel",
  //               as: "subscribers",
  //             },
  //           },
  //           {
  //             $addFields: {
  //               subscribersCount: {
  //                 $size: "$subscribers",
  //               },
  //               isSubscribed: {
  //                 $cond: {
  //                   if: {
  //                     $in: [req.user?._id, "$subscribers.subscriber"],
  //                   },
  //                   then: true,
  //                   else: false,
  //                 },
  //               },
  //             },
  //           },
  //           {
  //             $project: {
  //               username: 1,
  //               avatar: 1,
  //               subscribersCount: 1,
  //               isSubscribed: 1,
  //             },
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       $addFields: {
  //         likesCount: {
  //           $size: "$likes",
  //         },
  //         owner: {
  //           $first: "$owner",
  //         },
  //         isLiked: {
  //           $cond: {
  //             if: { $in: [req.user?._id, "$likes.likedBy"] },
  //             then: true,
  //             else: false,
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         videoFile: 1,
  //         title: 1,
  //         description: 1,
  //         views: 1,
  //         createdAt: 1,
  //         duration: 1,
  //         comments: 1,
  //         owner: 1,
  //         likesCount: 1,
  //         isLiked: 1,
  //       },
  //     },
  //   ]);
  //   if (!videoAggregation?.length) {
  //     throw new ApiError(404, "Video not found");
  //   }
  //   const video = videoAggregation[0];
  //   // increment views if video fetched successfully
  //   await Video.findByIdAndUpdate(videoId, {
  //     $inc: {
  //       views: 1,
  //     },
  //   });
  //   // add this video to user watch history
  //   await User.findByIdAndUpdate(req.user?._id, {
  //     $addToSet: {
  //       watchHistory: videoId,
  //     },
  //   });
  //   return res
  //     .status(200)
  //     .json(new ApiResponse(200, video, "video details fetched successfully"));
  //   //
});
const T13Response = () => {
  //   POSTMAN
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "6817611166089a63b6c43a68",
  //         "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746362636/dec6pss1rkexcjhw0vgm.mp4",
  //         "title": "Test vedio 1",
  //         "description": "description Test vedio 1",
  //         "duration": 23.366667,
  //         "views": 0,
  //         "owner": {
  //             "_id": "680522b80d57382df0f49f55",
  //             "username": "two123",
  //             "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167026/dflzhfmqiz8ywpvjnsuo.jpg",
  //             "subscribersCount": 0,
  //             "isSubscribed": false
  //         },
  //         "comments": [],
  //         "createdAt": "2025-05-04T12:44:01.751Z",
  //         "likesCount": 0,
  //         "isLiked": false
  //     },
  //     "message": "video details fetched successfully",
  //     "success": true
  // }
};

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  console.log("Received videoId:", videoId);
  console.log("Type of videoId:", typeof videoId);

  // Validate the VideoID And UserID
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  // req.user might be null if authentication is optional, but checking user ID validity makes sense if watch history/subscription status is needed
  // Consider if video details should be accessible without authentication, adjust this check accordingly
  if (req.user && !mongoose.Types.ObjectId.isValid(req.user?._id)) {
    throw new ApiError(400, "Invalid UserID");
  }
  const userId = req.user?._id; // Get user ID if available

  // use Aggregation
  const videoAggregation = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        // Add isPublished: true if you only want to fetch published videos by ID
        // isPublished: true
      },
    },
    {
      $lookup: {
        from: "likes", // Assuming your likes collection is 'likes'
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users", // Assuming your users collection is 'users'
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions", // Assuming your subscriptions collection is 'subscriptions'
              localField: "_id", // Owner's user ID
              foreignField: "channel", // The channel (owner) being subscribed to
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: userId
                    ? { $in: [userId, "$subscribers.subscriber"] }
                    : false, // Check subscription only if user is logged in
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1, // Added fullName as it's common
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    // --- NEW STAGES TO FETCH COMMENTS AND THEIR OWNERS ---
    {
      $lookup: {
        from: "comments", // Assuming your comments collection is 'comments'
        localField: "_id", // The video's _id
        foreignField: "videoId", // Field on the Comment model linking back to Video
        as: "comments", // Name the output array 'comments'
        pipeline: [
          // Pipeline to run on the joined comments
          {
            $lookup: {
              from: "users", // Assuming your users collection is 'users'
              localField: "owner", // Field on the Comment model linking to the User owner
              foreignField: "_id", // Field on the User model
              as: "owner", // Name the output owner field 'owner' within the comment object
              pipeline: [
                // Project user fields to avoid exposing too much data for comment owner
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName: 1, // Added fullName
                    // Add other necessary user fields for the comment owner
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" }, // Flatten the owner array from the lookup
            },
          },
          {
            $project: {
              // Select fields for each comment document
              _id: 1,
              text: 1,
              createdAt: 1,
              owner: 1, // Include the populated owner
              // Add any other comment fields you need (e.g., updatedAt, likes, etc.)
              // Do NOT include videoId or owner (as we just flattened it) here
            },
          },
          // Optional: Sort comments (e.g., by creation date)
          {
            $sort: {
              createdAt: -1, // Sort by most recent comments first
            },
          },
        ],
      },
    },
    // --- END OF NEW STAGES ---
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner", // Flatten the owner array from the video owner lookup
        },
        isLiked: {
          $cond: {
            if: userId ? { $in: [userId, "$likes.likedBy"] } : false, // Check like status only if user is logged in
            then: true,
            else: false,
          },
        },
        // The 'comments' field is already populated from the new lookup stage
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1, // Make sure thumbnail is projected if needed
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1, // Include the populated comments array
        owner: 1, // Include the populated video owner
        likesCount: 1,
        isLiked: 1,
        isPublished: 1, // Project if needed
      },
    },
  ]);

  if (!videoAggregation?.length) {
    throw new ApiError(404, "Video not found");
  }

  const video = videoAggregation[0];

  // --- Update views and watch history ONLY if user is logged in ---
  if (userId) {
    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
      $inc: {
        views: 1,
      },
    });

    // add this video to user watch history
    // Using findByIdAndUpdate with $addToSet is atomic and safe
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        watchHistory: videoId,
      },
    });
  }
  // --- End of conditional updates ---

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details fetched successfully"));
});
const T14Response = () => {
  // POSTMAN
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "_id": "6817611166089a63b6c43a68",
  //         "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746362636/dec6pss1rkexcjhw0vgm.mp4",
  //         "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746362640/p7xj99ftdxupma5oj3zq.jpg",
  //         "title": "Test vedio 1",
  //         "description": "description Test vedio 1",
  //         "duration": 23.366667,
  //         "views": 2,
  //         "isPublished": true,
  //         "owner": {
  //             "_id": "680522b80d57382df0f49f55",
  //             "username": "two123",
  //             "fullName": "Two",
  //             "avatar": "http://res.cloudinary.com/dujd15qun/image/upload/v1745167026/dflzhfmqiz8ywpvjnsuo.jpg",
  //             "subscribersCount": 0,
  //             "isSubscribed": false
  //         },
  //         "createdAt": "2025-05-04T12:44:01.751Z",
  //         "comments": [],
  //         "likesCount": 0,
  //         "isLiked": false
  //     },
  //     "message": "video details fetched successfully",
  //     "success": true
  // }
};

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: update video details like title, description, thumbnail

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }

  const { title, description } = req.body;
  console.log(`title : ${title}\n description : ${description}\n`);

  const thumbnailLocalPath = req.file?.path;
  console.log("thumbnailLocalPath : ", thumbnailLocalPath);

  if (!(title || description || thumbnail)) {
    throw new ApiError(
      400,
      "Required Field : title OR description OR thumbnail"
    );
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  console.log("thumbnail Uploaded on CLoudinary Response : ", thumbnail);

  if (!thumbnail.url) {
    throw new ApiError(
      400,
      "Thumbnail Error while Uploading on CLoudinary !!!"
    );
  }

  const oldVedioThumbnail = await video.thumbnail;
  console.log("oldVedioThumbnail URL :: ", oldVedioThumbnail);

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  if (!updateVideo) {
    throw new ApiError(500, "Failed to update video please try again");
  }

  await deleteCloudinaryFile(oldVedioThumbnail);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video Updated SuccessFully !!!"));

  //
});
const T15Response = () => {
  // TERMINAL :
  //   title : Update vedio 1
  //  description : Update description Test vedio 1
  // thumbnailLocalPath :  public/temp/c5.jpg
  // file is uploaded on cloudinary http://res.cloudinary.com/dujd15qun/image/upload/v1746373474/tbgvrl5go2vwhn71ksxu.jpg
  // thumbnail Uploaded on CLoudinary Response :  {
  //   asset_id: '727e20f5d0b5baaef605b3920604f7fa',
  //   public_id: 'tbgvrl5go2vwhn71ksxu',
  //   version: 1746373474,
  //   version_id: '82e3b341f1109492d344cddf7f6d9e98',
  //   signature: '79656f2d0c21ba8aee1bd818c033ce360d9932d3',
  //   width: 3762,
  //   height: 5643,
  //   format: 'jpg',
  //   resource_type: 'image',
  //   created_at: '2025-05-04T15:44:34Z',
  //   tags: [],
  //   bytes: 1783201,
  //   type: 'upload',
  //   etag: '8bf4d296f63ca76eed37126eb8f18613',
  //   placeholder: false,
  //   url: 'http://res.cloudinary.com/dujd15qun/image/upload/v1746373474/tbgvrl5go2vwhn71ksxu.jpg',
  //   secure_url: 'https://res.cloudinary.com/dujd15qun/image/upload/v1746373474/tbgvrl5go2vwhn71ksxu.jpg',
  //   asset_folder: '',
  //   display_name: 'tbgvrl5go2vwhn71ksxu',
  //   original_filename: 'c5',
  //   api_key: '799616883412371'
  // }
  // oldVedioThumbnail URL ::  http://res.cloudinary.com/dujd15qun/image/upload/v1746373383/f2pfyoznnfskwkgqjqr6.jpg
  // { result: 'ok' }
  // File with public ID "f2pfyoznnfskwkgqjqr6" deleted successfully.
  //POSTMAN
  // {
  //   "statusCode": 200,
  //   "data": {
  //       "_id": "6817611166089a63b6c43a68",
  //       "videoFile": "http://res.cloudinary.com/dujd15qun/video/upload/v1746362636/dec6pss1rkexcjhw0vgm.mp4",
  //       "thumbnail": "http://res.cloudinary.com/dujd15qun/image/upload/v1746373474/tbgvrl5go2vwhn71ksxu.jpg",
  //       "title": "Update vedio 1",
  //       "description": "Update description Test vedio 1",
  //       "duration": 23.366667,
  //       "views": 5,
  //       "isPublished": true,
  //       "owner": "680522b80d57382df0f49f55",
  //       "comments": [],
  //       "createdAt": "2025-05-04T12:44:01.751Z",
  //       "updatedAt": "2025-05-04T15:44:35.219Z",
  //       "__v": 0
  //   },
  //   "message": "Video Updated SuccessFully !!!",
  //   "success": true
  // }
};

//
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You Can't Delete This Video!! You Are Not the OWNER "
    );
  }

  await deleteVideoOnCloudinary(video.videoFile);

  await deleteCloudinaryFile(video.thumbnail);

  // Delete Video

  const deleteVideo = await Video.findByIdAndDelete(video?._id);

  console.log("Delted Video :: ", deleteVideo);

  if (!deleteVideo) {
    throw new ApiError(400, "Failed to delete the video please try again!!! ");
  }

  // Delete Video Comment
  const deleteVideoComment = await Comment.deleteMany({ video: videoId });

  console.log("deleteVideoComment :: ", deleteVideoComment);

  if (!deleteVideoComment) {
    throw new ApiError(400, "Failed to deleteVideoComment");
  }

  // Delte Video LIKE
  const deleteVideoLIKE = await Like.deleteMany({ video: videoId });

  console.log("Delete Video LIke :: ", deleteVideoLIKE);

  if (!deleteVideoLIKE) {
    throw new ApiError(400, "Failed to deleteVideoLIKE");
  }

  // response

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted SuccessFully !!! "));

  //
});
const T16Response = () => {
  // Terminal
  //   { result: 'ok' }
  // File with public ID "nu11vjhgwx8vvhxrttsv" deleted successfully.
  // { result: 'ok' }
  // File with public ID "vxamve2ceo2tp2cld9g1" deleted successfully.
  // Delted Video ::  {
  //   _id: new ObjectId('6819d68322bb64889ca62af5'),
  //   videoFile: 'http://res.cloudinary.com/dujd15qun/video/upload/v1746523774/nu11vjhgwx8vvhxrttsv.mp4',
  //   thumbnail: 'http://res.cloudinary.com/dujd15qun/image/upload/v1746523778/vxamve2ceo2tp2cld9g1.png',
  //   title: 'Test vedio 3',
  //   description: 'description Test vedio 3',
  //   duration: 72.005267,
  //   views: 0,
  //   isPublished: true,
  //   owner: new ObjectId('680524450d57382df0f49f59'),
  //   comments: [],
  //   createdAt: 2025-05-06T09:29:39.507Z,
  //   updatedAt: 2025-05-06T09:29:39.507Z,
  //   __v: 0
  // }
  // deleteVideoComment ::  { acknowledged: true, deletedCount: 0 }
  // Delete Video LIke ::  { acknowledged: true, deletedCount: 0 }
};

//
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toogle publish status as you are not the owner"
    );
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toogle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggledVideoPublish.isPublished },
        "Video publish toggled successfully"
      )
    );
});
const T17Response = () => {
  // POSTMAN
  //   {
  //     "statusCode": 200,
  //     "data": {
  //         "isPublished": true
  //     },
  //     "message": "Video publish toggled successfully",
  //     "success": true
  // }
};

const streamVideo = asyncHandler(async (req, res) => {});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  streamVideo,
};
