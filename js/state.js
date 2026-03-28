export const state = {
    canvas: null,
    ctx: null,
    container: null,
    toast: null,
    sizeSlider: null,
    sizeInput: null,

    drawing: false,
    selecting: false,
    currentTool: 'pen',
    selectedColor: '#ffffff',
    history: [],
    redoStack: [],
    lastX: 0,
    lastY: 0,
    selStartX: 0,
    selStartY: 0,
    isDarkMode: true,
    isGridVisible: false,
    isFileSyncEnabled: false,
    currentFileHandle: null,
    autoSaveTimeout: null,
    localClipboard: null,

    currentPenSize: 3,
    currentEraserSize: 30,
    currentSize: 3,
    eraserVisualSize: 30,
    lastCursorSize: 30,
    animationFrameRequested: false,
    pendingPos: null,
    canvasRect: null,
    isPageLoading: false,

    pagesMap: { "page-1": { canvasData: null, items: [], history: [], redoStack: [] } },
    pageOrder: ["page-1"],
    currentPageId: "page-1",
    currentPageIndex: 0
};

export function initState() {
    state.canvas = document.getElementById('main-canvas');
    state.ctx = state.canvas.getContext('2d', { willReadFrequently: true });
    state.container = document.getElementById('canvas-container');
    state.toast = document.getElementById('toast');
    state.sizeSlider = document.getElementById('size-slider');
    state.sizeInput = document.getElementById('size-input');
}
