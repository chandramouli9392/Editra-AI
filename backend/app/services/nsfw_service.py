from nudenet import NudeDetector
import os

class NSFWService:
    def __init__(self):
        # Initialize detector
        # Note: NudeDetector downloads the model on first init
        self.detector = NudeDetector()
        print("NSFW PIPELINE: NudeNet Detector initialized.")

    def detect(self, image_path, threshold=0.35):
        """
        Detects NSFW content in a single image.
        Returns a list of detections with labels and bounding boxes.
        """
        try:
            detections = self.detector.detect(image_path)
            
            EXPLICIT_CLASSES = {
                'FEMALE_GENITALIA_EXPOSED',
                'FEMALE_GENITALIA_COVERED',
                'FEMALE_BREAST_EXPOSED',
                'MALE_GENITALIA_EXPOSED',
                'ANUS_EXPOSED',
                'BUTTOCKS_EXPOSED',
                'EXPOSED_GENITALIA_F', 'COVERED_GENITALIA_F',
                'EXPOSED_BREAST_F', 'EXPOSED_GENITALIA_M',
                'EXPOSED_ANUS', 'EXPOSED_BUTTOCKS'
            }

            filtered_detections = []
            for d in detections:
                if d.get('score', 0) >= threshold:
                    label = str(d.get('class', d.get('label', ''))).upper()
                    if label in EXPLICIT_CLASSES:
                        print("EXPLICIT NSFW REGION DETECTED ✓")
                        filtered_detections.append(d)
                    else:
                        print("NON-EXPLICIT REGION SKIPPED ✓")
            if filtered_detections:
                print(f"NSFW PIPELINE: Detected {len(filtered_detections)} sensitive regions in {os.path.basename(image_path)}")
                for d in filtered_detections:
                    label = d.get('class', d.get('label', 'sensitive'))
                    print(f"  - {label}: {d['score']:.2f} at {d['box']}")
            
            return filtered_detections
        except Exception as e:
            print(f"NSFW PIPELINE ERROR (Detection): {str(e)}")
            return []

# Singleton instance
nsfw_service = NSFWService()
