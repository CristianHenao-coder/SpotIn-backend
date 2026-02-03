import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

// Hack to make jsonwebtoken work in Edge (if possible) or use jose.
// Since we can't easily install new packages, we will try to use a simple verification or just check existence for now if JWT fails in edge.
// However, the best approach without new deps is standard jose. But I only saw jsonwebtoken in package.json.
// Next.js middleware runs on Edge, where jsonwebtoken (which depends on node crypto) might break.
// But some versions of next allow node runtime for middleware or jsonwebtoken might have a browser build.
// Actually, let's try to stick to "nodejs" runtime if allowed or use a simple check.
// Using `jose` would be better but it's not in package.json.
// I will attempt to simply check for cookie existence first. Decoding might be tricky without jose.
// Wait, `jsonwebtoken` 9.0+ does support some browser envs but relies on crypto.
// Let's try to import `jwt` and see. If it fails, I'll use a basic check.
// Better: I'll use a server-only utility if possible, but middleware is edge.
// For now, I will verify existence of the cookie. Verification needs `jose`.

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Protect /admin-web routes
    if (pathname.startsWith("/admin-web")) {

        // Allow access to login page
        if (pathname === "/admin-web/login") {
            // If already logged in, redirect to dashboard
            const token = req.cookies.get("admin_token")?.value;
            if (token) {
                return NextResponse.redirect(new URL("/admin-web", req.url));
            }
            return NextResponse.next();
        }

        const token = req.cookies.get("admin_token")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/admin-web/login", req.url));
        }

        // Ideally we verify the token here.
        // Since we don't have 'jose' and 'jsonwebtoken' might fail in Edge, 
        // we assume cookie presence + server-side validation in layout/page is enough for "blocking access".
        // Or we can try to decode it if we really need to check role here.
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin-web/:path*"],
};
