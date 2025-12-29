/**
 * Profile Selection Page - Netflix Style Landing
 * 
 * Senior Developer Note:
 * Bu sayfa, uygulamanın giriş noktasıdır. Netflix'ten ilham alan
 * profil seçim ekranı ile kullanıcı deneyimi başlar.
 * 
 * Features:
 * - Staggered fade-in animations
 * - Color-coded avatar selection
 * - Flip card for new profile creation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, User, ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import { useStore, AVATAR_COLORS, type Currency } from '@/stores/useStore';

/**
 * Main Profile Selection Component
 */
export default function ProfileSelectionPage() {
  const router = useRouter();
  const { profiles, addProfile, selectProfile, checkAndPerformMonthlyCleanup } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration fix for Zustand persist + Monthly cleanup
  useEffect(() => {
    setMounted(true);
    // Check if we need to clean up old non-recurring transactions
    checkAndPerformMonthlyCleanup();
  }, [checkAndPerformMonthlyCleanup]);

  // Handle profile selection
  const handleSelectProfile = (profileId: string) => {
    selectProfile(profileId);
    router.push('/dashboard');
  };

  // Loading state for hydration
  if (!mounted) {
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
    <div className="min-h-screen gradient-anthracite-mesh flex flex-col items-center justify-center p-8">
      {/* Header with Logo */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* MEF Logo */}
        <motion.div
          className="flex flex-col items-center justify-center gap-4 mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <img
            src="/logo.png"
            alt="MEF Yapı & İnşaat"
            className="w-32 h-32 object-contain"
          />
        </motion.div>

        {/* App Name */}
        <motion.h1
          className="text-2xl font-semibold text-neutral-200 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          MEF Ön Muhasebe
        </motion.h1>

        <motion.p
          className="text-neutral-500 text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {showAddForm ? 'Yeni profil oluştur' : 'Profilinizi seçin'}
        </motion.p>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {showAddForm ? (
          <AddProfileForm
            key="form"
            onBack={() => setShowAddForm(false)}
            onSuccess={() => setShowAddForm(false)}
          />
        ) : (
          <ProfileGrid
            key="grid"
            profiles={profiles}
            onSelect={handleSelectProfile}
            onAddNew={() => setShowAddForm(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Profile Grid Component
 */
function ProfileGrid({
  profiles,
  onSelect,
  onAddNew,
}: {
  profiles: { id: string; name: string; avatarColor: string; currency: string; createdAt: string }[];
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  const { deleteProfile } = useStore();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
    },
  };

  const handleDeleteClick = (e: React.MouseEvent, profile: { id: string; name: string }) => {
    e.stopPropagation(); // Prevent profile selection
    setDeleteConfirm({ id: profile.id, name: profile.name });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteProfile(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <motion.div
        className="flex flex-wrap justify-center gap-8 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Existing Profiles */}
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            className="group relative flex flex-col items-center gap-3"
            variants={itemVariants}
          >
            {/* Delete Button - Top Right */}
            <motion.button
              className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full
                         bg-neutral-800/80 backdrop-blur-sm border border-white/10
                         flex items-center justify-center
                         opacity-0 group-hover:opacity-100
                         text-neutral-400 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50
                         transition-all duration-200"
              onClick={(e) => handleDeleteClick(e, profile)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>

            {/* Clickable Profile Card */}
            <motion.button
              className="flex flex-col items-center gap-3"
              onClick={() => onSelect(profile.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Avatar */}
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center
                           transition-all duration-300 group-hover:ring-4 group-hover:ring-white/30
                           shadow-lg group-hover:shadow-xl"
                style={{ backgroundColor: profile.avatarColor }}
              >
                <span className="text-4xl font-bold text-white/90 uppercase">
                  {profile.name.charAt(0)}
                </span>
              </div>

              {/* Name */}
              <span className="text-neutral-300 text-lg font-medium 
                               group-hover:text-white transition-colors">
                {profile.name}
              </span>
            </motion.button>
          </motion.div>
        ))}

        {/* Add New Profile Button */}
        <motion.button
          className="group flex flex-col items-center gap-3"
          variants={itemVariants}
          onClick={onAddNew}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center
                       bg-white/5 border-2 border-dashed border-white/20
                       transition-all duration-300 
                       group-hover:border-cyan-400 group-hover:bg-cyan-400/10"
          >
            <Plus className="w-12 h-12 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <span className="text-neutral-500 text-lg font-medium 
                           group-hover:text-cyan-400 transition-colors">
            Profil Ekle
          </span>
        </motion.button>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
            />

            {/* Modal */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                         w-full max-w-md mx-4 glass-card p-6"
              initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-rose-500/20 mx-auto mb-4
                              flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white text-center mb-2">
                Profili Sil
              </h3>

              {/* Message */}
              <p className="text-neutral-400 text-center mb-6">
                <span className="text-white font-medium">{deleteConfirm.name}</span> profilini silmek istediğinize emin misiniz?
                Bu işlem geri alınamaz ve tüm işlemler silinecektir.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-xl font-medium
                             bg-white/5 border border-white/10 text-neutral-300
                             hover:bg-white/10 transition-colors"
                  onClick={() => setDeleteConfirm(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  İptal
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-xl font-medium
                             bg-rose-500 text-white
                             hover:bg-rose-600 transition-colors
                             shadow-lg shadow-rose-500/30"
                  onClick={handleConfirmDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Evet, Sil
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Add Profile Form Component
 */
function AddProfileForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { addProfile } = useStore();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('TRY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    // Small delay for animation effect
    setTimeout(() => {
      addProfile(name.trim(), selectedColor, selectedCurrency);
      setIsSubmitting(false);
      onSuccess();
    }, 300);
  };

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'TRY', label: 'Türk Lirası', symbol: '₺' },
    { value: 'USD', label: 'ABD Doları', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
  ];

  return (
    <motion.form
      className="w-full max-w-md glass-card p-8"
      initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onSubmit={handleSubmit}
    >
      {/* Back Button */}
      <motion.button
        type="button"
        className="flex items-center gap-2 text-neutral-400 hover:text-white 
                   transition-colors mb-6"
        onClick={onBack}
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Geri
      </motion.button>

      {/* Avatar Preview */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: selectedColor }}
          animate={{ backgroundColor: selectedColor }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-3xl font-bold text-white/90 uppercase">
            {name.charAt(0) || <User className="w-10 h-10 text-white/50" />}
          </span>
        </motion.div>
      </div>

      {/* Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-400 mb-2">
          Profil Adı
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="İsminizi girin"
          className="input-dark"
          maxLength={20}
          autoFocus
        />
      </div>

      {/* Color Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-400 mb-3">
          Avatar Rengi
        </label>
        <div className="flex flex-wrap gap-3">
          {AVATAR_COLORS.map((color) => (
            <motion.button
              key={color}
              type="button"
              className={`w-10 h-10 rounded-xl transition-all ${selectedColor === color
                ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                : 'hover:scale-105'
                }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              whileHover={{ scale: selectedColor === color ? 1.1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Currency Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-neutral-400 mb-3">
          Para Birimi
        </label>
        <div className="grid grid-cols-3 gap-3">
          {currencies.map((curr) => (
            <motion.button
              key={curr.value}
              type="button"
              className={`py-3 px-4 rounded-xl text-center transition-all ${selectedCurrency === curr.value
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              onClick={() => setSelectedCurrency(curr.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="block text-xl mb-1">{curr.symbol}</span>
              <span className="text-xs opacity-70">{curr.value}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!name.trim() || isSubmitting}
        className={`w-full py-4 rounded-xl font-semibold text-lg
                   transition-all duration-300 ${name.trim()
            ? 'btn-primary'
            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        whileHover={name.trim() ? { scale: 1.02 } : {}}
        whileTap={name.trim() ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Oluşturuluyor...
          </motion.span>
        ) : (
          'Profil Oluştur'
        )}
      </motion.button>
    </motion.form>
  );
}
