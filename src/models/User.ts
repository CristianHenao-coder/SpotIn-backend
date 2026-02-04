import { Schema, model, models, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  classroomId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER", required: true },
    isActive: { type: Boolean, default: true },
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom" },
  },
  { timestamps: true, collection: "users" }
);


export const User = models.User || model<IUser>("User", UserSchema);
