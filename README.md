# ScreenBoard - Professional Whiteboard App

![License](https://img.shields.io/github/license/Not174/ScreenBoard)
![Stars](https://img.shields.io/github/stars/Not174/ScreenBoard)
![Issues](https://img.shields.io/github/issues/Not174/ScreenBoard)

ScreenBoard is a powerful, lightweight, and professional-grade digital whiteboard built with modern web technologies. It features a sleek, responsive design with advanced drawing tools, multi-page support, and a premium user experience.

## ✨ Key Features

### 🎨 Drawing & Editing
- **Professional Pen:** High-precision pen with dynamic cursor that matches your chosen color.
- **Dynamic Eraser:** Intelligent eraser that grows with speed and uses transparency mode (`destination-out`) to preserve the background grid.
- **Smart Theming:** Seamless Dark and Light modes. Drawings (Black/White) and UI elements automatically adapt for perfect contrast.
- **Item System:** Support for movable and resizable images and text stickers.

### 📋 Clipboard Integration
- **Direct Paste:** Paste images directly from the web or local files using `Ctrl + V`.
- **Text Notes:** Paste text to create beautiful, styled sticky notes automatically.
- **Items:** All pasted content remains movable, resizable, and can be flattened onto the canvas at any time.

### 🌐 Advanced Grid System
- **X/Y Independence:** Control horizontal and vertical grid spacing independently.
- **Premium Interface:** Settings are tucked away in a sleek floating popover.
- **Theme Adaptive:** Gridlines adjust visibility based on the active theme.

### 📄 Project Management
- **Multi-Page Support:** Insert, delete, and navigate between multiple pages effortlessly.
- **Export to PPTX:** Save your entire session as a professional, multi-slide PowerPoint presentation (Landscape Wide).
- **Native PDF Export:** Generate high-quality PDFs using **jsPDF** in the background, ensuring slides fill the page perfectly with zero margins.
- **Reusable .WB Format:** Save and load your whiteboard sessions with all layers and pages intact.
- **Native File Picking:** Choose your filename and save location using the standard system "Save As" dialog (via File System Access API).

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `D` | Switch to Pen Tool |
| `E` | Switch to Eraser Tool |
| `G` | Toggle Grid / Open Grid Settings |
| `Shift + N` | Add/Insert New Page |
| `N` / `→` | Next Page |
| `P` / `←` | Previous Page |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + V` | Paste (Images & Text) |
| `Delete` / `Backspace` | Delete Selected Item |
| `Esc` | Flatten/Deselect Selection |

## 🚀 Getting Started

### 🖥️ For Users (Windows)
1. Download the latest release.
2. Run `WhiteboardApp.exe`. No installation required!

### 💻 For Developers
1. **Option 1 (Browser only):** Simply open `index.html` in any modern web browser.
2. **Option 2 (Python App):**
   - Ensure you have Python installed.
   - Install dependencies: `pip install -r requirements.txt`
   - Run the app: `python main_app.py`

## 🛠️ Building from Source

To create a standalone `.exe`:
1. Install PyInstaller: `pip install pyinstaller`
2. Run the build command: `pyinstaller WhiteboardApp.spec`
3. The new executable will be in the `dist/` folder.

## 🛠️ Built With
- HTML5 Canvas API
- Vanilla CSS with CSS Variables
- Pure JavaScript (ES6+)

## 👤 Author

**Shemanto Debnath**
- 🎓 CSE Department, RUET (Rajshahi University of Engineering & Technology)
- 📍 Rajshahi, Bangladesh
- 🐙 GitHub: [@Not174](https://github.com/Not174)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Not174/ScreenBoard/issues).

## 📜 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.

---
Developed with ❤️ by Shemanto Debnath
