import { Schema, model, models } from "mongoose";

const SiteSchema = new Schema(
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

export const Site = models.Site || model("Site", SiteSchema);
