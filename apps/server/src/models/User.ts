import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser {
  clerkId: string;
  email?: string;
  name?: string;
  plan: "free" | "pro";
  stripeCustomerId?: string;
  contractsUsed: number;
  createdAt: Date;
}

export interface IUserDocument extends IUser, Document {}

export interface IUserModel extends Model<IUserDocument> {
  findOrCreate(clerkId: string, email?: string, name?: string): Promise<IUserDocument>;
}

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    contractsUsed: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Will also add updatedAt automatically
  }
);

UserSchema.statics.findOrCreate = async function (clerkId: string, email?: string, name?: string) {
  // Using findOneAndUpdate with upsert: true ensures an atomic operation
  // avoiding race conditions that can happen with a find() followed by a create()
  return this.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        ...(email && { email }),
        ...(name && { name }),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const User = (mongoose.models.User as IUserModel) || mongoose.model<IUserDocument, IUserModel>("User", UserSchema);
