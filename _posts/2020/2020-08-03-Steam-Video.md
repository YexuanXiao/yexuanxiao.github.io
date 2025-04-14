---
title: HTML5 播放器
date: "2020-08-03 08:25:00"
tags: [Windows,UWP,docs]
category: blog
---
Flash 已经寿终正寝，HTML 5 才是时代潮流。

<!-- more -->

DIYgod 开发的 DPlayer 作为一个轻量级 HTML 5 播放器是不二的选择。

项目地址：https://github.com/MoePlayer/DPlayer

DPlayer 配合 HLS.js 还可以做到播放 m3u8。

只需要引入 https://cdn.jsdelivr.net/npm/hls.js@0.14.7/dist/hls.min.js

https://cdn.jsdelivr.net/npm/dplayer@1.26.0/dist/DPlayer.min.js

设置一个 id 为 dplayer 的元素，并初始化播放器，即可播放 m3u8(ts)。

```javascript

const dp = new DPlayer({
    container: document.getElementById('dplayer'),
    video: {
        url: 'index.m3u8',
        type: 'hls',
    },
    pluginOptions: {
        hls: {
            // hls config
        },
    },
});
console.log(dp.plugins.hls); 

```

使用 ffmpeg 可以方便的将视频分割成 ts 流：

```powershell

ffmpeg -i input.file -start_number snumber -f hls -hls_list_size 0 -threads tnumber -hls_time seconds index.m3u8

```

+ snumber: 起始编号
+ tnumber: 线程数
+ seconds: 每一个 ts 包含的视频时间
+ 0: 索引全部片段，请勿修改

使用 m3u8 优点:每段 ts 都是独立的视频，分段加载节省流量；保证 DTS 和 PTS 同步，防止拖动进度条时卡顿。