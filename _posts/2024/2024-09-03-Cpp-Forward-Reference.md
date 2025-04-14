---
title: C++ 转发引用
date: "2024-08-31 05:07:00"
tags: [C++]
category: blog
---
C++ 11 发明右值引用后，结合模板带来了一个优雅的参数传递方案即万能引用。许多教程使用“引用折叠”来描述模板在实例化 `T&&` 的行为（例如之前的文章[右值引用和完美转发](/blog/2021/09/25/Rvalue-References-and-Perfect-Forwarding/)），但实际上这并不准确。作为库作者，可能还需要更接近真相。

<!-- more -->

首先要承认，万能引用是一种偏离主题的叫法。万能引用实际上只有依托转发的时候才有实际意义，它本身只是一个工具。单纯强调万能只会造成拿锤子看什么都是钉子的结果。

转发引用也就是左值实参保留为左值引用，右值实参保留为右值引用，这样靠提取 `T` 的类型就可以进一步把参数原样转发给其他同时接受左值和右值的函数（典型的例如 `std::string` 的构造函数），或者分情况处理。之前的文章[右值引用和完美转发](/blog/2021/09/25/Rvalue-References-and-Perfect-Forwarding/)已经介绍了如何使用和一些“基本”原理。

转发引用实例化可能会存在 `U&`，`const U&` 和 `U&&` 三种情况，这三者除了表达转发外，还可以将前两者划分为复制语义，将后者划分为移动语义。

```cpp

#include <string>

template<typename T, template U>
void emplace(T& c, U&& v);   // 不考虑如何实现

int main()
{
    std::string a;
    std::string const b;
    std::string c;

    std::vector<string> t;
    emplace(t, a);            // #1
    emplace(t, b);            // #2
    emplace(t, std::move(c)); // #3
}

```

#1，#2，#3 分别会使 `emplace` 实例化出 `string&`，`string const&` 和 `string&&` 三个版本，也就是 `U` 是 `string&`，`string const&` 和 `string`

在这个例子中，#1 的效果完全等于 #2，都表达的是复制语义，实际上除了纯粹的转发代码外，转发引用的 `string&` 和 `string const&` 一定最后表达的是复制语义。

`const` 不能修饰引用，因此如果一个 `T&` 等于 `const string&`，那么 `T` 就是 `const string`，因此就会产生前两个变体。

值得注意的是，在 #3 中，`U` 是 `string` 而不是 `string&&`，这可能与之前的教程不符，但这正是 C++ 标准真正规定的。也就是在实参是右值的时候 `T&&` 直接作为右值引用完美匹配实参了；只有当实参是左值的时候，才会使得 `T` 是左值引用，然后该参数忽略原有的 `&&`。也就是说，引用折叠只存在于实参是左值的情况。

重新复习 `std::forward` 的实现：

```cpp

template <typename T>
constexpr T&& forward(std::remove_reference_t<T> &t) noexcept
{
    return static_cast<T&&>(t);
}

template <typename T>
constexpr T&& forward(std::remove_reference_t<T> &&t) noexcept
{
    return static_cast<T&&>(t);
}

```

现在编写一个使用完美转发的函数模板 `foo`：

```cpp

template<class T> void foo(T&& t){ std::forward<T>(t); }

```

`std::forward` 分别提供 `T&&` 和 `T&` 的重载，返回 `T&&`，那么当 `foo` 的实参是右值，就会匹配 `std::forward<int>(int&&)`，返回 `int&&` 也就是右值；实参是左值，`T` 是 `int&`，就会匹配 `std::forward<int&>(int&)`，返回值由 `int& &&` “折叠为” `int&`，也就是返回左值。
