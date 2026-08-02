const pageTitle = document.getElementById('pageTitle');
const menu = document.getElementById('menu');
const body = document.body;
const toggleButton = document.querySelector('.menu-toggle');

if (pageTitle && menu) {
    pageTitle.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
            return;
        }
        pageTitle.classList.add('title-exiting');
        document.querySelector('.center-wrap')?.classList.add('open');
        menu.classList.add('show');
        setTimeout(() => {
            pageTitle.style.display = 'none';
        }, 600);
    });
}

if (toggleButton && menu) {
    toggleButton.addEventListener('click', () => {
        menu.classList.add('closing');
        body.classList.remove('menu-open');
        if (pageTitle) {
            pageTitle.style.display = 'inline-block';
            pageTitle.classList.remove('title-exiting');
        }
        setTimeout(() => {
            menu.classList.remove('show', 'closing');
        }, 450);
    });
}
