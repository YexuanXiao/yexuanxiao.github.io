---
title: 一种泛型 itoa 实现
date: "2022-01-30 21:04:00"
tags: [C++,STL]
category: blog
---

之前读到了陈硕在 2010 年写的文章 [带符号整数的除法与余数](https://blog.csdn.net/solstice/article/details/5139302)，其中提到了一种用一个对称的 digits 数组自动解决符号的问题的 itoa 实现，我也在前年写过一篇文章 [C++ 取模运算](https://mysteriouspreserve.com/blog/2020/09/20/Cpp-Modulus-Operation/) 中提到过类似问题。正好陈硕写完文章的 10 年后，C++ 加入了 Concept，弥补了当年 C++ 0x 没有 Concept 的遗憾，于是本篇文章就是用 Concept 和陈硕文章内的 itoa 实现一同设计出一个泛型 itoa。

<!-- more -->

```cpp

#include <algorithm>
#include <concepts>

template<std::signed_integral T>
const char* itoa_impl_(char* buf, T value)
{
    const static char digits[19] =
    { '9', '8', '7', '6', '5', '4', '3', '2', '1',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };
    static const char* zero = digits + 9;  // zero 指向 '0'
    T i = value;
    char* p = buf;
    do {
        T lsd = i % 10;  // lsd 可能小于 0
        i /= 10;           // 向 0 取整
        *p++ = zero[lsd];  // 下标可能为负
    } while (i != 0);
    if (value < 0) {
        *p++ = '-';
    }
    *p = '\0';
    std::reverse(buf, p);
    return p; // p - buf 即为整数长度
}

template<std::unsigned_integral T>
const char* uitoa_impl_(char* buf, T value)
{
    const static char digits[19] =
    { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };
    T i = value;
    char* p = buf;
    do {
        T lsd = i % 10;  // lsd 可能小于 0
        i /= 10;           // 向 0 取整
        *p++ = digits[lsd];  // 下标不为负
    } while (i != 0);
    *p = '\0';
    std::reverse(buf, p);
    return p; // p - buf 即为整数长度
}

template<std::integral T>
const char* itoa_all(char* buff, T value) {
    if constexpr (std::signed_integral<T>) {
        return itoa_impl_(buff, value);
    }
    else if constexpr (std::unsigned_integral<T>) {
        return uitoa_impl_(buff, value);
    }
    else {
        static_assert(std::unsigned_integral<T>||std::signed_integral<T>, "Wrong integral.");
    }
}

```

测试代码：

```cpp

#include <cstddef>
#include <iostream>


int main() {
    char a[21]{};// ULLONG_MAX 的十进制数最高 20 位，再加上字符串结尾共 21 位
    // 无符号
    // 32 位
    itoa_all(a, INT_MAX);
    std::cout << a << std::endl;
    itoa_all(a, INT_MIN);
    std::cout << a << std::endl;
    // 64 位
    itoa_all(a, LLONG_MIN);
    std::cout << a << std::endl;
    // 有符号 char
    char c = CHAR_MAX;
    itoa_all(a, c);
    std::cout << a << std::endl;
    // 无符号
    // 32 位
    itoa_all(a, UINT_MAX);
    std::cout << a << std::endl;
    // 64 位
    itoa_all(a, ULLONG_MAX);
    std::cout << a << std::endl;
}

```
