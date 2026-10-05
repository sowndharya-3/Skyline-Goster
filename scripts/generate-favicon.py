from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "public" / "assets" / "logo.png").convert("RGB")

# Keep the crest and tricolour motif while excluding the wordmark below it.
crest = source.crop((215, 260, 1230, 1160))
crest.thumbnail((470, 470), Image.Resampling.LANCZOS)

favicon = Image.new("RGB", (512, 512), "#080a08")
favicon.paste(crest, ((512 - crest.width) // 2, (512 - crest.height) // 2))
favicon.save(ROOT / "public" / "favicon.png", optimize=True)
