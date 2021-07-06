---
layout: post
title: 使用 PowerShell 扩展 VHD
date: "2019-07-31 02:00:00"
tags: [Windows,VHD,diskpart]
categories: [blog]
---

　 我一直使用vhd作为磁盘备份方式，但因为当初设定的容量比目标磁盘小，导致现在没有足够的空间进行备份，于是想到了扩展Vhd的方式
　 于是找来文档，并在此留作备份方便以后查看。

<!-- more -->

1. 管理员模式打开powershell
   ~~~
   diskpart
   ~~~

2. 选择VHD文件
   ~~~
   select vdisk file="X:\target.vhd" 
   ~~~
	注意：目标VHD文件路径必须为绝对路径

3. 分离VHD文件
   ~~~
   detach vdisk
   ~~~
	注意：执行此操作前需要在文件资源管理器中卸载VHD

4. 扩展虚拟磁盘容量
   ~~~
    expand vdisk maximum=num
   ~~~
	注意：num为扩展后整个虚拟磁盘的容量，单位为MB

5. 连接到虚拟磁盘
   ~~~
   attach vdisk
   ~~~

6. 列出可用卷列表
   ~~~
   list volume
   ~~~

7. 选择将要扩展的目标卷
   ~~~
   select volume num
   ~~~

8. 扩展卷容量
   ~~~
   extend size=n
   ~~~
	注意：n为要扩展的容量，该参数忽略后默认扩展到最大量


9. 此时已经扩展完成，执行
   ~~~
   exit
   ~~~
   退出即可。
