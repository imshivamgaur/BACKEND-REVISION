import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloundinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";

// generating the token for user
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(500, "Couldn't find the user");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // from req.body
  const { fullName, username, email, password } = req.body;
  // console.log(fullName, email, username, password);

  // validation
  if (
    [fullName, username, email, password].some(
      (field) => !field || String(field)?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    if (req.files?.avatar?.[0].path) fs.unlinkSync(req.files.avatar[0].path);
    if (req.files?.coverImage?.[0]?.path)
      fs.unlinkSync(req.files.coverImage[0].path);
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    if (req.files?.coverImage?.[0]?.path)
      fs.unlinkSync(req.files.coverImage[0].path);
    throw new ApiError(400, "Avatar file is missing");
  }

  // const avatar = await uploadOnCloundinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloundinary(coverLocalPath);
  // }

  let avatar;
  try {
    avatar = await uploadOnCloundinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);
  } catch (error) {
    console.log("Error uploading avatar", error);

    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage = "";
  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloundinary(coverLocalPath);
      console.log("Uploaded coverImage", coverImage);
    } catch (error) {
      console.log("Error uploading coverImage", error);

      throw new ApiError(500, "Failed to upload coverImage");
    }
  }

  try {
    let user = await User.create({
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      email,
      password,
      fullName,
    });

    //why extra query? because here is no chance of error infact now our "createUser" has encrypted password
    const createUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createUser, "User registed successfully"));
  } catch (error) {
    console.log("User Creation failed");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong while registering a user and images were deleted"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from body
  const { username, email, password } = req.body;

  // validation
  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }
  // search user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log(user);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  // validate password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  if (!accessToken || !refreshToken) {
    throw new ApiError("Access tokens are not found");
  }

  console.log(
    "\nAccessToken: ",
    accessToken + " \n\nRefreshToken ",
    refreshToken
  );

  /*
  so now we have two strategies first adding the access &
  refresh token to the user and save it or Again refetch 
  the user and resend the response.
  */

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(401, "Failed to retrieve user data after login");
  }
  // Its makes the cookie non-modifiable from the client side.
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  console.warn("\n" + user.username + " loggedIn succesfully!🚀");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) //for web apps
    .cookie("refreshToken", refreshToken, options) //for web apps
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if ((!oldPassword, !newPassword)) {
    throw new ApiError(400, "All fields are required");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from the old password"
    );
  }

  const user = await User.findById(req.user._id);
  // console.log("\nuser: ", user);

  let isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUserDetails = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName, email } = req.body;

  if (!username || !fullName || !email) {
    throw new ApiError(400, "username, fullName and email required");
  }

  // const user = await User.findById(req.user?._id).select(
  //   "-password -refreshToken"
  // );

  // user.username = username;
  // user.fullName = fullName;
  // user.email = email;

  // await user.save();

  // We also can use above one but it is more readable.
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // grabbing the refresh token from cookie
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError("Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
};
