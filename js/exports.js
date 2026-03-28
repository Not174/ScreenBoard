import { state } from './state.js';
import { showToast } from './utils.js';
import { saveCurrentPageToMemory } from './pages.js';
import { saveBlobWithPicker } from './files.js';

export async function saveAsPDF() {
    showToast('Generating PDF...');
    saveCurrentPageToMemory();

    const { jsPDF } = window.jspdf;
    const dpr = window.devicePixelRatio || 1;
    const W = state.canvas.width / dpr;
    const H = state.canvas.height / dpr;

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [W, H]
    });

    for (let i = 0; i < state.pageOrder.length; i++) {
        const pageId = state.pageOrder[i];
        const page = state.pagesMap[pageId];
        if (i > 0) pdf.addPage([W, H], 'landscape');

        const offscreen = document.createElement('canvas');
        offscreen.width = state.canvas.width;
        offscreen.height = state.canvas.height;
        const octx = offscreen.getContext('2d');
        octx.scale(dpr, dpr);

        octx.fillStyle = state.isDarkMode ? '#171616' : '#eae3e3';
        octx.fillRect(0, 0, W, H);

        if (state.isGridVisible) {
            const gx = parseInt(document.getElementById('grid-x-input').value) || 30;
            const gy = parseInt(document.getElementById('grid-y-input').value) || 30;
            octx.strokeStyle = state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            octx.lineWidth = 1;
            octx.beginPath();
            for (let x = 0; x <= W; x += gx) { octx.moveTo(x, 0); octx.lineTo(x, H); }
            for (let y = 0; y <= H; y += gy) { octx.moveTo(0, y); octx.lineTo(W, y); }
            octx.stroke();
        }

        if (page.canvasData) {
            await new Promise(res => {
                const img = new Image();
                img.onload = () => { octx.drawImage(img, 0, 0, W, H); res(); };
                img.src = page.canvasData;
            });
        }

        if (page.items) {
            for (const item of page.items) {
                await new Promise(res => {
                    const img = new Image();
                    img.onload = () => {
                        const l = parseFloat(item.left);
                        const t = parseFloat(item.top);
                        const w = parseFloat(item.width);
                        const ratio = img.naturalHeight / img.naturalWidth;
                        octx.drawImage(img, l, t, w, w * ratio);
                        res();
                    };
                    img.onerror = res;
                    img.src = item.src;
                });
            }
        }

        const imgData = offscreen.toDataURL('image/jpeg');
        pdf.addImage(imgData, 'JPEG', 0, 0, W, H, undefined, 'FAST');
    }

    try {
        const blob = pdf.output('blob');
        const suggestedName = `Whiteboard_${new Date().getTime()}.pdf`;
        await saveBlobWithPicker(blob, suggestedName, [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] }
        }]);
    } catch (err) {
        console.error(err);
        showToast('PDF Export Failed');
    }
}

export async function exportToPPTX() {
    showToast('Generating PPTX...');
    saveCurrentPageToMemory();

    const pptx = new PptxGenJS();
    const dpr = window.devicePixelRatio || 1;
    const W = state.canvas.width / dpr;
    const H = state.canvas.height / dpr;

    pptx.layout = 'LAYOUT_WIDE';

    for (let i = 0; i < state.pageOrder.length; i++) {
        const pageId = state.pageOrder[i];
        const page = state.pagesMap[pageId];
        const slide = pptx.addSlide();

        const offscreen = document.createElement('canvas');
        offscreen.width = state.canvas.width;
        offscreen.height = state.canvas.height;
        const octx = offscreen.getContext('2d');
        octx.scale(dpr, dpr);
        octx.fillStyle = state.isDarkMode ? '#171616' : '#eae3e3';
        octx.fillRect(0, 0, W, H);

        if (page.canvasData) {
            await new Promise(res => {
                const img = new Image();
                img.onload = () => { octx.drawImage(img, 0, 0, W, H); res(); };
                img.src = page.canvasData;
            });
        }

        if (page.items) {
            for (const item of page.items) {
                await new Promise(res => {
                    const img = new Image();
                    img.onload = () => {
                        const l = parseFloat(item.left);
                        const t = parseFloat(item.top);
                        const w = parseFloat(item.width);
                        const ratio = img.naturalHeight / img.naturalWidth;
                        octx.drawImage(img, l, t, w, w * ratio);
                        res();
                    };
                    img.onerror = res;
                    img.src = item.src;
                });
            }
        }

        const dataUrl = offscreen.toDataURL('image/png');
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
    }

    try {
        const blob = await pptx.write('blob');
        const suggestedName = `Whiteboard_${new Date().getTime()}.pptx`;
        await saveBlobWithPicker(blob, suggestedName, [{
            description: 'PowerPoint Presentation',
            accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }
        }]);
    } catch (err) {
        console.error(err);
        showToast('PPTX Export Failed');
    }
}
