---
title: 使用 Operator Mono 作为 VSCode 字体
date: "2021-05-24 17:38:00"
tags: [VSCode,docs]
category: blog
---

虽然我挺喜欢微软雅黑的，不过看久了也想找点新奇的东西，于是便有了这篇文章。

<!-- more -->

方案来自：[Font](https://github.com/beichensky/Font)

1. 下载 [Operator Mono](https://github.com/beichensky/Font/tree/master/Operator%20Mono) 中的字体并安装。
2. 在 VSCode 中按 Ctrl+Shift+P 打开命令面板，搜索 首选项: 打开设置 (json)，并点击打开。
3. 在最外层大括号中加入如下内容（注意在json中，列表的最后一项没有逗号），重启 VSCode 即可：

```json

"editor.fontFamily": "Operator Mono",
"editor.fontLigatures": true, // 这个控制是否启用字体连字
"editor.tokenColorCustomizations": {
    "textMateRules": [
        {
            "name": "italic font",
            "scope": [
                "comment",
                "keyword",
                "storage",
                "keyword.control.import",
                "keyword.control.default",
                "keyword.control.from",
                "keyword.operator.new",
                "keyword.control.export",
                "keyword.control.flow",
                "storage.type.class",
                "storage.type.function",
                "storage.type",
                "storage.type.class",
                "variable.language",
                "variable.language.super",
                "variable.language.this",
                "meta.class",
                "meta.var.expr",
                "constant.language.null",
                "support.type.primitive",
                "entity.name.method.js",
                "entity.other.attribute-name",
                "punctuation.definition.comment",
                "text.html.basic entity.other.attribute-name.html",
                "text.html.basic entity.other.attribute-name",
                "tag.decorator.js entity.name.tag.js",
                "tag.decorator.js punctuation.definition.tag.js",
                "source.js constant.other.object.key.js string.unquoted.label.js",
            ],
            "settings": {
                "fontStyle": "italic",
            }
        },
    ]
},
"terminal.integrated.fontFamily": "monospace",
"editor.fontWeight": 400,
"workbench.colorTheme": "Bluloco Light",

```
