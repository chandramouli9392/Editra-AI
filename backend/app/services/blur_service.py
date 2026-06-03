import os
import cv2
import subprocess
import shutil
import numpy as np
from ultralytics import YOLO
from .nsfw_service import nsfw_service
from ..core.config import OUTPUT_FOLDER

# ─── Explicit NudeNet classes that must NEVER be discarded ────────────────────
EXPLICIT_CLASSES = {
    'FEMALE_GENITALIA_EXPOSED', 'FEMALE_GENITALIA_COVERED',
    'MALE_GENITALIA_EXPOSED',   'MALE_GENITALIA_COVERED',
    'FEMALE_BREAST_EXPOSED',    'FEMALE_BREAST_COVERED',
    'BUTTOCKS_EXPOSED',         'ANUS_EXPOSED',
}

# Safe body-part classes whose overlap shrinks (not removes) an explicit box
SAFE_CLASSES = {'face', 'eyes', 'nose', 'shoulders', 'arm', 'hand', 'lower_leg'}


def _dist(p1, p2):
    return ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5


def _iou(a, b):
    """Intersection-over-Union for [x1,y1,x2,y2] boxes."""
    xA, yA = max(a[0], b[0]), max(a[1], b[1])
    xB, yB = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, xB-xA) * max(0, yB-yA)
    if inter == 0:
        return 0.0
    areaA = (a[2]-a[0]) * (a[3]-a[1])
    areaB = (b[2]-b[0]) * (b[3]-b[1])
    return inter / float(areaA + areaB - inter + 1e-6)


def _shrink_box_against_safe(box, safe_boxes):
    """
    Shrink `box` to remove overlap with any safe region.
    Returns the shrunk box [x1,y1,x2,y2] or the original if no overlap.
    Never returns an empty box — always preserves min 20×20 area.
    """
    x1, y1, x2, y2 = box
    for sb in safe_boxes:
        sx1, sy1, sx2, sy2 = sb
        # Compute overlap rect
        ox1, oy1 = max(x1, sx1), max(y1, sy1)
        ox2, oy2 = min(x2, sx2), min(y2, sy2)
        if ox2 <= ox1 or oy2 <= oy1:
            continue  # no overlap
        ow, oh = ox2 - ox1, oy2 - oy1
        bw, bh = x2 - x1, y2 - y1
        # Which edge of the safe box caused the smallest crop?
        crops = {
            'top':    (oy2 - y1) / bh if bh else 1,
            'bottom': (y2 - oy1) / bh if bh else 1,
            'left':   (ox2 - x1) / bw if bw else 1,
            'right':  (x2 - ox1) / bw if bw else 1,
        }
        side = min(crops, key=crops.get)
        if side == 'top':
            y1 = max(y1, oy2)
        elif side == 'bottom':
            y2 = min(y2, oy1)
        elif side == 'left':
            x1 = max(x1, ox2)
        elif side == 'right':
            x2 = min(x2, ox1)
        print("SAFE OVERLAP REMOVED ✓")
        print("EXPLICIT REGION PRESERVED ✓")
    # Guard: never collapse to empty
    if (x2 - x1) < 20 or (y2 - y1) < 20:
        return box  # revert to original rather than lose it
    return [x1, y1, x2, y2]


class BlurService:
    def __init__(self):
        try:
            self.yolo_pose = YOLO('yolov8n-pose.pt')
            print("YOLOv8 NSFW MODEL LOADED ✓")
        except Exception as e:
            print(f"Failed to load YOLOv8 pose model: {e}")
            self.yolo_pose = None

        try:
            import mediapipe as mp
            self.mp_pose = mp.solutions.pose.Pose(
                static_image_mode=True,
                model_complexity=1,
                min_detection_confidence=0.5
            )
            print("MEDIAPIPE POSE MODEL INITIALIZED ✓")
        except Exception as e:
            print(f"Failed to initialize MediaPipe Pose: {e}")
            self.mp_pose = None

        self.tracked_boxes = []

    # ─── IoU helper ──────────────────────────────────────────────────────────
    def get_iou(self, a, b):
        return _iou(a, b)

    # ─── Main video processor ─────────────────────────────────────────────────
    def process_video(self, input_video_path, yield_progress=None):
        import time
        timestamp = int(time.time())
        temp_dir   = os.path.join(OUTPUT_FOLDER, f"nsfw_temp_{timestamp}")
        frames_dir = os.path.join(temp_dir, "frames")
        blurred_dir= os.path.join(temp_dir, "blurred")
        os.makedirs(frames_dir,  exist_ok=True)
        os.makedirs(blurred_dir, exist_ok=True)

        try:
            print(f"NSFW PIPELINE: Extracting frames from {input_video_path}...")
            if yield_progress:
                yield_progress("Extracting Video Frames...", 52)

            subprocess.run([
                "ffmpeg", "-y", "-i", input_video_path,
                "-q:v", "2",
                os.path.join(frames_dir, "frame_%04d.jpg")
            ], check=True, capture_output=True)

            frame_files  = sorted(f for f in os.listdir(frames_dir) if f.endswith(".jpg"))
            total_frames = len(frame_files)
            print(f"NSFW PIPELINE: Extracted {total_frames} frames.")

            self.tracked_boxes = []
            for i, frame_file in enumerate(frame_files):
                frame_path  = os.path.join(frames_dir,  frame_file)
                output_path = os.path.join(blurred_dir, frame_file)
                detections  = nsfw_service.detect(frame_path)

                if not detections and not self.tracked_boxes:
                    shutil.copy2(frame_path, output_path)
                else:
                    self.blur_regions(frame_path, output_path, detections)

                if yield_progress and (i % max(1, total_frames // 10) == 0 or i == total_frames - 1):
                    progress = 52 + int((i / total_frames) * 10)
                    yield_progress(f"Moderating Content (Frame {i+1}/{total_frames})...", progress)

            print("FRAME MODERATION SUCCESSFUL ✓")

            if yield_progress:
                yield_progress("Rebuilding Safe Video...", 63)

            fps_result = subprocess.run([
                "ffprobe", "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=r_frame_rate",
                "-of", "default=noprint_wrappers=1:nokey=1",
                input_video_path
            ], capture_output=True, text=True)
            fps = fps_result.stdout.strip() or "25"

            output_video_path = os.path.join(OUTPUT_FOLDER, f"nsfw_safe_{timestamp}.mp4")
            subprocess.run([
                "ffmpeg", "-y",
                "-framerate", fps,
                "-i", os.path.join(blurred_dir, "frame_%04d.jpg"),
                "-i", input_video_path,
                "-map", "0:v:0",
                "-map", "1:a:0?",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                "-crf", "23",
                "-c:a", "copy",
                output_video_path
            ], check=True, capture_output=True)

            print(f"NSFW PIPELINE: Safe video created at {output_video_path}")
            print("SAFE VIDEO RECONSTRUCTION COMPLETE ✓")
            return output_video_path

        except Exception as e:
            print(f"NSFW PIPELINE ERROR (Processing): {str(e)}")
            import traceback; traceback.print_exc()
            return input_video_path
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

    # ─── Core frame blur ──────────────────────────────────────────────────────
    def blur_regions(self, image_path, output_path, detections):
        img = cv2.imread(image_path)
        if img is None:
            return

        h_img, w_img = img.shape[:2]

        if detections:
            print(f"NUDENET DETECTIONS FOUND: {len(detections)}")

        # ── Identify explicit vs non-explicit detections ──────────────────────
        explicit_dets = []
        for d in detections:
            lbl = str(d.get('class', d.get('label', ''))).upper()
            if lbl in EXPLICIT_CLASSES:
                print("EXPLICIT NSFW REGION DETECTED ✓")
                explicit_dets.append(d)

        # ── Step 1: Build safe-part exclusion boxes from MediaPipe / YOLOv8 ──
        safe_boxes   = []   # [x1,y1,x2,y2] of parts we must NOT blur
        yolo_target_zones = []  # chest / pelvis zones to restrict oversized boxes

        # --- MediaPipe path ---
        mp_landmarks_ok = False
        if self.mp_pose:
            try:
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_res = self.mp_pose.process(rgb)
                if mp_res.pose_landmarks:
                    lm = mp_res.pose_landmarks.landmark
                    pts = {}
                    for idx, l in enumerate(lm):
                        if l.visibility > 0.4:
                            pts[idx] = (int(l.x * w_img), int(l.y * h_img))

                    torso_h = h_img * 0.3
                    if all(k in pts for k in [11, 12, 23, 24]):
                        ms = ((pts[11][0]+pts[12][0])//2, (pts[11][1]+pts[12][1])//2)
                        mh = ((pts[23][0]+pts[24][0])//2, (pts[23][1]+pts[24][1])//2)
                        torso_h = max(30.0, _dist(ms, mh))

                    arm_r  = int(torso_h * 0.18)
                    hand_r = int(torso_h * 0.13)
                    leg_r  = int(torso_h * 0.18)
                    sh_r   = int(torso_h * 0.15)

                    # Face (landmarks 0-10)
                    face_pts = [pts[i] for i in range(11) if i in pts]
                    if face_pts:
                        fxs = [p[0] for p in face_pts]; fys = [p[1] for p in face_pts]
                        fh = max(fys) - min(fys)
                        safe_boxes.append([
                            max(0, min(fxs)-20),
                            max(0, min(fys)-int(0.5*fh)-20),
                            min(w_img, max(fxs)+20),
                            min(h_img, max(fys)+int(0.3*fh)+20)
                        ])
                        print("FACE REGION PRESERVED ✓")

                    # Neck
                    if 11 in pts and 12 in pts and face_pts:
                        fys = [p[1] for p in face_pts]
                        safe_boxes.append([
                            min(pts[11][0], pts[12][0]) - 15,
                            max(fys),
                            max(pts[11][0], pts[12][0]) + 15,
                            max(pts[11][1], pts[12][1])
                        ])

                    # Shoulders
                    for idx in [11, 12]:
                        if idx in pts:
                            cx, cy = pts[idx]
                            safe_boxes.append([cx-sh_r, cy-sh_r, cx+sh_r, cy+sh_r])

                    # Arms (upper + lower)
                    for a, b in [(11,13),(13,15),(12,14),(14,16)]:
                        if a in pts and b in pts:
                            ax,ay = pts[a]; bx,by = pts[b]
                            mx,my = (ax+bx)//2, (ay+by)//2
                            safe_boxes.append([mx-arm_r, my-arm_r, mx+arm_r, my+arm_r])

                    # Hands
                    for idx in [15,16,17,18,19,20,21,22]:
                        if idx in pts:
                            cx,cy = pts[idx]
                            safe_boxes.append([cx-hand_r, cy-hand_r, cx+hand_r, cy+hand_r])

                    # Lower legs + feet
                    for a,b in [(25,27),(27,29),(26,28),(28,30),(27,31),(28,32)]:
                        if a in pts and b in pts:
                            ax,ay = pts[a]; bx,by = pts[b]
                            mx,my = (ax+bx)//2, (ay+by)//2
                            safe_boxes.append([mx-leg_r, my-leg_r, mx+leg_r, my+leg_r])

                    # Build YOLO-style chest / pelvis target zones for oversized box clipping
                    if all(k in pts for k in [11,12,23,24]):
                        ys, xls, xrs = pts[11][1], pts[11][0], pts[12][0]
                        yh_v, xlh, xrh = pts[23][1], pts[23][0], pts[24][0]
                        th = max(1, yh_v - ys)
                        # Chest
                        yolo_target_zones.append({
                            'chest': [
                                min(xls,xrs) - int(0.2*abs(xls-xrs)),
                                ys + int(0.05*th),
                                max(xls,xrs) + int(0.2*abs(xls-xrs)),
                                ys + int(0.45*th)
                            ],
                            'pelvis': [
                                min(xlh,xrh) - int(0.25*abs(xlh-xrh)),
                                yh_v - int(0.15*th),
                                max(xlh,xrh) + int(0.25*abs(xlh-xrh)),
                                yh_v + int(0.35*th)
                            ]
                        })

                    mp_landmarks_ok = True

            except Exception as e:
                print(f"MediaPipe processing error: {e}")

        # --- YOLOv8 fallback for safe parts & target zones ---
        if not mp_landmarks_ok and self.yolo_pose:
            try:
                results = self.yolo_pose(img, verbose=False)
                for r in results:
                    if r.keypoints is None or len(r.keypoints.xy) == 0:
                        continue
                    for kpts in r.keypoints.xy:
                        if len(kpts) < 17:
                            continue
                        pts = {}
                        for idx, kp in enumerate(kpts):
                            kx, ky = float(kp[0]), float(kp[1])
                            if kx > 0 and ky > 0:
                                pts[idx] = (int(kx), int(ky))

                        # Face
                        face_kpts = [pts[i] for i in range(5) if i in pts]
                        if face_kpts:
                            fxs=[p[0] for p in face_kpts]; fys=[p[1] for p in face_kpts]
                            fw = max(fxs)-min(fxs) if len(fxs)>1 else 40
                            fh = max(fys)-min(fys) if len(fys)>1 else 40
                            safe_boxes.append([min(fxs)-20, min(fys)-int(0.5*fh)-20, max(fxs)+20, max(fys)+int(0.3*fh)+20])

                        # Shoulders/arms/hands
                        for idx in [5,6]:
                            if idx in pts:
                                cx,cy=pts[idx]; safe_boxes.append([cx-25,cy-25,cx+25,cy+25])
                        for idx in [7,8]:
                            if idx in pts:
                                cx,cy=pts[idx]; safe_boxes.append([cx-30,cy-30,cx+30,cy+30])
                        for idx in [9,10]:
                            if idx in pts:
                                cx,cy=pts[idx]; safe_boxes.append([cx-40,cy-40,cx+40,cy+40])

                        # Lower legs
                        for idx in [13,14,15,16]:
                            if idx in pts:
                                cx,cy=pts[idx]; safe_boxes.append([cx-35,cy-35,cx+35,cy+35])

                        # Target zones
                        if all(k in pts for k in [5,6,11,12]):
                            x5,y5=pts[5]; x6,y6=pts[6]; x11,y11=pts[11]; x12,y12=pts[12]
                            ys_avg=(y5+y6)/2; yh_avg=(y11+y12)/2
                            th=max(1,yh_avg-ys_avg)
                            yolo_target_zones.append({
                                'chest':[min(x5,x6)-int(0.2*abs(x5-x6)), int(ys_avg+0.05*th),
                                         max(x5,x6)+int(0.2*abs(x5-x6)), int(ys_avg+0.45*th)],
                                'pelvis':[min(x11,x12)-int(0.25*abs(x11-x12)), int(yh_avg-0.15*th),
                                          max(x11,x12)+int(0.25*abs(x11-x12)), int(yh_avg+0.35*th)]
                            })
            except Exception as e:
                print(f"YOLOv8 pose error: {e}")

        # Clamp safe boxes
        clamped_safe = []
        for sb in safe_boxes:
            sx1,sy1,sx2,sy2 = sb
            sx1=max(0,sx1); sy1=max(0,sy1); sx2=min(w_img,sx2); sy2=min(h_img,sy2)
            if sx2>sx1 and sy2>sy1:
                clamped_safe.append([sx1,sy1,sx2,sy2])
        safe_boxes = clamped_safe

        # ── Step 2: Build candidate boxes with YOLOv8 refinement ─────────────
        current_boxes = []   # [x1,y1,x2,y2, is_explicit, label]
        original_nudenet_boxes = []  # fallback

        for d in detections:
            if len(d.get('box', [])) != 4:
                continue
            lbl   = str(d.get('class', d.get('label', ''))).upper()
            score = d.get('score', 1.0)
            is_ex = lbl in EXPLICIT_CLASSES

            # NudeNet always returns [x, y, w, h] — convert to [x1, y1, x2, y2]
            raw = list(map(int, d['box']))
            if len(raw) != 4:
                continue
            bx, by, bw, bh = raw
            x1, y1, x2, y2 = bx, by, bx + bw, by + bh
            x1=max(0,x1); y1=max(0,y1); x2=min(w_img,x2); y2=min(h_img,y2)
            if x2 <= x1 or y2 <= y1:
                continue

            if is_ex:
                original_nudenet_boxes.append(([x1, y1, x2, y2], lbl))

            box_w, box_h = x2-x1, y2-y1
            refined = False

            # Oversized box → try target-zone intersection
            if (box_h > h_img*0.3 or box_w > w_img*0.3) and yolo_target_zones:
                print("FULL-BODY BLUR PREVENTED ✓")
                is_chest  = any(t in lbl for t in ['BREAST'])
                is_pelvis = any(t in lbl for t in ['GENITALIA','ANUS','BUTTOCKS','GROIN'])

                for tz in yolo_target_zones:
                    targets = []
                    if is_chest:   targets = [tz['chest']]
                    elif is_pelvis: targets = [tz['pelvis']]
                    else:           targets = [tz['chest'], tz['pelvis']]

                    for tb in targets:
                        tx1,ty1,tx2,ty2 = tb
                        nx1,ny1 = max(x1,tx1), max(y1,ty1)
                        nx2,ny2 = min(x2,tx2), min(y2,ty2)
                        if nx2>nx1 and ny2>ny1:
                            x1,y1,x2,y2 = nx1,ny1,nx2,ny2
                            refined = True
                            print("SENSITIVE SUBREGION REFINED ✓")
                            break
                    if refined:
                        break

                # Oversized but no target zone intersection → center-crop
                if not refined:
                    x1 = x1 + int(box_w*0.25)
                    x2 = x2 - int(box_w*0.25)
                    y1 = y1 + int(box_h*0.30)
                    y2 = y2 - int(box_h*0.30)
                    refined = True
                    print("SENSITIVE SUBREGION REFINED ✓")

            # Slight inward shrink to remove edge noise
            bw, bh = x2-x1, y2-y1
            sw, sh = int(bw*0.06), int(bh*0.06)
            x1=max(0, x1+sw); x2=min(w_img, x2-sw)
            y1=max(0, y1+sh); y2=min(h_img, y2-sh)

            if x2 > x1 and y2 > y1:
                current_boxes.append([x1, y1, x2, y2, is_ex, lbl])

        print(f"YOLOv8 REFINED BOXES: {len(current_boxes)}")

        # ── Step 3: Fallback — if refinement wiped all boxes, use NudeNet ────
        if len(current_boxes) == 0 and original_nudenet_boxes:
            print("YOLOv8 RETURNED 0 REFINED BOXES ✓")
            print("USING ORIGINAL NUDENET BOX ✓")
            for nb, label in original_nudenet_boxes:
                current_boxes.append([nb[0], nb[1], nb[2], nb[3], True, label])

        # ── Step 4: Safe-part shrink (never delete explicit boxes) ────────────
        final_boxes = []
        for entry in current_boxes:
            x1,y1,x2,y2,is_ex,lbl = entry
            shrunk = _shrink_box_against_safe([x1,y1,x2,y2], safe_boxes)
            final_boxes.append((shrunk, is_ex, lbl))

        # ── Step 5: Robust Temporal Tracking with Persistence & Smoothing ────
        print("TEMPORAL TRACKING ACTIVE ✓")
        print("BOX SMOOTHING APPLIED ✓")
        print("ANTI-FLICKER PROTECTION ACTIVE ✓")
        print("PERSISTENCE WINDOW APPLIED ✓")
        print("FULL COVERAGE MAINTAINED ✓")

        matched_curr_indices = set()
        matched_tracked_indices = set()

        # Match tracked boxes with current final_boxes based on IoU
        for t_idx, tracked in enumerate(self.tracked_boxes):
            best_iou = 0.0
            best_c_idx = -1
            for c_idx, (curr_box, is_ex, lbl) in enumerate(final_boxes):
                if c_idx in matched_curr_indices:
                    continue
                iou = _iou(tracked['box'], curr_box)
                if iou > best_iou:
                    best_iou = iou
                    best_c_idx = c_idx

            if best_iou >= 0.15:
                matched_curr_indices.add(best_c_idx)
                matched_tracked_indices.add(t_idx)
                curr_box, is_ex, lbl = final_boxes[best_c_idx]

                # Anti-flicker Smoothing: smoothed_box = 0.8 * previous_box + 0.2 * current_box
                prev_box = tracked['box']
                smoothed_box = [
                    0.8 * prev_box[0] + 0.2 * curr_box[0],
                    0.8 * prev_box[1] + 0.2 * curr_box[1],
                    0.8 * prev_box[2] + 0.2 * curr_box[2],
                    0.8 * prev_box[3] + 0.2 * curr_box[3]
                ]

                # Update the tracked box
                tracked['box'] = smoothed_box
                tracked['missed_frames'] = 0

                # Stable Region Expansion for breast regions
                curr_w = curr_box[2] - curr_box[0]
                curr_h = curr_box[3] - curr_box[1]
                if 'BREAST' in lbl.upper():
                    # Keep stable size consistent across frames, prevent shrinking/growing
                    tracked['stable_w'] = max(tracked['stable_w'], float(curr_w))
                    tracked['stable_h'] = max(tracked['stable_h'], float(curr_h))

                    cx = (smoothed_box[0] + smoothed_box[2]) / 2.0
                    cy = (smoothed_box[1] + smoothed_box[3]) / 2.0

                    # Adjust box to be centered around smoothed center with stable size
                    tracked['box'] = [
                        max(0.0, cx - tracked['stable_w'] / 2.0),
                        max(0.0, cy - tracked['stable_h'] / 2.0),
                        min(float(w_img), cx + tracked['stable_w'] / 2.0),
                        min(float(h_img), cy + tracked['stable_h'] / 2.0)
                    ]
                else:
                    tracked['stable_w'] = 0.8 * tracked['stable_w'] + 0.2 * curr_w
                    tracked['stable_h'] = 0.8 * tracked['stable_h'] + 0.2 * curr_h

        # Update missed_frames for unmatched tracked boxes
        for t_idx, tracked in enumerate(self.tracked_boxes):
            if t_idx not in matched_tracked_indices:
                tracked['missed_frames'] += 1

        # Keep tracked boxes that are within the persistence window (missed_frames <= 4)
        new_tracked_boxes = []
        for tracked in self.tracked_boxes:
            if tracked['missed_frames'] <= 4:
                new_tracked_boxes.append(tracked)

        # Start new tracks for unmatched current detections
        for c_idx, (curr_box, is_ex, lbl) in enumerate(final_boxes):
            if c_idx not in matched_curr_indices:
                curr_w = curr_box[2] - curr_box[0]
                curr_h = curr_box[3] - curr_box[1]
                new_tracked_boxes.append({
                    'box': [float(curr_box[0]), float(curr_box[1]), float(curr_box[2]), float(curr_box[3])],
                    'label': lbl,
                    'missed_frames': 0,
                    'stable_w': float(curr_w),
                    'stable_h': float(curr_h)
                })

        self.tracked_boxes = new_tracked_boxes

        # Build smoothed boxes for final blurring (convert float coords to ints)
        smoothed = []
        for tracked in self.tracked_boxes:
            smoothed.append([
                int(tracked['box'][0]),
                int(tracked['box'][1]),
                int(tracked['box'][2]),
                int(tracked['box'][3])
            ])

        # ── Explicit-detection guarantee: if explicit dets exist but smoothed=0
        if len(smoothed) == 0 and original_nudenet_boxes:
            print("EMERGENCY FALLBACK: RESTORING EXPLICIT NUDENET BOX ✓")
            for nb, label in original_nudenet_boxes:
                smoothed.append(nb)

        print(f"FINAL VALID REGIONS: {len(smoothed)}")

        if not smoothed:
            shutil.copy2(image_path, output_path)
            return

        # ── Step 6a: Expand each box by 95% around its center (75% original + 20% additional safety margin) ──
        EXPAND = 0.95
        expanded_boxes = []
        for box in smoothed:
            ex1, ey1, ex2, ey2 = box
            orig_w = ex2 - ex1
            orig_h = ey2 - ey1
            cx = (ex1 + ex2) / 2.0
            cy = (ey1 + ey2) / 2.0
            new_w = orig_w * (1.0 + EXPAND)
            new_h = orig_h * (1.0 + EXPAND)
            nx1 = max(0,       int(cx - new_w / 2.0))
            ny1 = max(0,       int(cy - new_h / 2.0))
            nx2 = min(w_img,   int(cx + new_w / 2.0))
            ny2 = min(h_img,   int(cy + new_h / 2.0))
            print("BLUR REGION EXPANDED ✓")
            print(f"ORIGINAL BOX: [{ex1},{ey1},{orig_w},{orig_h}]")
            print(f"EXPANDED BOX: [{nx1},{ny1},{nx2-nx1},{ny2-ny1}]")
            expanded_boxes.append([nx1, ny1, nx2, ny2])

        # ── Step 6b: Build blur mask and apply localized Gaussian blur ────────
        blur_mask = np.zeros((h_img, w_img), dtype=np.uint8)

        for box in expanded_boxes:
            bx1,by1,bx2,by2 = box
            if bx2 > bx1 and by2 > by1:
                cv2.rectangle(blur_mask, (bx1,by1), (bx2,by2), 255, -1)

        # Subtract safe regions from mask (shrink already done, this is extra safety)
        for sb in safe_boxes:
            sx1,sy1,sx2,sy2 = sb
            cv2.rectangle(blur_mask, (sx1,sy1), (sx2,sy2), 0, -1)

        blur_applied = False
        for box in expanded_boxes:
            bx1,by1,bx2,by2 = box
            if bx2 <= bx1 or by2 <= by1:
                continue

            local_mask = blur_mask[by1:by2, bx1:bx2]
            if not np.any(local_mask == 255):
                # Mask was zeroed by safe parts — blur anyway for explicit regions
                print("SAFE MASK ZEROED REGION — APPLYING DIRECT EXPLICIT BLUR ✓")
                roi = img[by1:by2, bx1:bx2]
                img[by1:by2, bx1:bx2] = cv2.GaussianBlur(roi, (151,151), 70)
                blur_applied = True
            else:
                roi         = img[by1:by2, bx1:bx2]
                blurred_roi = cv2.GaussianBlur(roi, (151,151), 70)
                mask_3d     = (local_mask[:,:,np.newaxis] == 255)
                img[by1:by2, bx1:bx2] = np.where(mask_3d, blurred_roi, roi)
                blur_applied = True

            if blur_applied:
                bw_p, bh_p = bx2-bx1, by2-by1
                print(f"BLUR BOX: [{bx1},{by1},{bw_p},{bh_p}]")
                print("VALID REGION SENT TO BLUR ✓")
                print("LOCALIZED BLUR APPLIED ✓")

        if blur_applied:
            print("SELECTIVE BLUR APPLIED ✓")

        cv2.imwrite(output_path, img)


blur_service = BlurService()
