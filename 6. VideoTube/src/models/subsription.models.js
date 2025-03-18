import mongoose, { Schema } from "mongoose";

/*
  id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date
  updatedAt Date
*/

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who IS SUBSCRIBING
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom you "subscriber" is SUBSCRIBING
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionSchema = mongoose.model(
  "Subscription",
  subscriptionSchema
);
