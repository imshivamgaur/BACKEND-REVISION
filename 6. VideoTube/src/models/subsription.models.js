import mongoose, { Schema } from "mongoose";

/*
  id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date
  updatedAt Date
*/

const subsriptionSchema = new Schema(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const SubsriptionSchema = mongoose.model(
  "Subscription",
  subsriptionSchema
);
