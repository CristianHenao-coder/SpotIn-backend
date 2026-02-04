import { Schema, model, models, Document, Types } from "mongoose";

export interface ISchedule extends Document {
  classroomId: Types.ObjectId;
  userId?: Types.ObjectId;
  siteId: Types.ObjectId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  lateAfterMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
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

export const Schedule = model<ISchedule>("Schedule", ScheduleSchema);
