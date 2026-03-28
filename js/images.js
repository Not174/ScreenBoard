import { state } from './state.js';
import { getPos, textToDataURL } from './utils.js';
import { saveState } from './history.js';

export function createImage(src, left, top, width) {
    const wrap = document.createElement('div');
    wrap.className = 'image-container';
    wrap.style.left = left; wrap.style.top = top; wrap.style.width = width;

    const img = document.createElement('img'); img.src = src;
    const menu = document.createElement('div'); menu.className = 'selection-menu';
    menu.innerHTML = `<button class="menu-btn">👯 Duplicate</button><button class="menu-btn danger">🗑️ Delete</button><button class="menu-btn">✅ Done</button>`;
    const resizer = document.createElement('div'); resizer.className = 'resizer';

    wrap.append(img, menu, resizer);
    if (!state.container) state.container = document.getElementById('canvas-container');
    state.container.appendChild(wrap);

    const btns = menu.querySelectorAll('button');
    btns[0].onclick = (e) => { e.stopPropagation(); createImage(src, (parseInt(wrap.style.left) + 20) + 'px', (parseInt(wrap.style.top) + 20) + 'px', wrap.style.width); saveState(); };
    btns[1].onclick = (e) => { e.stopPropagation(); wrap.remove(); saveState(); };
    btns[2].onclick = (e) => { e.stopPropagation(); flattenSelection(); };

    makeDraggable(wrap);
    makeResizable(wrap, resizer);
    selectImage(wrap);
}

export function makeDraggable(el) {
    el.onmousedown = (e) => {
        if (e.target.closest('.selection-menu') || e.target.className === 'resizer') return;
        e.preventDefault();
        selectImage(el);
        let startX = e.clientX, startY = e.clientY;
        document.onmousemove = (me) => {
            el.style.left = (el.offsetLeft + (me.clientX - startX)) + 'px';
            el.style.top = (el.offsetTop + (me.clientY - startY)) + 'px';
            startX = me.clientX; startY = me.clientY;
        };
        document.onmouseup = () => { document.onmousemove = null; saveState(); };
    };
}

export function makeResizable(el, handle) {
    handle.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        let startW = el.offsetWidth, startX = e.clientX;
        const onMove = (me) => el.style.width = Math.max(20, startW + (me.clientX - startX)) + 'px';
        const onUp = () => { window.removeEventListener('mousemove', onMove); saveState(); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp, { once: true });
    };
}

export function selectImage(el) { deselectAllImages(); el.classList.add('selected'); }
export function deselectAllImages() { document.querySelectorAll('.image-container').forEach(i => i.classList.remove('selected')); }

export function flattenSelection() {
    document.querySelectorAll('.image-container').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        const rect = wrapper.getBoundingClientRect();
        const crect = state.canvas.getBoundingClientRect();
        state.ctx.drawImage(img, rect.left - crect.left, rect.top - crect.top, rect.width, rect.height);
        wrapper.remove();
    });
    saveState();
}

export function handleSystemPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                createImage(event.target.result, (state.lastX + 20) + 'px', (state.lastY + 20) + 'px', '300px');
            };
            reader.readAsDataURL(blob);
        } else if (item.kind === 'string' && item.type === 'text/plain') {
            item.getAsString((text) => {
                const textDataUrl = textToDataURL(text);
                createImage(textDataUrl, (state.lastX + 20) + 'px', (state.lastY + 20) + 'px', 'auto');
            });
        }
    }
}

export function handleUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => createImage(ev.target.result, '50px', '50px', '200px');
        reader.readAsDataURL(file);
    }
}

export function captureSelection(x, y, w, h) {
    const dpr = window.devicePixelRatio || 1;
    const temp = document.createElement('canvas');
    temp.width = w * dpr; temp.height = h * dpr;
    temp.getContext('2d').drawImage(state.canvas, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);
    state.ctx.clearRect(x, y, w, h);
    createImage(temp.toDataURL(), x + 'px', y + 'px', w + 'px');
    saveState();
}

export function updateMarquee(x, y) {
    const marquee = document.getElementById('selection-marquee');
    if (!marquee) return;
    marquee.style.left = Math.min(state.selStartX, x) + 'px';
    marquee.style.top = Math.min(state.selStartY, y) + 'px';
    marquee.style.width = Math.abs(state.selStartX - x) + 'px';
    marquee.style.height = Math.abs(state.selStartY - y) + 'px';
}
