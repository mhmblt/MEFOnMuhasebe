/**
 * utils.ts - Utility Functions
 * 
 * Senior Developer Note:
 * Bu modül, uygulama genelinde kullanılan yardımcı fonksiyonları içerir.
 * Class name birleştirme ve format işlemleri için merkezi bir nokta sağlar.
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Tailwind class'larını koşullu olarak birleştirmek için kullanılır.
 * clsx ile conditional class'ları yönetir.
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Para birimini Türk Lirası formatında gösterir.
 * Örnek: 1234567.89 -> "₺1.234.567,89"
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Kısa para birimi formatı (K, M, B suffix'leri ile).
 * Büyük rakamları okunabilir hale getirir.
 */
export function formatCurrencyCompact(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `₺${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
        return `₺${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
        return `₺${(amount / 1_000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
}

/**
 * Tarihi Türkçe formatında gösterir.
 * Örnek: "29 Aralık 2024"
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d);
}

/**
 * Kısa tarih formatı.
 * Örnek: "29 Ara"
 */
export function formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
    }).format(d);
}

/**
 * Yüzde değişimi hesaplar ve formatlar.
 */
export function formatPercentChange(current: number, previous: number): string {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
}
