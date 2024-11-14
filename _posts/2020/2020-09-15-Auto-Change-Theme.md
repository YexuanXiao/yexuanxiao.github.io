---
title: JavaScript 监听主题切换动作
date: "2020-09-15 00:19:00"
tags: [JavaScript,docs]
category: blog
---
目前本站支持了新增的暗黑模式特性，并支持手动控制主题，自动检测主题，以及定时开启主题。不过并不能相应浏览器的主题切换。

<!-- more -->

方案来自 [HARN](https://get233.com/archives/support-macOS-dark-mode-in-safari-web.html)

经过我一番修改，核心代码如下：

```javascript

let media = window.matchMedia('(prefers-color-scheme: dark)');
let prefersDarkMode = media.matches;
let callback = (e) => {
    let prefersDarkMode = e.matches;
        if (media.matches) {
            applyTheme ("dark-theme");//应用深色主题
        } else {
            applyTheme ("default-theme");//应用浅色主题
        }
};
if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', callback);
} else if (typeof media.addListener === 'function') {
    media.addListener(callback);
}

```