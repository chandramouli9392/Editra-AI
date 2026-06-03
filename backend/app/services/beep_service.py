import subprocess
import os
from pathlib import Path

# Resolve base dir and core beep sound path using pathlib as requested
BASE_DIR = Path(__file__).resolve().parent.parent
BEEP_SOUND_PATH = str(BASE_DIR / "core" / "beep.mp3")

def apply_beeps(video_path: str, output_path: str, bad_timestamps: list):
    """
    Uses FFmpeg to mute profanity segments and overlay a dynamically trimmed beep.mp3 sound.
    Each beep is trimmed to the exact duration of the profanity word.
    """
    if not bad_timestamps:
        import shutil
        print("BEEP SERVICE: No profanity timestamps detected. Copying original video.")
        shutil.copy2(video_path, output_path)
        return

    # Check for the core beep file
    if not os.path.exists(BEEP_SOUND_PATH):
        print(f"CRITICAL ERROR: CORE BEEP FILE NOT FOUND at {BEEP_SOUND_PATH}")
        raise FileNotFoundError(f"Missing required core asset: {BEEP_SOUND_PATH}")

    print("CORE BEEP FILE LOADED ✓")

    # Build FFmpeg filter complex
    # 1. Mute original audio [0:a] during profanity
    mute_conditions = []
    beep_chains = []
    
    for i, ts in enumerate(bad_timestamps):
        start = ts.get('start', 0)
        end = ts.get('end', 0)
        duration = end - start
        delay_ms = int(start * 1000)
        
        # Create condition for muting original audio
        mute_conditions.append(f"between(t,{start},{end})")
        
        # Create a chain for this specific beep instance:
        # Trim beep to duration, then delay to its start position
        beep_chains.append(f"[1:a]atrim=0:{duration},adelay={delay_ms}|{delay_ms}[b{i}]")
    
    mute_expr = "+".join(mute_conditions)
    
    # Combine all beep chains and mix them
    beep_labels = "".join([f"[b{i}]" for i in range(len(bad_timestamps))])
    
    if len(bad_timestamps) == 1:
        # Simplified filter for a single bad word
        filter_complex = (
            f"{beep_chains[0]}; "
            f"[0:a]volume=0:enable='{mute_expr}'[orig_muted]; "
            f"[orig_muted][b0]amix=inputs=2:duration=first:normalize=0[out_audio]"
        )
    else:
        # Mix all generated beep segments first
        mix_beeps = f"{beep_labels}amix=inputs={len(bad_timestamps)}:normalize=0[all_beeps]"
        filter_complex = (
            f"{';'.join(beep_chains)}; "
            f"{mix_beeps}; "
            f"[0:a]volume=0:enable='{mute_expr}'[orig_muted]; "
            f"[orig_muted][all_beeps]amix=inputs=2:duration=first:normalize=0[out_audio]"
        )

    print("APPLYING TIMESTAMP-BASED BEEP OVERLAY ✓")

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-i', BEEP_SOUND_PATH,
        '-filter_complex', filter_complex,
        '-map', '0:v',
        '-map', '[out_audio]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("AUDIO BEEP OVERLAY SUCCESSFUL ✓")
        else:
            print("AUDIO BEEP OVERLAY FAILED ✗")
            print(f"FFmpeg Error Details: {result.stderr}")
            raise Exception(f"FFmpeg process failed: {result.stderr}")
    except Exception as e:
        print(f"BEEP SERVICE EXCEPTION: {str(e)}")
        raise e
    print(f"------------------------------------")
