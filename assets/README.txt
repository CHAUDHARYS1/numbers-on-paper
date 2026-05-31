NUMBERS ON PAPER — LOGO PACK
Direction 03 · "Bottom Line"
============================================

CONCEPT
A wordmark-led identity built around a custom geometric lowercase "n"
paired with a square dot — the final figure / bottom line on an invoice.
The same dot repeats after the wordmark, locking the mark and logotype
into one system. Reads cleanly from a 1024px app icon down to a 16px favicon.

TYPEFACE   Space Grotesk (600 / SemiBold) — geometric, tech-forward
           https://fonts.google.com/specimen/Space+Grotesk

COLORS
  Signal Blue   #0A5FFF     (primary accent / dot / icon field)
  Blue Deep     #0047CC     (app-icon gradient base)
  Ink Navy      #0B1B34     (mark + wordmark on light)
  Paper         #FFFFFF     (reversed mark / backgrounds)

------------------------------------------------------------
FILES
------------------------------------------------------------
mark/
  mark-primary.svg        Ink "n" + Signal Blue dot (transparent) — primary mark
  mark-black.svg          One-color ink (transparent)
  mark-white.svg          One-color white, for dark backgrounds (transparent)
  mark-blue.svg           All Signal Blue
  mark-primary-512.png    512px raster, transparent
  mark-white-512.png      512px raster, transparent

app-icon/
  app-icon.svg            Master — blue gradient rounded square, white "n"
  app-icon-1024.png       App stores / source of truth
  app-icon-512.png        Android / PWA
  app-icon-180.png        iOS home screen (apple-touch-icon)

lockup/
  logo-horizontal.svg            Horizontal lockup, transparent (font embedded)
  logo-horizontal-reversed.svg   Reversed (ink background), transparent
  logo-horizontal-onwhite.png    2259×468 raster on white
  logo-horizontal-reversed.png   2259×468 raster on ink navy

favicon/
  favicon.ico             Multi-size .ico (16 / 32 / 48) — drop in site root
  favicon.svg             Scalable favicon (modern browsers)
  favicon-16/32/48/64.png Individual PNG sizes

------------------------------------------------------------
WEB USAGE
------------------------------------------------------------
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/app-icon-180.png">

NOTES
- SVGs are the scalable masters; use them wherever possible.
- The lockup SVGs embed the Space Grotesk subset so they render
  correctly in browsers without the font installed. For editing in
  Illustrator/Figma, install Space Grotesk or use the PNG lockups.
- Keep clear space around the mark equal to the height of the dot.
- Minimum mark size: 16px. Don't recolor the dot off Signal Blue.
