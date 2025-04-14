---
title: 把你的 Windows 10 电脑变成蓝牙音箱
date: "2020-11-14 22:37:00"
tags: [Windows]
category: blog
---
众所周知，Windows 10 的蓝牙和 Android 比就是一个残废，例如不能自动检测是否有文件传入，连接繁琐，操作麻烦等等，但是今天闲来无事逛 Microsoft 商店突然发现了一个软件实现了我这几年一直想要的功能：Bluetooth Audio Receiver

<!-- more -->

![20201114220100](https://tvax1.sinaimg.cn/large/005ZJ4a1ly1gkp2zjnsw1j30hw0hft8q.jpg "candark")

![Screenshot_20201114-215502_Settings](https://tva3.sinaimg.cn/large/005ZJ4a1ly1gkp2zvf45hj31402gwtfd.jpg "candark")

这款软件非常简洁，只需要在双方连接蓝牙后，选择蓝牙设备，点击开始链接，此时手机上就可以将Windows 10 电脑当作蓝牙音频输入设备，实现在手机上选歌，电脑上播放。

以往想要在手机上控制电脑音乐播放只能使用 Windows Media Player 的 DLNA，或者如 foobar 2000 这种支持远程控制的第三方音乐软件，或者是使用 Samsung Dex/Flow 等投屏方式。

前两种缺点很明显：DLNA 需要手机上的播放软件支持，并且由于 DLNA 实际上是采用了缓存整个音频文件的方式，并且连接不稳定，所以经常播放遇到错误；而 fb2k 需要额外设置，并且手机上的控制器并不是很好看。

Samsung Dex/Flow 本质上是用来投屏的，所以并不能说很适合。

我目前手机上用的本地播放器是 Stellio Player，这个播放器非常好看，支持中文明暗主题，操作上也非常符合我的习惯，但是不支持 DLNA。

这个 Bluetooth Audio Receiver 则彻底解决了这个问题，只需要简单的几步就可以实现非常好的效果，对我来说堪称神软。

由于 Windows 10 在 2004 版才支持 A2DP Sink，即蓝牙音频输入，所以这款软件只支持在 2004 及更高设备上使用，目前支持 SBC 44.1khz 和 16bit 播放，虽然规格低了一点，不过够用了，并且由于是通过系统 API 进行播放，所以 CPU 和内存占用极低（完全无感，不到 1% 的 CPU 占用和 10 MB 的内存占用）。