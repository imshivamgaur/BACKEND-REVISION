import mongoose, { Schema } from "mongoose";

/*
  owner ObjectId users
  content string
*/

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const TweetSchema = mongoose.model("Tweet", tweetSchema);
