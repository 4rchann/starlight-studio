export function initTitleAnimation() {
    const titleChanger = document.querySelectorAll('.text-changer h1')
    let currentTitleIndex = 0

    titleChanger.forEach((title, i) => {
        title.style.position = 'absolute'
        title.style.left = '50%'
        title.style.transform = i === 0 ? 'translateX(-50%)' : 'translateX(-50%) translateY(-20px)'
        title.style.opacity = i === 0 ? '1' : '0'
        title.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
    })

    setInterval(() => {
        titleChanger[currentTitleIndex].style.opacity = '0'
        titleChanger[currentTitleIndex].style.transform = 'translateX(-50%) translateY(-20px)'
        currentTitleIndex = (currentTitleIndex + 1) % titleChanger.length
        titleChanger[currentTitleIndex].style.opacity = '1'
        titleChanger[currentTitleIndex].style.transform = 'translateX(-50%) translateY(0)'
    }, 3000)
}