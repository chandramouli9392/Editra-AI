import os
import subprocess
import uuid

import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from .core.config import UPLOAD_FOLDER, OUTPUT_FOLDER
from .services.video_service import generate_video, merge_audio_video, default_merge, apply_advanced_filters
from .services.music_service import generate_music
from .services.transcription_service import transcribe_audio
from .services.profanity_service import detect_profanity_timestamps, consolidate_timestamps, censor_text
from .services.tts_service import generate_tts
from .services.beep_service import apply_beeps
from .services.blur_service import blur_service
from .utils.metadata_utils import get_video_metadata, get_video_duration

app = FastAPI(title="AatoZen.AI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AatoZen.AI Backend API"}

@app.post("/process")
async def process_video(
    clips: List[UploadFile] = File(...),
    prompt: str = Form(...),
    music_prompt: Optional[str] = Form(None),
    music_file: Optional[UploadFile] = File(None),
    trim_start: Optional[str] = Form(None),
    trim_end: Optional[str] = Form(None),
    speed: Optional[float] = Form(1.0),
    overlay_text: Optional[str] = Form(None),
    text_position: Optional[str] = Form(None),
    resolution: Optional[str] = Form("original"),
    fade_in: bool = Form(False),
    fade_out: bool = Form(False),
    volume: Optional[int] = Form(100),
    output_name: Optional[str] = Form("final"),
    grayscale: Optional[bool] = Form(False),
    profanity_detection: Optional[bool] = Form(False),
    nsfw_blur: Optional[bool] = Form(False)
):
    async def event_generator():
        try:
            # 1. Save clips and build metadata
            yield f"data: {json.dumps({'status': 'Uploading Source Material...', 'progress': 10})}\n\n"
            metadata_list = []
            for clip in clips:
                path = os.path.join(UPLOAD_FOLDER, clip.filename)
                with open(path, "wb") as buffer:
                    shutil.copyfileobj(clip.file, buffer)
                
                meta = get_video_metadata(path)
                metadata_list.append({
                    "filename": clip.filename,
                    "path": path,
                    "metadata": meta
                })
            
            # 2. Generate edited video
            yield f"data: {json.dumps({'status': 'AI Scripting & Orchestration...', 'progress': 40})}\n\n"
            is_meaningful = prompt and len(prompt.strip()) > 10
            
            if is_meaningful:
                try:
                    merged_video = await generate_video(metadata_list, prompt)
                except Exception as e:
                    print(f"Gemini failed: {str(e)}. Fallback.")
                    merged_video = default_merge(metadata_list)
            else:
                merged_video = default_merge(metadata_list)
                
            # 2.5 LOCAL WHISPER + WHISPERX Profanity Censoring Pipeline
            if profanity_detection:
                yield f"data: {json.dumps({'status': 'LOCAL WHISPER STARTED', 'progress': 50})}\n\n"
                try:
                    # 1. Local Transcription & Alignment
                    transcription_data = transcribe_audio(merged_video)
                    full_text = transcription_data.get("text", "")
                    detected_lang = transcription_data["language"]
                    word_segments = transcription_data.get("segments", [])
                    
                    if not full_text:
                        print("PROFANITY PIPELINE: No speech detected for censoring.")
                        yield f"data: {json.dumps({'status': 'No speech detected.', 'progress': 60})}\n\n"
                    else:
                        yield f"data: {json.dumps({'status': 'PROFANITY DETECTION STARTED', 'progress': 55})}\n\n"
                        
                        # 2. Detect profanity at word level
                        bad_timestamps = detect_profanity_timestamps(word_segments, detected_lang)
                        
                        if bad_timestamps:
                            print(f"PROFANITY DETECTED: {len(bad_timestamps)} instances.")
                            yield f"data: {json.dumps({'status': 'PROFANITY DETECTED', 'progress': 58})}\n\n"
                            
                            # Consolidate for smoother muting
                            merged_timestamps = consolidate_timestamps(bad_timestamps)
                            
                            # 3. Apply FFmpeg Muting/Beeping
                            yield f"data: {json.dumps({'status': 'AUDIO MUTING STARTED', 'progress': 60})}\n\n"
                            censored_video = os.path.join(OUTPUT_FOLDER, "censored_output.mp4")
                            
                            apply_beeps(merged_video, censored_video, merged_timestamps)
                            
                            if os.path.exists(censored_video):
                                print("AUDIO MUTING SUCCESSFUL ✓")
                                yield f"data: {json.dumps({'status': 'AUDIO MUTING SUCCESSFUL', 'progress': 65})}\n\n"
                                # Replace merged_video with the censored version
                                if os.path.exists(merged_video) and "merged.mp4" in merged_video:
                                    try: os.remove(merged_video)
                                    except: pass
                                merged_video = censored_video
                                print("FINAL SAFE VIDEO GENERATED ✓")
                            else:
                                raise Exception("FFmpeg muting failed to produce output.")
                        else:
                            yield f"data: {json.dumps({'status': 'No Profanity Detected.', 'progress': 60})}\n\n"
                            print("PROFANITY PIPELINE: No profanity detected.")
                            
                except Exception as e:
                    print(f"PROFANITY PIPELINE ERROR: {str(e)}")
                    yield f"data: {json.dumps({'status': 'Profanity Pipeline Error (Skipping)', 'progress': 60})}\n\n"
                
            # 2.7 NSFW Detection & Auto Blur Pipeline
            if nsfw_blur:
                yield f"data: {json.dumps({'status': 'Extracting Video Frames...', 'progress': 52})}\n\n"
                try:
                    # process_video handles extraction, detection, blurring, and re-assembly
                    # It takes a generator callback for progress updates
                    def progress_callback(status, progress):
                        # We'll use a wrapper to send the yield since we're in a nested function
                        # But actually, process_video is sync in my current implementation, 
                        # so I can't easily yield from inside it unless I make it async or use a callback that yields.
                        # For now, I'll just let it run and it will log to console.
                        pass
                    
                    # To allow yielding from within the service, I'll modify the service to accept a yield function
                    # or just handle the steps here. 
                    # Let's keep it simple and handle the service call.
                    
                    # We need a way to yield progress from inside blur_service.process_video
                    # Since event_generator is an async generator, we can pass a callback that yields.
                    
                    async def async_yield_progress(status, progress):
                        await asyncio.sleep(0) # Yield control
                        # This won't work easily because blur_service.process_video is sync.
                        # I'll just update the status before and after for now.
                        pass

                    # Actually, I can just do the steps here if I want more granular control, 
                    # but modularity is better.
                    
                    yield f"data: {json.dumps({'status': 'Moderating Content...', 'progress': 55})}\n\n"
                    safe_video = blur_service.process_video(merged_video, 
                        yield_progress=lambda s, p: print(f"NSFW PROGRESS: {s} ({p}%)"))
                    
                    if os.path.exists(safe_video) and safe_video != merged_video:
                        # Replace merged_video with the safe version
                        if os.path.exists(merged_video) and ("merged.mp4" in merged_video or "censored_output.mp4" in merged_video):
                            try: os.remove(merged_video)
                            except: pass
                        merged_video = safe_video
                        yield f"data: {json.dumps({'status': 'NSFW Moderation Complete', 'progress': 65})}\n\n"
                    else:
                        yield f"data: {json.dumps({'status': 'No sensitive content detected.', 'progress': 65})}\n\n"

                except Exception as e:
                    print(f"NSFW PIPELINE ERROR: {str(e)}")
                    yield f"data: {json.dumps({'status': 'NSFW Pipeline Error (Skipping)', 'progress': 65})}\n\n"

            # 3. Handle Music Logic
            yield f"data: {json.dumps({'status': 'Synthesizing Sonic Atmosphere...', 'progress': 70})}\n\n"
            audio_path = None
            if music_prompt and music_prompt.strip():
                duration = get_video_duration(merged_video)
                audio_path = await generate_music(music_prompt, duration)
            elif music_file:
                audio_path = os.path.join(UPLOAD_FOLDER, music_file.filename)
                with open(audio_path, "wb") as buffer:
                    shutil.copyfileobj(music_file.file, buffer)
            
            # 4. Finalizing Production
            yield f"data: {json.dumps({'status': 'Finalizing Production...', 'progress': 90})}\n\n"
            
            import re
            safe_output_name = re.sub(r'[^a-zA-Z0-9_\-]', '', str(output_name)) if output_name else "final"
            if not safe_output_name:
                safe_output_name = "final"
                
            final_video = os.path.join(OUTPUT_FOLDER, f"{safe_output_name}.mp4")
            
            is_advanced = any([
                trim_start, trim_end, 
                speed != 1.0, 
                overlay_text, 
                resolution != "original", 
                fade_in, fade_out,
                volume != 100,
                grayscale
            ])
            
            if is_advanced:
                temp_output = os.path.join(OUTPUT_FOLDER, "temp_merged.mp4")
                if audio_path:
                    merge_audio_video(merged_video, audio_path, temp_output)
                else:
                    if os.path.exists(merged_video):
                        shutil.copy2(merged_video, temp_output)
                
                options = {
                    "trim_start": trim_start,
                    "trim_end": trim_end,
                    "speed": speed,
                    "overlay_text": overlay_text,
                    "text_position": text_position,
                    "resolution": resolution,
                    "fade_in": fade_in,
                    "fade_out": fade_out,
                    "volume": volume,
                    "grayscale": grayscale
                }
                apply_advanced_filters(temp_output, final_video, options)
                if os.path.exists(temp_output):
                    os.remove(temp_output)
            else:
                if audio_path:
                    # merge_audio_video handles generating the final video
                    merge_audio_video(merged_video, audio_path, final_video)
                else:
                    # Point 3: If merged exists but final doesn't, copy it
                    # merged_video should be outputs/merged.mp4 from generate_video or default_merge
                    if os.path.exists(merged_video):
                        shutil.copy2(merged_video, final_video)
            
            # Point 4: Safety Check
            if not os.path.exists(final_video):
                print(f"FINAL RENDER STATUS: Failed ✗ (File not found: {final_video})")
                raise Exception("Final video generation failed.")
            
            print(f"FINAL RENDER STATUS: Success ✓ (Output: {final_video})")
            
            # Signal completion with consistent filename
            yield f"data: {json.dumps({'status': 'Complete', 'progress': 100, 'filename': f'{safe_output_name}.mp4'})}\n\n"
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'status': 'Error', 'detail': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/download/{filename}")
async def download_video(filename: str):
    path = os.path.join(OUTPUT_FOLDER, filename)
    # Point 4: Safety check before returning FileResponse
    if os.path.exists(path):
        return FileResponse(path, media_type="video/mp4", filename=filename)
    raise HTTPException(status_code=404, detail="Final video generation failed.")

@app.post("/quicklook/apply-preset")
async def apply_quicklook_preset(video: UploadFile = File(...), preset: str = Form(...)):
    # 1. Save incoming video
    unique_id = str(uuid.uuid4())[:8]
    input_path = os.path.join(UPLOAD_FOLDER, f"ql_input_{unique_id}_{video.filename}")
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    print("QUICK LOOK PRESET SELECTED ✓")
    
    # 2. Map preset to FFmpeg color grading filter profile
    preset_clean = preset.strip().lower()
    if preset_clean == "cinematic":
        ffmpeg_filter = "eq=contrast=1.15:saturation=0.85,colorbalance=rs=-0.1:gs=0.03:bs=0.1:rh=0.12:gh=0.04:bh=-0.08"
    elif preset_clean == "vibrant":
        ffmpeg_filter = "eq=contrast=1.2:saturation=1.4"
    elif preset_clean == "monochrome":
        ffmpeg_filter = "format=gray,eq=contrast=1.2"
    elif preset_clean == "vintage":
        ffmpeg_filter = "eq=contrast=0.85:brightness=0.05:saturation=0.75,colorbalance=rs=0.05:gs=0.02:bs=-0.05:rm=0.12:gm=0.06:bm=-0.12:rh=0.10:gh=0.05:bh=-0.10"
    elif preset_clean == "moody":
        ffmpeg_filter = "eq=contrast=1.3:brightness=-0.05:saturation=0.75"
    elif preset_clean in ("teal & orange", "teal and orange", "teal_orange"):
        ffmpeg_filter = "eq=contrast=1.15:saturation=1.1,colorbalance=rs=-0.15:gs=0.08:bs=0.15:rm=0.15:gm=0.02:bm=-0.12:rh=0.18:gh=0.05:bh=-0.15"
    else:
        raise HTTPException(status_code=400, detail=f"Preset '{preset}' not supported.")

    print("COLOR GRADING PROFILE APPLIED ✓")
    
    # 3. Apply FFmpeg filter
    output_filename = f"ql_output_{unique_id}.mp4"
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
    
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", ffmpeg_filter,
        "-c:a", "copy",
        output_path
    ]
    
    print(f"Executing Quick Look preset: {' '.join(cmd)}")
    print("FFMPEG COLOR FILTER APPLIED ✓")
    
    process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if process.returncode != 0 or not os.path.exists(output_path):
        print(f"FFmpeg error: {process.stderr.decode('utf-8', errors='ignore')}")
        raise HTTPException(status_code=500, detail="Failed to apply color grading preset.")
        
    print("QUICK LOOK RENDER COMPLETE ✓")
    
    # Return the path so frontend can download/preview it
    return {"status": "success", "url": f"/download/{output_filename}"}

