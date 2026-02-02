"use client";

export default function AdminHeader() {
    return (
        <header className="flex items-center justify-between border-b border-[#3a2348] px-8 py-4 sticky top-0 bg-[#1b1022]/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-4 flex-1">
                <label className="flex items-center w-full max-w-md bg-[#291934] rounded-lg px-4 py-2 border border-transparent focus-within:border-primary/50 transition-all">
                    <span className="material-symbols-outlined text-[#b491ca] text-xl">search</span>
                    <input className="bg-transparent border-none text-white text-sm focus:ring-0 w-full placeholder:text-[#b491ca] focus:outline-none" placeholder="Search students, records, or classes..." />
                </label>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-4">
                    <button className="text-[#b491ca] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="text-[#b491ca] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">help</span>
                    </button>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary/20">
                    Admin Profile
                </button>
            </div>
        </header>
    );
}
