"use client";

import { useState, useEffect } from "react";

interface Student {
    _id: string;
    name: string;
    email: string;
    classroomId?: { _id: string; name: string };
    isActive: boolean;
}

interface Classroom {
    _id: string;
    name: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterSearch, setFilterSearch] = useState("");
    const [filterClassroom, setFilterClassroom] = useState("");
    const [filterActive, setFilterActive] = useState(true);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        classroomId: "",
        isActive: true
    });
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch Classrooms for Filter/Dropdown
    useEffect(() => {
        fetch("/api/admin-web/classrooms?isActive=true")
            .then(res => res.json())
            .then(data => setClassrooms(data))
            .catch(err => console.error("Error loading classrooms", err));
    }, []);

    // Fetch Students
    useEffect(() => {
        fetchStudents();
    }, [filterClassroom, filterActive]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSearch) params.append("search", filterSearch);
            if (filterClassroom) params.append("classroomId", filterClassroom);
            if (filterActive !== null) params.append("isActive", String(filterActive));

            const res = await fetch(`/api/admin-web/users?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ name: "", email: "", password: "", classroomId: "", isActive: true });
        setIsModalOpen(true);
    };

    const handleEdit = (s: Student) => {
        setEditingId(s._id);
        setFormData({
            name: s.name,
            email: s.email,
            password: "", // Don't show existing hash
            classroomId: s.classroomId?._id || "",
            isActive: s.isActive
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const url = editingId
                ? `/api/admin-web/users/${editingId}`
                : "/api/admin-web/users";

            const method = editingId ? "PATCH" : "POST";

            const payload: any = { ...formData };
            if (editingId && !payload.password) delete payload.password; // Don't send empty password on edit

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to save");
            }

            setIsModalOpen(false);
            fetchStudents();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDisable = async (id: string) => {
        if (!confirm("Are you sure you want to disable this student?")) return;
        try {
            await fetch(`/api/admin-web/users/${id}`, { method: "DELETE" });
            fetchStudents();
        } catch (err) { alert("Error disabling student"); }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Students</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-white">Students Management</h1>
                <button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span> Create Student
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <input
                        className="w-full bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white placeholder:text-[#b491ca] focus:outline-none focus:border-primary"
                        placeholder="Search by name or email..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                    />
                </div>
                <select
                    className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    value={filterClassroom}
                    onChange={(e) => setFilterClassroom(e.target.value)}
                >
                    <option value="">All Classrooms</option>
                    {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <button
                    onClick={() => setFilterActive(!filterActive)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${filterActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-[#1c1122] text-[#b491ca] border-[#3a2348]'}`}
                >
                    {filterActive ? "Showing Active" : "Showing All"}
                </button>
                <button onClick={fetchStudents} className="text-primary hover:text-white">
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
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Classroom</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a2348]">
                                {students.map(s => (
                                    <tr key={s._id} className="hover:bg-[#3a2348]/20 transition-colors">
                                        <td className="p-4 text-white font-medium flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                                {s.name.charAt(0)}
                                            </div>
                                            {s.name}
                                        </td>
                                        <td className="p-4 text-[#b491ca]">{s.email}</td>
                                        <td className="p-4 text-white">{s.classroomId?.name || "-"}</td>
                                        <td className="p-4">
                                            {s.isActive ? (
                                                <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">Active</span>
                                            ) : (
                                                <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleEdit(s)} className="text-[#b491ca] hover:text-white">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            {s.isActive && (
                                                <button onClick={() => handleDisable(s._id)} className="text-red-500/70 hover:text-red-500">
                                                    <span className="material-symbols-outlined">block</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-[#b491ca]">No students found.</td></tr>
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
                        <h2 className="text-white text-2xl font-bold mb-6">{editingId ? "Edit Student" : "Create Student"}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Password {editingId && "(Leave blank to keep current)"}</label>
                                <input
                                    required={!editingId}
                                    type="password"
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[#b491ca] text-sm block mb-1">Classroom</label>
                                <select
                                    className="w-full bg-[#291934] border border-[#3a2348] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    value={formData.classroomId}
                                    onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                                >
                                    <option value="">No Classroom Assigned</option>
                                    {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
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
