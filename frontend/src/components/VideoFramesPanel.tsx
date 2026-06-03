'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoFrame {
  url: string;
  time: number;
}

interface VideoFramesPanelProps {
  frames: VideoFrame[];
  isExtracting?: boolean;
  currentTime?: number;
  onFrameClick?: (time: number) => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '00')}`;
}

export default function VideoFramesPanel({
  frames,
  isExtracting,
  currentTime = 0,
  onFrameClick,
}: VideoFramesPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          <Film size={12} />
          <span>Timeline Frames</span>
        </label>
        {frames.length > 0 && (
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
            {frames.length} frames
          </span>
        )}
      </div>

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-white/[0.02] relative overflow-hidden',
          frames.length === 0 ? 'min-h-[100px]' : 'p-3'
        )}
      >
        <AnimatePresence mode="wait">
          {isExtracting && frames.length === 0 ? (
            <motion.div
              key="extracting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">
                Generating frames...
              </span>
            </motion.div>
          ) : frames.length > 0 ? (
            <motion.div
              key="frames"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-0.5"
            >
              {frames.map((frame, idx) => {
                const nextTime = frames[idx + 1]?.time ?? Infinity;
                const isActive = currentTime >= frame.time && currentTime < nextTime;
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    onClick={() => onFrameClick?.(frame.time)}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden border-2 transition-all group',
                      isActive
                        ? 'border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                        : 'border-transparent hover:border-white/20'
                    )}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${frame.url})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                      <span className="flex items-center gap-0.5 text-white text-[8px] font-mono bg-black/60 px-1.5 py-0.5 rounded">
                        <Clock size={7} />
                        {formatTime(frame.time)}
                      </span>
                    </div>
                    {isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4"
            >
              <Film size={20} className="text-white/10" />
              <span className="text-[10px] text-white/30">
                Upload a video clip to auto-generate timeline frames
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
