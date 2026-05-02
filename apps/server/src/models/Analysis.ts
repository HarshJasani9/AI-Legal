import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClause {
  title: string;
  text: string;
  plainEnglish: string;
  risk: "low" | "medium" | "high";
  reason: string;
  pageRef?: number;
}

export interface IAnalysis {
  contractId: mongoose.Types.ObjectId;
  summary: string;
  parties: string[];
  effectiveDate?: Date;
  terminationDate?: Date;
  overallRisk: number; // 0-100
  clauses: IClause[];
  createdAt: Date;
}

export interface IAnalysisDocument extends IAnalysis, Document {}

export interface IAnalysisModel extends Model<IAnalysisDocument> {}

const ClauseSchema = new Schema<IClause>(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    plainEnglish: { type: String, required: true },
    risk: { type: String, enum: ["low", "medium", "high"], required: true },
    reason: { type: String, required: true },
    pageRef: { type: Number },
  },
  { _id: false } // Prevents Mongoose from generating an _id for every single clause
);

const AnalysisSchema = new Schema<IAnalysisDocument, IAnalysisModel>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      unique: true, // Ensures strictly one analysis document per contract
    },
    summary: {
      type: String,
      required: true,
    },
    parties: {
      type: [String],
      default: [],
    },
    effectiveDate: {
      type: Date,
    },
    terminationDate: {
      type: Date,
    },
    overallRisk: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    clauses: {
      type: [ClauseSchema],
      default: [],
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

export const Analysis = (mongoose.models.Analysis as IAnalysisModel) || mongoose.model<IAnalysisDocument, IAnalysisModel>("Analysis", AnalysisSchema);
