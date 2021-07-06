'use strict';
// add dynamic menu button on vertical device form bulma official site
document.addEventListener('DOMContentLoaded', () => {
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0)
    if ($navbarBurgers.length > 0) {
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target
                const $target = document.getElementById(target)
                el.classList.toggle('is-active')
                $target.classList.toggle('is-active')
            })
        })
    }
});

// for the random quote in the title
(() => {
    const txtFile = new XMLHttpRequest();
    txtFile.open('GET', '/assets/slogan', true)
    txtFile.onreadystatechange = () => {
        if (txtFile.readyState === 4) {
            if (txtFile.status === 200) {
                const lines = txtFile.responseText.split('\n');
                const randLine = lines[Math.floor((Math.random() * lines.length) + 1)];
                document.getElementById('quote').insertAdjacentText('afterbegin', randLine || 'Intelligence is the ability to adapt to change.')
            }
        }
    };
    txtFile.send(null)
})();

// Copyright 2020 YexuanXiao under the MIT license
// disallow drag pictures
document.body.addEventListener('dragstart', () => false)

// darkmode method
function applyTheme(themeName) {
    const darkmodeCss = document.getElementById('darkmode-css');
    const date = new Date();
    date.setTime(date.getTime() + 30 * 60 * 1000 * 4);
    if (themeName === 'default-theme') {
        darkmodeCss.rel = 'alternate stylesheet'
        document.cookie = `theme=default-theme;expires=${date.toGMTString()};path=/`
    } else if (themeName === 'dark-theme') {
        darkmodeCss.rel = 'stylesheet'
        document.cookie = `theme=dark-theme;expires=${date.toGMTString()};path=/`
    }
}
function changeTheme() {
    if (document.getElementById('darkmode-css').rel.match(/alternate/)) {
        applyTheme('dark-theme')
    } else {
        applyTheme('default-theme')
    }
}

// initlize darkmode button
(() => {
    const container = document.createElement('div');
    const btn = document.createElement('input');
    document.body.appendChild(container)
    container.id = 'btn-container'
    container.appendChild(btn)
    btn.addEventListener('click', changeTheme)
    btn.type = 'button'
    btn.value = '🌓'
    btn.style.cssText = 'background-color: transparent !important; border: none; font-size: 25px; z-index: 999; position: fixed; right: 10%; bottom: 10%'
})();

// hot load script and styles
function loadStyles(uri) {
    let link = document.createElement('link');
    link.rel = 'stylesheet'
    link.as = 'style'
    link.href = uri
    document.querySelector('head').appendChild(link)
    return link
}

function loadScript(uri, callback) {
    let script = document.createElement('script');
    script.src = uri
    callback = callback || (() => { })
    script.addEventListener('load', getReady => {
        callback()
        script.removeEventListener('load', getReady)
    })
    document.body.appendChild(script)
    return script
}

// function for control search manu and navbar menu display or not
// 0 for hide search-menu
// 1 for show search-menu
// 2 for close navbar-menu
function closeMenu(x) {
    const searchMenu = document.body.querySelector('#search-panel>.box');
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarMenu = document.getElementById('navbarExampleTransparentExample');
    if (x === 0) {
        searchMenu.style.display = 'none'
    } else if (x === 1) {
        searchMenu.style.display = 'block'
    } else if (x === 2) {
        navbarToggle.className = 'navbar-burger burger'
        navbarMenu.className = 'navbar-menu'
    } else {
        throw `${x} is undefined.`
    }
}

// check search bar value to display search-menu
function checkInput() {
    closeMenu(2)
    let inputValue = document.body.querySelector('#search-panel>input').value;
    if (!inputValue) {
        closeMenu(0)
    } else {
        closeMenu(1)
    }
}

// tap blank area to close search menu and navbar
document.body.addEventListener('click', () => {
    const cDom = document.querySelector('nav.navbar');
    const tDom = event.target;
    if (cDom === tDom || cDom.contains(tDom)) { } else {
        closeMenu(0)
        closeMenu(2)
    }
});

// make navbar flow on the top and progress bar
(() => {
    const postText = document.body.querySelector('article');
    const container = document.body.querySelector('.main-container');
    const navbar = document.body.querySelector('nav.navbar');
    const topProcess = document.createElement('div');
    const halfWindow = window.screen.height / 3;
    const articleHeight = postText.clientHeight;
    topProcess.id = 'progress';
    document.body.appendChild(topProcess);
    document.addEventListener('scroll', () => {
        closeMenu(2)
        let topoffset = navbar.offsetHeight;
        let postTextTop = postText.offsetTop;
        let scrollTopExp = container.offsetTop;
        let scrollTopReal = document.documentElement.scrollTop || document.body.scrollTop;
        let conMargin = container.offsetLeft;
        let processValue = ((halfWindow + scrollTopReal - postTextTop) / articleHeight) * 100;
        topProcess.style.top = `${topoffset - 2}px`
        if (scrollTopReal > scrollTopExp) {
            navbar.style.paddingLeft = `${conMargin}px`
            navbar.style.paddingRight = `${conMargin}px`
            navbar.style.position = 'fixed'
            topProcess.style.width = (processValue > 100) ? `${100}%` : `${processValue}%`
            topProcess.style.display = 'block'
        } else {
            navbar.style.paddingLeft = 'unset'
            navbar.style.paddingRight = 'unset'
            navbar.style.position = 'relative'
            topProcess.style.display = 'none'
        }
    })
})();

// output Logo in console
console.log('\n███╗   ███╗   ██████╗     ███████╗\n████╗ ████║   ██╔══██╗   ██╔═══██║\n██╔████╔██║   ██████╔╝   ██║   ██║\n██║╚██╔╝██║   ██╔═══╝    ██║   ██║\n██║ ╚═╝ ██║██╗██║     ██╗███████╔╝██╗\n╚═╝     ╚═╝╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝\n       © 2016 - 2021 M.P.O.')
console.log('%c M.P.O. %c https://mysteriouspreserve.com ', 'color: #fff; margin: 1em 0; padding: 5px 0; background: #3298dc;', 'margin: 1em 0; padding: 5px 0; background: #efefef;')