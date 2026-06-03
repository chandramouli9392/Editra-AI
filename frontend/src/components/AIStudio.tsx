import { useState } from "react";
import {
  Wand2,
  ListVideo,
  Globe2,
  MicOff,
  Search,
  Check,
  PlayCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function AIStudio() {
  const [replaceWord, setReplaceWord] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [removeFillers, setRemoveFillers] = useState(false);

  return (
    <div className="w-full space-y-8 mt-12 md:mt-24 border-t border-white/5 pt-12 md:pt-24 z-10 relative">
      <div className="flex items-center space-x-4 mb-12">
        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-indigo-400 bg-indigo-500/10">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">AI Studio</h2>
          <p className="text-white/40 text-sm mt-1">
            Professional AI-driven video enhancement tools
          </p>
        </div>
      </div>

      {/* Grid Layout taking full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card 1: Retroactive Director */}
        <div id="retroactive-director" className="glass-card p-6 md:p-8 space-y-6 border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <ListVideo size={20} />
              <h3 className="font-bold text-lg text-white">
                Retroactive Director
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
              Edit transcript words and regenerate voice with lip-sync
              correction.
            </p>

            <div className="space-y-3 pt-2">
              <textarea
                className="glass-input h-24 text-sm"
                placeholder="Transcript editor..."
                defaultValue="Welcome to this video tutorial. Today we are going to learn how to edit videos like a pro."
              />
              <input
                type="text"
                placeholder="Replace Word"
                value={replaceWord}
                onChange={(e) => setReplaceWord(e.target.value)}
                className="glass-input p-3 text-sm h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2">
              <PlayCircle size={16} />
              <span>Preview</span>
            </button>
            <button className="py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2">
              <Check size={16} />
              <span>Apply Correction</span>
            </button>
          </div>
        </div>

        {/* Card 2: Neural Content Graph */}
        <div id="neural-graph" className="glass-card p-6 md:p-8 space-y-6 border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <ExternalLink size={20} />
              <h3 className="font-bold text-lg text-white">
                Neural Content Graph
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
              Explore video scenes using a graph-based navigation system.
            </p>

            <div className="w-full h-36 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-white/20 pt-2 mt-4 space-y-2 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50"></div>
              <ExternalLink size={24} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-medium tracking-widest uppercase">
                Graph Visualization
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button className="py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-colors col-span-2">
              Generate Content Graph
            </button>
            <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-colors col-span-2">
              Jump to Scene
            </button>
          </div>
        </div>

        {/* Card 3: Polyglot Editor */}
        <div id="polyglot-editor" className="glass-card p-6 md:p-8 space-y-6 border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <Globe2 size={20} />
              <h3 className="font-bold text-lg text-white">Polyglot Editor</h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
              Translate video to another language while cloning the speaker's
              voice.
            </p>

            <div className="space-y-3 pt-2 mt-auto">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="glass-input p-3 text-sm h-12 w-full appearance-none flex items-center bg-white/5"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Mandarin">Mandarin</option>
                <option value="Japanese">Japanese</option>
                <option value="Italian">Italian</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2">
              <PlayCircle size={16} />
              <span>Preview</span>
            </button>
            <button className="py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-colors">
              Translate Video
            </button>
          </div>
        </div>

        {/* Card 4: Clean Talk Engine */}
        <div id="clean-talk" className="glass-card p-6 md:p-8 space-y-6 border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <MicOff size={20} />
              <h3 className="font-bold text-lg text-white">
                Clean Talk Engine
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
              Automatically remove filler words ("um", "uh") and smooth the
              speech.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl">
                <span className="text-sm font-medium text-white/80">
                  Remove filler words
                </span>
                <button
                  onClick={() => setRemoveFillers(!removeFillers)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    removeFillers ? "bg-indigo-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                      removeFillers ? "transform translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 glass bg-black/20 rounded-2xl border border-white/5 flex items-center space-x-4">
                <button className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/30 transition-colors">
                  <PlayCircle size={20} />
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/3 rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 mt-1 font-medium font-mono tracking-wider">
                    <span>0:00</span>
                    <span>1:24</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button className="w-full py-4 text-sm font-bold tracking-wide uppercase rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-white/10 text-white transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center space-x-2">
              <MicOff size={16} />
              <span>Clean Speech</span>
            </button>
          </div>
        </div>

        {/* Card 5: Instant Jump Search */}
        <div id="instant-jump" className="glass-card p-6 md:p-8 space-y-6 border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <Search size={20} />
              <h3 className="font-bold text-lg text-white">
                Instant Jump Search
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
              Search within the video using keywords and jump to exact
              timestamps.
            </p>

            <div className="pt-2 space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  placeholder="Search video transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-10 pr-4 py-3 text-sm h-12"
                />
              </div>

              {/* Timestamp Results Placeholder */}
              <div className="glass bg-white/5 rounded-xl border border-white/5 p-4 space-y-2 mt-4 max-h-32 overflow-y-auto">
                {searchQuery ? (
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-white/80 group-hover:text-white">
                          02:14
                        </span>
                      </div>
                      <span className="text-xs text-white/40 truncate flex-1 ml-4 text-left">
                        "...like a pro using {searchQuery}..."
                      </span>
                    </button>
                    <button className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-white/80 group-hover:text-white">
                          05:32
                        </span>
                      </div>
                      <span className="text-xs text-white/40 truncate flex-1 ml-4 text-left">
                        "The main advantage of {searchQuery} is..."
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-white/30 italic">
                    Type keywords to find scenes
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2">
              <Search size={16} />
              <span>Search Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
