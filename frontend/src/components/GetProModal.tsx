'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Check,
  CreditCard,
  Smartphone,
  Globe,
  Building2,
  Wallet,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface GetProModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Unlimited exports',
  'Advanced AI editing tools',
  'Priority rendering',
  '4K resolution output',
  'Future AI features — early access',
];

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Razorpay', icon: Zap, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/60' },
  { id: 'phonepe', label: 'PhonePe', icon: Smartphone, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/60' },
  { id: 'upi', label: 'UPI', icon: Wallet, color: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400/60' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/60' },
  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400/60' },
  { id: 'paypal', label: 'PayPal', icon: Globe, color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 hover:border-sky-400/60' },
];

export default function GetProModal({ open, onClose }: GetProModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('razorpay');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = () => {
    setSubscribing(true);
    // Placeholder: no real payment backend yet
    setTimeout(() => {
      setSubscribing(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0c0c1f]/95 shadow-2xl shadow-black/60 backdrop-blur-2xl"
          >
            {/* Glow accent */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <X size={14} />
            </button>

            <div className="relative z-10 p-7 space-y-6">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-2">
                  <Sparkles size={11} />
                  <span>Limited Offer</span>
                </div>
                <h2 className="text-2xl font-black text-white">Upgrade to CreatorPro</h2>
                <p className="text-white/50 text-sm">Unlock the full Editra experience</p>
              </div>

              {/* Pricing card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/25 via-purple-600/15 to-indigo-500/10 border border-indigo-500/30 p-5">
                <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">CreatorPro</p>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-4xl font-black text-white">₹499</span>
                        <span className="text-white/40 text-sm mb-1">/ month</span>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold">
                      SAVE 40%
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/30 flex items-center justify-center">
                          <Check size={9} className="text-indigo-300" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Payment Methods</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedPayment === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-br transition-all duration-200 text-left ${method.color} ${
                          isSelected
                            ? 'ring-2 ring-indigo-500/60 ring-offset-1 ring-offset-transparent text-white'
                            : 'text-white/60 hover:text-white/90'
                        }`}
                      >
                        <Icon size={15} className="flex-shrink-0" />
                        <span className="text-xs font-semibold leading-tight">{method.label}</span>
                        {isSelected && (
                          <span className="ml-auto flex-shrink-0 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Check size={8} strokeWidth={3} className="text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm tracking-wide uppercase transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Subscribe Now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>

              <p className="text-center text-[10px] text-white/25">
                Secure payment · Cancel anytime · No hidden fees
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
