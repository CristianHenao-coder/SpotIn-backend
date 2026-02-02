import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/auth";
import { QrSession } from "@/src/models/QrSession";
import { Site } from "@/src/models/Site";
import { Attendance } from "@/src/models/Attendance";
import { Schedule } from "@/src/models/Schedule";
import { AuditLog } from "@/src/models/AuditLog";
import { AppSetting } from "@/src/models/AppSetting";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Haversine Distance Helper
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Time Helper to parse HH:MM to minutes
function getMinutesFromMidnight(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

export async function POST(req: Request) {
    try {
        const user = requireAuth(req); // Any authenticated user (Student/Admin)
        await connectDB();

        const { qrToken, lat, lng, deviceId } = await req.json();

        if (!qrToken || !lat || !lng) {
            return NextResponse.json({ ok: false, message: "Missing required data (token, location)" }, { status: 400 });
        }

        // 1. Validate Token
        let payload: any;
        try {
            payload = jwt.verify(qrToken, JWT_SECRET); // Checks signature and expiration
        } catch (e) {
            return NextResponse.json({ ok: false, message: "Invalid or Expired QR" }, { status: 401 });
        }

        const { sessionId } = payload;

        // 2. Validate Session Record
        const session = await QrSession.findById(sessionId);
        if (!session) {
            return NextResponse.json({ ok: false, message: "QR Session not found" }, { status: 404 });
        }

        // Double check expiration vs Record (though token handles it, good for safety if token is long-lived)
        if (new Date() > new Date(session.expiresAt)) {
            return NextResponse.json({ ok: false, message: "QR Session Expired" }, { status: 400 });
        }

        // 3. Prevent Duplicates (Re-use)
        // Check if attendance already exists for this User + Session
        const existing = await Attendance.findOne({ userId: user.sub, qrSessionId: sessionId });
        if (existing) {
            return NextResponse.json({
                ok: false,
                message: "Already scanned this QR",
                status: existing.result,
                arrivalTime: existing.markedAt
            }, { status: 400 });
        }

        // 4. Validate Location
        const site = await Site.findById(session.siteId);
        if (!site) return NextResponse.json({ ok: false, message: "Site not found" }, { status: 400 });

        const distance = getDistanceInMeters(lat, lng, site.location.coordinates[1], site.location.coordinates[0]);

        // Get allowed radius (Settings or Site)
        const settings = await AppSetting.findOne();
        const globalRadius = settings?.defaultAllowedRadiusMeters || 50;
        const allowedRadius = site.allowedRadiusMeters || globalRadius;

        if (distance > allowedRadius) {
            return NextResponse.json({
                ok: false,
                message: `Out of range. You are ${Math.round(distance)}m away (Max ${allowedRadius}m).`,
                distance
            }, { status: 403 });
        }

        // 5. Validate Schedule & Status
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0-6
        const nowMinutes = today.getHours() * 60 + today.getMinutes();

        const schedule = await Schedule.findOne({
            userId: user.sub,
            siteId: site._id,
            dayOfWeek: dayOfWeek,
            isActive: true
        });

        if (!schedule) {
            return NextResponse.json({ ok: false, message: "No schedule found for this site today." }, { status: 403 });
        }

        const startMinutes = getMinutesFromMidnight(schedule.startTime);
        const endMinutes = getMinutesFromMidnight(schedule.endTime);

        // Check strict window? Or just arrival time?
        // Usually allow scan slightly before start?
        // Let's assume window is STRICT for "Valid Attendance". 
        // Or if too early?

        let result = "ON_TIME";
        const tolerance = schedule.lateAfterMinutes || 10;

        if (nowMinutes > endMinutes) {
            return NextResponse.json({ ok: false, message: "Class has ended." }, { status: 403 });
        }

        if (nowMinutes > startMinutes + tolerance) {
            result = "LATE";
        }

        // 6. Create Attendance
        const newAttendance = await Attendance.create({
            userId: user.sub,
            siteId: site._id,
            scheduleId: schedule._id,
            qrSessionId: sessionId,
            dateKey: today.toISOString().slice(0, 10),
            markedAt: today,
            location: { type: "Point", coordinates: [lng, lat] },
            distanceMeters: Math.round(distance),
            result: result,
            status: "CONFIRMED" // Verified by System
        });

        await AuditLog.create({
            action: "SCAN_QR_ATTENDANCE",
            actorId: user.sub,
            targetType: "Attendance",
            targetId: newAttendance._id,
            meta: { result, siteId: site._id }
        });

        return NextResponse.json({
            ok: true,
            message: "Attendance Recorded",
            status: result,
            siteName: site.name,
            arrivalTime: today.toLocaleTimeString()
        }, { status: 201 });

    } catch (error: any) {
        console.error("Scan Error:", error);
        return NextResponse.json({ ok: false, message: error.message || "Scan Failed" }, { status: 500 });
    }
}
