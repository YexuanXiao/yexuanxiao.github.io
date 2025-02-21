---
title: 使用代发实现免费域名邮箱
date: "2022-10-16 08:59:00"
tags: [Web,docs]
category: blog
---
网上的域名邮箱教程大多数是基于第三方域名邮箱托管平台的，这些平台要不免费版受限，不然就得备案，或者付费，一年 8 刀到 60 刀不等，配置方法也比较复杂，先要注册账户，验证域名所属，然后改变 DNS，然后下载专用邮件客户端或者付费开启 IMAP 和 SMTP。本文提供一种思路免费获得永久使用的域名邮箱。

<!-- more -->

需要有 Cloudflare 和 Microsoft 账号，并把域名 DNS 托管到 Cloudflare。

Cloudflare 最近推出了电子邮件转发服务，可以把自己域名的电子邮件地址收到的邮件转发到其他邮件地址。而微软的 Outlook 支持别名服务，这意味着可以通过 Outlook 发送地址不为 outlook.com 的电子邮件（但是域仍然是 outlook.com，收件方可以看到这一点）。所以使用 Cloudflare 的邮件转发 + Outlook 的别名发送就可以假装成域名邮箱。

首先进入 Cloudflare 的控制台[主页](//dash.cloudflare.com)，点击托管的域名，打开左侧侧边栏，选择 Email，然后第一次使用大概有个参与计划的设置，按照提示一步步进行即可。将 custom@yourdomain 的电子邮件转发到你的 Outlook 地址，注意，此时必须转发到已经存在的地址。

然后更改该域的 DNS，增加一个名称为 @ 的 TXT 记录，内容为 `v=spf1 include:_spf.mx.cloudflare.net include:outlook.com ~all`，如果 Cloudflare 已经帮你自动生成了一个以 `v=spf1` 开头的 TXT 记录，就把这个记录改成上面的内容（实际上就是添加了一句 `include:outlook.com`）。注意，不要添加 DMARC 记录，如果 Cloudflare 默认生成了一个 DMARC 记录，需要删掉，否则会导致收件方认为你的电子邮件是虚假的（如果有可以正确添加 DMARC 的方式，请联系我）。

最后进入 [Microsoft 账户 \| 你的个人档案](//account.microsoft.com/profile)，点击编辑账户信息，添加电子邮件，地址填写 Cloudflare 电子邮件转发的源地址，然后按照提示验证电子邮件是你所有，这时候验证邮件就会被转发到 Outlook 中，进行验证即可。个人建议使用相同的电子邮件前缀。

这样别人给你的域名邮箱地址发送的邮件都会发到 Outlook，如果需要回复，或者使用该邮件地址发送邮件，只需要使用 Outlook 客户端或者网页版，更改发件人地址即可。

更新：根据微软的新政策，2023 年 11 月 30 日后不能添加新的非 outlook.com 的别名：[Changes to Microsoft 365 email features and storage](https://support.microsoft.com/en-us/office/changes-to-microsoft-365-email-features-and-storage-e888d746-61e5-49e3-9bd1-94b88e9be988)。
