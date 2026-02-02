"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Classroom {
    _id: string;
    name: string;
    siteId: { _id: string; name: string }; // Populated
    scheduleIds: { _id: string; name: string; startTime: string; endTime: string }[];
    studentsCount?: number;
    isActive: boolean;
}

interface Site {
    _id: string;
    name: string;
}

interface Schedule {
    _id: string;
    name: string;
}

export default function ClassroomsPage() {
    const router = useRouter();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [filterSearch, setFilterSearch] = useState("");
    const [filterSite, setFilterSite] = useState("");
    const [filterActive, setFilterActive] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        siteId: "",
        scheduleIds: [] as string[],
        isActive: true
    });
    const [modalLoading, setModalLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        Promise.all([
            fetch("/api/admin-web/sites").then(res => res.json()),
            fetch("/api/admin-web/schedules").then(res => res.json())
        ]).then(([sitesData, schedulesData]) => {
            setSites(sitesData);
            setSchedules(schedulesData);
        }).catch(err => console.error(err));
    }, []);

    // Fetch Classrooms with Filters
    useEffect(() => {
        fetchClassrooms();
    }, [filterSite, filterActive]); // Search triggered by button or debounce ideally, but simplified here

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSearch) params.append("search", filterSearch);
            if (filterSite) params.append("siteId", filterSite);
            if (filterActive !== null) params.append("isActive", String(filterActive));

            const res = await fetch(`/api/admin-web/classrooms?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setClassrooms(data);
        } catch (err) {
            setError("Error loading classrooms");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ name: "", siteId: "", scheduleIds: [], isActive: true });
        setIsModalOpen(true);
    };

    const handleEdit = (c: Classroom) => {
        setEditingId(c._id);
        setFormData({
            name: c.name,
            siteId: c.siteId?._id || "",
            scheduleIds: c.scheduleIds.map(s => s._id),
            isActive: c.isActive
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const url = editingId
                ? `/api/admin-web/classrooms/${editingId}`
                : "/api/admin-web/classrooms";

            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to save");

            setIsModalOpen(false);
            fetchClassrooms();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDisable = async (id: string) => {
        if (!confirm("Are you sure you want to disable this classroom?")) return;
        try {
            await fetch(`/api/admin-web/classrooms/${id}`, { method: "DELETE" });
            fetchClassrooms();
        } catch (err) { alert("Error disabling classroom"); }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Classrooms</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-white">Classrooms Management</h1>
                <button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span> Create Classroom
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <input
                        className="w-full bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white placeholder:text-[#b491ca] focus:outline-none focus:border-primary"
                        placeholder="Search by name..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchClassrooms()}
                    />
                </div>
                <select
                    className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    value={filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                >
                    <option value="">All Sites</option>
                    {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <button
                    onClick={() => setFilterActive(!filterActive)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${filterActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-[#1c1122] text-[#b491ca] border-[#3a2348]'}`}
                >
                    {filterActive ? "Showing Active" : "Showing All"}
                </button>
                <button onClick={fetchClassrooms} className="text-primary hover:text-white">
                    <span className="material-symbols-outlined">search</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#291934] border border-[#3a2348] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-[#b491ca]">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#3a2348] text-white text-sm font-bold uppercase">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Site</th>
                                    <th className="p-4">Schedules</th>
                                    <th className="p-4">Students</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a2348]">
                                {classrooms.map(c => (
                                    <tr key={c._id} className="hover:bg-[#3a2348]/20 transition-colors">
                                        <td className="p-4 text-white font-medium">{c.name}</td>
                                        <td className="p-4 text-[#b491ca]">{c.siteId?.name || "N/A"}</td>
                                        <td className="p-4 text-[#b491ca]">{c.scheduleIds?.length || 0} Schedules</td>
                                        <td className="p-4 text-white">{c.studentsCount || 0}</td>
                                        <td className="p-4">
                                            {c.isActive ? (
                                                <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">Active</span>
                                            ) : (
                                                <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleEdit(c)} className="text-[#b491ca] hover:text-white">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            {c.isActive && (
                                                <button onClick={() => handleDisable(c._id)} className="text-red-500/70 hover:text-red-500">
                                                    <span className="material-symbols-outlined">block</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {classrooms.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-[#b491ca]">No classrooms found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1b1022] border border-[#3a2348] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <h2 className="text-white text-2xl font-bold mb-6">{editingId ? "Edit Classroom" : "Create Classroom"}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Name</label>
                                <input
                                    required
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Site (*)</label>
                                <select
                                    required
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.siteId}
                                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                                >
                                    <option value="">Select Site</option>
                                    {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Schedules</label>
                                <select
                                    multiple
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary h-32"
                                    value={formData.scheduleIds}
                                    onChange={(e) => setFormData({ ...formData, scheduleIds: Array.from(e.target.selectedOptions, o => o.value) })}
                                >
                                    {schedules.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                <p className="text-xs text-[#b491ca] mt-1">Hold Ctrl/Cmd to select multiple</p>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label className="text-[#b491ca] text-sm">Active</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-[#b491ca] hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalLoading}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2 rounded-lg"
                                >
                                    {modalLoading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
