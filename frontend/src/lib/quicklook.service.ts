import { API_BASE_URL } from "./api";

export async function applyQuickLookPreset(videoUrl: string | File, preset: string): Promise<string> {
    const formData = new FormData();
    formData.append("preset", preset);

    if (typeof videoUrl === "string") {
        // If it's a blob URL, we need to fetch it and convert to File
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        formData.append("video", blob, "source_video.mp4");
    } else {
        formData.append("video", videoUrl);
    }

    const response = await fetch(`${API_BASE_URL}/quicklook/apply-preset`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        let errorDetail = "Failed to apply color grading preset";
        try {
            const data = await response.json();
            errorDetail = data.detail || errorDetail;
        } catch (e) {
            // Ignored
        }
        throw new Error(errorDetail);
    }

    const data = await response.json();
    if (data.status === "success" && data.url) {
        // Fetch the output video and create a blob URL
        const fileResponse = await fetch(`${API_BASE_URL}${data.url}`);
        const blob = await fileResponse.blob();
        return window.URL.createObjectURL(blob);
    }
    
    throw new Error("Invalid response from server");
}
