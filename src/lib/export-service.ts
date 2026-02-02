/**
 * Export Service - PDF & Excel Generation
 * 
 * Senior Developer Note:
 * Bu servis, finansal raporların PDF ve Excel formatında
 * dışa aktarılmasını sağlar. Türkçe karakter desteği mevcuttur.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { type Transaction, type Currency, CATEGORY_CONFIG, type TransactionCategory } from '@/stores/useStore';

// ============================================
// TYPES
// ============================================

interface ExportData {
    transactions: Transaction[];
    profileName: string;
    currency: Currency;
    periodLabel: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

// ============================================
// CURRENCY SYMBOLS
// ============================================

const CURRENCY_SYMBOLS: Record<Currency, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
};

// ============================================
// FORMAT HELPERS
// ============================================

const formatAmount = (amount: number, currency: Currency): string => {
    return `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// ============================================
// PDF EXPORT
// ============================================

export const generatePDF = (data: ExportData): void => {
    const { transactions, profileName, currency, periodLabel, totalIncome, totalExpense, balance } = data;

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor: [number, number, number] = [74, 144, 164];
    const incomeColor: [number, number, number] = [74, 222, 128];
    const expenseColor: [number, number, number] = [248, 113, 113];
    const textColor: [number, number, number] = [50, 50, 50];

    let yPos = 20;

    // ===== HEADER =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('MEF On Muhasebe', 14, 15);

    doc.setFontSize(12);
    doc.text(`Finansal Rapor - ${profileName}`, 14, 25);

    doc.setFontSize(10);
    doc.text(periodLabel, pageWidth - 14, 15, { align: 'right' });
    doc.text(`Olusturma: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 22, { align: 'right' });

    yPos = 50;

    // ===== SUMMARY CARDS =====
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.text('Finansal Ozet', 14, yPos);
    yPos += 10;

    // Summary boxes
    const boxWidth = (pageWidth - 42) / 3;
    const boxHeight = 25;

    // Income box
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(...incomeColor);
    doc.setFontSize(10);
    doc.text('Toplam Gelir', 14 + boxWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatAmount(totalIncome, currency), 14 + boxWidth / 2, yPos + 18, { align: 'center' });

    // Expense box
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14 + boxWidth + 7, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(...expenseColor);
    doc.setFontSize(10);
    doc.text('Toplam Gider', 14 + boxWidth + 7 + boxWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatAmount(totalExpense, currency), 14 + boxWidth + 7 + boxWidth / 2, yPos + 18, { align: 'center' });

    // Balance box
    const balanceColor = balance >= 0 ? incomeColor : expenseColor;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14 + (boxWidth + 7) * 2, yPos, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(...balanceColor);
    doc.setFontSize(10);
    doc.text('Net Bakiye', 14 + (boxWidth + 7) * 2 + boxWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatAmount(balance, currency), 14 + (boxWidth + 7) * 2 + boxWidth / 2, yPos + 18, { align: 'center' });

    yPos += boxHeight + 15;

    // ===== TRANSACTIONS TABLE =====
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.text('Islem Listesi', 14, yPos);
    yPos += 5;

    // Prepare table data
    const tableData = transactions.map((t) => {
        const categoryConfig = CATEGORY_CONFIG[t.category as TransactionCategory];
        return [
            formatDate(t.date),
            t.type === 'income' ? 'Gelir' : 'Gider',
            categoryConfig?.label || t.category,
            t.title,
            formatAmount(t.amount, currency),
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Tarih', 'Tur', 'Kategori', 'Baslik', 'Tutar']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: textColor,
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250],
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

    // ===== CATEGORY SUMMARY =====
    const newYPos = finalY + 15;

    if (newYPos < doc.internal.pageSize.getHeight() - 60) {
        doc.setTextColor(...textColor);
        doc.setFontSize(14);
        doc.text('Kategori Ozeti', 14, newYPos);

        // Group by category
        const categoryTotals: Record<string, { income: number; expense: number }> = {};

        transactions.forEach((t) => {
            const cat = CATEGORY_CONFIG[t.category as TransactionCategory]?.label || t.category;
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                categoryTotals[cat].income += t.amount;
            } else {
                categoryTotals[cat].expense += t.amount;
            }
        });

        const categoryData = Object.entries(categoryTotals).map(([cat, totals]) => [
            cat,
            totals.income > 0 ? formatAmount(totals.income, currency) : '-',
            totals.expense > 0 ? formatAmount(totals.expense, currency) : '-',
            formatAmount(totals.income - totals.expense, currency),
        ]);

        autoTable(doc, {
            startY: newYPos + 5,
            head: [['Kategori', 'Gelir', 'Gider', 'Net']],
            body: categoryData,
            theme: 'grid',
            headStyles: {
                fillColor: [100, 100, 100],
                textColor: [255, 255, 255],
                fontSize: 9,
            },
            bodyStyles: {
                fontSize: 8,
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 40, halign: 'right' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 40, halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });
    }

    // ===== FOOTER =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Sayfa ${i} / ${pageCount} - MEF On Muhasebe`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save file
    const fileName = `MEF_Rapor_${profileName}_${periodLabel.replace(/\s/g, '_')}.pdf`;
    doc.save(fileName);
};

// ============================================
// EXCEL EXPORT
// ============================================

export const generateExcel = (data: ExportData): void => {
    const { transactions, profileName, currency, periodLabel, totalIncome, totalExpense, balance } = data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // ===== SHEET 1: Summary =====
    const summaryData = [
        ['MEF On Muhasebe - Finansal Rapor'],
        [''],
        ['Profil:', profileName],
        ['Donem:', periodLabel],
        ['Olusturma Tarihi:', formatDate(new Date().toISOString())],
        [''],
        ['FINANSAL OZET'],
        [''],
        ['Toplam Gelir:', formatAmount(totalIncome, currency)],
        ['Toplam Gider:', formatAmount(totalExpense, currency)],
        ['Net Bakiye:', formatAmount(balance, currency)],
        [''],
        ['Islem Sayisi:', transactions.length],
        ['Gelir Islem Sayisi:', transactions.filter(t => t.type === 'income').length],
        ['Gider Islem Sayisi:', transactions.filter(t => t.type === 'expense').length],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ozet');

    // ===== SHEET 2: All Transactions =====
    const transactionHeaders = ['Tarih', 'Tur', 'Kategori', 'Baslik', 'Aciklama', 'Tutar', 'Tekrarlayan'];

    const transactionRows = transactions.map((t) => {
        const categoryConfig = CATEGORY_CONFIG[t.category as TransactionCategory];
        return [
            formatDate(t.date),
            t.type === 'income' ? 'Gelir' : 'Gider',
            categoryConfig?.label || t.category,
            t.title,
            t.description || '',
            t.amount,
            t.isRecurring ? 'Evet' : 'Hayir',
        ];
    });

    const transactionData = [transactionHeaders, ...transactionRows];
    const transactionsWs = XLSX.utils.aoa_to_sheet(transactionData);

    // Set column widths
    transactionsWs['!cols'] = [
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
        { wch: 40 },
        { wch: 15 },
        { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, transactionsWs, 'Islemler');

    // ===== SHEET 3: Category Summary =====
    const categoryTotals: Record<string, { income: number; expense: number; count: number }> = {};

    transactions.forEach((t) => {
        const cat = CATEGORY_CONFIG[t.category as TransactionCategory]?.label || t.category;
        if (!categoryTotals[cat]) {
            categoryTotals[cat] = { income: 0, expense: 0, count: 0 };
        }
        categoryTotals[cat].count++;
        if (t.type === 'income') {
            categoryTotals[cat].income += t.amount;
        } else {
            categoryTotals[cat].expense += t.amount;
        }
    });

    const categoryHeaders = ['Kategori', 'Islem Sayisi', 'Gelir', 'Gider', 'Net'];
    const categoryRows = Object.entries(categoryTotals).map(([cat, totals]) => [
        cat,
        totals.count,
        totals.income,
        totals.expense,
        totals.income - totals.expense,
    ]);

    // Add totals row
    categoryRows.push([
        'TOPLAM',
        transactions.length,
        totalIncome,
        totalExpense,
        balance,
    ]);

    const categoryData = [categoryHeaders, ...categoryRows];
    const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);

    // Set column widths
    categoryWs['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, categoryWs, 'Kategori Ozeti');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Save file
    const fileName = `MEF_Rapor_${profileName}_${periodLabel.replace(/\s/g, '_')}.xlsx`;
    saveAs(blob, fileName);
};

// ============================================
// HELPER: Calculate Period Data
// ============================================

export const calculatePeriodData = (
    transactions: Transaction[],
    profileName: string,
    currency: Currency,
    periodType: 'month' | 'quarter' | 'half' | 'year',
    year: number,
    month?: number
): ExportData => {
    let periodLabel = '';
    let startDate: Date;
    let endDate: Date;

    const monthNames = [
        'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
        'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
    ];

    switch (periodType) {
        case 'month':
            const m = month ?? new Date().getMonth();
            startDate = new Date(year, m, 1);
            endDate = new Date(year, m + 1, 0);
            periodLabel = `${monthNames[m]} ${year}`;
            break;
        case 'quarter':
            const q = Math.floor((month ?? new Date().getMonth()) / 3);
            startDate = new Date(year, q * 3, 1);
            endDate = new Date(year, (q + 1) * 3, 0);
            periodLabel = `${q + 1}. Ceyrek ${year}`;
            break;
        case 'half':
            const h = (month ?? new Date().getMonth()) < 6 ? 0 : 1;
            startDate = new Date(year, h * 6, 1);
            endDate = new Date(year, (h + 1) * 6, 0);
            periodLabel = h === 0 ? `Ilk Yari ${year}` : `Ikinci Yari ${year}`;
            break;
        case 'year':
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
            periodLabel = `${year} Yili`;
            break;
    }

    // Filter transactions by period
    const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });

    // Calculate totals
    const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        transactions: filteredTransactions,
        profileName,
        currency,
        periodLabel,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
    };
};
