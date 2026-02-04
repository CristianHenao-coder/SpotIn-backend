"use client";

import { useState, useEffect } from "react";

interface Schedule {
    _id: string;
    classroomId: { _id: string; name: string };
    siteId: { _id: string; name: string };
    daysOfWeek: number[]; // Array of days [0, 1, 2...]
    startTime: string;
    endTime: string;
    lateAfterMinutes: number;
    isActive: boolean;
}

interface Site { _id: string; name: string; }
interface Classroom { _id: string; name: string; }

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    const [loading, setLoading] = useState(true);

    // Filters
    const [filterSite, setFilterSite] = useState("");
    const [filterClassroom, setFilterClassroom] = useState("");
    const [filterActive, setFilterActive] = useState(true);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        classroomId: "",
        siteId: "",
        daysOfWeek: [] as number[],
        startTime: "08:00",
        endTime: "10:00",
        lateAfterMinutes: 10,
        isActive: true
    });

    useEffect(() => {
        // Load Helpers
        Promise.all([
            fetch("/api/admin-web/sites").then(r => r.json()),
            fetch("/api/admin-web/classrooms?isActive=true").then(r => r.json())
        ]).then(([sitesData, classroomsData]) => {
            // Sort sites by name for better UX
            const sortedSites = Array.isArray(sitesData) ? [...sitesData].sort((a, b) => a.name.localeCompare(b.name)) : [];
            setSites(sortedSites);
            if (Array.isArray(classroomsData)) {
                setClassrooms(classroomsData);
            } else {
                setClassrooms([]);
            }
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [filterSite, filterClassroom, filterActive]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSite) params.append("siteId", filterSite);
            if (filterClassroom) params.append("classroomId", filterClassroom);
            if (filterActive !== null) params.append("isActive", String(filterActive));

            const res = await fetch(`/api/admin-web/schedules?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSchedules(data);
            } else {
                setSchedules([]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.daysOfWeek.length === 0) {
            alert("Please select at least one day.");
            return;
        }

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
                // Handle cases where population might have failed and it's just a string ID
                classroomId: (s.classroomId && typeof s.classroomId === "object") ? s.classroomId._id : (s.classroomId || ""),
                siteId: (s.siteId && typeof s.siteId === "object") ? s.siteId._id : (s.siteId || ""),
                daysOfWeek: s.daysOfWeek || [],
                startTime: s.startTime,
                endTime: s.endTime,
                lateAfterMinutes: s.lateAfterMinutes,
                isActive: s.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                classroomId: "",
                siteId: "",
                daysOfWeek: [1, 2, 3, 4, 5], // Default M-F
                startTime: "08:00",
                endTime: "10:00",
                lateAfterMinutes: 10,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const toggleDay = (dayIndex: number) => {
        setFormData(prev => {
            const exists = prev.daysOfWeek.includes(dayIndex);
            if (exists) return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== dayIndex) };
            return { ...prev, daysOfWeek: [...prev.daysOfWeek, dayIndex].sort() };
        });
    };

    const setDays = (days: number[]) => {
        setFormData(prev => ({ ...prev, daysOfWeek: days }));
    };

    const formatDays = (days: number[]) => {
        if (!days || days.length === 0) return "None";
        if (days.length === 7) return "All Days";
        if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5)) return "Mon - Fri";

        return days.map(d => DAYS[d].substring(0, 3)).join(", ");
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Schedules</span>
            </nav>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Schedules Management</h1>
                <button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span> Create Schedule
                </button>
            </div>

            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end">
                <select className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white" value={filterSite} onChange={e => setFilterSite(e.target.value)}>
                    <option value="">All Sites</option>
                    {Array.isArray(sites) && sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white" value={filterClassroom} onChange={e => setFilterClassroom(e.target.value)}>
                    <option value="">All Classrooms</option>
                    {Array.isArray(classrooms) && classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
                                <th className="p-4">Classroom</th>
                                <th className="p-4">Site</th>
                                <th className="p-4">Days</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Tolerance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3a2348]">
                            {Array.isArray(schedules) && schedules.map(s => (
                                <tr key={s._id} className="hover:bg-[#3a2348]/20 transition-colors">
                                    <td className="p-4 text-white font-medium">{s.classroomId?.name || (typeof s.classroomId === "string" ? s.classroomId : "Unknown")}</td>
                                    <td className="p-4 text-[#b491ca]">
                                        {/* Fallback to ID string if population failed */}
                                        {s.siteId?.name || (typeof s.siteId === "string" ? s.siteId : "No Site")}
                                    </td>
                                    <td className="p-4 text-white font-medium text-sm">{formatDays(s.daysOfWeek)}</td>
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
                                <label className="text-xs text-[#b491ca] block mb-1">Classroom (*)</label>
                                <select required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.classroomId} onChange={e => setFormData({ ...formData, classroomId: e.target.value })}>
                                    <option value="">Select Classroom</option>
                                    {Array.isArray(classrooms) && classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-[#b491ca] block mb-1">Site (*)</label>
                                <select required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.siteId} onChange={e => setFormData({ ...formData, siteId: e.target.value })}>
                                    <option value="">Select Site</option>
                                    {Array.isArray(sites) && sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                {formData.siteId && !sites.find(s => s._id === formData.siteId) && (
                                    <p className="text-red-500 text-[10px] mt-1 italic">
                                        Note: Site ID {formData.siteId} not found in active list. Please re-select a site.
                                    </p>
                                )}
                            </div>

                            {/* Days Selector */}
                            <div>
                                <label className="text-xs text-[#b491ca] block mb-2">Days (*)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <button type="button" onClick={() => setDays([1, 2, 3, 4, 5])} className="text-xs bg-[#3a2348] hover:bg-primary text-white px-2 py-1 rounded">Mon-Fri</button>
                                    <button type="button" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])} className="text-xs bg-[#3a2348] hover:bg-primary text-white px-2 py-1 rounded">All Days</button>
                                    <button type="button" onClick={() => setDays([])} className="text-xs bg-[#3a2348] hover:bg-red-500 text-white px-2 py-1 rounded">Clear</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => toggleDay(index)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${formData.daysOfWeek.includes(index)
                                                ? "bg-primary text-white shadow-lg"
                                                : "bg-[#291934] text-[#b491ca] border border-[#3a2348]"
                                                }`}
                                        >
                                            {day.substring(0, 3)}
                                        </button>
                                    ))}
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

                            <div>
                                <label className="text-xs text-[#b491ca] block mb-1">Tolerance (min)</label>
                                <input type="number" required className="w-full bg-[#291934] border border-[#3a2348] rounded text-white p-2" value={formData.lateAfterMinutes} onChange={e => setFormData({ ...formData, lateAfterMinutes: Number(e.target.value) })} />
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
