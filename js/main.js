import { state, initState } from './state.js';
import { debounce, updateCanvasRect } from './utils.js';
import {
    toggleTheme, toggleGrid, toggleGridSettings, updateGridSpacing,
    updateCursorColor, updateUndoRedoUI
} from './ui.js';
import {
    prevPage, nextPage, addPage, deletePage,
    saveCurrentPageToMemory, loadPageFromMemory, clearCurrentPage
} from './pages.js';
import { undo, redo, saveState } from './history.js';
import {
    startAction, handleMove, stopAction, setTool, updateSize
} from './drawing.js';
import {
    handleUpload, handleSystemPaste, deselectAllImages, flattenSelection
} from './images.js';
import {
    autoSave, autoLoad, exportToFile, importFromFile
} from './files.js';
import { saveAsPDF, exportToPPTX } from './exports.js';

async function init() {
    initState();

    // 1. Initial Scale & Size
    resizeCanvas(true);
    window.addEventListener('resize', () => resizeCanvas(false));

    // 2. Set Up UI Events
    setupEventListeners();

    // 3. Load Data
    await autoLoad();

    // 4. Final Updates
    updateSize(state.currentPenSize);
    updateCursorColor(state.selectedColor);
    updateUndoRedoUI();

    if (state.pageOrder.length === 1 && state.history.length === 0) {
        saveState();
        saveCurrentPageToMemory();
    }
}

function setupEventListeners() {
    // Tool Buttons
    document.getElementById('pen-tool').onclick = () => { flattenSelection(); setTool('pen'); };
    document.getElementById('eraser-tool').onclick = () => { flattenSelection(); setTool('eraser'); };
    document.getElementById('select-tool').onclick = () => setTool('select');

    // Page Navigation
    document.getElementById('prev-page').onclick = prevPage;
    document.getElementById('next-page').onclick = nextPage;
    document.getElementById('add-page').onclick = addPage;
    document.getElementById('del-page').onclick = deletePage;

    // Theme & Grid
    document.getElementById('theme-btn').onclick = toggleTheme;
    document.getElementById('grid-btn').onclick = (e) => {
        e.stopPropagation();
        toggleGrid();
        toggleGridSettings(state.isGridVisible);
    };
    document.getElementById('grid-settings').onclick = (e) => e.stopPropagation();
    window.addEventListener('click', () => {
        const settings = document.getElementById('grid-settings');
        if (settings && settings.classList.contains('active')) {
            settings.classList.remove('active');
        }
    });
    document.getElementById('grid-x-input').oninput = updateGridSpacing;
    document.getElementById('grid-y-input').oninput = updateGridSpacing;

    // Actions
    document.getElementById('clear-btn').onclick = clearCurrentPage;
    document.getElementById('undo-btn').onclick = undo;
    document.getElementById('redo-btn').onclick = redo;
    document.getElementById('upload-btn').onclick = () => document.getElementById('file-input').click();
    document.getElementById('file-input').onchange = handleUpload;

    // Export Dropdown
    document.getElementById('export-toggle-btn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('export-dropdown').classList.toggle('active');
    };
    window.addEventListener('click', () => {
        const dropdown = document.getElementById('export-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    });

    document.getElementById('export-pptx').onclick = exportToPPTX;
    document.getElementById('export-pdf').onclick = saveAsPDF;
    document.getElementById('export-wb').onclick = exportToFile;

    // Open File
    document.getElementById('open-btn').onclick = async () => {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{ description: 'Whiteboard File', accept: { 'application/json': ['.wb'] } }]
                });
                state.currentFileHandle = handle;
                const file = await handle.getFile();
                const content = await file.text();
                const { processImportedContent } = await import('./files.js');
                processImportedContent(content);

                document.getElementById('sync-filename').innerText = handle.name;
                if (state.isFileSyncEnabled) {
                    document.getElementById('sync-filename').style.display = 'inline';
                    document.getElementById('file-sync-container').classList.add('sync-active');
                }
            } catch (err) { console.warn("File pick cancelled", err); }
        } else {
            document.getElementById('wb-file-input').click();
        }
    };
    document.getElementById('wb-file-input').onchange = importFromFile;

    // Canvas Events
    if (state.canvas) {
        state.canvas.addEventListener('mousedown', startAction);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', stopAction);
    }

    window.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.image-container') && !e.target.closest('#toolbar')) deselectAllImages();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        const selected = document.querySelector('.image-container.selected');
        if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
            selected.remove(); saveState();
            import('./utils.js').then(m => m.showToast('Deleted'));
        }
        if (isCtrl && e.key === 'c' && selected) {
            const img = selected.querySelector('img');
            fetch(img.src).then(res => res.blob()).then(blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]);
                import('./utils.js').then(m => m.showToast('Copied to Clipboard'));
            });
        }
        if (e.key === 'Escape') flattenSelection();
        else if (isCtrl && e.key === 'z') { e.preventDefault(); undo(); }
        else if (isCtrl && e.key === 'y') { e.preventDefault(); redo(); }
        else if (e.shiftKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); addPage(); }
        else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
        else if ((e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') && !e.shiftKey) { e.preventDefault(); nextPage(); }

        if (!isCtrl && !e.altKey && !e.shiftKey) {
            if (e.key === 'd' || e.key === 'D') { flattenSelection(); setTool('pen'); }
            else if (e.key === 'e' || e.key === 'E') { flattenSelection(); setTool('eraser'); }
            else if (e.key === 'g' || e.key === 'G') { toggleGrid(); }
        }
    });

    // Size & Color
    if (state.sizeSlider) state.sizeSlider.oninput = (e) => updateSize(e.target.value);
    if (state.sizeInput) state.sizeInput.oninput = (e) => updateSize(e.target.value);

    // Color Swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            state.selectedColor = swatch.getAttribute('data-color');
            const preview = document.querySelector('#color-btn .color-preview');
            if (preview) preview.style.backgroundColor = state.selectedColor;
            updateCursorColor(state.selectedColor);
            const dropdown = document.getElementById('color-dropdown');
            if (dropdown) dropdown.classList.remove('active');
        };
    });

    const colorBtn = document.getElementById('color-btn');
    if (colorBtn) {
        colorBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('color-dropdown').classList.toggle('active');
        };
    }

    window.addEventListener('click', () => {
        const dropdown = document.getElementById('color-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    });

    // Sync Toggle
    const syncToggle = document.getElementById('sync-toggle');
    if (syncToggle) {
        syncToggle.onchange = async () => {
            state.isFileSyncEnabled = syncToggle.checked;
            if (state.isFileSyncEnabled) {
                if (!state.currentFileHandle) {
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: `whiteboard_${Date.now()}.wb`,
                            types: [{ description: 'Whiteboard File', accept: { 'application/json': ['.wb'] } }]
                        });
                        state.currentFileHandle = handle;
                        document.getElementById('sync-filename').innerText = handle.name;
                        document.getElementById('sync-filename').style.display = 'inline';
                        document.getElementById('file-sync-container').classList.add('sync-active');
                        autoSave();
                    } catch (err) { syncToggle.checked = false; state.isFileSyncEnabled = false; }
                } else {
                    document.getElementById('file-sync-container').classList.add('sync-active');
                    autoSave();
                }
            } else {
                document.getElementById('file-sync-container').classList.remove('sync-active');
                document.getElementById('sync-filename').style.display = 'none';
            }
        };
    }

    window.addEventListener('resize', updateCanvasRect);
    window.addEventListener('scroll', updateCanvasRect, true);
    window.addEventListener('paste', handleSystemPaste);
}

function resizeCanvas(initial = false) {
    if (!state.container || !state.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = state.container.getBoundingClientRect();
    if (rect.width === 0) return;

    let temp = null;
    if (!initial) temp = state.canvas.toDataURL();

    state.canvas.width = rect.width * dpr;
    state.canvas.height = rect.height * dpr;
    state.canvas.style.width = rect.width + 'px';
    state.canvas.style.height = rect.height + 'px';

    state.ctx = state.canvas.getContext('2d');
    state.ctx.scale(dpr, dpr);

    if (temp) {
        const img = new Image();
        img.onload = () => state.ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = temp;
    }
    updateCanvasRect();
}

init();
