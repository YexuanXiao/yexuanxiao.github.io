---
title: std::atomic_flag
date: "2022-01-04 01:35:00"
tags: [C++,STL,atomic,Standard]
category: blog
---

C++11 开始正式加入了多线程库及原子操作，原子操作是无锁并发的基础。所谓原子操作，就是具有原子性的操作：该操作对外不可分割。
<!-- more -->

## `std::atomic_flag`

`std::atomic_flag` 是 C++ 唯一保证内部无锁的原子类型，其内部维护一个布尔值。

### 标准

#### 31.10 Flag type and operations [atomics.flag]

```cpp

namespace std
{
    struct atomic_flag
    {
        constexpr atomic_flag() noexcept;
        atomic_flag(const atomic_flag &) = delete;
        atomic_flag &operator=(const atomic_flag &) = delete;
        atomic_flag &operator=(const atomic_flag &) volatile = delete;
        bool test(memory_order = memory_order::seq_cst) const volatile noexcept;
        bool test(memory_order = memory_order::seq_cst) const noexcept;
        bool test_and_set(memory_order = memory_order::seq_cst) volatile noexcept;
        bool test_and_set(memory_order = memory_order::seq_cst) noexcept;
        void clear(memory_order = memory_order::seq_cst) volatile noexcept;
        void clear(memory_order = memory_order::seq_cst) noexcept;
        void wait(bool, memory_order = memory_order::seq_cst) const volatile noexcept;
        void wait(bool, memory_order = memory_order::seq_cst) const noexcept;
        void notify_one() volatile noexcept;
        void notify_one() noexcept;
        void notify_all() volatile noexcept;
        void notify_all() noexcept;
    };
}

```

1. The atomic_flag type provides the classic test-and-set functionality. It has two states, set and clear.
2. Operations on an object of type atomic_flag shall be lock-free. The operations should also be address-free.
3. The atomic_flag type is a standard-layout struct. It has a trivial destructor.

    `constexpr atomic_flag::atomic_flag() noexcept;`

4. _Effects_ : Initializes **\*this** to the clear state.

    ```cpp
    
    bool atomic_flag_test(const volatile atomic_flag* object) noexcept;
    bool atomic_flag_test(const atomic_flag* object) noexcept;
    bool atomic_flag_test_explicit(const volatile atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag_test_explicit(const atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag::test(memory_order order = memory_order::seq_cst) const volatile noexcept;
    bool atomic_flag::test(memory_order order = memory_order::seq_cst) const noexcept;
    
    ```

5. For **atomic_flag_test**, let **order** be **memory_order::seq_cst**.
6. _Preconditions_ : **order** is neither **memory_order::release** nor **memory_order::acq_rel**.
7. _Effects_ : Memory is affected according to the value of **order**.
8. _Returns_ : Atomically returns the value pointed to by **object** or **this**.

    ```cpp
    
    bool atomic_flag_test_and_set(volatile atomic_flag* object) noexcept;
    bool atomic_flag_test_and_set(atomic_flag* object) noexcept;
    bool atomic_flag_test_and_set_explicit(volatile atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag_test_and_set_explicit(atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag::test_and_set(memory_order order = memory_order::seq_cst) volatile noexcept;
    bool atomic_flag::test_and_set(memory_order order = memory_order::seq_cst) noexcept;
    
    ```

9. _Effects_ : Atomically sets the value pointed to by **object** or by **this** to **true**. Memory is affected according to the value of **order**. These operations are atomic read-modify-write operations (6.9.2).
10. _Returns_ : Atomically, the value of the object immediately before the effects.

    ```cpp
    
    void atomic_flag_clear(volatile atomic_flag* object) noexcept;
    void atomic_flag_clear(atomic_flag* object) noexcept;
    void atomic_flag_clear_explicit(volatile atomic_flag* object, memory_order order) noexcept;
    void atomic_flag_clear_explicit(atomic_flag* object, memory_order order) noexcept;
    void atomic_flag::clear(memory_order order = memory_order::seq_cst) volatile noexcept;
    void atomic_flag::clear(memory_order order = memory_order::seq_cst) noexcept;
    
    ```

11. _Preconditions_ : The **order** argument is neither **memory_order::consume, memory_order::acquire,
nor memory_order::acq_rel**.
12. _Effects_ : Atomically sets the value pointed to by **object** or by **this** to **false**. Memory is affected according to the value of **order**.

    ```cpp
    
    void atomic_flag_wait(const volatile atomic_flag* object, bool old) noexcept;
    void atomic_flag_wait(const atomic_flag* object, bool old) noexcept;
    void atomic_flag_wait_explicit(const volatile atomic_flag* object,
    bool old, memory_order order) noexcept;
    void atomic_flag_wait_explicit(const atomic_flag* object,
    bool old, memory_order order) noexcept;
    void atomic_flag::wait(bool old, memory_order order = memory_order::seq_cst) const volatile noexcept;
    void atomic_flag::wait(bool old, memory_order order = memory_order::seq_cst) const noexcept;
    
    ```

13. For atomic_flag_wait, let **order** be **memory_order::seq_cst**. Let **flag** be object for the non-member functions and **this** for the member functions.
14. _Preconditions_ : **order** is neither **memory_order::release** nor **memory_order::acq_rel**.
15. _Effects_ : Repeatedly performs the following steps, in order:

    + (15.1) — Evaluates `flag->test(order) != old`.
    + (15.2) — If the result of that evaluation is true, returns.
    + (15.3) — Blocks until it is unblocked by an atomic notifying operation or is unblocked spuriously.

16. _Remarks_ : This function is an atomic waiting operation (31.6).

    ```cpp
    
    void atomic_flag_notify_one(volatile atomic_flag* object) noexcept;
    void atomic_flag_notify_one(atomic_flag* object) noexcept;
    void atomic_flag::notify_one() volatile noexcept;
    void atomic_flag::notify_one() noexcept;
    
    ```

17. _Effects_ : Unblocks the execution of at least one atomic waiting operation that is eligible to be unblocked
(31.6) by this call, if any such atomic waiting operations exist.
18. _Remarks_ : This function is an atomic notifying operation (31.6).

    ```cpp
    
    void atomic_flag_notify_all(volatile atomic_flag* object) noexcept;
    void atomic_flag_notify_all(atomic_flag* object) noexcept;
    void atomic_flag::notify_all() volatile noexcept;
    void atomic_flag::notify_all() noexcept;
    
    ```

19. _Effects_ : Unblocks the execution of all atomic waiting operations that are eligible to be unblocked (31.6)
by this call.
20. _Remarks_ : This function is an atomic notifying operation (31.6).

#### 31.10 标志类型和操作 [atomics.flag]

```cpp

namespace std
{
    struct atomic_flag
    {
        constexpr atomic_flag() noexcept;
        atomic_flag(const atomic_flag &) = delete;
        atomic_flag &operator=(const atomic_flag &) = delete;
        atomic_flag &operator=(const atomic_flag &) volatile = delete;
        bool test(memory_order = memory_order::seq_cst) const volatile noexcept;
        bool test(memory_order = memory_order::seq_cst) const noexcept;
        bool test_and_set(memory_order = memory_order::seq_cst) volatile noexcept;
        bool test_and_set(memory_order = memory_order::seq_cst) noexcept;
        void clear(memory_order = memory_order::seq_cst) volatile noexcept;
        void clear(memory_order = memory_order::seq_cst) noexcept;
        void wait(bool, memory_order = memory_order::seq_cst) const volatile noexcept;
        void wait(bool, memory_order = memory_order::seq_cst) const noexcept;
        void notify_one() volatile noexcept;
        void notify_one() noexcept;
        void notify_all() volatile noexcept;
        void notify_all() noexcept;
    };
}

```

1. atomic_flag 类型提供传统的 test-and-set 功能。它有两个状态，设置（set）和清除（clear）。
2. 对 atomic_flag 类型的成员的任何操作都应是无锁的。这些操作也应是地址安全的（address-free）。
3. atomic_flag 类型是一个标准布局结构体，它有一个平凡的析构器。

    `constexpr atomic_flag::atomic_flag() noexcept;`

4. _作用_ : 初始化 **\*this** 是将值设置为清除（clear）。

    ```cpp
    
    bool atomic_flag_test(const volatile atomic_flag* object) noexcept;
    bool atomic_flag_test(const atomic_flag* object) noexcept;
    bool atomic_flag_test_explicit(const volatile atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag_test_explicit(const atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag::test(memory_order order = memory_order::seq_cst) const volatile noexcept;
    bool atomic_flag::test(memory_order order = memory_order::seq_cst) const noexcept;
    
    ```

5. 对于 **atomic_flag_test**，假设 **order** 是 **memory_order::seq_cst**。
6. _先决条件_ : **order** 既不是 **memory_order::release** 也不是 **memory_order::acq_rel**。
7. _作用_ : 内存根据 **order** 的值被改变。
8. _结果_ : 原子的返回指向 **object** 或者 **this** 的值。

    ```cpp
    
    bool atomic_flag_test_and_set(volatile atomic_flag* object) noexcept;
    bool atomic_flag_test_and_set(atomic_flag* object) noexcept;
    bool atomic_flag_test_and_set_explicit(volatile atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag_test_and_set_explicit(atomic_flag* object, memory_order order) noexcept;
    bool atomic_flag::test_and_set(memory_order order = memory_order::seq_cst) volatile noexcept;
    bool atomic_flag::test_and_set(memory_order order = memory_order::seq_cst) noexcept;
    
    ```

9. _作用_ : 原子的修改指向 **object** 或者 **this** 的值为 **true**。内存根据 **order** 的值被改变。这些操作原子的进行 read-modify-write 操作 (6.9.2)。
10. _结果_ : 原子的，对象的值在影响之前。

    ```cpp
    
    void atomic_flag_clear(volatile atomic_flag* object) noexcept;
    void atomic_flag_clear(atomic_flag* object) noexcept;
    void atomic_flag_clear_explicit(volatile atomic_flag* object, memory_order order) noexcept;
    void atomic_flag_clear_explicit(atomic_flag* object, memory_order order) noexcept;
    void atomic_flag::clear(memory_order order = memory_order::seq_cst) volatile noexcept;
    void atomic_flag::clear(memory_order order = memory_order::seq_cst) noexcept;
    
    ```

11. _先决条件_  : **order** 既不是 **memory_order::consume** 也不是  **memory_order::acquire** 或 **memory_order::acq_rel**。
12. _作用_ : 原子的修改指向 **object** 或者 **this** 的值为 **false**。内存根据 **order** 的值被改变。

    ```cpp
    
    void atomic_flag_wait(const volatile atomic_flag* object, bool old) noexcept;
    void atomic_flag_wait(const atomic_flag* object, bool old) noexcept;
    void atomic_flag_wait_explicit(const volatile atomic_flag* object,
    bool old, memory_order order) noexcept;
    void atomic_flag_wait_explicit(const atomic_flag* object,
    bool old, memory_order order) noexcept;
    void atomic_flag::wait(bool old, memory_order order = memory_order::seq_cst) const volatile noexcept;
    void atomic_flag::wait(bool old, memory_order order = memory_order::seq_cst) const noexcept;
    
    ```

13. 对于 atomic_flag_wait，假设 **order** 是 **memory_order::seq_cst**。假设 **flag** 是非成员函数的对象和 **this** 是成员函数的。
14. _先决条件_ : **order** 既不是 **memory_order::release** 也不是 **memory_order::acq_rel**。
15. _作用_ : 重复执行下列步骤，依据 order：

    + (15.1) — 评估 `flag->test(order) != old`。
    + (15.2) — 如果结果为 true，返回。
    + (15.3) — 锁定，直到它被一个原子通知操作解除锁定或被虚假地解除锁定。

16. _注释_ : 这个函数是一个原子的等待操作 (31.6)。

    ```cpp
    
    void atomic_flag_notify_one(volatile atomic_flag* object) noexcept;
    void atomic_flag_notify_one(atomic_flag* object) noexcept;
    void atomic_flag::notify_one() volatile noexcept;
    void atomic_flag::notify_one() noexcept;
    
    ```

17. _作用_ : 解除至少一个原子等待操作的执行，如果有任何这样的原子等待操作存在，该调用有资格被解除封锁(31.6)。
18. _注释_ : 这个函数是一个原子的通知操作 (31.6)。

    ```cpp
    
    void atomic_flag_notify_all(volatile atomic_flag* object) noexcept;
    void atomic_flag_notify_all(atomic_flag* object) noexcept;
    void atomic_flag::notify_all() volatile noexcept;
    void atomic_flag::notify_all() noexcept;
    
    ```

19. _作用_ : 解除所有有资格被此调用解锁的原子等待操作的执行 (31.6)。
20. _注释_ : 这个函数是一个原子的通知操作 (31.6)。

#### 注释

1. 根据 cppreference 的文章 [成员函数](https://en.cppreference.com/w/cpp/language/member_functions#const-_and_volatile-qualified_member_functions)，volatile 修饰成员函数的目的是对 this* 进行限定，类似于 const 修饰的成员函数只能调用该类的 const 修饰的成员函数。
2. 根据 cppreference 的文章 [destructor](https://zh.cppreference.com/w/cpp/language/destructor)，平凡析构代表着，析构函数非虚且不是用户提供的，平凡析构函数是不进行任何动作的析构函数。有平凡析构函数的对象不要求 delete 表达式，并可以通过简单地解分配其存储进行释放。
3. 关于 std::memory_order 的内容将在后半部分讲述。

### 总结

#### 目的

std::atomic_flag 是原子类型的最小概念的实现，默认值为 clear（false）。

在 C++20 之前，std::atomic_flag 必须使用 ATOMIC_FLAG_INIT 这个宏进行初始化，但是标准委员会意识到声明 std::atomic_flag 而不进行初始化没有任何意义，并且增加了无效代码，所以 C++20 开始，std::atomic_flag 被默认初始化为清除，通过构造函数 (D.25.1)。

C++11 后，C++20 之前，std::atomic_flag 只有 3 类成员函数，由于 std::atomic_flag 实际上为布尔值，所以这三个函数的参数只有 std::memory_order ，不需要传入参数，因此 std::atomic_flag 是一个非常轻量的标志：

+ bool test(memory_order) ：返回当前值
+ bool test_and_set(memory_order) ：将值设置为 true 并返回先前值
+ void clear(memory_order)：将值设置为 false

C++ 并发编程实战第二版中提出了一种使用 std::atomic_flag 的自旋锁类型：

```cpp

class spinlock_mutex
{
    std::atomic_flag flag{};
public:
    void lock()
    {
        while (flag.test_and_set(std::memory_order_acquire));
    }
    void unlock()
    {
        flag.clear(std::memory_order_release);
    }
};

```

这个非常基础的自旋锁可以配合 std::lock_guard 来使用：

1. 锁作为类成员在构造时被初始化
2. 在对类的其他成员进行修改前，尝试上锁
3. 上锁成功后执行修改操作
4. 修改完成后解锁

由于 test_and_set 会返回之前的锁的状态，因此在 while 循环中，只有真正解锁（clear）才会停止循环，由于 test_and_set 具有原子性，所以 test_and_set 并不会破坏锁原本的状态。

遗憾的是，C++ 并发编程实战写于 2018 年并在 2019 年 2 月出版，而 C++20 恰好对 std::atomic_flag 做了改进：加入了 wait，notify_one，notify_all 函数，增强了 std::atomic_flag 的功能。

```cpp

class wait_mutex
{
    std::atomic_flag flag{};
public:
    void lock()
    {
        while (flag.test_and_set(std::memory_order_acquire)){
            flag.wait(flag.test(std::memory_order_acquire), std::memory_order_acquire);
        }
    }
    void unlock()
    {
        flag.clear(std::memory_order_release);
        flag.notify_one();
    }
};

```

改进版的代码中添加了一个 wait 语句来让 while 循环等待，在解锁时发送停止等待的通知。

<div class="ref-label">参考：</div>
<div class="ref-list">
<span >
ISO/IEC 14882:2020 Programming languages — C++
</span>
<span >
C++ 并发编程实战第二版
</span>
<a href="https://zh.cppreference.com/w/cpp/atomic/atomic_flag">
std::atomic_flag
</a>
</div>
