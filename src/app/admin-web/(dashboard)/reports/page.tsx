"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [dateFrom, dateTo]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin-web/reports/attendance?from=${dateFrom}&to=${dateTo}`);
            const json = await res.json();
            setData(json);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        alert("CSV Export feature coming in next version!");
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Reports</span>
            </nav>
            <h1 className="text-3xl font-bold text-white mb-8">Analytics & Reports</h1>

            {/* Date Filter */}
            <div className="bg-[#291934] border border-[#3a2348] p-4 rounded-xl mb-6 flex items-center gap-4">
                <div>
                    <label className="text-xs text-[#b491ca] block mb-1">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#1c1122] border border-[#3a2348] rounded px-4 py-2 text-white" />
                </div>
                <div>
                    <label className="text-xs text-[#b491ca] block mb-1">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#1c1122] border border-[#3a2348] rounded px-4 py-2 text-white" />
                </div>
                <button onClick={fetchData} className="mt-4 bg-[#1c1122] hover:bg-[#3a2348] text-primary p-2 rounded-lg"><span className="material-symbols-outlined">refresh</span></button>
                <div className="flex-1 text-right mt-4">
                    <button onClick={handleExport} className="bg-[#3a2348] hover:bg-[#4a2d5a] text-white px-4 py-2 rounded-lg text-sm font-bold">Export CSV</button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6">
                    <p className="text-[#b491ca] text-sm font-bold">Present Rate</p>
                    <h2 className="text-4xl text-green-500 font-black mt-2">{data?.presentRate || 0}%</h2>
                    <p className="text-white/40 text-xs mt-1">{data?.presentCount || 0} students</p>
                </div>
                <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6">
                    <p className="text-[#b491ca] text-sm font-bold">Late Rate</p>
                    <h2 className="text-4xl text-yellow-500 font-black mt-2">{data?.lateRate || 0}%</h2>
                    <p className="text-white/40 text-xs mt-1">{data?.lateCount || 0} students</p>
                </div>
                <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6">
                    <p className="text-[#b491ca] text-sm font-bold">Total Records</p>
                    <h2 className="text-4xl text-white font-black mt-2">{data?.totalRecords || 0}</h2>
                    <p className="text-white/40 text-xs mt-1">Check-ins processed</p>
                </div>
            </div>

            {/* Top Classrooms Late */}
            <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Top Classrooms With Late Arrivals</h3>
                {data && data.topClassroomsLate?.length > 0 ? (
                    <ul className="space-y-4">
                        {data.topClassroomsLate.map((c: any, i: number) => (
                            <li key={i} className="flex justify-between items-center">
                                <span className="text-white font-medium">{c._id}</span>
                                <span className="text-yellow-500 font-bold">{c.count} Late</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[#b491ca]">No late data available.</p>
                )}
            </div>
        </div>
    );
}
