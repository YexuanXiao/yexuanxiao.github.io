---
title: C++ constexpr if 和 constexpr lambda
date: "2021-09-12 15:50:00"
tags: [C++, docs]
category: blog
---
C++17 开始，编译器添加了 constexpr if 用于模板的编译期判断，以及 constexpr lambda 用于常量优化。

<!-- more -->

在之前的文章 [C++ 可变参数模板](/blog/2021/08/11/Cpp-Variadic-Template/) ，有这样的一个函数模板：

```cpp

void variadicPrint()
{
    std::cout << std::endl;
}

template <typename T, typename... Ts>
void variadicPrint(T Head, Ts... Tail)
{
    std::cout << Head;
    variadicPrint(Tail...);
}

```

由于可变参数的参数数量可变，所以不得不通过重载可变参数函数模板来实现递归的退出。

这是由于 `void variadicPrint(T Head, Ts... Tail)` 要求至少一个参数，但是 tail 最后会变为 0 个元素被传递给自身，这也隐含着一个事实：tail 可为 0。

这种写法被称作 SFINAE（Substitution failure is not an error），即编译器对不同重载模板依次匹配，选择最优模板，如果没有最优模板，则认为是错误。

而 C++17 引入了 constexpr if 可以将这两个模板合并为一个：

```cpp

template <typename T, typename... Ts>
void variadicPrint(T head, Ts... tail)
{
    std::cout << head << std::endl;
    if constexpr (sizeof...(tail) > 0)
        variadicPrint(tail...);
}

```

实际上这就是让编译器只在 tail > 0 的时候才递归的展开自身。

C++17 开始，当一个常量表达式中允许对其捕获或引入的每个数据成员进行初始化时，lambda表达式可以被声明为constexpr 或在常量表达式中使用（默认constexpr）。

简单来说就是 lambda 可用于 constexpr 的环境中，并且在 constexpr 环境中使用的 lambda 默认 constexpr。

```cpp


constexpr int Increment(int n)
{
    return [n]{ return n + 1; }();
}

int main()
{
    constexpr int y = 32;
    auto answer = [y]() constexpr
    {
        int x = 10;
        return y + x;
    };
    auto answer1 = [](int n)
    {
        return 32 + n;
    };

    constexpr int response = answer1(10);

    auto Increment = [](int n)
    {
        return n + 1;
    };

    constexpr int (*inc)(int) = Increment;

    std::cout << answer() << std::endl;
}

```



<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://docs.microsoft.com/en-us/cpp/cpp/lambda-expressions-constexpr?view=msvc-160">
constexpr lambda expressions in C++
</a>
</div>