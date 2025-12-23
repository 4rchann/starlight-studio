# Starlight Studio

Starlight Studio is a web-based photobooth application that allows users to capture photos, apply layouts, add stickers, and download a final photostrip directly from the browser.

The project is designed to feel like a real photobooth experience, with automatic multi-photo capture, countdown timers, layout previews, and a customization stage before download.

---

## Features

- Live camera capture using the browser camera
- Multiple layout options with preview thumbnails
- Automatic multi-photo capture based on selected layout
- Configurable countdown timer (3s, 5s, 10s)
- Flash overlay and shutter sound for realistic capture feedback
- Sticker system with drag, scale, and rotate interactions
- Frame and photostrip selection
- Background color, date, and branding text options
- Export final image as a downloadable PNG

---

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript

No backend is required. All processing happens on the client side.

---

## Project Structure

```text
starlight-studio/
├─ assets/
│  ├─ audio/
│  ├─ images/
│  ├─ preview/
│  └─ stickers/
├─ features/
│  ├─ camera.js
│  ├─ canvasRenderer.js
│  ├─ layouts.js
│  ├─ photostrips.js
│  └─ stickerInteraction.js
├─ pages/
│  ├─ editor.html
│  └─ layoutsPicker.html
├─ styles/
├─ index.html
└─ README.md
