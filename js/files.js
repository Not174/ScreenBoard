import { state } from './state.js';
import { showToast } from './utils.js';
import { toggleTheme, updateGridSpacing } from './ui.js';
import { loadPageFromMemory } from './pages.js';

export async function autoSave(force = false) {
    const s = {
        version: "2.0",
        pagesMap: state.pagesMap,
        pageOrder: state.pageOrder,
        currentPageId: state.currentPageId,
        settings: {
            isDarkMode: state.isDarkMode,
            isGridVisible: state.isGridVisible,
            gridX: document.getElementById('grid-x-input') ? document.getElementById('grid-x-input').value : 30,
            gridY: document.getElementById('grid-y-input') ? document.getElementById('grid-y-input').value : 30
        }
    };

    if (state.autoSaveTimeout) clearTimeout(state.autoSaveTimeout);

    if (force) {
        performAllSaves(s);
    } else {
        state.autoSaveTimeout = setTimeout(() => {
            performAllSaves(s);
        }, 3000);
    }
}

export async function performAllSaves(s) {
    try {
        localStorage.setItem('whiteboard_autosave', JSON.stringify(s));
    } catch (e) { console.warn("Internal AutoSave failed", e); }

    if (state.isFileSyncEnabled && state.currentFileHandle) {
        try {
            const writable = await state.currentFileHandle.createWritable();
            await writable.write(JSON.stringify(s));
            await writable.close();
            console.log("File Sync successful");
        } catch (err) {
            console.error("File Sync AutoSave failed", err);
            showToast("File Sync Error - Check permissions");
        }
    }
}

export async function autoLoad() {
    const saved = localStorage.getItem('whiteboard_autosave');
    if (saved) {
        try {
            const s = JSON.parse(saved);
            if (s.pagesMap && s.pageOrder) {
                state.pagesMap = s.pagesMap;
                state.pageOrder = s.pageOrder;
                state.currentPageId = s.currentPageId || state.pageOrder[0];
                if (s.settings) {
                    if (state.isDarkMode !== s.settings.isDarkMode) toggleTheme();
                    state.isGridVisible = s.settings.isGridVisible;
                    if (state.container) state.container.classList.toggle('show-grid', state.isGridVisible);
                    const gridBtn = document.getElementById('grid-btn');
                    if (gridBtn) gridBtn.classList.toggle('active', state.isGridVisible);
                    if (document.getElementById('grid-x-input')) document.getElementById('grid-x-input').value = s.settings.gridX;
                    if (document.getElementById('grid-y-input')) document.getElementById('grid-y-input').value = s.settings.gridY;
                    updateGridSpacing();
                }
                await loadPageFromMemory(state.currentPageId);
            }
        } catch (e) { console.error("Autoload failed", e); }
    }
}

export async function exportToFile() {
    const s = {
        version: "2.0",
        pagesMap: state.pagesMap,
        pageOrder: state.pageOrder,
        currentPageId: state.currentPageId,
        settings: {
            isDarkMode: state.isDarkMode,
            isGridVisible: state.isGridVisible,
            gridX: document.getElementById('grid-x-input').value,
            gridY: document.getElementById('grid-y-input').value
        }
    };
    const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
    const suggestedName = `whiteboard_${Date.now()}.wb`;

    await saveBlobWithPicker(blob, suggestedName, [{
        description: 'Whiteboard File',
        accept: { 'application/json': ['.wb'] }
    }]);
}

export function importFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImportedContent(ev.target.result);
    reader.readAsText(file);
}

export async function processImportedContent(jsonText) {
    try {
        const s = JSON.parse(jsonText);
        if (s.pagesMap && s.pageOrder) {
            state.pagesMap = s.pagesMap;
            state.pageOrder = s.pageOrder;
            state.currentPageId = s.currentPageId || state.pageOrder[0];
            
            if (s.settings) {
                if (state.isDarkMode !== s.settings.isDarkMode) toggleTheme();
                state.isGridVisible = s.settings.isGridVisible;
                if (state.container) state.container.classList.toggle('show-grid', state.isGridVisible);
                const gridBtn = document.getElementById('grid-btn');
                if (gridBtn) gridBtn.classList.toggle('active', state.isGridVisible);
                if (document.getElementById('grid-x-input')) document.getElementById('grid-x-input').value = s.settings.gridX;
                if (document.getElementById('grid-y-input')) document.getElementById('grid-y-input').value = s.settings.gridY;
                updateGridSpacing();
            }
            await loadPageFromMemory(state.currentPageId);
            autoSave(true);
            showToast('Loaded successfully');
        }
    } catch (err) {
        showToast('Error loading file');
        console.error(err);
    }
}

export async function saveBlobWithPicker(blob, suggestedName, types) {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: types
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            showToast('Saved successfully');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                showToast('Failed to save file');
            }
        }
    } else {
        const name = prompt("Enter filename:", suggestedName);
        if (name === null) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = types[0].accept[Object.keys(types[0].accept)[0]][0];
        a.download = name.endsWith(ext) ? name : name + ext;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Download started');
    }
}
