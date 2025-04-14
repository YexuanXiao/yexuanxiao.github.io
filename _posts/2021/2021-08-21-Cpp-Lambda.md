---
title: C++ lambda
date: "2021-08-21 19:08:00"
tags: [C++, docs]
category: blog
---
C++11 开始，C++ 正式支持 lambda 表达式。lambda 表达式简单来说就是一个可以获得当前状态的可传递的可调用对象。

<!-- more -->

C++11 之前，C++ 只有两种可调用对象：函数指针和重载类的括号运算符。函数指针是从 C 继承而来的，优点是语法简单，缺点是只能依靠参数，并且不能在函数内声明，且函数指针不能被内联优化，因为编译器很难知道指针指向了哪个函数，特别是在存在继承的情况下。而重载类的括号运算符需要写整个类，比较麻烦，而 lambda 表达式就是在此情况下的最优解。

### 综述

一个完整的 lambda 表达式由 5 部分组成：

```cpp

[ captures ] <template params>  ( params ) lambda-specifiers { body }

```

1. captures：捕获列表，捕获列表中的变量是当前函数内拥有的变量，并且捕获后可在 lambda 中使用
2. 模板形参，C++20 开始支持 lambda 模板
3. 参数列表，类似普通函数
4. lambda 说明符，包括 mutable，constexpr，consteval（C++20），异常说明（noexcept 等）和尾置返回类型
    1. mutable：指出被捕获的变量可以修改
    2. constexpr / consteval：指出该 lambda 表达式可视为常量表达式
    3. 异常说明：noexcept 无异常或者 throw() 抛出指定异常
    4. 尾置返回类型：使用箭头运算符指出返回类型
5. 函数体

lambda 表达式是一个可调用对象，并且自身没有名称。不过你可以使用 auto + 赋值运算符手动给予一个名称，并使用函数调用运算符像普通函数一样调用。

lambda 可以直接在函数体后面加上调用运算符直接使用。

### 捕获列表

lambda 的一个特点是 lambda 可以使用捕获列表获取当前函数作用域范围内的非 static 变量，无需使用参数传递，同时，当前函数作用域内的非 static 变量不能直接在 lambda 内使用，必须先被捕获：

```cpp

auto size = 10;
auto wc = find_if(words.begin(), words.end(),
    [size](const string &a)
        { return a.size() >= size; });

```

> 这里 words 是单词列表，words.begin() 为返回列表中第一个单词的迭代器。
> <br>find_if 的第三个参数是一个可调用对象，对这个对象传入迭代器转换后的元素，这个对象返回一个 bool 来判断是否退出。
> <br>结果为不小于 size 的第一个单词的迭代器。

对于当前函数内的 static 变量和函数之外的变量，lambda 可以直接使用。

如果想要捕获多个对象，使用逗号分开即可。

#### 值捕获

lambda 默认捕获的对象是原本对象的一个复制，并且该复制是在 lambda 声明的时候进行复制，而不是动态的去在调用时复制，并且只有该对象可复制时才允许进行值捕获。

#### 引用捕获

对于某些不可复制的对象，必须使用引用捕获的方式。使用引用捕获必须保证该对象在 lambda 调用时是存在的，例如脱离原函数作用域或者被析构，否则将产生错误。

```cpp

auto size = 10;
auto wc = find_if(words.begin(), words.end(),
    [&size](const string &a)
        { return a.size() >= size; });

```

#### 隐式捕获

如果需要捕获当前可获得的所有对象，那么可以使用隐式捕获：

```cpp

auto size = 10;
auto wc = find_if(words.begin(), words.end(),
    [=](const string &a)
        { return a.size() >= size; });

```

使用 `=` 的隐式捕获是对所有对象进行值捕获，更换为 `&` 后为引用捕获。

如果既想进行隐式值捕获，又想进行引用捕获，则隐式值捕获写在前面。

### mutable 和 const

对于使用值捕获的对象，默认禁止修改，如果需要对其进行修改，需要加上 mutable 关键词。

对于引用捕获的对象，是否可以修改取决于捕获之前，该对象是否为 const。

### 返回值

C++11 仅允许 lambda 的函数体只有一条 return 语句时才不用显式指出返回值类型，C++14 开始允许编译器对返回值进行更复杂的推导摆脱了此限制。

例如当函数中有两个返回语句，使用尾置返回类型：

```cpp

auto size = 10;
auto wc = find_if(words.begin(), words.end(),
    [size](const string &a) -> bool
        { if (a.size() >= size){
            return true;
        } else {
            return false;
        }; });

```

C++14 中可以省略尾置返回类型，前提是不同分支能推导出相同的类型，在有隐式转换需求的情况下还是需要尾置返回类型：

```cpp

auto size = 10;
auto wc = find_if(words.begin(), words.end(),
    [size](const string &a)
        { if (a.size() >= size){
            return true;
        } else {
            return false;
        }; });

```

### 为什么使用 lambda

对于简单操作，使用函数就可以替换 lambda，内联函数相比 lambda并没有性能上的差距。

但是，find_if 算法接收到的可调用对象只能接收一个参数，此时你无法传递 size 到 find_if。或者你需要重载调用运算符，这样不直观。

### 泛型 lambda（C++14）

由于 lambda 的参数类型在编译期就可以确定，所以 C++14 支持了泛型 lambda，即使用 auto 关键词来让编译器自动推导实参类型：

```cpp

auto glambda = [](auto a, auto&& b) { return a < b; };// C++14
bool b = glambda(3, 3.14); // ok

```

这实际上是一个隐式的成员模板 [^1]，这个 lambda 会在编译阶段给予具体类型并且在可能的情况下进行内联。

[^1]: 参考 C++ Templates 5.5.2 和 15.10.6

并且这其中隐含一个信息：对 lambda 进行赋值使其具名成为的“左值”，实际上会在编译阶段优化掉，保持 lambda 是纯右值。

### lambda 模板（C++20）

C++14 开始支持了泛型 lambda，使 lambda 的参数类型可以使用参数类型推导；而 C++20 在此基础上使 lambda 彻底支持模板，从而可以使用偏特化，直接进行类型萃取和 concept：

```cpp

[]template<class T>(T x) {}; 
[]template<class T, int N>(T (&a)[N]) {}; // 偏特化 
[]<class T>(T x) {}; // 省略template的写法
[]<class T>(vector<T> vec){}; // C++20之前获得T的类型需要进行类型萃取
[]template<typename ...T>(T&& ...args){
    return foo(std::forward(args)...); }; // 完美转发
[]template<std::integral T>(T a){}; // 使用concept

```

### constexpr lambda

C++17 开始引入了 constexpr 关键词用于编译期求值，lambda 作为模板也可以编译期求值，所以 lambda 可以被声明为 constexpr。

### 初始化捕获

```cpp

int x = 4;
auto y = [&r = x, x = x + 1]() -> int
{
    r += 2;
    return x * x;
}(); // 更新 ::x 到 6 并初始化 y 为 25。

```

初始化捕获可以模仿参数传递的行为，即给实参一个新的名字，并且初始化捕获也用于不能值捕获的情况（比如智能指针），此时可以使用 std::move + 初始化捕获。

### 捕获 this 指针

C++11 只允许按值捕获 this 指针，即捕获指针指向的地址，但是由于 this 指针是对当前对象的一个引用，C++17 中添加了 *this 捕获，即按值捕获当前对象的成员变量。

C++20 之前使用默认按值捕获的同时会捕获 this 指针，C++20 要求必须显式捕获 this 或者 *this。

lambda 设计最初就支持默认捕获，但是并不推荐。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://en.cppreference.com/w/cpp/language/lambda">
Lambda expressions
</a>
<span>
C++ Primer 第五版 P388
</span>
</div>
<div class="ref-label">注：</div>