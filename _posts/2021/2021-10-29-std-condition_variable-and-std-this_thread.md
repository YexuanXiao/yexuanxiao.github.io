---
title: C++ std::condition_variable 和 std::this_thread
date: "2021-10-29 19:27:00"
tags: [C++, docs]
category: blog
---

C++11 增加了 std::condition_variable 同步原语和 std::this_thread 的 4 个线程控制函数，其实现为编译器黑魔法，可以对线程进行更复杂的控制，而不是仅仅依靠互斥器。

<!-- more -->

std::this_thread 在 `<thread>` 中提供了 4 个函数：

+ get_id：返回当前线程的线程 id
+ sleep_for：使当前线程的执行停止指定的时间段
+ sleep_until：使当前线程的执行停止直到指定的时间点
+ yield：建议实现重新调度各执行线程，严重依赖于操作系统，它相当于系统分配等待时间

参考如下代码：

```cpp

#include <thread>
#include <mutex>
#include <iostream>

std::mutex mux;
void function1(int &n)
{
    for (std::size_t i = 0; i < 5; ++i)
    {
        std::this_thread::sleep_for(std::chrono::seconds(1));// 使每次 n 自增前都休眠 1 秒
        // std::this_thread::yield();
        mux.lock();
        n++;
        std::cout << n << " is f1" << std::endl;
        mux.unlock();
    }
}

void function2(int &n)
{
    for (std::size_t i = 0; i < 5; ++i)
    {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        // std::this_thread::yield();
        mux.lock();
        n++;
        std::cout << n << " is f2" << std::endl;
        mux.unlock();
    }
}
int main()
{
    int n = 0;
    std::thread t1(function1, std::ref(n));
    std::thread t2(function2, std::ref(n));
    t1.join();
    t2.join();
}

```

这段代码很简单，是使用两个线程对同一个 n 自增，然后输出 n 的值。

你会发现结果是 f1 f2 顺序地交替输出自增后的 n，这是因为每次进行的 1 秒的休眠时间都能保证另外一个函数执行完毕，在理想条件下 sleep_for 函数会精确地暂停当前函数，从而保证这个程序用 5 秒的时间执行完毕，其中每秒钟必定 f1 f2 各只输出一次。

而如果不使用线程暂停，或者使用 yield 函数，那么在我的电脑上会奇妙的出现该程序直接退化为了单线程，换言之 f1 先输出 5 句，f2 再输出 5 句。

此外，还有一个最简单的例子是改进的自旋锁：

```cpp

while (!flag)
{
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
};
do_some_thing();

```

这段代码会每 100 毫秒判断一次标记是否可用，防止阻塞住整个线程。

std::condition_variable 顾名思义是条件变量，其主要有两类成员函数：

**通知**

+ notify_one：通知一个等待的线程
+ notify_all：通知所有等待的线程

**等待**

+ wait：阻塞当前线程，直到条件变量被唤醒
+ wait_for：阻塞当前线程，直到条件变量被唤醒，或到指定时限时长后
+ wait_until：阻塞当前线程，直到条件变量被唤醒，或直到抵达指定时间点

参考 cppreference 的代码：

```cpp

#include <iostream>
#include <condition_variable>
#include <thread>
#include <chrono>

std::condition_variable cv;
std::mutex cv_m;
int i = 0;
bool done = false;

void waits()
{
    std::unique_lock<std::mutex> lk(cv_m);
    std::cout << "Waiting... " << std::endl;
    cv.wait(lk, [] {
        return i == 1;
        });
    std::cout << "...finished waiting. i == 1" << std::endl;
    done = true;
}

void signals()
{
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "Notifying falsely..." << std::endl;
    cv.notify_one(); // 等待线程被通知 i == 0.
                     // cv.wait 唤醒，检查 i ，再回到等待

    std::unique_lock<std::mutex> lk(cv_m);
    i = 1;
    while (!done)
    {
        std::cout << "Notifying true change..." << std::endl;
        lk.unlock();
        cv.notify_one(); // 等待线程被通知 i == 1 ， cv.wait 返回
        std::this_thread::sleep_for(std::chrono::seconds(1));
        lk.lock();
    }
}

int main()
{
    std::thread t1(waits), t2(signals);
    t1.join();
    t2.join();
}

```

显然条件变量是一种更高级的控制，它使得操作共享数据的线程能够主动通知等待中的线程。


C++ 并发编程实战第二版 提供了使用条件变量实现的线程安全的队列：

```cpp

#include <queue>
#include <memory>
#include <mutex>
#include <condition_variable>

template <typename T>
class threadsafe_queue
{
private:
    mutable std::mutex mut; // 使 const 修饰的 empty 函数可以操作 mutex
    std::queue<T> data_queue;
    std::condition_variable data_cond;

public:
    threadsafe_queue()
    {
    }
    threadsafe_queue(threadsafe_queue const &other)
    {
        std::lock_guard<std::mutex> lk(other.mut);
        data_queue = other.data_queue;
    }
    void push(T new_value)
    {
        std::lock_guard<std::mutex> lk(mut);
        data_queue.push(new_value);
        data_cond.notify_one();
    }
    void wait_and_pop(T &value)
    {
        std::unique_lock<std::mutex> lk(mut);
        data_cond.wait(lk, [this]
                       { return !data_queue.empty(); });
        value = data_queue.front();
        data_queue.pop();
    }
    std::shared_ptr<T> wait_and_pop()
    {
        std::unique_lock<std::mutex> lk(mut);
        data_cond.wait(lk, [this]
                       { return !data_queue.empty(); });
        std::shared_ptr<T> res(std::make_shared<T>(data_queue.front()));
        data_queue.pop();
        return res;
    }
    bool try_pop(T &value)
    {
        std::lock_guard<std::mutex> lk(mut);
        if (data_queue.empty())
            return false;
        value = data_queue.front();
        data_queue.pop();
        return true;
    }
    std::shared_ptr<T> try_pop()
    {
        std::lock_guard<std::mutex> lk(mut);
        if (data_queue.empty())
            return std::shared_ptr<T>();
        std::shared_ptr<T> res(std::make_shared<T>(data_queue.front()));
        data_queue.pop();
        return res;
    }
    bool empty() const
    {
        std::lock_guard<std::mutex> lk(mut);
        return data_queue.empty();
    }
};

```

通过观察能发现，这个类的 push 函数在执行过程中对条件变量执行了 notify_one 函数，而此时如果有一个 wait_and_pop 函数正在等待，那么这次 push 就会唤醒 wait_and_pop。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://www.bookstack.cn/read/CPP-Concurrency-In-Action-2ed-2019/content-chapter4-4.1-chinese.md">
4.1 等待一个事件或其他条件
</a>
<a href="https://zh.cppreference.com/w/cpp/thread">
线程支持库
</a>
<a href="https://zh.cppreference.com/w/cpp/thread/condition_variable">
C++ std::condition_variable
</a>
</div>