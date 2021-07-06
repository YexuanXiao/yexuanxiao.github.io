---
layout: post
title: 给你的 Jekyll 加一个站内搜索
date: "2020-05-11 14:37:00"
tags: [JavaScript,CSS,docs]
categories: [blog]
---

　　由于博客之前一种在使用 JS 将文本框输入的值提交给 Bing 来实现搜索，但是 Bing 提交页面实在太慢，收录了一堆没有用的东西，所以我就打算添加一个站内搜索。

<!-- more -->

　　有一个现成的插件 [Jekyll-Search](https://github.com/androiddevelop/jekyll-search)，有着不错的效果。

　　但是这个插件的使用方式是提供一个搜索按钮打开搜索框，页面内本无搜索框，而我又希望保留搜索框，所以我对他的实现做了兼容。

　　所以我需要修改以下以使页面内搜索框中的内容能传递到 jekyll-search的搜索框。

　　以下是经过我修改的使用方式。

1. 克隆这个 Github 仓库 https://github.com/androiddevelop/jekyll-search
2. 将search目录放至于博客根目录下，其中search目录结构如下:

		search
		├── cb-footer-add.html
		├── cb-search.json
		├── css
		│   └── cb-search.css
		├── img
		│   ├── cb-close.png
		│   └── cb-search.png
		└── js
		    ├── bootstrap3-typeahead.min.js
		    └── cb-search.js
			
3. 由于我们是在现有的搜索框和搜索按钮上对这个插件进行兼容，所以我们并不需要所有文件，也不完全按照原作者提供的方法。
   所以我们不需要 cb-search.png，cb-footer-add.html，可以删去。
4. 在 _includes 文件夹创建 cb-footer-add.html ，内容如下
    ```html
    <link rel="stylesheet" href="//cdn.bootcss.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="//cdn.bootcss.com/jquery/2.2.2/jquery.min.js"></script>
    <script src="//cdn.bootcss.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
    <script src="/search/cb-search.js"></script>
    <div class="cb-search-tool" style="position: fixed; top: 0px ; bottom: 0px; left: 0px; right:  0px;
          opacity: 0.95; background-color: #111111; z-index: 9999; display: none;">
        <input type="search" class="form-control cb-search-content" id="cb-search-content" style="position: fixed; top: 60px" placeholder="标题 日期 标签" >
	
        <div style="position: fixed; top: 16px; right: 16px;">
            <img src="/search/img/cb-close.png"  id="cb-close-btn"/>
        </div>
    </div>
    ```
5. 在 index.html 或者 default.xml 等网站必须包含的 html 文件的合适位置添加 &#123;% include cb-footer-add.html %&#125;
6. 将你网站已有的搜索按钮的 id 改为 `cb-search-btn`,搜索框 id 改为 `search-text`。
7. 在 cb-search.js 结尾中加入如下方法
    ```javascript
    function addValue(){
    	inputValue = document.getElementById("search-text").value;//获得value
    	if(inputValue == null) {
    	}
    	else {
    	document.getElementById("cb-search-content").value = inputValue;//传递value
    	$("input").keyup();//触发keyup事件
    	document.getElementById('search-text')[0].removeAttribute("value");//清空旧value
    	}
    }
    ```
8. 在 cb-search.js 找到这一段
    ```javascript
        $("#cb-search-btn").click(function () {
            $(".cb-search-tool").css("display", "block");
            show = true;
            $("#cb-search-content").val("");
            $("#cb-search-content").focus();
            time1 = 0;
        });
    ```
    在 `time1 = 0;` 下一行添加 `addValue();`

　　即可实现搜索并且保留页面内原有搜索框。
	
	
<br><br><br>

　　由于 jekyll-search 使用了 jquery 和 bootstrap3，太大了。

　　所以如果你的博客没有使用他们，并且在意网站访问速度，可以采用动态加载的方法。

　　在第四步换成

```html
<div class="cb-search-tool" style="position: fixed; top: 0px ; bottom: 0px; left: 0px; right:  0px;
      opacity: 0.95; background-color: #111111; z-index: 9999; display: none;">
    <input type="search" class="form-control cb-search-content" id="cb-search-content" style="position: fixed; top: 60px" placeholder="标题 日期 标签" >
	
    <div style="position: fixed; top: 16px; right: 16px;">
        <img src="/search/img/cb-close.png"  id="cb-close-btn"/>
    </div>
</div>
```

　　给你的搜索框搜索框 `search-text` 添加 `oninput="loadSearchRes()` 属性

　　在第七步的基础上再在 cb-search.js 结尾中加入如下方法

```javascript
function loadStyles(url) {
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = url;
	document.getElementsByTagName('head')[0].appendChild(link);
}

function loadScript(url) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	script.defer = 'defer';
	document.getElementsByTagName('head')[0].appendChild(script);
}

function loadSearchRes(){
	loadStyles("/search/css/cb-search.css");
	loadScript("/search/js/cb-search.js");
	loadSearchRes = function(){};
}
```

　　你需要下载 https://cdn.bootcss.com/bootstrap/3.3.6/css/bootstrap.min.css ，并且将其中的内容粘贴到 `cb-search.css`的内容的前面

　　你需要下载 https://cdn.bootcss.com/jquery/2.2.2/jquery.min.js，https://cdn.bootcss.com/bootstrap/3.3.6/js/bootstrap.min.js 并且按顺序将其中的内容粘贴到 `cb-search.js`的内容的前面

　　其余步骤一致。
