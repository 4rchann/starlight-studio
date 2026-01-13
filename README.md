# Starlight Studio

Starlight Studio is a web-based photobooth application that allows users to capture photos, apply layouts, add stickers, and download a final photostrip directly from the browser.

The project is designed to feel like a real photobooth experience, with automatic multi-photo capture, countdown timers, layout previews, and a customization stage before download.

## Features

- Live camera capture using the browser camera
- Multiple layout options with preview thumbnails
- Automatic multi-photo capture based on selected layout
- Countdown timer 3s
- Flash overlay for realistic capture feedback
- Photostrip templates with custom frame support
- Sticker system
- Background color customization
- Export final image as a downloadable PNG

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript

No backend is required. All processing happens on the client side.

## Live Preview

https://4rchann.github.io/starlight-studio/

## Project Structure

```text
starlight-studio/
├─ assets/
│  ├─ images/
│  ├─ photostrips/
│  ├─ preview/
│  └─ stickers/
├─ src/
│  ├─ components/
│  ├─ scripts/
│  │  ├─ features/
│  │  │  ├─ bgAnimation.js
│  │  │  ├─ camera.js
│  │  │  ├─ canvasRenderer.js
│  │  │  ├─ layouts.js
│  │  │  ├─ locationService.js
│  │  │  ├─ photostrips.js
│  │  │  ├─ stickerInteraction.js
│  │  │  ├─ stickers.js
│  │  │  └─ titleAnimation.js
│  │  ├─ pages/
│  │  │  ├─ editor.js
│  │  │  ├─ faq.js
│  │  │  ├─ home.js
│  │  │  └─ layoutsPicker.js
│  │  ├─ include.js
│  │  └─ main.js
│  └─ styles/
│     ├─ base/
│     ├─ components/
│     ├─ pages/
│     └─ styles.css
├─ about.html
├─ editor.html
├─ faq.html
├─ index.html
├─ layouts-picker.html
├─ template.html
└─ README.md
```

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Home page with project introduction |
| `layouts-picker.html` | Select a photo layout before entering the editor |
| `editor.html` | Main photobooth editor with camera capture and customization |
| `about.html` | About page with project information |
| `faq.html` | Frequently asked questions |

## Getting Started

1. Clone the repository
2. Open `index.html` in a browser
3. Allow camera access when prompted
4. Choose a layout and start capturing!

## License

This project is licensed under the MIT License.
