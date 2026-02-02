import { Schema, model, models } from "mongoose";

const ScheduleSchema = new Schema(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // Optional fallback if needed, but primary is classroom
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },

    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // Array of days [1, 3, 5]
    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true },   // "10:00"

    lateAfterMinutes: { type: Number, default: 10 }, // tolerancia
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "schedules" }
);

ScheduleSchema.index({ classroomId: 1, isActive: 1 });

// Force recompilation of model to update schema during hot-reload
if (models.Schedule) {
  delete models.Schedule;
}

export const Schedule = model("Schedule", ScheduleSchema);
