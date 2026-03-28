import { state } from './state.js';
import { updateCanvasRect } from './utils.js';
import { saveState } from './history.js';

export function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.body.classList.toggle('light-mode');
    document.getElementById('theme-btn').textContent = state.isDarkMode ? '⚪' : '⚫';

    const adaptiveSwatch = document.querySelector('.color-swatch[title="Adaptive White/Black"]');
    if (!state.isDarkMode && state.selectedColor.toLowerCase() === '#ffffff') {
        state.selectedColor = '#000000';
        adaptiveSwatch.style.backgroundColor = '#000000';
        adaptiveSwatch.setAttribute('data-color', '#000000');
    } else if (state.isDarkMode && state.selectedColor.toLowerCase() === '#000000') {
        state.selectedColor = '#ffffff';
        adaptiveSwatch.style.backgroundColor = '#ffffff';
        adaptiveSwatch.setAttribute('data-color', '#ffffff');
    }
    
    document.querySelector('#color-btn .color-preview').style.backgroundColor = state.selectedColor;
    if (!state.isDarkMode) {
        adaptiveSwatch.style.backgroundColor = '#000000';
        adaptiveSwatch.setAttribute('data-color', '#000000');
    } else {
        adaptiveSwatch.style.backgroundColor = '#ffffff';
        adaptiveSwatch.setAttribute('data-color', '#ffffff');
    }

    const data = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
    for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i + 3] > 0) {
            const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
            const isWhite = r > 240 && g > 240 && b > 240;
            const isBlack = r < 15 && g < 15 && b < 15;
            if (isWhite || isBlack) {
                data.data[i] = 255 - r;
                data.data[i + 1] = 255 - g;
                data.data[i + 2] = 255 - b;
            }
        }
    }
    state.ctx.putImageData(data, 0, 0);
    updateCursorColor(state.selectedColor);
    if (state.currentTool === 'eraser') updateEraserCursor(state.currentEraserSize);
    saveState();
}

export function toggleGrid() {
    state.isGridVisible = !state.isGridVisible;
    state.container.classList.toggle('show-grid', state.isGridVisible);
    document.getElementById('grid-btn').classList.toggle('active', state.isGridVisible);
}

export function toggleGridSettings(forceOpen) {
    const settings = document.getElementById('grid-settings');
    if (forceOpen !== undefined) {
        settings.classList.toggle('active', forceOpen);
    } else {
        settings.classList.toggle('active');
    }
}

export function updateGridSpacing() {
    const gx = document.getElementById('grid-x-input').value || 30;
    const gy = document.getElementById('grid-y-input').value || 30;
    document.documentElement.style.setProperty('--grid-x', gx + 'px');
    document.documentElement.style.setProperty('--grid-y', gy + 'px');
}

export function updateCursorColor(hexColor) {
    const isDark = document.body.classList.contains('dark-mode');
    const strokeColor = isDark ? 'white' : 'black';
    const penPath = "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${penPath}" fill="${hexColor}"/></svg>`;
    const encodedSvg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    document.documentElement.style.setProperty('--cursor-pen', `url('${encodedSvg}') 0 24, auto`, 'important');
}

export function updateEraserCursor(size) {
    const displaySize = Math.min(size, 100);
    const halfSize = Math.floor(displaySize / 2);
    const isDark = document.body.classList.contains('dark-mode');
    const strokeColor = isDark ? 'white' : 'black';
    const innerColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const fill = isDark ? 'rgba(23, 22, 22, 0.5)' : 'rgba(234, 227, 227, 0.5)';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${displaySize}" height="${displaySize}" viewBox="0 0 ${displaySize} ${displaySize}"><circle cx="${halfSize}" cy="${halfSize}" r="${halfSize - 1}" fill="${fill}" stroke="${strokeColor}" stroke-width="1"/><circle cx="${halfSize}" cy="${halfSize}" r="${halfSize - 2}" fill="none" stroke="${innerColor}" stroke-width="1"/></svg>`;
    const encodedSvg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    document.documentElement.style.setProperty('--cursor-eraser', `url('${encodedSvg}') ${halfSize} ${halfSize}, auto`, 'important');
}

export function updatePageUI() {
    state.currentPageIndex = state.pageOrder.indexOf(state.currentPageId);
    const displays = document.querySelectorAll('.cur-pg-display');
    displays.forEach(d => {
        d.innerText = state.currentPageIndex + 1;
    });
    
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const delBtn = document.getElementById('del-page');

    if (prevBtn) prevBtn.classList.toggle('disabled', state.currentPageIndex === 0);
    if (nextBtn) nextBtn.classList.toggle('disabled', state.currentPageIndex === state.pageOrder.length - 1);
    if (delBtn) delBtn.classList.toggle('disabled', state.pageOrder.length <= 1);
}

export function updateUndoRedoUI() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) {
        undoBtn.disabled = state.history.length <= 1;
        undoBtn.style.opacity = state.history.length <= 1 ? '0.3' : '1';
        undoBtn.style.cursor = state.history.length <= 1 ? 'not-allowed' : 'pointer';
    }
    if (redoBtn) {
        redoBtn.disabled = state.redoStack.length === 0;
        redoBtn.style.opacity = state.redoStack.length === 0 ? '0.3' : '1';
        redoBtn.style.cursor = state.redoStack.length === 0 ? 'not-allowed' : 'pointer';
    }
}
