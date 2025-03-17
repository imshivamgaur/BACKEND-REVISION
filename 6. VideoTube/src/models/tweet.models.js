import mongoose, { Schema } from "mongoose";

/*
  owner ObjectId users
  content string
*/

const tweetSchema = new Schema(
  {
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

export const TweetSchema = mongoose.model("Tweet", tweetSchema);
