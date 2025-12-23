export async function startCamera(videoElement) {
    if (!videoElement) return false

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280},
                height: { ideal: 720}
            },
            audio: false
        })

        videoElement.srcObject = stream
        return true
    } catch (error) {
        console.error('Error accessing camera:', error)
        alert('Could not access camera. Please allow camera permissions to use this feature.')
        return false
    }
}

export function stopCamera(videoElement) {
    if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        videoElement.srcObject = null
    }
}

export function captureFrame(videoElement) {
    if (!videoElement) return null

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    const context = canvas.getContext('2d')
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
}