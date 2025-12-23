export function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item')
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question')
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active')
                }
            })

            item.classList.toggle('active')
        })
    })
}

export function initFaqCategory() {
    const categoryBtn = document.querySelectorAll('.faq-category-btn')
    const faqItems = document.querySelectorAll('.faq-item')

    categoryBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtn.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')

            const category = btn.dataset.category
            faqItems.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = 'block'
                } else {
                    item.style.display = 'none'
                }
            })
        })
    })
}