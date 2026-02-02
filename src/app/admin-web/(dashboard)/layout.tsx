import AdminSidebar from "@/src/components/AdminSidebar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            <AdminSidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col bg-[#0a0a0a]">
                {children}
            </main>
        </div>
    );
}
