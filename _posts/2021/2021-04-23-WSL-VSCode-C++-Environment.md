---
title: WSL 2 和 VS Code C++ 开发环境
date: "2021-04-23 18:54:00"
tags: [Windows,VSCode,C++,GCC,docs,WSL]
category: blog
---
WSL 2 最近支持在 Explorer 中简单管理文件，并且 WSL 2 还可以自动配置端口转发，正巧我想把博客里的 Liquid 代码整理一下，但 Github Page 不给 Jeklly 解析错误的错误信息，Ruby for Windows 又过于臃肿。

我在几年前用过一段时间 Ubuntu，对 Linux 不陌生，便趁此机会转投 WSL 2，使用 VSCode Server + VSCode 进行开发。

<!-- more -->

安装步骤如下：

1. PowerShell 执行 `wsl --install`

这个是 WSL 2 傻瓜化安装方法，不过多数会失败。

下面是手动安装步骤：

1. WSL 2 首先要在 BIOS 中开启虚拟化。

2. PowerShell 执行如下命令，给 Windows 10 添加 WSL 功能

    ```powershell

    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

    ```

3. PowerShell 执行如下命令，给 Windows 10 添加 虚拟机平台 功能

    ```powershell

    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

    ```

4. 点击链接下载 WSL 2 更新并安装：[WSL2 Linux kernel update package for x64 machines](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)

5. 去 Github 下载 WSLg [Realease](https://github.com/microsoft/wslg/releases)

准备步骤如下：

1. PowerShell 执行 `wsl --set-default-version 2`，设置默认使用 WSL 2

2. 去 Microsoft Store 下载 Linux 发行版，有以下系统可供选择：

    + Ubuntu
    + openSUSE
    + SUSE Linux Enterprise
    + Kali Linux
    + Debian

    我推荐使用 Ubuntu 20.04

3. PowerShell 执行 wsl 或者直接在开始菜单打开对应的 Linux 发行版

4. 第一次会提示你创建用户名和密码，注意用户名不能有空格，并且一定记住密码

5. 使用 WSL 2 上的 Linux 发行版

参考：[Windows Subsystem for Linux Installation Guide for Windows 10](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

G++ 安装部署：

这里我选择安装 gcc-11 和 g++-11

PowerShell 执行如下内容：

1. `sudo add-apt-repository ppa:ubuntu-toolchain-r/test`
2. `sudo apt-get update`
3. `sudo apt install gcc-11`
4. `sudo apt install g++-11`
5. `sudo apt install gdb`

VSCode 配置步骤：

1. 安装 Windows 版 VSCode

2. Win+R 执行 `wsl code`，或者开始菜单打开 Ubuntu，执行 `code`。

3. 此时 WSL 会自动安装 VSCode Server 并自动配置，然后会自动打开 Windows 的 VSCode。

4. 此时打开 Explorer，左下角会有一个 Linux，打开后进入 home 目录，这个文件夹下面有一个以你的用户名命名的文件夹，这个文件夹就是开始菜单的 WSL Shell 默认进入的目录。

5. 在 Linux 上，`~` 也代表 那个以你的用户名命名的目录。

6. 在项目文件夹下面建立 .vscode 文件夹，其中建立三个文件内容如下：

launch.json

```json

{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "gcc-11 - 生成和调试活动文件",
            "type": "cppdbg",
            "request": "launch",
            "program": "${fileDirname}/${fileBasenameNoExtension}",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "gdb",
            "setupCommands": [
                {
                    "description": "为 gdb 启用整齐打印",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "Launch: build active file"
        }
    ]
}

```

tasks.json

```json

{
	"version": "2.0.0",
	"tasks": [
		{
			"type": "cppbuild",
			"label": "Launch: build active file",
			"command": "/usr/bin/gcc-11",//改成自己需要用的编译器
			"args": [
				"-g",
				"${file}",
				"-o",
				"${fileDirname}/${fileBasenameNoExtension}"
			],
			"options": {
				"cwd": "${workspaceFolder}"
			},
			"problemMatcher": [
				"$gcc"
			],
			"group": "build",
			"detail": "use /usr/bin/gcc-11"
		}
	]
}

```

有时候会遇到 VSCode 提示更新 includePath，这时候需要在 wsl 里执行 `gcc-11 -v -E -x c++ -`

此时程序会输出一些信息，按下 ctrl+C 终止程序，然后找到这句：`#include <...> search starts here:`

直到这句：`End of search list.`

把中间的内容处理为如下格式并储存为 .vscode 下的文件：

c_cpp_properties.json

```json

{
    "configurations": [
        {
            "name": "Linux",
            "includePath": [
                "${workspaceFolder}/**",
                "/usr/include/c++/11",
                "/usr/include/x86_64-linux-gnu/c++/11",
                "/usr/include/c++/11/backward",
                "/usr/lib/gcc/x86_64-linux-gnu/11/include",
                "/usr/local/include",
                "/usr/include/x86_64-linux-gnu",
                "/usr/include"//最后一行没逗号
            ],
            "defines": [],
            "compilerPath": "/usr/bin/cpp",
            "cStandard": "gnu11",
            "cppStandard": "c++20",
            "intelliSenseMode": "linux-gcc-x64"
        }
    ],
    "version": 4
}

```
