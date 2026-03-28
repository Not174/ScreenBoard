import { state } from './state.js';

export function debounce(f, w) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), w); };
}

export function showToast(msg) {
    if (!state.toast) state.toast = document.getElementById('toast');
    state.toast.innerText = msg; state.toast.style.opacity = 1;
    setTimeout(() => state.toast.style.opacity = 0, 2000);
}

export function getPos(e) {
    if (!state.canvasRect) updateCanvasRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: clientX - state.canvasRect.left, y: clientY - state.canvasRect.top };
}

export function updateCanvasRect() {
    if (!state.canvas) state.canvas = document.getElementById('main-canvas');
    state.canvasRect = state.canvas.getBoundingClientRect();
}

export function textToDataURL(text) {
    const tempCanvas = document.createElement('canvas');
    const tctx = tempCanvas.getContext('2d');
    const font = '16px sans-serif';
    tctx.font = font;

    const lines = text.split('\n');
    let maxWidth = 0;
    lines.forEach(line => {
        const w = tctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
    });

    const hPadding = 20;
    const vPadding = 12;
    const lineHeight = 22;
    tempCanvas.width = maxWidth + hPadding * 2;
    tempCanvas.height = (lines.length * lineHeight) + vPadding * 2;

    tctx.fillStyle = state.isDarkMode ? '#1e293b' : '#ffffff';
    // Simplified roundRect fallback
    if (tctx.roundRect) {
        tctx.beginPath();
        tctx.roundRect(0, 0, tempCanvas.width, tempCanvas.height, 8);
        tctx.fill();
    } else {
        tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    tctx.strokeStyle = state.isDarkMode ? '#38bdf8' : '#2563eb';
    tctx.lineWidth = 2;
    tctx.stroke();

    tctx.font = font;
    tctx.fillStyle = state.isDarkMode ? '#f1f5f9' : '#1e293b';
    tctx.textBaseline = 'top';
    lines.forEach((line, i) => {
        tctx.fillText(line, hPadding, vPadding + (i * lineHeight));
    });

    return tempCanvas.toDataURL();
}
