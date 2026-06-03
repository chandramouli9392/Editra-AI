import React from "react";
import { cn } from "@/lib/utils";

interface PresetCardProps {
    name: string;
    isActive: boolean;
    onClick: () => void;
}

export default function PresetCard({ name, isActive, onClick }: PresetCardProps) {
    // Generate a pseudo-random background gradient based on name to simulate LUT look
    const gradients: Record<string, string> = {
        Cinematic: "from-blue-900/40 to-slate-800/40",
        Vibrant: "from-pink-500/30 to-orange-400/30",
        Monochrome: "from-zinc-500/30 to-zinc-800/30",
        Vintage: "from-amber-700/30 to-orange-900/30",
        Moody: "from-emerald-900/30 to-teal-900/30",
        "Teal & Orange": "from-teal-600/30 to-orange-500/30",
    };

    const gradient = gradients[name] || "from-indigo-500/20 to-purple-500/20";

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-xl h-24 flex items-end p-3 transition-all duration-300 border text-left group",
                isActive 
                    ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-[1.02]" 
                    : "border-white/10 hover:border-white/30 hover:bg-white/5"
            )}
        >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-80 transition-opacity", gradient)} />
            <span className={cn(
                "relative z-10 text-xs font-bold tracking-wider uppercase transition-colors",
                isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
            )}>
                {name}
            </span>
            {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,1)]" />
            )}
        </button>
    );
}
