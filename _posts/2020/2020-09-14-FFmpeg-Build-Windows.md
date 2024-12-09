---
title: FFmpeg Windows Build
date: "2020-09-14 02:19:00"
tags: [Windows]
category: blog
---
Zeranoe 的 ffmpeg 网站即将关闭，Windows 上 FFmpeg 编译好的文件将去哪里获得呢?

<!-- more -->

FFmpeg 官网上一直以来并不提供 Windows 平台上的可执行文件，不过提供了 Zeranoe 的网站：[FFmpeg Builds](https://ffmpeg.zeranoe.com/builds/)

Zeranoe 的网站提供了静态编译版本和共享库形式的版本，可以及时得到最新版本的 FFmpeg 构建，并且完美支持额外的组件，例如 mkvtoolnix 或者 CUDA。

4 号的时候网站宣布18号关闭网站，实在是一个不好的消息。

好在 Github 上已经有人编译出了现成的 binary ，项目地址：[FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds/releases)