---
title: JS 中 Attribute 和 Property
date: "2020-05-15 09:34:00"
tags: [JavaScript,docs]
category: blog
---

property 和 attribute 非常容易混淆，网络上常常不区分二者。

但实际上，在 HTML 中，二者是不同的东西。

<!-- more -->

property 是 DOM 中的属性，JavaScript 的对象；

attribute 是 HTML 标签上的属性。

具体的信息可以参考 w3c 的文档，在这里针对实际操作层面进行一下概括。

1. HTML 元素有些自带属性，这些属性对于 property 和 attribute 是等效的。
2. attribute 会在 HTML 中体现出来，而 property 不会。
3. 有些自带属性 property 和 attribute 不共有，比如 Safari 中，`<link>` 的 `disabled` 就只是 property。
4. 修改 attribute 使用 `element.setAttribute(name,value)`。
5. 修改 property 使用 `element.propertyName = value` 或者 `element.style.styleName = value`。
6. 对于大部分自带属性，attribute 被修改后，property 会从 attribute 同步；而 attribute 不会同步被修改的 property。
7. 对于自己定义的属性，attribute 和 property 各自独立。
8. getAttribute 在有些浏览器可能会获取到 property 。
9. property 不限定值的类型，attribute 赋值类型只能是字符串。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/style">
样式
</a>
<a href="https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLLinkElement">
&lt;link&gt; 元素
</a>
<a href="https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLBodyElement">
&lt;body&gt; 元素
</a>
</div>