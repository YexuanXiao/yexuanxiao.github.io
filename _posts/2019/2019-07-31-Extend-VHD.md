---
title: 使用 PowerShell 扩展 VHD
date: "2019-07-31 02:00:00"
tags: [Windows,VHD,diskpart]
category: blog
---

　 我一直使用 vhd 作为磁盘备份方式，但因为当初设定的容量比目标磁盘小，导致现在没有足够的空间进行备份，于是找来扩展 vhd 的文档，并在此留作备份方便以后查看。

<!-- more -->

1. 管理员模式打开 PowerShell

   ```powershell

   diskpart

   ```

2. 选择VHD文件

   ```powershell

   select vdisk file="X:\target.vhd" 

   ```

	注意：目标VHD文件路径必须为绝对路径

3. 分离VHD文件

   ```powershell

   detach vdisk

   ```

	注意：执行此操作前需要在文件资源管理器中卸载VHD

4. 扩展虚拟磁盘容量

   ```powershell

    expand vdisk maximum=num

   ```

	num 为扩展后整个虚拟磁盘的容量，单位为 MB

5. 连接到虚拟磁盘

   ```powershell

   attach vdisk

   ```

6. 列出可用卷列表

   ```powershell

   list volume

   ```

7. 选择将要扩展的目标卷

   ```powershell

   select volume num

   ```

8. 扩展卷容量

   ```powershell

   extend size=n

   ```

	n为要扩展的容量，该参数忽略后默认扩展到最大量


9. 此时已经扩展完成，执行

   ```powershell

   exit

   ```

   退出即可。
