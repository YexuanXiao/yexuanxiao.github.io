---
title: C++ 协程 - 任务
date: "2024-10-13 19:14:00"
tags: [C++]
category: blog
---

编写协程的 Task 实际上就是解决 4 个问题：协程生存期、异常传播、协程同步和结果发布。实际使用中，Promise 负责存储，Task 负责和外部进行交互。

<!-- more -->

## 同步任务

同步协程任务类型的同步指的是它延迟启动并且顺序执行协程体，其生存期内嵌于调用者，因此不需要考虑任何线程安全问题。

用法如下：

```cpp

sync_task switch_to_thread_pool()
{
	std::cout << "2. " << std::this_thread::get_id() << '\n';
	co_await resume_background();
	std::cout << "3. " << std::this_thread::get_id() << '\n';
}

fire_and_forget main_coro()
{
	std::cout << "1. " << std::this_thread::get_id() << '\n';
	co_await switch_to_thread_pool();
	std::cout << "4. " << std::this_thread::get_id() << '\n';
}

```

以上代码将会使得 1 和 2 输出相同的线程 ID，3 和 4 输出相同的线程 ID。该最简协程实际上就能完成协程的最大作用，避免回调地狱：调用者（主协程） _不阻塞_ 等待任务的完成，而是被主动 _恢复_ 。

在阅读下文之前，读者可以自行尝试编写这样的任务类型，然后再阅读下文。

由于同步协程的生存期完全内嵌于调用者，因此实际上不需要关心该问题，让协程在最终暂停点不暂停使协程自然销毁即可。

由于协程支持在其他线程中恢复，因此抛出的异常必须由自己处理，不能传播给恢复者（线程池），因此 Promise 需要有一个非静态成员 `std::exception_ptr` 来储存该异常。

为了简便起见，该任务是当前是无值的，暂且只能返回 `void`，随后会补充它。

由于同步协程的执行在同步点发起（恢复），因此需要为 `sync_task` 编写 `operator co_await` 来调用协程并且恢复到调用者。

所以问题在于，如何实现同步？答案其实很简单，在 Promise 中储存下一个需要执行的协程的协程句柄即可。

以下是该同步任务的最简实现：

```cpp

template<typename T=void>
struct sync_task;

template<>
struct sync_task<>
{
	struct promise_type;
	std::coroutine_handle<promise_type> handle;
	struct promise_type
	{
		std::coroutine_handle<> next;
		std::exception_ptr exc;
	public:
		promise_type() noexcept
		{
		}
		sync_task get_return_object() noexcept
		{
			return { decltype(handle)::from_promise(*this) };
		}
		std::suspend_always initial_suspend() const noexcept
		{
			return {};
		}
		auto final_suspend() noexcept
		{
			struct final_awaiter
			{
				promise_type& promise;
				bool await_ready() const noxcept
				{
					return bool(promise.next);
				}
				std::coroutine_handle<> await_suspend() const noexcept
				{
					return promise.next;
				}
				void await_resume() const noexcept
				{
				}
			};
			return final_awaiter{ *this };
		}
		void return_void() const noexcept
		{
		}
		void unhandled_exception() noexcept
		{
			exc = std::current_exception();
		}
	};
	auto operator co_await() noexcept
	{
		struct sync_awaiter
		{
			std::coroutine_handle<promise_type> handle;
			bool await_ready() noexcept
			{
				return false;
			}
			std::coroutine_handle<> await_suspend(std::coroutine_handle<> next) noexcept
			{
				handle.promise().next = next;
				return handle;
			}
			void await_resume() const
			{
				auto& exc = handle.promise().exc;
				if (exc)
					std::rethrow_exception(exc);
			}
		};
		return sync_awaiter{ handle };
	}
};

```

实现协程同步的第一个秘密在于 `final_suspend` 返回的 `final_awaiter` 中。

首先在 `await_ready` 检查 `next` 是否指代协程，如果 `next` 不指代协程，那么说明没人和它同步（不存在下一个要执行的任务）。

然后，在 `await_suspend` 中返回 `next`。第四章中讲过，如果 `await_suspend` 返回 `std::coroutine_handle<>`，那么返回的协程句柄会立即被调用，因此实际上该相当于在函数体内调用再返回 `void`，但与之不同的是，前者可以避免栈溢出，该技术被称作对称转移（Symmetric Transfer）。

考虑以下代码：

```cpp

sync_task switch_to_thread_pool()
{
	co_await resume_background();
}

fire_and_forget main_coro()
{
	co_await switch_to_thread_pool();
	co_await switch_to_thread_pool();
	co_await switch_to_thread_pool();
	...
}

```

上述代码实际上不存在栈溢出问题，因为将协程句柄发送到线程池后，每次调用协程句柄，栈总是从事件循环中开始增长，从而无论等待多少次，栈的增长长度都是固定的。

而以下代码则不同：

```cpp

sync_task switch_to_thread_pool() noexcept
{
	co_return;
}

fire_and_forget main_coro()
{
	co_await switch_to_thread_pool();
	co_await switch_to_thread_pool();
	co_await switch_to_thread_pool();
	...
}

```

由于 `switch_to_thread_pool` 不再将自己发送到线程池，因此当使用非对称转移时：

```cpp

void await_suspend() noexcept
{
	promise.next();
}

```

每次恢复下一个任务都将会在之前的栈上进行增长，如果等待的次数过多就会导致栈溢出。

而对称转移的写法将协程句柄返回给调用者，消除了此次的栈增长，避免了溢出。

实现协程同步的第二个秘密在于 `operator co_await` 返回的 `sync_awaiter`，`sync_awaiter` 的作用是将自己变为 `next`，同时恢复在初始暂停点暂停的协程。

当 `co_await switch_to_thread_pool();` 使协程恢复的时候，`await_resume` 负责发布结果并且在存在异常时抛出异常。

现在，可以很容易的扩展无值的任务为有值的：

```cpp

template<typename T>
struct sync_task
{
	struct promise_type;
	std::coroutine_handle<promise_type> handle;
	struct promise_type
	{
		std::coroutine_handle<> next;
		std::exception_ptr exc;
		std::optional<T> res;
	public:
		promise_type() noexcept
		{
		}
		sync_task get_return_object() noexcept
		{
			return { decltype(handle)::from_promise(*this) };
		}
		std::suspend_always initial_suspend() const noexcept
		{
			return {};
		}
		auto final_suspend() noexcept
		{
			struct final_awaiter
			{
				promise_type& promise;
				bool await_ready() noxcept
				{
					return bool(promise.next);
				}
				std::coroutine_handle<> await_suspend() noexcept
				{
					return promise.next;
				}
				void await_resume() noexcept
				{
				}
			};
			return final_awaiter{ *this };
		}
		template<typename T>
		void return_value(T&& t)
		{
			res = std::forward<T>(t);
		}
		void unhandled_exception() noexcept
		{
			exc = std::current_exception();
		}
	};
	auto operator co_await() noexcept
	{
		struct sync_awaiter
		{
			std::coroutine_handle<promise_type> handle;
			bool await_ready() noexcept
			{
				return false;
			}
			std::coroutine_handle<> await_suspend(std::coroutine_handle<> next) noexcept
			{
				handle.promise().next = next;
				return handle;
			}
			T await_resume()
			{
				auto& promise = handle.promise();
				auto& exc = promise.exc;
				if (exc)
					std::rethrow_exception(exc);
				return std::move(promise.res.value());
			}
		};
		return sync_awaiter{ handle };
	}
};

```

## 异步任务

同步任务需要在每个任务被 `co_await` 的时候才开始执行，在 `co_await` 返回后结束执行并且执行下一条语句，因此只能做到避免回调地狱，而不能真正的实现任务并行。因此，需要使用积极启动的协程。

异步任务和同步任务的区别主要有两点：异步任务运行在另一个线程中，需要做到线程安全；异步任务的生存期独立于调用者。解决前者的方式是使用免锁的原子类型，而解决后者的方式是使用原子引用计数。

支持同步（不是发后不理）的异步任务的生存期的结束实际会发生于两个时间点：当它被同步时，它的结束时间早于调用者的结束时间；当它不被同步时，它的结束时间和调用者的结束时间无关。

因此，该协程实际上被 Promise（协程帧）和 Task（调用者）共享，因此使用 `std::atomic<unsigned int>` 作为计数并且初始为 `1`。

当 Task 析构时使用 `fetch_sub(1, std::memory_order::acq_rel);` 原子自减并获得先前值，如果先前值为 `0` 则通过 Task 管理的协程句柄手动销毁协程。在 `final_suspend` 返回的 Awaiter 中，`await_suspend` 进行相同操作。

为了减少噪音，以下例子省略了两个细节，同步协程以及抛出异常：

```cpp

template<typename T = void>
class task;

template <> // breakline
class task<void>
{
	struct promise_type;
	std::coroutine_handle<promise_type> handle_{};
	struct promise_type
	{
		std::atomic<unsigned int> rfcnt_{ 1u };
	public:
		std::suspend_never initial_suspend() const noexcept
		{
			return {};
		}
		task get_return_object() noexcept
		{
			return { decltype(handle_)::from_promise(*this) };
		}
		void return_void() const noexcept
		{
		}
		void unhandled_exception() noexcept
		{
		}
		bool zero() noexcept
		{
			return rfcnt_.fetch_sub(1, std::memory_order::acq_rel) == 0;
		}
		auto final_suspend() noexcept
		{
			struct final_awaiter
			{
				promise_type& p_;
			public:
				awaiter(promise_type& p) noexcept :p_(p) {}
				bool await_ready() noexcept
				{
					return false;
				}
				bool await_suspend(std::coroutine_handle<>) noexcept
				{
					return !p_.zero();
				}
				void await_resume() noexcept
				{
				}
			};
			return final_awaiter{ *this };
		}
	};
	task(promise_type& p) noexcept
		: handle_(decltype(handle_)::from_promise(p))
	{
	}
public:
	~task()
	{
		if (handle_.promise().zero())
			handle_.destroy();
	}
};

```

在第四章中介绍过，当 `await_suspend` 被执行并且返回 `true` 时，协程被暂停，此时上述协程的计数刚被减小为 `0`，不需要销毁协程。随后，当 `task` 的析构获得 `0` 时，协程被主动销毁。而当 `await_suspend` 被执行并且返回 `false` 时，说明 `task` 的析构函数已经被别执行过，因此协程将恢复执行。当协程未在最终暂停点暂停时，协程将自动销毁。这两部分共同完成了协程的生存期管理。

此时，可以为协程添加同步，异常处理以及取消功能：

```cpp

class canceled_coroutine{};
class cancelable_promise_base
{
	enum class status
	{
		ready = 0,
		canceled,
		next,
		done
	};
	std::atomic<unsigned int> rfcnt_{ 1u };
	std::atomic<status> st_;
	std::coroutine_handle<> next_;
	std::exception_ptr exc_;
public:
	// 积极启动
	std::suspend_never initial_suspend() const noexcept
	{
		return {};
	}
	void unhandled_exception() noexcept
	{
		exc_ = std::current_exception();
	}
	void increase() noexcept
	{
		rfcnt_.fetch_add(1, std::memory_order::relaxed);
	}
	bool zero() noexcept
	{
		return rfcnt_.fetch_sub(1, std::memory_order::acq_rel) == 0u;
	}
	// 是否被取消
	bool canceled() const noexcept
	{
		return st_.load(std::memory_order::relaxed) == status::canceled;
	}
	// 尝试取消当前协程，无论返回什么
	bool cancel() noexcept
	{
		// 尝试将ready和next转换为canceled
		auto st = status::ready;
		if (st_.compare_exchange_strong(st, status::canceled, std::memory_order::acq_rel))
			return true;
		st = status::next;
		if (st_.compare_exchange_strong(st, status::canceled, std::memory_order::acq_rel))
			return true;
		assert(st != status::canceled); // 不允许任务被取消两次
		return false;
	}
	auto cancel_async() noexcept
	{
		struct cancel_awaiter : public std::suspend_always
		{
			cancelable_promise_base& p_;
			bool await_suspend(std::coroutine_handle<> handle)
			{
				p_.next_ = handle;
				auto st = status::ready;
				if (p_.st_.compare_exchange_strong(st, status::canceled, std::memory_order::acq_rel))
					return true;
				assert(st != status::canceled); // 不允许任务被取消两次
				assert(st != status::next);     // 不允许同一任务被两次等待
				return false;
			}
		};
		return cancel_awaiter{ .p_ = *this };
	}
	bool is_done() const noexcept
	{
		return st_.load(std::memory_order::relaxed) == status::done;
	}
	// 被task_awaiter::await_suspend调用
	// 返回false代表可以直接执行当前协程，也就是await_suspend返回false
	bool next(std::coroutine_handle<> handle) noexcept
	{
		next_ = handle;
		// 只有ready状态才可以被替换为next
		auto st = status::ready;
		if (st_.compare_exchange_strong(st, status::next, std::memory_order::acq_rel))
			return true; // 当前协程会被暂停
		assert(st != status::next); // 不允许多次co_await同一个task
		return false;
	}
	// 被task_awaiter::await_resume调用
	void rethrow_exception() const
	{
		// 优先抛出协程体的异常
		if (exc_)
			std::rethrow_exception(exc_);
		auto s = st_.load(std::memory_order::relaxed);
		// 然后测试协程是否被取消
		if (s == status::canceled)
			throw canceled_coroutine{};
	}
	auto final_suspend() noexcept
	{
		class final_awaiter : public std::suspend_always
		{
			cancelable_promise_base& p_;
			friend cancelable_promise_base;
		public:
			final_awaiter(cancelable_promise_base& p) noexcept : p_(p)
			{
			}
			bool await_suspend(std::coroutine_handle<>) const noexcept
			{
				auto st = status::ready;
				p_.st_.compare_exchange_strong(st, status::done, std::memory_order::acq_rel);
				// 立即执行或者发送到线程池
				if (auto next = p_.next_)
					next();
				// 恢复协程或销毁
				return !p_.zero();
			}
		};
		return final_awaiter{ *this };
	}
};

```

关键点有以下几个：

+ `std::exception_ptr` 不需要用原子，因为无论抛出异常还是使用 `unhandled_exception` 捕获异常都是在当前协程内部进行的，不存在竞争。而当协程被调用者同步时，协程实际上已经在 `final_suspend` 中进行了同步，保证能观测到抛出的异常
+ 先无条件设置 `next_` 为新的值再用 CAS 建立同步关系
+ 用于同步调用者和异步任务的 `next` 函数返回 `bool`，该函数会被 `task_awaiter::await_suspend` 直接调用并返回，如果 `next` 返回 `false` 说明异步任务已经执行完成，从而不需要等待即可获得结果。
+ 取消了的协程也可以被调用者进行同步，也就是可以等待协程真正取消完成时，恢复调用者的执行。注意由于 `next_` 只有一个位置，因此只有一个等待者会被唤醒，所以禁止多次等待，这点和 C++/WinRT 一致

通过设计一个在被取消协程中进行调用的取消令牌，可以实现主动观察协程是否取消：

```cpp

template <typename T>
	requires std::derived_from<T, cancelable_promise_base>
auto to_cancelable(std::coroutine_handle<T> h) noexcept
{
	return std::coroutine_handle<cancelable_promise_base>::from_address(h.address());
}
struct cancellation_awaiter : std::suspend_always
{
private:
	cancelable_promise_base* c_{};
public:
	template <typename T>
	bool await_suspend(std::coroutine_handle<T> h) noexcept
	{
		c_ = &to_cancelable(h).promise();
		return false;
	}
	auto await_resume() const noexcept
	{
		class token
		{
			friend cancellation_awaiter;
			cancelable_promise_base& c_;
			token(cancelable_promise_base& c) noexcept : c_(c)
			{
			}
		public:
			bool canceled() const noexcept
			{
				return c_.canceled();
			}
			explicit operator bool() const noexcept
			{
				return canceled();
			}
		};
		return token{ *c_ };
	}
};

auto get_cancellation_token() noexcept
{
	return cancellation_awaiter{};
}

```

使用方式就和 C++/WinRT 中的一样：

```cpp

task<> ExplicitCancelationAsync()
{
	using namespace bizwen;
	using namespace std::chrono_literals;
	auto cancelation_token{ co_await get_cancellation_token() };

	while (!cancelation_token)
	{
		fast_io::print("ExplicitCancelationAsync: do some work for 1 second\n");
		co_await 1s;
	}
}

```

当然，不光能在协程体内主动检测取消，还可以在 Awaiter 中自动取消，例如上例使用的以及之前实现过的 `timer_awaiter`，可以通过对其添加重载的方式使得 `await_suspend` 中可以检测协程是否暂停：

```cpp

struct timer_awaiter : public std::suspend_always
{
	std::chrono::milliseconds d_;
	bool await_ready() const noexcept
	{
		return d_ <= decltype(d_)::zero();
	}
	void await_suspend(std::coroutine_handle<> handle) const
	{
		pool.run_after(handle, d_);
	}
	template <typename T>
	void await_suspend(std::coroutine_handle<T> handle) const
		requires requires {to_cancelable(handle); }
	{
		if (handle.promise().canceled())
			throw canceled_coroutine{};
		pool.run_after(handle, d_);
	}
};

```

如果当前协程的 Promise 类型继承自 `cancelable_promise_base`，那么就可以对其进行检测。

可以使用辅助类模板 `enable_cancelation` 作为 CRTP 基类使得继承它的 Awaiter 有检测取消的能力，实现简化代码：

```cpp

template <typename U>
struct enable_cancellation : public std::suspend_always
{
	template <typename T>
	void await_suspend(std::coroutine_handle<T> handle) const
		requires requires {to_cancelable(handle); }
	{
		if (handle.promise().canceled())
			throw canceled_coroutine{};
		return static_cast<const U&>(*this).await_suspend(std::coroutine_handle<>{handle});
	}
};

```

到现在，就可以实现完整的 Task：

```cpp

template <typename T = void>
class task
{
public:
	class promise_type;
private:
	// 为了实现移动task，必须使用handle储存
	std::coroutine_handle<promise_type> handle_{};
	friend promise_type;
	task(promise_type& p) noexcept : handle_(decltype(handle_)::from_promise(p))
	{
	}
public:
	task() = default;
	task(task&& rhs) noexcept
	{
		std::swap(rhs.handle_, handle_);
	}
	task& operator=(task&& rhs) noexcept
	{
		std::swap(rhs.handle_, handle_);
		return *this;
	}
	task(task const& rhs) noexcept
	{
		if (&rhs == this)
			return;
		if (!rhs.handle_)
			return;
		handle_ = rhs.handle_;
		handle_.promise().increase();
	}
	task& operator=(const task& rhs) noexcept
	{
		if (&rhs == this)
			return *this;
		task temp{};
		temp.handle_ = handle_;
		handle_ = rhs.handle_;
		if (!rhs.handle_)
			return *this;
		handle_.promise().increase();
		return *this;
	}
	class promise_type : public cancelable_promise_base
	{
		friend task;
		std::optional<T> result_;
	public:
		promise_type() noexcept
		{
		}
		task get_return_object() noexcept
		{
			return { *this };
		}
		void return_value(T&& t) noexcept
		{
			result_ = std::move(t);
		}
		void return_value(T const& t)
		{
			result_ = t;
		}
		auto& result() noexcept
		{
			return result_.value();
		}
	};
	void cancel() noexcept
	{
		assert(handle_);
		handle_.promise().cancel();
	}
	auto cancel_async() noexcept
	{
		assert(handle_);
		return handle_.promise().cancel_async();
	}
	~task()
	{
		if (!handle_)
			return;
		if (handle_.promise().zero())
			handle_.destroy();
	}
	auto operator co_await() noexcept
	{
		assert(handle_);
		struct task_awaiter
		{
			promise_type& p_;
			bool await_ready() const noexcept
			{
				return p_.is_done();
			}
			bool await_suspend(std::coroutine_handle<> handle) const noexcept
			{
				return p_.next(handle);
			}
			T await_resume()
			{
				p_.rethrow_exception();
				return std::move(static_cast<promise_type>(p_).result());
			}
		};
		return task_awaiter{ .p_ = handle_.promise() };
	}
	T sync_get()
	{
		assert(handle_);
		std::atomic<int> flag{ 1 };
		struct sync_awaiter : public std::suspend_always
		{
			decltype(handle_) h_;
			auto await_suspend(std::coroutine_handle<> handle)
			{
				return h_.promise().next(handle);
			}
		};
		[&flag, this]() noexcept -> task {
			co_await sync_awaiter{ .h_ = handle_ };
			flag.store(0, std::memory_order::release);
			flag.notify_one();
			}();
		while (flag.exchange(1, std::memory_order::acquire))
			flag.wait(1, std::memory_order::relaxed);
		auto& p = handle_.promise();
		p.rethrow_exception();
		return std::move(p.result());
	}
};
template <> // breakline
class task<void>
{
public:
	class promise_type;
private:
	std::coroutine_handle<promise_type> handle_{};
	friend promise_type;
	task(promise_type& p) noexcept : handle_(decltype(handle_)::from_promise(p))
	{
	}
public:
	task() = default;
	task(task&& rhs) noexcept
	{
		std::swap(rhs.handle_, handle_);
	}
	task& operator=(task&& rhs) noexcept
	{
		std::swap(rhs.handle_, handle_);
		return *this;
	}
	task(task const& rhs) noexcept
	{
		if (&rhs == this)
			return;
		if (!rhs.handle_)
			return;
		handle_ = rhs.handle_;
		handle_.promise().increase();
	}
	task& operator=(const task& rhs) noexcept
	{
		if (&rhs == this)
			return *this;
		task temp{};
		temp.handle_ = handle_;
		handle_ = rhs.handle_;
		if (!rhs.handle_)
			return *this;
		handle_.promise().increase();
		return *this;
	}
	class promise_type : public cancelable_promise_base
	{
		friend task;
	public:
		promise_type() noexcept
		{
		}
		task get_return_object() noexcept
		{
			return { *this };
		}
		void return_void()
		{
		}
	};
	void cancel() noexcept
	{
		assert(handle_);
		handle_.promise().cancel();
	}
	auto cancel_async() noexcept
	{
		assert(handle_);
		return handle_.promise().cancel_async();
	}
	~task()
	{
		if (!handle_)
			return;
		if (handle_.promise().zero())
			handle_.destroy();
	}
	auto operator co_await() noexcept
	{
		assert(handle_);
		struct task_awaiter
		{
			promise_type& p_;
			bool await_ready() const noexcept
			{
				return p_.is_done();
			}
			bool await_suspend(std::coroutine_handle<> handle) const noexcept
			{
				return p_.next(handle);
			}
			void await_resume()
			{
				p_.rethrow_exception();
			}
		};
		return task_awaiter{ .p_ = handle_.promise() };
	}
	void sync_get()
	{
		assert(handle_);
		std::atomic<int> flag{ 1 };
		struct sync_awaiter : public std::suspend_always
		{
			decltype(handle_) h_;
			auto await_suspend(std::coroutine_handle<> handle)
			{
				return h_.promise().next(handle);
			}
		};
		[&flag, this]() noexcept -> task {
			co_await sync_awaiter{ .h_ = handle_ };
			flag.store(0, std::memory_order::release);
			flag.notify_one();
			}();
		while (flag.exchange(1, std::memory_order::acquire))
			flag.wait(1, std::memory_order::relaxed);
		handle_.promise().rethrow_exception();
	}
};

```

`task` 的绝大部分内容在之前都讲过，唯一不同的是这次为完整的 `task` 添加了同步等待函数：通过创建一个临时的任务然后同步的使其等待当前任务完成，从而发出通知。

通过异步的 `task` 可以实现以下功能：

```cpp

#include <fast_io.h>

// https://learn.microsoft.com/zh-cn/windows/uwp/cpp-and-winrt-apis/concurrency-2

bizwen::task<> ExplicitCancelationAsync()
{
	using namespace bizwen;
	using namespace std::chrono_literals;
	auto cancelation_token{ co_await bizwen::get_cancellation_token() };

	while (!cancelation_token)
	{
		fast_io::print(fast_io::err(), "ExplicitCancelationAsync: do some work for 1 second\n");
		co_await 1s;
	}
}

bizwen::task<> MainCoroutineAsync()
{
	using namespace bizwen;
	using namespace std::chrono_literals;
	auto explicit_cancelation{ ExplicitCancelationAsync() };
	co_await 3s;
	explicit_cancelation.cancel();
}

bizwen::task<void> sleep(int x)
{
	using namespace std::chrono_literals;
	using namespace bizwen;
	co_await(x * 1s);
	fast_io::println(fast_io::out(), x);
}

bizwen::task<void> sleep_sort(auto... args)
{
	for (auto& i : std::array{ sleep(args)... })
		co_await i;
}

int main()
{
	MainCoroutineAsync().sync_get();
	sleep_sort(0, 9, 3, 4, 6, 1, 2, 8, 5, 7).sync_get();
}

```

完整代码（第一章所述）见 [coroutine.cpp](https://gist.github.com/YexuanXiao/abad460805c66eb66db883693d8b2f4d)。
