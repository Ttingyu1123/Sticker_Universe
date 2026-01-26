import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Sparkles, Layers, Eraser, Palette, Home, Settings } from 'lucide-react';
import clsx from 'clsx';

const NavItem = ({ to, icon: Icon, label, disabled = false }: { to: string, icon: any, label: string, disabled?: boolean }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25 scale-105 font-bold"
                    : "text-slate-500 hover:bg-white hover:shadow-md hover:text-violet-600 hover:scale-[1.02]",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )
        }
    >
        <div className="relative z-10 flex items-center gap-3">
            <Icon size={20} strokeWidth={2.5} />
            <span className="text-sm tracking-wide">{label}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </NavLink>
);

export const Layout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-violet-200 selection:text-violet-900">
            {/* Sidebar */}
            <aside className="w-64 fixed inset-y-0 left-0 z-50 bg-slate-50/50 backdrop-blur-xl border-r border-slate-200/50 p-4 flex flex-col gap-2">
                {/* Header */}
                <div className="px-4 py-6 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                            <Sparkles size={24} fill="currentColor" className="text-white/90" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">
                                Sticker<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">OS</span>
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Creative Suite</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <div className="px-4 pb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apps</p>
                    </div>
                    <NavItem to="/generator" icon={Sparkles} label="Generator" />
                    <NavItem to="/editor" icon={Palette} label="Editor" />
                    <NavItem to="/packager" icon={Layers} label="Packager" />
                    <NavItem to="/eraser" icon={Eraser} label="Eraser" />
                </nav>

                {/* Footer / User */}
                <div className="mt-auto pt-4 border-t border-slate-200/50 space-y-1">
                    <div className="px-4 pb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm">
                        <Settings size={20} />
                        <span className="text-sm font-bold">Settings</span>
                    </button>
                    <a href="https://tingyusdeco.com/" target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm">
                        <Home size={20} />
                        <span className="text-sm font-bold">Back Home</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-w-0">
                <Outlet />
            </main>
        </div>
    );
};
