---
title: C++ 异常 - 智能指针 
date: "2022-04-08 18:28:00"
tags: [C++]
category: blog
---

之前的文章[C++ 异常 - 类和异常](/blog/2022/04/07/C++-Exception-class-and-RAII/)讲述了 C++ 的异常机制，但是单纯学会异常处理的概念和语法是完全不够用的，大部分人对于异常的了解就止步于此了。认识的不足会导致对异常存在非常大的误解。本文从异常出发，讲述 C++11 引入的 `std::unique_ptr` 和 `std::shared_ptr` 两种智能指针如何解决一部分的异常安全问题。

<!-- more -->

本文是《C++ 异常》系列第二篇文章。

《C++ 异常》目录：

1. [C++ 异常 - 类和异常](/blog/2022/04/07/Cpp-Exception-Class-and-RAII/)
2. 本文
3. [C++ 异常 - 资源管理](/blog/2022/06/18/Cpp-Exception-Resource-Management/)
4. [C++ 异常 - 容器和 std::vector](/blog/2022/04/07/Cpp-Exception-Container-and-std-vector/)
5. [C++ 异常 - 守卫](/blog/2024/07/29/Cpp-Exception-Guards/)

### 智能指针基础

#### `std::unique_ptr`

顾名思义，`std::unique_ptr` 是一种独占所有权的指针容器，实际上就是一个异常安全的 Handle 类模板，独占效果是使用移动来实现的。

由于 `std::unique_ptr` 通过析构函数无条件的释放内存，所以可以保证发生异常时资源不泄露。

之前的文章 [C++ 异常 - 类和异常](/blog/2022/04/07/C++-Exception-Class-and-RAII/) 提到了异常导致内存泄漏放的一个案例：

```cpp

void foo(){
    int* a = new int{}; // 此对象在诱因发生时出现内存泄漏
    int* b = new int{}; // 内存泄漏诱因
    delete a;           // 若 b的内存分配失败，则此语句不会被执行
    delete b;
}

```

而使用 `std::unique_ptr` 则不会发生内存泄漏：

```cpp

#include <memory>

void foo(){
    std::unique_ptr<int> a(new int(5));
    std::unique_ptr<int> b(new int(6));
}

```

此时若 b 的构造抛出异常，则 a 能够被析构，也就没有内存泄漏。

`std::unique_ptr` 还能自定义删除器（默认使用 `operator delete`）：

```cpp

void foo(){
    std::unique_ptr<int, void(*)(int*)> int_ptr(new int(1), [](int* p) {
        delete p;
    });
}

#include <functional>

void foo(){
    std::unique_ptr<int, std::function<void(int*)>> int_ptr(new int(1), [](int* p) {
        delete p;
    });
}

```

`void(int*)` 是一个函数类型，`void(*)(int*)` 是函数指针。

`std::function` 可以将一个函数类型包装成一个函数指针。

其中 `void` 是返回值，由于 `unique_ptr` 的删除器是放在析构函数里运行的，所以返回值无意义； `int*` 是函数参数，表示删除器接受一个 `int` 的指针。

此处使用了 lambda 作为删除器，`[](int* p) { delete p; }` 这个 lambda 能转换为函数类型 `void(int*)` 的函数指针。

`std::unique_ptr` 不能复制，只能移动：

```cpp

void foo(){
    std::unique_ptr<int> ptr1(new int(5));
    // std::unique_ptr<int> ptr2 = ptr1; 复制构造和复制赋值被删除
    std::unique_ptr<int> ptr2 = std::move(ptr1); // 可以移动构造和移动赋值
}

```

可以以值或者右值引用的 `std::unique_ptr` 为参数，它们的作用是相同的：

```cpp

std::unique_ptr<int> pass_unique(std::unique_ptr<int> p){
    std::cout << *p << std::endl;
    return p;
}

std::unique_ptr<int> pass_unique1(std::unique_ptr<int>&& p){
    std::cout << *p << std::endl;
    return p;
}

void foo(){
    std::unique_ptr<int> p(new int(1));
    auto p1 = pass_unique(std::move(p));
    auto p2 = pass_unique1(std::move(p1)); // 注意，不能两次移动 p
}

```

`std::unique_ptr` 也和容器兼容，可以将 `std::unique_ptr` 放入容器。

基于以上设计，我提出以下两点建议：

1. 如果对象的数据成员复杂，可以使用 `unique_ptr` 间接管理
2. 如果对象的数据成员简单，可以直接使用移动操作，避免麻烦

注意，就算不使用构造函数，也必须使用 RAII 的思想管理资源，释放操作和构造必须在一个模块内。

#### `std::shared_ptr`

`std::unique_ptr` 是独占型指针，且 `std::unique_ptr` 的实现非常简单，数据成员只有一个指针，若有自定义删除器时额外多一个删除器指针，所以开销非常小，构造和析构过程可以被轻松内联化，优化得当的情况下没有任何开销。但是 `std::unique_ptr` 在传递后，其原始对象的内容就被移动走了，只能通过返回值二次利用，而不能在原始对象上继续使用，所以编写的自由度上受到一定限制。

于是标准委员会设计了另一种智能指针 `std::shared_ptr`，顾名思义，是共享型指针。`std::shared_ptr` 使用引用计数实现，引用计数也是最简单的 GC(Garbage Collection) 算法之一。

引用计数的优点就是简单粗暴，加之 C++ 提供了 `std::weak_ptr` 作为辅助，很难遇到在其他使用引用计数实现 GC 的语言中的循环引用问题。如果实际需求非常复杂，也可也自行实现标记清除算法的局部 GC。

引用计数的思路非常简单，当指针被复制时，引用计数加 1，每次析构的时候不去真正的析构对象，而是将引用计数减 1，当引用计数减为 0 时才析构对象。

`std::shared_ptr` 的引用计数是线程安全的，但是读写操作不是线程安全的（标准库中大多数涉及到线程安全的模板/对象都如此设计）。

`std::shared_ptr` 的构造和 `std::unique_ptr` 类似：

```cpp

int foo(){
    std::shared_ptr<int> p(new int(10));
}

```

还可以自定义删除器：

```cpp

void foo(){
    std::shared_ptr<int, void(*)(int*)> int_ptr(new int(1), [](int* p) {
        delete p;
    });
}

```

但是由于 `std::shared_ptr` 内部的计数器和其他成员也在自由储存区中分配，所以如果自己去使用 `new` 申请内存，会有第二次动态内存分配，效率降低，最佳实践是使用 `std::make_shared`：

```cpp

void foo(){
    auto p = std::make_shared<int>(10);
}

```

`std::make_shared` 会先申请出足够的内存，再进行布置t new，这样就可以只有一次动态内存分配。

`std::shared_ptr` 还支持移动复制和移动赋值，使用移动的优点是快速，因为不需要增加引用计数，但是需要注意，移动一个 `std::shared_ptr` 只代表将之前的 `std::shared_ptr` 让出来。移动一个 `std::shared_ptr` 和复制并无本质区别。

`std::shared_ptr` 将其他成员放入动态储存区中分配的原因是，其他成员可能包括强引用计数，弱引用计数和分配器（allocator），如果将这些成员放入栈中可能造成过多的栈分配开销（若放入自由储存区则共享这些成员），并且实际上 `std::shared_ptr` 使用了类型擦除技术，只要指针类型相同，就是相同类型的 `std::shared_ptr<T>`。

虽然 `std::shared_ptr` 和 `std::unique_ptr` 都有针对 C 风格数组的特化版本，但是仍然建议使用 `std::array` 或者 `std::vector`。

标准库模板还提供 `std::allocate_shared`，用于使用自定义的分配器。

### 异常安全

前面我们提到过，使用 `std::unique_ptr` 和 `std::shared_ptr` 能够保证最基础的异常安全（防止 `delete` 语句的执行被异常破坏），但是仅仅依赖这种性质是不够的，错误的使用 `std::unique_ptr` 和 `std::shared_ptr` 仍然可能出现异常安全问题。

#### std::make_unique

下面愚蠢的代码存在内存泄漏隐患：

```cpp

foo(std::unique_ptr<X>(new X), std::unique_ptr<Y>(new Y));

```

这是一个函数调用表达式，问题在于，C++ 17 之前没有规定函数调用表达式中，以何种顺序计算调用过程中需要用到的值，所以 `new X` 和 `new Y` 可能发生在构造 `unique_ptr<X>` 之前，因为此时没有 `unique_ptr<X>` 被构造，所以第二个 `new` 表达式若抛出异常，则第一个 `new` 表达式发生内存泄漏。

改进的方法是使用 `std::make_unique`：

```cpp

foo(std::make_unique<X>(), std::make_unique<Y>());

```

由于 `std::make_unique` 是一个函数调用，所以 C++ 确保一定先构造出一个 `unique_ptr<X>`，再构造出另一个 `unique_ptr<X>`。

若第二个 `unique_ptr<X>` 构造失败，则已经构造的 `unique_ptr<X>` 可以被自动析构。

所以使用 `std::make_unique` 起码有三点好处：

1. 避免任何显式的 `new`
2. 防止愚蠢的内存泄漏
3. 节省一次类型的书写

第三点参考以下代码：

```cpp

std::unique_ptr<int> a(new int); // 提到了 2 次 int
auto b = std::make_unique<int>(); // 只提到了一次 int
auto c{ std::make_unique<int>() }; // 激进地

```

对于 `int` 这种短的名称，似乎写两次还要更短，但这只是障眼法：如果一个类型名比较长，那么书写两次就是额外的负担，而且造成了维护的不便。由于 `auto` 的存在，使用 `std::make_unique` 就很轻松了。

#### `std::make_shared`

`std::make_shared` 最起码也具有 `std::make_unique` 的所有优点，对于以下函数调用：

```cpp

foo(std::shared_ptr<X>(new X), otherfunc());

```

如果 `otherfunc()` 抛出了异常，就有可能发生内存泄漏。

为了让读者清楚这些共同的优点，允许我再重复一次：

1. 避免任何显式的 `new`
2. 防止愚蠢的内存泄漏
3. 节省一次类型的书写
4. 合并两次内存分配，加快速度

如果由于任何一个复杂的原因导致无法使用 `std::make_shared`，那么 `std::shared_ptr` 还支持通过 `std::unique_ptr` 构造：

```cpp

void foo() {
	auto a = std::make_unique<int>(1);
	std::shared_ptr<int> b(std::move(a));
}

```

这样就可以避免任何显式的 `new`，保证异常安全。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2013/n3588.htm">
N3588 std::make_unique
</a>
<a href="https://zh.cppreference.com/w/cpp/memory/shared_ptr">
std::shared_ptr
</a>
<a href="https://zh.cppreference.com/w/cpp/memory/unique_ptr">
std::unique_ptr
</a>
<span>
《C++ Primer》第五版
</span>
<span>
《C++ 程序设计语言》第四版
</span>
</div>
