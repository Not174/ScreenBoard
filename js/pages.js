import { state } from './state.js';
import { updatePageUI, updateUndoRedoUI } from './ui.js';
import { saveState } from './history.js';
import { createImage } from './images.js';
import { autoSave } from './files.js';
import { showToast } from './utils.js';

export async function saveCurrentPageToMemory() {
    if (!state.currentPageId || state.isPageLoading) return;
    state.pagesMap[state.currentPageId] = {
        canvasData: state.canvas.toDataURL(),
        items: Array.from(document.querySelectorAll('.image-container')).map(el => ({
            src: el.querySelector('img').src,
            top: el.style.top,
            left: el.style.left,
            width: el.style.width
        })),
        history: [...state.history],
        redoStack: [...state.redoStack]
    };
    await autoSave();
}

export async function loadPageFromMemory(id) {
    const s = state.pagesMap[id];
    if (!s) return;
    
    state.isPageLoading = true;
    state.currentPageId = id;
    state.currentPageIndex = state.pageOrder.indexOf(id);
    
    document.querySelectorAll('.image-container').forEach(e => e.remove());
    
    state.history = s.history ? [...s.history] : [];
    state.redoStack = s.redoStack ? [...s.redoStack] : [];

    if (s.canvasData) {
        const img = new Image();
        await new Promise((resolve) => {
            img.onload = () => {
                if (state.currentPageId === id) {
                    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
                    const dpr = window.devicePixelRatio || 1;
                    // Draw at CSS dimensions - ctx is already scaled by dpr
                    state.ctx.drawImage(img, 0, 0, state.canvas.width / dpr, state.canvas.height / dpr);
                    
                    if (state.history.length === 0) {
                        saveState(); // Reuse the standardized saveState function
                    }
                }
                resolve();
            };
            img.onerror = resolve;
            img.src = s.canvasData;
        });
    } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        if (state.history.length === 0) saveState();
    }

    if (s.items) s.items.forEach(i => createImage(i.src, i.left, i.top, i.width));
    
    updatePageUI();
    updateUndoRedoUI();
    state.isPageLoading = false;
}

export async function clearCurrentPage() {
    if (confirm("Clear drawings on this page?")) {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        document.querySelectorAll('.image-container').forEach(e => e.remove());
        await saveState(); 
        await saveCurrentPageToMemory();
    }
}

export async function addPage() {
    await saveCurrentPageToMemory();
    const newId = "page-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    state.pagesMap[newId] = { canvasData: null, items: [], history: [], redoStack: [] };
    const currentIndex = state.pageOrder.indexOf(state.currentPageId);
    state.pageOrder.splice(currentIndex + 1, 0, newId);
    await loadPageFromMemory(newId);
    showToast(`Page inserted at ${state.pageOrder.indexOf(newId) + 1}`);
}

export async function deletePage() {
    if (state.pageOrder.length <= 1) {
        await clearCurrentPage();
        return;
    }

    const currentIndex = state.pageOrder.indexOf(state.currentPageId);
    if (confirm(`Delete Page ${currentIndex + 1}?`)) {
        const idToDelete = state.currentPageId;
        const targetId = state.pageOrder[currentIndex + 1] || state.pageOrder[currentIndex - 1];
        
        state.pageOrder.splice(currentIndex, 1);
        delete state.pagesMap[idToDelete];
        
        await loadPageFromMemory(targetId);
        await autoSave(true);
        showToast("Page deleted");
    }
}

export async function nextPage() {
    const currentIndex = state.pageOrder.indexOf(state.currentPageId);
    if (currentIndex < state.pageOrder.length - 1) {
        await saveCurrentPageToMemory();
        await loadPageFromMemory(state.pageOrder[currentIndex + 1]);
    } else {
        showToast("No page exists after this");
    }
}

export async function prevPage() {
    const currentIndex = state.pageOrder.indexOf(state.currentPageId);
    if (currentIndex > 0) {
        await saveCurrentPageToMemory();
        await loadPageFromMemory(state.pageOrder[currentIndex - 1]);
    } else {
        showToast("No page exists before this");
    }
}
