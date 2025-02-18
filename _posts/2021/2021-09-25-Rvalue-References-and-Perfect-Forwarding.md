---
title: C++ 右值引用和完美转发
date: "2021-09-25 00:29:00"
tags: [C++, docs]
category: blog
---
C++11 开始增加了移动语义和右值引用，这使得函数的重载变得更加复杂：你可能需要单独为右值参数设计一个函数，而这个函数明显在功能和实现上与左值参数是一样的，那么就需要有一个东西去统一函数参数的左值和右值，于是完美转发被设计出来。

<!-- more -->

### std::forward

上一篇文章 [C++ std::move](/blog/2021/09/23/std-move/) 中提到过 `std::remove_reference` 和 `static_cast` 用于实现 `std::move`，而 `std::forward` 也是用这两个组件实现的：

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

std::forward 会将输入的参数原封不动地传递到下一个函数中，如果输入的参数是左值，那么传递给下一个函数的参数的也是左值；如果输入的参数是右值，那么传递给下一个函数的参数的也是右值。

### 引用折叠

引用折叠是 C++ 为了实现完美转发的语法，由于 C++ 无论在应用上还是语义上都不需要对引用的引用，所以 C++ 选择将引用的引用转化成直接的引用，具体规则如下：

+ `T&& && -> T&&`
+ `T& & -> T&`
+ `T& && -> T&`
+ `T&& & -> T&`

引用折叠用于模板的参数类型推导，auto 和 decltype。

#### 万能引用

所谓万能引用，实际上是引用折叠的一个部分：

+ `T&& && -> T&&`
+ `T&& & -> T&`

换句话说，用右值引用作为参数声明，实参可为左值引用和右值引用，而用左值引用作为参数声明，实参只能为左值引用。

### 右值引用

右值引用只能绑定到右值上，左值除了可以绑定到左值上，在某些条件下还可以绑定到右值上。这里某些条件绑定右值为：常量左值引用绑定到右值，非常量左值引用不可绑定到右值。

```cpp

std::string f()
{
    return string("abc");
}

​void g()
{
    const std::string &s = f(); // still legal?
    std::cout << s << std::endl;
}

```

`g` 是合法的，原因是 `s` 是个左值，类型是常量引用，而 `f()` 返回右值，前面提到常量左值引用可以绑定到右值。

可以用下面的例子来说明引用折叠：

```cpp

template<typename T>
void f(T&& param);

int a;
f(a);   // 传入左值,那么上述的 T&& 是左值引用
f(1);   // 传入右值,那么上述的 T&& 是右值引用

```

右值引用最常见的特性是延长临时对象的生命周期：

```cpp

class A
{
public:
    int a = 0;
};

template <class T1, class T2>
void print_is_same()
{
    std::cout << std::is_same<T1, T2>() << std::endl;
}

int main()
{
    A a{}; // 这里使用了复制构造和默认构造，C++17 开始会直接被优化为默认构造（使用了返回值优化）
    A b = A();
    A &&c = A(); // 这里使用了右值引用，b 接管了临时对象，右值引用是左值
    A &d = a;
    print_is_same<A, decltype(a)>();
    print_is_same<A, decltype(b)>();
    print_is_same<A, decltype(c)>();
    print_is_same<A &&, decltype(c)>();
    std::cout << (typeid(a) == typeid(A)) << std::endl;
    std::cout << (typeid(A) == typeid(b)) << std::endl;
    std::cout << (typeid(A) == typeid(c)) << std::endl;
    std::cout << (typeid(A) == typeid(d)) << std::endl;
}

```

虽然 `c` 是右值引用，但是在使用的过程中，还是如同普通的左值引用。

尤其需要注意的是，不要对临时对象使用 `std::move`，因为 `std::move` 不更改临时对象的生命周期，因此临时对象会在当前语句执行完成时销毁，导致这个引用变为悬垂引用。

### 完美转发

完美转发是指在一个函数接收右值时，可以将这个右值继续传递给下一个函数。

**右值引用是左值** ，所以当右值进入函数后，右值变为具名对象，即左值，此时再次传递这个对象，传递的是左值。

而完美转发是指让右值可以不断地以右值的身份传递下去：

```cpp

#include <iostream>

void F(int x)
{
    std::cout << "右值" << std::endl;
}
void F(int &&x)
{

    std::cout << "左值" << std::endl;
}

template <class A>
void G(A &&a)
{
    return F(std::forward<A>(a)); //1
    //return F(a); //2
}

int main()
{
    int i = 2;
    G(i); // 正确
    G(5); // 错误
}

```

这段代码实际上无法编译，但是证实了完美转发的存在，并且包含了右值引用，引用折叠。

分析上面的代码，`G(i)` 将一个左值传递给了 `G`，`a` 为左值引用，并且通过 `std::forward` 传递给了 `void F(int x)`，中间经历了引用折叠 `T&& & -> T&`

而 `G(5)` 将一个右值传递给了 `G`，`5` 是右值，通过 `std::forward` 传递后还是右值，由于 `5` 既是右值，又是 `int`，所以编译器无法判断使用 `F` 的哪个重载版本，于是编译错误。

如果 `G` 不使用 `std::forward`，那么无论给 `G` 传入什么值，都会变为具名 `a`，即左值，在下一次传递时永远会传递给 `void F(int x)`，因为右值引用永远只能传入右值或者常量。

注意，引用折叠只发生在模板的参数类型推导，`auto` 和 `decltype`，所以函数 `F` 不存在引用折叠，而 `G` 是函数模板，所以存在引用折叠，也可以做到万能引用。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/utility/forward">
std::forward
</a>
<a href="https://www.cnblogs.com/catch/p/3507883.html">
C++11 中的 move 与 forward
</a>
<a href="https://www.zhihu.com/question/48367350">
C++ 完美转发为什么必须要有 std::forward？ - 裴浩
</a>
</div>