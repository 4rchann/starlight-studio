import './include.js'

document.addEventListener('DOMContentLoaded', () => {
    initNavigation()
    initSmoothScroll()
    loadPageScript()
})

function loadPageScript() {
    const page = document.body.dataset.page

    if (page === 'home') {
        import('./pages/home.js')
    } else if (page === 'faq') {
        import('./pages/faq.js').then(module => {
            module.initFaqAccordion()
            module.initFaqCategory()
        })
    } else if (page === 'layouts-picker') {
        import('./pages/layoutsPicker.js').then(module => {
            module.initLayoutsPicker()
        })
    } else if (page === 'editor') {
        import('./pages/editor.js').then(module => {
            module.initEditor()
        })
    }
}

function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'
    const navLinks = document.querySelectorAll('.menu a')

    navLinks.forEach(link => {
        link.classList.remove('active')
        const href = link.getAttribute('href')
        if (href === currentPage) {
            link.classList.add('active')
        }
    })
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault()
            const target = document.querySelector(this.getAttribute('href'))
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        })
    })
}