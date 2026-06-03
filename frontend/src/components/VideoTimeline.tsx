"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ZoomIn, ZoomOut, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoFrame } from "@/components/VideoFramesPanel";

interface VideoTimelineProps {
  file: File;
  onFramesExtracted?: (frames: VideoFrame[]) => void;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoTimeline({
  file,
  onFramesExtracted,
  onTimeUpdate,
}: VideoTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [frames, setFrames] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Setup video URL on file change
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setFrames([]);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Extract frames
  useEffect(() => {
    if (!videoUrl || !hiddenVideoRef.current || duration === 0) return;

    let isMounted = true;
    const video = hiddenVideoRef.current;
    const interval = Math.max(1, duration / (20 * zoomLevel));

    const extractFrames = async () => {
      setIsExtracting(true);
      const extracted: VideoFrame[] = [];

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
      }

      const targetHeight = 60;
      const aspectRatio = video.videoWidth / video.videoHeight || 16 / 9;
      canvas.height = targetHeight;
      canvas.width = targetHeight * aspectRatio;

      for (let time = 0; time <= duration; time += interval) {
        if (!isMounted) break;
        await new Promise<void>((resolve) => {
          video.currentTime = time;
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            extracted.push({
              url: canvas.toDataURL("image/jpeg", 0.5),
              time: Number(time.toFixed(2)),
            });
            setFrames(extracted.map((f) => f.url));
            resolve();
          };
          video.addEventListener("seeked", onSeeked);
        });
      }

      if (isMounted) {
        setIsExtracting(false);
        onFramesExtracted?.(extracted);
      }
    };

    extractFrames();
    return () => {
      isMounted = false;
    };
  }, [videoUrl, duration, zoomLevel, onFramesExtracted]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "00")}.${ms}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || isDragging) return;
    setCurrentTime(videoRef.current.currentTime);
    onTimeUpdate?.(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const seekToPosition = (clientX: number) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
    videoRef.current.currentTime = newTime;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) =>
    seekToPosition(e.clientX);

  const handleTimelineDrag = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    seekToPosition(clientX);
  };

  return (
    <div className="space-y-4 bg-white/5 rounded-3xl p-5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Film size={16} />
          </div>
          <div>
            <h4 className="font-bold text-white/90 text-sm truncate max-w-[160px]">
              {file.name}
            </h4>
            <p className="text-xs text-white/40">Source Preview</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
          <span className="text-xs font-mono text-indigo-300">
            {formatTime(currentTime)}{" "}
            <span className="text-white/30">/</span> {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Hidden video for frame extraction */}
      {videoUrl && (
        <video
          ref={hiddenVideoRef}
          src={videoUrl}
          className="hidden"
          muted
          playsInline
          preload="auto"
        />
      )}

      {/* Main Video Preview */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity cursor-pointer",
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}
          onClick={togglePlay}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:scale-110 transition-transform">
            {isPlaying ? (
              <Pause size={22} className="fill-current" />
            ) : (
              <Play size={22} className="fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <button
            onClick={togglePlay}
            className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-white shadow-md shadow-indigo-500/20"
          >
            {isPlaying ? (
              <Pause size={14} className="fill-current" />
            ) : (
              <Play size={14} className="fill-current ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white bg-white/5 border border-white/10"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-medium text-indigo-300 w-9 text-center bg-indigo-500/10 py-1.5 rounded-md border border-indigo-500/20">
              {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white bg-white/5 border border-white/10"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Film strip */}
        <div
          className="relative w-full h-14 bg-black/40 rounded-xl border border-white/5 overflow-hidden select-none cursor-ew-resize"
          ref={timelineRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleTimelineClick(e);
          }}
          onMouseMove={handleTimelineDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleTimelineDrag(e);
          }}
          onTouchMove={handleTimelineDrag}
          onTouchEnd={() => setIsDragging(false)}
        >
          <div
            className="absolute inset-y-0 left-0 flex h-full"
            style={{ width: `${zoomLevel * 100}%` }}
          >
            {frames.length > 0 ? (
              frames.map((frame, i) => (
                <div
                  key={i}
                  className="h-full flex-grow border-r border-white/5 last:border-r-0"
                  style={{
                    backgroundImage: `url(${frame})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-white/30 truncate px-4">
                  {isExtracting ? "Generating Timeline Frames..." : "Ready"}
                </span>
              </div>
            )}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-2.5 h-2.5 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </div>
          </div>
          {/* scrub overlay */}
          <div className="absolute inset-0 z-20" />
        </div>
      </div>
    </div>
  );
}
