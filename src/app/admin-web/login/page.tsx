"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin-web/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Login failed");
            }

            router.push("/admin-web");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display relative overflow-hidden">
            {/* Top Navigation Bar Component */}
            <header className="w-full border-b border-solid border-gray-200 dark:border-border-dark px-6 md:px-10 py-4 flex items-center justify-between bg-white dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-lg text-white">
                        <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">School Attendance System</h2>
                </div>
                <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                    <span>Help</span>
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 z-10">
                <div className="w-full max-w-md">
                    {/* Headline Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight mb-2">Administrator Portal</h1>
                        <p className="text-gray-500 dark:text-[#b491ca] text-sm">Welcome back. Please enter your credentials to manage the campus.</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-8 shadow-[0_0_40px_-10px_rgba(159,31,239,0.15)]">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-200 dark:border-red-900/20">{error}</div>}

                            {/* Email Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-700 dark:text-white text-sm font-medium">Email Address</label>
                                <div className="relative">
                                    <input
                                        className="w-full rounded-lg border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-[#291934] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary h-12 px-4 placeholder:text-gray-400 dark:placeholder:text-[#b491ca]/50 text-sm transition-all focus:outline-none"
                                        placeholder="e.g. admin@school.edu"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-gray-700 dark:text-white text-sm font-medium">Password</label>
                                <div className="flex w-full items-stretch">
                                    <input
                                        className="flex-1 rounded-l-lg border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-[#291934] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary h-12 px-4 border-r-0 placeholder:text-gray-400 dark:placeholder:text-[#b491ca]/50 text-sm transition-all focus:outline-none"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div
                                        className="flex items-center justify-center px-4 bg-gray-50 dark:bg-[#291934] border border-gray-300 dark:border-border-dark border-l-0 rounded-r-lg text-gray-400 dark:text-[#b491ca] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#322040] transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2">
                                <button
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : "Log In"}
                                </button>
                            </div>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-8 space-y-4 text-center">
                            <a className="block text-primary dark:text-[#b491ca] text-sm font-medium hover:underline" href="#">
                                Forgot your password?
                            </a>
                            <div className="h-px bg-gray-200 dark:bg-border-dark w-full"></div>
                            <p className="text-gray-500 dark:text-[#b491ca]/70 text-xs">
                                Don't have an account? <a className="text-primary font-semibold hover:underline" href="#">Contact Super Admin</a>
                            </p>
                        </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600 text-xs uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>Secure Administrative Access</span>
                    </div>
                </div>
            </main>

            {/* Visual Background Element (Subtle Gradient Glow) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
}
