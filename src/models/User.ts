import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
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


export const User = models.User || model("User", UserSchema);
