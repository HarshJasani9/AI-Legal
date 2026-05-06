"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ShieldCheck, LayoutDashboard, UploadCloud, FileText, Bell, CreditCard, Menu } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Contract", href: "/upload", icon: UploadCloud },
    { name: "My Contracts", href: "/contracts", icon: FileText },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  const pageTitle = navItems.find((item) => pathname?.includes(item.href))?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-slate-400 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-60 bg-[#0a0f1e] md:bg-white/[0.03] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="px-6 py-5 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <span className="text-white font-semibold tracking-tight text-lg">LexAI</span>
        </div>

        <nav className="px-3 mt-4 flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname?.includes(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-600/20 text-indigo-300 font-medium" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 mt-auto border-t border-white/5 flex items-center gap-3">
          <UserButton 
            appearance={{ elements: { userButtonBox: "flex-row-reverse", userButtonOuterIdentifier: "text-xs text-slate-500 font-medium" } }}
            showName={true}
          />
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP HEADER BAR */}
        <header className="h-16 border-b border-white/5 flex items-center px-4 md:px-8 justify-between shrink-0 bg-[#0a0f1e] z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-semibold text-lg">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 font-medium mb-1">3 of 3 free contracts used</span>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[100%] rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
