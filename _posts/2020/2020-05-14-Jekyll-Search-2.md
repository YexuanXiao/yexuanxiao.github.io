---
layout: post
title: 给你的 Jekyll 加一个站内搜索 2
date: "2020-05-14 10:15:00"
tags: [JavaScript,CSS,Jekyll,docs]
categories: [blog]
---

　　使用 Simple-Jekyll-Search 为你的 Jekyll 博客添加站内搜索。

<!-- more -->

　　如前文所述，Jekyll-Search 使用了 jQuery 和 BootStrap，需要很多额外的 js 库，所以我又找到了一个更简单的搜索实现方法 Simple-Jekyll-Search。

　　项目地址：https://github.com/christian-fei/Simple-Jekyll-Search

　　我在该项目基础上进行了一些修改，修复了一个bug，美化了一下样式。

　　js+css 实现无文字时自动隐藏列表，移动设备自动展开列表，效果参考左上角。

　　JS 部分：

```javascript
/*
 * Simple-Jekyll-Search v1.7.5
 * Copyright 2015-2020 Christian Fei
 * Copyright 2020 YexuanXiao
 * Licensed under the MIT License.
 */
 (function() {
    'use strict'
    var _$Templater_7 = {
        compile: compile,
        setOptions: setOptions
    }
    var options = {}
    options.pattern = /\{(.*?)\}/g
    options.template = ''
    options.middleware = function() {}
    function setOptions(_options) {
        options.pattern = _options.pattern || options.pattern
        options.template = _options.template || options.template
        if (typeof _options.middleware === 'function') {
            options.middleware = _options.middleware
        }
    }
    function compile(data) {
        return options.template.replace(options.pattern, function(match, prop) {
            var value = options.middleware(prop, data[prop], options.template)
            if (typeof value !== 'undefined') {
                return value
            }
            return data[prop] || match
        })
    }
    'use strict';
    function fuzzysearch(needle, haystack) {
        var tlen = haystack.length;
        var qlen = needle.length;
        if (qlen > tlen) {
            return false;
        }
        if (qlen === tlen) {
            return needle === haystack;
        }
        outer: for (var i = 0, j = 0; i < qlen; i++) {
            var nch = needle.charCodeAt(i);
            while (j < tlen) {
                if (haystack.charCodeAt(j++) === nch) {
                    continue outer;
                }
            }
            return false;
        }
        return true;
    }
    var _$fuzzysearch_1 = fuzzysearch;
    'use strict'
    /* removed: var _$fuzzysearch_1 = require('fuzzysearch') */
    ;
    var _$FuzzySearchStrategy_5 = new FuzzySearchStrategy()
    function FuzzySearchStrategy() {
        this.matches = function(string, crit) {
            return _$fuzzysearch_1(crit.toLowerCase(), string.toLowerCase())
        }
    }
    'use strict'
    var _$LiteralSearchStrategy_6 = new LiteralSearchStrategy()
    function LiteralSearchStrategy() {
        this.matches = function(str, crit) {
            if (!str) return false
            str = str.trim().toLowerCase()
            crit = crit.trim().toLowerCase()
            return crit.split(' ').filter(function(word) {
                return str.indexOf(word) >= 0
            }).length === crit.split(' ').length
        }
    }
    'use strict'
    var _$Repository_4 = {
        put: put,
        clear: clear,
        search: search,
        setOptions: __setOptions_4
    }
    /* removed: var _$FuzzySearchStrategy_5 = require('./SearchStrategies/FuzzySearchStrategy') */
    ;
    /* removed: var _$LiteralSearchStrategy_6 = require('./SearchStrategies/LiteralSearchStrategy') */
    ;
    function NoSort() {
        return 0
    }
    var data = []
    var opt = {}
    opt.fuzzy = false
    opt.limit = 10
    opt.searchStrategy = opt.fuzzy ? _$FuzzySearchStrategy_5 : _$LiteralSearchStrategy_6
    opt.sort = NoSort
    function put(data) {
        if (isObject(data)) {
            return addObject(data)
        }
        if (isArray(data)) {
            return addArray(data)
        }
        return undefined
    }
    function clear() {
        data.length = 0
        return data
    }
    function isObject(obj) {
        return Boolean(obj) && Object.prototype.toString.call(obj) === '[object Object]'
    }
    function isArray(obj) {
        return Boolean(obj) && Object.prototype.toString.call(obj) === '[object Array]'
    }
    function addObject(_data) {
        data.push(_data)
        return data
    }
    function addArray(_data) {
        var added = []
        clear()
        for (var i = 0, len = _data.length; i < len; i++) {
            if (isObject(_data[i])) {
                added.push(addObject(_data[i]))
            }
        }
        return added
    }
    function search(crit) {
        if (!crit) {
            return []
        }
        return findMatches(data, crit, opt.searchStrategy, opt).sort(opt.sort)
    }
    function __setOptions_4(_opt) {
        opt = _opt || {}
        opt.fuzzy = _opt.fuzzy || false
        opt.limit = _opt.limit || 10
        opt.searchStrategy = _opt.fuzzy ? _$FuzzySearchStrategy_5 : _$LiteralSearchStrategy_6
        opt.sort = _opt.sort || NoSort
    }
    function findMatches(data, crit, strategy, opt) {
        var matches = []
        for (var i = 0; i < data.length && matches.length < opt.limit; i++) {
            var match = findMatchesInObject(data[i], crit, strategy, opt)
            if (match) {
                matches.push(match)
            }
        }
        return matches
    }
    function findMatchesInObject(obj, crit, strategy, opt) {
        for (var key in obj) {
            if (!isExcluded(obj[key], opt.exclude) && strategy.matches(obj[key], crit)) {
                return obj
            }
        }
    }
    function isExcluded(term, excludedTerms) {
        var excluded = false
        excludedTerms = excludedTerms || []
        for (var i = 0, len = excludedTerms.length; i < len; i++) {
            var excludedTerm = excludedTerms[i]
            if (!excluded && new RegExp(term).test(excludedTerm)) {
                excluded = true
            }
        }
        return excluded
    }
    /* globals ActiveXObject:false */
    'use strict'
    var _$JSONLoader_2 = {
        load: load
    }
    function load(location, callback) {
        var xhr = getXHR()
        xhr.open('GET', location, true)
        xhr.onreadystatechange = createStateChangeListener(xhr, callback)
        xhr.send()
    }
    function createStateChangeListener(xhr, callback) {
        return function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    callback(null, JSON.parse(xhr.responseText))
                } catch (err) {
                    callback(err, null)
                }
            }
        }
    }
    function getXHR() {
        return window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP')
    }
    'use strict'
    var _$OptionsValidator_3 = function OptionsValidator(params) {
        if (!validateParams(params)) {
            throw new Error('-- OptionsValidator: required options missing')
        }
        if (!(this instanceof OptionsValidator)) {
            return new OptionsValidator(params)
        }
        var requiredOptions = params.required
        this.getRequiredOptions = function() {
            return requiredOptions
        }
        this.validate = function(parameters) {
            var errors = []
            requiredOptions.forEach(function(requiredOptionName) {
                if (typeof parameters[requiredOptionName] === 'undefined') {
                    errors.push(requiredOptionName)
                }
            })
            return errors
        }
        function validateParams(params) {
            if (!params) {
                return false
            }
            return typeof params.required !== 'undefined' && params.required instanceof Array
        }
    }
    'use strict'
    var _$utils_9 = {
        merge: merge,
        isJSON: isJSON
    }
    function merge(defaultParams, mergeParams) {
        var mergedOptions = {}
        for (var option in defaultParams) {
            mergedOptions[option] = defaultParams[option]
            if (typeof mergeParams[option] !== 'undefined') {
                mergedOptions[option] = mergeParams[option]
            }
        }
        return mergedOptions
    }
    function isJSON(json) {
        try {
            if (json instanceof Object && JSON.parse(JSON.stringify(json))) {
                return true
            }
            return false
        } catch (err) {
            return false
        }
    }
    var _$src_8 = {};
    (function(window) {
        'use strict'
        var options = {
            searchInput: null,
            resultsContainer: null,
            json: [],
            success: Function.prototype,
            searchResultTemplate: '<li class="menu-list" style="margin: .3em 1em 0 1em !important"><a href="{url}">{title}</a></li>',
            templateMiddleware: Function.prototype,
            sortMiddleware: function() {
                return 0
            },
            noResultsText: 'No results found',
            limit: 10,
            fuzzy: false,
            exclude: []
        }
        var requiredOptions = ['searchInput', 'resultsContainer', 'json']
        /* removed: var _$Templater_7 = require('./Templater') */
        ;
        /* removed: var _$Repository_4 = require('./Repository') */
        ;
        /* removed: var _$JSONLoader_2 = require('./JSONLoader') */
        ;
        var optionsValidator = _$OptionsValidator_3({
                required: requiredOptions
            })
            /* removed: var _$utils_9 = require('./utils') */
        ;
        var simpleJekyllSearch = function(_options) {
            var errors = optionsValidator.validate(_options)
            if (errors.length > 0) {
                throwError('You must specify the following required options: ' + requiredOptions)
            }
            options = _$utils_9.merge(options, _options)
            _$Templater_7.setOptions({
                template: options.searchResultTemplate,
                middleware: options.templateMiddleware
            })
            _$Repository_4.setOptions({
                fuzzy: options.fuzzy,
                limit: options.limit,
                sort: options.sortMiddleware
            })
            if (_$utils_9.isJSON(options.json)) {
                initWithJSON(options.json)
            } else {
                initWithURL(options.json)
            }
            return {
                search: search
            }
        }
        window.SimpleJekyllSearch = function(_options) {
            var search = simpleJekyllSearch(_options)
            options.success.call(search)
            return search
        }
        function initWithJSON(json) {
            _$Repository_4.put(json)
            registerInput()
        }
        function initWithURL(url) {
            _$JSONLoader_2.load(url, function(err, json) {
                if (err) {
                    throwError('failed to get JSON (' + url + ')')
                }
                initWithJSON(json)
            })
        }
        function emptyResultsContainer() {
            options.resultsContainer.innerHTML = ''
        }
        function appendToResultsContainer(text) {
            options.resultsContainer.innerHTML += text
        }
        function registerInput() {
            options.searchInput.addEventListener('keyup', function(e) {
                if (isWhitelistedKey(e.which)) {
                    emptyResultsContainer()
                    search(e.target.value)
                }
            })
        }
        function search(query) {
            if (isValidQuery(query)) {
                emptyResultsContainer()
                render(_$Repository_4.search(query), query)
            }
        }
        function render(results, query) {
            var len = results.length;
			document.getElementById('search-menu').removeAttribute("style");
            if (len === 0) {
                var child = document.createElement("li");
                var element = document.getElementById("results-container");
                element.appendChild(child);
                child.setAttribute('class', 'menu-list');
                document.getElementsByClassName('menu-list')[0].innerHTML = options.noResultsText;
            }
            for (var i = 0; i < len; i++) {
                results[i].query = query
                appendToResultsContainer(_$Templater_7.compile(results[i]))
            }
        }
        function isValidQuery(query) {
            return query && query.length > 0
        }
        function isWhitelistedKey(key) {
            return [13, 16, 20, 37, 38, 39, 40, 91].indexOf(key) === -1
        }
        function throwError(message) {
            throw new Error('SimpleJekyllSearch --- ' + message)
        }
    })(window)
}());

var sjs = SimpleJekyllSearch({
    searchInput: document.getElementById('search-text'), //定义搜索框
    resultsContainer: document.getElementById('results-container'),
    json: '/assets/search.json' //定义json位置
})

/*
 * Copyright 2016 - 2020 YexuanXiao
 * Licensed under the MIT License.
 */
// 自动控制搜索结果菜单隐藏与显示

document.getElementById('search-menu').style.setProperty('display', 'none')
function checkInput() {
    var inputValue = document.getElementById("search-text").value;
    var searchMenu = document.getElementById('search-menu');
    if (inputValue == "" || inputValue == null || inputValue == undefined) {
        searchMenu.style.display = "none";
    } else {
        searchMenu.style.display = "block";
    }
}
// 空白处单击隐藏菜单
document.addEventListener("click", event => {
	var cDom = document.querySelector("#search-panel");
	var tDom = event.target;
	var searchMenu = document.getElementById('search-menu');
	if (cDom == tDom || cDom.contains(tDom)) {
	} else {
		searchMenu.style.display = "none";
	}
});

```

　　HTML 部分：

```html
<div class="panel-block" style="border:none">
	<span class="control" id="search-panel">
		<input class="input is-small is-primary is-info" type="text" placeholder="Find an article"
		id="search-text" onkeyup="checkInput()">
		<aside id="search-menu" class="menu">
			<div class="menu-lebal">
				<ul id="results-container">
				</ul>
			</div>
		</aside>
	</span>
</div>
```

　　CSS 部分：

```css
#search-menu {
	position:absolute;
	background:white;
	border-left:1px solid #dbdbdb;
	border-bottom:1px solid #dbdbdb;
	border-right:1px solid #dbdbdb;
	border-radius:0 0 3px 3px;
	padding:0 !important;
	padding:0 .5em 0 .5em;
}
#search-panel {
	min-width:12em;
	max-width:25em;
	position:relative;
	display:block;
}
.menu-list {
	font-size:1em !important;
	text-align:left !important;
	margin:0 .5em 0 .5em !important;
	white-space:nowrap;
}
#results-container {
	padding:0 0 .5em 0;
}
@media screen and (max-width:768px) {
	#search-menu {
	left:0;
	right:0;
}
#search-panel {
	position:initial;
}
```
　　JSON 部分

　　将该 json 放入任意静态文件夹，并且修改 js 部分注释位置的定义 json 位置，引入 CSS, HTML, JS 即可实现搜索，注意 CSS 样式的覆盖。

```json
{% raw %}
---
layout: null
---
[
  {% for post in site.posts %} {
      "title"    : "{{ post.title | escape }}",
      "category" : "{{ post.categories }}",
      "tags"     : "{{ post.tags | join: ', ' }}",
      "url"      : "{{ site.baseurl }}{{ post.url }}",
      "date"     : "{{ post.date }}",
      "content"  : "{{ post.excerpt | strip_html | escape | strip_newlines | remove: "　　" }}"
    } {% unless forloop.last %},{% endunless %}{% endfor %} 
]
{% endraw %}

```