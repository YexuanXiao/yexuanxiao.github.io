---
title: 给你的博客加一个进度条
date: "2020-07-10 01:00:00"
update: "2021-06-26 18:57:00"
tags: [JavaScript, CSS]
category: blog
---
之前就在其他人的博客上看到了进度条这个功能，由于互联网上并没有可以用的文章，所以我便自己写了一个。

我使用了 `<div>` 来模拟进度条，控制长度来改变进度，并且左对齐。

<!-- more -->

```css

#progress {
	position: fixed;
	left: 0px;
	top: 0px
	height: 2px;
	background: #00D3B2;
	transition: 100ms;
	z-index: 200;
}

```

```javascript

(() => {
    const postText = document.body.querySelector('article');// 选择文章部分
    const topProcess = document.createElement('div');// 创建进度条元素
    const halfWindow = window.screen.height / 3;// 计算 1/3 的窗口高度
    const articleHeight = postText.clientHeight;// 获得文章长度
    topProcess.id = 'progress';// 设置id
    document.body.appendChild(topProcess);// 添加进度条到body
    document.addEventListener('scroll', () => {// 监听滚动事件
        let postTextTop = postText.offsetTop;// 获得文章滚动高度
        let scrollTopReal = document.documentElement.scrollTop || document.body.scrollTop;// 获得页面滚动高度
        let processValue = ((halfWindow + scrollTopReal - postTextTop) / articleHeight) * 100;// 计算进度条百分比
        topProcess.style.width = (processValue > 100) ? `${100}%` : `${processValue}%`// 设置百分比
    })
})();

```
