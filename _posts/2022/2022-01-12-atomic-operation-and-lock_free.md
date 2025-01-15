---
title: 原子操作和无锁编程
date: "2022-01-12 19:37:00"
tags: [C++,STL,atomic]
category: blog
---
C++11 开始，线程正式加入标准库，并且一同加入了 \<atomic\> 无锁编程库。使用原子操作并不代表真的没有互斥锁，无锁编程也不代表真的不用互斥锁进行编程。原子的基本思想是通过尽可能小（有锁或者无锁）的标志，代替对大块数据进行互斥，从而避免死锁和长时间等待。

<!-- more -->

`std::atomic` 模板提供了将任意类型包装为原子类型的能力，但是有着一定的要求：

主 `std::atomic` 模板需要类型 `T` 满足以下概念（任何若下列任何值为 `false` 则程序为谬构）：

+ `std::is_trivially_copyable<T>::value`
+ `std::is_copy_constructible<T>::value`
+ `std::is_move_constructible<T>::value`
+ `std::is_copy_assignable<T>::value`
+ `std::is_move_assignable<T>::value`

标准库内置了四大类型的特化：整数，浮点，指针，布尔，并且前三种种类型都有自己独有的特化成员函数进行数学运算，对于所有 `std::atomic` 的特化，都有如下成员函数：

+ `operator=` 存储值于原子对象
+ `is_lock_free` 检查原子对象是否免锁
+ `store` 原子以非原子对象替换原子对象的值
+ `load` 原子获得原子对象的值
+ `operator T` 从原子对象加载值，等价于 `load`
+ `exchange` 原子替换原子对象的值并获得它先前持有的值
+ `compare_exchange_weak` `compare_exchange_strong` 原子比较原子对象与非原子参数的值，若相等则进行交换，若不相等则进行加载
+ `wait` 阻塞线程直至被提醒且原子值更改
+ `notify_one` 提醒至少一个在原子对象上的等待中阻塞的线程
+ `notify_all` 提醒所有在原子对象上的等待中阻塞的线程

对于每个操作，都可以选择不同的 memory_order，某些 memory_order 不能用于某些特定操作。

例如：`load` 函数是获得操作，那么就不允许使用 release 以及 acq_rel(acquire_release) 顺序；`store` 是释放操作，那么就不允许 acquire，acq_rel，consume 顺序。

对于整数还有如下特化成员函数：

+ `fetch_add` 原子将参数加到存储于原子对象的值，并返回先前保有的值
+ `fetch_sub` 原子从存储于原子对象的值减去参数，并获得先前保有的值
+ `fetch_and` 原子进行参数和原子对象的值的逐位与，并获得先前保有的值
+ `fetch_or` 原子进行参数和原子对象的值的逐位或，并获得先前保有的值
+ `fetch_xor` 原子进行参数和原子对象的值的逐位异或，并获得先前保有的值
+ `operator++` `operator++(int)` 原子自增
+ `operator--` `operator--(int)` 原子自减
+ `operator+=` 原子加法
+ `operator-=` 原子减法
+ `operator&=` 原子位于
+ `operator|=` 原子位或
+ `operator^=` 原子位异或

浮点数：

+ `fetch_add` 原子将参数加到存储于原子对象的值，并返回先前保有的值
+ `fetch_sub` 原子从存储于原子对象的值减去参数，并获得先前保有的值
+ `operator+=` 原子加法
+ `operator-=` 原子减法

指针：

+ `fetch_add` 原子将参数加到存储于原子对象的值，并返回先前保有的值
+ `fetch_sub` 原子从存储于原子对象的值减去参数，并获得先前保有的值
+ `operator++` `operator++(int)` 原子自增
+ `operator--` `operator--(int)` 原子自减
+ `operator+=` 原子加法
+ `operator-=` 原子减法

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://en.cppreference.com/w/cpp/atomic/atomic">
std:atomic
</a>
<span>
C++ 并发编程实战 第二版
</span>
</div>
