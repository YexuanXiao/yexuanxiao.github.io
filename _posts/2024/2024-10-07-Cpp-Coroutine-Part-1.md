---
title: C++ 协程 - 综述
date: "2024-10-07 01:10:00"
tags: [C++]
category: blog
---

协程是 C++ 20 标准中新添加的一个重要语言特性，包含了一些新语法和协程支持库，然而，如何使用协程进行编程还是一片蓝海。

<!-- more -->
C++ 的无栈协程最早出现于 2012 年，当时被叫做 [Resumeable Functions](https://www.open-std.org/JTC1/SC22/WG21/docs/papers/2012/n3328.pdf)，由 Visual C++ 团队的 Niklas Gustafsson 提出，Visual C++ 团队在当时设计了代号为 Casablanca 的 [C++ Rest SDK](https://github.com/microsoft/cpprestsdk)。[Resumeable Functions rev.4](https://isocpp.org/files/papers/N4402.pdf)是最接近最终设计的带有教学性质的版本，而 2018 年发布的 [Working Draft, C++ Extensions for Coroutines](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0057r8.pdf) 第八版则几乎可以被认为是最终设计。

笔者在接触协程后使用过一些库，例如 [C++/WinRT](https://github.com/microsoft/cppwinrt)、[Drogon](https://github.com/drogonframework/drogon)、[stdexec](https://github.com/NVIDIA/stdexec) 等，但都是基于别人已有成果的二次创作，如何从零开始编写一个可用的基于协程的异步设施仍然是笔者头上的一顶乌云以及待办列表中的重要一项。同时，网络上关于如何使用协程的教程也寥寥无几，主要有 [C++ Reference](https://zh.cppreference.com/w/cpp/language/coroutines)、[C++20 协程原理和应用](https://zhuanlan.zhihu.com/p/497224333)、以及 [Asymmetric Transfer](https://lewissbaker.github.io/) 等。许传奇等人的教程主要介绍了协程的基本接口，但过于简单，C++ Reference 则是较为准确的描述了这些接口如何被编译器使用，而 Lewis Baker 的教程比较全面但过于复杂，都缺乏理论与实践结合。

因此本系列教程从 0 开始，从理论到实践去实现一个协程接口的线程池，并且模仿 C++/WinRT 风格实现了通过协程去使用线程池，可以说不仅仅是一个协程教程，也是一个异步教程。由于本文和代码皆由本人一人编写，如有疏漏和错误，还请指正和包涵。同时，本教程为了简化起见，尽量利用标准库已有功能，因此存在一定优化空间，实际应用时可自行优化。

作为前置要求，本教程需要读者至少有掌握《C++ Primer 第五版》的水平，同时本文也涉及了《C++ 并发编程实战 第二版》的一部分内容：锁、线程、原子、信号量，如果读者阅读过此书最好。在阅读本文之前，读者也可以准备好 C++ Reference 中相应的页面。许传奇等人的教程可以作为阅读本文前的开胃小菜，但不阅读也没关系。同时，Lewis Baker 的教程仍然是最全面的协程教程，C++ Reference 的协程部分是标准文档的重新编排，是理解协程的微言大义重要的资料。

C++ 的协程是精简且强大的，因此可以说是千人千面，笔者的思路和其他人大概率是不同的，因此注定只能是抛砖引玉，并不能代表协程的全貌。本教程以模仿 C++/WinRT 为出发点，但并不采取它的代码。本教程会尽量保证内容的全面和准确，至于其他协程的使用方式，留给其他人以及未来的读者。

在阅读本教程时也不要有什么压力，异步是一个非常复杂的话题，能力是经验的积累，不存在捷径。如果中途有不理解的地方，可以阅读前文给出的参考资料。个人推荐的学习方式是先做到理解 50%，剩下的 50% 在后续学习中就会逐渐理解了，没有一劳永逸。

该线程池有五大设计目标：

1. 线程池的线程数确定，这是为了简化代码，并且由于协程是无阻塞的，因此可以预计不会需要过多线程
2. 线程池要支持延迟执行任务，这类似于 JavaScript 的 `setTimeout`，由于无栈协程的早期实践之一就是 Promise A+（2012 年），这自然在情理之中，同时 C++/WinRT 也对此提供了直接支持
3. 线程池需要支持任务的优先级，高优先级任务可以被优先执行
4. 线程池需要支持在指定线程运行任务，这是 C++/WinRT 的独有设计，同时在指定线程运行任务是最高优先级
5. 线程池支持安全的结束，这点是对正确性的追求

因此，目标是如下类：

```cpp

class thread_pool
{
public:
	thread_pool(std::size_t num);
	~thread_pool();
	void exit();
	class context;
	static context capture_context() noexcept;
	void run_in(std::coroutine_handle<> callback, context ctx);
	void run_after(std::coroutine_handle<> callback, std::chrono::milliseconds duration);
	void run_once(std::coroutine_handle<> callback, std::size_t priority);
};

```

同时，为了使用该线程池，仿照 C++/WinRT 提供以下 API：

```cpp

auto /* awaiter */ resume_background();

context capture_apartment();

auto /* awaiter */ operator co_await(context c);

template <class Rep, class Period>
auto /* awaiter */ operator co_await(std::chrono::duration<Rep, Period> d);

auto /* awaiter */ get_cancellation_token();

```

`resume_background` 返回一个 Awaiter，调用 `co_await resume_background()` 会将任务发送给后台线程（即线程池）。

`capture_apartment` 返回当前上下文，该上下文关联一个线程池中的线程，随后可以使用 `co_await context` 来将接下来的任务转移至该线程。

最后一个函数则提供 `co_await 1s` 这种代码的支持，将任务转移至线程池并且延迟 1 秒执行。

而 `cancellation_token` 则是用于协程任务被取消的观察器，类似 C++ 20 的 `std::stop_token`。

还提供了这些任务类：

```cpp

template <typename T>
class task;

template<>
class task<void>;

template <typename T, typename U>
class task_with_progress;

template <typename U>
class task_with_progress<void, U>;

```

这些 API 来自 C++/WinRT，读者可以在[使用 C++/WinRT 执行并发和异步操作](https://learn.microsoft.com/zh-cn/windows/uwp/cpp-and-winrt-apis/concurrency)和[通过 C++/WinRT 实现高级并发和异步](https://learn.microsoft.com/zh-cn/windows/uwp/cpp-and-winrt-apis/concurrency-2)找到，但注意我对它们进行了一些修改。

最后，感谢 [@aleck099](https://github.com/aleck099) 在前期给予的帮助，[@frederick-vs-ja](https://github.com/frederick-vs-ja) 提供的技术支持以及 [@zwuiz](https://github.com/) 审查了第五章的内容指出了等待器变换中存在的问题。
