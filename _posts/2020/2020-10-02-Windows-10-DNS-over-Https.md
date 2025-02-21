---
title: Windows 10 开启 DNS over Https
date: "2020-10-02 12:57:00"
tags: [Windows,Github,Net]
category: blog
---
Windows 10 目前支持了 DNS over Https 这一先进技术。它可以保证更安全的访问互联网而不用担心一些额外的信息泄露，也可以可以防止恶意网络服务商将网站跳转到不正确的网站。

<!-- more -->

1. 以管理员身份运行 regedit。

2. 转到 `计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters`

3. 新建名为 `EnableAutoDoh` 的 DWORD32 值，并将内容改成 2

4. 重启计算机以激活 DoH

5. 设置 > 网络和 Internet > 更改适配器选项 > 在已经连接的网络上右键 > 属性 > Internet 协议版本 4 > 使用下面的 DNS 服务器

6. 将服务器改成 `1.1.1.1` 及 `1.0.0.1`（或者 TUNA DNS: `101.6.6.6`）

7. Internet 协议版本 4 > 使用下面的 DNS 服务器

8. 将服务器改成 `2606:4700:4700::1111` 及 `2606:4700:4700::1001`（或者 TUNA DNS: `2001:da8::666`）

9. 执行 `ipconfig /flushdns`
