"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1c1122] border-r border-[#3a2348] flex flex-col justify-between p-4 z-50">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-3xl">school</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold leading-none">Attendance Admin</h1>
                        <p className="text-[#b491ca] text-xs font-normal mt-1">School Management</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    <Link href="/admin-web">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web") && pathname === "/admin-web" ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>

                            <p className="text-sm font-medium">Dashboard</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/classrooms">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/classrooms") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>

                            <p className="text-sm font-medium">Classrooms</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/students">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/students") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>

                            <p className="text-sm font-medium">Students</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/schedules">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/schedules") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>

                            <p className="text-sm font-medium">Schedules</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/qr-sessions">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/qr-sessions") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>
                            <p className="text-sm font-medium">QR Sessions</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/attendance">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/attendance") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>
                            <p className="text-sm font-medium">Attendance</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/reports">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive("/admin-web/reports") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>
                            <p className="text-sm font-medium">Reports</p>
                        </div>
                    </Link>
                    <Link href="/admin-web/settings">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer mt-4 ${isActive("/admin-web/settings") ? "bg-primary text-white" : "text-[#b491ca] hover:bg-[#3a2348] hover:text-white"}`}>
                            <p className="text-sm font-medium">Settings</p>
                        </div>
                    </Link>
                </nav>
            </div>
            <div className="p-2 border-t border-[#3a2348]">
                <button
                    onClick={() => {
                        document.cookie = 'admin_token=; Max-Age=0; path=/;';
                        window.location.href = '/admin-web/login';
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-colors cursor-pointer text-[#b491ca] hover:bg-[#3a2348] hover:text-white"
                >
                    <p className="text-sm font-medium">Logout</p>
                </button>

                <div className="flex items-center gap-3 pt-2">
                    <div
                        className="w-10 h-10 rounded-full bg-cover bg-center border border-primary/40"
                        data-alt="Admin avatar profile image"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD3gtnLo3luOt1FHrCQe_lVagNr8IbBEBZBjDb3DDVqVXTI2gkX4v30c7eie_m5JguAlcJmYRZJQmeOy8YpjL_b4rijBQah0PWzbbHQW-lg4oI0_rVODnG_JmiZF4iux1BaT0U0C7goILhmp7lQ5bWmSMzJp3B6_2Vybh4hMGh2QA8miPlf-aIgBS34THdwA4ZyG8LAZzo5OkJAc9bPp2NN8mQ4N9aEzrLz3RUyvb5MQaPNAYHCacn-iWpcbbp5PL8BqbHG7ir-5ao')" }}
                    ></div>
                    <div className="overflow-hidden">
                        <p className="text-[#b491ca] text-xs truncate">Super Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
