export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ProgressEvent {
    status: string;
    progress: number;
    filename?: string;
    detail?: string;
}

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

export async function processVideo(
    clips: File[],
    prompt: string,
    onProgress: (event: ProgressEvent) => void,
    musicPrompt?: string,
    musicFile?: File,
    advancedOptions?: AdvancedOptions
): Promise<Blob> {
    const formData = new FormData();
    clips.forEach((clip) => formData.append("clips", clip));
    formData.append("prompt", prompt);

    if (musicPrompt) {
        formData.append("music_prompt", musicPrompt);
    } else if (musicFile) {
        formData.append("music_file", musicFile);
    }

    if (advancedOptions) {
        if (advancedOptions.trim_start) formData.append("trim_start", advancedOptions.trim_start);
        if (advancedOptions.trim_end) formData.append("trim_end", advancedOptions.trim_end);
        if (advancedOptions.speed !== undefined && advancedOptions.speed !== 1.0) formData.append("speed", advancedOptions.speed.toString());
        if (advancedOptions.overlay_text) formData.append("overlay_text", advancedOptions.overlay_text);
        if (advancedOptions.text_position) formData.append("text_position", advancedOptions.text_position);
        if (advancedOptions.resolution && advancedOptions.resolution !== "original") formData.append("resolution", advancedOptions.resolution);
        if (advancedOptions.fade_in) formData.append("fade_in", "true");
        if (advancedOptions.fade_out) formData.append("fade_out", "true");
        if (advancedOptions.volume !== undefined && advancedOptions.volume !== 100) formData.append("volume", advancedOptions.volume.toString());
        if (advancedOptions.output_name) formData.append("output_name", advancedOptions.output_name);
        if (advancedOptions.grayscale) formData.append("grayscale", "true");
        if (advancedOptions.profanity_detection) formData.append("profanity_detection", "true");
        if (advancedOptions.nsfw_blur) formData.append("nsfw_blur", "true");
    }

    const response = await fetch(`${API_BASE_URL}/process`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Connection failed");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let blob: Blob | null = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
            if (line.trim().startsWith("data: ")) {
                try {
                    const data: ProgressEvent = JSON.parse(line.replace("data: ", "").trim());
                    onProgress(data);

                    if (data.status === "Complete" && data.filename) {
                        const fileResponse = await fetch(`${API_BASE_URL}/download/${data.filename}`);
                        blob = await fileResponse.blob();
                    } else if (data.status === "Error") {
                        throw new Error(data.detail || "Processing failed");
                    }
                } catch (e) {
                    console.error("Error parsing progress event", e);
                }
            }
        }
    }

    if (!blob) throw new Error("Final video not received");
    return blob;
}
