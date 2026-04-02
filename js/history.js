import { state } from './state.js';
import { updateUndoRedoUI } from './ui.js';
import { saveCurrentPageToMemory } from './pages.js';
import { createImage } from './images.js';

export function saveState() {
    if (!state.canvas) return;
    const snap = {
        canvas: state.canvas.toDataURL(),
        items: Array.from(document.querySelectorAll('.image-container')).map(el => ({
            src: el.querySelector('img').src,
            top: el.style.top,
            left: el.style.left,
            width: el.style.width
        }))
    };
    state.history.push(JSON.stringify(snap));
    if (state.history.length > 50) state.history.shift();
    state.redoStack = [];
    updateUndoRedoUI();
}

export async function undo() {
    if (state.history.length > 1) {
        state.redoStack.push(state.history.pop());
        await applyState(state.history[state.history.length - 1]);
        await saveCurrentPageToMemory();
        updateUndoRedoUI();
    }
}

export async function redo() {
    if (state.redoStack.length > 0) {
        const s = state.redoStack.pop();
        state.history.push(s);
        await applyState(s);
        await saveCurrentPageToMemory();
        updateUndoRedoUI();
    }
}

export async function applyState(snapJson) {
    const s = JSON.parse(snapJson);
    const img = new Image();
    await new Promise((resolve) => {
        img.onload = () => {
            state.ctx.globalCompositeOperation = 'source-over';
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
            const dpr = window.devicePixelRatio || 1;
            state.ctx.drawImage(img, 0, 0, state.canvas.width / dpr, state.canvas.height / dpr);
            resolve();
        };
        img.onerror = resolve;
        img.src = s.canvas;
    });
    document.querySelectorAll('.image-container').forEach(e => e.remove());
    if (s.items) s.items.forEach(i => createImage(i.src, i.left, i.top, i.width));
}
