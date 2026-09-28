"""Tile stills into a contact sheet: python3 tools/sheet.py out.jpg img1 img2 ... (2 columns, 800px wide each)"""
import sys, subprocess
out, imgs = sys.argv[1], sys.argv[2:]
n = len(imgs); cols = 2; rows = (n + cols - 1) // cols
inputs = []
for i in imgs: inputs += ["-i", i]
f = "".join(f"[{i}:v]scale=800:450[v{i}];" for i in range(n))
layout = "|".join(f"{(i%cols)*800}_{(i//cols)*450}" for i in range(n))
f += "".join(f"[v{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={layout}:fill=black"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + inputs + ["-filter_complex", f, "-frames:v", "1", "-q:v", "3", out], check=True)
