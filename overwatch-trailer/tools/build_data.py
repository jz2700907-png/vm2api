"""Bundle story.json + build/vo.json into build/data.js for the page (works from file:// too)."""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
story = json.load(open(os.path.join(ROOT, "story.json")))
vo_path = os.path.join(ROOT, "build", "vo.json")
vo = json.load(open(vo_path)) if os.path.exists(vo_path) else [dict(l, dur=3.0) for l in story["vo"]]
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
with open(os.path.join(ROOT, "build", "data.js"), "w") as f:
    f.write("window.STORY = " + json.dumps(story, ensure_ascii=False) + ";\n")
    f.write("window.VO = " + json.dumps(vo, ensure_ascii=False) + ";\n")
print("wrote build/data.js")
