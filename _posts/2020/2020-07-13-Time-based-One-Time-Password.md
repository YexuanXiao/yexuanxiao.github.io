---
layout: post
title: 基于时间同步的动态密码
date: "2020-07-13 11:08:00"
tags: [security,docs]
categories: [blog]
---
　　TOTP 是 Time-based One-Time Password 的简写，表示基于时间算法的一次性密码。

<!-- more -->

　　TOTP 计算公式：

```code

TOTP(K, TC) = Truncate(HMAC-SHA-1(K, TC))

```

　　客户端和服务器持有相同的密钥，采用相同的 Hash 算法，基于时间计算出长度为 6 位或者 8 位的密码，进行比较。

　　规范文档：[RFC6238](https://tools.ietf.org/pdf/rfc6238.pdf)
