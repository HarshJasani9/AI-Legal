import mongoose, { Document, Model, Schema } from "mongoose";

export interface IContract {
  userId: string;
  name: string;
  s3Url: string;
  s3Key: string;
  fileSize: number;
  pageCount?: number;
  status: "pending" | "analyzing" | "done" | "failed";
  expiresAt?: Date;
  createdAt: Date;
}

export interface IContractDocument extends IContract, Document {}

export interface IContractModel extends Model<IContractDocument> {}

const ContractSchema = new Schema<IContractDocument, IContractModel>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Useful for querying contracts per user
    },
    name: {
      type: String,
      required: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "analyzing", "done", "failed"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Contract = (mongoose.models.Contract as IContractModel) || mongoose.model<IContractDocument, IContractModel>("Contract", ContractSchema);
