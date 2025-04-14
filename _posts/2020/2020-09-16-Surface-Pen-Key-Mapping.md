---
title: Surface Pen 按键映射
date: "2020-09-16 21:36:00"
tags: [Windows]
category: blog
---
Surface Book 3 最重要的功能之一是笔和触摸。我买的 Surface Pen 是第五代的，笔身下部有一个按键，顶部有一个按键。按键本身是使用蓝牙来输入的，不过微软并没有提供宏功能，这时候就需要用 VBScript 花式整活。

<!-- more -->

设置 > 设备 > 笔和 Windows Ink 中提供了对尾部按键的自定义功能，目前支持单击，双击，长按三个操作。我向微软反馈了能否支持侧键自定义，不过反馈中心的中文反馈貌似一直不太受重视，其他独立的反馈渠道好很多，但是关于 Surface Pen 的我没找到。

那么怎么实现按键映射呢?

1. 新建一个 vbs，内容如下：

    ```vbscript

    CreateObject("Wscript.Shell").Sendkeys"%C"//模拟Alt+C

    ```

2. 新建一个这个脚本的快捷方式。
3. 在设置里选择打开应用，选择传统应用，选择这个快捷方式。

此时就可以实现按键映射。

其中 `"%C"` 中的 % 是指 Alt，C 是指键盘上的 C，这样就可以模拟 Alt + C 同时按下。

`"^C"` 是指 Ctrl + C，`"^{F4}"` 是指 Ctrl + F4。

那么这些仅仅是模拟具有表面意义的键，并且不支持操作符。那么有没有方法进行更骚的操作，比如模拟 `+` ,或者模拟翻页键，前后键，音量键呢?

实际上微软提供了许多操作键，有两种方法可以使用这些键：[Docs](https://docs.microsoft.com/zh-cn/windows/win32/inputdev/virtual-key-codes?redirectedfrom=MSDN)

方法一来自 CSDN 的 [dnizoy
](https://blog.csdn.net/dnizoy/article/details/17003719)

简单来讲，就是使用 `CreateObject("Wscript.Shell").Sendkeys chr(&h88ad)` 这种显式传递字符编码的形式。

&h 代表使用 16 进制，88 是为了构造字符（实际上并无意义），0x88-8F 都可以，最后的 ad 代表要发送的键的 16 进制表示。比如 0xad 是静音键。

方法二是隐式传递字符编码

这种方法的优点在于可以直接用引号和***字符*** 输入编码。

转换网站：[心缘地方](http://mytju.com/classcode/tools/encode_gb2312.asp)

只需要把拼装出来的 &h88ad （这里将其认为是 GBK 编码 16 进制）输入到第二行，得到一个汉字，比如 &h88ad 代表 埑。

那么就可以使用

```vbscript

CreateObject("Wscript.Shell").Sendkeys "埑"

```

隐式发送操作字符编码，并将此文件（用记事本）保存为 ANSI (GBK) 格式。

虽然其本意并不是字符，但是通过这种方式依然能得到一样的结果（除非你在时区设置里开启了体验上非常糟糕的 UTF-8 支持）。

以前我把罗技 703 的按键定义成了媒体控制器（切换歌曲，暂停），现在 Surface Pen 变成了 ———— 更小巧的媒体控制器