---
title: std::cout 和 std::endl
date: "2021-12-20 03:43:00"
tags: [C,C++,STL]
category: blog
---

std::cout 和 std::endl 可以说是学习 C++ 最先接触到的全局对象和操纵符，但是 std::cout 和 std::endl 内部存在复杂的设计，和 C 的 IO 库存在许多差异，导致许多人对 std::cout 和 std::endl 存在非常大的偏见，特别是在某些计算机竞赛环境，或者是某些“大佬”警告后。本文的目的是从标准和语言上理清 std::cout 和 std::endl 的一些设计帮助正确合理使用它们。

<!-- more -->

### std::cout

std::cout 最广泛的被诟病的就是性能低下，但是殊不知 std::cout 的性能受 3 个因素影响：

#### 多线程下线程安全 {#thread-safe}

打开 cppreference 的 [std::cout, std::wcout](https://zh.cppreference.com/w/cpp/io/cout) 页面，其中第一句描述性话语的前半句是：

> 全局对象 std::cout 和 std::wcout 控制输出。

由于同一个进程共享同一个标准输出，为了线程安全，需要保证每次输出时，字符串不被截断（毕竟你肯定不希望两个字符串被交替输出），那么就需要对 std::cout 进行加锁。而加锁就会进行一次系统调用（比较浪费时间）并且等待另一个线程输出完毕，因此 std::cout 在某些情况下会进行无用的加锁保证线程安全（现代编译器有可能推断出单线程并将加锁操作优化掉）。

#### 与 stdio 的同步

完整的第一句是：

> 全局对象 std::cout 和 std::wcout 控制到实现定义类型流缓冲（导出自 std::streambuf）的输出，它与标准 C 输出流 stdout 关联。

由于标准输出的输出的目的地是系统提供的，换句话说最终需要依赖系统实现输出，而每次系统调用都很浪费时间，所以 C 和 C++ 都设计了缓冲区来优化性能：

```cpp

#include <iostream>

int main(){
    std::cout << "Hello " << "World!" << std::endl;
}

```

上面是一个输出 `Hello World!` 的简单示例，值得注意的是，使用了两次 `<<` 运算符，代表输出了两次字符（从语义上），但是，直到 std::endl 被执行之前，并没有发生系统调用，`Hello World!` 被储存到了 std::streambuf 这个缓冲区里。

和 std::cout 一样，std::streambuf 也是全局的。

现在的问题是，std::cout 和 printf 维护着不同的缓冲区，换言之，即使你只用了一个线程，混用 std::cout 和 printf 也会导致输出混乱：
  
```cpp

#include <iostream>
#include <cstdio>
 
int main()
{
    std::ios::sync_with_stdio(false);
    std::cout << "a\n";
    std::printf("b\n");
    std::cout << "c\n";
}

```

可能的输出：

b

a

c

于是 C++ 为了兼容 std::cout 和 printf 混写，使 std::cout 默认共享 printf 的缓冲区。这造成了性能损失。

如果你既不使用多线程也不使用 printf，那么就可以使用 std::ios::sync_with_stdio 使 std::cout 独占一个缓冲区：

```cpp

#include <iostream>

int main(){
    std::ios::sync_with_stdio(false);
    std::cout << "Hello " << "World!" << std::endl;
}

```

注意，这也将导致每个线程独占一个缓冲区，造成多线程变为不加锁出现 [多线程下线程安全](#thread-safe) 的问题，导致多线程下需要手动加锁。

#### locale 支持

C 和 C++ 在发展过程中分别加入了多语言支持（但是多语言支持做的很烂，不如不做）。

打开 cppreference 的 [std::locale](https://zh.cppreference.com/w/cpp/locale/locale) 页面，第一句就是：

> std::locale 类型对象是不可变平面的不可变索引集。C++ 输入/输出库的每个流对象与一个 std::locale 对象关联，并用其平面分析及格式化所有数据。

换句话说每个 std::cout 作为一个流对象，都实现了 locale，而 locale 内部需要实现线程安全，如同 std::cout。

并且 locale 的实现较为复杂，导致潜在的拖慢 std::cout 的效率并且导致可见的编译速度变慢以及二进制文件大小增长。

### std::endl

std::endl 最广为人知的是它可能导致潜在的副作用，尤其是非标准输出（std::cout）时。

了解 std::endl 的副作用需要从两点入手：

#### 流的缓冲区刷新

本文上半部分 std::cout 已经讲述了缓冲区以及设计目的。对于 std::cout，输入 std::endl 通常具有两个作用：

+ 换行
+ 刷新缓冲区（进行系统调用输出内容）

对于 std::cout，传入 '\n' （"\r\n" 或 '\r'）和 std::endl 通常来说是没有区别的，因为 std::cout 通常是行缓冲的。

换句话说，std::cout 通常只缓冲一个行，那么在遇到 '\n' 时，就会换行并且刷新缓冲区。

但是，对于其他不是行缓冲的输出流来说，std::endl 会产生无用的刷新缓冲区，导致缓冲区频繁被刷新，而这些流可能被设计为缓冲区满或者手动刷新时才刷新，造成额外的开销。

Bjarne Stroustrup 在C++ 核心指南中写有一小节 [SL.io.50: Avoid endl](https://github.com/isocpp/CppCoreGuidelines/blob/master/CppCoreGuidelines.md#Rio-endl) 中提到了这个问题。

虽然这一节起名叫 Avoid endl，但是最后面的 Note 指出，在不存在性能问题的时候，选择哪种方式完全出于美学。

#### 流的绑定

由于 C/C++ 的标准输出和标准输入默认共享一个缓冲区，所以 std::cin 或者 scanf 在执行前会对缓冲区进行刷新，防止缓冲区的内容被覆盖，这也就是为什么不使用 std::endl 或者 '\n'，std::cout 也把内容输出了：

```c++

#include <iostream>

int main()
{
	std::cout << "Enter two numbers:"; // 即使此处未使用std::endl或者'\n'，你也直接看到了提示文字
	int v1 = 0, v2 = 0;
	std::cin >> v1 >> v2;
	std::cout << "The sum of " << v1 << " and " << v2
	          << " is " << v1 + v2 << std::endl;
	return 0;
}

```
