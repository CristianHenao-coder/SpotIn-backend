import mongoose, { Schema } from "mongoose";

const ClassroomSchema = new Schema({
    name: { type: String, required: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    scheduleIds: [{ type: Schema.Types.ObjectId, ref: "Schedule", default: [] }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: "classrooms" });

export const Classroom = mongoose.models.Classroom || mongoose.model("Classroom", ClassroomSchema);
