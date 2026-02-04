import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { requireAuth, requireRole } from "@/src/lib/auth";
import { QrSession } from "@/src/models/QrSession";
import { AuditLog } from "@/src/models/AuditLog";
import { Site } from "@/src/models/Site";
import * as QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

function signQrToken(sessionId: string, expiresAt: Date) {
    try {
        const expiresInSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        if (expiresInSeconds <= 0) return null;

        return jwt.sign(
            { sessionId, type: "QR_ACCESS" },
            JWT_SECRET,
            { expiresIn: expiresInSeconds }
        );
    } catch (err) {
        console.error("Token signing error:", err);
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();

        const sessions = await QrSession.find()
            .populate("siteId", "name")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json(sessions);
    } catch (error: any) {
        console.error("GET QR Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const adminUser = requireAuth(req);
        requireRole("ADMIN", adminUser.role);
        await connectDB();

        let body = {};
        try { body = await req.json(); } catch { }
        const { siteId } = body as any;

        // 1. Resolve Site
        let targetSiteId = siteId;
        if (!targetSiteId) {
            const firstSite = await Site.findOne({ isActive: true });
            if (!firstSite) return NextResponse.json({ message: "No active sites found" }, { status: 400 });
            targetSiteId = firstSite._id;
        } else {
            const site = await Site.findById(targetSiteId);
            if (!site) return NextResponse.json({ message: "Site not found" }, { status: 404 });
        }

        // 2. new Expiration (5 minutes from now)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins

        // 3. Create Session Record
        // Use full ISO string + Random to ensure absolute uniqueness if high traffic
        const uniqueKey = now.toISOString() + "-" + Math.random().toString(36).substring(7);

        const newSession = await QrSession.create({
            siteId: targetSiteId,
            dateKey: uniqueKey,
            expiresAt: expiresAt,
            createdByAdminId: adminUser.sub
        }) as any;

        // 4. Generate Token and QR
        const token = signQrToken(newSession._id, expiresAt);

        if (!token) {
            return NextResponse.json({ message: "Failed to sign token" }, { status: 500 });
        }

        // QRCode.toDataURL might throw
        const qrContent = JSON.stringify({
            t: token,
            s: targetSiteId,
            e: expiresAt.getTime()
        });

        const qrDataUrl = await QRCode.toDataURL(qrContent);

        await AuditLog.create({
            action: "GENERATE_QR",
            actorId: adminUser.sub,
            meta: { qrSessionId: newSession._id, expiresAt }
        });

        const siteDoc = await Site.findById(targetSiteId).select("name");

        return NextResponse.json({
            qrDataUrl,
            expiresAt,
            sessionId: newSession._id,
            siteName: siteDoc?.name || "Site"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Generate QR API Error:", error);
        // Better error response
        return NextResponse.json({
            message: error.message || "Internal Server Error",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
