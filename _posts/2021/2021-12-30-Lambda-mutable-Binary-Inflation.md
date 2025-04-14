---
title: lambda mutable 的慎用及二进制膨胀
date: "2021-12-30 17:39:00"
tags: [C++,STL]
category: blog
---

这篇文章的灵感来源于我加入的两个 C++ 律师群，起因分别是滥用 mutable 和关于二进制膨胀的讨论。

<!-- more -->

### 慎用 mutable

首先参考如下代码：

```cpp

#include <string>
#include <iostream>
#include <algorithm>

int main() {
    std::string str2 = "Text with some whitespaces";
    int i{};
    std::cout << str2 << std::endl;
    str2.erase(std::remove_if(str2.begin(),
        str2.end(), [i](unsigned char x)mutable {
            if (!i && std::isspace(x)) { i=1; return 1; }
            else return 0; }));
    std::cout << str2.c_str() << std::endl;
}

```

std::remove_if 的作用是返回满足条件的容器的成员的迭代器，这个可变 lambda 通过捕获一个 i 使得这个 lambda 只能返回一次 1(true)。

整个算法的意思是删除字符串中的第一个空格。

一切看似那么的美好，直到你将它运行起来，就会发现算法实际上删除了两个空格而不是一个。

即使你绞尽脑汁，也不一定想出这是为什么，实际上这是因为 lambda 自身的性质外加错误使用造成了未定义行为。

首先来看 std::remove_if 的实现：

```cpp

template<class ForwardIt, class UnaryPredicate>
ForwardIt remove_if(ForwardIt first, ForwardIt last, UnaryPredicate p)
{
    first = std::find_if(first, last, p);
    if (first != last)
        for(ForwardIt i = first; ++i != last; )
            if (!p(*i))
                *first++ = std::move(*i);
    return first;
}

```

会发现，被传入 remove_if 的 lambda 在算法内又被传递给了 find_if 这个算法。

由于 **lambda 实际上是一个类的对象**，所以复制一个 lambda 实际上复制了一个对象。

在这种情况下，find_if 复制了一次 lambda，造成两个 lambda 并不共享同一个 i，于是两个 i = 0 对应空格删除了两次。

这种情况就属于对 mutable 的滥用，换句话说，C++ 语法和算法库的特性导致算法只有在接收 const 的 lambda 作为参数时才能做到正确。

### 防止 lambda 代码膨胀

在 C++ 的争论中，模板导致的二进制膨胀一直饱受批评，但是模板自身其实做到了开销平衡，不过 lambda 的一些细节值得推敲。

问题：

```cpp

#include <algorithm>

void foo(int* f,int* l)
{
    std::sort(f,l,[](int a,int b)
    {
        return a>b;
    });
}

void foo2(int* f,int* l)
{
    std::sort(f,l,[](int a,int b)
    {
        return a>b;
    });
}

```

foo 和 foo2 虽然代码一模一样，但是编译器仍然会生成两份 lambda，所以将 lambda 抽象出来进行复用：

```cpp

#include <algorithm>

auto const a = [](auto a, auto b)
{
    return a > b;
};
void foo(int* f, int* l)
{
    std::sort(f, l, a);
}
void foo2(int* f, int* l)
{
    std::sort(f, l, a);
}

```

此时，lambda 的二进制膨胀问题得到了初步的解决。

<!--
### const 可对 lambda 进行额外保证（guarantee）

```cpp

#include <string>
#include <algorithm>

int main() {
    const int a1 = 1;
    const int b1 = 1;
    auto a = [](unsigned char x){return std::isspace(x);};
    auto b = [](unsigned char x){return std::isspace(x);};
    a('a');
    b('b');
}

```
这是一个非常简短的代码，可以直接看出，常量 b = 常量 a，即 a 和 b 在逻辑上完全等价。

那么可以直接将 b 都改成 a 进行代码性能的优化，这就是 const 对常量对象的保证。

那么对于 lambda，lambda 在语义上是一个函数对象，那么两个逻辑等价的 const 函数对象就可以优化为一个函数对象。

编译器对于 lambda 的实现通常是生成一个隐式的类，并通过重载 () 运算符实现函数调用接口。

现在的问题在于，const 的 lambda 被编译器生成的函数的 const 特性是在调用上，而不是对象上，这就造成了虽然 const 的 lambda 作为一个函数对象，不具有 const 的性质，即这个函数对象（类对象，包含 lambda）不为 const。
-->