---
title: C++ 显式对象形参
date: "2022-06-20 12:18:00"
tags: [C++]
category: blog
---
之前的文章[C++ 非静态成员函数的引用限定修饰](https://mysteriouspreserve.com/blog/2022/06/19/Cpp-Reference-Quality-Member-Function/) 提到过 C++11 为了解决 `*this` 不区分左右值的问题，引入了 **引用限定**。其本质原因是 `this` 作为参数是隐式声明的。而 C++23 在 **引用限定**的基础上，大胆的提出了让 `this` 显式声明的语法，使得 `this` 不仅可以按左值引用，右值引用传递，甚至还可以以值的方式进行复制传递，同时也使得成员函数内部使用当前对象不再需要使用指针访问运算符。

<!-- more -->

C++23 起，非静态成员函数的声明可以通过在第一个形参前附关键词 `this` 来指定该形参为显式对象形参：

```cpp

struct X
{
    void foo(this X const& self, int i); // 同 void foo(int i) const &;
//  void foo(int i) const &;             // 错误：已经声明
 
    void bar(this X self, int i); // 按值传递对象：复制 *this
};

```

引用限定的版本和附带 `this` 的版本不能同时存在（实际上就是一个函数），同时附带 `this` 的版本的内部不再具有 `this` 指针，需要使用参数名访问当前对象。

对于成员函数模板，显式对象形参的类型和值类别可以被推导，因此该语言特性也被称为“推导 `this`”：

```cpp

struct X
{
    template<typename Self>
    void foo(this Self&&, int);
};
 
struct D : X {};
 
void ex(X& x, D& d)
{
    x.foo(1);            // Self = X&
    std::move(x).foo(2); // Self = X
    d.foo(3);            // Self = D&
}

```

这使得成员函数的带 `const` 限定和不带 `const` 限定版本只需要一次声明，编译器可根据推导结果选择合适的类外部的函数实现。

此外，显式对象形参会推导成派生类型，因此可以简化 CRTP：

```cpp

// 一个 CRTP 特性
struct add_postfix_increment
{
    template<typename Self>
    auto operator++(this Self&& self, int)
    {
        auto tmp = self; // Self 会被推导成 some_type
        ++self;
        return tmp;
    }
};
 
struct some_type : add_postfix_increment
{
    some_type& operator++() { ... }
};

```

指向有显式对象形参的成员函数的指针是通常的函数指针，而不是到成员的指针：

```cpp

struct Y
{
    int f(int, int) const&;
    int g(this Y const&, int, int);
};

auto pf = &Y::f;
pf(y, 1, 2);              // 错误：不能调用指向成员函数的指针
(y.*pf)(1, 2);            // OK
std::invoke(pf, y, 1, 2); // OK
 
auto pg = &Y::g;
pg(y, 3, 4);              // OK
(y.*pg)(3, 4);            // 错误：pg 不是指向成员函数的指针
std::invoke(pg, y, 3, 4); // OK

```

有显式对象形参的成员函数不能是静态成员函数或虚函数，也不能带有 cv 或引用限定符。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/language/member_functions#.E8.99.9A.E5.87.BD.E6.95.B0.E5.92.8C.E7.BA.AF.E8.99.9A.E5.87.BD.E6.95.B0">
显式对象形参
</a>
</div>
