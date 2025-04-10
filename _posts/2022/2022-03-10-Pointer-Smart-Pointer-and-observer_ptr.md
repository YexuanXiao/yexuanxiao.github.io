---
title: 指针，智能指针和 observer_ptr
date: "2022-03-11 18:54:00"
tags: [C++]
category: blog
---

本文是 Bjarne Stroustrup 在 2018 年发表的一个 Proposal [Abandon observer_ptr](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p1408r0.pdf) (P1408R0) 的翻译。Bjarne 原本在 2014 年尝试设计了一种额外的智能指针 `observe_ptr`，发表于 [N2082](http://open-std.org/JTC1/SC22/WG21/docs/papers/2014/n4282.pdf)，但是，后来 Bjarne 意识到 `observer_ptr` 是愚蠢的，于是就有了这篇文章。虽然 `observer_ptr` 已经被遗弃，但是我想通过 Bjarne 的这篇文章来说明一个问题：`unique_ptr` 和 `shared_ptr` 不能完全代替裸指针。

<!-- more -->

## Abandon observer_ptr

Bjarne Stroustrup

### 总结

我提议从 [工作草案 C++ 基础扩展库 第3版](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/n4786.html) 中删除 **std::observer_ptr** 。它是在 2014 年从 [关于世界上最愚蠢的智能指针的建议（A Proposal for the World's Dumbest Smart Pointer, v4）](http://open-std.org/JTC1/SC22/WG21/docs/papers/2014/n4282.pdf) (N4282) 中采用的，对于一个旨在改变现有的每个 C++ 程序的建议来说，讨论时间非常短。
我发现那篇论文的理由和对替代方案的讨论非常简短而且相当薄弱。引用 Walter Brown 在 2013 年 Urbana-Champaign 会议上的讲话：

**目标：摆脱用户代码中的裸指针**

我不同意这个目标，而且我认为即使我同意，也不可能做到这一点。不过，这并不是对 **observer_ptr** 的唯一观点（见下文的 "好处"），而且会议记录可能没有准确捕捉到 Walter 的发言。然而，这种观点我已经在不同的场合听到过很多次了。语境中表达的观点，这让我很警惕。

指针在指向 "事物 "方面非常好，**T\*** 是一个非常好的符号，比冗长的 **std::observer_ptr\<T\>** 好得多。指针不擅长的是代表所有权和直接支持安全迭代 [^1] 。

[^1]: C++ 的指针由于受到 C 的影响，许多时候不能进行更好的优化，因为指针操作可能存在重叠，参考之前的文章 [严格别名规则和指针安全性](/blog/2022/01/30/Strict-Aliasing-Rules/)

### 问题

+ 我们在 **T\*** 符号方面有 50 年的经验，无论我们做什么都不会让 **T\*** 消失（在 C++ 或 C 中）。首先，有数十亿行的代码在使用该符号，并且有 50 年的书籍、文章、文档、教程和博客等在使用。
+ 传统的 **T\***s 符号比 **std::observer_ptr\<T\>** 简单得多。
+ 在许多代码库中，**T\***s 和 **std::observer_ptr\<T\>**s 会长期共存（"永远"）。 然而，它们并不是完全可以互换的（例如，**p = q** 能不能用？我必须看一下 **p** 和 **q** 的定义才能知道）。
+ 许多 **T\*** 的使用是在 C 风格的接口中，使用一个类，比如 **std::observer_ptr\<T\>** 会导致 兼容性问题和，或 ABI 破坏。
+ 使用模板，如 **std::observer_ptr\<T\>** 会减慢编译速度，并使某些形式的调试复杂化。使用 **std::observer_ptr\<T\>** 不会使编译速度比 **T\*** 慢很多。但它是一个令人不安的趋势的一部分，在过去的几年中，头文件的添加大大增加了代码量。多年来，它大大增加了编译器必须处理的代码量。
+ 大多数 **T\*** 都是非所有权的，所以 **std::observer_ptr\<T\>** 是为了少数人的利益而使普通情况复杂化。
+ 使用 **std::observer_ptr\<T\>** 会使未优化的代码变慢。
+ 添加 **std::observer_ptr\<T\>** 将被视为 WG21 推荐使用它而不是 **T\***（无论我们是否愿意这样做），使这些问题变得普遍。

这将使教学/解释变得复杂，并强化 C++ 的复杂声誉。不同能力的学生都想知道一个特性是如何实现的；解释 **std::observer_ptr\<T\>** 的实现要比解释 **T\*** 难得多。使用 **T\***、**std::observer_ptr**、和 **std::unique_ptr** 的组合是必要的，而学习如何很好地做到这一点并非易事（见下面的 "使用方法 关注")。

### 好处

显然， **observer_ptr** 提供了一些好处（否则它就不会被投票进去）。

+ 并非所有的指针都是非所有权的，所以区分指针的两种用途的某种方法是显然是有用的。
+ 你不能在没有 casts 的情况下将一个 **observer_ptr** 转换为一个 **void\***，这有时是一个好处。
+ 你不能对一个 **observer_ptr** 使用 **delete**，这非常好。
+ 你不能自增一个 **observer_ptr**，这有时是一个好处。
+ 在从传统的代码库过渡到使用显式所有者的代码库时，可能需要区分已知的非所有者（观察者）和尚未检查的指针。

因此，问题变成了 "好处多于问题吗？"

我们有体验报告吗？

### 使用上的顾虑

我们可以对当前使用的指针进行这样的分类：

+ 拥有；并且，必须被 **delete**d。
+ 不拥有；并且，必须不能被 **delete**d。
+ 迭代器；并且，可以使用自增运算符，并且为了安全使用需要一些 “范围的结束” 信息；迭代器应当不拥有。

基于此，一个 **observer_ptr** 是一个不拥有者并且不是一个迭代器。我非常困惑这是否是设计空间中的正确点。

考虑：

```cpp

void f2(int*);

void g()
{
    observer_ptr<int> p{new int};
    int* q = new int;
    f1(p);          // OK
    f2(p);          // error
    f1(q);          // error
    f2(q);          // OK
    ++p;            // error
    ++q;            // OK (as ever)
    p=q;            // error
    q=p;            // error
    delete p;       // error
    delete p.get(); // OK
    delete q;       // OK (as ever)
    delete q.get(); // error (someone got confused)
}

```

我们将不得不决定函数是采取 **observer_ptr**s 还是原始指针。此外，我们的使用风格，包括 new 的使用，必须考虑到 **observer_ptr**s 只能满足一个非常有限的需求。

对于所有权，**unique_ptr** 是一个很好的解决方案，所以我们将不得不处理 **unique_ptr**s、**observer_ptr**s 和 **T\*** 的组合。

对于迭代和对多个对象（如数组）的非所有权引用，**Range**s 和 **span**s [^2]（我认为）是一个比 **observer_ptr**s 和原始指针混合的更好的解决方案。

[^2]: span 设计与 2015 年的 GSL，在 C++17 中成为标准，observer_ptr 设计于 2014 年，本文写于 2018 年，参考之前的文章 [C++ std::span](/blog/2022/01/09/std-span/)

### 替代

如果你需要一个代表非所有权的指针，我建议：

**template\<typename T\> using observer_ptr = T*;**

在我们用适当的概念取代那个 **typename** 之前，这将是最好的定义：

+ 它允许人们标记指针非拥有。
+ 它不会造成接口问题。
+ 它和 **T\***s 完美协作。
+ 来自 **observer_ptr** 类的好处可以以编译器警告和静态分析工具的形式出现。

然而，我不建议这样做，因为这仍然是 "尾巴摇狗"，并没有使最简单和最常见的情况保持简单。我们应该做的是把属于所有者的指针标记为所有者。我们使用 **unique_ptr** 和 **shared_ptr** 来做到这一点，除非我们需要通过 C 风格的接口传递一个指针。对于这种情况，我推荐 GSL 的

**template\<typename T\> using owner = T;**

或者更 STL-style 的

**template\<typename T\> using owner_ptr = T\*;**

这最小化了语法上的混乱，使人类和工具能够识别其意图，并且不会造成接口问题。

同时使用一个所有者和一个非所有者（可能称为观察者）的别名可以促进 "好处 "中提到的过渡。

另外，想要的用户可以随时使用 **experimental::observer_ptr** 或同等的东西。

<div class="ref-label">萧叶轩注：</div>
