---
title: C++ 协程 - 线程池
date: "2024-10-10 20:56:00"
tags: [C++]
category: blog
---

线程池总体分为 3 部分：工作线程，定时器线程以及任务派发线程，每种线程都有对应的锁，队列和信号量。

<!-- more -->

根据现有信息，可以大致拟划出线程池需要的非静态数据成员（出于教学目的，只依赖 C++ 标准库，如有需求可以自行调整）：

```cpp

class thread_pool
{
    bool exit_flag_{};                                  // 线程池结束标记
    std::vector<wthread> work_threads_;                 // 工作线程储存容器
    std::vector<wthread*> pending_list_;                // 空闲工作线程列表
    mutex pending_mutex_;                               // 保护空闲列表的锁
    std::priority_queue<lazy_task> lazy_queue_;         // 延迟任务的队列
    std::priority_queue<priority_task> dispatch_queue_; // 具有优先级的任务队列
    std::counting_semaphore<> lazy_waiter_{ 0z };       // 延迟任务的等待器
    std::counting_semaphore<> priority_waiter_{ 0z };   // 优先级任务的等待器
    std::jthread lazy_thread_;                          // 延迟任务的派发线程
    std::jthread priority_thread_;                      // 优先级任务的派发线程
    mutex lazy_mutex_;                                  // 保护延迟任务的锁
    mutex priority_mutex_;                              // 保护优先级任务的锁
}

```

## 工作线程

为了让协程能在指定线程运行，需要为每个线程分配一个队列，保护队列的锁，同时还需要有一个信号量用于暂停线程以及线程对象本身。

```cpp

class wthread
{
	using vector = std::vector<std::coroutine_handle<>>;
	std::counting_semaphore<> s_{ 0z }; // 信号量暂停线程
	std::jthread t_{};                  // 运行线程
	vector w_{};                        // 待执行队列
	mutex m_{};                         // 保护队列的锁
}

```

之所以使用 `std::vector` 而不是 `std::deque` 是因为 [STL](https://github.com/microsoft/STL/issues/147) 的实现是错误的。另外 `std::coroutine_handle<>` 是平凡复制并且仅有一个指针的大小，同时队列中通常具有少部分元素，因此性能会比使用 `std::deque` 好。在实践中可以考虑使用环形队列。

`std::coroutine_handle<>` 是协程句柄，在后面的章节会讲到。协程句柄可以被无参数调用，类似 `std::function<void()>`，但与之不同的是，协程有自己传播异常的方式，因此接下来不需要考虑调用协程句柄会抛出异常。

为了能够让拥有指定线程 ID 的任务能够找到该线程，添加比较函数，以及 `join` 函数，用于关闭线程池时清理线程防止泄漏：

```cpp

bool operator==(std::thread::id id)
{
	return t_.get_id() == id;
}

void join() noexcept
{
	t_.join();
}

void push_back(std::coroutine_handle<> c)
{
	{
		std::lock_guard g{ m_ };
		w_.push_back(c);
	}
	s_.release();
}

```

`push_back` 函数用于添加任务，使用 `release` 函数通知信号量以唤醒该线程 。

因此，任务循环如下：

```cpp

void consume(thread_pool& pool) noexcept
{
	while (true)
	{
		s_.acquire();
		if (pool.is_exit_())
			break;
		m_.lock();
		auto t = w_.front();
		std::copy(++w_.begin(), w_.end(), w_.begin());
		w_.pop_back();
		m.unlock();
		t();
	}
}

```

`consume` 中的所有函数都不会失败，因此锁定和解锁可以直接使用成员函数而不需要使用 `unique_lock`。注意在调用 `t` 之前需要解锁，否则会变成阻塞执行。

由于严格保证一个任务 `release()` 一次，因此不需要判断任务队列是否为空。一个特殊情况是当线程池要退出时，需要额外唤醒一次工作线程，（在后文）实现时会保证先让退出标记为真，再发起通知，因此在 在 `s_.acquire()` 返回后，直接检查线程池是否退出就能保证不会访问到空队列。

然后实现线程启动：

```cpp

void start(thread_pool& pool)
{
	t_ = std::jthread([this, &pool] { consume(pool); });
}

```

由于工作线程需要等到线程池的其他成员都准备好后再启动，因此需要给工作线程特设一个 `start` 函数用于启动线程。由于基本的互斥锁都是不能移动的，想要让互斥锁移动需要将锁独立分配在堆上，而在本例中不需要这么复杂，因此本例中不能使用移动构造函数来让 `wthread` 使用移动的方式延迟绑定到线程（而 `std::thread` 由于不储存锁因此可以使用移动的方式）。

`consume` 的参数是线程池，而不是让线程池引用是 `wthread` 的成员，是因为引用不能默认初始化，而我又不喜欢箭头，因此使用参数是一种简洁的避免这个问题的解决方案。

在线程池销毁时，工作线程可能由于没有剩余任务而等待在 `s_.acquire()` 调用上，还需要一个 `wake()` 函数用于在线程池结束时唤醒线程让线程有序退出。

```cpp

void wake() noexcept {
	s_.release();
}

```

至此，工作线程基本完成了，但实际上还有一个额外的设计，将在后文补充。

## 就绪列表

`pending_list_` 中实际存放的是就绪（空闲线程）列表，在初始时所有线程都在该列表中，优先级任务被出队时，首先在该列表中取得一个工作线程，然后再在工作线程执行完当前任务后归还该列表。当每当延迟任务到时间时，首先会尝试将线程从就绪列表中取出并发送任务，如果没有可用的线程，则会将任务发送到优先级队列中。

如果当前没有工作线程可用，则优先级任务线程会一直等待，直到有工作线程将自身还回就序列表中。

因此，完整版的工作线程实现如下：

```cpp

class wthread
{
	using vector = std::vector<std::coroutine_handle<>>;
	std::counting_semaphore<> s_{ 0z }; // 信号量激活线程
	std::jthread t_{};                  // 运行线程
	vector w_{};                        // 待执行队列
	mutex m_{};                         // 任务队列
	bool r_{};                          // 是否需要还回就绪队列
public:
	wthread() = default;
	bool operator==(std::thread::id id)
	{
		return t_.get_id() == id;
	}
	void join() noexcept
	{
		t_.join();
	}
	// 线程安全的发送任务到线程
	void push_back(std::coroutine_handle<> c)
	{
		{
			std::lock_guard g{ m_ };
			w_.push_back(c);
		}
		s_.release();
	}
	// 仅用于清理
	void wake() noexcept {
		s_.release();
	}
	// 发起任务并告知已经从就绪队列中移除
	void push_back_and_add(std::coroutine_handle<> c)
	{
		{
			std::lock_guard g{ m_ };
			w_.push_back(c);
			r_ = true; // 必须出现在release前，push_back后
		}
		s_.release();
	}
	// 循环
	void consume(thread_pool& pool) noexcept
	{
		while (true)
		{
			s_.acquire();
			if (pool.is_exit_())
				break;
			m_.lock();
			auto t = w_.front();
			std::copy(w_.begin() + 1, w_.end(), w_.begin());
			w_.pop_back();
			m_.unlock();
			t();
			if (r_) // 如果该线程从就绪队列移除了，在执行后重新添加它
			{
				r_ = false;
				std::lock_guard lock{ pool.pending_mutex_ };
				pool.pending_list_.push_back(this); // 不会失败
				// 反向唤醒优先级任务执行线程
				pool.priority_waiter_.release();
			}
		}
	}
	// 启动
	void start(thread_pool& pool)
	{
		t_ = std::jthread([this, &pool] { consume(pool); });
	}
};

```

`push_back` 和 `push_back_and_add` 的区别是：

+ 前者是在指定线程运行任务时使用的，这是线程池的功能，在这种情况下任务会无条件的被送入该工作线程的队列，而不需要关心该线程是否已就绪，这也是为什么工作线程储存任务要使用一个队列而不是一个 `std::coroutine_handle<>` 的原因。
+ 后者在延迟任务队列以及优先级任务队列在出队时使用

然后，给线程池类添加上使用该就序列表的函数：

```cpp

// 尝试将线程从就绪列表中取出并且发送任务
bool try_run_(std::coroutine_handle<> handle)
{
	std::lock_guard lock{ pending_mutex_ };
	if (pending_list_.empty())
		return false;
	auto& back = *pending_list_.back();
	back.push_back_and_add(handle); // 可能失败
	pending_list_.pop_back();
	return true;
}

```

唯一需要注意的是 `push_back_and_add` 函数调用可能失败，因此需要在 `pending_list_.pop_back()` 前调用它并且使用 `std::lock_guard` 保护到最后。

## 延迟任务和优先级任务

这部分其实没什么好说的，将 `lazy_task` 和 `priority_task` 实现为聚合类即可：

```cpp

struct priority_task
{
	std::coroutine_handle<> handle;
	std::size_t priority;
	std::strong_ordering operator<=>(priority_task const& rhs) const noexcept
	{
		return priority <=> rhs.priority;
	}
};
struct lazy_task
{
	std::coroutine_handle<> handle;
	std::chrono::steady_clock::time_point time;
	std::strong_ordering operator<=>(lazy_task const& rhs) const noexcept
	{
		return rhs.time <=> time;
	}
};

```

注意，延迟任务需要小根堆，而 `std::priority_queue` 默认是大根堆，因此需要调换延迟任务的比较函数的左侧参数和右侧参数对此进行调整。

## 优先级任务循环

到此为止，如何实现该函数以及非常简单了：

```cpp

void priority_loop_()
{
	while (true)
	{
		priority_waiter_.acquire();
		if (is_exit_())
			break;
		std::lock_guard lock{ priority_mutex_ };
		// 由于来自工作线程的过通知，可能存在容器为空的情况
		if (priority_queue_.empty())
			continue;
		if (try_run_(priority_queue_.top().handle))
			priority_queue_.pop();
	}
}

```

整体和工作线程的任务循环类似，但唯一不同的是，工作线程是严格的 1:1 通知和消费，而优先级任务循环不是，因此需要检查队列是否为空。

## 延迟任务循环

实现延迟任务循环则略微复杂：

```cpp

void lazy_loop_()
{
	while (true)
	{
		lazy_waiter_.acquire();
		if (is_exit_())
			break;
		std::unique_lock lock{ lazy_mutex_ };
		// 如果到时间，则立即执行任务
		if (auto task{ lazy_queue_.top() }; task.time < decltype(task.time)::clock::now())
		{

			lazy_queue_.pop();
			// 仅在队列还剩余有元素时才通知下一轮
			if (!lazy_queue_.empty())
				lazy_waiter_.release();
			lock.unlock();
			// 到此为止，说明该任务已到时间适合执行
			if (auto h = task.handle; !try_run_(h))
				run_once(h, std::size_t(-1));
		} else {
			// 如果未到时间，则等待到时间或被通知
			// 先无条件释放锁，防止阻塞插入任务
			lock.unlock();
			// 并且此时count<=size-1，wait为0
			// 尝试等待到指定时间，如果返回true，说明有多个任务，此时将count消耗为0，发生等待
			(void)lazy_waiter_.try_acquire_until(task.time);
			// 如果中途返回，代表新任务被插入
			// 无论返回什么，都无条件release 1
			// 因为新信号量通知会被立即消费
			lazy_waiter_.release();
			// 直接进入下一轮
		}
	}
}

```

首先，`lazy_waiter_.acquire()` 保证仅仅在队列中有元素时才返回，因此无需在入口判断队列是否为空。其次在未到时间时，先解锁再使用 `try_acquire_until`，这非常类似于条件变量的 `try_wait_until`，但不同于条件变量，此时并不需要重新上锁，而是进入下一轮。最后，`task` 需要复制而不是仅仅使用左值引用，因为锁无论在等待分支还是执行分支都会先被无条件解除。

## 线程池构造和析构

```cpp

thread_pool(std::size_t num = 0uz)
	: work_threads_(std::max<std::size_t>({ std::thread::hardware_concurrency(), num, 2uz }))
{
	for (auto& i : work_threads_)
	{
		pending_list_.push_back(&i);
		i.start(*this);
	}
	lazy_thread_ = std::jthread{ [this]() { lazy_loop_(); } };
	priority_thread_ = std::jthread{ [this]() { priority_loop_(); } };
}
void exit() noexcept
{
	exit_flag_ = true;
	lazy_waiter_.release();
	priority_waiter_.release();
	for (auto& i : work_threads_)
		i.wake();
}
~thread_pool()
{
	exit();
	lazy_thread_.join();
	priority_thread_.join();
	for (auto& i : work_threads_)
		i.join();
}

```

线程池构造时，首先计算好合适的线程数量，然后循环将就序列表填充并且启动工作线程，最后启动优先级任务线程和延迟任务线程。之所以要在函数体内启动，是为了防止过早启动的线程访问到未初始化的其他成员。

在析构函数中，首先调用 `exit` 函数通知所有线程退出，然后手动 `join` 所有线程防止过晚 `join` 的线程访问到被销毁的成员。

由于信号量的 `release` 函数保证所有副作用都可见，而所有消费 `exit_flag_` 的地方都经过 `acquire` 获取，因此 `exit_flag_` 只需要为普通的 `bool` 即可。

## 上下文及其捕获

```cpp

class context
{
	std::thread::id tid_;
	friend thread_pool;
	std::thread::id id() const noexcept
	{
		return tid_;
	}
	context(std::thread::id tid) noexcept
		: tid_(tid)
	{
	}
	bool operator==(std::thread::id tid) const noexcept
	{
		return tid_ == tid;
	}
public:
	context() = default;
	context(const context&) = default;
	context& operator=(const context&) = default;
	bool operator==(const context& c) const = default;
};
// 仅能在线程池线程中调用
static context capture_context() noexcept
{
	return context{ std::this_thread::get_id() };
}

```

上下文即线程 ID，但为了确保不会误用，禁止用户从线程 ID 转换为上下文。

## 发起任务

最后要实现的就是任务发起函数：

```cpp

void run_once(std::coroutine_handle<> callback, std::size_t priority = 0uz)
{
	std::lock_guard lock{ priority_mutex_ };
	priority_queue_.emplace(callback, priority);
	priority_waiter_.release();
}
void run_after(std::coroutine_handle<> callback, std::chrono::milliseconds duration)
{
	auto time{ std::chrono::steady_clock::now() + duration };
	std::lock_guard lock{ lazy_mutex_ };
	lazy_queue_.emplace(callback, time);
	lazy_waiter_.release();
}
void run_in(std::coroutine_handle<> callback, context ctx)
{
	for (auto& i : work_threads_)
	{
		if (i == ctx.tid_)
		{
			i.push_back(callback);
			return;
		}
	}
	// 上下文是损坏的，程序有 BUG
	std::abort();
}

```

函数的逻辑非常简单，唯一需要注意的是 `emplace` 要早于 `release`，保证异常安全，其余内容留给读者自行思考。
