# Message Studio

A single-page web app that recreates an iPhone Messages thread so you can compose
your own conversations — both sides, with your own timestamps, contact name and
photo — for mockups, videos, and storytelling content.

**Live:** https://mmwilliams.github.io/message-studio/

## Features

- Pixel-styled iMessage thread: blue/gray bubbles with tails, message grouping,
  time separators (Today / Yesterday / weekday), jumbo emoji, Delivered/Read receipt
- Live status bar — the clock shows the **real current time**, with Wi-Fi/signal
  icons and an adjustable battery (with or without percentage)
- Editor panel: add/edit/delete messages, set each message's date & time
  (thread auto-sorts by time), toggle each message between **Me** and **Them**
- Contact name + photo (photo is downscaled and stored locally), initials avatar fallback
- Dynamic Island, dark mode, optional device frame on desktop
- Fits real iPhone screen sizes exactly — iPhone 16/17 Pro Max by default, with
  presets for Pro/Plus/Air/mini/SE and older models (pick the one you're viewing
  on for a pixel-perfect 1:1 render)
- Keyboard-aware layout: when the on-screen keyboard opens, the composer sits
  directly on top of it
- Working composer — type in the iMessage field and hit send to add a blue
  message stamped with the current time
- Everything persists in `localStorage` (survives refresh, per-browser).
  Export/Import JSON to back up or move a thread
- Fullscreen mode to hide the browser UI

## Controls

| Action | How |
|---|---|
| Open editor | Triple-tap the phone, or press `E` |
| Close editor | `✕`, or `Esc` |
| Fullscreen | `F` or the Fullscreen button |

## Fullscreen on iPhone

iOS Safari doesn't allow true fullscreen for web pages. Instead: Share →
**Add to Home Screen**, then launch it from the icon — it opens without any
browser UI. Untick *"Fake status bar + home bar"* in the editor so the phone's
real status bar (with the real time) takes over.

## Run locally

It's plain HTML/CSS/JS — no build step:

```
python -m http.server 8080
# open http://localhost:8080
```

## Deploy

Hosted on GitHub Pages from the `main` branch root. Any push to `main` redeploys.
