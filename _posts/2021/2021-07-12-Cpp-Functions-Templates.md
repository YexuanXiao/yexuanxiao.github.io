---
title: C++ 函数模板
date: "2021-07-12 13:42:00"
tags: [C++, docs]
category: blog
---
C++ 的很多特性是随着编译器的升级而一同出现的，而模板是其中的一个代表。

在初期编译器不那么智能的时候，变量的类型匹配很大程度上依靠于指定的类型，但随着编译器的发展，为了纠正程序的错误，编译器被给予了推算变量类型的能力。既然编译器可以自己推算出一些类型，那么就代表在一些情况下可以不用指定类型而让编译器去推算。模板（templates）就是 C++ 依此而改造并加以设计的新特性。

<!-- more -->

本文主要介绍函数模板，关于类模板将在下一篇文章中介绍。

函数模板的基本形式：`template <parameter-list> declaration`

其中 `parameter-list` 是参数列表，这个列表使用 `class T` 或者 `typename T1` 定义一个参数，T 和 T1 是一种新的参数类型。

用 class 或者 typename 完全属于个人习惯或者项目约定俗成， **并没有实际区别** 。

`declaration` 是函数声明，在这个函数中可以使用参数列表中定义的新的参数类型。

例如：

```cpp

template <class T> void swap(T a1, T a2) {
    T temp = a1;
    a1 = a2;
    a2 = temp;
}

```

这是一个没有返回值的函数模板，这个模板的作用和普通的函数作用一样。

如果 `swap` 的传入参数 a1 和 a2 为 int 类型，那么在编译的时候，函数会自动将 T **"调整"** 为 int 类型，这个过程可以被称为“实例化”。

有返回值的情况下，该问题就变得略显复杂了：

C++ 支持 *隐式类型转换* ，所以如果是这种形式： `return a1/a2` 其中 a1/a2 是 int，那么这句的结果是一个 double，此时就有三个问题摆在你面前：

1. 如果你用一个 int 接收这个返回语句，那么编译器是将这个返回值的类型设置为 int 还是 bouble？
2. 即使你用 double 接收返回值，但是实际上你只传入了 int，换句话说此时编译器做了两步类型推导，这似乎是不合理的
3. 你没有接收返回值，此时编译器该如何选择？

实际上编译器 ***从来不会根据接收的时候使用的类型假定返回值类型*** 。

还有一种情况：当你的 ***返回值类型和函数模板没关系*** 的时候，实际上编译器是可以推导出正确的返回值类型的。

```cpp

#include <iostream>

template <class T>
auto Compare(T &a, T &b)
{
	return a > b ? 1 : 0;
}

template <class T>
auto Divis(T &a, T &b)
{
	return a / b;
}

template <class T>
auto Minus(T &a, T &b)
{
	return a - b;
}

template <class T>
T Plus(T &a, T &b)
{
	return a + b;
}

int main()
{
	int a = 10;
	int b = 20;
	std::cout << Compare(a, b) << std::endl;
	std::cout << Divis(a, b) << std::endl;
	std::cout << Minus(a, b) << std::endl;
	std::cout << Plus(a, b) << std::endl;
}

```

其中 Divis，Compare 和 Minus 函数需要 C++14 才能编译，因为 C++11 ***不支持返回值的类型推导*** 。

并且 Divis，Compare 和 Minus 函数推导的返回值为 int，Plus 函数的返回值类型 ***依赖于函数声明而不是函数值里的返回语句*** 。

除了这两种方法以外，还可以使用 **尾置返回类型**：

```cpp

#include <iostream>

template <class T>
auto Pointer(T &a) -> decltype(&a)
{
	return &a;
}

int main()
{
	int a = 10;
	std::cout << Pointer(a) << std::endl;
	std::cout << &a << std::endl;
}

```

注意 Compare 函数使用了比较运算符，而对于自定义的类可能不包含比较运算符的 **重载函数**，此时可以 ***重载函数模板*** ：

```cpp

template <>
bool P_Compare(P &p1, P &p2){
    //compare
}

```