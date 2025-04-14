---
date: "2020-01-14 12:30"
update: "2020-09-15 01:43"
title: Markdown 内嵌 HTML
category: blog
tags: [markdown,Windows,docs]
---

<!-- more -->

### 使用过程需要注意的问题

<br>

| 注意事项 | 否则 |
| :-------: | :---: |
| 必须使用较严格的 HTML |
| 元素必须被正确嵌套 | 标签被转义 |
| 非空元素必须被正确的关闭 | 标签被转义 |
| 属性的值必须使用引号 | 标签被转义 |
|  |  |
| 不要有多余的起始/结束标签 | 排版混乱 |
| 不要让空标签出现在行末 | 标签被忽略 |
| 空标签后需添加换行 | 下一行被忽略 |
| 统一代码缩进方式 | 排版混乱 |
| 段与段之间需要2个换行 | 行与行粘连 |
| 特殊字符和 HTML 标签使用转义符 | 当作元素 |
| 首行缩进使用 &amp;emsp; | 不显示缩进 |

<br>

### 常用 HTML 标签

<br>

<del> 删除线</del>

<ins>下划线</ins>

<cite>引用</cite> (斜体)

<abbr title="缩写内容">缩写</abbr>

<q>短语引用</q> （不换行）

<blockquote>段落引用</blockquote> (换行)

<pre>
<code>
代码引用
</code>
</pre>

分隔线
<hr>

<i>斜体</i>

	有序列表 (<ol>) 无序列表 (<ul>)

页面导航链接
<nav>
<a href="/html/">HTML</a> |
<a href="/css/">CSS</a> |
<a href="/js/">JavaScript</a> |
<a href="/jquery/">jQuery</a>
</nav>

上下角标

H<sub>2</sub>O
x<sup>n</sup>


```html

<del> 删除线</del>

<ins>下划线</ins>

<cite>引用</cite> (斜体)

<abbr title="缩写内容">缩写</abbr>

<q>短语引用</q> （不换行）

<blockquote>段落引用</blockquote> (换行)

代码引用
<code>
<pre>

分隔线
<hr>

<i>斜体</i>

有序列表 (<ol>) 无序列表 (<ul>)

页面导航
<nav>
<a href="/html/">HTML</a> |
<a href="/css/">CSS</a> |
<a href="/js/">JavaScript</a> |
<a href="/jquery/">jQuery</a>
</nav>

上下角标

H<sub>2</sub>O
x<sup>n</sup>

```

<br><br>

### Markdown 语法范例

参见 [Page Test](/blog/2019/03/28/markdown-test/)





