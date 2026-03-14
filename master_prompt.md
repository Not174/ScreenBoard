# Master Engineering Prompt: ScreenBoard Recap

This prompt is designed to instruct an AI to build a professional-grade digital whiteboard application identical to the one we've developed.

---

### **System Prompt / Instructions**

Build a professional, lightweight digital whiteboard application named "ScreenBoard" using Vanilla JavaScript, HTML5 Canvas, and CSS. The app must feature a high-end, responsive UI with smooth animations and deep system integration.

#### **1. Core Infrastructure & UI**
- **Theme Engine:** Implement a Dark Mode (default: `#0f172a` bg) and Light Mode (`#f1f5f9` bg) toggle. Use CSS variables for all colors. Ensure the canvas border and floating navs adapt instantly.
- **Canvas Scaling:** Support High-DPI (Retina) displays by scaling the canvas according to `window.devicePixelRatio`.
- **Navigation:** Create fixed side-navigation "circles" for Page Navigation. Use a centered, floating top toolbar for core tools.
- **Action Buttons:** Place "Open" and "Export" buttons in the **top-right corner**. The Export button should trigger a dropdown menu for format selection.

#### **2. Drawing Tools**
- **Pen Tool:**
    - Custom SVG cursor using a professional pen path (`M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z`).
    - The cursor fill color must dynamically match the selected color picker value.
    - Implement a dual-stroke (black/white) outline for visibility across all themes.
- **Advanced Eraser:**
    - **Logic:** Use `ctx.globalCompositeOperation = 'destination-out'` to erase drawings transparently (ensuring the background grid remains visible).
    - **Dynamic Sizing:** The eraser's visual size should "lerp" and grow (up to 3x base size) when the mouse moves rapidly, providing a responsive cleaning feel.

#### **3. Advanced Grid System**
- **Customizable Axis:** Implement independent X (horizontal) and Y (vertical) spacing controls (default: 30px).
- **Settings UI:** The X/Y inputs should reside in a floating popover menu that appears when the Grid button is clicked. Implement a "click-outside" listener to auto-close this menu.
- **Smart Toggle:** Opening the grid settings should automatically enable the grid display.
- **Rendering:** Use repeated CSS background patterns for performance, with colors that adapt to the active theme (low opacity).

#### **4. Clipboard & Item System**
- **Global Paste Handler:** Listen for `window` paste events.
- **Image Support:** If an image is pasted, convert it to a DataURL and create a movable/resizable `image-container`.
- **Text Stickers:** If text is pasted, render it onto a beautifully styled offscreen canvas (with theme-aware background, border, and padding) and convert it to a movable image item.
- **Interaction:** Every floating item must support:
    - Mouse dragging (Draggable).
    - Corner handles for resizing (Resizable).
    - A context menu with "Copy", "Delete", and "Done" (Flatten to canvas).

#### **5. Page & Export Management**
- **Multi-Page Logic:** Store pages as an array of objects `{ canvasData, items }`.
- **Shortcuts:**
    - `N` / `P` or Arrows: Navigation.
    - `Shift + N`: Insert new page at the current index (without skipping ahead).
    - `Ctrl + Z/Y`: Undo/Redo per page.
- **Multi-Format Export:**
    - **PPTX:** Use `PptxGenJS` to export all pages as slides.
    - **PDF:** Use **jsPDF** for native, high-quality landscape generation (matching slide aspect ratio) with zero margins.
    - **WB Format:** Implement JSON-based session saving/loading.
    - **Native Dialogs:** Use `window.showSaveFilePicker()` for custom naming and location selection.

#### **6. Visual Polish**
- Use **Inter** or **Roboto** typography.
- Avoid generic colors; use a palette like `#38bdf8` for accents.
- Implement smooth transitions (0.3s) for theme shifts.
- Ensure all interactive elements have hover states and active indicators.

---

### **Technical Breakdown for Developers:**
- **Canvas context:** `ctx.getContext('2d', { willReadFrequently: true })`.
- **Persistence:** Use `toDataURL` for session state and history stacks (max 30 steps).
- **Architecture:** Keep logic modular (e.g., `updatePageUI`, `flattenSelection`, `handleSystemPaste`).
