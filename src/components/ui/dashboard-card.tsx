/**
 * DashboardCard Component - Antigravity UI
 * 
 * Senior Developer Note:
 * Bu bileşen, Antigravity tasarım dilinin temelini oluşturan glassmorphism
 * kartlarını implement eder. Framer Motion ile fizik tabanlı animasyonlar
 * ve "floating" (havada süzülme) efekti sağlar.
 * 
 * Key Features:
 * - Glassmorphism backdrop blur
 * - Hover'da "bounciness" efekti
 * - Floating shadow animasyonu
 * - Variant-based styling (default, income, expense)
 */

'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type CardVariant = 'default' | 'income' | 'expense' | 'highlight';

interface DashboardCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode;
    variant?: CardVariant;
    className?: string;
    /** Hover animasyonunu devre dışı bırakır */
    disableHover?: boolean;
    /** Ek glow efekti ekler */
    glow?: boolean;
}

/**
 * Antigravity stilli, animasyonlu dashboard kartı.
 * Tüm finansal verileri göstermek için kullanılan temel UI elementi.
 */
export function DashboardCard({
    children,
    variant = 'default',
    className = '',
    disableHover = false,
    glow = false,
    ...motionProps
}: DashboardCardProps) {
    // Variant'a göre stil seçimi
    const variantStyles: Record<CardVariant, string> = {
        default: 'bg-white/70 dark:bg-neutral-900/70 border-white/20 dark:border-neutral-800/50',
        income: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/30 dark:border-blue-800/30',
        expense: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200/30 dark:border-rose-800/30',
        highlight: 'bg-gradient-to-br from-violet-500/10 to-purple-600/5 border-violet-200/30 dark:border-violet-800/30',
    };

    const glowStyles: Record<CardVariant, string> = {
        default: '',
        income: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
        expense: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]',
        highlight: 'shadow-[0_0_40px_rgba(139,92,246,0.15)]',
    };

    // Fizik tabanlı spring animasyonu - "bounciness" efekti
    const springConfig = {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
    };

    return (
        <motion.div
            className={`
        relative overflow-hidden rounded-3xl p-6
        backdrop-blur-xl border
        shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]
        transition-colors duration-300
        ${variantStyles[variant]}
        ${glow ? glowStyles[variant] : ''}
        ${className}
      `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            whileHover={
                disableHover
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.01,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        transition: springConfig,
                    }
            }
            whileTap={disableHover ? undefined : { scale: 0.99 }}
            {...motionProps}
        >
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

/**
 * Kart başlığı için ek bileşen.
 */
export function CardHeader({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * Kart başlık metni.
 */
export function CardTitle({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <h3 className={`text-sm font-medium text-neutral-500 dark:text-neutral-400 ${className}`}>
            {children}
        </h3>
    );
}

/**
 * Büyük değer gösterimi (örn: Total Balance).
 */
export function CardValue({
    children,
    className = '',
    trend,
}: {
    children: ReactNode;
    className?: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    const trendColor = {
        up: 'text-emerald-500',
        down: 'text-rose-500',
        neutral: 'text-neutral-600 dark:text-neutral-300',
    };

    return (
        <p
            className={`text-3xl font-bold tracking-tight text-neutral-900 dark:text-white ${trend ? trendColor[trend] : ''
                } ${className}`}
        >
            {children}
        </p>
    );
}
