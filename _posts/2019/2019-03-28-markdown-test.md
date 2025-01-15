---
title: Page Test
date: "2019-03-28 21:38:00"
tags: [markdown,docs]
category: blog
---

本页用于展示本站支持的所有页内功能，不限于 Markdown 基础功能，以及一些独有扩展。

<!-- more -->

## 独有扩展

将所有 title="candark" 的图片，在黑色模式下自动翻转颜色

![M.P.O.](/assets/images/svgs/mpo.svg "candark")

将所有 title="canisdark" 的深色图片，在黑色模式下自动翻转颜色

![M.P.O.](/assets/images/svgs/mpo.svg "canisdark")

<!--
<script>
var element = document.getElementById("darkmode-css");
var stl =document.createElement('style');
document.getElementsByTagName('head')[0].appendChild(stl);
const callback = function(mutationsList, observer) {
    var x = element.getAttribute('rel');
    if(x == "stylesheet"){
        stl.textContent = '.post-text img{filter:opacity(1)!important;}';
    } else {
        stl.textContent = '';
    }
};
if(element.getAttribute('rel') == "stylesheet"){
        stl.textContent = '.post-text img{filter:opacity(1)!important;}';
}
const config = { attributes: true};
const observer = new MutationObserver(callback);
observer.observe(element, config);
</script>
-->

![M.P.O.](/assets/images/svgs/mpo.svg "M.P.O.")

# 标题H1

## 标题H2

### 标题H3

#### 标题H4

##### 标题H5

###### 标题H5

### 字符效果和横线等

---


<s>删除线</s>

*斜体字*      _斜体字_

**粗体**  __粗体__

***粗斜体*** ___粗斜体___

上标：X<sub>2</sub>，下标：O<sup>2</sup>

**缩写(同HTML的abbr标签)**
> 即更长的单词或短语的缩写形式，前提是开启识别HTML标签时，已默认开启

The <abbr title="Hyper Text Markup Language">HTML</abbr> specification is maintained by the <abbr title="World Wide Web Consortium">W3C</abbr>.
### 引用 Blockquotes

> 引用文本 Blockquotes

引用的行内混合 Blockquotes

> 引用：如果想要插入空白换行`即<br />标签`，在插入处先键入两个以上的空格然后回车即可，[普通链接](https://www.mdeditor.com/)。

### 锚点与链接 Links

[普通链接](https://mpo.moe/)

[普通链接带标题](https://mpo.moe/ "普通链接带标题")

直接链接：<https://mpo.moe>

[锚点链接][anchor-id]

[anchor-id]: https://mpo.moe/

[mailto:test.test@gmail.com](mailto:test.test@gmail.com)

### 参考链接：

[^1]

[^1]: 这里是内容

或者 [链接][2]

[2]: //baidu.com

注意，不管第一种把内容插入到哪里，永远显示在文档底部，第二种方式的内容必须为 url，并且不单独列出内容。

### 多语言代码高亮 Codes

#### 行内代码 Inline code


执行命令：`npm install marked`

#### 缩进风格

即缩进四个空格，也做为实现类似 `<pre>` 预格式化文本 ( Preformatted Text ) 的功能。

    <?php
        echo "Hello world!";
    ?>

预格式化文本：

    | First Header  | Second Header |
    | ------------- | ------------- |
    | Content Cell  | Content Cell  |
    | Content Cell  | Content Cell  |

#### JS代码
```javascript
function test() {
	console.log("Hello world!");
}
```

#### HTML 代码 HTML codes
```html
<!DOCTYPE html>
<html>
    <head>
        <mate charest="utf-8" />
        <meta name="keywords" content="Editor.md, Markdown, Editor" />
        <title>Hello world!</title>
        <style type="text/css">
            body{font-size:14px;color:#444;font-family: "Microsoft Yahei", Tahoma, "Hiragino Sans GB", Arial;background:#fff;}
            ul{list-style: none;}
            img{border:none;vertical-align: middle;}
        </style>
    </head>
    <body>
        <h1 class="text-xxl">Hello world!</h1>
        <p class="text-green">Plain text</p>
    </body>
</html>
```

### 图片 Images

图片加链接 (Image + Link)：

[![](/assets/images/svgs/mpo.svg)](/assets/images/svgs/mpo.svg"markdown")

----
### 列表 Lists

#### 无序列表（减号）Unordered Lists (-)

- 列表一
- 列表二
- 列表三

#### 无序列表（星号）Unordered Lists (*)

* 列表一
* 列表二
* 列表三

#### 无序列表（加号和嵌套）Unordered Lists (+)
+ 列表一
+ 列表二
    + 列表二-1
    + 列表二-2
    + 列表二-3
+ 列表三
    * 列表一
    * 列表二
    * 列表三

#### 有序列表 Ordered Lists (-)

1. 第一行
2. 第二行
3. 第三行

#### GFM task list

- [x] GFM task list 1
- [x] GFM task list 2
- [ ] GFM task list 3
    - [ ] GFM task list 3-1
    - [ ] GFM task list 3-2
    - [ ] GFM task list 3-3
- [ ] GFM task list 4
    - [ ] GFM task list 4-1
    - [ ] GFM task list 4-2

-------------

### 绘制表格 Tables

| 项目        | 价格   |  数量  |
| ----------: | :----- | :----: |
| 计算机      | $1600  |   5    |
| 手机        |   $12  |  12    |
| 管线        |    $1  |  234   |

First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

| Function name | Description                    |
| ------------- | ------------------------------ |
| `help()`      | Display the help window.       |
| `destroy()`   | **Destroy your computer!**     |

| Left-Aligned  | Center Aligned  | Right Aligned |
| :------------ |:---------------:| -----:|
| col 3 is      | some wordy text | $1600 |
| col 2 is      | centered        |   $12 |
| zebra stripes | are neat        |    $1 |

| Item      | Value |
| --------- | -----:|
| Computer  | $1600 |
| Phone     |   $12 |
| Pipe      |    $1 |

-------------

**表格中用作对齐的那一行的冒号表示对齐方式** 

#### 特殊符号 HTML Entities Codes

&copy; &  &uml; &trade; &iexcl; &pound;
&amp; &lt; &gt; &yen; &euro; &reg; &plusmn; &para; &sect; &brvbar; &macr; &laquo; &middot;

X&sup2; Y&sup3; &frac34; &frac14;  &times;  &divide;   &raquo;

18&ordm;C  &quot;  &apos;
