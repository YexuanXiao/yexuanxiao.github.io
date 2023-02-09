---
layout: post
title: TDM-GCC 和 VS Code C++ 开发环境
date: "2020-07-14 12:33:00"
tags: [Windows,VSCode,C++,GCC,docs]
categories: [blog]
---
之前重装了系统，需要重新搭建开发环境，今天正好记录一下。

<!-- more -->

* toc
{:toc}

## 安装软件

### VS Code

首先去宇宙无敌 IDE [Visual Studio Code](https://code.visualstudio.com/) 官网下载 VSCode。

![2020-07-14_105953](https://tva1.sinaimg.cn/mw690/005ZJ4a1ly1ggqbhq1jp8j31hc0ptjt4.jpg "candark")

<p class="pic-comment">记得拉到页面最底部，选择 System Installer 64bit 下载</p>

![1715028-20190720231204639-1061813464](https://tvax3.sinaimg.cn/mw690/005ZJ4a1ly1ggqbnx5l0pj30g70d5dg1.jpg "candark")

这个界面可以把第二三行勾掉。

### GCC

去 [TDM-GCC](https://jmeubank.github.io/tdm-gcc/download/) 下载第一个 tdm-gcc-webdl.exe。

安装时选第一个。![1715028-20190720233913931-407615946](https://tva3.sinaimg.cn/mw690/005ZJ4a1ly1ggqbplag6dj30hh0dkdh9.jpg "candark")

2020年了，当然要选 64 位。![1715028-20190720234030632-1093766577](https://tvax1.sinaimg.cn/mw690/005ZJ4a1ly1ggqbqra919j30hh0dk75i.jpg "candark")

由于它默认会安装 32 位的 GCC ，但是并不需要，可以在自定义那个界面取消选择。

![1715028-20190720234304612-971494138](https://tva2.sinaimg.cn/mw690/005ZJ4a1ly1ggqbsyrs6ej30hh0dkq4b.jpg "candark")

记住这个安装路径。

当然，也可以选择 llvm，不过本文使用的是 GCC

### Git 和 CMAKE

如果如果对 Git 和 CMAKE，这两个软件当然是必装的，不过本文不对此进行过多叙述。

## 配置

### 语言

现在打开 VS Code，由于 VS Code 默认没有带中文语言包，所以需要设置一下。

![2020-07-14_111625](https://tva2.sinaimg.cn/mw690/005ZJ4a1ly1ggqbz9wz8gj31510somza.jpg)

点开左侧第五个选项卡（扩展），在搜索框中输入 Chinese ，点击第一个的 Install，然后 VS Code 会提示重启。

### 环境

然后在扩展的搜索框里继续输入 C/C++，第一个即为微软的 C/C++ 插件，点击安装即可。

![2020-07-14_112726](https://tvax1.sinaimg.cn/mw690/005ZJ4a1ly1ggqca7c1cyj31580sojuo.jpg)

现在点开 VS Code 的文件菜单，选择 打开文件夹。这个文件夹就是的工作目录。

在左侧的资源管理器右上角点击新建文件夹图标（或者右键），输入 `.vscode`。

点击 .vscode 文件夹，新建 tasks.json，粘贴如下内容

```json

{
    "version": "2.0.0",
    "command": "g++",
    "args": ["-g","${file}","-o","${fileBasenameNoExtension}.exe"], // 编译命令参数
    "problemMatcher": {
        "owner": "cpp",
        "fileLocation": ["relative", "${workspaceRoot}"],
        "pattern": {
            "regexp": "^(.*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
            "file": 1,
            "line": 2,
            "column": 3,
            "severity": 4,
            "message": 5
        }
    }
  }
  
  ```

新建 launch.json，粘贴如下内容（注意，需要把注释删掉）


```json
{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "g++.exe - 生成和调试活动文件",//配置名称，将会在启动配置的下拉菜单中显示
            "type": "cppdbg",//配置类型，这里只能为cppdbg
            "request": "launch",//请求配置类型，可以为launch（启动）或attach（附加）
            "program": "${fileDirname}\\${fileBasenameNoExtension}.exe",//将要进行调试的程序的路径
            "args": [],//程序调试时传递给程序的命令行参数，一般设为空即可
            "stopAtEntry": false,//设为true时程序将暂停在程序入口处，一般设置为false
            "cwd": "${workspaceFolder}",//调试程序时的工作目录，一般为${workspaceRoot}即代码所在目录
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "C:\\Program Files\\TDM-GCC\\bin\\gdb.exe",
            "setupCommands": [
                {
                    "description": "为 gdb 启用整齐打印",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "C/C++: g++.exe build active file"
        }
    ]
}

```

注意其中的 midebugger 项。

点击 文件选项卡，保存全部（VS Code需要手动保存才能保存到本地文件）。

最后，查看目录结构是否如图所示![2020-07-14_115622](https://tva4.sinaimg.cn/mw690/005ZJ4a1ly1ggqd4c9kj1j31580soaat.jpg)

