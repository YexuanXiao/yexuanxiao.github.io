---
title: 强迫症的自我修养
date: "2021-01-06 05:26:00"
tags: [Windows]
category: blog
---
本文记录 Windows 右键菜单或者其他界面上一些无用控件的清除方法。

<!-- more -->

* toc
{:toc}

## 删除 Windows 10 中的 OneDrive 上下文菜单

方案：[Winaero](https://winaero.com/remove-onedrive-context-menu-windows-10/)

1. regedit 打开或者建立 `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Shell Extensions\Blocked`
2. 新建字符串值，名字为 `{CB3D0F55-BC2C-4C1A-85ED-23ED75B5106B}`
3. 重启

## 删除 在 Visual Studio 中打开 上下文菜单

1. regedit 删除 `HKEY_CLASSES_ROOT\Directory\Background\shell\AnyCode` `HKEY_CLASSES_ROOT\Directory\shell\AnyCode`

## 删除 3D 对象 库

1. regedit 打开 `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\`
2. regedit 打开 `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\`
3. 删除 `{0DB7E03F-FC29-4DC6-9020-FF41B59E513A`

## 删除 英伟达控制面板 上下文菜单

1. 打开英伟达控制面板
2. 点击工具栏的 “桌面”
3. 取消选择所有项目

## 小米路由器开启 ssh/放行 ipv6 端口

方案:[CHH](https://www.chiphell.com/thread-2254324-1-1.html)

 [恩山](https://www.right.com.cn/forum/thread-4053910-1-1.html)


1. 登录路由器得到浏览器地址栏的 stok
2. 替换并访问 `http://192.168.31.1/cgi-bin/luci/;stok=<STOK>/api/misystem/set_config_iotdev?bssid=Xiaomi&user_id=longdike&ssid=-h%3B%20nvram%20set%20ssh_en%3D1%3B%20nvram%20commit%3B%20sed%20-i%20's%2Fchannel%3D.*%2Fchannel%3D%5C%22debug%5C%22%2Fg'%20%2Fetc%2Finit.d%2Fdropbear%3B%20%2Fetc%2Finit.d%2Fdropbear%20start%3B%20echo%20-e%20'admin%5Cnadmin'%20%7C%20passwd%20root%3B`
3. powershell `ssh root@192.168.31.1`
4. powershell `speed=$(uci -q get xiaoqiang.common.WAN_SPEED)`
5. powershell `[ -n "$speed" ] && /usr/sbin/phyhelper swan "$speed"`
6. ip6tables -I forwarding_rule -p tcp --dport 12268 -j ACCEPT