---
layout: post
title: 字节序和内存模型
date: "2021-07-14 14:02:00"
tags: [C++, C, docs]
categories: [blog]
---
　　字节序是 C/C++ 程序在设计之初或者移植中需要考虑的重点之一，仅次于数据长度和汇编指令。所谓字节序，实际上是指 CPU 对于内存数据存放顺序。

<!-- more -->

　　我们都知道，字节（byte，通常表现为 char）是 C/C++ 数据大小的基本单位（除了极少数特例如 vector\<bool\>），也是我们程序设计中可直接操控的最小单位。

　　几乎所有计算机都是如此设计的，虽然字节并不是 CPU 计算最快的数据大小（word，通常表现为 int），甚至不是 CPU 从内存中读取数据的最小单元（Cache Line，大部分为 64 bytes）。

　　但是，对于多个字节储存，就存在差异了。

　　十六进制是帮助我们理解这个问题的最佳工具：

　　一位 16 进制数能表示 4 bit 数据，而一个 byte 是 8bit，所以 16 进制数只用 16 个不同字符就完成了对每一个 byte 的准确映射，例如：

`0x12 34`

`0x12 0x34`//两个 byte/char

`0001 0010 0011 0100`

　　对于一个 32 位 unsigned int 储存的数字 1，我们也许理所当然的认为其 16 进制表示是 `0x00 00 00 01`。但是你有没有想过，计算机是按 byte 储存数据的，那么计算机从这四组 byte 的哪一组开始存储？

　　书写上如果你选择从左向右写，那么你会发现你先写较大位数的数字（十位），再写较小位数的数字（个位），换句话说，高位数字优先被写在纸上了。

　　同样的，如果规定内存中数据增长方向为从左到右，那么计算机实际上就可以选择优先写低位数字和优先写高位数字，所谓大端字节序就是低位内存存放高位数据，小端字节序就是低位内存存放低位数据。

　　这就代表着 `0x00 00 00 01` 和 `0x01 00 00 00` 都可以表示表示数字 1。

　　那么当我们把这个 unsigned int 按内存增长顺序去读取的时候，就会产生不一样的结果。

　　对于纯粹的数据交换，就需要经过逐位解读。因此就可能存在解读偏差。

　　知道了字节序的基本概念后，就是如何判断字节序，以 C++ 为例：

```cpp

#include <iostream>

inline bool checkEndian()
{
	unsigned int a = 1;
	return *((char *)&a);// 小端字节序为 true
	//return *((char *)&a + sizeof(int) - 1);// 大端字节序为 true
}

```

　　思路很简单，unsigned int 不管在什么平台上一定大于等于 2byte，给变量赋初值小于 2<sup>8</sup> 的初值，用强制类型转换定位到低位或者高位地址再判断该字节是否有数值。

　　由此我们也可以得到一个转换函数调整任意大小的数据：

```cpp

void roundBytes(char *data, size_t length)
{
	unsigned char *begin = (unsigned char *)data;
	for (unsigned char *end = begin + length - 1; begin < end; ++begin, --end)
	{
		*end ^= *begin;
		*begin ^= *end;
		*end ^= *begin;
	}
}

```

　　思路也很简单，将数据强制转换为 unsigned char* 再前后颠倒就可以。

　　我在 [StackOverFlow](https://stackoverflow.com/questions/105252/how-do-i-convert-between-big-endian-and-little-endian-values-in-c) 上还找到了使用下标运算符的实现方案：

```cpp

#define REVERSE_BYTES(...)\
	do\
		for (size_t REVERSE_BYTES = 0; REVERSE_BYTES < sizeof(__VA_ARGS__) >> 1; ++REVERSE_BYTES)\
			((unsigned char *)&(__VA_ARGS__))[REVERSE_BYTES] ^= ((unsigned char *)&(__VA_ARGS__))[sizeof(__VA_ARGS__) - 1 - REVERSE_BYTES],\
				((unsigned char *)&(__VA_ARGS__))[sizeof(__VA_ARGS__) - 1 - REVERSE_BYTES] ^= ((unsigned char *)&(__VA_ARGS__))[REVERSE_BYTES],\
				((unsigned char *)&(__VA_ARGS__))[REVERSE_BYTES] ^= ((unsigned char *)&(__VA_ARGS__))[sizeof(__VA_ARGS__) - 1 - REVERSE_BYTES];\
	while (0)

// 原作者将其写为了一个宏，我改写为了函数

void reserve_bytes(char *data, size_t length)
{
	for (size_t REVERSE_BYTES = 0; REVERSE_BYTES < length >> 1; ++REVERSE_BYTES)
	{
		((unsigned char *)data)[REVERSE_BYTES] ^= ((unsigned char *)data)[length - 1 - REVERSE_BYTES];
		((unsigned char *)data)[length - 1 - REVERSE_BYTES] ^= ((unsigned char *)data)[REVERSE_BYTES];
		((unsigned char *)data)[REVERSE_BYTES] ^= ((unsigned char *)data)[length - 1 - REVERSE_BYTES];
	}
}

```

　　以上方法都是针对不定长数据大小的，对于定长且占用空间较小的类型，我们可以用移位运算符进行转换。

　　注意，C/C++ 对于 unsigned 类型和非 unsigned 类型使用移位操作的具体表现是不一样的：非 unsigned 并且符号位不为 0 的时候，编译器会选择算术移位，即符号位固定为 1，符号位和数据位向右移动，舍弃数据位的最后一位。