import { state } from './state.js';
import { getPos } from './utils.js';
import { updateEraserCursor } from './ui.js';
import { saveState } from './history.js';
import { saveCurrentPageToMemory } from './pages.js';
import { updateMarquee, captureSelection } from './images.js';

export function startAction(e) {
    const pos = getPos(e);
    state.lastX = pos.x; state.lastY = pos.y;
    if (state.currentTool === 'select') {
        state.selecting = true; state.selStartX = pos.x; state.selStartY = pos.y;
        const marquee = document.getElementById('selection-marquee');
        if (marquee) marquee.style.display = 'block';
        updateMarquee(pos.x, pos.y);
    } else {
        state.drawing = true;
        if (state.currentTool === 'eraser') state.eraserVisualSize = state.currentSize;
        if (state.redoStack.length > 0) state.redoStack = [];
        handleMove(e);
    }
}

export function handleMove(e) {
    state.pendingPos = getPos(e);
    if (!state.animationFrameRequested) {
        state.animationFrameRequested = true;
        requestAnimationFrame(updateDrawing);
    }
}

export function updateDrawing() {
    state.animationFrameRequested = false;
    if (!state.pendingPos) return;
    const pos = state.pendingPos;

    if (state.selecting) {
        updateMarquee(pos.x, pos.y);
    } else if (state.drawing) {
        state.ctx.beginPath();
        state.ctx.moveTo(state.lastX, state.lastY);
        state.ctx.lineTo(pos.x, pos.y);

        if (state.currentTool === 'eraser') {
            state.ctx.globalCompositeOperation = 'destination-out';
            const dist = Math.sqrt(Math.pow(pos.x - state.lastX, 2) + Math.pow(pos.y - state.lastY, 2));
            const targetSize = dist > 5 ? Math.max(100, state.currentSize * 3) : state.currentSize;
            state.eraserVisualSize = state.eraserVisualSize * 0.8 + targetSize * 0.2;
            state.ctx.lineWidth = state.eraserVisualSize;
            
            if (Math.abs(state.eraserVisualSize - state.lastCursorSize) > 2) {
                updateEraserCursor(state.eraserVisualSize);
                state.lastCursorSize = state.eraserVisualSize;
            }
        } else {
            state.ctx.globalCompositeOperation = 'source-over';
            state.ctx.strokeStyle = state.selectedColor;
            state.ctx.lineWidth = state.currentSize;
        }

        state.ctx.lineCap = 'round';
        state.ctx.lineJoin = 'round';
        state.ctx.stroke();
        state.lastX = pos.x; state.lastY = pos.y;
    }
}

export async function stopAction() {
    const marquee = document.getElementById('selection-marquee');
    if (state.currentTool === 'eraser') {
        updateEraserCursor(state.currentSize);
    }
    // Reset composite operation to avoid affecting other drawing operations
    if (state.ctx) state.ctx.globalCompositeOperation = 'source-over';

    if (state.selecting) {
        const rect = marquee.getBoundingClientRect();
        const crect = state.container.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w > 5 && h > 5) captureSelection(rect.left - crect.left, rect.top - crect.top, w, h);
        if (marquee) marquee.style.display = 'none'; state.selecting = false;
    }
    if (state.drawing) { 
        state.drawing = false; 
        saveState(); 
        await saveCurrentPageToMemory(); 
    }
}

export function updateSize(val) {
    val = parseInt(val) || 1;
    state.currentSize = val;
    if (state.sizeSlider) state.sizeSlider.value = val;
    if (state.sizeInput) state.sizeInput.value = val;
    if (state.currentTool === 'pen') {
        state.currentPenSize = val;
    } else if (state.currentTool === 'eraser') {
        state.currentEraserSize = val;
        updateEraserCursor(val);
    }
}

export function setTool(tool) {
    state.currentTool = tool;
    document.querySelectorAll('#toolbar .btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');

    state.container.classList.remove('tool-pen', 'tool-eraser', 'tool-select');
    state.container.classList.add(`tool-${tool}`);

    if (tool === 'pen') {
        updateSize(state.currentPenSize);
    } else if (tool === 'eraser') {
        updateSize(state.currentEraserSize);
        updateEraserCursor(state.currentEraserSize);
    }
}
