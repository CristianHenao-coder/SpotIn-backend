import { Schema, model, models, Document, Types } from "mongoose";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  siteId: Types.ObjectId;
  scheduleId?: Types.ObjectId;
  qrSessionId: Types.ObjectId;
  dateKey: string;
  markedAt: Date;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  distanceMeters: number;
  result: "ON_TIME" | "LATE";
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  reviewedByAdminId?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true, index: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: "Schedule" },
    qrSessionId: { type: Schema.Types.ObjectId, ref: "QrSession", required: true },

    dateKey: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    markedAt: { type: Date, required: true },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    distanceMeters: { type: Number, required: true },

    result: { type: String, enum: ["ON_TIME", "LATE"], required: true },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "REJECTED"], default: "PENDING", index: true },

    reviewedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true, collection: "attendances" }
);

AttendanceSchema.index({ location: "2dsphere" });
AttendanceSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
AttendanceSchema.index({ status: 1, dateKey: 1 });
AttendanceSchema.index({ siteId: 1, dateKey: 1 });

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
