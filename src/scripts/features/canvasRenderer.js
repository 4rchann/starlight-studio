function formatCaption(text, style) {
    if (!text || !text.trim()) return ''
    const trimmed = text.trim()
    
    switch (style) {
        case 'quoted':
            return `"${trimmed}"`
        case 'dashed':
            return `— ${trimmed} —`
        case 'questioning':
            return `— ${trimmed}?`
        default:
            return `"${trimmed}"`
    }
}

function formatDateDDMMYYYY(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

function buildMetaLine(showDate, showLocation, locationText) {
    const parts = []
    
    if (showDate) {
        parts.push(formatDateDDMMYYYY())
    }
    
    if (showLocation && locationText && locationText.trim()) {
        parts.push(locationText.trim())
    }
    
    return parts.join(' | ')
}

export async function renderLayout(layout, photoDataUrls, stickerManager = null, options = {}) {
    const opts = {
        showText: true,
        showDate: false,
        showLocation: false,
        showCaption: false,
        locationText: '',
        captionText: '',
        captionStyle: 'quoted',
        bgColor: '#ffffff',
        scale: 1,
        ...options
    }

    const scale = opts.scale || 1
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

        if (layout.text && opts.showText) {
            const textTop = layout.text.y - (layout.text.fontSize / 2)
            const textBottom = layout.text.y + (layout.text.fontSize / 2)
            if (textTop < minY) minY = textTop
            if (textBottom > maxY) maxY = textBottom
        }

        const hasMetaLine = opts.showDate || (opts.showLocation && opts.locationText)
        if (layout.text && hasMetaLine) {
            const baseY = opts.showText ? (layout.text.y + (layout.text.fontSize * 1.3)) : layout.text.y
            const metaFontSize = layout.text.fontSize * 0.55
            const metaBottom = baseY + (metaFontSize / 2)
            if (metaBottom > maxY) maxY = metaBottom
        }

        if (layout.text && opts.showCaption && opts.captionText) {
            const metaOffset = hasMetaLine ? (layout.text.fontSize * 1.3) : 0
            const captionBaseY = opts.showText 
                ? (layout.text.y + metaOffset + (layout.text.fontSize * 1.1))
                : layout.text.y
            const captionFontSize = layout.text.fontSize * 0.5
            const captionBottom = captionBaseY + (captionFontSize / 2)
            if (captionBottom > maxY) maxY = captionBottom
        }

        const contentHeight = maxY - minY
        const targetTop = (layout.height - contentHeight) / 2
        shiftY = targetTop - minY
    }

    if (layout.image) {
        const images = await loadAllImages(photoDataUrls)
        images.forEach((img, index) => {
            if (index < layout.slots.length) {
                const slot = layout.slots[index]
                const shiftedY = slot.y + shiftY
                drawHasCover(ctx, img, slot.x, shiftedY, slot.width, slot.height)
            }
        })
        
        try {
            const bgImg = await loadImage(layout.image)
            ctx.drawImage(bgImg, 0, 0, layout.width, layout.height)
        } catch (e) {
            console.error('Failed to load frame overlay', e)
        }
    } else {
        ctx.fillStyle = opts.bgColor || '#ffffff'
        ctx.fillRect(0, 0, layout.width, layout.height)
        
        const images = await loadAllImages(photoDataUrls)
        images.forEach((img, index) => {
            if (index < layout.slots.length) {
                const slot = layout.slots[index]
                const shiftedY = slot.y + shiftY
                drawHasCover(ctx, img, slot.x, shiftedY, slot.width, slot.height)
            }
        })
    }

    if (stickerManager) {
        stickerManager.render(ctx, false)
    }

    if (layout.archiveLabel && !layout.image) {
        const label = layout.archiveLabel
        ctx.font = `${label.fontSize}px "Google Sans", sans-serif`
        ctx.textAlign = label.align || 'right'
        ctx.textBaseline = 'top'
        ctx.fillStyle = layout.text?.color === '#ffffff' 
            ? 'rgba(255, 255, 255, 0.5)' 
            : 'rgba(0, 0, 0, 0.2)'
        ctx.fillText(label.text, label.x, label.y)
    }
    
    if (layout.text) {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const centerX = layout.text.x
        const baseFontSize = layout.text.fontSize
        const baseColor = layout.text.color
        const grayColor = baseColor === '#ffffff' ? '#ffffff' : '#717171'
        const lightGrayColor = baseColor === '#ffffff' ? 'rgba(255,255,255,0.8)' : '#999999'

        let currentY = layout.text.y + shiftY

        if (opts.showText) {
            ctx.font = `${baseFontSize}px "${layout.text.fontFamily || 'Sriracha'}", cursive`
            ctx.fillStyle = baseColor
            ctx.fillText(layout.text.text, centerX, currentY)
            currentY += baseFontSize * 1.3
        }

        const metaLine = buildMetaLine(opts.showDate, opts.showLocation, opts.locationText)
        if (metaLine) {
            const metaFontSize = baseFontSize * 0.55
            ctx.font = `${metaFontSize}px "Google Sans", sans-serif`
            ctx.fillStyle = grayColor
            ctx.fillText(metaLine, centerX, currentY)
            currentY += baseFontSize * 1.1
        }

        if (opts.showCaption && opts.captionText && opts.captionText.trim()) {
            const formattedCaption = formatCaption(opts.captionText, opts.captionStyle)
            const captionFontSize = baseFontSize * 0.5
            ctx.font = `italic ${captionFontSize}px "Google Sans", sans-serif`
            ctx.fillStyle = lightGrayColor
            
            const maxCharsPerLine = 35
            if (formattedCaption.length > maxCharsPerLine) {
                const words = formattedCaption.split(' ')
                let line1 = ''
                let line2 = ''
                let onLine1 = true
                
                for (const word of words) {
                    if (onLine1 && (line1 + ' ' + word).trim().length <= maxCharsPerLine) {
                        line1 = (line1 + ' ' + word).trim()
                    } else {
                        onLine1 = false
                        line2 = (line2 + ' ' + word).trim()
                    }
                }
                
                if (line2.length > maxCharsPerLine) {
                    line2 = line2.substring(0, maxCharsPerLine - 3) + '...'
                }
                
                const lineHeight = captionFontSize * 1.4
                ctx.fillText(line1, centerX, currentY)
                if (line2) {
                    ctx.fillText(line2, centerX, currentY + lineHeight)
                }
            } else {
                ctx.fillText(formattedCaption, centerX, currentY)
            }
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