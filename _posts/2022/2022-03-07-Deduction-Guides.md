---
title: C++ 推导指引
date: "2022-03-07 18:54:00"
tags: [C++]
category: blog
---

C++17 中，关于模板的一个功能修改是增加了模板参数类型推导指引（Deduction guides），该特性旨在解决 C++ 中模板参数推导缺乏类型转换以及模板参数缺乏灵活的转换方式问题，可以说是模板的一大杀器。

<!-- more -->

推导指引的基本语法是 `template<typename T> S(T) -> S<T>;`

推导指引可以用于任何模板参数为类型参数的地方，例如 [^1]：

[^1]: 参考 C++ Templates 2.9

```cpp

template <typename T>
class MyContainer
{
    T t;
public:
    MyContainer(T para) :t(para) {}
}

MyContainer(const char*) -> MyContainer<std::string>;
// 此推导指引目的是为了特化构造函数，此时可以省略 template<typename T>，因为没有 T 被使用

```

由于 C++17 开始支持自动模板类型推导，所以某些情况下模板参数可以不用显式声明。而对于 C 风格字符串，则值为参数会推导出 `const char*`，引用为参数会推导出 `char[N + 1]`，`N` 为字符串长度，而大部分情况下我们既不需要 `const char*`，也不需要 `char[N + 1]`，而是 `std::string`。此时则可用推导指引辅助编译器进行推导，对类型进行特化。

推导指引也可用于可变参数模板 [^2]：

[^2]: 参考 C++ Templates 4.4.4

```cpp

namespace std {
    template<typename T, typename... Ts> array(T, Ts...)
        -> array<enable_if_t<is_same_v<T, Ts> && ...>, T>,
            (1 + sizeof...(Ts))>; // 此推导指引目的是对每个参数的类型进行提取
}

```

上面的推导指引是 C++17 STL 的一部分，用于辅助 `std::array` 进行严格的类型匹配，确保不会存在歧义。

推导指引还可以用于帮助使用某些概念 [^3] ：

[^3]: 参考 [Stack overflow](https://stackoverflow.com/questions/40951697/what-are-template-deduction-guides-and-when-should-we-use-them)

```cpp

template<typename Iterator> vector(Iterator b, Iterator e) -> 
    vector<typename std::iterator_traits<Iterator>::value_type>;

```

此处指引旨在帮助 `vector` 使用老式迭代器进行元素构造时，能够选择正确的重载。

由于 C++17 不支持聚合类模板的聚合初始化的自动类型推导，所以可以使用推导指引辅助聚合初始化 [^4] ：

[^4]: 参考 C++ Templates 15.12.1

```cpp

template<typename T>
struct foo
{
    T val;
}

template<typename T> A(T) -> A<T>;

int main()
{
    A<int> a1{42}; // OK
    A<int> a2(42); // Always ERROR
    A<int> a3 = {42}; // OK
    A a4 = 42; // Always ERROR
    A a5 = {42} // with guide
    A a6{42} // with guide
}

```

<div class="ref-label">注：</div>
