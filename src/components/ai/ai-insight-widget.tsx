/**
 * AI Insight Widget - Antigravity UI
 * 
 * Senior Developer Note:
 * Dashboard'un köşesinde yer alacak yapay zeka finansal danışman widget'ı.
 * Chat benzeri arayüz ile akıllı öneriler sunar.
 * 
 * Simülasyon: Gerçek AI entegrasyonu olmadan, preset öneriler gösterir.
 * Production'da OpenAI/Anthropic API'si ile entegre edilebilir.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    ChevronRight,
    MessageCircle,
    X,
    Send,
} from 'lucide-react';
import { useState } from 'react';

type InsightType = 'tip' | 'warning' | 'positive' | 'negative';

interface AIInsight {
    id: string;
    type: InsightType;
    title: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
}

// Örnek AI önerileri
const sampleInsights: AIInsight[] = [
    {
        id: '1',
        type: 'warning',
        title: 'Pazarlama Giderleri Artışta',
        message: 'Geçen aya göre pazarlama giderlerin %15 arttı. Nakit akışını dengelemek için tahsilatları hızlandırmalısın.',
        actionLabel: 'Tahsilatları Gör',
        actionHref: '/invoices?filter=pending',
    },
    {
        id: '2',
        type: 'positive',
        title: 'Gelir Trendi Olumlu',
        message: 'Son 3 aydır gelirlerin düzenli olarak artıyor. Bu hızla yıl sonu hedefini aşabilirsin!',
    },
    {
        id: '3',
        type: 'tip',
        title: 'Vergi Optimizasyonu',
        message: 'Bu çeyrekte ₺12.500 vergi indirimi potansiyeli tespit edildi. Gider faturalarını kontrol et.',
        actionLabel: 'Detayları Gör',
    },
];

// İkon ve renk konfigürasyonu
const insightConfig: Record<
    InsightType,
    { icon: typeof Sparkles; bgColor: string; borderColor: string; iconColor: string }
> = {
    tip: {
        icon: Lightbulb,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
        iconColor: 'text-amber-500',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200 dark:border-rose-800/50',
        iconColor: 'text-rose-500',
    },
    positive: {
        icon: TrendingUp,
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800/50',
        iconColor: 'text-emerald-500',
    },
    negative: {
        icon: TrendingDown,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800/50',
        iconColor: 'text-red-500',
    },
};

/**
 * Tek bir insight kartı.
 */
function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
    const config = insightConfig[insight.type];
    const Icon = config.icon;

    return (
        <motion.div
            className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor}
                  transition-all duration-300`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${config.iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                        {insight.title}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                        {insight.message}
                    </p>
                    {insight.actionLabel && (
                        <motion.button
                            className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400
                         flex items-center gap-1 hover:gap-2 transition-all"
                            whileHover={{ x: 2 }}
                        >
                            {insight.actionLabel}
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/**
 * AI Insight Widget - Ana bileşen.
 */
export function AIInsightWidget({ className = '' }: { className?: string }) {
    const [insights] = useState<AIInsight[]>(sampleInsights);

    return (
        <motion.div
            className={`rounded-2xl overflow-hidden
                  bg-gradient-to-br from-violet-500/5 to-purple-500/5
                  dark:from-violet-500/10 dark:to-purple-500/10
                  border border-violet-200/50 dark:border-violet-800/30
                  backdrop-blur-sm ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="p-4 border-b border-violet-200/30 dark:border-violet-800/30
                      flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500
                        flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                        AI Finansal Danışman
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        3 yeni öneri
                    </p>
                </div>
            </div>

            {/* Insights List */}
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                    {insights.map((insight, index) => (
                        <InsightCard key={insight.id} insight={insight} index={index} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer - Chat Prompt */}
            <div className="p-4 border-t border-violet-200/30 dark:border-violet-800/30">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="AI'a bir soru sor..."
                        className="flex-1 h-10 px-4 rounded-xl
                       bg-white/50 dark:bg-neutral-800/50
                       border border-neutral-200/50 dark:border-neutral-700/50
                       text-sm text-neutral-900 dark:text-white
                       placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-violet-500/30
                       transition-all"
                    />
                    <motion.button
                        className="h-10 w-10 rounded-xl
                       bg-gradient-to-br from-violet-500 to-purple-500
                       text-white flex items-center justify-center
                       shadow-lg shadow-violet-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Send className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Mini AI Insight Badge - Dashboard köşesi için kompakt versiyon.
 */
export function AIInsightBadge({
    count = 3,
    onClick,
}: {
    count?: number;
    onClick?: () => void;
}) {
    return (
        <motion.button
            className="fixed bottom-6 left-6 z-50
                 h-14 px-4 rounded-2xl
                 bg-gradient-to-br from-violet-500 to-purple-500
                 text-white flex items-center gap-3
                 shadow-xl shadow-violet-500/40
                 hover:shadow-violet-500/50
                 transition-shadow"
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="relative">
                <Sparkles className="w-5 h-5" />
                <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </div>
            <span className="font-medium text-sm">
                {count} AI Öneri
            </span>
        </motion.button>
    );
}

/**
 * AI Chat Modal - Tam ekran chat arayüzü.
 */
export function AIChatModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Merhaba! Ben NovaFlow AI asistanıyım. Finansal durumunuz hakkında nasıl yardımcı olabilirim?',
        },
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages((prev) => [
            ...prev,
            { role: 'user', content: input },
            {
                role: 'assistant',
                content: 'Sorunuzu analiz ediyorum... Bu bir demo versiyonu olduğu için gerçek AI yanıtı üretilmiyor. Production\'da OpenAI veya Anthropic API\'si entegre edilecek.',
            },
        ]);
        setInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg h-[600px] rounded-3xl overflow-hidden
                       bg-white dark:bg-neutral-900
                       shadow-2xl flex flex-col"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800
                           flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500
                               flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                                        AI Asistan
                                    </h3>
                                    <p className="text-xs text-emerald-500">Çevrimiçi</p>
                                </div>
                            </div>
                            <motion.button
                                className="w-8 h-8 rounded-lg flex items-center justify-center
                          text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-md'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Mesajınızı yazın..."
                                    className="flex-1 h-12 px-4 rounded-xl
                            bg-neutral-100 dark:bg-neutral-800
                            text-neutral-900 dark:text-white
                            placeholder:text-neutral-400
                            focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                />
                                <motion.button
                                    className="h-12 w-12 rounded-xl
                            bg-gradient-to-br from-violet-500 to-purple-500
                            text-white flex items-center justify-center"
                                    onClick={handleSend}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
