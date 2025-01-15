---
title: 浅谈 The C++ Executors
date: "2021-11-12 02:43:00"
tags: [C++, docs]
category: blog
---

就在 2021 年 7 月 6 号，Executors 提案又有了亿点点的更新。新的 Paper [P2300R1](http://open-std.org/JTC1/SC22/WG21/docs/papers/2021/p2300r1.html)，正式命名为 `std::execution`，相较于 The Unified Executor for C++，[P0443R14](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p0443r14)，更系统地阐述了 Executors 的设计思路；给出了在实现上更多的说明；删除了 Executor Concept，保留并确立了 Sender/Receiver/Scheduler 模型；给出了库里应有的初始算法集合，并对之前的算法设计有不小的改动；还有更多明确的语义如任务的多发射（multi-shot）和单发射（single-shot），任务的惰性（lazy）与及时（eager）提交，等等。笔者业余时间实践的 Excutors 库也正好实践完成了 [P1879R3](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p1897r3.html) 的内容，在  `std::execution` 发布的里程碑，借鄙文与大家简单聊聊 Executors。

<!-- more -->

**本文转载自知乎用户 [@Madokakaroto](https://www.zhihu.com/people/Madokakaroto) 所写文章 [浅谈 The C++ Executors](https://zhuanlan.zhihu.com/p/395250667)。著作权归原作者所有。**

## 1. Why Executors?

C++ 一直缺乏可用的并发编程的基础设施，而从 C++11 以来新引入的基础设施，还有 boost，folly 等第三方库的改进，都有或多或少的问题和一定的局限性。

### 1.1 `std::async` 并不 async

让时间回到 C++11 标准的近代。C++11 标准正式引入了统一的多线程设施，如`<thread>`，`<atomic>`, `<mutex>` 和 `<conditional_variable>` 等 low-level 的 building blocks；也引入了发起异步函数调用的接口 `std::async`。可 `std::async` 并不 async。借用 cppreference 上的示例来说明：

```cpp

std::async([]{ f(); }); /*a temp std::future<void> is constructed*/
/* blocked by the destructor of std::future<void> */
std::async([]{ g(); });

```

以一般理性而言，执行函数 g 的任务可能在函数 f 执行的时候，发起调度。但是如上所列代码使用 `std::async` 的方式，发起执行函数 g 的任务调度，一定发生在执行函数 f 的任务返回之后 [^1] 。原因是：

+ 第一行 `std::async` 创建了一个类型为 `std::future<void>` 的临时变量 Temp；
+ 临时变量 Temp 在开始执行第二行之前发生析构；
+ `std::future<void>` 的析构函数，会同步地等操作的返回，并阻塞当前线程。

[^1]: 编者注：该问题在之前的文章 [C++ std::async](/blog/2021/11/05/std-async/) 中提到过，准确来讲就是：std::async 返回的 std::future 是一个纯右值，那么此时如果不选择去使用左值去移动性的接收返回值，则此纯右值会在下一条语句执行前被析构，这将导致调用 std::async 的线程被该析构过程阻塞，造成事实上的同步执行，而不是异步，因此会造成严重的设计缺陷。

`std::async` 在初期还会为每一个发起的任务，创建一个新的执行线程。因此， `std::async` 臭名昭著。这里既然提到了 `std::future`，它同样也有不少的问题。

### 1.2 Future/Promise 模型的演进

[Future/Promise](https://en.wikipedia.org/wiki/Futures_and_promises) 模型是一个经典的并发编程模型，它提供给程序员完整的机制来控制程序的同步和异步。C++11 中也引入了 Future/Promise 机制。Future 本质上是我们发起的一个并发操作，而 Promise 本质上则是并发操作的回调。我们可以通过 Future 对象等待该操作和获取操作的结果，而 Promise 对象则负责写入返回值并通知我们。C++ 中典型的 Future/Promise 的实现如下图所示：

[![Future/Promise](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbq9nb9oej30ux0a3dhe.jpg "candark")](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbq9nb9oej30ux0a3dhe.jpg)

如图所示，Future 与 Promise 会有指向同一个共享的状态对象 Shared State 的共享指针（`std::shared_ptr` of Shared State），当 Promise 对象接受到返回值或者错误之后，通过条件变量通知另一端等待的 Future 对象。Future 对象则可以通过 Shared State 对象中的状态，来判断接收到回调之后是继续处理业务还是处理错误。由于 C++ 标准中的 Future/Promise 并不能表达任务的前置与后置的依赖关系，该模型很难满足实际的生产环境。

时间来到的当代，也就是 C++14 至 C++17 的时代，有不少类库试图解决这些问题。例如给予 Future/Promise 表达前置后置依赖的能力（`folly::future`）；能够 Fork 与 Join 的能力（`boost::future`）；还有为 Future/Promise 模型的后置任务，绑定操作 Executor 等。Future/Promise 则改进为如下的实现：

[![Improve](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqcd6ooyj30ux0ewaav.jpg "candark")](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqcd6ooyj30ux0ewaav.jpg)

我们可以通过在 Shared State 中新增 Continuations 对象来表达 **任务的前置后置关系** 。如果需要表达 **Fork**；Continuations 对象则是一个容器，同时为了保证线程安全，需要为 Continuations 额外准备一个 Mutex 对象。为了表达 Join，很多库也实现了 WhenAll/WhenAny 算法。再就是 Continuations 有时候也需要制定在哪个 Execution Context 上执行，很多库都抽象出了 `Semi Future` 与 `Continuable Future` 等概念。还有 `Shared Future` 可以在多个 Execution Context 上被等待。

以上这些优化，让 C++ 中的 Future/Promise 模型逐步完善，逐渐有了与 DAG 相同的表达能力。

### 1.3 Future/Promise 模型的缺点

虽然 Executors 提案从 12 年就开始起草，但早期的 Executor 提案还并没有提出 Sender/Recevier 模型，并依然基于 Future/Promsie 模型来表达任务图的关系。例如，来自 Google 专注于并发的提案 [N3378](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2012/n3378.pdf) 和来自 NVIDIA 专注于并行的提案 [N4406](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/n4406.pdf)，依旧使用 Future/Promise，他们主要把关注点放在了任务调度的抽象上。

大家在逐步推进提案的进程，一统并发与并行的抽象时，发现 Future/Promise 模型并不能胜任表达任务图的工作。主要有以下几个原因：

1. Future/Promise 模型总是及时地，积极地提交任务，而没有惰性提交的特性
2. 任务图中并不是所有的节点都需要 Sync Point，但 Shared State 都创建了同步对象（Condition Variables 和 Mutex）
3. Shared State 总是类型擦除的
4. 只能用并发来实现并行

首先，惰性提交可以保证我们创建完任务图之后再发起整个任务图的执行。这样可以带来两个好处，一个是创建任务图的过程中可以避免链接 Continuations 而使用锁，其次就是我们有机会分析依赖关系来应用更为复杂的调度算法。

问题 2，3 和 4，笔者都归因于类型擦除。类型擦除的实现，使得我们把所有的问题都抛给了程序的运行时，而完全扔掉了 C++ 强大的编译期能力。我们在使用 Future/Promise 的时候，已经标明了我们只关心 Task 的返回值:

```cpp

std::future<int> f = /* ..... */;

```

`std::future<int>` 表达了任意可以返回 int 类型的操作，因此它不得不丢掉任务图中的类型信息。如 Continuation 的函数对象类型，前置与后置任务的类型，任务图中的节点是否有同步点，Executor Context 的类型等等。而泛滥的使用类型擦除的结果就是抽象不足。而抽象不足则往往会引起语法有效语义无效的实现（例如 OOP 中的空实现），严重的性能问题还有表达能力的缺失。例如 Continuations 的类型擦除会丢失 inline 的优化机会，Shared State 的类型擦除会导致问题 2 与问题 4 的发生。

### 1.4 亟需更为泛型的抽象

市面上已有的一些基于 TaskNode 抽象的库，例如 Unity 的 JobSystem 和 UE4 的 TaskGraph，还有 [C++ TaskFlow](https://github.com/taskflow/taskflow)，他们都是类型擦除的实现，除了它们支持了惰性提交之外，其他的问题也无法解决。

问题的答案已经很明朗了，那就是更多的泛型抽象。我们需要一个更为泛型的Executors 抽象，来表达我们的任务图，调度策略，并带上执行器的类型信息；使得编译器能够有足够的机会进行激进的优化，使得调度器能够聪明地选择最优的算法，使得执行器能调度到除CPU之外的硬件中执行。这就是下一节将要介绍的 The Unified C++ Executors。

## 2. The Unified C++ Executors

The Unified C++ Executors 的首要任务，就是将 Future/Promise 改造得更为 Generic。于是就有了提案中的 Sender/Receiver。这一节主要介绍关于 Sender/Receiver 模型的一些概念，关于 Properties 的内容则放到以后的文章详细介绍。

## 2.1 Sender/Receiver 是泛型的 Future/Promise

笔者在这里就不介绍 Sender/Receiver 的技术细节了，例如 The Receiver Contract 和各种啰嗦的 Concepts 与接口设计等。笔者尽量以示例和图表来阐述Executors 的设计思想。我们先来看一个例子:

```cpp

using namespace std::execution;
sender auto s = 
    just(1) |
    transfer(thread_pool_scheduler) |
    then([](int value){ return 2.0 * value; });

auto const result = std::this_thread::sync_wait(s);

```

那么 s 的类型可能形如:

```cpp

then_sender<transfer_sender<just_sender<1>, thread_pool_scheduler_type>, lambda_type>

```

它的对象结构如下图：

[![Structure](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqm49tbvj30fm07uq3m.jpg "candark")](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqm49tbvj30fm07uq3m.jpg)

再给出一个用 folly 的 Futures 库表达的，不那么严谨的等价示例:

```cpp

auto f = folly::makeFuture<int>(1)
    .via(thread_pool_executor)
    .thenValue([](int value){ return 2.0 * value });
auto const result = f.get();

```

很显然，f 的类型已经擦除为了 `future<double>`，其对象结构如下图：

[![future\<double\>](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gwbqn7a028j30b604sweq.jpg "candark")](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gwbqn7a028j30b604sweq.jpg)

我们可以从对象结构中看到，sender 对象在类型上保留了全部的类型信息:

+ `then` 算法的传递进入的 lambda 类型
+ transfer 算法的 sender 类型
+ 线程池的类型
+ `just(1)` 返回的 sender 的类型
+ 还有它们之间完整的链接关系！

相比之下，future 对象结构则在类型上将这些信息完全丢弃了，只是作为运行期的数据保存于 Shared State 当中

Sender 是泛型的 Future，Receiver 是泛型的 Promsie，但 Sender/Receiver 模型的表达能力远远高于 Future/Promise 模型，表达能力的分析我们稍后详细展开来谈。这里值得提及的是，Sender 的对象结构，大家是否似曾相识？其实 Sender 的这种结构，是一个典型的 **表达式模板（expression template）** 。表达式模板常用于 **Linear Algebra Math Library 和 Lexer** 的设计与实现中，因为表达式模板天性就是 **惰性求值（Lazy Evaluation）的** ，非常适合这些应用场景。Expression Template 的设计模式在这里应用到 Sender/Receiver 模型中，再适合不过了。

### 2.2 通过算法来组合Senders

2.1 节中的代码使用了链式的 pipe operator，如果我们用原始的算法来实现，就如下代码所示：

```cpp

using namespace std::execution;
sender auto s = 
    then(
        transfer(
            just(1), 
            thread_pool_scheduler), 
        [](int value){ return 2.0 * value; });

auto const result = this_thread::sync_wait(s);

```

其中 `just` 不以任何 Sender 对象作为输入，而返回一个新的 Sender，它是Sender 的工厂（Factories）。同样 Scheduler 也是工厂，因为 `scheduler.schedule()` 通常也会返回一个 Sender 对象。`transfer` 和 `then` 则以Sender 对象，或带有其他对象作为输入，并输出 Sender. 这类的算法是 Sender 的适配器（Adaptor）。最后， `std::this_thread::sync_wait` 则以 Sender 作为输入，而并不返回一个新的 Sender，它是 Sender 对象的消费者（Consumer）。其中，消费者算法一般都不支持 pipe operator，原因是担心对用户造成消费者算法还能继续有后继的误导。

Executors 中的算法，一定属于这三类中的一个。当用户需要根据自己的业务情况，扩展自己的算法时，就需要确定算法属于那一类。并且还需要实现好算法对应的 Sender 和 Receiver。通常工厂还需要实现自己的 Operation State 对象，因为工厂创建出的 Sender 往往都是一切操作的起点。P2300R1 中的 [\[4.12\]](http://open-std.org/JTC1/SC22/WG21/docs/papers/2021/p2300r1.html#design-sender-factories)，[\[4.13\]](http://open-std.org/JTC1/SC22/WG21/docs/papers/2021/p2300r1.html#design-sender-adaptors) 与 [\[4.14\]](http://open-std.org/JTC1/SC22/WG21/docs/papers/2021/p2300r1.html#design-sender-consumers)，分别介绍了库中默认的三类算法的集合。

### 2.3 连接 Sender 与 Receiver

如果我们要发起一个 Sender 对象表达的操作，就需要将 Sender 与一个 Recevier 对象连接在一起。`std::execution::connect(sender, receiver)` 则会返回一个 Concepts 为 `operator_state` 的对象，并通过调用`std::execution::start(operation_state)` 发起操作执行。例如， `std::this_thread::sync_wait` 的实现，可能如下代码所示：

```cpp

struct sync_wait_t
{
    template <sender S>
    auto operator() (S&& s) const
    {
        using promise_t = get_promise_type_t<S>; // get promise type
        promise_t promise{}; // construct a promise
        _sync_primitive sync{}; // construct a synchronise primitive object
        sync_wait_receiver receiver{ promise, sync };

        // start the operation
        execution::start(execution::connect(forward<S>(s), move(receiver)));

        sync.wait(); // wait on this thread
        return promise.get_value(); // return value
    }
};

```

代码中可以看到 `std::this_thread::sync_wait` 中调用连接 Sender 和 Receiver，并发起返回的 Operation State 的代码。除此之外，还在当前线程上同步地等待发起操作的完成。

**Sender 的组合是一个创建任务图的过程，而连接 Sender 与 Receiver 则是遍历任务图的过程。** 整个过程是一个深度优先的遍历，直到遍历至工厂创建的 Sender。前面有提及过，工厂创建的 Sender 才会在与连接 Receiver 的时候，创建出可以发起的 Operation State 对象。那么，还是以文章一开始的代码为例，我们来模拟一下 Connect 的过程，如下图所示：

[![Connect](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqxzohm7j31400uzmz9.jpg "candark")](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gwbqxzohm7j31400uzmz9.jpg)

上图展示了 Sender 表达式与 `sync_wait_receiver` 的连接过程的每一个步骤，可以较为清晰的看到 `sync_wait_receiver` 最终与 `just_sender` 连接起来，并创建了 Operation State 对象。而且，中间的每个算法的 `Receiver` 对象，以 Sender 相反的顺序，保存在各个连接的层级当中。任务启动以后，Operation State 就会以 Receiver 的关系作为顺序，驱动整个任务的执行进程。

### 2.4 Sender/Receiver 模型与编译期优化

泛型与惰性提交，给了编译器足够多的信息和机会进行优化。相较于 Future/Promise 模型，其中最大的优化就是 Sender/Receiver 可以抹除调 Shared State 的运行期开销。我们把 2.1 节中用 Sender/Receiver 实现的代码的执行过程，用图表示：

[![Processing](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gwbqzlcc81j30vc0kx75i.jpg "candark")](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gwbqzlcc81j30vc0kx75i.jpg)

整个过程实际上只在 `std::this_thread::sync_wait` 那里创建了一次 Shared State 对象。不仅如此，如果大家阅读过 libunifex 还可以得知，该 Shared State 是一个栈上对象，并没有堆分配。除此之外，lambda 对象也有内联优化的机会，而不会如同 Future/Promise 中使用 std::function 进行类型擦除后，而失去内联优化的机会。内联优化，也意味着对于并行算法，还有矢量化加速的优化机会。Future/Promise 不仅没有内联优化的机会，而且每一次使用链接 Futures 的算法 API，会实打实地创建一个 Shared State，也就是一个 Task，这也会给运行期带来不小的开销。实际上，Future/Promise 并不适合性能要求很高的生产环境，比如游戏引擎任务框架等。

Sender/Receiver 可以让编译器在编译期将这些负担丢除，提升性能的同时还了增强了表达能力。激进的优化导致的结果是， **代码中的 s 并不是表达了一个任务链，而是一个 Monad** 。Sender/Receiver 模型的粒度比 Future/Promise 的粒度更细。

## 3. 未来的展望

P2300R1 的发布，意味着 Executors 的迭代稳定了下来，未来将不会出现类似 P0443 这样脑洞大开的重构，希望 `std::execution` 能够早日进入 TS 阶段。 `std::execution` 中仍有不少脑洞大开的想法，在提案中悬而未决。

### 3.1 Sender/Receiver 与 Awaitable/Coroutine

笔者在学习 [\[The Ongoing Saga of ISO-C++ Executors\]](https://www.youtube.com/watch?v=iYMfYdO0_OU) 演讲的时候发现了 [\[P1341R0\]](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p1341r0.pdf) Paper 的核心观点是：

+ Awaitable 可以是一个 Sender
+ Coroutine 可以是一个 Receiver

在我们的合理封装下，就能够把协程也统一起来:

```cpp

auto const result = this_thread::sync_wait(s);
auto const result = this_fiber::sync_wait(s);

```

### 3.2 异构计算

标准委员会的大佬们，不遗余力地尝试使用泛型来设计 Executors，还有一个原因是为了布局异构计算。 Execution Context 与 Scheduler 等概念的抽象，可以让 Executor 不拘泥于只是 CPU Thread。它可以是一个常规的 CPU Thread，可以是一个 GPU，甚至是一个 Remote System。只有泛型，才能胜任这个工作，试问被 Future 中 std::function 类型擦出的函数对象，如何进行矢量化加速，如何优雅地调度到 GPU 上？ 泛型可以让代码的编译期上下文完整地保留到最后，也为未来创造了更多可能。

### 4. 引用参考

1. [P2300R1 - std::execution](http://open-std.org/JTC1/SC22/WG21/docs/papers/2021/p2300r1.html)
2. [P0443R14 - The Unified Executors Proposal for C++](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p0443r14)
3. [N3378 - A preliminary proposal for work executors](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2012/n3378.pdf)
4. [N4406 - Parallel Algorithms Need Executors](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/n4406.pdf)
5. [P1341R0 - UNIFYING ASYNCHRONOUS APIs IN C++ STANDARD LIBRARY](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p1341r0.pdf)
6. [P1897R3 - Towards C++23 executors: A proposal for an initial set of algorithms](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p1897r3.html)
7. [P1054R0 - A Unified Futures Proposal for C++](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p1054r0.html)
8. [Facebook - Lib Unified Executor](https://github.com/facebookexperimental/libunifex)
9. [Youtube - The Ongoing Saga of ISO-C++ Executors](https://www.youtube.com/watch?v=iYMfYdO0_OU)

<div class="ref-label">注：</div>