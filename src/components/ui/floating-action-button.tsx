/**
 * FloatingActionButton Component - Antigravity UI
 * 
 * Senior Developer Note:
 * FAB (Floating Action Button) modern mobil UX'in temel taşlarından biridir.
 * Bu implementasyon, Material Design prensiplerini Antigravity estetiği ile
 * birleştirerek pulsing glow ve scale animasyonları sunar.
 * 
 * Position stratejisi: Fixed positioning ile ekranın sağ alt köşesinde sabitlenir.
 * Multiple FAB'lar için staggered offset sistemi kullanılır.
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

type FABVariant = 'primary' | 'secondary' | 'income' | 'expense';
type FABSize = 'sm' | 'md' | 'lg';

interface FloatingActionButtonProps {
    icon: LucideIcon;
    label?: string;
    onClick?: () => void;
    variant?: FABVariant;
    size?: FABSize;
    /** Birden fazla FAB varsa, index ile offset ayarlanır */
    index?: number;
    /** Extended mode: ikon + metin gösterir */
    extended?: boolean;
    className?: string;
}

/**
 * Antigravity stilli Floating Action Button.
 * Hızlı işlemler için kullanılır: Fatura Ekle, Gider Ekle vb.
 */
export function FloatingActionButton({
    icon: Icon,
    label,
    onClick,
    variant = 'primary',
    size = 'md',
    index = 0,
    extended = false,
    className = '',
}: FloatingActionButtonProps) {
    // Variant stilleri
    const variantStyles: Record<FABVariant, string> = {
        primary: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_30px_rgba(59,130,246,0.4)]',
        secondary: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]',
        income: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)]',
        expense: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_8px_30px_rgba(244,63,94,0.4)]',
    };

    const hoverGlow: Record<FABVariant, string> = {
        primary: 'hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]',
        secondary: 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]',
        income: 'hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)]',
        expense: 'hover:shadow-[0_12px_40px_rgba(244,63,94,0.5)]',
    };

    // Size konfigürasyonu
    const sizeStyles: Record<FABSize, { button: string; icon: number }> = {
        sm: { button: 'h-12 w-12', icon: 20 },
        md: { button: 'h-14 w-14', icon: 24 },
        lg: { button: 'h-16 w-16', icon: 28 },
    };

    // Birden fazla FAB için offset hesaplama
    const bottomOffset = 24 + index * 72;

    return (
        <motion.button
            className={`
        fixed right-6 z-50
        ${extended ? 'px-5 rounded-2xl gap-2' : 'rounded-xl'}
        ${sizeStyles[size].button}
        ${variantStyles[variant]}
        ${hoverGlow[variant]}
        flex items-center justify-center
        font-medium text-sm
        transition-shadow duration-300
        ${className}
      `}
            style={{ bottom: bottomOffset }}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: index * 0.1,
            }}
            whileHover={{
                scale: 1.1,
                transition: { type: 'spring', stiffness: 400, damping: 15 },
            }}
            whileTap={{ scale: 0.95 }}
        >
            <Icon size={sizeStyles[size].icon} />
            {extended && label && <span>{label}</span>}
        </motion.button>
    );
}

/**
 * FAB Container - Birden fazla FAB'ı gruplamak için.
 */
export function FABContainer({ children }: { children: ReactNode }) {
    return <div className="fixed bottom-0 right-0 z-50">{children}</div>;
}

/**
 * FAB Menu - Açılır FAB menüsü (SpeedDial pattern).
 */
interface FABMenuItem {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: FABVariant;
}

export function FABMenu({
    items,
    mainIcon,
    isOpen,
    onToggle,
}: {
    items: FABMenuItem[];
    mainIcon: LucideIcon;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const MainIcon = mainIcon;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
            {/* Ana buton */}
            <motion.button
                className={`
          h-14 w-14 rounded-xl
          bg-gradient-to-br from-blue-500 to-blue-600 text-white
          shadow-[0_8px_30px_rgba(59,130,246,0.4)]
          hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]
          flex items-center justify-center
          transition-shadow duration-300
        `}
                onClick={onToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <MainIcon size={24} />
            </motion.button>

            {/* Alt menü öğeleri */}
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{
                        opacity: isOpen ? 1 : 0,
                        scale: isOpen ? 1 : 0.5,
                        y: isOpen ? 0 : 10,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 20,
                        delay: isOpen ? index * 0.05 : 0,
                    }}
                    className="flex items-center gap-3"
                >
                    {/* Label */}
                    <motion.span
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 
                       text-sm font-medium text-neutral-700 dark:text-neutral-200
                       shadow-lg whitespace-nowrap"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 10 }}
                        transition={{ delay: isOpen ? index * 0.05 + 0.1 : 0 }}
                    >
                        {item.label}
                    </motion.span>

                    {/* Button */}
                    <motion.button
                        className={`
              h-12 w-12 rounded-xl
              ${item.variant === 'income'
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_6px_20px_rgba(16,185,129,0.35)]'
                                : item.variant === 'expense'
                                    ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-[0_6px_20px_rgba(244,63,94,0.35)]'
                                    : 'bg-white dark:bg-neutral-800 shadow-[0_6px_20px_rgba(0,0,0,0.1)]'
                            }
              text-white flex items-center justify-center
              transition-shadow duration-300
            `}
                        onClick={item.onClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <item.icon size={20} />
                    </motion.button>
                </motion.div>
            ))}
        </div>
    );
}
