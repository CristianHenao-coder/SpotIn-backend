"use client";

import { useState, useEffect } from "react";

interface AttendanceRecord {
    _id: string;
    userId: { _id: string; name: string; email: string };
    siteId: { name: string };
    scheduleId?: { startTime: string; endTime: string };
    markedAt: string;
    result: "ON_TIME" | "LATE";
    status: string;
}

interface Classroom {
    _id: string;
    name: string;
}

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [classroomId, setClassroomId] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        // Load Classrooms
        fetch("/api/admin-web/classrooms?isActive=true")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setClassrooms(data);
                else console.error("Classrooms API returned non-array:", data);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [date, classroomId, status]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (date) params.append("date", date);
            if (classroomId) params.append("classroomId", classroomId);
            if (status) params.append("status", status);

            const res = await fetch(`/api/admin-web/attendance?${params.toString()}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            if (Array.isArray(data)) {
                setAttendance(data);
            } else {
                setAttendance([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "-";
        const dateObj = new Date(isoString);
        if (isNaN(dateObj.getTime())) return "Invalid Date";
        return dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 mb-2">
                        <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                        <span className="text-[#b491ca] text-sm">/</span>
                        <span className="text-white text-sm font-medium">Attendance</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-white">Attendance Log</h1>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs text-[#b491ca] mb-1 block">Date</label>
                    <input
                        type="date"
                        className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs text-[#b491ca] mb-1 block">Classroom</label>
                    <select
                        className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary min-w-[150px]"
                        value={classroomId}
                        onChange={(e) => setClassroomId(e.target.value)}
                    >
                        <option value="">All Classrooms</option>
                        {Array.isArray(classrooms) && classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-[#b491ca] mb-1 block">Status</label>
                    <select
                        className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
                <button onClick={fetchAttendance} className="bg-[#1c1122] hover:bg-[#3a2348] text-primary p-2 rounded-lg transition-colors mb-[2px]">
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#291934] border border-[#3a2348] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-[#b491ca]">Loading logs...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#3a2348] text-white text-sm font-bold uppercase">
                                <tr>
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Site</th>
                                    <th className="p-4">Arrival Time</th>
                                    <th className="p-4">Schedule</th>
                                    <th className="p-4">Result</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a2348]">
                                {Array.isArray(attendance) && attendance.map(a => (
                                    <tr key={a._id} className="hover:bg-[#3a2348]/20 transition-colors">
                                        <td className="p-4">
                                            <p className="text-white font-medium">{a.userId?.name || "Unknown"}</p>
                                            <p className="text-[#b491ca] text-xs">{a.userId?.email}</p>
                                        </td>
                                        <td className="p-4 text-[#b491ca]">{a.siteId?.name}</td>
                                        <td className="p-4 text-white font-mono text-sm">{formatTime(a.markedAt)}</td>
                                        <td className="p-4 text-[#b491ca] text-xs">
                                            {a.scheduleId ? `${a.scheduleId.startTime} - ${a.scheduleId.endTime}` : "-"}
                                        </td>
                                        <td className="p-4">
                                            {a.result === "ON_TIME" ? (
                                                <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span> On Time
                                                </span>
                                            ) : (
                                                <span className="text-yellow-500 text-xs font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">warning</span> Late
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500' :
                                                    a.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {a.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-[#b491ca]">No records found for this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
