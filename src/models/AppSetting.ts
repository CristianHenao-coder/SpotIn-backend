import { Schema, model, models } from "mongoose";

const AppSettingSchema = new Schema(
    {
        lateDefaultMinutes: { type: Number, default: 10 },
        qrRequired: { type: Boolean, default: true },
        defaultAllowedRadiusMeters: { type: Number, default: 50 },
    },
    { timestamps: true, collection: "app_settings" }
);

export const AppSetting = models.AppSetting || model("AppSetting", AppSettingSchema);
