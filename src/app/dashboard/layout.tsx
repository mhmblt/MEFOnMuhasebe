/**
 * Dashboard Layout - Protected Route
 * 
 * Senior Developer Note:
 * Bu layout, dashboard altındaki tüm sayfaları korur.
 * activeProfile yoksa kullanıcıyı ana sayfaya yönlendirir.
 * 
 * Sidebar navigation ve global gradient background burada uygulanır.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    LayoutDashboard,
    PieChart,
    Calendar,
    LogOut,
    Sparkles,
    ChevronLeft,
    Menu,
    X,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';

interface NavItem {
    icon: typeof LayoutDashboard;
    label: string;
    href: string;
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: PieChart, label: 'Raporlar', href: '/dashboard/reports' },
    { icon: Calendar, label: 'Takvim', href: '/dashboard/calendar' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { activeProfileId, getActiveProfile, selectProfile } = useStore();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hydration fix
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auth check - redirect if no active profile
    useEffect(() => {
        if (mounted && !activeProfileId) {
            router.replace('/');
        }
    }, [mounted, activeProfileId, router]);

    const activeProfile = getActiveProfile();

    // Handle logout
    const handleLogout = () => {
        selectProfile(null);
        router.push('/');
    };

    // Loading state
    if (!mounted || !activeProfile) {
        return (
            <div className="min-h-screen gradient-anthracite-mesh flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Sparkles className="w-8 h-8 text-neutral-400" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-anthracite-mesh flex">
            {/* Desktop Sidebar */}
            <motion.aside
                className="hidden lg:flex fixed left-0 top-0 h-screen z-40
                   flex-col glass border-r border-white/10"
                animate={{ width: sidebarOpen ? 260 : 80 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                    <motion.div
                        className="flex items-center gap-3 overflow-hidden"
                        animate={{ opacity: sidebarOpen ? 1 : 0 }}
                    >
                        <img
                            src="/logo.png"
                            alt="MEF Yapı & İnşaat"
                            className="w-9 h-9 object-contain flex-shrink-0"
                        />
                        <span className="font-semibold text-sm text-neutral-200 whitespace-nowrap">
                            MEF Ön Muhasebe
                        </span>
                    </motion.div>

                    <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-neutral-400 hover:text-white hover:bg-white/10
                       transition-colors"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
                            <ChevronLeft className="w-4 h-4" />
                        </motion.div>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href}>
                                    <motion.div
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-neutral-400 hover:text-white hover:bg-white/10
                               transition-colors"
                                        whileHover={{ x: sidebarOpen ? 4 : 0 }}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        {sidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-sm font-medium whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </motion.div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-white/10">
                    {/* Active Profile */}
                    <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl mb-2
                       ${sidebarOpen ? '' : 'justify-center'}`}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: activeProfile.avatarColor }}
                        >
                            <span className="text-sm font-bold text-white">
                                {activeProfile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {activeProfile.name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {activeProfile.currency}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <button
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10
                       transition-colors ${sidebarOpen ? '' : 'justify-center'}`}
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && (
                            <span className="text-sm font-medium">Çıkış Yap</span>
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/10
                      flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="MEF Yapı & İnşaat"
                        className="w-9 h-9 object-contain"
                    />
                    <span className="font-semibold text-sm text-neutral-200">MEF Ön Muhasebe</span>
                </div>

                <button
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                     text-neutral-400 hover:text-white hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            className="lg:hidden fixed right-0 top-0 bottom-0 w-72 z-50 
                         glass border-l border-white/10 p-4"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <div className="flex justify-end mb-4">
                                <button
                                    className="w-10 h-10 rounded-xl flex items-center justify-center
                             text-neutral-400 hover:text-white hover:bg-white/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Profile */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: activeProfile.avatarColor }}
                                >
                                    <span className="font-bold text-white">
                                        {activeProfile.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-white">{activeProfile.name}</p>
                                    <p className="text-xs text-neutral-500">{activeProfile.currency}</p>
                                </div>
                            </div>

                            {/* Nav Items */}
                            <nav className="space-y-1 mb-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl
                                    text-neutral-400 hover:text-white hover:bg-white/10">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </nav>

                            {/* Logout */}
                            <button
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
                           text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Çıkış Yap</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300
                   pt-16 lg:pt-0 ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[80px]'}`}
            >
                <motion.div
                    className="p-6 lg:p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
