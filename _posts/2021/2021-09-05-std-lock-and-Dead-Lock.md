---
title: C++ std::lock 和死锁
date: "2021-09-05 23:50:00"
tags: [C++, docs]
category: blog
---
死锁是多线程同时访问多个共享对象的常见问题，其本质是当两个线程各自持有一份数据，又再次想要各自持有另外的数据，但是这组新的数据又被对方持有，造成相互的资源竞争。

C++ 提供了 std::lock 以提供一种解决死锁的方案：即对于两个资源，使其同时锁定或者等候的操作具有原子性，这样就消除了由于顺序而产生的死锁。

<!-- more -->

参考：[C++ 并发编程实战 第二版](https://www.bookstack.cn/read/CPP-Concurrency-In-Action-2ed-2019/content-chapter3-3.2-chinese.md)。

```cpp

#include <mutex>

class some_big_object;

void swap(some_big_object &lhs, some_big_object &rhs);

class X
{
private:
    some_big_object some_detail;
    std::mutex m;

public:
    X(some_big_object const &sd) : some_detail(sd) {}
    friend void swap(X &lhs, X &rhs);
};

void swap(X &lhs, X &rhs)
{
    if (&lhs == &rhs)
        return;
    std::lock(lhs.m, rhs.m);                                    // 1
    std::lock_guard<std::mutex> lock_a(lhs.m, std::adopt_lock); // 2
    std::lock_guard<std::mutex> lock_b(rhs.m, std::adopt_lock); // 3
    swap(lhs.some_detail, rhs.some_detail);
}

```

由于 C++ 的许多语句看上去是一条，但是实际上是多条，并且大多数逗号运算符左右执行顺序是不确定的，以及 CPU 执行不同指令需要用到的时间不一样，导致许多操作都不具有原子性。

而 std::lock 就具有原子性。

由于 C++11 的 std::lock 只有锁定功能，没有解锁功能，所以需要将 std::mutex 的所有权移交给 std::lock_guard。

C++17 中添加了 RAII 风格的 std::lock：std::scoped_lock，简化了代码的书写：

```cpp

void swap(X &lhs, X &rhs)
{
    if (&lhs == &rhs)
        return;
    std::scoped_lock(lhs.m, rhs.m); // 1
    swap(lhs.some_detail, rhs.some_detail);
}

```

std::scoped_lock 是 std::lock 和 std::lock_guard 的结合体，可以同时传入两个 std::mutex 并在离开作用域时自动析构，防止死锁。