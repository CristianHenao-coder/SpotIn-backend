import { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true }, // "CREATE_USER", "CONFIRM_ATTENDANCE", etc

    targetType: { type: String }, // "User" | "Schedule" | "Attendance" ...
    targetId: { type: Schema.Types.ObjectId },

    meta: { type: Schema.Types.Mixed }, // cualquier data extra (cambios, payload)
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, collection: "audit_logs" }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
