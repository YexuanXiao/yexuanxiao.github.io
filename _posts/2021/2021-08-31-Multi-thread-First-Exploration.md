---
title: C++ std::thread 多线程初探
date: "2021-08-31 23:50:00"
tags: [C++, docs]
category: blog
---

C++11 开始正式在语言层面通过标准模板库的方式提供了 std::thread 来进行多线程优化，使用多线程进行并行计算是现代计算机上软件对计算进行加速的最普遍的方式。

<!-- more -->

参考：[C++ 并发编程实战 第二版](https://www.bookstack.cn/read/CPP-Concurrency-In-Action-2ed-2019/content-chapter2-2.4-chinese.md)。

std::accumulate 是 C++ numeric 头文件中提供的求和算法，其中一个最广泛的重载是传入起始迭代器，结束迭代器和初始值。

根据书中的内容，并发版 accumulate 如下：

```cpp

#include <vector>
#include <thread>
#include <functional>
#include <numeric>
#include <iostream>

template <typename Iterator, typename T>
T parallel_accumulate(Iterator first, Iterator last, T init)
{
    if (first == last) // 长度为 0 时直接返回初始值
        return init;
    constexpr size_t min_per_thread = 25;             // 当计算量很大时规定每一个块的最小计算量
    const size_t length = std::distance(first, last); // distance 计算两个迭代器之间的距离
    const size_t max_threads = // 用范围内元素的总数量除以线程(块)中最小任务数，并保证其大于 1
        length / min_per_thread + 1;
    const size_t hardware_threads = // 返回硬件支持的并发线程数，为 0 时代表无确定值
        std::thread::hardware_concurrency();
    const size_t num_threads = // 计算程序使用的所有线程数
        std::min(hardware_threads != 0 ? hardware_threads : 2, max_threads);
    const size_t block_size = length / num_threads; // 运算目标分组大小
    std::vector<T> results(num_threads);            // 创建线程表
    /* 实际上 num_threads 可以等于 1，此时该函数也可以确保计算的正确性 */
    std::vector<std::thread> threads(num_threads - 1); // 减 1 是因为此时有主线程存在

    /* 至此，计算出并发线程数 num_threads，储存结果的容器 results，线程表 threads，运算块大小 block_size */

    Iterator block_start = first;// 块起点为容器起点
    // 开始
    for (size_t i = 0; i < (num_threads - 1); ++i)
    {
        Iterator block_end = block_start;
        std::advance(block_end, block_size);        // advance 将迭代器（数据）移动 n 位（块大小）
        threads[i] = std::thread(                   // 创建线程
            [&results, block_start, block_end, i]() // 调用 lambda 进行计算，每次计算块大小的数据存入结果容器
            {
                results[i] = std::accumulate(
                    block_start, block_end, results[i]);
            });
        block_start = block_end; // 每次将起点移动到本次终点
    }
    results[num_threads - 1] = std::accumulate( // 计算最后一组
        block_start, last, results[num_threads - 1]);
    for (auto &i : threads) // 等待线程完成其执行
        i.join();
    return std::accumulate(results.begin(), results.end(), init); // 计算结果容器内结果的和
}

int main()
{
    std::vector<int> a{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int sum = parallel_accumulate(a.begin(), a.end(), 20);
    std::cout << sum << std::endl;
}

```

我在原作者代码基础上将伪函数改写为 lambda，for_each 改为 range-for 并做了其他一些调整，整体与原代码保持一致。

作者提到，由于并发计算不是顺序计算，所以浮点类型的计算结果由于精度问题可能和顺序计算不一致。

并且由于迭代器指向问题，在某些类模板上不一定工作。
