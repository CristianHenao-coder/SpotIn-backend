"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        lateDefaultMinutes: 10,
        qrRequired: true,
        defaultAllowedRadiusMeters: 50
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetch("/api/admin-web/settings")
            .then(res => res.json())
            .then(data => {
                if (data) setFormData({
                    lateDefaultMinutes: data.lateDefaultMinutes,
                    qrRequired: data.qrRequired,
                    defaultAllowedRadiusMeters: data.defaultAllowedRadiusMeters
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        try {
            const res = await fetch("/api/admin-web/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMsg("Settings saved successfully.");
                setTimeout(() => setMsg(""), 3000);
            } else {
                setMsg("Error saving settings.");
            }
        } catch { setMsg("Error saving settings."); }
        finally { setSaving(false); }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-2">
                <a className="text-[#b491ca] hover:text-white text-sm transition-colors" href="/admin-web">Home</a>
                <span className="text-[#b491ca] text-sm">/</span>
                <span className="text-white text-sm font-medium">Settings</span>
            </nav>
            <h1 className="text-3xl font-bold text-white mb-8">System Configuration</h1>

            <div className="bg-[#291934] border border-[#3a2348] rounded-2xl p-8 max-w-2xl">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="text-white font-bold block mb-2">Default Late Tolerance (Minutes)</label>
                        <p className="text-[#b491ca] text-sm mb-2">Global default when no specific schedule rule applies.</p>
                        <input
                            type="number"
                            required
                            className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-3 text-white w-full"
                            value={formData.lateDefaultMinutes}
                            onChange={e => setFormData({ ...formData, lateDefaultMinutes: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="text-white font-bold block mb-2">Geo-Fencing Radius (Meters)</label>
                        <p className="text-[#b491ca] text-sm mb-2">Maximum allowed distance from site center for valid check-in.</p>
                        <input
                            type="number"
                            required
                            className="bg-[#1c1122] border border-[#3a2348] rounded-lg px-4 py-3 text-white w-full"
                            value={formData.defaultAllowedRadiusMeters}
                            onChange={e => setFormData({ ...formData, defaultAllowedRadiusMeters: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1c1122] rounded-xl border border-[#3a2348]">
                        <div>
                            <label className="text-white font-bold block">Require dynamic QR Code</label>
                            <p className="text-[#b491ca] text-sm">If disabled, static site codes might be used (Less secure).</p>
                        </div>
                        <input
                            type="checkbox"
                            className="w-6 h-6 accent-primary"
                            checked={formData.qrRequired}
                            onChange={e => setFormData({ ...formData, qrRequired: e.target.checked })}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg w-full transition-all"
                        >
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                        {msg && <p className="text-center mt-4 text-green-400 font-bold animate-pulse">{msg}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
}
