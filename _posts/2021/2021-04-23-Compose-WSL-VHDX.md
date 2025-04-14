---
title: 减小 WSL 镜像文件占用
date: "2021-04-23 23:47:00"
tags: [Windows,VHD,diskpart,docs,WSL]
category: blog
---
WSL 的 Linux 发行版都是储存在 vhdx 中的，而删除 vhdx 中的文件实际上不会减小 vhdx 的体积，需要手动释放。

<!-- more -->

1. Linux 发行版的镜像文件默认安装在 `"%USERPROFILE%\AppData\Local\Packages\"` ，可通过 Explorer 访问这个目录。

2. 搜索 vhdx，其中 ext4.vhdx 就是想要的文件。

3. 把 ext4.vhdx 剪贴到 C 盘根目录，这样方便操作。

4. PowerShell 依次如下代码：

    ```powershell

    wsl --shutdown
    diskpart
    # open window Diskpart
    select vdisk file="C:\ext4.vhdx"
    attach vdisk readonly
    compact vdisk
    detach vdisk
    exit

    ```