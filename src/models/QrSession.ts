import { Schema, model, models } from "mongoose";

const QrSessionSchema = new Schema(
  {
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true, index: true },
    dateKey: { type: String, required: true }, // "YYYY-MM-DD"
    expiresAt: { type: Date },                 // opcional (si rotas por tiempo)
    createdByAdminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "qr_sessions" }
);

QrSessionSchema.index({ siteId: 1, dateKey: 1 }, { unique: true });

// Si usas expiración automática, descomenta:
// QrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const QrSession = models.QrSession || model("QrSession", QrSessionSchema);
