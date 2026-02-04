import { Schema, model, models, Document, Types } from "mongoose";

export interface IQrSession extends Document {
  siteId: Types.ObjectId;
  dateKey: string;
  expiresAt?: Date;
  createdByAdminId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QrSessionSchema = new Schema<IQrSession>(
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

export const QrSession = models.QrSession || model<IQrSession>("QrSession", QrSessionSchema);
