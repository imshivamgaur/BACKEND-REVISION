import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloundinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

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

  if (!user) {
    throw new ApiError("User not found");
  }

  // validate password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
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
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});

export { registerUser, loginUser };
