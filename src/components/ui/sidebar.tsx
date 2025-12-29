/**
 * Sidebar Component - Antigravity UI
 * 
 * Senior Developer Note:
 * Modern accounting uygulamaları için tasarlanmış navigasyon sidebar'ı.
 * Glassmorphism efekti, smooth geçişler ve aktif durumu gösteren
 * animasyonlu indicator içerir.
 * 
 * Responsive davranış: Mobilde drawer, desktop'ta sabit sidebar.
 */

'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    PieChart,
    Users,
    Settings,
    Sparkles,
    ChevronLeft,
    Menu,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'İşlemler', href: '/transactions', icon: Receipt },
    { label: 'Faturalar', href: '/invoices', icon: Wallet },
    { label: 'Raporlar', href: '/reports', icon: PieChart },
    { label: 'Müşteriler', href: '/customers', icon: Users },
];

const bottomNavItems: NavItem[] = [
    { label: 'AI Asistan', href: '/ai-assistant', icon: Sparkles },
    { label: 'Ayarlar', href: '/settings', icon: Settings },
];

/**
 * Ana sidebar navigasyonu.
 */
export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.aside
            className={`
        fixed left-0 top-0 h-screen z-40
        bg-white/70 dark:bg-neutral-900/80
        backdrop-blur-xl
        border-r border-neutral-200/50 dark:border-neutral-800/50
        flex flex-col
        transition-all duration-300 ease-out
      `}
            initial={{ x: -100, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? 80 : 260,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
                <motion.div
                    className="flex items-center gap-3"
                    animate={{ opacity: isCollapsed ? 0 : 1 }}
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 
                          flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            className="font-bold text-lg bg-gradient-to-r from-blue-500 to-violet-500 
                         bg-clip-text text-transparent"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            NovaFlow
                        </motion.span>
                    )}
                </motion.div>

                <motion.button
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-neutral-500 hover:text-neutral-900 dark:hover:text-white
                     hover:bg-neutral-100 dark:hover:bg-neutral-800
                     transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <motion.div
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.div>
                </motion.button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            isActive={pathname === item.href}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </ul>
            </nav>

            {/* Bottom Navigation */}
            <div className="py-4 px-3 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <ul className="space-y-1">
                    {bottomNavItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            isActive={pathname === item.href}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </ul>
            </div>
        </motion.aside>
    );
}

/**
 * Navigasyon linki bileşeni.
 */
function NavLink({
    item,
    isActive,
    isCollapsed,
}: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
}) {
    const Icon = item.icon;

    return (
        <li>
            <Link href={item.href}>
                <motion.div
                    className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl
            font-medium text-sm
            transition-colors duration-200
            ${isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }
            ${!isActive && 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'}
          `}
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Active Background */}
                    {isActive && (
                        <motion.div
                            className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl"
                            layoutId="activeNav"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                        <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 
                         bg-gradient-to-b from-blue-500 to-violet-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}

                    <Icon className={`w-5 h-5 relative z-10 ${isCollapsed ? 'mx-auto' : ''}`} />

                    {!isCollapsed && (
                        <motion.span
                            className="relative z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {item.label}
                        </motion.span>
                    )}
                </motion.div>
            </Link>
        </li>
    );
}

/**
 * Mobil hamburger menu butonu.
 */
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <motion.button
            className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl 
                 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg
                 flex items-center justify-center
                 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50"
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
        </motion.button>
    );
}
