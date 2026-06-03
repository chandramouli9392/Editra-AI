import os
import subprocess
import json
import torch
import gc
from typing import List, Dict, Any

# Local Transcription Imports
try:
    from faster_whisper import WhisperModel
    import whisperx
except ImportError:
    print("WARNING: faster-whisper or whisperx not found. Local transcription will fail.")

# Model Configurations
# We use 'base' as a default for good balance of speed and accuracy
WHISPER_MODEL_SIZE = "base"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"

# Global model caches to avoid reloading
_whisper_model = None
_align_models = {}

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"LOADING LOCAL WHISPER MODEL ({WHISPER_MODEL_SIZE}) on {DEVICE}...")
        _whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        print(f"WHISPER MODEL LOADED ✓")
    return _whisper_model

def get_align_model(language_code: str):
    global _align_models
    if language_code not in _align_models:
        print(f"LOADING WHISPERX ALIGN MODEL FOR '{language_code}'...")
        try:
            model_a, metadata = whisperx.load_align_model(language_code=language_code, device=DEVICE)
            _align_models[language_code] = (model_a, metadata)
            print(f"ALIGN MODEL FOR '{language_code}' LOADED ✓")
        except Exception as e:
            print(f"FAILED TO LOAD ALIGN MODEL FOR '{language_code}': {e}")
            # Fallback to English alignment if specific language fails
            if language_code != "en":
                return get_align_model("en")
            return None, None
    return _align_models[language_code]

def extract_audio(video_path: str) -> str:
    """
    Extracts mono audio at 16kHz from the video file for optimal transcription.
    """
    audio_path = video_path.rsplit(".", 1)[0] + "_temp_audio.wav"
    print(f"--- AUDIO EXTRACTION LOGS ---")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        audio_path
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"AUDIO EXTRACTION SUCCESSFUL ✓ -> {audio_path}")
        return audio_path
    except subprocess.CalledProcessError as e:
        print(f"AUDIO EXTRACTION FAILED ✗")
        raise Exception(f"Failed to extract audio: {e.stderr}")

def transcribe_audio(video_path: str) -> Dict[str, Any]:
    """
    Transcribes audio using LOCAL OpenAI Whisper + WhisperX.
    Generates precise word-level timestamps.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    print(f"--- LOCAL WHISPER STARTED ---")
    
    audio_temp = None
    try:
        # 1. Extract Audio
        audio_temp = extract_audio(video_path)
        
        # 2. Transcribe with Faster-Whisper
        model = get_whisper_model()
        
        # segments is a generator, we convert it to a list
        segments_gen, info = model.transcribe(audio_temp, beam_size=5)
        segments = list(segments_gen)
        
        detected_language = info.language
        print(f"LANGUAGE DETECTED: {detected_language} (Prob: {info.language_probability:.2f})")
        
        # Format segments for WhisperX
        whisper_results = []
        full_text = ""
        for s in segments:
            whisper_results.append({
                "start": s.start,
                "end": s.end,
                "text": s.text
            })
            full_text += s.text + " "
        
        full_text = full_text.strip()
        print(f"WHISPER TRANSCRIPTION COMPLETE ✓")
        
        # 3. WhisperX Alignment for Word-Level Timestamps
        print(f"STARTING WHISPERX ALIGNMENT...")
        model_a, metadata = get_align_model(detected_language)
        
        if model_a is not None:
            # Load audio for alignment
            audio = whisperx.load_audio(audio_temp)
            result = whisperx.align(whisper_results, model_a, metadata, audio, DEVICE, return_char_alignments=False)
            
            # WhisperX returns 'segments' which contain 'word_segments'
            word_segments = []
            for segment in result["segments"]:
                if "words" in segment:
                    word_segments.extend(segment["words"])
                elif "word_segments" in segment:
                    word_segments.extend(segment["word_segments"])
            
            print(f"WHISPERX ALIGNMENT COMPLETE ✓")
            print(f"WORD-LEVEL TIMESTAMPS GENERATED: {len(word_segments)} words found.")
            
            # Cleanup alignment audio from memory
            del audio
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
            return {
                "segments": word_segments, # These are word-level now
                "language": detected_language,
                "text": full_text
            }
        else:
            print("WARNING: WhisperX Alignment failed or skipped. Using sentence-level timestamps.")
            return {
                "segments": whisper_results,
                "language": detected_language,
                "text": full_text
            }
            
    except Exception as e:
        print(f"LOCAL WHISPER PIPELINE ERROR: {str(e)}")
        raise e
    finally:
        if audio_temp and os.path.exists(audio_temp):
            try: os.remove(audio_temp)
            except: pass
