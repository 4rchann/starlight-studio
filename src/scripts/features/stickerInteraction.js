export class StickerManager {
    constructor(canvas, renderCallback) {
        this.canvas = canvas
        this.renderCallback = renderCallback
        this.stickers = []
        this.activeSticker = null
        this.state = 'idle'
        this.lastPos = { x: 0, y: 0}
        this.handleRadius = 10
        this.initEvents()
    }

    addSticker(imgSource, initialScale = 1) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const aspectRatio = img.width / img.height
            const baseSize = 250
            const sticker = {
                id: Date.now(),
                img: img,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                width: baseSize,
                height: baseSize / aspectRatio,
                rotation: 0,
                scale: initialScale
            }
            this.stickers.push(sticker)
            this.activeSticker = sticker
            this.renderCallback()
        }
        img.src = imgSource
    }

    getCanvasCoords(x, y) {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height
        return {
            x: (x - rect.left) * scaleX,
            y: (y - rect.top) * scaleY
        }
    }

    isPointInSticker(px, py, sticker) {
        const dx = px - sticker.x
        const dy = py - sticker.y
        const rad = -sticker.rotation
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
        const w = sticker.width * sticker.scale
        const h = sticker.height * sticker.scale
        return (lx >= -w/2 && lx <= w/2 && ly >= -h/2 && ly <= h/2)
    }

    isPointInHandle(px, py, sticker) {
        if (!sticker) return false

        const w = sticker.width * sticker.scale
        const h = sticker.height * sticker.scale
        const lx = w / 2
        const ly = h / 2
        const rad = sticker.rotation
        const wx = sticker.x + (lx * Math.cos(rad) - ly * Math.sin(rad))
        const wy = sticker.y + (lx * Math.sin(rad) + ly * Math.cos(rad))
        const dist = Math.sqrt(Math.pow(px - wx, 2) + Math.pow(py - wy, 2))
        return dist <= (this.handleRadius * 2)
    }

    initEvents() {
        const start = (clientX, clientY) => {
            const { x, y} = this.getCanvasCoords(clientX, clientY)

            if (this.activeSticker && this.isPointInHandle(x, y, this.activeSticker)) {
                this.state = 'transforming'
                this.lastPos = { x, y}
                return
            }

            for (let i = this.stickers.length - 1; i >= 0; i--) {
                const s = this.stickers[i]
                if (this.isPointInSticker(x, y, s)) {
                    this.activeSticker = s
                    this.state = 'dragging'
                    this.lastPos = { x, y}

                    this.stickers.splice(i, 1)
                    this.stickers.push(s)
                    this.renderCallback()
                    return
                }
            }

            if (this.activeSticker) {
                this.activeSticker = null
                this.renderCallback()
            }
        }

        const move = (clientX, clientY) => {
            if (this.state === 'idle') {
                return
            }

            const { x, y} = this.getCanvasCoords(clientX, clientY)
            const dx = x - this.lastPos.x
            const dy = y - this.lastPos.y

            if (this.state === 'dragging' && this.activeSticker) {
                this.activeSticker.x += dx
                this.activeSticker.y += dy
                this.lastPos = { x, y}
                this.renderCallback()
            } else if (this.state === 'transforming' && this.activeSticker) {
                const s = this.activeSticker
                const centerX = s.x
                const centerY = s.y
                const currentDist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
                const baseRadius = Math.sqrt(Math.pow(s.width/2, 2) + Math.pow(s.height/2, 2))

                let newScale = currentDist / baseRadius
                newScale = Math.max(0.2, Math.min(5, newScale))
                s.scale = newScale
                const angle = Math.atan2(y - centerY, x - centerX)
                const baseAngle = Math.atan2(s.height, s.width)
                s.rotation = angle - baseAngle
                this.lastPos = { x, y}
                this.renderCallback()
            }
        }

        const end = () => {
            this.state = 'idle'
        }

        this.canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY))
        window.addEventListener('mousemove', e => move(e.clientX, e.clientY))
        window.addEventListener('mouseup', end)

        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                start(e.touches[0].clientX, e.touches[0].clientY)
            }
        }, { passive: false})
        window.addEventListener('touchmove', e => {
            if (e.touches.length === 1) {
                if(this.state !== 'idle') e.preventDefault()
                move(e.touches[0].clientX, e.touches[0].clientY)
            }
        }, { passive: false})
        window.addEventListener('touchend', end)
    }

    render(ctx, showControls = true) {
        this.stickers.forEach(s => {
            ctx.save()
            ctx.translate(s.x, s.y)
            ctx.rotate(s.rotation)
            ctx.scale(s.scale, s.scale)
            ctx.drawImage(s.img, -s.width / 2, -s.height / 2, s.width, s.height)
            ctx.restore()

            if (showControls && s === this.activeSticker) {
                ctx.save()
                ctx.translate(s.x, s.y)
                ctx.rotate(s.rotation)

                const w = s.width * s.scale
                const h = s.height * s.scale
                const halfW = w / 2
                const halfH = h / 2

                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 2
                ctx.strokeRect(-halfW, -halfH, w, h)

                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 1
                ctx.setLineDash([5, 5])
                ctx.strokeRect(-halfW, -halfH, w, h)
                ctx.setLineDash([])

                ctx.beginPath()
                ctx.arc(halfW, halfH, this.handleRadius, 0, Math.PI * 2)
                ctx.fillStyle = '#ffffff'
                ctx.fill()
                ctx.stroke()

                ctx.beginPath()
                ctx.fillStyle = '#000'
                ctx.arc(halfW, halfH, 4, 0, Math.PI * 2)
                ctx.fill()

                ctx.restore()
            }
        })
    }
}