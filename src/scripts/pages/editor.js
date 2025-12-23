import { startCamera, stopCamera, captureFrame } from '../features/camera.js'
import { getLayoutById } from '../features/layouts.js'
import { renderLayout } from '../features/canvasRenderer.js'
import { STICKERS } from '../features/stickers.js'
import { getPhotostripsForLayout } from '../features/photostrips.js'
import { StickerManager } from '../features/stickerInteraction.js'

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
    let currentOptions = { showBranding: true, showDate: true, bgColor: '#ffffff'}

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

    const photos = []
    let isCapturing = false
    let stickerManager = null

    statusText.textContent = `Pose 1 of ${layout.photoCount}`
    finalCanvas.width = layout.width
    finalCanvas.height = layout.height

    livePreviewCanvas.width = layout.width
    livePreviewCanvas.height = layout.height
    renderLivePreview()
    const hasCamera = await startCamera(videoElement)
    if (!hasCamera) statusText.textContent = 'Camera unavailable'

    const handlePhotoAdd = async (photoData) => {
        photos.push(photoData)
        await renderLivePreview()

        if (photos.length < layout.photoCount) {
            statusText.textContent = `Pose ${photos.length + 1} of ${layout.photoCount}`
        } else {
            statusText.textContent = 'Processing...'
        }
    }

    captureBtn.addEventListener('click', async () => {
        if (isCapturing) return
        if (photos.length >= layout.photoCount) return

        isCapturing = true

        while (photos.length < layout.photoCount) {
            await runCountdown(3)

            if (flashOverlay) {
                flashOverlay.classList.add('active')
                setTimeout(() => flashOverlay.classList.remove('active'), 300)
            }

            const photoData = captureFrame(videoElement)
            if (photoData) await handlePhotoAdd(photoData)
            
            if (photos.length < layout.photoCount) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }

        await finishCapture()
        isCapturing = false
    })

    uploadBtn.addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                await handlePhotoAdd(evt.target.result)
                fileInput.value = ''
            }
            reader.readAsDataURL(file)
        }
    })

    retakeBtn.addEventListener('click', () => {
        photos.length = 0
        statusText.textContent = `Pose 1 of ${layout.photoCount}`
        renderLivePreview()
    })

    async function finishCapture() {
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
        bgColorPicker.value = currentOptions.bgColor
        updateBrandingToggleState()
        toggleDate.checked = currentOptions.showDate
        updateFinalCanvas()
    }

    function updateBrandingToggleState() {
        const brandingLabel = toggleText.closest('.toggle-customize')

        if (layout.image) {
            brandingLabel.style.display = 'none'
            currentOptions.showBranding = false
        } else if (!layout.text) {
            brandingLabel.style.display = 'none'
            currentOptions.showBranding = false
            toggleText.checked = false
        } else if (layout.lockBranding) {
            brandingLabel.style.display = 'none'
            currentOptions.showBranding = true
            toggleText.checked = true
        } else {
            brandingLabel.style.display = 'flex'
            toggleText.checked = currentOptions.showBranding
        }
    }

    async function updateFinalCanvas() {
        const dataUrl = await renderLayout(layout, photos, null, {
            showText: currentOptions.showBranding,
            showDate: currentOptions.showDate,
            bgColor: currentOptions.bgColor
        })

        const ctx = finalCanvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height)
            ctx.drawImage(img, 0, 0)
            if (stickerManager) stickerManager.render(ctx)
        }
        img.src = dataUrl
    }

    async function renderLivePreview() {
        const dataUrl = await renderLayout(layout, photos, null, {
            showText: true,
            showDate: false,
            bgColor: '#ffffff'
        })
        const ctx = livePreviewCanvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height)
            ctx.drawImage(img, 0, 0)
        }
        img.src = dataUrl
    }

    async function renderFramesSidebar() {
        framesList.innerHTML = ''
        const photostrips = getPhotostripsForLayout(layout.id)

        for (const strip of photostrips) {
            const tempLayout = {
                ...layout,
                image: strip.stripImage,
                slots: strip.slots || layout.slots
            }

            const showBrandingPreview = !strip.stripImage && layout.text && !layout.lockBranding
            const dataUrl = await renderLayout(tempLayout, photos, null, {
                showText: showBrandingPreview,
                showDate: false,
                bgColor: currentOptions.bgColor,
                scale: 0.2
            })

            const wrapper = createItemWrapper(dataUrl, strip.name, false)

            if (strip.stripImage === layout.image) {
                wrapper.classList.add('selected')
            } else if (!layout.image && !strip.stripImage) {
                wrapper.classList.add('selected')
            }

            wrapper.onclick = () => applyFrame(strip, wrapper)
            framesList.appendChild(wrapper)
        }
    }

    function createItemWrapper(src, label, isTextContent) {
        const wrapper = document.createElement('div')
        wrapper.className = 'sidebar-item-wrapper'
        wrapper.setAttribute('data-label', label)

        if (isTextContent) {
            wrapper.innerHTML = `<div style="width: 100%; height: 80px; background:#fff; border:3px solid transparent; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:12px; text-align:center; color:#333;">Default</div>`
            wrapper.querySelector('div').classList.add('frame-thumb-placeholder')
        } else {
            const img = document.createElement('img')
            img.src = src
            wrapper.appendChild(img)
        }

        return wrapper
    }

    async function applyFrame(strip, element) {
        const items = framesList.querySelectorAll('.sidebar-item-wrapper')
        items.forEach(i => i.classList.remove('selected'))
        element.classList.add('selected')
        layout.image = strip.stripImage

        if (strip.slots) {
            layout.slots = strip.slots
        } else {
            const original = getLayoutById(layout.id)
            layout.slots = JSON.parse(JSON.stringify(original.slots))
        }

        if (strip.stripImage) {
            customizeSection.style.display = 'none'
            currentOptions.showDate = false
        } else {
            customizeSection.style.display = 'block'
            currentOptions.bgColor = bgColorPicker.value
            currentOptions.showDate = toggleDate.checked
        }

        updateBrandingToggleState()
        updateFinalCanvas()
    }

    bgColorPicker.addEventListener('input', (e) => {
        currentOptions.bgColor = e.target.value
        updateFinalCanvas()
    })
    toggleText.addEventListener('change', (e) => {
        currentOptions.showBranding = e.target.checked
        updateFinalCanvas()
    })
    toggleDate.addEventListener('change', (e) => {
        currentOptions.showDate = e.target.checked
        updateFinalCanvas()
    })

    function renderStickersSidebar() {
        stickersList.innerHTML = ''
        STICKERS.forEach(sticker => {
            const wrapper = createItemWrapper(sticker.src, sticker.name, false)
            wrapper.onclick = () => {
                if(stickerManager) stickerManager.addSticker(sticker.src)
            }
        stickersList.appendChild(wrapper)
        })
    }

    downloadBtn.addEventListener('click', async () => {
        const dataUrl = await renderLayout(layout, photos, stickerManager, {
            showText: currentOptions.showBranding,
            showDate: currentOptions.showDate,
            bgColor: currentOptions.bgColor
        })
        const link = document.createElement('a')
        link.download = `StarlightStudio-${Date.now()}.png`
        link.href = dataUrl
        link.click()
    })

    restartBtn.addEventListener('click', () => {
        if(confirm('Start Over?')) window.location.reload()
    })

    function runCountdown(seconds) {
        return new Promise(resolve => {
            const overlay = document.querySelector('#countdown-overlay')
            overlay.classList.remove('hidden')
            let count = seconds
            overlay.textContent = count
            const interval = setInterval(() => {
                count--
                if (count > 0) overlay.textContent = count
                else {
                    clearInterval(interval)
                    overlay.classList.add('hidden')
                    resolve()
                }
            }, 1000)
        })
    }
}