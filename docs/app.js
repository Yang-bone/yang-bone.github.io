const root=document.documentElement;
const settingsButton=document.getElementById('settingsButton');
const settingsPanel=document.getElementById('settingsPanel');
const searchOverlay=document.getElementById('searchOverlay');
const searchInput=document.getElementById('searchInput');
const searchResults=document.getElementById('searchResults');
const sections=[...document.querySelectorAll('[data-search-title]')];
const menuButton=document.getElementById('menuButton');
const sidebarBackdrop=document.getElementById('sidebarBackdrop');
const sidebarLinks=[...document.querySelectorAll('.sidebar .nav-link')];
const tocLinks=[...document.querySelectorAll('.toc a')];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const brandLogo=document.querySelector('.brand img');
const cursorAura=document.createElement('span');
cursorAura.className='cursor-aura';
cursorAura.setAttribute('aria-hidden','true');
document.body.append(cursorAura);

function showBrandFallback(){brandLogo.hidden=true;brandLogo.nextElementSibling.hidden=false}
if(brandLogo.complete&&!brandLogo.naturalWidth)showBrandFallback();
else brandLogo.addEventListener('error',showBrandFallback,{once:true});

function readSetting(key,values,fallback){try{const value=localStorage.getItem(key);return values.includes(value)?value:fallback}catch{return fallback}}
function saveSetting(key,value){try{localStorage.setItem(key,value)}catch{/* Settings remain active until navigation. */}}
function setSettingsOpen(open){settingsPanel.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open))}
function setSpotlight(enabled){root.classList.toggle('spotlight-enabled',enabled);document.getElementById('spotlightOn').setAttribute('aria-pressed',String(enabled));document.getElementById('spotlightOff').setAttribute('aria-pressed',String(!enabled));saveSetting('docs-spotlight',String(enabled))}
function closeSidebar(){document.body.classList.remove('sidebar-open');menuButton.setAttribute('aria-expanded','false');sidebarBackdrop.hidden=true}
function closeSearch(){searchOverlay.hidden=true;searchInput.value=''}
function navigateToSection(section){
    if(!section)return;
    history.pushState(null,'',`#${section.id}`);
    [...sidebarLinks,...tocLinks].forEach(link=>{
        const active=link.hash===`#${section.id}`;
        if(sidebarLinks.includes(link)){link.classList.toggle('is-current',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')}
        if(tocLinks.includes(link))link.classList.toggle('active',active);
    });
    section.scrollIntoView({behavior:reducedMotion?'auto':'smooth'});
}

function renderSearchResults(query){
    const normalized=query.trim().toLocaleLowerCase();
    const matches=sections.filter(section=>`${section.dataset.searchTitle} ${section.textContent}`.toLocaleLowerCase().includes(normalized));
    searchResults.replaceChildren();
    if(!matches.length){const empty=document.createElement('div');empty.className='empty-result';empty.textContent='没有找到匹配的内容';searchResults.append(empty);return}
    matches.forEach((section,index)=>{
        const result=document.createElement('button');const title=document.createElement('span');const description=document.createElement('small');
        result.className='search-result';result.type='button';result.setAttribute('role','option');result.setAttribute('aria-selected',String(index===0));
        title.textContent=section.dataset.searchTitle;description.textContent=section.querySelector('p')?.textContent??'';result.append(title,description);
        result.addEventListener('click',()=>{closeSearch();navigateToSection(section)});searchResults.append(result);
    });
}
function openSearch(){setSettingsOpen(false);searchOverlay.hidden=false;searchInput.value='';renderSearchResults('');searchInput.focus()}
function moveSearchSelection(direction){const results=[...searchResults.querySelectorAll('.search-result')];if(!results.length)return;const current=results.findIndex(result=>result.getAttribute('aria-selected')==='true');const next=(current+direction+results.length)%results.length;results.forEach((result,index)=>result.setAttribute('aria-selected',String(index===next)));results[next].scrollIntoView({block:'nearest'})}
function updateActiveNavigation(entries){entries.forEach(entry=>{if(!entry.isIntersecting)return;const hash=`#${entry.target.id}`;[...sidebarLinks,...tocLinks].forEach(link=>{const active=link.hash===hash;if(sidebarLinks.includes(link)){link.classList.toggle('is-current',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')}if(tocLinks.includes(link))link.classList.toggle('active',active)})})}
let layoutChangeTimer;
function setLayout(layout,button){
    root.classList.add('layout-changing');
    root.dataset.layout=layout;
    saveSetting('docs-layout',layout);
    document.querySelectorAll('[data-layout-choice]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
    window.clearTimeout(layoutChangeTimer);
    layoutChangeTimer=window.setTimeout(()=>root.classList.remove('layout-changing'),520);
}
function trackPointer(event){
    if(event.pointerType==='touch'){cursorAura.classList.remove('is-visible','is-hovering');return}
    cursorAura.style.left=`${event.clientX}px`;
    cursorAura.style.top=`${event.clientY}px`;
    cursorAura.classList.add('is-visible');
    const element=event.target instanceof Element?event.target:null;
    cursorAura.classList.toggle('is-hovering',Boolean(element?.closest('a,button,input,summary,[role="button"],.spotlight-target')));
    const target=element?.closest('.spotlight-target,.tool-button,.setting-option,.nav-link,.toc a,.search-result,.history-card summary');
    if(!target)return;
    const bounds=target.getBoundingClientRect();
    target.style.setProperty('--pointer-x',`${event.clientX-bounds.left}px`);
    target.style.setProperty('--pointer-y',`${event.clientY-bounds.top}px`);
}
function createClickRipple(event){
    if(event.button!==0)return;
    const ripple=document.createElement('span');
    ripple.className='click-ripple';
    ripple.setAttribute('aria-hidden','true');
    ripple.style.left=`${event.clientX}px`;
    ripple.style.top=`${event.clientY}px`;
    document.body.append(ripple);
    cursorAura.classList.add('is-clicking');
    ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
    window.setTimeout(()=>{ripple.remove();cursorAura.classList.remove('is-clicking')},900);
}
function initializeMotion(){
    if(reducedMotion)return;root.classList.add('motion-ready');
    if(!('IntersectionObserver'in window)){document.querySelectorAll('.reveal').forEach(item=>item.classList.add('is-visible'));return}
    const revealObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08});
    document.querySelectorAll('.reveal').forEach((item,index)=>{item.style.transitionDelay=`${Math.min(index*45,180)}ms`;revealObserver.observe(item)});
    const navObserver=new IntersectionObserver(updateActiveNavigation,{rootMargin:'-18% 0px -68% 0px'});sections.forEach(section=>navObserver.observe(section));
}

document.getElementById('searchButton').addEventListener('click',openSearch);
searchInput.addEventListener('input',()=>renderSearchResults(searchInput.value));
searchInput.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();moveSearchSelection(event.key==='ArrowDown'?1:-1)}else if(event.key==='Enter'){event.preventDefault();searchResults.querySelector('[aria-selected="true"]')?.click()}});
searchOverlay.addEventListener('click',event=>{if(event.target===searchOverlay)closeSearch()});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch()}if(event.key==='Escape'){closeSearch();setSettingsOpen(false);closeSidebar()}});

settingsButton.addEventListener('click',()=>setSettingsOpen(settingsPanel.hidden));
document.addEventListener('click',event=>{if(!event.target.closest('.settings-wrap'))setSettingsOpen(false)});
document.querySelectorAll('[data-layout-choice]').forEach(button=>button.addEventListener('click',()=>setLayout(button.dataset.layoutChoice,button)));
document.getElementById('spotlightOn').addEventListener('click',()=>setSpotlight(true));
document.getElementById('spotlightOff').addEventListener('click',()=>setSpotlight(false));
document.querySelectorAll('[data-spotlight-choice]').forEach(button=>button.addEventListener('click',()=>{root.dataset.spotlightStyle=button.dataset.spotlightChoice;saveSetting('docs-spotlight-style',root.dataset.spotlightStyle);document.querySelectorAll('[data-spotlight-choice]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)))}));
document.getElementById('themeButton').addEventListener('click',event=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';event.currentTarget.setAttribute('aria-pressed',String(root.dataset.theme==='light'));saveSetting('docs-theme',root.dataset.theme)});
menuButton.addEventListener('click',()=>{const open=!document.body.classList.contains('sidebar-open');document.body.classList.toggle('sidebar-open',open);menuButton.setAttribute('aria-expanded',String(open));sidebarBackdrop.hidden=!open});
sidebarBackdrop.addEventListener('click',closeSidebar);sidebarLinks.forEach(link=>link.addEventListener('click',closeSidebar));
tocLinks.forEach(link=>link.addEventListener('click',event=>{const target=document.querySelector(link.hash);if(!target)return;event.preventDefault();navigateToSection(target)}));
document.addEventListener('pointermove',trackPointer,{passive:true});
document.addEventListener('pointerdown',createClickRipple,{passive:true});
document.addEventListener('pointerout',event=>{if(!event.relatedTarget)cursorAura.classList.remove('is-visible','is-hovering')});

root.dataset.theme=readSetting('docs-theme',['dark','light'],root.dataset.theme);
root.dataset.layout=readSetting('docs-layout',['narrow','balanced','wide','focus'],root.dataset.layout);
root.dataset.spotlightStyle=readSetting('docs-spotlight-style',['block','line'],root.dataset.spotlightStyle);
document.getElementById('themeButton').setAttribute('aria-pressed',String(root.dataset.theme==='light'));
document.querySelectorAll('[data-layout-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layoutChoice===root.dataset.layout)));
document.querySelectorAll('[data-spotlight-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.spotlightChoice===root.dataset.spotlightStyle)));
setSpotlight(readSetting('docs-spotlight',['true','false'],'false')==='true');initializeMotion();

const analyticsScript=document.createElement('script');
analyticsScript.id='LA_COLLECT';
analyticsScript.charset='UTF-8';
analyticsScript.src='https://sdk.51.la/js-sdk-pro.min.js';
analyticsScript.async=true;
analyticsScript.addEventListener('load',()=>{
    if(window.LA){window.LA.init({id:'3RK1RPuZ7uEyB5GC',ck:'3RK1RPuZ7uEyB5GC',autoTrack:true})}
},{once:true});
document.head.append(analyticsScript);