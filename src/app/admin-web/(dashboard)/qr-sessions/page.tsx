"use client";

import { useState, useEffect, useRef } from "react";

interface QrSession {
    _id: string;
    siteId: { name: string };
    dateKey: string;
    expiresAt: string;
    createdAt: string;
}

export default function QrSessionsPage() {
    const [sessions, setSessions] = useState<QrSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Active Session State
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [activeExpiresAt, setActiveExpiresAt] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [siteName, setSiteName] = useState<string>("");

    useEffect(() => {
        fetchSessions();
    }, []);

    // Timer Effect
    useEffect(() => {
        if (!activeExpiresAt) return;

        const interval = setInterval(() => {
            const diff = new Date(activeExpiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft(0);
                handleAutoRefresh(); // Trigger auto-refresh
            } else {
                setTimeLeft(Math.floor(diff / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeExpiresAt]);

    const handleAutoRefresh = async () => {
        // Automatic regeneration
        console.log("Auto-refreshing QR...");
        handleGenerate();
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin-web/qr-sessions");
            const data = await res.json();
            setSessions(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/admin-web/qr-sessions", {
                method: "POST",
                body: JSON.stringify({}) // Default site logic 
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.message || "Failed");
            } else {
                const data = await res.json();
                setQrImage(data.qrDataUrl);
                setActiveExpiresAt(data.expiresAt);
                setSiteName(data.siteName);

                // Calc initial time left
                const diff = new Date(data.expiresAt).getTime() - Date.now();
                setTimeLeft(Math.max(0, Math.floor(diff / 1000)));

                fetchSessions(); // Refresh list
            }
        } catch (err) { alert("Error generating QR"); }
        finally { setGenerating(false); }
    };

    const handleExpire = async (id: string) => {
        if (!confirm("Expire this session now?")) return;
        try {
            await fetch(`/api/admin-web/qr-sessions/${id}`, { method: "PATCH" });
            fetchSessions();
            if (activeExpiresAt) {
                // If we force expired the *current* view, clear it
                // We'd need to check if ID matches, but for MVP let's just clear
                setQrImage(null);
                setActiveExpiresAt(null);
            }
        } catch (err) { alert("Error"); }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 mb-2">
                        <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                        <span className="text-[#b491ca] text-sm">/</span>
                        <span className="text-white text-sm font-medium">QR Sessions</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-white">QR Management</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Generator Card */}
                <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                    {qrImage && activeExpiresAt && timeLeft > 0 ? (
                        <div className="text-center w-full">
                            <h2 className="text-white font-bold text-2xl mb-2">{siteName}</h2>
                            <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-2xl">
                                <img src={qrImage} alt="Dynamic QR" className="w-64 h-64 object-contain" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[#b491ca] uppercase text-xs font-bold tracking-widest">Expires In</p>
                                <div className={`text-5xl font-black font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-[#3a2348] rounded-full flex items-center justify-center mx-auto mb-6 text-[#b491ca]">
                                <span className="material-symbols-outlined text-5xl">qr_code_Scanner</span>
                            </div>
                            <h2 className="text-white font-bold text-xl mb-2">No Active QR</h2>
                            <p className="text-[#b491ca] mb-8 max-w-xs mx-auto">Generate a new dynamic QR code for students to scan.</p>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className={`mt-6 w-full max-w-sm font-bold px-6 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${generating ? 'bg-[#3a2348] text-[#b491ca]' : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                    >
                        {generating ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">restart_alt</span>
                                {qrImage ? "Regenerate Now" : "Generate Local QR"}
                            </>
                        )}
                    </button>
                </div>

                {/* History / Stats */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-6 flex-1">
                        <h3 className="text-white font-bold mb-4">Recent Sessions</h3>
                        {loading ? <div className="text-[#b491ca] text-center p-4">Loading...</div> : (
                            <div className="overflow-y-auto max-h-[400px] pr-2 space-y-3">
                                {sessions.map(s => {
                                    const isExpired = new Date(s.expiresAt) < new Date();
                                    return (
                                        <div key={s._id} className="bg-[#1c1122] rounded-xl p-4 flex items-center justify-between border border-[#3a2348]">
                                            <div>
                                                <p className="text-white font-bold text-sm">{s.siteId?.name || "Unknown Site"}</p>
                                                <p className="text-[#b491ca] text-xs">{new Date(s.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                {isExpired ? (
                                                    <span className="text-[#b491ca] text-xs bg-[#3a2348] px-2 py-1 rounded">Expired</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                        <span className="text-green-500 text-xs font-bold">Active</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
