---
title: C/C++ 取模运算
date: "2020-09-20 22:00:00"
updated: "2022-01-30 21:30:00"
tags: [Windows,C++,C]
category: blog
---
今天看 《C++ Primer》 时，产生了一些疑问，经过一番研究，弄明白了 C++ 中取模和取余，记录在这里。

<!-- more -->

原因是读到了第二章的这段：

> 当赋给无符号类型一个超出它范围的值时，结果是初始值对无符号类型表示数值总数取模后的余数。<br>例如，8 比特大小的 unsigned char 可以表示 0 至 255 区间的值，如果赋了一个区间外的值，比如把 -1 赋给 unsigned char，则实际的结果是 255。

取模和取余运算过程是相似的，废话不多说，直接上代码：

```cpp

#include <iostream>
#include <cmath>
int main ()
{
    std::cout << (-1) % 256 << std::endl;
    unsigned char i;
    i = -1;
    int b = i;//直接输出i会给出一个char类型的字符而不是数字
    std::cout << b << std::endl;
    int c = -1;
    double d = 256,e = 0,f = 0,g = 0,h = 0;
    e = floor(c / d);
    f = -1 - (e * d);
    std::cout << f << std::endl;
    g = ceil(c / d);
    h = -1 - (g * d);
    std::cout << h << std::endl;
}

```

输出结果如下：

```powershell

-1
255
255
-1

```

分析：第一个输出是直接使用 % 取余，得到 -1；第二个是测试 C++ 隐含的转换，得到 255；第三个是分步取模，第四个是分步取余。

取模和取余本质上的区别在于，取模时，需要将商（e）先转换（floor）为不大于商本身的最小数（可为负）进行计算，而取余时需要将商（g）先转换（ceil）为向接近于 0 的下一个整数再进行计算。

其中 floor 和 ceil 函数在 cmath（math.h） 中定义。

由此可见，C++ 中 % 是取余运算符而不是取模运算符。

2020.10.02 补充：

C++ Pimer 第 125 页写道，C++ 早期版本没有规定 % 是取模还是取余，而 C++11 明确规定了 % 在运算过程中需要对商向 0 取整，所以 C++ 的 % 是取余运算，这也造成了网络上很多关于这点的错误描述。

2022.01.30 补充：

陈硕在 [带符号整数的除法与余数](https://blog.csdn.net/solstice/article/details/5139302) 中提到，C99 规定了向零取整。