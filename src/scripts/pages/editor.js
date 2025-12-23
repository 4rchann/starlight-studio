import { startCamera, stopCamera, captureFrame } from '../features/camera.js'
import { getLayoutById } from '../features/layouts.js'
import { renderLayout } from '../features/canvasRenderer.js'
import { STICKERS } from '../features/stickers.js'
import { getPhotostripsForLayout } from '../features/photostrips.js'
import { StickerManager } from '../features/stickerInteraction.js'

export async function initEditor() {
    /* ========================
       SETUP & STATE
    ======================== */
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

    const currentOptions = {
        showBranding: true,
        showDate: true,
        bgColor: '#ffffff'
    }

    /* ========================
       DOM ELEMENTS
    ======================== */
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
    const bgColorPicker = document.querySelector('#bg-color-picker')
    const toggleText = document.querySelector('#toggle-text')
    const toggleDate = document.querySelector('#toggle-date')

    /* ========================
       CANVAS SETUP
    ======================== */
    finalCanvas.width = layout.width
    finalCanvas.height = layout.height
    livePreviewCanvas.width = layout.width
    livePreviewCanvas.height = layout.height

    statusText.textContent = `Pose 1 of ${layout.photoCount}`

    /* ========================
       CAMERA START
    ======================== */
    const hasCamera = await startCamera(videoElement)
    if (!hasCamera) {
        statusText.textContent = 'Camera unavailable'
        return
    }

    renderLivePreview()

    /* ========================
       CORE CAPTURE FLOW
    ======================== */
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

    /* ========================
       UPLOAD SUPPORT
    ======================== */
    uploadBtn.addEventListener('click', () => fileInput.click())

    fileInput.addEventListener('change', e => {
        const file = e.target.files[0]
        if (!file || photos.length >= layout.photoCount) return

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

    /* ========================
       RETAKE
    ======================== */
    retakeBtn.addEventListener('click', async () => {
        photos.length = 0
        statusText.textContent = `Pose 1 of ${layout.photoCount}`
        await renderLivePreview()
    })

    /* ========================
       FINISH CAPTURE
    ======================== */
    function finishCapture() {
        stopCamera(videoElement)
        captureView.classList.add('hidden')
        customizeView.classList.remove('hidden')
        initCustomization()
    }

    /* ========================
       CUSTOMIZATION
    ======================== */
    function initCustomization() {
        stickerManager = new StickerManager(finalCanvas, updateFinalCanvas)
        renderFramesSidebar()
        renderStickersSidebar()
        customizeSection.style.display = 'block'
        bgColorPicker.value = currentOptions.bgColor
        toggleDate.checked = currentOptions.showDate
        updateBrandingToggleState()
        updateFinalCanvas()
    }

    function updateBrandingToggleState() {
        const brandingLabel = toggleText.closest('.toggle-customize')

        if (layout.image || !layout.text) {
            brandingLabel.style.display = 'none'
            currentOptions.showBranding = false
        } else if (layout.lockBranding) {
            brandingLabel.style.display = 'none'
            currentOptions.showBranding = true
        } else {
            brandingLabel.style.display = 'flex'
            toggleText.checked = currentOptions.showBranding
        }
    }

    /* ========================
       RENDERING
    ======================== */
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
        const dataUrl = await renderLayout(layout, photos, stickerManager, currentOptions)

        const ctx = finalCanvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height)
            ctx.drawImage(img, 0, 0)
            stickerManager?.render(ctx)
        }
        img.src = dataUrl
    }

    /* ========================
       FRAMES
    ======================== */
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
        updateBrandingToggleState()
        updateFinalCanvas()
    }

    /* ========================
       STICKERS
    ======================== */
    function renderStickersSidebar() {
        stickersList.innerHTML = ''
        STICKERS.forEach(sticker => {
            const w = createItemWrapper(sticker.src, sticker.name)
            w.onclick = () => stickerManager?.addSticker(sticker.src)
            stickersList.appendChild(w)
        })
    }

    /* ========================
       CONTROLS
    ======================== */
    bgColorPicker.oninput = e => {
        currentOptions.bgColor = e.target.value
        updateFinalCanvas()
    }

    toggleText.onchange = e => {
        currentOptions.showBranding = e.target.checked
        updateFinalCanvas()
    }

    toggleDate.onchange = e => {
        currentOptions.showDate = e.target.checked
        updateFinalCanvas()
    }

    downloadBtn.onclick = async () => {
        const url = await renderLayout(layout, photos, stickerManager, currentOptions)
        const a = document.createElement('a')
        a.download = `StarlightStudio-${Date.now()}.png`
        a.href = url
        a.click()
    }

    restartBtn.onclick = () => {
        if (confirm('Start Over?')) location.reload()
    }

    /* ========================
       HELPERS
    ======================== */
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
