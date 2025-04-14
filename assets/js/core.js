---
	layout: null
---
'use strict';
// Copyright 2021 YexuanXiao under the MIT license

// for the random quote in the title
(async () => {
	const response = await fetch('/assets/slogan.txt')
	const text = await response.text()
	const lines = text.split('\n')
	const randLine = lines[Math.floor((Math.random() * lines.length) + 1)]
	if (randLine) {
		document.getElementById('quote').textContent = randLine
		setTimeout(() => { render(randLine) }, 100000)
	}
})()

// darkmode method
function changeTheme() {
	const darkmodeCss = document.getElementById('darkmode-css')
	if (sessionStorage.getItem('darktheme') !== 'true') {
		darkmodeCss.rel = 'stylesheet'
		sessionStorage.setItem('darktheme', 'true')
		render('{% if site.i18n.l2dmessage.dark %}{{ site.i18n.l2dmessage.dark }}{% else %}Change to darkmode!{% endif %}')
	} else {
		darkmodeCss.rel = ''
		sessionStorage.setItem('darktheme', 'false')
		render('{% if site.i18n.l2dmessage.light %}{{ site.i18n.l2dmessage.light }}{% else %}Change to lightmode!{% endif %}')
	}
}

// initlize darkmode button
{
	const container = document.createElement('div')
	const btn = document.createElement('input')
	document.body.appendChild(container)
	container.id = 'btn-container'
	container.appendChild(btn)
	btn.addEventListener('click', changeTheme)
	btn.type = 'button'
	btn.value = '🌓'
	btn.style.cssText = 'background-color: transparent !important; border: none; font-size: 25px; z-index: 999; position: fixed; right: 10%; bottom: 10%; font-family: segoeweb; color: #767676'
}

// function for control search manu and navbar menu display or not
// 0 for hide search-menu
// 1 for show search-menu
// 2 for close navbar-menu
function closeMenu(x) {
	const searchMenu = document.body.querySelector('#search-panel>div')
	const navbarBurger = document.body.querySelector('#navbar>div>.navbar-burger')
	const navbarToggle = document.body.querySelector('#navbar-menu')
	if (x === 0) {
		searchMenu.classList.add('is-hidden')
	} else if (x === 1) {
		searchMenu.classList.remove('is-hidden')
	} else {
		navbarBurger.classList.remove('is-active')
		navbarToggle.classList.remove('is-active')
	}
}

// add dynamic menu button on vertical device form bulma official site
for (const element of document.querySelectorAll('.navbar-burger')) {
	element.addEventListener('click', () => {
		const target = element.dataset.target
		const $target = document.getElementById(target)
		element.classList.toggle('is-active')
		$target.classList.toggle('is-active')
		closeMenu(0)
	})
}

// check search bar value to display search-menu
function checkInput() {
	closeMenu(2)
	const inputValue = document.body.querySelector('#search-panel>input').value
	render(`{% if site.i18n.l2dmessage.search %}{{ site.i18n.l2dmessage.search }}{% else %}Searching{% endif %} ${inputValue} ...`)
	if (!inputValue)
		closeMenu(0)
	else
		closeMenu(1)
}

// tap blank area to close search menu and navbar
document.body.addEventListener('click', (event) => {
	const cDom = document.querySelector('#navbar')
	const tDom = event.target
	if (!(cDom === tDom || cDom.contains(tDom))) {
		closeMenu(0)
		closeMenu(2)
	}
})

// make navbar flow on the top and progress bar
{
	const navbar = document.body.querySelector('#navbar')
	const topProcess = document.createElement('div')
	const article = document.body.querySelector('article')
	const container = document.body.querySelector('.main-container')

	const topoffset = navbar.offsetHeight
	topProcess.id = 'progress'
	topProcess.style.top = `${topoffset - topProcess.clientHeight}px`
	document.body.appendChild(topProcess)

	const articleTop = article.offsetTop
	const scrollTopExp = container.offsetTop
	document.addEventListener('scroll', () => {
		closeMenu(2)

		const thirdWindow = visualViewport.height / 3
		const articleHeight = article.clientHeight
		const scrollTopReal = document.documentElement.scrollTop
		const processValue = ((scrollTopReal - articleTop + thirdWindow) / articleHeight) * 100

		if (scrollTopReal > scrollTopExp) {
			navbar.style.position = 'fixed'
			container.style.paddingTop = `${topoffset}px`
			topProcess.style.width = (processValue > 100) ? `${100}vw` : `${processValue}vw`
			topProcess.classList.remove('is-hidden')
		} else {
			navbar.style.position = 'relative'
			container.style.paddingTop = 'unset'
			topProcess.classList.add('is-hidden')
		}
	})
}

// conversion language's brachylogy to full name

function bra2Full(language) {
	language = language.toLowerCase()
	switch (language) {
		case 'asm':
			return 'Assembly'
		case 'cpp':
		case 'c++':
			return 'C++'
		case 'cuda':
			return 'CUDA C++'
		case 'csharp':
		case 'cs':
			return 'C#'
		case 'css':
			return 'CSS'
		case 'fsharp':
			return 'F#'
		case 'hlsl':
			return 'HLSL'
		case 'html':
			return 'HTML'
		case 'javascript':
		case 'js':
			return 'JavaScript'
		case 'json':
			return 'JSON'
		case 'php':
			return 'PHP'
		case 'plaintext':
			return 'Plain Text'
		case 'powershell':
			return 'PowerShell'
		case 'sql':
			return 'SQL'
		case 'ts':
		case 'typescript':
			return 'TypeScript'
		case 'vb':
		case 'visualbasic':
			return 'Visual Basic'
		case 'xaml':
			return 'XAML'
		case 'xml':
			return 'XML'
		case 'yaml':
			return 'YAML'
		case 'yml':
			return 'YML'
		default:
			return language.toUpperCase()
	}
}

// add a button for <pre> to copy code to clipboard

for (let element of document.body.querySelectorAll('div.highlight')) {
	element = element.parentNode
	element.className = `${element.className} message is-primary mt-3 mb-0`
	element.style.borderRadius = '6px'
	const header = document.createElement('div')
	header.className = 'message-header'
	const begin = element.className.indexOf('language') + 9
	const end = element.className.indexOf(' ', begin)
	const icon = document.createElement('span')
	icon.className = 'sw sw-code is-capitalized'
	icon.setAttribute('aria-hidden', 'true')
	icon.innerText = ` ${bra2Full(element.className.substring(begin, end))}`
	header.appendChild(icon)
	const code = element.querySelector('.highlight')
	code.firstChild.style.borderRadius = '0 0 6px 6px'
	code.firstChild.style.lineHeight = '1.15em'
	code.firstChild.style.padding = '0 1.5em'
	const button = document.createElement('span')
	button.className = 'sw sw-document'
	header.appendChild(button)
	element.insertBefore(header, code)
	button.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(code.textContent.trim())
			render('{% if site.i18n.l2dmessage.copyok %}{{ site.i18n.l2dmessage.copyok }}{% else %}Copy completed!{% endif %}')
		} catch (err) {
			console.error('Failed to copy: ', err)
			render('{% if site.i18n.l2dmessage.copyfail %}{{ site.i18n.l2dmessage.copyfail }}{% else %}Failed to copy.{% endif %}')
		}
	})
}

// fix some missing place
for (let element of document.body.querySelectorAll('pre>code[class]')) {
	const code = element
	element = element.parentNode
	element.style.borderRadius = '0 0 6px 6px'
	element.style.lineHeight = '1.15em'
	element.style.padding = '0 1.5em'
	const father = document.createElement('div')
	father.className = 'message is-primary mt-3 mb-0'
	father.style.borderRadius = '6px'
	const header = document.createElement('div')
	header.className = 'message-header'
	const begin = code.className.indexOf('language') + 9
	const icon = document.createElement('span')
	icon.className = 'sw sw-code is-capitalized'
	icon.setAttribute('aria-hidden', 'true')
	icon.innerText = ` ${bra2Full(code.className.substring(begin, code.className.length))}`
	header.appendChild(icon)
	const button = document.createElement('span')
	button.className = 'sw sw-document'
	header.appendChild(button)
	father.appendChild(header)
	element.parentNode.insertBefore(father, element)
	father.appendChild(element)
	button.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(code.textContent.trim())
			render('{% if site.i18n.l2dmessage.copyok %}{{ site.i18n.l2dmessage.copyok }}{% else %}Copy completed!{% endif %}')
		} catch (err) {
			console.error('Failed to copy: ', err)
			render('{% if site.i18n.l2dmessage.copyfail %}{{ site.i18n.l2dmessage.copyfail }}{% else %}Failed to copy.{% endif %}')
		}
	})
}

// fix sina images
for (const element of document.body.querySelectorAll('.post-text img')) {
	const old = element.src
	if (old.includes('sinaimg')) {
		const url = new URL(old)
		url.protocol = 'http:'
		element.src = 'https://image.baidu.com/search/down?url=' + url.href
	}
}

// output logo to console
console.info('\n▄██╗   ███╗   ▄██████╗   ▄███████╗\n████╗ ████║   ██╔══██║   ██╔═══██║\n██╔████╔██║   ██████╔╝   ██║   ██║\n██║╚██╔╝██║   ██╔═══╝    ██║   ██║\n██║ ╚═╝ ██║██╗██║     ██╗███████╔╝██╗\n╚═╝     ╚═╝╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝\n       © 2016 - 2025 M.P.O.')
console.info('%c M.P.O. %c https://mysteriouspreserve.com ', 'color: #fff; margin: 1em 0; padding: 5px 0; background: #3298dc;', 'margin: 1em 0; padding: 5px 0; background: #efefef;')
