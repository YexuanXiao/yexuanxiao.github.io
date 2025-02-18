---
title: std::memory_order
date: "2022-01-16 07:36:00"
tags: [C++,STL,atomic]
category: blog
---
`std::memory_order` 是一个枚举类，用于指示编译器进行内存同步所使用的规则，是原子操作的基础。`std::memory_order` 本质上是 C++ 对于内存一致性的同步操作进行的一种抽象，使用不同的 order 代表进行不同的同步操作。

<!-- more -->

```cpp

enum class memory_order : /*unspecified*/ {
    relaxed, consume, acquire, release, acq_rel, seq_cst
};

```

#### 宽松顺序 relaxed

宽松顺序仅保证原子性，不保证内存或者 CPU cache 的任何同步。

例如：

```cpp

x = y = 0;
// 线程 1 ：
r1 = y.load(std::memory_order_relaxed); // A
x.store(r1, std::memory_order_relaxed); // B
// 线程 2 ：
r2 = x.load(std::memory_order_relaxed); // C 
y.store(42, std::memory_order_relaxed); // D

```

由于是宽松顺序，所以允许 D -> A -> B -> C。

宽松内存顺序的典型使用是计数器自增，例如 `std::shared_ptr` 的引用计数器，因为这只要求原子性，但不要求顺序或同步（注意 `std::shared_ptr` 计数器自减要求与析构函数进行获得释放同步）。

#### 释放获得顺序 release acquire

若线程 A 中的一个原子存储带标签 `memory_order_release` ，而线程 B 中来自同一变量的原子加载带标签 `memory_order_acquire` ，则从线程 A 的视角先发生于原子存储的所有内存写入（非原子及宽松原子的）在线程 B 中成为可见副效应，即一旦原子加载完成，则保证线程 B 能观察到线程 A 写入内存的所有内容。

同步仅建立在释放和获得同一原子对象的线程之间。其他线程可能看到与被同步线程的一者或两者相异的内存访问顺序。

互斥锁（例如 `std::mutex` 或原子自旋锁）是释放获得同步的例子：线程 A 释放锁而线程 B 获得它时，发生于线程 A 环境的临界区（释放之前）中的所有事件，必须对于执行同一临界区的线程 B （获得之后）可见。

```cpp

#include <thread>
#include <atomic>
#include <cassert>
#include <string>

std::atomic<std::string*> ptr;
int data;

void producer()
{
    auto* p = new std::string("Hello");
    data = 42;
    ptr.store(p, std::memory_order_release);
}

void consumer()
{
    std::string* p2;
    while (!(p2 = ptr.load(std::memory_order_acquire)));// 获得后，释放操作前的操作一定可见
    assert(*p2 == "Hello"); // 绝无问题
    assert(data == 42); // 绝无问题
}

int main()
{
    std::jthread t1(producer);
    std::jthread t2(consumer);  
}

```

#### 释放消费顺序 release consume

C++17 开始不推荐使用 consume，会自动升级为 acquire。

#### 序列一致顺序 sequence consistent

seq_cst 的原子操作不仅以与释放/获得顺序相同的方式排序内存（在一个线程中先发生于存储的任何结果都变成进行加载的线程中的可见副效应），还对所有带此标签的内存操作建立单独全序。

若在多生产者-多消费者的情形中，且所有消费者都必须以相同顺序观察到所有生产者的动作出现，则可能必须有序列顺序。

全序列顺序在所有多核系统上要求完全的内存栅栏 CPU 指令。这可能成为性能瓶颈，因为它强制受影响的内存访问传播到每个核心。

此示例演示序列一直顺序为必要的场合。任何其他顺序都可能触发 `assert`，因为可能令线程 `c` 和 `d` 观测到原子对象 `x` 和 `y` 以相反顺序更改。

```cpp

#include <thread>
#include <atomic>
#include <cassert>
 
std::atomic<bool> x{false};
std::atomic<bool> y{false};
std::atomic<int> z{0};
 
void write_x()
{
    x.store(true, std::memory_order_seq_cst);
}
 
void write_y()
{
    y.store(true, std::memory_order_seq_cst);
}
 
void read_x_then_y()
{
    while (!x.load(std::memory_order_seq_cst))
        ;
    if (y.load(std::memory_order_seq_cst)) {
        ++z;
    }
}
 
void read_y_then_x()
{
    while (!y.load(std::memory_order_seq_cst))
        ;
    if (x.load(std::memory_order_seq_cst)) {
        ++z;
    }
}
 
int main()
{
    std::thread a(write_x);
    std::thread b(write_y);
    std::thread c(read_x_then_y);
    std::thread d(read_y_then_x);
    a.join(); b.join(); c.join(); d.join();
    assert(z.load() != 0);  // 决不发生
}

```

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://en.cppreference.com/w/cpp/atomic/memory_order">
std::memory_order
</a>
<span>
C++ 并发编程实战 第二版
</span>
</div>
