import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  badge?: string;
  description: string;
  features: string[];
  price: number;
  imageUrl: string;
  stock: number;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK" | "UPCOMING";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    badge: { type: String },
    description: { type: String, required: true },
    features: { type: [String], default: [] },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    stock: { type: Number, default: 0 },
    stockStatus: {
      type: String,
      enum: ["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK", "UPCOMING"],
      default: "UPCOMING",
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
