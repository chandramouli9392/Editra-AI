'use client';

import { motion } from 'framer-motion';
import {
  Wand2,
  Globe2,
  MicOff,
  Zap,
  Network,
  Clapperboard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import GetProModal from './GetProModal';

const NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { id: 'neural-graph', label: 'Neural Graph', icon: Network },
    ],
  },
  {
    title: 'Core Editing',
    items: [
      { id: 'retroactive-director', label: 'Retroactive Director', icon: Clapperboard },
      { id: 'polyglot-editor', label: 'Polyglot Dubbing', icon: Globe2 },
    ],
  },
  {
    title: 'Enhancement',
    items: [
      { id: 'clean-talk', label: 'Clean Talk', icon: MicOff },
      { id: 'instant-jump', label: 'Instant Jump', icon: Zap },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('');
  const [proModalOpen, setProModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveItem(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <GetProModal open={proModalOpen} onClose={() => setProModalOpen(false)} />

      <aside
        className={cn(
          'w-60 flex-shrink-0 h-full flex flex-col bg-[#0a0a18]/80 border-r border-white/5 backdrop-blur-xl z-20 overflow-hidden',
          className
        )}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Wand2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight leading-none">Editra</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-400/80 font-bold mt-0.5">AI Video Studio</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25 px-2 mb-2">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeItem === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                          isActive
                            ? 'bg-indigo-500/15 text-white'
                            : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full"
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                          />
                        )}
                        <item.icon
                          size={16}
                          className={cn(
                            'flex-shrink-0 transition-colors',
                            isActive ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60'
                          )}
                        />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Get Pro */}
        <div className="p-3 border-t border-white/5">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-indigo-500/10 border border-indigo-500/25 group">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors duration-500" />
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles size={14} />
                <span className="text-sm font-bold">CreatorPro</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Unlock 4K exports, unlimited AI minutes &amp; priority rendering.
              </p>
              <button
                onClick={() => setProModalOpen(true)}
                className="w-full py-2 bg-white text-black rounded-lg text-xs font-black tracking-wider uppercase transition-opacity hover:opacity-90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
