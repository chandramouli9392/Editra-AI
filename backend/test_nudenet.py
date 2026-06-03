from nudenet import NudeDetector
import sys
import os

def test_detection(image_path):
    detector = NudeDetector()
    detections = detector.detect(image_path)
    print(f"Detections: {detections}")
    if detections:
        print(f"Keys in first detection: {detections[0].keys()}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_detection(sys.argv[1])
    else:
        print("Please provide an image path.")
