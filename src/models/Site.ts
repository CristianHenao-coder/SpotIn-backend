import { Schema, model, models, Document } from "mongoose";

export interface ISite extends Document {
  name: string;
  address?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  allowedRadiusMeters: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISite>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    allowedRadiusMeters: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "sites" }
);

SiteSchema.index({ location: "2dsphere" });

export const Site = models.Site || model<ISite>("Site", SiteSchema);
