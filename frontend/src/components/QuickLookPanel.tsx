import React, { useState } from "react";
import { Palette, PlayCircle, Loader2 } from "lucide-react";
import PresetCard from "./PresetCard";
import { applyQuickLookPreset } from "@/lib/quicklook.service";

interface QuickLookPanelProps {
    videoFile: File | string | null;
    onApplySuccess: (newVideoUrl: string) => void;
    onError: (error: string) => void;
}

const PRESETS = [
    "Cinematic",
    "Vibrant",
    "Monochrome",
    "Vintage",
    "Moody",
    "Teal & Orange"
];

export default function QuickLookPanel({ videoFile, onApplySuccess, onError }: QuickLookPanelProps) {
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApply = async () => {
        if (!videoFile) {
            onError("Please generate or upload a video first to apply a color grade.");
            return;
        }
        if (!selectedPreset) {
            onError("Please select a preset first.");
            return;
        }

        setIsProcessing(true);
        try {
            const newUrl = await applyQuickLookPreset(videoFile, selectedPreset);
            onApplySuccess(newUrl);
        } catch (error: any) {
            onError(error.message || "Failed to apply preset");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <section className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-indigo-400">
                    <Palette size={14} />
                    <span>Quick Look Presets</span>
                </label>
                {selectedPreset && (
                    <button
                        onClick={() => setSelectedPreset(null)}
                        className="text-[10px] text-white/40 hover:text-white/80 transition-colors uppercase font-bold tracking-wider"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset) => (
                    <PresetCard
                        key={preset}
                        name={preset}
                        isActive={selectedPreset === preset}
                        onClick={() => setSelectedPreset(preset)}
                    />
                ))}
            </div>

            <button
                onClick={handleApply}
                disabled={!selectedPreset || isProcessing || !videoFile}
                className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg
                    ${!selectedPreset || !videoFile 
                        ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Applying Grade...</span>
                    </>
                ) : (
                    <>
                        <PlayCircle size={16} />
                        <span>Apply {selectedPreset || 'Preset'}</span>
                    </>
                )}
            </button>
        </section>
    );
}
