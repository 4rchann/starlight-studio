import { LAYOUTS } from "../features/layouts.js"

export function initLayoutsPicker() {
    const layoutsGrid = document.querySelector('.layouts-grid')
    if (!layoutsGrid) return

    function createLayoutCard(layout) {
        const card = document.createElement('div')
        card.className = 'layout-card'
        card.innerHTML = `<div class="layout-preview-container">
            <img src="${layout.preview}" alt="${layout.name} Preview" class="layout-preview-img" onerror="this.onerror=null; this.parentElement.style.background='linear-gradient(45deg, var(--color-background-alt), var(--color-background))'; this.remove()"></div>
            <div class="layout-info">
                <h3>${layout.name}</h3>
                <p>Size ${layout.width/300}x${layout.height/300} inch</p>
                <div class="layout-tags">
                    <span class="layout-tag">${layout.photoCount} Photos</span>
                    <span class="layout-tag">${layout.type === 'strip' ? 'Vertical' : 'Grid'}</span>
                </div>
            </div>
            <div class="layout-overlay">
                <button class="btn select-btn" data-id="${layout.id}">Select Layout</button>
            </div>`
        return card
    }

    LAYOUTS.forEach(layout => {
        layoutsGrid.appendChild(createLayoutCard(layout))
    })

    layoutsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-btn')) {
            const layoutId = e.target.dataset.id
            window.location.href = `editor.html?layout=${layoutId}`
        }
    })

    const filterBtn = document.querySelectorAll('.filter-btn')
    if (filterBtn.length) {
        filterBtn.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtn.forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
            })
        })
    }
}