document.querySelectorAll('[data-include]').forEach(async el => {
    const file = el.getAttribute('data-include')
    const res = await fetch(file)
    el.innerHTML = await res.text()
})