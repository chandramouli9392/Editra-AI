import edge_tts
import asyncio
import os

# Map Whisper language codes to Edge TTS voices
VOICE_MAP = {
    "en": "en-US-GuyNeural",
    "te": "te-IN-MohanNeural",
    "hi": "hi-IN-MadhurNeural",
    "english": "en-US-GuyNeural",
    "telugu": "te-IN-MohanNeural",
    "hindi": "hi-IN-MadhurNeural",
    "ta": "ta-IN-ValluvarNeural",
    "ml": "ml-IN-MidhunNeural",
    "kn": "kn-IN-GaganNeural"
}

async def generate_tts(text: str, language_code: str, output_path: str):
    """
    Generates synthetic speech from text using edge-tts.
    """
    voice = VOICE_MAP.get(language_code.lower(), "en-US-GuyNeural")
    
    print(f"--- TTS GENERATION LOGS ---")
    print(f"Voice: {voice}")
    print(f"Target Text: {text}")
    print(f"Output Path: {output_path}")
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        
        if os.path.exists(output_path):
            print("TTS Generation STATUS: Success ✓")
            return output_path
        else:
            raise Exception("TTS file was not created.")
            
    except Exception as e:
        print(f"TTS Generation STATUS: Failed ✗")
        print(f"Error Details: {str(e)}")
        raise e
    finally:
        print(f"----------------------------")
