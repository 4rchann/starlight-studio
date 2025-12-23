export function initBgAnimation() {
    const pageContent = document.querySelector('.page-content')
    if(!pageContent) return
    
    const iconCount = 23
    const assetsBase = '../../../assets/images'
    const iconSources = [
        `${assetsBase}/boba-icon.png`,
        `${assetsBase}/star1.png`,
        `${assetsBase}/star2.png`,
        `${assetsBase}/star3.png`
    ]

    const placedIcon = []
    const minDistance = 80

    function getRandomPosition() {
        const containerWidth = pageContent.offsetWidth
        const containerHeight = pageContent.offsetHeight
        let attempts = 0
        const maxAttempts = 50

        while (attempts < maxAttempts) {
            const x = Math.random() * (containerWidth - 100)
            const y = Math.random() * (containerHeight - 100)

            let overlaps = false
            for (const pos of placedIcon) {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
                if (distance < minDistance) {
                    overlaps = true
                    break
                }
            }

            if (!overlaps) {
                placedIcon.push({x, y})
                return {x, y}
            }

            attempts++
        }

        return {
            x: Math.random() * (containerWidth - 100),
            y: Math.random() * (containerHeight - 100)
        }
    }

    for (let i = 0; i < iconCount; i++) {
        const icon = document.createElement('img')
        icon.src = iconSources[Math.floor(Math.random() * iconSources.length)]
        icon.classList.add('bg-icon')

        const pos = getRandomPosition()
        icon.style.left = `${pos.x}px`
        icon.style.top = `${pos.y}px`
        icon.style.width = `${30 + Math.random() * 40}px`
        icon.style.setProperty('--rotation', `${Math.random() * 360}deg`)
        icon.style.animationDelay = `${Math.random() * 5}s`
        pageContent.appendChild(icon)

        requestAnimationFrame(() => {
            icon.classList.add('loaded')
        })
    }
}