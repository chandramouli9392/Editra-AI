"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  Wand2,
  Layers,
  CheckCircle2,
  Volume2,
  FileText,
  Scissors,
  FastForward,
  Monitor,
  Moon,
  Type,
} from "lucide-react";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import UploadSection from "@/components/UploadSection";
import MusicSelector, { MusicMode } from "@/components/MusicSelector";
import VideoPreview from "@/components/VideoPreview";
import VideoTimeline from "@/components/VideoTimeline";
import AdvancedControls, {
  AdvancedOptions,
} from "@/components/AdvancedControls";
import AIStudio from "@/components/AIStudio";
import Sidebar from "@/components/Sidebar";
import QuickLookPanel from "@/components/QuickLookPanel";
import VideoFramesPanel, { VideoFrame } from "@/components/VideoFramesPanel";
import { processVideo } from "@/lib/api";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "Uploading Source Material...",
  "AI Scripting & Orchestration...",
  "Transcribing Speech & Detecting Profanity...",
  "Moderating Content...",
  "Synthesizing Sonic Atmosphere...",
  "Finalizing Production...",
];

export default function Home() {
  const [clips, setClips] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");

  const [musicMode, setMusicMode] = useState<MusicMode>("none");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicFile, setMusicFile] = useState<File | null>(null);

  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({});

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  // Frame state lifted up
  const [timelineFrames, setTimelineFrames] = useState<VideoFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  // Reset frames when clips change
  useEffect(() => {
    setTimelineFrames([]);
    setIsExtracting(clips.length > 0);
  }, [clips]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setRenderProgress(0);
      interval = setInterval(() => {
        setRenderProgress((prev) => {
          const step = Math.floor(Math.random() * 3) + 1;
          const next = prev + step;
          return next >= 95 ? 95 : next;
        });
      }, 200);
    } else {
      setRenderProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (clips.length === 0) {
      setError("Please upload at least one clip");
      return;
    }
    if (!prompt || prompt.trim() === "") {
      setError("Please provide a prompt");
      return;
    }

    const hasPrompt = musicPrompt.trim().length > 0;
    const hasFile = musicFile !== null;
    if ((musicMode === "ai" && hasFile) || (musicMode === "upload" && hasPrompt)) {
      setShowValidationModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);
    const startTime = Date.now();

    try {
      const blob = await processVideo(
        clips,
        prompt,
        (event) => {
          if (event.status === "Error") {
            setError(event.detail || "Processing failed");
          } else {
            const stepIndex = LOADING_STEPS.indexOf(event.status);
            if (stepIndex !== -1) setLoadingStep(stepIndex);
          }
        },
        musicMode === "ai" ? musicPrompt : undefined,
        musicMode === "upload" ? musicFile || undefined : undefined,
        advancedOptions
      );

      setRenderProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const url = window.URL.createObjectURL(blob);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      setVideoUrl(url);
      setGenerationTime(`${duration}s`);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("fetch") || err.message === "Connection failed")) {
        setError("Unable to connect to server. Please ensure backend is running.");
      } else {
        setError(err.message || "An internal error occurred during synthesis.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetProject = () => {
    setClips([]);
    setPrompt("");
    setMusicMode("none");
    setMusicPrompt("");
    setMusicFile(null);
    setAdvancedOptions({});
    setVideoUrl(null);
    setGenerationTime(null);
    setError(null);
    setTimelineFrames([]);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#030308] text-white font-sans">
      <BackgroundAnimation />

      {/* Validation Modal */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidationModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-card p-8 max-w-md w-full text-center space-y-6 border-red-500/20"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Conflict Detected</h3>
                <p className="text-white/60">
                  Please select only one music option: either AI Music or Upload MP3.
                </p>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold"
              >
                I&apos;ll Fix It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Editor — full layout grid */}
      <div className="relative z-10 flex flex-1 min-w-0 overflow-hidden">
        {/* CENTER: Video preview + timeline + AI studio tools */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto px-6 py-6 space-y-6">
          {/* Top header strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-1.5 glass bg-indigo-500/5 border-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wide uppercase">
                <Wand2 size={12} className="animate-pulse" />
                <span>Next-Gen Video Synthesis</span>
              </div>
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/15 uppercase hidden lg:block">
              © 2026 Editra
            </p>
          </div>

          {/* Video area */}
          {videoUrl ? (
            <VideoPreview
              videoUrl={videoUrl}
              onReset={resetProject}
              generationTime={generationTime || undefined}
              outputName={advancedOptions.output_name || "final"}
            />
          ) : (
            <>
              {/* Upload */}
              <div className="glass-card p-6 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                <UploadSection
                  files={clips}
                  setFiles={setClips}
                  title="Source Clips"
                  subtitle="Upload videos for orchestration"
                />
              </div>

              {/* Preview Timeline */}
              {clips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <VideoTimeline
                    file={clips[0]}
                    onFramesExtracted={(frames) => {
                      setTimelineFrames(frames);
                      setIsExtracting(false);
                    }}
                    onTimeUpdate={setPreviewTime}
                  />
                </motion.div>
              )}
            </>
          )}

          {/* AI Studio (anchored sections for sidebar navigation) */}
          <AIStudio />
        </div>

        {/* RIGHT PANEL: Feature controls + Frames + Status */}
        <div className="w-96 h-full flex-shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-3xl overflow-y-auto px-5 py-6 space-y-6 hidden lg:block">
          {/* Creative Direction */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <Layers size={12} />
              <span>Creative Direction</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Merge all clips into a cinematic travel vlog with fast cuts..."
              className="glass-input h-24 text-sm"
            />
          </div>

          {/* Music Section */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <Sparkles size={12} />
              <span>Sonic Atmosphere</span>
            </label>
            <MusicSelector
              mode={musicMode}
              setMode={setMusicMode}
              prompt={musicPrompt}
              setPrompt={setMusicPrompt}
              selectedFile={musicFile}
              onFileSelect={setMusicFile}
            />
          </div>

          {/* Feature Controls */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <Wand2 size={12} />
              <span>Enhancement Controls</span>
            </label>

            {/* Volume card */}
            <div className="glass p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <Volume2 size={13} />
                <span className="text-xs font-medium">Volume: {advancedOptions.volume ?? 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={advancedOptions.volume ?? 100}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, volume: Number(e.target.value) })
                }
                className="w-full accent-indigo-500 h-1.5"
              />
            </div>

            {/* Grayscale card */}
            <div className="glass p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Moon size={13} />
                <span className="text-xs font-medium">Grayscale Filter</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedOptions.grayscale ?? false}
                  onChange={(e) =>
                    setAdvancedOptions({ ...advancedOptions, grayscale: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>

            {/* Output name card */}
            <div className="glass p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <FileText size={13} />
                <span className="text-xs font-medium">Output File Name</span>
              </div>
              <input
                type="text"
                placeholder="final_video"
                value={advancedOptions.output_name ?? ""}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, output_name: e.target.value })
                }
                className="w-full glass-input text-xs py-2 px-3"
              />
            </div>

            {/* Advanced controls (Trim, Speed, TextOverlay, Resolution, Fade) */}
            <AdvancedControls options={advancedOptions} setOptions={setAdvancedOptions} />
          </div>

          <QuickLookPanel
            videoFile={videoUrl || (clips.length > 0 ? clips[0] : null)}
            onApplySuccess={(newUrl) => {
              setVideoUrl(newUrl);
            }}
            onError={(err) => setError(err)}
          />

          {/* Video Frames */}
          <div className="pt-4 border-t border-white/5">
            <VideoFramesPanel
              frames={timelineFrames}
              isExtracting={isExtracting}
              currentTime={previewTime}
            />
          </div>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle size={16} />
              <span className="text-xs font-medium">{error}</span>
            </motion.div>
          )}

          {/* Processing Status */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-white/5 overflow-hidden"
              >
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  <Sparkles size={12} />
                  <span>Rendering Video</span>
                </label>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Progress</span>
                    <span className="font-mono text-indigo-300">{renderProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${renderProgress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Step indicators */}
                <div className="space-y-2">
                  {LOADING_STEPS.map((step, idx) => (
                    <motion.div
                      key={step}
                      animate={{
                        opacity: idx === loadingStep ? 1 : idx < loadingStep ? 0.4 : 0.2,
                      }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0",
                          idx <= loadingStep ? "bg-indigo-500 text-white" : "bg-white/5 text-white/20"
                        )}
                      >
                        {idx < loadingStep ? <CheckCircle2 size={10} /> : idx + 1}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          idx === loadingStep ? "text-white" : "text-white/20"
                        )}
                      >
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full btn-primary h-14 flex items-center justify-center gap-3 group/btn mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="font-black text-sm tracking-tight">
                  {renderProgress === 100 ? "Rendering Complete" : `Rendering ${renderProgress}%`}
                </span>
              </div>
            ) : (
              <>
                <Sparkles size={18} className="group-hover/btn:rotate-12 transition-transform" />
                <span className="font-black text-sm">Orchestrate Production</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
