---
title: 字节序和内存布局
date: "2021-07-14 14:02:00"
update: "2022-01-16 02:00:00"
tags: [C++, C, docs]
category: blog
---
字节序是 C/C++ 程序在设计之初或者移植中需要考虑的重点之一，仅次于数据长度和汇编指令。所谓字节序，实际上是指 CPU 对于内存数据存放顺序。对于程序内的数据交换，不用考虑字节序和内存布局的问题，但是对于程序间数据交换，字节序和内存布局就是必须考虑的问题了。

<!-- more -->

#### 字节序

字节（byte，通常表现为 char）是 C/C++ 数据大小的基本单位（除了极少数特例如 vector\<bool\>），也是程序设计中可直接操控的最小单位。

几乎所有计算机都是如此设计的，虽然字节并不是 CPU 计算最快的数据大小（word，通常表现为 int），甚至不是 CPU 从内存中读取数据的最小单元（Cache Line，大部分为 64 bytes）。

但是，对于多个字节储存，就存在差异了。

十六进制是理解这个问题的最佳工具：

一位 16 进制数能表示 4 bit 数据，而一个 byte 是 8bit，所以 16 进制数只用 16 个不同字符就完成了对每一个 byte 的准确映射，例如：

`0x12 0x34`

`0001 0010 0011 0100`

对于一个 32 位 unsigned int 储存的数字 1，也许理所当然的认为其 16 进制表示是 `0x00 00 00 01`。但是有没有想过，计算机是按 byte 储存数据的，那么计算机从这四组 byte 的哪一组开始存储？

书写上如果你选择从左向右写，那么你会发现你先写较大位数的数字（十位），再写较小位数的数字（个位），换句话说，高位数字优先被写在纸上了。

同样的，如果规定内存中数据增长方向为从左到右，那么计算机实际上就可以选择优先写低位数字和优先写高位数字，所谓大端字节序就是低位内存存放高位数据，小端字节序就是低位内存存放低位数据。

这就代表着 `0x00 00 00 01` 和 `0x01 00 00 00` 都可以表示表示数字 1。

那么将这个 unsigned int 按内存增长顺序去读取的时候，就会产生不一样的结果。

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

由此也可以得到一个转换函数调整任意大小的数据：

```cpp

void roundBytes(unsigned char *data, size_t length)
{
	unsigned char *begin = (unsigned char *)data;
	for (unsigned char *end = begin + length - 1; begin < end; ++begin, --end)
	{
        auto temp = *begin;
		*end = *begin;
		*begin = temp;
	}
}

```

思路也很简单，将数据强制转换为 unsigned char* 再前后颠倒就可以。

对于定长且占用空间较小的类型，可以用移位运算符进行转换。

注意，C/C++ 对于 unsigned 类型和非 unsigned 类型使用移位操作的具体表现是不一样的：非 unsigned 并且符号位不为 0 的时候，编译器会选择算术移位，即符号位固定为 1，符号位和数据位向右移动，舍弃数据位的最后一位。

C++20 为了解决字节序问题，设置了一组枚举用于判断当前平台的字节序：

```cpp

// <bit>
enum class endian
{
    little = /*implementation-defined*/,
    big    = /*implementation-defined*/,
    native = /*implementation-defined*/
};

```

使用的时候只需要判断 native 是否等于 big 或者 little 即可 [^1] ：

[^1]: [std::endian](https://zh.cppreference.com/w/cpp/types/endian)

```cpp

#include <bit>
#include <iostream>
 
int main() {
    if constexpr (std::endian::native == std::endian::big)
        std::cout << "big-endian" << std::endl;
    else if constexpr (std::endian::native == std::endian::little)
        std::cout << "little-endian" << std::endl;
    else std::cout << "mixed-endian" << std::endl;
}

```

C++23 添加了函数 byteswap 用于翻转字节序 [^2] ：

[^2]: [std::byteswap](https://zh.cppreference.com/w/cpp/numeric/byteswap)

```cpp

#include <bit>
#include <cstdint>
#include <concepts>
#include <iostream>
#include <iomanip>
 
template <std::integral T>
void dump(T v, char term = '\n') {
    std::cout << std::hex << std::uppercase << std::setfill('0')
              << std::setw(sizeof(T) * 2) << v << " : ";
    for (std::size_t i{}; i != sizeof(T); ++i, v >>= 8) {
        std::cout << std::setw(2) << static_cast<unsigned>(T(0xFF) & v) << ' ';
    }
    std::cout << std::dec << term;
}
 
int main()
{
    static_assert(std::byteswap('a') == 'a');
 
    std::cout << "byteswap for U16:" << std::endl;
    constexpr auto x = std::uint16_t(0xCAFE);
    dump(x);
    dump(std::byteswap(x));
 
    std::cout << "byteswap for U32:" << std::endl;
    constexpr auto y = std::uint32_t(0xDEADBEEFu);
    dump(y);
    dump(std::byteswap(y));
 
    std::cout << "byteswap for U64:" << std::endl;
    constexpr auto z = std::uint64_t{0x0123456789ABCDEFull};
    dump(z);
    dump(std::byteswap(z));
}

```

byteswap 是一个函数模板，参数是一个整数类型。

#### 内存布局

程序间数据交换除了要考虑字节序问题，还需要考虑内存对齐使用的填充空位问题。

由于寄存器大小通常大于 1byte，所以 CPU 读取和处理数据都不是以字节为单位，通常是 4 字节（一个 int 的大小）为单位。所以，如果有这样的一个结构体：

```cpp

struct A
{
    char b;
    int c; // 假设int具有32位
};

```

如果 b 和 c 紧密排列，那么由于 b 和 c 的前三个字节共享前 4 字节，这将导致读取 c 的时候 CPU 要访问 2 次，造成效率的降低。所以编译器通常会进行如下优化：

```cpp

struct A
{
    char b, :24; // 使用一个24比特的匿名bit-field模拟编译器行为进行内存对齐
    int c;
};

```

b 后有 3 字节内存用于占位。如果另一个程序没有进行诸如此类的优化，盲目进行数据交换会引发严重的错误和安全漏洞。

<div class="ref-label">注：</div>