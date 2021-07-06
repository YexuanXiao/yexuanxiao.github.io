---
layout: post
title: 给你的博客加一个看板娘
date: "2021-06-14 12:30:00"
tags: [live2d, JavaScript, docs]
categories: [blog]
---

　　以前就有给博客添加一个 live2d 看板娘的想法，但没有实施，直到发现了好看的模型和项目。

<!-- more -->

　　项目地址：[Pio](https://github.com/Dreamer-Paul/Pio)

　　模型地址：[model](https://github.com/imuncle/live2d)

　　这个网站可以实时看对应的模型效果：[live demo](https://github.com/imuncle/live2d)。

　　我之所以选择 Pio 是因为 Pio 使用了原生 JS，没有其他依赖，方便修改。

　　在你的网站上使用 `live2d` 只需要简单几步：

1. 选择合适模型并得到模型配置文件地址，大部分配置文件的文件名为 `model.json` `index.json`。
2. 在你的网站插入如下 `html` 片段，本人建议插入为 `body` 的最后一个子元素，且不能插入到 head：

    ```html

    <script async>
        if (window.matchMedia('(min-width: 1024px)').matches) {
            function loadStyles(url) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = url;
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            function loadScript(uri, callback) {
                var fileref = document.createElement('script');
                fileref.src = uri;
                callback = callback || function () { };
                fileref.onload = function () {
                    if (!this.readState || 'loaded' === this.readyState || 'complete' === this.readyState) {
                        callback();
                        this.onload = null;
                    }
                }
                document.body.appendChild(fileref);
            }
            creatdom = function () {
                var l2dcontainer = document.createElement('div');
                l2dcontainer.className = 'pio-container';
                l2dcontainer.id = 'pio-container';
                document.body.appendChild(l2dcontainer);
                var talk = document.createElement('div');
                talk.className = "pio-action";
                l2dcontainer.appendChild(talk);
                var l2dcvs = document.createElement('canvas');
                l2dcvs.id = 'pio';
                l2dcvs.width = '220';
                l2dcvs.height = '190';
                l2dcontainer.appendChild(l2dcvs);
            }
            initl2d = function () {
                creatdom();
                var live2dnoireswim = new Paul_Pio({
                    "mode": "fixed",
                    "hidden": true,
                    "content": {
                        "welcome": ["欢迎来到萧叶轩的网站", "我叫诺瓦露，是黑土边域（Lastation）的守护女神。", "这些女孩子们的服装，大多都很可爱呢。可、可不是说我想穿哦，才没有那个意思呢", "	真是优哉游哉的回来了呢，今天也还有许多事情要做，紧张起来", "哼哼哼~ ♪哼~哼♪ ······喂，你从什么时侯开始在那里的啊······", "做好心理准备了吧？"],
                        "touch": ["呀······！你在摸哪里啊！", "你、这······，不注意点分寸我真的要生气了哦", "等下，现在不是吐槽的时候！"],
                        "custom": [
                            { "selector": "#author", "text": "想了解我的主人吗" },
                            { "selector": "#comment", "text": "有任何意见都可以提出哦" },
                            { "selector": "#darkmode-btn", "text": "夜间点击这里可以保护眼睛呢" },
                            { "selector": "#musicbox", "text": "想听音乐吗？" },
                            { "selector": ".about", "text": "这是属于我们的故事！" },
                            { "selector": "#tagbox", "text": "想通过标签寻找文章吗" },
                            { "selector": "#postbox", "text": "想阅读更多文章吗" },
                            { "selector": "#friends", "text": "想和我们成为朋友吗" },
                            { "selector": "article", "type": "read" },
                            { "selector": ".post-text a", "type": "link" }
                        ]
                    },
                    "night": "changeTheme('darktheme')",
                    "model": ["//imuncle.github.io/live2d/model/HyperdimensionNeptunia/noireswim/index.json"]
                });
            }
            loadScript('//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/l2d.js', function () {
                loadScript('//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/pio.js', function () {
                    initl2d();
                });
            })
            loadStyles("//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/pio.css")
        };
        window.addEventListener('resize', () => {
            if (window.matchMedia('(max-width: 1024px)').matches) {
                document.getElementById('pio-container').style.display = 'none';
            } else {
                document.getElementById('pio-container').style.display = 'block';
            }
        });
    </script>

    ````

3. 这些代码实际上做了几件事:
    1. 判断设备宽度是否大于 1024，大于 1024 时开启 live2d
    2. `load` 函数：动态顺序加载 js 和 css
    3. `creatdom` 函数：建立 dom 节点作为容器
    4. `initl2d` 函数：调用 `creatdom` 并创建 live2d 实例
    5. 调用 `loadScript` 依次加载两个 js 文件并调用 initl2d
    6. 调用 `loadStyles` 加载 style
    7. 监听媒体事件，设备宽度小于 1024 时隐藏 live2d

4. 你只需要修改模型链接即可完成最基本的功能
5. 你可以 修改 `initl2d` 创建的 `live2dnoireswim` 实例中的 json 配置文件自定义对话
6. 在 `creatdom` 函数中你可以修改 `l2dcvs.width` 和 `l2dcvs.height` 的值来修改看板娘的默认大小
7. `"changeTheme('darktheme')"` 是开启夜间模式用的函数，如果你不知道这是干什么的，或者不支持夜间模式，可以把引号中的内容删除

　　由于该写的东西我已经写好了，所以你只需要插入这个 `script` 和配置 live2d 就行，Pio 提供了一些文档。

　　如果你是按照本文来添加看板娘的话，可以直接访问 Pio 文档的 [参数](https://docs.paul.ren/pio/#/?id=%e5%8f%82%e6%95%b0) 部分，或者你想搞清楚我这些函数都干了些什么，也可以看整个文档。

　　虽然上面的代码是为本站服务的，但是我已经把所有需要的代码写在上面，所以你不用担心缺少依赖。

　　本项目内加载的代码是我修改过的，我在原项目的基础上添加了一些额外的功能，可以看我的仓库查看区别：[Pio](https://github.com/YexuanXiao/Pio)。

　　为了优化性能所以我写了上面的代码，如果你不考虑性能或者其他的东西，可以直接参考官方文档。

　　如果有什么问题，可以问我或者 Pio 的作者。

　　由于 Pio 使用了 GPL ，为了防止 GPL 污染，所以本项目不能直接添加 Pio 的代码。上面的代码动态加载了 Pio，并且是从我 fork 后的仓库通过 cdn 完成的，此时 GPL 不生效。