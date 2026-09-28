"""Download the Google Fonts used by the trailer into ./fonts and write fonts/fonts.css."""
import re, os, urllib.request, hashlib
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
FAMILIES = [
    "Noto+Sans+SC:wght@500;700;900",
    "Noto+Serif+SC:wght@600;900",
    "Barlow+Condensed:ital,wght@0,500;0,600;0,800;1,700;1,900",
]
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "fonts")
os.makedirs(out, exist_ok=True)
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=60).read()
css_all = []
for fam in FAMILIES:
    css = get(f"https://fonts.googleapis.com/css2?family={fam}&display=block").decode()
    def repl(m):
        url = m.group(1)
        name = hashlib.md5(url.encode()).hexdigest()[:16] + ".woff2"
        p = os.path.join(out, name)
        if not os.path.exists(p):
            open(p, "wb").write(get(url))
        return f"url({name})"
    css_all.append(re.sub(r"url\((https://[^)]+)\)", repl, css))
open(os.path.join(out, "fonts.css"), "w").write("\n".join(css_all))
print("ok", len(os.listdir(out)), "files")
