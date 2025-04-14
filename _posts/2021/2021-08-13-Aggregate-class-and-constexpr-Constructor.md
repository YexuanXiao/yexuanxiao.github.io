---
title: C++ 聚合类，字面值常量类和 constexpr 构造函数
date: "2021-08-13 04:03:00"
tags: [C++, docs]
category: blog
---
C++ 用 constexpr 关键词设计了一系列辅助编译器优化的特性，此前讲到 constexpr 函数可以在编译期求值，那么自然也可以通过给类设定一个构造函数，使编译器在编译阶段对类求值，进行优化。

<!-- more -->

要使用 constexpr 函数首先要理解聚合类这个概念。

简单来说，聚合类是一个类似 C 语言的结构体的类，详细分析参考 [聚合初始化](https://zh.cppreference.com/w/cpp/language/aggregate_initialization)，主要表现为成员都是 public，没有构造函数，没有基类等。

如果一个类是聚合类，那么就可以使用聚合初始化：

```cpp

class Location{
public:
    int x;
    int y;
};
Location pt = {10, 10};

```

在聚合类的基础上，还可以衍生出一个新的概念，字面值常量类。

顾名思义，字面值常量类是可以被看做字面值常量的类，那么就对它有如下要求：

1. 数据成员必须都必须是字面值类型或者字面值常量类。
2. 类至少含有一个 constexpr 构造函数。
3. 如果一个数据成员含有类内初始值，则初始值必须是常量表达式；如果成员属于某种类，则这个成员必须使用这种类的 constexpr 构造函数构造。
4. 类必须使用析构函数的默认定义。

即保证该类可以在编译期求值（有确定的值）。

那么首要的，字面值常量类需要 constexpr 构造函数：

```cpp

class Location{
public:
    constexpr Location(int _x, int _y) :x(_x),y(_y){}
    constexpr Location() :Location(0,0){}
    int x;
    int y;
};

constexpr Location l = {10, 10};

```

这时，Location 就从聚合类变为了字面值常量类，编译器就会对 Location 的成员进行编译期求值。

C++ 的 initializer_list 类模板其实就是一个字面值常量类，保证了其能在编译期被优化掉，避免产生性能上的额外消耗。