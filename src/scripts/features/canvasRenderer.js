export async function renderLayout(layout, photoDataUrls, stickerManager = null, options = {showText: true, showDate: false, bgColor: '#ffffff', scale:1}) {
    const scale = options.scale || 1
    const canvas = document.createElement('canvas')
    canvas.width = layout.width * scale
    canvas.height = layout.height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    let shiftY = 0

    if (!layout.image) {
        let minY = Infinity
        let maxY = -Infinity
        layout.slots.forEach(slot => {
            if (slot.y < minY) minY = slot.y
            if (slot.y + slot.height > maxY) maxY = slot.y + slot.height
        })

        if (layout.text && options.showText) {
            const textTop = layout.text.y - (layout.text.fontSize / 2)
            const textBottom = layout.text.y + (layout.text.fontSize / 2)
            if (textTop < minY) minY = textTop
            if (textBottom > maxY) maxY = textBottom
        }

        if (layout.date && options.showDate) {
            const baseY = options.showText ? (layout.text.y + (layout.text.fontSize * 1.5)) : layout.text.y
            const dateCenterY = baseY
            const dateFontSize = layout.text.fontSize * 0.6
            const dateTop = dateCenterY - (dateFontSize / 2)
            const dateBottom = dateCenterY + (dateFontSize / 2)
            if (dateTop < minY) minY = dateTop
            if (dateBottom > maxY) maxY = dateBottom
        }

        const contentHeight = maxY - minY
        const targetTop = (layout.height - contentHeight) / 2
        shiftY = targetTop - minY
    }

    if (layout.image) {
        try {
            const bgImg = await loadImage(layout.image)
            ctx.drawImage(bgImg, 0, 0, layout.width, layout.height)
        } catch (e) {
            console.error('Failed to load background', e)
            ctx.fillStyle = options.bgColor || '#ffffff'
            ctx.fillRect(0, 0, layout.width, layout.height)
        }
    } else {
        ctx.fillStyle = options.bgColor || '#ffffff'
        ctx.fillRect(0, 0, layout.width, layout.height)
    }

    const images = await loadAllImages(photoDataUrls)
    images.forEach((img, index) => {
        if (index < layout.slots.length) {
            const slot = layout.slots[index]
            const shiftedY = slot.y + shiftY
            drawHasCover(ctx, img, slot.x, shiftedY, slot.width, slot.height)
        }
    })

    if (stickerManager) {
        stickerManager.render(ctx, false)
    }
    
    if (layout.text) {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (options.showText) {
            ctx.font = `${layout.text.fontSize}px "${layout.text.fontFamily || 'Sriracha'}", cursive`
            ctx.fillStyle = layout.text.color
            ctx.fillText(layout.text.text, layout.text.x, layout.text.y + shiftY)
        }

        if (options.showDate) {
            const date = new Date().toLocaleDateString()
            const baseY = options.showText ? (layout.text.y + (layout.text.fontSize * 1.5)) : layout.text.y
            const dateY = baseY + shiftY
            
            ctx.font = `${layout.text.fontSize * 0.6}px "Google Sans", sans-serif`
            ctx.fillStyle = layout.text.color === '#ffffff' ? '#ffffff' : '#717171'
            ctx.fillText(date, layout.text.x, dateY)
        }
    }
    
    return canvas.toDataURL('image/png')
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

function loadAllImages(urls) {
    return Promise.all(urls.map(src => loadImage(src)))
}

function drawHasCover(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height
    const targetRatio = w / h
    let sx, sy, sWidth, sHeight

    if (imgRatio > targetRatio) {
        sHeight = img.height
        sWidth = img.height * targetRatio
        sy = 0
        sx = (img.width -sWidth) / 2
    } else {
        sWidth = img.width
        sHeight = img.width / targetRatio
        sx = 0
        sy = (img.height - sHeight) / 2
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h)
}