"use client";

import { useState, useEffect } from "react";

interface Schedule {
    _id: string;
    userId: { _id: string; name: string };
    siteId: { _id: string; name: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    lateAfterMinutes: number;
    isActive: boolean;
}

interface Site { _id: string; name: string; }
interface User { _id: string; name: string; } // For teacher select

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [users, setUsers] = useState<User[]>([]); // We need a way to select users (teachers). Currently no generic User list API, maybe reuse /users? 
    // Optimization: For now, I'll fetch /users?role=USER (Students) but model says User is generic. Ideally should be role=TEACHER? 
    // The system seems to only have USER/ADMIN. Assuming Schedule is for ANY User. 
    // I will use the existing /users endpoint but it filters by student. 
    // **Workaround**: I'll fetch existing /users endpoint. If schedules are for "Students", it works. If for "Staff", they need a role. 
    // Assuming Schedules are for Students/Users for now based on context.

    const [loading, setLoading] = useState(true);

    // Filters
    const [filterSite, setFilterSite] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterActive, setFilterActive] = useState(true);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        userId: "",
        siteId: "",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "10:00",
        lateAfterMinutes: 10,
        isActive: true
    });

    useEffect(() => {
        // Load Helpers
        fetch("/api/admin-web/sites").then(r => r.json()).then(setSites);
        // Fetch users (Students) for the dropdown. 
        // WARN: If thousands of students, this dropdown is bad. But suitable for MVP.
        fetch("/api/admin-web/users?isActive=true").then(r => r.json()).then(setUsers);
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [filterSite, filterDay, filterActive]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSite) params.append("siteId", filterSite);
            if (filterDay) params.append("dayOfWeek", filterDay);
            if (filterActive !== null) params.append("isActive", String(filterActive));

            const res = await fetch(`/api/admin-web/schedules?${params.toString()}`);
            const data = await res.json();
            setSchedules(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/admin-web/schedules/${editingId}` : "/api/admin-web/schedules";
            const method = editingId ? "PATCH" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error("Failed");
            setIsModalOpen(false);
            fetchSchedules();
        } catch (err) { alert("Error saving schedule"); }
    };

    const handleDisable = async (id: string) => {
        if (!confirm("Disable?")) return;
        await fetch(`/api/admin-web/schedules/${id}`, { method: "DELETE" });
        fetchSchedules();
    };

    const openModal = (s?: Schedule) => {
        if (s) {
            setEditingId(s._id);
            setFormData({
                userId: s.userId?._id || "",
                siteId: s.siteId?._id || "",
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                lateAfterMinutes: s.lateAfterMinutes,
                isActive: s.isActive
            });
        } else {
            setEditingId(null);
            setFormData({ userId: "", siteId: "", dayOfWeek: 1, startTime: "08:00", endTime: "10:00", lateAfterMinutes: 10, isActive: true });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Schedules</span>
            </nav>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Schedules</h1>
                <button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span> Create
                </button>
            </div>

            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end">
                <select className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white" value={filterSite} onChange={e => setFilterSite(e.target.value)}>
                    <option value="">All Sites</option>
                    {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
                    <option value="">All Days</option>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                <button onClick={() => setFilterActive(!filterActive)} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterActive ? 'text-green-400 border-green-500/50' : 'text-[#b491ca] border-[#3a2348]'}`}>
                    {filterActive ? "Active Only" : "All"}
                </button>
            </div>

            <div className="bg-[#291934] border border-[#3a2348] rounded-2xl overflow-hidden">
                {loading ? <div className="p-8 text-center text-[#b491ca]">Loading...</div> : (
                    <table className="w-full text-left">
                        <thead className="bg-[#3a2348] text-white text-sm font-bold uppercase">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Site</th>
                                <th className="p-4">Day</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Tolerance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3a2348]">
                            {schedules.map(s => (
                                <tr key={s._id} className="hover:bg-[#3a2348]/20 transition-colors">
                                    <td className="p-4 text-white">{s.userId?.name || "Unknown"}</td>
                                    <td className="p-4 text-[#b491ca]">{s.siteId?.name}</td>
                                    <td className="p-4 text-white font-medium">{DAYS[s.dayOfWeek]}</td>
                                    <td className="p-4 text-[#b491ca] font-mono text-sm">{s.startTime} - {s.endTime}</td>
                                    <td className="p-4 text-[#b491ca]">{s.lateAfterMinutes}m</td>
                                    <td className="p-4">
                                        {s.isActive ? <span className="text-green-500 font-bold text-xs">Active</span> : <span className="text-red-500 font-bold text-xs">Inactive</span>}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => openModal(s)} className="text-[#b491ca] hover:text-white"><span className="material-symbols-outlined">edit</span></button>
                                        {s.isActive && (
                                            <button onClick={() => handleDisable(s._id)} className="text-red-500/70 hover:text-red-500">
                                                <span className="material-symbols-outlined">block</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b1022] border border-[#3a2348] rounded-2xl w-full max-w-lg p-6">
                        <h2 className="text-white text-xl font-bold mb-4">{editingId ? "Edit" : "Create"} Schedule</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs text-[#b491ca] block mb-1">User (*)</label>
                                <select required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}>
                                    <option value="">Select User</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-[#b491ca] block mb-1">Site (*)</label>
                                <select required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.siteId} onChange={e => setFormData({ ...formData, siteId: e.target.value })}>
                                    <option value="">Select Site</option>
                                    {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#b491ca] block mb-1">Day (*)</label>
                                    <select required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}>
                                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[#b491ca] block mb-1">Tolerance (min)</label>
                                    <input type="number" required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.lateAfterMinutes} onChange={e => setFormData({ ...formData, lateAfterMinutes: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#b491ca] block mb-1">Start Time</label>
                                    <input type="time" required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-[#b491ca] block mb-1">End Time</label>
                                    <input type="time" required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#b491ca] px-4">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
