import json
import os
import re

# Load the bad words dictionary from the JSON file
DICTIONARY_PATH = os.path.join(os.path.dirname(__file__), "..", "core", "bad_words.json")

# Map Whisper language codes to our dictionary keys
LANGUAGE_MAP = {
    "en": "english",
    "te": "telugu",
    "hi": "hindi",
    "english": "english",
    "telugu": "telugu",
    "hindi": "hindi"
}

def load_bad_words():
    try:
        if not os.path.exists(DICTIONARY_PATH):
            print(f"Warning: {DICTIONARY_PATH} not found.")
            return {}
        with open(DICTIONARY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading bad_words.json: {e}")
        return {}

def detect_profanity_timestamps(word_segments, language_code):
    """
    Analyzes word-level transcription segments and returns a list of 
    {'word': '...', 'start': 0.0, 'end': 1.0} dictionaries where profanity was detected.
    """
    bad_words_dict = load_bad_words()
    
    # Map Whisper language code to descriptive name
    mapped_lang = LANGUAGE_MAP.get(language_code.lower(), "english")
    profanity_list = bad_words_dict.get(mapped_lang, bad_words_dict.get("english", []))
    
    print(f"--- PROFANITY DETECTION STARTED ---")
    print(f"LANGUAGE DETECTED: {language_code} (Mapped to: {mapped_lang})")
    
    if not profanity_list:
        print("WARNING: No profanity dictionary available for this language.")
        return []
        
    # Compile regex for the profanity list
    if mapped_lang == "english":
        pattern = re.compile(r'^(' + '|'.join(map(re.escape, profanity_list)) + r')$', re.IGNORECASE)
    else:
        # For Indic languages, we might need more flexible matching if tokens aren't perfect
        pattern = re.compile(r'(' + '|'.join(map(re.escape, profanity_list)) + r')', re.IGNORECASE)
    
    bad_timestamps = []
    detected_words = []
    
    for segment in word_segments:
        # WhisperX word segments can have 'word' or 'text'
        word_text = segment.get("word", segment.get("text", "")).strip()
        if not word_text:
            continue
            
        # Clean the word of punctuation for matching
        clean_word = re.sub(r'[^\w\s]', '', word_text)
        
        if pattern.search(clean_word) or pattern.search(word_text):
            start = segment.get("start")
            end = segment.get("end")
            
            # Skip if timestamps are missing
            if start is None or end is None:
                continue
                
            bad_timestamps.append({
                "word": word_text,
                "start": start,
                "end": end
            })
            
            if word_text.lower() not in detected_words:
                detected_words.append(word_text.lower())
    
    if bad_timestamps:
        print(f"PROFANITY DETECTED: {', '.join(detected_words)}")
        print(f"WORD-LEVEL TIMESTAMPS GENERATED: {len(bad_timestamps)} profanity instances found.")
    else:
        print("No profanity detected.")
        
    print(f"-------------------------------")
            
    return bad_timestamps

def censor_text(text, language_code):
    """
    Replaces bad words in the transcript text with 'BEEP' or '...'.
    Returns (censored_text, detected_words)
    """
    bad_words_dict = load_bad_words()
    mapped_lang = LANGUAGE_MAP.get(language_code.lower(), "english")
    profanity_list = bad_words_dict.get(mapped_lang, bad_words_dict.get("english", []))
    
    if not profanity_list:
        return text, []
        
    # Build regex
    if mapped_lang == "english":
        pattern = re.compile(r'\b(' + '|'.join(map(re.escape, profanity_list)) + r')\b', re.IGNORECASE)
    else:
        pattern = re.compile(r'(' + '|'.join(map(re.escape, profanity_list)) + r')', re.IGNORECASE)
    
    detected_words = list(set(pattern.findall(text)))
    censored_text = pattern.sub("...", text)
    
    return censored_text, detected_words

def consolidate_timestamps(timestamps, buffer=0.1):
    """
    Merges overlapping or very close timestamps.
    For word-level precision, we use a smaller buffer.
    """
    if not timestamps:
        return []
        
    sorted_ts = sorted(timestamps, key=lambda x: x["start"])
    merged = []
    
    if sorted_ts:
        curr = {
            "start": max(0, sorted_ts[0]["start"] - buffer),
            "end": sorted_ts[0]["end"] + buffer
        }
        
        for next_ts in sorted_ts[1:]:
            next_start = max(0, next_ts["start"] - buffer)
            next_end = next_ts["end"] + buffer
            
            if next_start <= curr["end"]:
                curr["end"] = max(curr["end"], next_end)
            else:
                merged.append(curr)
                curr = {"start": next_start, "end": next_end}
        merged.append(curr)
        
    return merged
