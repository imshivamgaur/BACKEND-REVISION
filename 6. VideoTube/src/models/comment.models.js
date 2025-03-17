import mongoose, { Schema } from "mongoose";

/*
  id string pk
  video ObjectId videos
  owner ObjectId users
  content string
  createdAt Date
  updatedAt Date
*/

const commentSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const CommentSchema = mongoose.model("Comment", commentSchema);
