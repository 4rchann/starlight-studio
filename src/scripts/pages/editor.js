import { startCamera, stopCamera, captureFrame } from '../features/camera.js'
import { getLayoutById } from '../features/layouts.js'
import { renderLayout } from '../features/canvasRenderer.js'
import { STICKERS } from '../features/stickers.js'
import { getPhotostripsForLayout } from '../features/photostrips.js'
import { StickerManager } from '../features/stickerInteraction.js'
import { requestGeolocation, extractExifLocation, getLocationString } from '../features/locationService.js'

export async function initEditor() {
    const params = new URLSearchParams(window.location.search)
    const layoutId = params.get('layout')
    let layout = getLayoutById(layoutId)

    if (!layout) {
        alert('Invalid layout selected.')
        window.location.href = 'layoutsPicker.html'
        return
    }

    layout = JSON.parse(JSON.stringify(layout))

    const photos = []
    let isCapturing = false
    let stickerManager = null
    let captureMode = 'camera'

    const currentOptions = {
        showBranding: true,
        showDate: false,
        showLocation: false,
        showCaption: false,
        locationText: '',
        captionText: '',
        captionStyle: 'quoted',
        bgColor: '#ffffff'
    }

    const captureView = document.querySelector('#capture-view')
    const customizeView = document.querySelector('#customize-view')
    const videoElement = document.querySelector('#camera-feed')
    const captureBtn = document.querySelector('#capture-btn')
    const retakeBtn = document.querySelector('#retake-btn')
    const uploadBtn = document.querySelector('#upload-btn')
    const fileInput = document.querySelector('#file-upload')
    const statusText = document.querySelector('.status-text')
    const livePreviewCanvas = document.querySelector('#live-preview-canvas')
    const flashOverlay = document.querySelector('#flash-overlay')
    const finalCanvas = document.querySelector('#final-canvas')
    const framesList = document.querySelector('#frames-list')
    const stickersList = document.querySelector('#stickers-list')
    const downloadBtn = document.querySelector('#download-btn')
    const restartBtn = document.querySelector('#restart-btn')
    const customizeSection = document.querySelector('#customize-sidebar-section')
    const toggleDate = document.querySelector('#toggle-date')
    const toggleLocation = document.querySelector('#toggle-location')
    const toggleCaption = document.querySelector('#toggle-caption')
    const locationInputWrapper = document.querySelector('#location-input-wrapper')
    const locationInput = document.querySelector('#location-input')
    const locationDetectBtn = document.querySelector('#location-detect-btn')
    const captionInputWrapper = document.querySelector('#caption-input-wrapper')
    const captionInput = document.querySelector('#caption-input')
    const captionStyleBtns = document.querySelectorAll('.caption-style-btn')
    
    const colorSwatch = document.querySelector('#color-swatch')
    const colorPickerDropdown = document.querySelector('#color-picker-dropdown')
    const gradientCanvas = document.querySelector('#color-gradient-canvas')
    const gradientCursor = document.querySelector('#gradient-cursor')
    const hueSlider = document.querySelector('#hue-slider')
    const hexInput = document.querySelector('#hex-input')
    const presetColors = document.querySelectorAll('.preset-color')

    finalCanvas.width = layout.width
    finalCanvas.height = layout.height
    livePreviewCanvas.width = layout.width
    livePreviewCanvas.height = layout.height

    statusText.textContent = `Pose 1 of ${layout.photoCount}`

    const hasCamera = await startCamera(videoElement)
    if (!hasCamera) {
        statusText.textContent = 'Camera unavailable'
        return
    }

    renderLivePreview()

    captureBtn.addEventListener('click', async () => {
        if (isCapturing || photos.length >= layout.photoCount) return

        isCapturing = true

        while (photos.length < layout.photoCount) {
            statusText.textContent = `Pose ${photos.length + 1} of ${layout.photoCount}`

            await runCountdown(3)
            playFlash()

            const photo = captureFrame(videoElement)
            if (photo) {
                photos.push(photo)
                await renderLivePreview()
            }

            await sleep(400)
        }

        statusText.textContent = 'Processing...'
        isCapturing = false

        await sleep(300)
        finishCapture()
    })

    uploadBtn.addEventListener('click', () => fileInput.click())

    fileInput.addEventListener('change', e => {
        const file = e.target.files[0]
        if (!file || photos.length >= layout.photoCount) return

        captureMode = 'upload'
        
        if (photos.length === 0) {
            tryExtractExifLocation(file)
        }

        const reader = new FileReader()
        reader.onload = async evt => {
            photos.push(evt.target.result)
            await renderLivePreview()
            fileInput.value = ''

            if (photos.length === layout.photoCount) {
                statusText.textContent = 'Processing...'
                await sleep(300)
                finishCapture()
            } else {
                statusText.textContent = `Pose ${photos.length + 1} of ${layout.photoCount}`
            }
        }
        reader.readAsDataURL(file)
    })

    retakeBtn.addEventListener('click', async () => {
        photos.length = 0
        statusText.textContent = `Pose 1 of ${layout.photoCount}`
        await renderLivePreview()
    })

    function finishCapture() {
        stopCamera(videoElement)
        captureView.classList.add('hidden')
        customizeView.classList.remove('hidden')
        initCustomization()
    }

    function initCustomization() {
        stickerManager = new StickerManager(finalCanvas, updateFinalCanvas)
        renderFramesSidebar()
        renderStickersSidebar()
        customizeSection.style.display = 'block'
        
        toggleDate.checked = currentOptions.showDate
        toggleLocation.checked = currentOptions.showLocation
        toggleCaption.checked = currentOptions.showCaption
        locationInput.value = currentOptions.locationText
        captionInput.value = currentOptions.captionText
        
        updateInputVisibility()
        
        initColorPicker()
        initOverlayControls()
        updateCustomizationState()
        updateFinalCanvas()
    }

    function updateInputVisibility() {
        locationInputWrapper.style.display = currentOptions.showLocation ? 'flex' : 'none'
        captionInputWrapper.style.display = currentOptions.showCaption ? 'flex' : 'none'
    }

    function initOverlayControls() {
        toggleDate.onchange = e => {
            currentOptions.showDate = e.target.checked
            updateFinalCanvas()
        }

        toggleLocation.onchange = async e => {
            currentOptions.showLocation = e.target.checked
            updateInputVisibility()
            
            if (e.target.checked && !currentOptions.locationText && captureMode === 'camera') {
                await detectLocation()
            }
            
            updateFinalCanvas()
        }

        locationInput.oninput = e => {
            currentOptions.locationText = e.target.value
            updateFinalCanvas()
        }

        locationDetectBtn.onclick = async () => {
            await detectLocation()
        }

        toggleCaption.onchange = e => {
            currentOptions.showCaption = e.target.checked
            updateInputVisibility()
            updateFinalCanvas()
        }

        captionInput.oninput = e => {
            currentOptions.captionText = e.target.value
            updateFinalCanvas()
        }

        captionStyleBtns.forEach(btn => {
            btn.onclick = () => {
                captionStyleBtns.forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                currentOptions.captionStyle = btn.dataset.style
                updateFinalCanvas()
            }
        })
    }

    async function detectLocation() {
        locationDetectBtn.classList.add('detecting')
        
        try {
            const coords = await requestGeolocation()
            if (coords) {
                const locationStr = await getLocationString(coords.lat, coords.lng)
                if (locationStr) {
                    currentOptions.locationText = locationStr
                    locationInput.value = locationStr
                    updateFinalCanvas()
                }
            }
        } catch (error) {
            console.warn('Location detection failed:', error)
        } finally {
            locationDetectBtn.classList.remove('detecting')
        }
    }

    async function tryExtractExifLocation(file) {
        try {
            const coords = await extractExifLocation(file)
            if (coords) {
                const locationStr = await getLocationString(coords.lat, coords.lng)
                if (locationStr) {
                    currentOptions.locationText = locationStr
                    locationInput.value = locationStr
                }
            }
        } catch (error) {
            console.warn('EXIF location extraction failed:', error)
        }
    }

    function updateCustomizationState() {
        if (layout.image) {
            customizeSection.style.display = 'none'
            currentOptions.showBranding = false
            currentOptions.showDate = false
            currentOptions.showLocation = false
            currentOptions.showCaption = false
        } else {
            customizeSection.style.display = 'block'
            currentOptions.showBranding = !!layout.text
        }
        toggleDate.checked = currentOptions.showDate
        toggleLocation.checked = currentOptions.showLocation
        toggleCaption.checked = currentOptions.showCaption
        updateInputVisibility()
    }

    async function renderLivePreview() {
        const dataUrl = await renderLayout(layout, photos, null, {
            showText: true,
            showDate: false,
            bgColor: '#fff'
        })

        const ctx = livePreviewCanvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height)
            ctx.drawImage(img, 0, 0)
        }
        img.src = dataUrl
    }

    async function updateFinalCanvas() {
        const renderOptions = {
            showText: currentOptions.showBranding,
            showDate: currentOptions.showDate,
            showLocation: currentOptions.showLocation,
            showCaption: currentOptions.showCaption,
            locationText: currentOptions.locationText,
            captionText: currentOptions.captionText,
            captionStyle: currentOptions.captionStyle,
            bgColor: currentOptions.bgColor
        }
        const dataUrl = await renderLayout(layout, photos, stickerManager, renderOptions)

        const ctx = finalCanvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height)
            ctx.drawImage(img, 0, 0)
            stickerManager?.render(ctx)
        }
        img.src = dataUrl
    }

    async function renderFramesSidebar() {
        framesList.innerHTML = ''
        const strips = getPhotostripsForLayout(layout.id)

        for (const strip of strips) {
            const tempLayout = { ...layout, image: strip.stripImage, slots: strip.slots || layout.slots }
            const dataUrl = await renderLayout(tempLayout, photos, null, { scale: 0.2 })
            const wrapper = createItemWrapper(dataUrl, strip.name)
            wrapper.onclick = () => applyFrame(strip, wrapper)
            framesList.appendChild(wrapper)
        }
    }

    function applyFrame(strip, el) {
        framesList.querySelectorAll('.sidebar-item-wrapper')
            .forEach(i => i.classList.remove('selected'))
        el.classList.add('selected')

        layout.image = strip.stripImage
        layout.slots = strip.slots || getLayoutById(layout.id).slots
        updateCustomizationState()
        updateFinalCanvas()
    }

    function renderStickersSidebar() {
        stickersList.innerHTML = ''
        STICKERS.forEach(sticker => {
            const w = createItemWrapper(sticker.src, sticker.name)
            w.onclick = () => stickerManager?.addSticker(sticker.src)
            stickersList.appendChild(w)
        })
    }

    let currentHue = 0
    let currentSat = 0
    let currentBright = 100

    function initColorPicker() {
        updateSwatchColor(currentOptions.bgColor)
        drawGradient()
        
        colorSwatch.addEventListener('click', (e) => {
            e.stopPropagation()
            colorPickerDropdown.classList.toggle('open')
        })

        document.addEventListener('click', (e) => {
            if (!colorPickerDropdown.contains(e.target) && e.target !== colorSwatch) {
                colorPickerDropdown.classList.remove('open')
            }
        })

        presetColors.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color
                setColor(color)
            })
        })

        let isDraggingGradient = false
        
        gradientCanvas.addEventListener('mousedown', (e) => {
            isDraggingGradient = true
            handleGradientSelect(e)
        })

        document.addEventListener('mousemove', (e) => {
            if (isDraggingGradient) handleGradientSelect(e)
        })

        document.addEventListener('mouseup', () => {
            isDraggingGradient = false
        })

        hueSlider.addEventListener('input', () => {
            currentHue = parseInt(hueSlider.value)
            drawGradient()
            updateColorFromHSV()
        })

        hexInput.addEventListener('input', (e) => {
            let value = e.target.value
            if (!value.startsWith('#')) value = '#' + value
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                setColor(value, false)
            }
        })

        hexInput.addEventListener('blur', () => {
            hexInput.value = currentOptions.bgColor
        })
    }

    function handleGradientSelect(e) {
        const rect = gradientCanvas.getBoundingClientRect()
        let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
        
        currentSat = (x / rect.width) * 100
        currentBright = 100 - (y / rect.height) * 100
        
        gradientCursor.style.left = x + 'px'
        gradientCursor.style.top = y + 'px'
        
        updateColorFromHSV()
    }

    function drawGradient() {
        const ctx = gradientCanvas.getContext('2d')
        const width = gradientCanvas.width
        const height = gradientCanvas.height

        const hueColor = `hsl(${currentHue}, 100%, 50%)`
        
        const gradientH = ctx.createLinearGradient(0, 0, width, 0)
        gradientH.addColorStop(0, '#ffffff')
        gradientH.addColorStop(1, hueColor)
        ctx.fillStyle = gradientH
        ctx.fillRect(0, 0, width, height)

        const gradientV = ctx.createLinearGradient(0, 0, 0, height)
        gradientV.addColorStop(0, 'rgba(0,0,0,0)')
        gradientV.addColorStop(1, 'rgba(0,0,0,1)')
        ctx.fillStyle = gradientV
        ctx.fillRect(0, 0, width, height)
    }

    function updateColorFromHSV() {
        const color = hsvToHex(currentHue, currentSat, currentBright)
        currentOptions.bgColor = color
        updateSwatchColor(color)
        hexInput.value = color
        updateFinalCanvas()
    }

    function setColor(hex, updateCursor = true) {
        currentOptions.bgColor = hex
        updateSwatchColor(hex)
        hexInput.value = hex

        if (updateCursor) {
            const hsv = hexToHSV(hex)
            currentHue = hsv.h
            currentSat = hsv.s
            currentBright = hsv.v
            hueSlider.value = currentHue
            drawGradient()
            
            const x = (currentSat / 100) * gradientCanvas.width
            const y = ((100 - currentBright) / 100) * gradientCanvas.height
            gradientCursor.style.left = x + 'px'
            gradientCursor.style.top = y + 'px'
        }

        updateFinalCanvas()
    }

    function updateSwatchColor(color) {
        const swatchInner = colorSwatch.querySelector('.swatch-inner')
        swatchInner.style.background = color
    }

    function hsvToHex(h, s, v) {
        s /= 100
        v /= 100
        const c = v * s
        const x = c * (1 - Math.abs((h / 60) % 2 - 1))
        const m = v - c
        let r, g, b
        
        if (h < 60) { r = c; g = x; b = 0 }
        else if (h < 120) { r = x; g = c; b = 0 }
        else if (h < 180) { r = 0; g = c; b = x }
        else if (h < 240) { r = 0; g = x; b = c }
        else if (h < 300) { r = x; g = 0; b = c }
        else { r = c; g = 0; b = x }
        
        r = Math.round((r + m) * 255)
        g = Math.round((g + m) * 255)
        b = Math.round((b + m) * 255)
        
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    }

    function hexToHSV(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        
        let h = 0
        if (d !== 0) {
            if (max === r) h = ((g - b) / d) % 6
            else if (max === g) h = (b - r) / d + 2
            else h = (r - g) / d + 4
            h = Math.round(h * 60)
            if (h < 0) h += 360
        }
        
        const s = max === 0 ? 0 : (d / max) * 100
        const v = max * 100
        
        return { h, s, v }
    }

    downloadBtn.onclick = async () => {
        const renderOptions = {
            showText: currentOptions.showBranding,
            showDate: currentOptions.showDate,
            showLocation: currentOptions.showLocation,
            showCaption: currentOptions.showCaption,
            locationText: currentOptions.locationText,
            captionText: currentOptions.captionText,
            captionStyle: currentOptions.captionStyle,
            bgColor: currentOptions.bgColor
        }
        const url = await renderLayout(layout, photos, stickerManager, renderOptions)
        const a = document.createElement('a')
        a.download = `StarlightStudio-${Date.now()}.png`
        a.href = url
        a.click()
    }

    restartBtn.onclick = () => {
        if (confirm('Start Over?')) location.reload()
    }

    function runCountdown(seconds) {
        return new Promise(resolve => {
            const overlay = document.querySelector('#countdown-overlay')
            overlay.classList.remove('hidden')
            let count = seconds
            overlay.textContent = count

            const timer = setInterval(() => {
                count--
                if (count > 0) overlay.textContent = count
                else {
                    clearInterval(timer)
                    overlay.classList.add('hidden')
                    resolve()
                }
            }, 1000)
        })
    }

    function playFlash() {
        flashOverlay?.classList.add('active')
        setTimeout(() => flashOverlay?.classList.remove('active'), 300)
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms))
}

function createItemWrapper(src, label) {
    const div = document.createElement('div')
    div.className = 'sidebar-item-wrapper'
    div.setAttribute('data-label', label)
    const img = document.createElement('img')
    img.src = src
    div.appendChild(img)
    return div
}