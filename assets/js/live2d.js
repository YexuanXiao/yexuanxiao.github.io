'use strict';
if (window.matchMedia('(min-width: 1024px)').matches) {
    function creatdom() {
        const l2dcontainer = document.createElement('div');
        l2dcontainer.className = 'pio-container ml-2';
        l2dcontainer.id = 'pio-container';
        document.body.appendChild(l2dcontainer);
        const talk = document.createElement('div');
        talk.classList.add('pio-action');
        l2dcontainer.appendChild(talk);
        const l2dcvs = document.createElement('canvas');
        l2dcvs.id = 'pio';
        l2dcvs.width = '220';
        l2dcvs.height = '190';
        l2dcontainer.appendChild(l2dcvs)
    }
    function initl2d() {
        creatdom();
        let live2dnoireswim = new Paul_Pio({
            "mode": "fixed",
            "hidden": true,
            "content": {
                "welcome": ["欢迎来到萧叶轩的网站", "我叫诺瓦露，是黑土边域（Lastation）的守护女神。", "这些女孩子们的服装，大多都很可爱呢。可、可不是说我想穿哦，才没有那个意思呢", "	真是优哉游哉的回来了呢，今天也还有许多事情要做，紧张起来", "哼哼哼~ ♪哼~哼♪ ······喂，你从什么时侯开始在那里的啊······", "做好心理准备了吧？"],
                "touch": ["呀······！你在摸哪里啊！", "你、这······，不注意点分寸我真的要生气了哦", "等下，现在不是吐槽的时候！"],
                "custom": [{ "selector": "#author", "text": "想了解我的主人吗" },
                { "selector": "#comments", "text": "有任何意见都可以提出哦" },
                { "selector": "#darkmode-btn", "text": "夜间点击这里可以保护眼睛呢" },
                { "selector": "#musicbox", "text": "想听音乐吗？" },
                { "selector": "#search-panel", "text": "在这里可以搜索文章！" },
                { "selector": ".about", "text": "这是属于我们的故事！" },
                { "selector": "#tagbox", "text": "想通过标签寻找文章吗" },
                { "selector": "#postbox", "text": "想阅读更多文章吗" },
                { "selector": "#friends", "text": "想和我们成为朋友吗" },
                { "selector": ".post-text a", "type": "read" },
                { "selector": ".post-link h3", "type": "link" },
                { "selector": "article h1", "type": "link" }
                ]
            },
            "button": {
                "info": true,
                "close": true
            },
            "night": "changeTheme('darktheme')",
            "model": ["//imuncle.github.io/live2d/model/HyperdimensionNeptunia/noireswim/index.json"],
            "tips": true
        })
    }
    loadScript('//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/l2d.min.js', () => {
        loadScript('//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/pio.js', () => {
            initl2d()
        })
    })
    loadStyles('//cdn.jsdelivr.net/gh/YexuanXiao/Pio@master/static/pio.css')
};
window.addEventListener('resize', () => {
    const container = document.getElementById('pio-container');
    if (container) {
        if (window.matchMedia('(max-width: 1024px)').matches) {
            container.style.display = 'none'
        } else {
            container.style.display = 'block'
        }
    }
});