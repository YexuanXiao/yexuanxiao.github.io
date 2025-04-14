---
title: C++ Memory model 和 bit-field
date: "2022-01-01 21:54:00"
tags: [C++,Standard]
category: blog
---

C++ 设计的目的包括尽可能在语法上与 C 兼容，面向底层和上层等等，而内存模型和位域就是 C++ 从 C 继承来的语法和特性之一。

<!-- more -->

ISO/IEC 14882 Programming languages C++ 在第六章，第十章对内存模型和位域进行了如下阐述：

### 标准

#### 6.7.1 Memory model [intro.memory]

1. The fundamental storage unit in the C++ memory model is the _byte_. A byte is at least large enough to contain any member of the basic execution character set (5.3) and the eight-bit code units of the Unicode<sup>30</sup> UTF-8 encoding form and is composed of a contiguous sequence of bits<sup>31</sup>, the number of which is implementation defined. The least significant bit is called the _low-order bit_; the most significant bit is called the _high-order bit_. The memory available to a C++ program consists of one or more sequences of contiguous bytes. Every byte has a unique address.
2. [_Note 1_ : The representation of types is described in 6.8. — _end note_]
3. A _memory location_ is either an object of scalar type or a maximal sequence of adjacent bit-fields all having nonzero width.

    [_Note 2_ : Various features of the language, such as references and virtual functions, can involve additional memory locations that are not accessible to  programs but are managed by the implementation. — _end note_]
    Two or more threads of execution (6.9.2) can access separate memory locations without interfering with each other.
4. [_Note 3_ : Thus a bit-field and an adjacent non-bit-field are in separate memory locations, and therefore can be concurrently updated by two threads of execution without interference. The same applies to two bit-fields, if one is declared inside a nested struct declaration and the other is not, or if the two are separated by a zero-length bit-field declaration, or if they are separated by a non-bit-field declaration. It is not safe to concurrently update two bit-fields in the same struct if all fields between them are also bit-fields of nonzero width. — _end note_]
5. [_Example 1_ : A class declared as

    ```cpp

    struct {
        char a;
        int b:5,
        c:11,
        :0,
        d:8;
        struct {int ee:8;} e;
    }
    
    ```

    contains four separate memory locations: The member **a** and bit-fields **d** and **e.ee** are each separate memory locations, and can be modified concurrently without interfering with each other. The bit-fields **b** and **c** together constitute the fourth memory location. The bit-fields **b** and **c** cannot be concurrently modified, but **b** and **a**, for example, can be. — _end example_]

#### 11.4.10 Bit-fields [class.bit]

1. A *member-declarator* of the form

    *identifier<sub>opt</sub> attribute-specifier-seq<sub>opt</sub> : constant-expression brace-or-equal-initializer<sub>opt</sub>*

    specifies a bit-field. The optional *attribute-specifier-seq appertains* to the entity being declared. A bit-field shall not be a static member. A bit-field shall have integral or enumeration type; the bit-field semantic property is not part of the type of the class member. The constant-expression shall be an integral constant expression with a value greater than or equal to zero and is called the _width_ of the bit-field. If the width of a bit-field is larger than the width of the bit-field’s type (or, in case of an enumeration type, of its underlying type), the extra bits are padding bits (6.8). Allocation of bit-fields within a class object is implementation-defined.
    Alignment of bit-fields is implementation-defined. Bit-fields are packed into some addressable allocation unit.

    [_Note 1_ : Bit-fields straddle allocation units on some machines and not on others. Bit-fields are assigned right-to-left on some machines, left-to-right on others. — _end note_]
2. A declaration for a bit-field that omits the identifier declares an unnamed bit-field. Unnamed bit-fields are not members and cannot be initialized. An unnamed bit-field shall not be declared with a cv-qualified type.

    [_Note 2_ : An unnamed bit-field is useful for padding to conform to externally-imposed layouts. — _end note_]

    As a special case, an unnamed *bit-field* with a width of zero specifies alignment of the next bit-field at an allocation unit boundary. Only when declaring an unnamed bit-field may the width be zero.
3. The address-of operator & shall not be applied to a bit-field, so there are no pointers to bit-fields. A non-const reference shall not be bound to a bit-field (9.4.4).

    [Note 3 : If the initializer for a reference of type **const T&** is an lvalue that refers to a bit-field, the reference is bound to a temporary initialized to hold the value of the bit-field; the reference is not bound to the bit-field directly. See 9.4.4. — end note]
4. If a value of integral type (other than **bool**) is stored into a bit-field of width *N* and the value would be representable in a hypothetical signed or unsigned integer type with width *N* and the same signedness as the bit-field’s type, the original value and the value of the bit-field compare equal. If the value **true or false** is stored into a bit-field of type bool of any size (including a one bit bit-field), the original bool value and the value of the bit-field compare equal. If a value of an enumeration type is stored into a bit-field of the same type and the width is large enough to hold all the values of that enumeration type (9.7.1), the original value and the value of the bit-field compare equal.

    [_Example 1_ :

    ```cpp

    enum BOOL { FALSE=0, TRUE=1 };
    struct A {
        BOOL b:1;
    };
    A a;
    void f() {
        a.b = TRUE;
        if (a.b == TRUE) // yields true
        { /* ... */ }
    }

    ```

    — _end example_]

#### 6.7.1 内存模型 [intro.memory.zh]

1. C++ 内存模型中的基本存储单元是 _byte_。一个 byte （字节）的大小至少足够容纳基本执行字符集（basic execution character set (5.3) 的任何成员 和 由一个连续的比特序列组成的 8-bit （8 比特）单元的 Unicode<sup>30</sup> UTF-8 编码形式<sup>31</sup>，其成员数量由实现定义。最不重要的位被称作 _低阶位（low-order bit）_；最重要的位被称作 _高阶位（high-order bit）_。一个 C++ 程序可用的内存是由一个或多个连续的字节序列组成的。每个字节都有一个唯一的地址。
2. [_Note 1_ : 对类型的描述在 6.8. — _end note_]
3. 一个 _内存位置（memory location）_ 要么是一个标量类型的对象，要么是一个相邻位域的最大序列，它们都具有非零宽度。

    [_Note 2_ : 语言的各种特性，如引用和虚函数，可能涉及到程序无法访问的额外内存位置，但由实现管理。 — _end note_]

    两个或更多的执行线程 (6.9.2) 可以访问独立的内存位置，而不会相互干扰。
4. [_Note 3_ : 因此，一个位域和一个相邻的非位域是在不同的内存位置，因此可以由两个执行线程同时更新而不发生干扰。这同样适用于两个位域，如果一个被声明在嵌套结构体声明中，而另一个没有，或者两者被一个零长度的位域声明分开，或者它们被一个非位域声明分开。如果同一结构体中的两个位域之间的所有位域也是宽度为非零的位域，那么同时更新这两个位域是不安全的。 — _end note_]
5. [_Example 1_ : 一个类有如下声明

    ```cpp

    struct {
        char a;
        int b:5,
        c:11,
        :0,
        d:8;
        struct {int ee:8;} e;
    }
    
    ```

    包含四个分开的内存位置：成员 **a** 和位域 **d** 和 **e.ee** 都有不同的内存位置，可以由两个执行线程同时修改而不发生干扰。位域 **b** 和 **c** 共同构成了第四个内存位置。位域 **b** 和 **c** 不能同时修改，但是 **b** 和 **a**，如上，可以。 — _end example_]

#### 11.4.10 Bit-fields [class.bit.zh]

1. 一个 *成员声明* 以如下形式

    *标识符<sub>可选</sub> 属性序列<sub>可选</sub> **:** 常量表达式 花括号或等号初始化器	<sub>可选</sub>*

    定义一个位域。可选的 *属性序列* 属于被声明的实体。一个位域不应该是静态成员。一个位域应含有整数或者枚举，位域的语义属性不属于类成员。常数表达式应是一个值大于或等于 0 的整数常数表达式，并被称为位域的 _宽度_。如果一个位域的宽度大于该位域类型的宽度（或者在枚举类型的情况下，大于其底层类型的宽度），那么额外的位是填充位 (6.8)。位域在一个类对象中的分配是由实现定义的。
    位域的排列是由实现定义的。位域被打包到一些可寻址的分配单元中。

    [_Note 1_ : 位域在一些机器上跨越分配单元，而在另一些机器上不跨越。位域在一些机器上从右到左分配，在其他机器上从左到右分配。 — _end note_]
2. 一个省略了标识符的位域声明是对一个未命名的位域的声明。未命名的位域不是成员，不能被初始化。一个未命名的位域不应该用 cv 限定来声明。

    [_Note 2_ : 一个未命名的位域对于填充以符合外部强加的布局很有用。 — _end note_]

    作为一种特殊情况，一个宽度为 0 的未命名的 *位域* 指定了下一个位域在分配单元边界进行对齐。只有在声明一个未命名的位域时，其宽度才可以为零。
3. 取址运算符 & 不应该对位域使用，因为没有指向位域的指针。一个非常量引用不应该指向位域 (9.4.4)。

    [Note 3 : 如果 **const T&** 类型的引用的初始化器是一个指向位域的 lvalue，那么该引用被绑定到一个临时的初始化器上，以保持位域的值；该引用没有直接绑定到位域。参见 9.4.4. — end note]
4. 如果一个整数（和 **bool** 进行区分）被储存到了宽度为 *N* 的位域中，并且该值可以在一个假设的有符号或无符号的整数类型中表示，其宽度为 *N*，并且与该位域的类型具有相同的符号性，则原始值和位域的值比较相等。如果值 **true or false** 被存储到任何大小的 bool 类型的位域中（包括一个位域），原 bool 值和位域的值比较相等。如果一个枚举类型的值被存储到同一类型的位域中，并且其宽度足以容纳该枚举类型的所有值 (9.7.1)，那么原始值和位域的值比较相等。

    [_Example 1_ :

    ```cpp

    enum BOOL { FALSE=0, TRUE=1 };
    struct A {
        BOOL b:1;
    };
    A a;
    void f() {
        a.b = TRUE;
        if (a.b == TRUE) // yields true
        { /* ... */ }
    }

    ```

    — _end example_]

### 总结

虽然标准什么都说了，但是好像又没说什么，所以参考 [cppreference](https://zh.cppreference.com/w/cpp/language/bit_field) 总结如下：

#### 概述

bit-field 是用于极限压缩内存使用而诞生的特性，其通过按字节定义数据大小来进行内存高效利用：

```cpp

struct S {
    // 3 位：b1 的值
    // 2 位：不使用
    // 6 位：b2 的值
    // 2 位：b3 的值
    // 3 位：不使用
    unsigned char b1 : 3, : 2, b2 : 6, b3 : 2; // 3+2+6+2 = 13 大于8小于16所以占2字节
};

```

这个结构体中 b1，b2，b3 可以认为使用了同一块内存，因为 C++ 内存是以字节来划分的，而这 3 个变量不能按字节划分出独立的内存序列区域。

在并发中，只有对不同的独立字节序列进行修改才能保证安全，而 bit-field 不保证这一点。

```cpp

struct S {
    unsigned char b1 : 3, : 0, b2 : 6, b3 : 2;
};

```

改进版的代码是使用 `: 0` 来强迫后面的变量使用一块全新的字节序列作为储存空间，不去管之前的变量是否用完了之前储存空间所有的比特，仅具有对齐作用。

这时候 b1 就和 b2，b3 分离开，对 b1 和 b2，b3 分别进行并发修改是安全的。

位域成员和非位域成员可以混写，非位域成员对齐到下一个独立内存地址保证并发安全。

位域成员可以进行初始化和构造，允许大括号构造和等号构造。

#### 注意事项

当指定一个 int 类型变量使用小于 `sizeof(int)` 个 bit 储存时，编译器会尽可能确保可以正确的表示一部分长度：

```cpp

#include <iostream>
#include <iomanip>

struct S {
    int b1 : 8{-128}, b2 : 8{2}, b3 : 16{};
};
int main()
{
    S s;
    std::cout << s.b1 << std::endl;
    std::cout << s.b2 << std::endl;
    std::cout << sizeof(s) << std::endl;
    std::cout << std::setw(8) << std::setfill('0') << std::hex;
    std::cout << *(reinterpret_cast<unsigned int*>(&s)) << std::endl;
}

```

这个示例中，由于指定了使用 8bit 储存 int 的 b1，所以编译器将 8bit 的最高位设置为符号位，于是最小可以储存 -128，最高能储存 127。

如果数值不能储存到指定比特内，则由实现定义结果，例如 msvc 中，b1 = 128 == -128，129 == -127 等，编译器会保证溢出不会影响其他共享内存地址的位域成员。

<div class="ref-label">参考：</div>
<div class="ref-list">
<span >
ISO/IEC 14882:2020 Programming languages — C++
</span>
<a href="https://zh.cppreference.com/w/cpp/language/bit_field">
位域
</a>
</div>
