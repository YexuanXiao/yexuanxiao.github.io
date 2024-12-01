---
title: C++ 协程 - 协程理论
date: "2024-10-11 16:37:00"
tags: [C++]
category: blog
---

协程中最主要的两个概念是 Awaiter 和 Promise，Awaiter 用于协程切换，而 Promise 用于储存用户定义的协程状态信息以及结果。此外，协程还需要一个用于管理协程以及获得协程结果的 Task。

<!-- more -->

一个返回 Task，函数体内有 `co_await`、`co_yield` 表达式或 `co_return` 语句，且通过 `std::coroutine_traits<Task>` 能获得满足 Promise 要求的类类型的函数（包括成员函数）是协程。`co_await` 表达式用于同步一个 Awaiter 或者一个 Task 的执行，`co_yield` 表达式用于从协程中获取一个值，`co_return` 语句用于在协程返回时输出一个结果。

## 协程句柄和无操作协程

`std::coroutine_handle<T>` 是一个类模板，指向一个协程，换句话说，是协程的句柄。

当前所有实现都保证它的所有特化都是可默认构造且平凡复制的，在这些典型实现中，它都只储存一个指针。

有两个确定的特化 `std::coroutine_handle<void>`、`std::coroutine_handle <std::noop_coroutine_promise>` 以及交给用户的特化。用户定义的特化可以隐式转换为 `std::coroutine_handle<void>`。

标准库提供了 `std::noop_coroutine` 函数用于返回一个无操作协程的协程句柄，无操作协程在一些情况下可以用于作为协程句柄的默认值，并且可以如同有操作协程那样被恢复和销毁，但无操作协程的恢复和销毁都是空函数。`std::coroutine_handle <std::noop_coroutine_promise>` 是无操作协程的协程句柄类型。

无论哪个特化，都有 `operator()`、`resume`、`done`、`destroy` 和 `operator bool` 这些非静态成员函数。

`operator bool` 用于测试该协程句柄是否为空，也就是是否指代协程。一般来说，只有默认构造的协程为空。不过，实际上也能从后文介绍的 `from_address` 函数构造一个空的协程句柄。

`done` 函数用于检查协程是否处于 _最终暂停点_，在后文会解释。

`operator()` 和 `resume` 函数用于恢复一个 _暂停_ 状态的协程的执行，实际使用哪个看个人习惯。一个例外是处于 _最终暂停点_ 的协程不能这两个函数被恢复。该函数是否会抛出异常取决于 Promise。

`destroy` 函数用于销毁处于 _暂停_ 状态或者处于 _异常_ 的协程。

除此之外，还有 `address` 和 `from_address` 两个函数，前者用于将协程句柄转换为 `void*`，后者用于还原为协程句柄。这两个函数用于和 C 风格接口进行交互，例如可以编写：

```cpp

void resume_corotine(void* coro) noexcept
{
	std::coroutine_handle<>::from_address(coro)();
}

void create_thread(void(*callback)(void*), void* data) noexcept;

```

`create_thread` 为许多 C 风格异步接口的一般形式，使用 `address` 函数就可以将协程句柄直接转换为 `data`，以 `create_thread(resume_corotine, handle.address());` 的形式适配 C 风格的接口。

用户还可以使用自己定义的 Promise 类型来特化该类模板，在后文会介绍如何定义 Promise。每个协程都会储存唯一一个确定的 Promise 类型的对象。

使用 Promise 类型特化的协程句柄会增加 3 个成员函数：`promise`、`from_promise`、`operator std::coroutine_handle<void>`。

`promise` 和 `from_promise` 用于从协程句柄中获得协程的 Promise 对象的引用，`from_promise` 用于从 Promise 对象的引用中获得协程句柄。由于引用类型不可默认构造，在使用上有些不便，因此一般来说都是储存协程句柄然后使用 `promise` 获得 `promise` 的引用。

`operator std::coroutine_handle<void>` 用于将带 `Promise` 类型的协程句柄变为一般形式（`void`）的协程句柄。由于所以协程句柄都是仅储存一个指针，所以该操作是可行的。当协程仅以通用函数使用（例如前文实现过的线程池）时，可以传递 `std::coroutine_handle<void>`。

## Awaiter

Awaiter 是 `co_await` 运算符的操作数，被称作等待对象，一个等待对象至少有 3 个公开的成员函数：`await_ready`、`await_suspend` 和 `await_resume`：

```cpp

struct awaiter
{
	bool await_ready();
	K await_suspend(std::coroutine_handle<T>);
	D await_resume();
};

```

`K` 必须为 `void`、`bool` 或者 `std::coroutine_handle<T>`；`D` 则通常为 `void` 以及 `U`。

Awaiter 在协程中被作为 `co_await` 的操作数，而 `D` 是 `co_await` 表达式的结果类型。

在 `co_await x` 时，如果 `x` 的 `await_ready` 函数返回 `true`，那么就会立即执行 `x` 的 `await_resume`，并且 `await_resume` 的返回值就是表达式的结果。

如果 `await_ready` 函数返回 `false`，那么将当前协程（当前函数）的句柄作为参数，调用 `x` 的 `await_suspend` 函数，此时协程处于 _暂停_ 状态。

`await_suspend` 可以有多个重载，可以根据当前协程的 `promise_type` 定制不同的行为。

在 `await_suspend` 中，可以使用 `operator()` 或者 `resume`恢复协程执行。或者不恢复协程的执行，使得协程一直处于 _暂停_ 状态。

例如，使用前文实现过的线程池的 `run_in` 函数：

```cpp

void await_suspend(std::coroutine_handle<> h) const
{
	pool.run_in(h);
}

```

调用完该 `await_suspend` 函数后，协程句柄被发送到线程池，然后该函数立即返回，使得协程停留在 _暂停_ 状态。当线程池调度到该协程句柄，就会恢复协程的执行。

一旦协程被恢复，就会立即执行 `x` 的 `await_resume` 函数，对于上例，也就是在线程池调用协程句柄的 `operator()`（也就是对协程句柄调用 `resume`）后，实际上会执行的函数。在 `await_resume` 执行完后，按顺序执行该协程的下一句：

```cpp

task coro()
{
	co_await x; // 先调用await_ready，再调用await_suspend，再调用resume
	y;		  // await_resume返回后执行下一句
}

```

现在就可以实现第一章内容讲过的，也是 C++/WinRT 中存在的 `resume_background` 函数：

```cpp

auto resume_background()
{
	struct background_awaiter
	{
		bool await_ready() const noexcept
		{
			return false;
		}
		void await_suspend(std::coroutine_handle<> handle) const
		{
			pool.run_once(handle);
		}
		void await_resume() const noexcept
		{
		}
	};
	return background_awaiter{};
}

```

此时， `x` 即是 `resume_background()`：

```cpp

task coro()
{
	co_await resume_background();
	y;
}

```

`resume_background` 的作用仅仅是将协程发送到线程池中执行，因此 `await_ready` 永远返回 `false`（否则 `await_suspend` 会被跳过），并且 `await_resume` 是个空函数。

标准库提供了两个基础的等待类型：`std::suspend_always` 和 `std::suspend_never`，前者的 `await_ready` 永远返回 `false`，而后者的 `await_ready` 永远返回 `true`，从而 `co_await` 前者会永远处于 _暂停_ 状态（除非外部恢复它），后者不暂停协程，等于什么也不做：

```cpp

struct suspend_always
{
	bool await_ready() const noexcept
	{
		return false;
	}
	void await_suspend(std::coroutine_handle<>) const noexcept
	{
	}
	void await_resume() const noexcept
	{
	}
};

struct suspend_never
{
	bool await_ready() const noexcept
	{
		return true;
	}
	void await_suspend(std::coroutine_handle<>) const noexcept
	{
	}
	void await_resume() const noexcept
	{
	}
};

```

除了 `void`，`await_suspend` 还可以返回 `bool` 和 `std::coroutine_handle<T>`：

当返回 `false` 时，立即执行 `await_resume`；当返回 `true` 时，不执行 `await_resume`。

当返回 `std::coroutine_handle<T>` 时，立即恢复它（调用该协程句柄）。

这意味着，协程会在以下情况下处于 _暂停_ 状态，从而需要手动进行恢复：

+ `await_ready` 一定返回 `false`
 	+ `await_suspend` 返回 `void` 或者返回 `true` 时，不在函数体内（包括放入线程池等隐式方式）恢复自己
 	+ `await_suspend` 返回协程句柄时，不返回（包括隐式返回）自己

一般情况下，协程都会自动恢复，但有时，我们希望协程在 _最终暂停点_  _暂停_ ，从而可以使用 `done` 和 `destroy`。_最终暂停点_ 会在后文 Promise 的部分介绍。

现在还可以实现上下文捕获以及用于恢复的 Awaiter：

```cpp

auto capture_apartment()
{
	return thread_pool::capture_context();
}
struct apartment_awaiter
{
	thread_pool::context c;
	bool await_ready() const noexcept
	{
		return thread_pool::capture_context() == c || c == thread_pool::context{};
	}
	void await_suspend(std::coroutine_handle<> handle) const
	{
		pool.run_in(handle, c);
	}
	void await_resume() const noexcept
	{
	}
};

```

C++/WinRT 原版的 `winrt::apartment_context` 会在默认构造时捕获上下文，但我个人不希望默认构造做多余的事，因此我选择使用和 `resume_background` 一样的接口风格，即调用一个辅助函数产生合适的 `Awaiter`。

以及，还可以实现延迟执行任务的 Awaiter：

```cpp

struct timer_awaiter
{
	std::chrono::milliseconds d;
	bool await_ready() const noexcept
	{
		return d <= decltype(d)::zero();
	}
	void await_suspend(std::coroutine_handle<> handle) const
	{
		pool.run_after(handle, d);
	}
	void await_resume() const noexcept
	{
	}
};

```

使用毫秒的原因是在大部分非实时系统上，系统调度任务的精度就是毫秒级的，因此就算使用更高精度也没有意义。

## `await_transform` 和 `operator co_await`

`co_await` 的操作数除了可以是一个 Awaiter 外，还可以通过 3 种方式对操作数进行变换，获得实际的 Awaiter。

例如 `co_await 1s` 可以自动返回 `timer_awaiter`。

`co_await` 变换步骤如下，假设操作数是 `x`：

1. `x` 是 `initial_susend` 或 `final_suspend` 的返回值\
   否则，查找 Promise 类型是否存在成员函数 `await_transform`：
	+ 如果找到，那么测试 `promise.await_transform(x)` 是否合法
		+ 如果合法则调用它，`x` 现在是调用结果
		+ 如果不合法，则编译错误
	+ 如果没找到，进行后续查找

2. 接下来，测试 `x` 的类型是否存在 `operator co_await()` 成员函数
	+ 如果存在，那么调用它，`x` 现在是调用结果
	+ 如果不存在，那么进行下一步查找

3. 最后，以无限定查找进行 `operator co_await(x)` 调用
	+ 如果能调用，则看它是否经过了步骤 2 的变换
		+ 未进行变换，则调用它，并且返回值就是 Awaiter
		+ 进行了变换，则存在歧义，编译错误
	+ 如果不能调用，则 `x` 就作为 Awaiter

如果通过以上三步确定的 Awaiter 没有三个必须的成员函数或者成员函数不满足要求，那么会编译错误。

需要注意的是，如果 `await_transform` 存在且在步骤 1 的 `promise.await_transform(x)` 测试中表达式不合法，那么是编译错误。

因此，`apartment_awaiter` 和 `timer_awaiter` 可以成为内部类：

```cpp

auto operator co_await(thread_pool::context c) noexcept
{
	struct apartment_awaiter { /* ... */ };
	return apartment_awaiter{ c };
}

template <class Rep, class Period>
auto operator co_await(std::chrono::duration<Rep, Period> d) noexcept
{
	struct timer_awaiter { /* ... */ };
	return timer_awaiter{ std::chrono::duration_cast<std::chrono::milliseconds>(d) };
}

```

## Promise

一个 Task 类型严格对应一个 Promise 类型，因此 Promise 通过 `std::coroutine_traits <Task>::promise_type` 查找到，而不需要上面 `co_await` 的复杂过程。

Promise 用于储存用户提供的协程状态以及协程返回值。

`std::coroutine_traits` 在非用户提供特化的前提下，其 `promise_type` 等于 `Task::promise_type`，如果用户提供了特化，那么该特化就必须提供成员类型 `promise_type`。

`promise_type` 必须有 `get_return_object`、`initial_suspend`、`final_suspend` 和 `unhandled_exception` 四个成员函数。如果任务（Task）是无值的，也就是 `co_return` 不需要返回值时，Promise 有 `return_void` 函数，如果有值，那么 Promise 有 `return_value` 函数。如果协程不返回，那么不需要这两个函数。不满足以上要求的 Promise 不正确。

```cpp

struct promise_type
{
	auto get_return_object();
	auto initial_suspend();
	auto final_suspend();
	void return_void();
	void unhandled_exception() noexcept;
};

```

当一个协程被创造（函数被调用）时，首先会检查是否能将函数的所有参数传递给 `promise_type` 的构造函数，如果能，那么依此构造 `promise_type`，该设计是为了让 `promise_type` 有自己储存并且操纵和感知协程参数的能力，如果不能这样构造，那么默认构造 `promise_type`。

然后，调用 `get_return_object()`，返回 Task，此时需要协程的返回值类型 Task 和该函数的返回值类型相匹配，返回的 Task 就是协程作为函数，被调用时候的返回值。

随后，在协程体内调用 `co_await promise.initial_suspend()`。一般来说，对于积极启动的协程，`initial_suspend` 会返回 `suspend_never`，立即执行协程体，而延迟启动的协程会返回 `suspend_always`，使得协程处于 _暂停_ 状态。

上文讲过，返回 `suspend_always` 会使得协程被真正的暂停，此时如果外部不能获得协程句柄以手动恢复协程，那么该协程会发生内存泄漏，因此通常 Task 需要储存当前协程的句柄以提供恢复和销毁协程的能力。

```cpp

struct task
{
	std::coroutine_handle<> handle;
	struct promise_type
	{
		auto get_return_object() noexcept
		{
			return task{ decltype(handle)::from_promise(*this) };
		}
		std::suspend_always initial_suspend();
		auto /* awaiter */ final_suspend();  // 虚设的，仅用于展示，实际不能使用
		void return_void();				     // 同上
		void unhandled_exception() noexcept; // 同上
	};
};

task foo()
{
	co_return;
}

void call_coro()
{
	auto t = foo();
	t.handle();		    // 一部分协程可以自己销毁自己
						// 此时可以恢复协程执行，如果没有这行则泄漏
						// 对于自己销毁自己的协程，将在执行完成自动销毁
	t.handle.destroy(); // 或者，如果协程不能销毁自己，那么需要手动销毁
}

```

无论 `initial_suspend` 返回什么，在返回后，协程会返回给调用者，也就是继续执行 `call_coro`。

当协程被恢复时，会恢复协程体的执行，如 Awaiter 一节讲过的一样。

然后，协程如果在执行时抛出异常，那么会被捕获，再调用 `unhandled_exception`。

在 `unhandled_exception` 函数中，可以使用标准库提供的 `std::current_exception` 来获得抛出的异常：

```cpp

void unhandled_exception() noexcept
{
	auto e  = std::current_exception();
}

```

`std::current_exception` 返回的是 `std::exception_ptr`，它以值的方式被传递和储存。同步该协程时，可以使用 `std::rethrow_exception` 来重新抛出该异常。

`unhandled_exception` 如果抛出异常，会传播异常给调用者，同时使得协程处于 _异常_ 状态。处于 _异常_ 状态的协程不能被恢复，只能被销毁。

因此通常的做法是使得 `unhandled_exception` 不抛出异常，在 `promise_type` 中储存 `std::exception_ptr`，并且通过 Task 获取它。

如果 Task 不需要被同步或者被另一个协程异步的等待，那么就不需要储存该异常，此时得到了 `fire_and_forget`（发后不理）：

```cpp

struct fire_and_forget
{
	struct promise_type
	{
	public:
		promise_type() noexcept
		{
		}
		fire_and_forget get_return_object() const noexcept
		{
			return {};
		}
		std::suspend_never initial_suspend() const noexcept
		{
			return {};
		}
		std::suspend_never final_suspend() const noexcept
		{
			return {};
		}
		void return_void() const noexcept
		{
		}
		void unhandled_exception() const noexcept
		{
		}
	};
	auto operator co_await() const noexcept
	{
		return std::suspend_never{};
	}
};

```

发后不理的协程永不暂停，不返回值，所以是 `return_void`，也不允许有人等待它完成，因此所有提供 Awaiter 的地方都是 `suspend_never`。

当一个协程具有返回值时，`co_return x;` 会改写为 `promise.return_value(x);`，这代表需要在 `promise` 中储存返回值；而协程不具有返回值时，`co_return;` 会改写为 `promise.return_void()`。

当协程执行完 `co_return` 语句后，会执行 `co_await promise.final_suspend();`，如果返回的 Awaiter 暂停了协程，那么此时协程就处于 _最终暂停点_。处于 _最终暂停点_ 的协程可以使用 `done` 来测试，并且使用 `destroy` 进行销毁。如果返回的 Awaiter 没有暂停协程，那么当 Awaiter 的 `await_resume` 返回后，协程会被立即销毁。

`final_suspend` 用于同步两个协程以及管理协程的销毁。

最后需要注意，`final_suspend` 和它返回的 Awaiter 的三个成员函数都不能抛出异常。

## Task

在 Promise 一节，实际上已经介绍过一种 Task：`fire_and_forget`，但发后不理只是最简单的情况，通常来说还需要支持异步的等待 Task 完成以及获得 Task 储存的协程结果两个重要功能，以及在协程出现错误后，从协程中获得异常并重新抛出。

如何编写 Task 是一个较为复杂的话题，脱离实际使用场景并不能得出任何有用的结论，因此在下一章中，将会实现完整的利用了线程池的 Task 类以及其 Promise。

## 协程执行流程和生存期

协程的整体执行流程如下：

1. 分配协程帧内存，储存协程状态以及 Promise
2. 默认构造 Promise 或转发函数的参数构造 Promise
3. 调用 `get_return_object` 构造 Task 为函数返回值
4. 调用 `initial_suspend` 获得 Awaiter
    1. 调用 `await_ready`
    2. 调用 `await_suspend`，为 _初始暂停点_
    3. 调用 `await_resume`
5. 执行函数体
    + 执行 `co_await` 表达式获得 Awaiter
        1. 调用 `await_ready`
        2. 调用 `await_suspend`，为 _暂停点_
        3. 调用 `await_resume`
6. `co_return` 调用 `return_void` 或者 `return_value`
7. 销毁 `co_return` 后需要销毁的变量
8. 如果 1-3 发生异常，则销毁所有变量，并传播异常给调用者；如果4.2发生异常，则使得协程处于 _最终暂停点_，并销毁构造完成的 task，传播异常给调用者；如果 4.3-6 期间发生异常，销毁当前自动储存期变量，调用 `unhandled_exception`
9. 调用 `final_suspend` 获得 Awaiter
    1. 调用 `await_ready`
    2. 调用 `await_suspend`，为 _最终暂停点_
    3. 调用 `await_resume`
10. `await_resume` 返回或者调用 `destroy` 后\
   销毁参数，Promise 和分配的内存

许传奇的教程提供了一个完整的表现协程执行流程的例子。

协程在每个暂停点都有机会转移控制权给调用者（暂停协程并且不会自动恢复时），调用者必须对暂停的协程进行恢复或者手动销毁以避免泄漏。

对于同步协程，调用时首先执行 1 到 4.1，在 _初始暂停点_ 暂停，然后在 Task 被调用者（同步者）co_await 时恢复，执行 4.2 到 9.2，在 _最终暂停点_ 暂停，并恢复暂停了的调用者，当调用者执行完成后执行 9.3 到 10。

对于异步协程，调用时执行 1 到 9.2

+ 当协程被有效同步时，在  _最终暂停点_ 暂停并恢复调用者，当调用者执行完成后执行 9.3 到 10 被自己销毁。
+ 当协程快速执行完成时，在 _最终暂停点_ 暂停，并被调用者通过 Task 的析构函数执行 10 销毁。
+ 当协程不被同步并且调用者先行死亡时，协程在 _最终暂停点_ 立即返回并且恢复协程，执行 9.3 到 10 被自己销毁。

以下是一个异步协程的伪代码：

```cpp

task async_task()
{
	co_await resume_background();
	do_something_sync1();
}

fire_and_forget main_coro()
{
	// 起
	auto t = async_task();
	do_something_sync2();
	co_await t;
	// 止
}

```

以下是起止点间可能发生的执行流程：

```

主协程（初始运行在主线程）         异步执行线程
// 起
// 调用async_task开始异步任务
auto frame = new coro_frame();
auto& promise = frame->promise;
promise.constructor();
promise.get_return_object();
promise.initial_susend();
co_await suspend_never{};
co_await resume_background(); -> // 开始执行异步任务
// 返回执行主协程                 awaiter.await_resume();
do_something_sync2();            do_something_sync1();
...                              ...
co_await t;                      ...
// 主协程暂停                     ...
// 同步主协程和异步任务 ---------> ...
// 主线程被释放                   ...
                                 promise.return_void();
                                 co_await promise.final_suspend();
                                 // 恢复主协程执行
                                 // 止

```

一般来说，协程的生存期可能存在两种情况：积极启动的协程的生存期独立于调用者的生存期或者小于等于调用者的生存期，而惰性启动的协程的生存期内嵌于调用者的生存期。启动情况的不同使得协程具有不同的性质。

上图所示的协程是积极启动的，因此，异步任务的启动时间早于调用者（主协程）同步异步任务的时间。而对于惰性启动的协程来说，异步任务的启动通常在调用者 `co_await` 它的时候。无论对于哪种协程，`co_await` 的作用实际上都是同步，也就是说在 `co_await` 返回后，一定得到异步任务的结果，这也就是它取名为“等待”的原因。

无论任务何时启动，都需要允许任务能被 `co_await` 进行同步，因此至少要保证异步任务的生存期不会早于调用者结束，该技术将在下一章中进行讲解。

当然，对于发后不理的任务，不需要也不想等待它的结果，也没有任务需要和它同步，因此通常要么禁止对它进行 `co_await`，要么如同上面的实现一样等待它等于 `co_await never_suspend{};`。

由于积极启动的协程的生存期不内嵌于调用者（例如 `fire_and_forget`），因此对于此类协程，必须在堆中分配内存以储存 Promise 以及协程状态，而对于惰性启动的协程，由于其生存期内嵌于调用者，编译器有机会对其进行优化以减少内存分配（[Heap Allocation eLision Optimization](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0981r0.html)）。无论哪种协程，只要编写合适，都能互相进行同步。协程如何实现同步会在下一章进行讲解。
