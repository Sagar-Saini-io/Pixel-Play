import { asyncHandler } from "../utlis/asyncHandler.js";
import { ApiError } from "../utlis/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteCloudinaryFile,
} from "../utlis/cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  //   More_message: "chai aur code !!!!",
  //   More_message1: "Error are so bad !!!!",
  //   More_message2: "what a mesh !!!!",
  // });
  // *************************************************
  // get user details from frontend
  // validate the data : like -non-empty
  // check if user already exists : by username , email
  // check the images , avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in DB
  // remove password and refress token filed from response
  // check for user creatied
  // return res
  // **************************************************

  // get user details from frontend
  const { fullName, username, email, password } = req.body;

  // validate the data : like -non-empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required !!!");
  }
  console.log(
    `Email : ${email}, \nfullName : ${fullName},\n username : ${username},\n password : ${password}`
  );

  // check if user already exists : by username , email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existedUSer :::::", existedUser);
  if (existedUser) {
    throw new ApiError(409, "User with email or username exits");
  }

  // check the images , avatar
  console.log("req.files !!!!! :::::::: ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(
    `avatarlocalpath :: ${avatarLocalPath}, \n coverImageLocalPath :: ${coverImageLocalPath}`
  );

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatarlocalpath file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar to Cloudinary");
  }

  console.log("cloudinary avatar :::", avatar);
  console.log("Cloudinary coverImages :::", coverImage);

  // create user object - create entry in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
    email,
    password,
    username: username.toLowerCase(),
    // username,
  });

  // remove password and refress token filed from response
  // check for user creatied
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully!!!"));
  //
});
//

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
    //
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong While generating the Access or Refresh Token !!!"
    );
  }
};
//

const loginUser = asyncHandler(async (req, res) => {
  // *************************************************
  // TODOS :
  // Get the Data from the frontend
  // Check the email or username exits
  // find the user
  // check the password is correct
  // token For sign in [Access token or Refresh token]
  // send cookies
  // *************************************************

  // Get the Data from the frontend
  const { email, username, password } = req.body;

  // if (!username && !email){

  if (!(username || email)) {
    throw new ApiError(400, "Email or Username id required !!!");
  }

  // Check the email or username exits

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exits!!!");
  }

  // check the password is correct
  const isPasswordValid = user.isPasswordCorrect(password); // Give true or false
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  // token For sign in [Access token or Refresh token]
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  // send cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully!!!"
      )
    );

  //
});
//

const logoutUser = asyncHandler(async (req, res) => {
  //
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: undefined,
      // },
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  //
  const options = {
    httpOnly: true,
    secure: true,
  };

  // .cookie("accessToken", accessToken, options)
  // .cookie("refreshToken", refreshToken, options)

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out !!!"));
  //
});
//

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!inComingRefreshToken) {
    throw new ApiError(401, "unauthorized request !!!");
  }

  try {
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token !!!");
    }

    if (inComingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token  is expired  or used !!!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access/Refresh Token Refreshed successFully !!!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
//

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password !!!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed SuccessFully !!!"));
});
//

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "current User fetched Successfully !!!")
    );
});
//

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    // need one
    // ***************************
    // if (!fullName || !email) {
    //   // need both
    throw new ApiError(400, "All Fields are Required !!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true } // return updated value of the user
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Account details updated Successfully !!!")
    );

  //
});
//

// Todo :- delete old images from cloudinary !!! ---> Done
// multer, authmiddel
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Missing !!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(
      400,
      "Error while uploading a avatar on cloudinary [updating.....] !!! "
    );
  }

  const user1 = await User.findById(req.user?._id);
  const oldAvatarUrl = user1.avatar;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true } // return updated value of the user
  ).select("-password");

  await deleteCloudinaryFile(oldAvatarUrl);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Avatar images updated  successfully !!!")
    );
  //
});
//

// multer, authmiddel
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImgaeLocalPath = req.file?.path;

  if (!coverImgaeLocalPath) {
    throw new ApiError(400, "coverImage file is Missing !!!");
  }

  const coverImage = await uploadOnCloudinary(coverImgaeLocalPath);

  if (!coverImage.url) {
    throw new ApiError(
      400,
      "Error while uploading a coverImgae on cloudinary [updating.....] !!! "
    );
  }

  const user1 = await User.findById(req.user?._id);
  const oldCoverImageUrl = user1.coverImage;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true } // return updated value of the user
  ).select("-password");

  await deleteCloudinaryFile(oldCoverImageUrl);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "coverImage images updated  successfully !!!")
    );
  //
});
//

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; // get data from URL

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing !!!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel  does not exits !!!");
  }

  console.log("aggregation channel :::: \n", channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel Fetched SuccessFully !!!!")
    );
});
//

const getWatchedHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch  History fetched  SuccessFully !!! "
      )
    );
});

//
//
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchedHistory,
};

// registerUser (
//   Email : ,
// fullName : ,
//  username : ,
//  password :
// existedUSer ::::: null
// req.files !!!!! ::::::::  [Object: null prototype]
// {
//   avatar: [
//     {
//       fieldname: 'avatar',
//       originalname: 'cyberpunk-sci-fi-city-4k-wallpaper-uhdpaper.com-337@1@m.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'cyberpunk-sci-fi-city-4k-wallpaper-uhdpaper.com-337@1@m.jpg',
//       path: 'public/temp/cyberpunk-sci-fi-city-4k-wallpaper-uhdpaper.com-337@1@m.jpg',
//       size: 2369615
//     }
//   ],
//   coverImage: [
//     {
//       fieldname: 'coverImage',
//       originalname: 'dragon-blood-moon-7680x4320-11087.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'dragon-blood-moon-7680x4320-11087.jpg',
//       path: 'public/temp/dragon-blood-moon-7680x4320-11087.jpg',
//       size: 4072628
//     }
//   ]
// }
// avatarlocalpath :: public/temp/cyberpunk-sci-fi-city-4k-wallpaper-uhdpaper.com-337@1@m.jpg,
//  coverImageLocalPath :: public/temp/dragon-blood-moon-7680x4320-11087.jpg
// file is uploaded on cloudinary http://res.cloudinary.com/dujd15qun/image/upload/v1746095678/cqqumxqsfrgjkt5vkfag.jpg
// file is uploaded on cloudinary http://res.cloudinary.com/dujd15qun/image/upload/v1746095683/bvfdkombcg5kbqaf6xho.jpg
// cloudinary avatar ::: {
//   asset_id: '6a79ef652219d',
//   public_id: 'sfrgjkt5vkfag',
//   version: 6095678,
//   version_id: '69c2eb57d8b',
//   signature: '1e1ebae5ba051e27fc7',
//   width: 3840,
//   height: 2160,
//   format: 'jpg',
//   resource_type: 'image',
//   created_at: '2025-05-01T10:34:38Z',
//   tags: [],
//   bytes: 2369615,
//   type: 'upload',
//   etag: '449ebbb63e',
//   placeholder: false,
//   url: 'http://res.cloudinary.com/dujd15qun/image/upload/v1746095678/cqqumxqsfrgjkt5vkfag.jpg',
//   secure_url: 'https://res.cloudinary.com/dujd15qun/image/upload/v1746095678/cqqumxqsfrgjkt5vkfag.jpg',
//   asset_folder: '',
//   display_name: 'cqqumxqsfrgjkt5vkfag',
//   original_filename: 'cyberpunk-sci-fi-city-4k-wallpaper-uhdpaper.com-337@1@m',
//   api_key: '12371'
// }
// Cloudinary coverImages ::: {
//   asset_id: 'b146a33cb',
//   public_id: 'bqaf6xho',
//   version: 095683,
//   version_id: '5f4286076417409541345',
//   signature: '32b61cc6c1a22b896f2be778489d72',
//   width: 7680,
//   height: 4320,
//   format: 'jpg',
//   resource_type: 'image',
//   created_at: '2025-05-01T10:34:43Z',
//   tags: [],
//   bytes: 4072628,
//   type: 'upload',
//   etag: '86268775d0a124aaf24',
//   placeholder: false,
//   url: 'http://res.cloudinary.com/dujd15qun/image/upload/v1746095683/bvfdkombcg5kbqaf6xho.jpg',
//   secure_url: 'https://res.cloudinary.com/dujd15qun/image/upload/v1746095683/bvfdkombcg5kbqaf6xho.jpg',
//   asset_folder: '',
//   display_name: 'bvfdkombcg5kbqaf6xho',
//   original_filename: 'dragon-blood-moon-7680x4320-11087',
//   api_key: '412371'
// }

// )
