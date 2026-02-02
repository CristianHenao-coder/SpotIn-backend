import { connectDB } from "@/src/lib/db";
import { Attendance } from "@/src/models/Attendance";
import { User } from "@/src/models/User";
import { QrSession } from "@/src/models/QrSession";

// Helper to format time
const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export default async function DashboardPage() {
    await connectDB();

    // 1. Fetch Data
    const totalStudents = await User.countDocuments({ role: "USER", isActive: true });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const attendanceToday = await Attendance.find({ dateKey: today }).lean();

    const presentCount = attendanceToday.length;
    const lateCount = attendanceToday.filter((a: any) => a.result === "LATE").length;
    // Absent = Total - Present (assuming all active students should be present)
    const absentCount = Math.max(0, totalStudents - presentCount);

    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    // 2. Recent Activity
    const recentActivity = await Attendance.find()
        .sort({ markedAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean();

    // 3. Last QR Session
    const lastQrParams = await QrSession.findOne().sort({ createdAt: -1 }).lean();

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Dashboard</span>
            </nav>

            {/* Page Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-white text-3xl font-black tracking-tight">Dashboard Overview</h2>
                {/* Mock button for now, logic can be added later */}
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl shadow-primary/30 group">
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">qr_code_2</span>
                    <span>Generate Daily QR</span>
                </button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* 1. Today's Attendance Main Card */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6 h-full flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-white text-xl font-bold mb-1">Today's Attendance</h3>
                                <p className="text-[#b491ca] text-sm">Overall campus presence for {today}</p>
                            </div>
                            <div className="mt-8">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-4xl font-black text-white">{attendanceRate}%</span>
                                    <span className="text-[#b491ca] text-sm font-medium">{presentCount} / {totalStudents} Students</span>
                                </div>
                                <div className="w-full bg-[#1c1122] h-4 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${attendanceRate}%` }}></div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-[#b491ca] text-xs">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#3a2348]"></div>
                                    <span className="text-[#b491ca] text-xs">Remaining</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-48 flex items-center justify-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle className="text-[#1c1122]" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                                    <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={`${364.4 * (1 - attendanceRate / 100)}`} strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">{attendanceRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Last QR Session Generated */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold">Last QR Session</h3>
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                {lastQrParams ? "Active" : "No Session"}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-4 py-2">
                            <div className="bg-[#1c1122] p-4 rounded-xl">
                                <span className="material-symbols-outlined text-primary text-5xl">qr_code_2</span>
                            </div>
                            <div className="text-center">
                                {lastQrParams ? (
                                    <>
                                        <p className="text-white font-medium">Session #{String(lastQrParams._id).slice(-6)}</p>
                                        <p className="text-[#b491ca] text-xs">Date: {lastQrParams.dateKey}</p>
                                    </>
                                ) : (
                                    <p className="text-white font-medium">No sessions found</p>
                                )}
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-[#3a2348] hover:bg-[#4a2d5a] text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                            View Full Details
                        </button>
                    </div>
                </div>

                {/* 2. Three Small Cards */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Present */}
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                            </div>
                            <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded">On-Time</span>
                        </div>
                        <p className="text-[#b491ca] text-sm font-medium">Present Students</p>
                        <h4 className="text-white text-2xl font-black mt-1">{presentCount}</h4>
                        <div className="w-full bg-[#1c1122] h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${attendanceRate}%` }}></div>
                        </div>
                    </div>
                    {/* Late */}
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-yellow-500">schedule</span>
                            </div>
                            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded">Caution</span>
                        </div>
                        <p className="text-[#b491ca] text-sm font-medium">Late Arrivals</p>
                        <h4 className="text-white text-2xl font-black mt-1">{lateCount}</h4>
                        {/* Visual bar simplified */}
                        <div className="w-full bg-[#1c1122] h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-yellow-500 h-full" style={{ width: "10%" }}></div>
                        </div>
                    </div>
                    {/* Absent */}
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-red-500">cancel</span>
                            </div>
                            <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded">Critical</span>
                        </div>
                        <p className="text-[#b491ca] text-sm font-medium">Absent Total</p>
                        <h4 className="text-white text-2xl font-black mt-1">{absentCount}</h4>
                        <div className="w-full bg-[#1c1122] h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: "20%" }}></div>
                        </div>
                    </div>
                </div>

                {/* 4. Recent Activity Card */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-[#3a2348] flex justify-between items-center">
                            <h3 className="text-white font-bold">Recent Activity</h3>
                            <button className="text-primary text-xs font-bold hover:underline">View All</button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[400px]">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-[#3a2348]">
                                    {recentActivity.map((activity: any) => (
                                        <tr key={String(activity._id)} className="hover:bg-[#3a2348]/20 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                                                    {/* Placeholder avatar */}
                                                    <span className="text-xs text-white">{(activity.userId?.name || "U")[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{activity.userId?.name || "Unknown User"}</p>
                                                    <p className="text-[#b491ca] text-xs">{activity.userId?.email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-white text-sm">{formatTime(activity.markedAt)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${activity.result === 'ON_TIME' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                    <span className="text-[#b491ca] text-xs">{activity.result === 'ON_TIME' ? 'Present' : 'Late'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentActivity.length === 0 && (
                                        <tr><td className="p-4 text-[#b491ca]">No recent activity.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 5. Classrooms Analytics Card */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6 h-full">
                        <h3 className="text-white font-bold mb-6">Classrooms with Most Late Arrivals (Demo)</h3>
                        <div className="space-y-6">
                            {/* Bar Item 1 */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white">Room 302 - Physics Lab</span>
                                    <span className="text-primary">12 Students</span>
                                </div>
                                <div className="w-full bg-[#1c1122] h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
                                </div>
                            </div>
                            {/* Bar Item 2 */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white">Room 105 - Literature</span>
                                    <span className="text-primary">8 Students</span>
                                </div>
                                <div className="w-full bg-[#1c1122] h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary/80 h-full rounded-full" style={{ width: "60%" }}></div>
                                </div>
                            </div>
                            {/* ... other bars ... */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto p-8 text-center">
                <p className="text-[#b491ca] text-xs">© 2023 School Attendance System. Designed for performance and clarity.</p>
            </footer>
        </div>
    );
}
