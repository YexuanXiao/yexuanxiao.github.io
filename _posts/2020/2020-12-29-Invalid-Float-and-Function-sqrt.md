---
layout: post
title: C/C++ 错误浮点数问题
date: "2020-12-30 01:24:00"
tags: [C,docs]
categories: [blog]
---
　　问题：printf 在本应输出一个带有一位小数的浮点数的时候输出了一个奇怪的数：-1.#J

<!-- more -->

　　C 语言的 sqrt 等函数 **只能接收双精度浮点数** 为参数，而不能接受整数为参数，如果将一个整数传递给 sqrt，那么编译器不会报错，但是实际上这是一个错误的使用。

　　网上还有人出现了 1.#J，-1.#QNAN0 等等。

　　规范这个的标准是 [IEEE 754](https://standards.ieee.org/content/ieee-standards/en/standard/754-2019.html)，不过下载要付费。



　　上述几种结果并没有查到什么靠谱的资料，不过许多文章明确指出 IEEE 754 规定了 #INF 和 #IND 两种结果：

　　#INF 表示 无穷大 infinity 即超出了计算机可以表示的该类型浮点数的最大范围。一般来说是除数为 0 得出的结果，而数字前的符号取决于被除数的正负。储存方式：指数位全 1 尾数位全 0（二进制）

　　#IND 表示 不确定 indeterminate，它们来自于任何未定义结果的浮点数运算，有些时候也会表示为 NaN (not a number, Linux)。储存方式：指数位全 1 尾数位非 0（二进制）

　　比如对负数开平方，对负数取对数，0.0/0.0，0.0*∞, ∞/∞ 等。也可能由于一些操作使得程序中产生了无效数字或者没有给成员变量赋值；pow, exp 等等函数时常会产生一个无效数字

　　常见输出为 1.#IND。



参考：

[IEEE 754](https://standards.ieee.org/content/ieee-standards/en/standard/754-2019.html)

[踏雪_尋梅](https://blog.csdn.net/zhaojunwuiris/article/details/83654072)

[博客园 笨鸟不笨](https://www.cnblogs.com/Malphite/p/12068991.html)

[MSDN Blog Raymond](https://devblogs.microsoft.com/oldnewthing/20130228-01/?p=5103)