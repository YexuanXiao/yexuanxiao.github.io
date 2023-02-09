---
layout: post
title: 已经看过的动画列表
date: "2021-11-19 22:59:00"
permalink: /anime/
tags: [memories, anime, life]
categories: [by-talk]
---

这是一个记录本人看过的动画的列表，列表顺序和观看顺序无关，添加顺序和观看顺序无关，列出项仅代表完整看过，比较不喜欢的不会列出，列出不代表推荐，系列作品会依据主要角色相关性进行切割，否则视为同一作品，仅考虑 2000 年之后的动画。

<!-- more -->

<script>
{
    const txtFile = new XMLHttpRequest()
    txtFile.open('GET', 'https://cdn.jsdelivr.net/gh/YexuanXiao/Sundry@master/list.html', true)
    txtFile.onreadystatechange = () => {
        if (txtFile.readyState === 4) {
            if (txtFile.status === 200) {
                let container = document.body.querySelector('.post-text p').parentNode
                container.insertAdjacentHTML('beforeend', txtFile.responseText)
                let count = document.createElement('p')
                count.classList = 'right'
                count.textContent = `共计 ${document.body.querySelectorAll('article li').length} 部动画。`
                container.appendChild(count)
                document.querySelector(".is-justify-content-space-between>.mr-4").textContent = `字数统计：${document.querySelector("article").textContent.length}`
            }
        }
    }
    txtFile.send(null)
}
</script>