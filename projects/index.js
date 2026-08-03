const pageTitle = document.getElementById('pageTitle');
const menu = document.getElementById('menu');
const projectSearch = document.getElementById('projectSearch');
const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
const projectCards = Array.from(document.querySelectorAll('.project-card'));
const body = document.body;
const toggleButton = document.querySelector('.menu-toggle');

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function updateProjectVisibility() {
    const query = normalizeText(projectSearch?.value || '');
    const activeFilter = filterButtons.find((button) => button.classList.contains('active'))?.dataset.filter || 'all';

    projectCards.forEach((card) => {
        const title = normalizeText(card.dataset.title || card.querySelector('h3')?.textContent || '');
        const categories = normalizeText(card.dataset.categories || Array.from(card.querySelectorAll('.project-tag')).map((tag) => tag.textContent).join(', '));

        const matchesQuery = !query || title.includes(query) || categories.includes(query);
        const matchesFilter = activeFilter === 'all' || categories.split(',').map((part) => part.trim()).includes(normalizeText(activeFilter));

        card.style.display = matchesQuery && matchesFilter ? 'flex' : 'none';
    });
}

if (projectSearch) {
    projectSearch.addEventListener('input', () => {
        updateProjectVisibility();
    });
}

if (filterButtons.length) {
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            updateProjectVisibility();
        });
    });
}

if (pageTitle && menu) {
    pageTitle.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
            return;
        }
        pageTitle.classList.add('title-exiting');
        menu.classList.add('show');
    });
}

if (toggleButton && menu) {
    toggleButton.addEventListener('click', () => {
        menu.classList.add('closing');
        if (pageTitle) {
            pageTitle.classList.remove('title-exiting');
        }
        setTimeout(() => {
            menu.classList.remove('show', 'closing');
        }, 450);
    });
}

updateProjectVisibility();
