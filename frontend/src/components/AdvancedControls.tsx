'use client';

import { Settings2, Scissors, FastForward, Type, Monitor, Moon, ShieldAlert } from 'lucide-react';

export interface AdvancedOptions {
    trim_start?: string;
    trim_end?: string;
    speed?: number;
    overlay_text?: string;
    text_position?: string;
    resolution?: string;
    fade_in?: boolean;
    fade_out?: boolean;
    volume?: number;
    output_name?: string;
    grayscale?: boolean;
    profanity_detection?: boolean;
    nsfw_blur?: boolean;
}

interface AdvancedControlsProps {
    options: AdvancedOptions;
    setOptions: (options: AdvancedOptions) => void;
}

export default function AdvancedControls({ options, setOptions }: AdvancedControlsProps) {
    const updateOption = (key: keyof AdvancedOptions, value: any) => {
        setOptions({ ...options, [key]: value });
    };

    return (
        <section className="space-y-6 pt-4 border-t border-white/5">
            <label className="flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-indigo-400">
                <Settings2 size={14} />
                <span>Advanced Controls (Optional)</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trim Section */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center space-x-2 text-white/60 mb-2">
                        <Scissors size={14} />
                        <span className="text-sm font-medium">Trim duration</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="Start (e.g. 00:00:05)"
                            className="glass-input text-xs h-10 px-3 w-full"
                            value={options.trim_start || ''}
                            onChange={(e) => updateOption('trim_start', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="End (e.g. 00:00:15)"
                            className="glass-input text-xs h-10 px-3 w-full"
                            value={options.trim_end || ''}
                            onChange={(e) => updateOption('trim_end', e.target.value)}
                        />
                    </div>
                </div>

                {/* Speed Section */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center space-x-2 text-white/60 mb-2">
                        <FastForward size={14} />
                        <span className="text-sm font-medium">Playback Speed</span>
                    </div>
                    <select
                        className="glass-input w-full h-10 px-3 text-sm appearance-none bg-transparent"
                        value={options.speed || 1.0}
                        onChange={(e) => updateOption('speed', parseFloat(e.target.value))}
                    >
                        <option value={0.5} className="bg-black text-white">0.5x (Slow Motion)</option>
                        <option value={1.0} className="bg-black text-white">1.0x (Normal)</option>
                        <option value={1.5} className="bg-black text-white">1.5x (Fast)</option>
                        <option value={2.0} className="bg-black text-white">2.0x (Super Fast)</option>
                    </select>
                </div>

                {/* Text Overlay */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 md:col-span-2">
                    <div className="flex items-center space-x-2 text-white/60 mb-2">
                        <Type size={14} />
                        <span className="text-sm font-medium">Text Overlay</span>
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Type overlay text here..."
                            className="glass-input w-full h-10 px-3 text-sm flex-1"
                            value={options.overlay_text || ''}
                            onChange={(e) => updateOption('overlay_text', e.target.value)}
                        />
                        <select
                            className="glass-input w-32 h-10 px-3 text-sm appearance-none bg-transparent"
                            value={options.text_position || 'Center'}
                            onChange={(e) => updateOption('text_position', e.target.value)}
                        >
                            <option value="Top" className="bg-black text-white">Top</option>
                            <option value="Center" className="bg-black text-white">Center</option>
                            <option value="Bottom" className="bg-black text-white">Bottom</option>
                        </select>
                    </div>
                </div>

                {/* Resolution */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center space-x-2 text-white/60 mb-2">
                        <Monitor size={14} />
                        <span className="text-sm font-medium">Resolution</span>
                    </div>
                    <select
                        className="glass-input w-full h-10 px-3 text-sm appearance-none bg-transparent"
                        value={options.resolution || 'original'}
                        onChange={(e) => updateOption('resolution', e.target.value)}
                    >
                        <option value="original" className="bg-black text-white">Original / Source</option>
                        <option value="1080p" className="bg-black text-white">1080p (FHD)</option>
                        <option value="720p" className="bg-black text-white">720p (HD)</option>
                        <option value="480p" className="bg-black text-white">480p (SD)</option>
                    </select>
                </div>

                {/* Fade In / Fade Out */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center space-x-2 text-white/60">
                        <Moon size={14} />
                        <span className="text-sm font-medium">Fade Transitions</span>
                    </div>
                    <p className="text-[10px] text-white/30 -mt-1">Smooth entry and exit animations</p>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={options.fade_in || false}
                                onChange={(e) => updateOption('fade_in', e.target.checked)}
                            />
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${options.fade_in ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                {options.fade_in && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-xs font-medium text-white/80">Fade In</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={options.fade_out || false}
                                onChange={(e) => updateOption('fade_out', e.target.checked)}
                            />
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${options.fade_out ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                {options.fade_out && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-xs font-medium text-white/80">Fade Out</span>
                        </label>
                    </div>
                </div>

                {/* Profanity Detection */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center space-x-2 text-white/60">
                        <ShieldAlert size={14} />
                        <span className="text-sm font-medium">Profanity Detection</span>
                    </div>
                    <p className="text-[10px] text-white/30 -mt-1">Auto-detect and beep bad words</p>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="profanity"
                                className="hidden"
                                checked={options.profanity_detection || false}
                                onChange={() => updateOption('profanity_detection', true)}
                            />
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${options.profanity_detection ? 'bg-red-500 border-red-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                {options.profanity_detection && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-medium text-white/80">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="profanity"
                                className="hidden"
                                checked={!(options.profanity_detection || false)}
                                onChange={() => updateOption('profanity_detection', false)}
                            />
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${!options.profanity_detection ? 'bg-white/40 border-white/40' : 'border-white/20 group-hover:border-white/40'}`}>
                                {!options.profanity_detection && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-medium text-white/80">No</span>
                        </label>
                    </div>
                </div>

                {/* NSFW Blur */}
                <div className="glass p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center space-x-2 text-white/60">
                        <ShieldAlert size={14} className="text-orange-400" />
                        <span className="text-sm font-medium">NSFW Blur</span>
                    </div>
                    <p className="text-[10px] text-white/30 -mt-1">Auto-blur sensitive visual content</p>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="nsfw_blur"
                                className="hidden"
                                checked={options.nsfw_blur || false}
                                onChange={() => updateOption('nsfw_blur', true)}
                            />
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${options.nsfw_blur ? 'bg-orange-500 border-orange-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                {options.nsfw_blur && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-medium text-white/80">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="nsfw_blur"
                                className="hidden"
                                checked={!(options.nsfw_blur || false)}
                                onChange={() => updateOption('nsfw_blur', false)}
                            />
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${!options.nsfw_blur ? 'bg-white/40 border-white/40' : 'border-white/20 group-hover:border-white/40'}`}>
                                {!options.nsfw_blur && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-medium text-white/80">No</span>
                        </label>
                    </div>
                </div>

            </div>
        </section>
    );
}
