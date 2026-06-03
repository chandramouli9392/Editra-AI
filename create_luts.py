import os

lut_dir = r"c:\Users\chand\OneDrive\Documents\Attachments\Desktop\ai-video-backend\backend\app\presets\luts"
os.makedirs(lut_dir, exist_ok=True)

cube_content = """TITLE "LUT"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0"""

luts = ["cinematic.cube", "vibrant.cube", "monochrome.cube", "vintage.cube", "moody.cube", "teal_orange.cube"]

for lut in luts:
    with open(os.path.join(lut_dir, lut), "w") as f:
        f.write(cube_content)
        
print("LUTs created.")
