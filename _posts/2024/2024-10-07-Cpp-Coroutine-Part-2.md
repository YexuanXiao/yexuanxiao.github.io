---
title: C++ 协程 - 并发原语
date: "2024-10-07 14:57:00"
tags: [C++]
category: blog
---

本节内容主要介绍了实现线程池所用的并发原语：原子操作、互斥锁、条件变量以及信号量。

<!-- more -->

## 内存模型

任何编程语言（包括汇编这种低级编程语言）都必须定义内存模型以指导程序如何编写才不会在多线程中出现数据竞争，在 2004 年有两篇经典论文指出了高级编程语言中存在的这个问题：Hans Boehm 的[线程不能实现为库](https://typeset.io/pdf/threads-cannot-be-implemented-as-a-library-4iip70j70p.pdf)以及 Scott Meyers 和 Andrei Alexandrescu 的[C++ 和双重检查锁定模式（DCLP）的风险](https://mysteriouspreserve.com/blog/2021/09/20/Cpp-and-the-Perils-of-Double-Checked-Locking/)；Russ Cox 在 2021 年编写的文章[硬件内存模型](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/)则总结性的概括了自 1997 年起硬件内存模型发展的辛路历程。

## 原子操作

C++ 提供了六个内存序标签去使用四种内存序来描述 C++ 的内存模型，这些内存序的定义比较复杂，如果读者想要全面的学习，可以阅读 [std::memory_order](https://zh.cppreference.com/w/cpp/atomic/memory_order)、[编程语言内存模型](https://mysteriouspreserve.com/blog/2023/04/19/Programing-Memory-Models-ch/)以及《C++ 并发编程实战 第二版》等专业资料，本文所讲述的只是一种简化模型。

C++ 原子操作的结果，可以通过观测原子变量的值来定义。无论哪种内存序标签以及何种操作，都保证读取时一定完整的读取到“上一次”储存的值，而不会是两次写入叠加在一起产生的值。“上一次”指的就是观测时观测到的值被写入的那一次。

acquire 的读，能够在它本身以及后续的非原子读取，和发出这次读取的值的 release 的写，以及 release 写之前的非原子写入之间建立同步关系。该关系被称作“先发生于（happens-before）”，如果 A 先发生于 B，则 B 能观察到 A 及 A 之前的所有副作用。

生产出的数据，使用 release 写原子变量 x 的值为 v，能在 acquire 读 x 值为 v 后使用。

而 relaxed 操作不建立“先发生于”关系，不能用于同步：relaxed 的写只生产它字节本身的值，relaxed 的读只能够消费该变量自己的值。

因此，C++11 的所有锁的 `unlock` 操作都先发生于 `lock`，使得每次生产出数据而释放锁后，都能在获得锁后使用。

## 互斥锁

可以这样实现锁：

```cpp

class mutex
{
	std::atomic<int> s_{};

public:
	void lock() noexcept
	{
		while (s_.exchange(1, std::memory_order::acquire))
				s_.wait(1, std::memory_order::relaxed);
	}

	bool try_lock() noexcept
	{
		return !s_.exchange(1, std::memory_order::acquire);
	}

	void unlock() noexcept
	{
		s_.store(0, std::memory_order::release);
		s_.notify_one();
	}
};

```

`s_` 被值初始化为 0。

`lock` 函数在每次循环时尝试用 acquire 交换 1 给 `s_`，如果 `s_` 返回 1，说明该锁已经被锁定。

随后，使用 relaxed `wait` 等待 `s_` 的值直到 `s_` 的值被其他线程改为不是 1（改为 0）。

如果 `exchange` 返回 0，则 `s_` 被原子的设置为了 1，并且先前值是 0（没上锁）。

在 `try_lock` 内，仅尝试一次 `exchange`。

最后，在 `unlock` 内，release `store` 0 给 `s_`，并且发出通知。

由于同步关系是 `store`/`exchange` 建立的，因此 `wait` 只需要使用 relaxed 即可。

在其他使用 `wait` 的场景中，例如通过原子实现信号量时，`wait` 需要使用 acquire。

通过添加 C++20 新增的的 `wait` 和 `notify_one` 函数调用，可以做到让锁不再自旋。这项技术是[增加等待增强 std::atomic_flag (P0514R0)](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0514r0.pdf) 中提出的，同时作者给出了性能数据和[参考实现](https://github.com/ogiroux/semaphore/blob/master/lib/semaphore.cpp)。

Linus Torvalds 指出，一个吞吐量高的锁通常具有更高的延迟，而延迟更低的锁可能花费了更多时间在自旋上，占用了更多的 CPU，[内核提供的锁是针对这两点的平衡](https://www.realworldtech.com/forum/?threadid=189711&curpostid=189723)。虽然 Linus Torvalds 同时声称不要自己实现锁，但实际上我们知道 `wait` 和 `notify` 使用 futex 实现，因此在 Linux 上这效果不错。在 Windows 上，则由 `WaitOnAddress`、`WakeOnAddressSingle` 实现。读者可以自行阅读各大标准库相关源码来观测这点。

实际上 `WaitOnAddress` 也是实现 [Windows Vista 开始存在的 SRWLock](https://learn.microsoft.com/en-us/archive/msdn-magazine/2012/november/windows-with-c-the-evolution-of-synchronization-in-windows-and-c) 的方式，甚至也是 CriticalSection 在 Windows Vista 开始的实现方式（但为了二进制兼容性，CriticalSection 无法减小内存占用）。

`WaitOnAddress` 会发生虚假唤醒，因此需要在循环中调用 relaxed `wait` 来检查 `s_` 是否真的被修改为 0，而不是仅等待一次。关于 `WaitOnAddress` 还可以阅读 [Raymond Chen 的一系列文章](https://devblogs.microsoft.com/oldnewthing/20201214-00/?p=104544)。

由于 futex 只支持 `sizeof(int)` 大小的数据被 `wait` 和 `notify`，因此上例中固定使用 `std::atomic<int>` 实现锁，而 `WaitOnAddress` 支持 1、2、4、8 字节，无此限制。

## 条件变量和信号量

一般来说，线程池使用条件变量来解决忙等问题，C++ 的条件变量提供了 `wait` 和 `wait_for` 函数用于休眠线程，以及 `notify_one` 和 `notify_all` 函数用于唤醒线程。

但本文使用 `std::counting_semaphore` 代替条件变量，有三个原因：

1. STL 由于 ABI 兼容问题以及为了兼容 Windows XP，当前的 `std::mutex` 实现并不好，这也影响了 `std::condition_variable`
2. macOS 的 `std::mutex` 在一些情况下表现奇差，参考 P0514R0
3. 条件变量的 `wait` 函数会无条件重新获得锁，在当前线程池设计中这是多余的
4. 信号量也是一种强大的工具，它的概念比条件变量简单

信号量的 `acquire` 函数每次会尝试将计数减小 1，除非计数是 0。当计数是 0 的时候，函数阻塞并直到能减小 1。

信号量的 `release` 函数会将计数增加 n，默认是 1。在本实现中中固定每次只增加 1。

信号量的 `release` [函数强先发生于](https://zh.cppreference.com/w/cpp/atomic/memory_order#%E5%BC%BA%E5%85%88%E5%8F%91%E7%94%9F%E4%BA%8E)调用观察效果结果的 [try_acquire](https://eel.is/c++draft/thread.sema#cnt-10)，因此可以保证用于安全同步。

但信号量比条件变量缺少 `notify_all` 函数，这是由于信号量的概念决定的：信号量用于单一消费者。不过多消费者在一些情况下可以转换为单消费者。在抢占式线程池中，所有线程共用一个条件变量，`notify_all` 可以一次性在线程池销毁时通知所有线程退出，但通过在每个线程池线程退出时使用 `notify_one` 唤醒下一个线程，也能做到同样的目的。对于派发式线程池，也就是本文所实现的，只需要对每个线程独有的信号量使用 `noify_one` 即可。

使用信号量可以实现没有 `notify_all` 函数的条件变量：

```cpp

class condition_variable
{
	std::counting_semaphore<> s_{0z};

  public:
	condition_variable() noexcept = default;

	void notify_one() noexcept
	{
		s_.release();
	}

	void wait(std::unique_lock<mutex> &lock) noexcept
	{
		lock.unlock();
		s_.acquire();
		lock.lock();
	}

	template <class Rep, class Period>
	std::cv_status wait_for(std::unique_lock<std::mutex> &lock,
							const std::chrono::duration<Rep, Period> &rel_time)
	{
		lock.unlock();
		auto st = s_.try_acquire_for(rel_time);
		lock.lock();

		return st ? std::cv_status::no_timeout : std::cv_status::timeout;
	}

	template <class Clock, class Duration>
	std::cv_status wait_until(std::unique_lock<std::mutex> &lock,
							const std::chrono::time_point<Clock, Duration> &abs_time)
	{
		lock.unlock();
		auto st = s_.try_acquire_until(abs_time);
		lock.lock();

		return st ? std::cv_status::no_timeout : std::cv_status::timeout;
	}
};

```

标准库中的条件变量 `wait` 函数还包含有谓词的重载，由于它很好实现，因此在本例中不实现它们。

实际上（二元）信号量还可以用于反过来实现锁，留给读者思考。许多并发原语有一些类似之处并且在特定用途下可以互相替代，但信号量和条件变量仍然是不同的并发原语，例如信号量的 `acquire` 可以保证不发生虚假唤醒，而条件变量的 `wait` 则不保证这一点。设计不同并发原语的目的是指导用户如何正确使用它们，编写正确的并发代码需要正确的抽象。注意，操作系统可以更有效的实现条件变量，本例子仅用于展示并发原语的可互换性，并不对性能负责。实际生产时应该确保在 Windows 上使用 SRWLock 和 Windows 信号量。
