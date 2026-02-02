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
    TRY: 'TL',
    USD: '$',
    EUR: 'EUR',
};

// ============================================
// TURKISH CHARACTER CONVERSION
// ============================================

const turkishToAscii = (text: string): string => {
    const charMap: Record<string, string> = {
        'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ç': 'c', 'Ç': 'C',
        '₺': 'TL',
    };

    return text.replace(/[ğĞüÜşŞıİöÖçÇ₺]/g, (char) => charMap[char] || char);
};

// ============================================
// FORMAT HELPERS
// ============================================

const formatAmount = (amount: number, currency: Currency): string => {
    const formatted = amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${formatted} ${CURRENCY_SYMBOLS[currency]}`;
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatDateLong = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
        'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// ============================================
// PIE CHART DRAWING HELPER
// ============================================

interface PieSlice {
    label: string;
    value: number;
    color: [number, number, number];
}

const drawPieChart = (
    doc: jsPDF,
    slices: PieSlice[],
    centerX: number,
    centerY: number,
    radius: number,
    title: string
): number => {
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return centerY;

    // Title
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(title, centerX, centerY - radius - 8, { align: 'center' });

    // Draw pie slices
    let currentAngle = -Math.PI / 2; // Start from top

    slices.forEach((slice) => {
        if (slice.value === 0) return;

        const sliceAngle = (slice.value / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;

        // Draw slice using lines (approximation)
        doc.setFillColor(...slice.color);
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);

        // Create path for slice
        const steps = 50;
        const points: [number, number][] = [[centerX, centerY]];

        for (let i = 0; i <= steps; i++) {
            const angle = currentAngle + (sliceAngle * i) / steps;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push([x, y]);
        }
        points.push([centerX, centerY]);

        // Draw filled polygon
        doc.setFillColor(...slice.color);
        // @ts-ignore - jsPDF polygon method
        const polygonPath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ') + ' Z';

        // Use triangle fan approach for better compatibility
        for (let i = 1; i < points.length - 1; i++) {
            doc.triangle(
                points[0][0], points[0][1],
                points[i][0], points[i][1],
                points[i + 1][0], points[i + 1][1],
                'F'
            );
        }

        // Draw percentage label in the middle of slice
        const midAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const labelX = centerX + labelRadius * Math.cos(midAngle);
        const labelY = centerY + labelRadius * Math.sin(midAngle);

        const percentage = ((slice.value / total) * 100).toFixed(1);
        if (parseFloat(percentage) >= 5) { // Only show if >= 5%
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(`${percentage}%`, labelX, labelY, { align: 'center' });
        }

        currentAngle = endAngle;
    });

    // Draw center circle (donut effect)
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, radius * 0.4, 'F');

    // Center text
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('TOPLAM', centerX, centerY - 3, { align: 'center' });

    // Return bottom Y for legend placement
    return centerY + radius + 5;
};

const drawLegend = (
    doc: jsPDF,
    slices: PieSlice[],
    startX: number,
    startY: number,
    currency: Currency
): void => {
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    let y = startY;

    slices.forEach((slice) => {
        if (slice.value === 0) return;

        // Color box
        doc.setFillColor(...slice.color);
        doc.roundedRect(startX, y - 3, 8, 8, 1, 1, 'F');

        // Label
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(slice.label, startX + 12, y + 2);

        // Amount and percentage
        const percentage = ((slice.value / total) * 100).toFixed(1);
        doc.setFont('helvetica', 'bold');
        doc.text(
            `${formatAmount(slice.value, currency)} (${percentage}%)`,
            startX + 12,
            y + 9
        );

        y += 18;
    });
};

// Chart Colors Palette (Professional)
const CHART_COLORS: [number, number, number][] = [
    [239, 68, 68],    // Red
    [249, 115, 22],   // Orange
    [234, 179, 8],    // Yellow
    [34, 197, 94],    // Green
    [6, 182, 212],    // Cyan
    [99, 102, 241],   // Indigo
    [168, 85, 247],   // Purple
    [236, 72, 153],   // Pink
    [107, 114, 128],  // Gray
    [20, 184, 166],   // Teal
];

// ============================================
// PDF EXPORT - PROFESSIONAL DESIGN
// ============================================

export const generatePDF = (data: ExportData): void => {
    const { transactions, profileName, currency, periodLabel, totalIncome, totalExpense, balance } = data;

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Color Palette - Professional Dark Theme
    const colors = {
        primary: [74, 144, 164] as [number, number, number],
        secondary: [139, 92, 246] as [number, number, number],
        income: [34, 197, 94] as [number, number, number],
        expense: [239, 68, 68] as [number, number, number],
        dark: [26, 26, 26] as [number, number, number],
        text: [50, 50, 50] as [number, number, number],
        lightGray: [245, 245, 245] as [number, number, number],
        mediumGray: [200, 200, 200] as [number, number, number],
    };

    let yPos = 0;

    // ===== HEADER SECTION =====
    // Gradient Header Background
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Accent Line
    doc.setFillColor(...colors.primary);
    doc.rect(0, 50, pageWidth, 3, 'F');

    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MEF ON MUHASEBE', 14, 22);

    // Subtitle
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Finansal Rapor', 14, 32);

    // Profile Badge
    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(14, 38, 60, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.text(turkishToAscii(profileName), 18, 44);

    // Period & Date (Right Side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(turkishToAscii(periodLabel), pageWidth - 14, 22, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`Olusturma: ${formatDateLong(new Date().toISOString())}`, pageWidth - 14, 32, { align: 'right' });

    yPos = 65;

    // ===== SUMMARY SECTION =====
    doc.setTextColor(...colors.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANSAL OZET', 14, yPos);

    yPos += 10;

    // Summary Cards
    const cardWidth = (pageWidth - 42) / 3;
    const cardHeight = 35;
    const cardY = yPos;

    // Income Card
    doc.setFillColor(240, 253, 244); // Light green
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.income);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 4, 4, 'S');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('TOPLAM GELIR', 14 + cardWidth / 2, cardY + 12, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...colors.income);
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(totalIncome, currency), 14 + cardWidth / 2, cardY + 25, { align: 'center' });

    // Expense Card
    const expenseCardX = 14 + cardWidth + 7;
    doc.setFillColor(254, 242, 242); // Light red
    doc.roundedRect(expenseCardX, cardY, cardWidth, cardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.expense);
    doc.roundedRect(expenseCardX, cardY, cardWidth, cardHeight, 4, 4, 'S');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('TOPLAM GIDER', expenseCardX + cardWidth / 2, cardY + 12, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...colors.expense);
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(totalExpense, currency), expenseCardX + cardWidth / 2, cardY + 25, { align: 'center' });

    // Balance Card
    const balanceCardX = 14 + (cardWidth + 7) * 2;
    const balanceColor = balance >= 0 ? colors.income : colors.expense;
    doc.setFillColor(245, 245, 250); // Light purple
    doc.roundedRect(balanceCardX, cardY, cardWidth, cardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.secondary);
    doc.roundedRect(balanceCardX, cardY, cardWidth, cardHeight, 4, 4, 'S');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('NET BAKIYE', balanceCardX + cardWidth / 2, cardY + 12, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...balanceColor);
    doc.setFont('helvetica', 'bold');
    const balanceText = (balance >= 0 ? '+' : '') + formatAmount(balance, currency);
    doc.text(balanceText, balanceCardX + cardWidth / 2, cardY + 25, { align: 'center' });

    yPos = cardY + cardHeight + 20;

    // ===== TRANSACTIONS TABLE =====
    doc.setTextColor(...colors.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ISLEM LISTESI', 14, yPos);

    // Transaction count badge
    doc.setFillColor(...colors.primary);
    doc.roundedRect(75, yPos - 5, 25, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${transactions.length} adet`, 87.5, yPos, { align: 'center' });

    yPos += 8;

    // Prepare table data
    const tableData = transactions.map((t, index) => {
        const categoryConfig = CATEGORY_CONFIG[t.category as TransactionCategory];
        const typeLabel = t.type === 'income' ? 'Gelir' : 'Gider';
        const amountPrefix = t.type === 'income' ? '+' : '-';

        return [
            (index + 1).toString(),
            formatDate(t.date),
            typeLabel,
            turkishToAscii(categoryConfig?.label || t.category),
            turkishToAscii(t.title),
            `${amountPrefix}${formatAmount(t.amount, currency)}`,
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Tarih', 'Tur', 'Kategori', 'Baslik', 'Tutar']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: colors.dark,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 4,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250],
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 18 },
            3: { cellWidth: 30 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
            // Color amount cells based on type
            if (data.column.index === 5 && data.section === 'body') {
                const cellText = data.cell.raw as string;
                if (cellText.startsWith('+')) {
                    data.cell.styles.textColor = colors.income;
                } else if (cellText.startsWith('-')) {
                    data.cell.styles.textColor = colors.expense;
                }
            }
            // Color type column
            if (data.column.index === 2 && data.section === 'body') {
                const cellText = data.cell.raw as string;
                if (cellText === 'Gelir') {
                    data.cell.styles.textColor = colors.income;
                } else {
                    data.cell.styles.textColor = colors.expense;
                }
            }
        },
    });

    // Get final Y after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

    // ===== CATEGORY SUMMARY =====
    if (finalY < pageHeight - 80) {
        let catY = finalY + 15;

        doc.setTextColor(...colors.text);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('KATEGORI OZETI', 14, catY);

        catY += 8;

        // Group by category
        const categoryTotals: Record<string, { income: number; expense: number }> = {};

        transactions.forEach((t) => {
            const cat = turkishToAscii(CATEGORY_CONFIG[t.category as TransactionCategory]?.label || t.category);
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
            totals.income > 0 ? `+${formatAmount(totals.income, currency)}` : '-',
            totals.expense > 0 ? `-${formatAmount(totals.expense, currency)}` : '-',
            formatAmount(totals.income - totals.expense, currency),
        ]);

        autoTable(doc, {
            startY: catY,
            head: [['Kategori', 'Gelir', 'Gider', 'Net']],
            body: categoryData,
            theme: 'plain',
            headStyles: {
                fillColor: colors.secondary,
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
                cellPadding: 4,
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 40, halign: 'right' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const cellText = data.cell.raw as string;
                    if (data.column.index === 1 && cellText.startsWith('+')) {
                        data.cell.styles.textColor = colors.income;
                    }
                    if (data.column.index === 2 && cellText.startsWith('-')) {
                        data.cell.styles.textColor = colors.expense;
                    }
                    if (data.column.index === 3) {
                        const value = parseFloat(cellText.replace(/[^\d.-]/g, ''));
                        data.cell.styles.textColor = value >= 0 ? colors.income : colors.expense;
                    }
                }
            },
        });
    }

    // ===== NEW PAGE: PIE CHARTS & KPIs =====
    doc.addPage();

    // Page Header
    doc.setFillColor(...colors.dark);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 35, pageWidth, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GORSEL ANALIZ', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`${turkishToAscii(periodLabel)} - Kategori Bazli Dagilim`, 14, 30);

    let chartY = 55;

    // ===== EXPENSE PIE CHART =====
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const expenseByCategory: Record<string, number> = {};

    expenseTransactions.forEach(t => {
        const cat = turkishToAscii(CATEGORY_CONFIG[t.category as TransactionCategory]?.label || t.category);
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    });

    // Sort by value and create slices
    const expenseSlices: PieSlice[] = Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8) // Max 8 categories
        .map(([label, value], index) => ({
            label,
            value,
            color: CHART_COLORS[index % CHART_COLORS.length],
        }));

    if (expenseSlices.length > 0) {
        // Draw expense pie chart
        const pieRadius = 35;
        const pieCenterX = 55;
        const pieCenterY = chartY + pieRadius + 15;

        drawPieChart(doc, expenseSlices, pieCenterX, pieCenterY, pieRadius, 'GIDER DAGILIMI');

        // Draw legend to the right
        drawLegend(doc, expenseSlices, pieCenterX + pieRadius + 25, chartY + 10, currency);
    }

    // ===== INCOME PIE CHART =====
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    if (incomeTransactions.length > 0) {
        chartY += 110;

        const incomeByCategory: Record<string, number> = {};
        incomeTransactions.forEach(t => {
            const cat = turkishToAscii(CATEGORY_CONFIG[t.category as TransactionCategory]?.label || t.category);
            incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
        });

        const incomeSlices: PieSlice[] = Object.entries(incomeByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, value], index) => ({
                label,
                value,
                color: CHART_COLORS[(index + 3) % CHART_COLORS.length], // Offset colors
            }));

        const pieRadius = 35;
        const pieCenterX = 55;
        const pieCenterY = chartY + pieRadius + 15;

        drawPieChart(doc, incomeSlices, pieCenterX, pieCenterY, pieRadius, 'GELIR DAGILIMI');
        drawLegend(doc, incomeSlices, pieCenterX + pieRadius + 25, chartY + 10, currency);
    }

    // ===== KPI METRICS SECTION =====
    let kpiY = 220;

    doc.setTextColor(...colors.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANS GOSTERGELERI', 14, kpiY);

    kpiY += 12;

    // KPI Cards Row
    const kpiCardWidth = (pageWidth - 56) / 3;
    const kpiCardHeight = 40;

    // KPI 1: Average Transaction
    const avgTransaction = transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        : 0;

    doc.setFillColor(245, 245, 250);
    doc.roundedRect(14, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Ortalama Islem', 14 + kpiCardWidth / 2, kpiY + 12, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(avgTransaction, currency), 14 + kpiCardWidth / 2, kpiY + 28, { align: 'center' });

    // KPI 2: Daily Average Expense
    const uniqueDays = new Set(transactions.map(t => t.date)).size;
    const dailyAvgExpense = uniqueDays > 0 ? totalExpense / uniqueDays : 0;

    const kpi2X = 14 + kpiCardWidth + 14;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(kpi2X, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.expense);
    doc.roundedRect(kpi2X, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Gunluk Ort. Gider', kpi2X + kpiCardWidth / 2, kpiY + 12, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...colors.expense);
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(dailyAvgExpense, currency), kpi2X + kpiCardWidth / 2, kpiY + 28, { align: 'center' });

    // KPI 3: Savings Rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const kpi3X = 14 + (kpiCardWidth + 14) * 2;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(kpi3X, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.income);
    doc.roundedRect(kpi3X, kpiY, kpiCardWidth, kpiCardHeight, 4, 4, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Tasarruf Orani', kpi3X + kpiCardWidth / 2, kpiY + 12, { align: 'center' });

    doc.setFontSize(12);
    const savingsColor = savingsRate >= 0 ? colors.income : colors.expense;
    doc.setTextColor(savingsColor[0], savingsColor[1], savingsColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`%${savingsRate.toFixed(1)}`, kpi3X + kpiCardWidth / 2, kpiY + 28, { align: 'center' });

    // ===== FOOTER =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(...colors.mediumGray);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `MEF On Muhasebe - Finansal Rapor`,
            14,
            pageHeight - 8
        );
        doc.text(
            `Sayfa ${i} / ${pageCount}`,
            pageWidth - 14,
            pageHeight - 8,
            { align: 'right' }
        );
    }

    // Save file
    const fileName = `MEF_Rapor_${turkishToAscii(profileName)}_${turkishToAscii(periodLabel).replace(/\s/g, '_')}.pdf`;
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
        ['MEF Ön Muhasebe - Finansal Rapor'],
        [''],
        ['Profil:', profileName],
        ['Dönem:', periodLabel],
        ['Oluşturma Tarihi:', formatDate(new Date().toISOString())],
        [''],
        ['FİNANSAL ÖZET'],
        [''],
        ['Toplam Gelir:', formatAmount(totalIncome, currency)],
        ['Toplam Gider:', formatAmount(totalExpense, currency)],
        ['Net Bakiye:', formatAmount(balance, currency)],
        [''],
        ['İşlem Sayısı:', transactions.length],
        ['Gelir İşlem Sayısı:', transactions.filter(t => t.type === 'income').length],
        ['Gider İşlem Sayısı:', transactions.filter(t => t.type === 'expense').length],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');

    // ===== SHEET 2: All Transactions =====
    const transactionHeaders = ['Tarih', 'Tür', 'Kategori', 'Başlık', 'Açıklama', 'Tutar', 'Tekrarlayan'];

    const transactionRows = transactions.map((t) => {
        const categoryConfig = CATEGORY_CONFIG[t.category as TransactionCategory];
        return [
            formatDate(t.date),
            t.type === 'income' ? 'Gelir' : 'Gider',
            categoryConfig?.label || t.category,
            t.title,
            t.description || '',
            t.amount,
            t.isRecurring ? 'Evet' : 'Hayır',
        ];
    });

    const transactionData = [transactionHeaders, ...transactionRows];
    const transactionsWs = XLSX.utils.aoa_to_sheet(transactionData);
    transactionsWs['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, transactionsWs, 'İşlemler');

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

    const categoryHeaders = ['Kategori', 'İşlem Sayısı', 'Gelir', 'Gider', 'Net'];
    const categoryRows = Object.entries(categoryTotals).map(([cat, totals]) => [
        cat, totals.count, totals.income, totals.expense, totals.income - totals.expense,
    ]);
    categoryRows.push(['TOPLAM', transactions.length, totalIncome, totalExpense, balance]);

    const categoryData = [categoryHeaders, ...categoryRows];
    const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
    categoryWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, categoryWs, 'Kategori Özeti');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

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

    const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });

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
