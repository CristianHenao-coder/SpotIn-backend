import { Schema, model, models } from "mongoose";

const ScheduleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },

    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Dom
    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true },   // "10:00"

    lateAfterMinutes: { type: Number, default: 10 }, // tolerancia
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "schedules" }
);

ScheduleSchema.index({ userId: 1, dayOfWeek: 1, isActive: 1 });

export const Schedule = models.Schedule || model("Schedule", ScheduleSchema);
