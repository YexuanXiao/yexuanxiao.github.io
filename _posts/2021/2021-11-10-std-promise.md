---
title: C++ std::promise
date: "2021-11-10 16:30:00"
tags: [C++, docs]
category: blog
---

由于 std::async 在理论和实现上并不能满足我们的需求，因为我们常常在异步操作后对异步操作的结果进行一个同步，而 std::async 并不能提供这点需求，甚至由于默认发射策略导致 std::async 很有可能退化为单线程顺序运行，所以在 std::async 的基础上提供了 std::promise。

<!-- more -->

std::promise 可以保存某一类型 T 的值，该值通常使用 std::future 储存（可能传递给另外一个线程），因此 std::promise 也提供了一种线程同步的手段 [^1] 。

[^1]: [C++11 并发指南四 (\<future\> 详解一 std::promise 介绍)](https://www.cnblogs.com/haippy/p/3239248.html)

可以通过 get_future 来获取与该 promise 对象相关联的 future 对象，调用该函数之后，两个对象共享相同的共享状态（Shared State）。

+ promise 是异步 Provider，它可以在某一时刻设置共享状态的值。
+ future 可以异步返回共享状态的值，或者在必要的情况下阻塞调用者并等待共享状态标志变为 ready，然后才能获取共享状态的值。

```cpp

#include <iostream>
#include <future>

void print_int(std::future<int>& fut) {
    int x = fut.get(); // 获取共享状态的值
    std::cout << "value: " << x << std::endl; // 打印 value: 10
}

int main()
{
    std::promise<int> prom;
    std::future<int> fut = prom.get_future();
    std::thread t(print_int, std::ref(fut));
    prom.set_value(10); // 设置共享状态的值, 此处和线程t保持同步
    // 若不设置共享状态的值，那么t会被一直阻塞
    // 也可选择阻塞一定时间后若仍未设置值，进行异常处理
    t.join();
    return 0;
}

```

future 本质上是我们发起的一个并发操作，而 promise 本质上则是并发操作的回调。我们可以通过 future 对象等待该操作和获取操作的结果，而 promise 对象则负责写入返回值并通知我们 [^2] 。

[^2]: [浅谈 The C++ Executors](https://zhuanlan.zhihu.com/p/395250667)

具体的实现中，future 与 promise 会有指向同一个共享的状态对象 Shared State 的共享指针，当promise 对象接受到返回值或者错误之后，通过条件变量通知另一端等待的 future 对象。future 对象则可以通过 Shared State 对象中的状态，来判断接收到回调之后是继续处理业务还是处理错误。

std::promise 有如下成员函数 [^3]：

[^3]: [std::promise](https://zh.cppreference.com/w/cpp/thread/promise)

+ get_future 返回与 promise 关联的 future
+ set_value 设置结果为指定值
+ set_value_at_thread_exit 设置结果为指定值，同时仅在线程退出时分发提醒
+ set_exception 设置结果为指示异常
+ set_exception_at_thread_exit 设置结果为指示异常，同时仅在线程退出时分发提醒

```cpp

#include <vector>
#include <thread>
#include <future>
#include <numeric>
#include <iostream>
#include <chrono>

void accumulate(std::vector<int>::iterator first,
    std::vector<int>::iterator last,
    std::promise<int> accumulate_promise)
{
    int sum = std::accumulate(first, last, 0);
    accumulate_promise.set_value(sum);  // 提醒 future 已就绪
}

int main()
{
    // 演示用 promise<int> 在线程间传递结果。
    std::vector<int> numbers = { 1, 2, 3, 4, 5, 6 };
    std::promise<int> accumulate_promise;
    std::future<int> accumulate_future = accumulate_promise.get_future();
    std::thread work_thread(accumulate, numbers.begin(), numbers.end(),
        std::move(accumulate_promise));

    // future::get() 将等待直至该 future 拥有合法结果并取得它
    // 无需在 get() 前调用 wait
    //accumulate_future.wait();  // 等待结果
    std::cout << "result=" << accumulate_future.get() << std::endl;
    work_thread.join();  // wait for thread completion
}

```

由于 std::future 所引用的共享状态不与另一异步返回对象共享 [^4] ，所以 std::promise 也具有同样的性质，所以 std::promise 一般使用 **移动构造** 的方式来传递（原代码中使用了引用，但是这并不值得展示）。

[^4]: [std::future](https://zh.cppreference.com/w/cpp/thread/future)

[C++ 并发编程实战 第二版 4.2.3 使用 promises](https://www.bookstack.cn/read/CPP-Concurrency-In-Action-2ed-2019/content-chapter4-4.2-chinese.md) 中提供了一个简化的使用场景：

```cpp

void process_connections(connection_set& connections)
{
    while (!done(connections))
    {
        for (connection_iterator
            connection = connections.begin(), end = connections.end();
            connection != end;
            ++connection)
        {
            if (connection->has_incoming_data())
            {
                data_packet data = connection->incoming();
                std::promise<payload_type>& p =
                    connection->get_promise(data.id);
                p.set_value(data.payload);
            }
            if (connection->has_outgoing_data())
            {
                outgoing_packet data =
                    connection->top_of_outgoing_queue();
                connection->send(data.payload);
                data.promise.set_value(true);
            }
        }
    }
}

```

假设 connections 是一个网络连接池，自旋锁不断通过循环检查是否整个连接池都已经结束连接，并每次遍历整个连接池。

每一个 connection 就是一个连接，如果等待传入的数据，那么就构造一个 promise，然后设置 promise 的共享状态的值。

如果有传出数据（通常同时可能存在多个等待传出的数据），则从队列里得到顶部数据，然后构造一个 promise 发送数据。

显然的，promise 总是积极的创造一个线程。

以下是向 promise 传递一个异常的示例 [^1] ：

```cpp

#include <iostream>       // std::ios
#include <thread>         // std::thread
#include <future>         // std::promise, std::future
#include <exception>      // std::exception, std::current_exception

void get_int(std::promise<int> prom) {
    int x;
    std::cout << "Please, enter an integer value: ";
    std::cin.exceptions(std::ios::failbit);   // throw on failbit
    try {
        std::cin >> x;                         // sets failbit if input is not int
        prom.set_value(x);
    }
    catch (std::exception&) {
        prom.set_exception(std::current_exception());
    }
}

void print_int(std::future<int> fut) {
    try {
        int x = fut.get();
        std::cout << "value: " << x << std::endl;
    }
    catch (std::exception& e) {
        std::cout << "[exception caught: " << e.what() << "]" << std::endl;
    }
}

int main()
{
    std::promise<int> prom;
    std::future<int> fut = prom.get_future();

    std::thread th1(get_int, std::move(prom));
    std::thread th2(print_int, std::move(fut));

    th1.join();
    th2.join();
    return 0;
}

```

其中 get_int 负责接收一个整数的输入，如果输入不正确则设置一个异常，print_int 用于捕获 promise 的输入，如果 promise 储存了一个异常，则输出异常信息。

下面是一个考虑更加周全的例子 [^6] ：

[^6]: [std::promise\<R\>::set_exception](https://zh.cppreference.com/w/cpp/thread/promise/set_exception)

```cpp

#include <thread>
#include <iostream>
#include <future>

int main()
{
    std::promise<int> p;
    std::future<int> f = p.get_future();

    std::thread t([&p] {
        try {
            // 可能抛出的代码
            throw std::runtime_error("Example");
        }
        catch (...) {
            try {
                // 存储任何抛出的异常于 promise
                p.set_exception(std::current_exception());
            }
            catch (...) {} // set_exception 也可能抛出异常
        }
        });

    try {
        std::cout << f.get();
    }
    catch (const std::exception& e) {
        std::cout << "Exception from the thread: " << e.what() << std::endl;
    }
    t.join();
}

```

<div class="ref-label">注：</div>