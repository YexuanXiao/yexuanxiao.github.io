---
title: Valine Admin
date: "2020-09-13 03:54:00"
tags: [Windows,UWP,docs]
category: blog
---
Valine Admin 是 Valine 评论系统的扩展，是一个部署在 Leancloud 的后端系统，支持管理评论，发送邮件提醒。

<!-- more -->

根据项目文档配置就可以。

注意两点问题：

1. 如果以前配置过 Artitalk（在Class "\_User"中添加过行），那么需要删除旧的，保持 \_User 为空，才可以配置评论管理员登录密码。
2. 如果使用 Outlook 账户，并且设置了二次验证，那么密码需要设置成微软提供的应用密码才可以正确配置 SMTP。