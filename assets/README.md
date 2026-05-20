# Assets

Drop the following PNGs here before building:

| File | Size | Purpose |
| ---- | ---- | ------- |
| `icon.png` | 1024×1024 | App icon (Play Store + iOS) |
| `adaptive-icon.png` | 1024×1024 (transparent fg) | Android adaptive icon foreground |
| `splash.png` | 1242×2436 | Splash screen — centered orb on `#0B0B10` |
| `notification-icon.png` | 96×96 (white on transparent) | Android notification icon |

## Recommended icon design

A single soft, glowing orb (the "mind mirror") on the deep ink background
`#0B0B10`. The orb gradient flows from `#A78BFA` → `#F4B6B6`. No wordmark
inside the icon.

You can generate placeholders quickly with:

```bash
# macOS / Linux with ImageMagick
convert -size 1024x1024 xc:'#0B0B10' \
  -fill '#A78BFA' -draw "circle 512,512 512,256" \
  icon.png
```

Replace with a designer-made version before Play Store submission.
