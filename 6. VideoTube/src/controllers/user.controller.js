import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloundinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";


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

export { registerUser };
