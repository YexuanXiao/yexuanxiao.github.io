---
title: C++ 异常 - 守卫
date: "2024-07-29 19:52:00"
tags: [C++]
category: blog
---
前几篇文章讲述了异常的基本概念和如何保证基本的异常安全，本文则综合并且结合最佳实践讲述如何编写正确的 C++ 代码。

<!-- more -->

本文是《C++ 异常》系列第五篇文章。

《C++ 异常》目录：

1. [C++ 异常 - 类和异常](/blog/2022/04/07/Cpp-Exception-Class-and-RAII/)
2. [C++ 异常 - 智能指针](/blog/2022/04/08/Cpp-Exception-Smart-Pointer/)
3. [C++ 异常 - 资源管理](/blog/2022/06/18/Cpp-Exception-Resource-Management/)
4. [C++ 异常 - 容器和 std::vector](/blog/2022/04/07/Cpp-Exception-Container-and-std-vector/)
5. 本文

## 守卫，很多的守卫

守卫（guard）和句柄类并列为 RAII 最主要的应用，同时，守卫也是保证异常安全的最重要组成。

典型的守卫包括 `lock_guard`，`unique_lock`，以及 `unique_ptr`。

### lock_guard

lock_guard 的典型实现如下：

```cpp

template<class T>
class lock_guard
{
    T& t_;

public:
    lock_guard(T& t) noexcept: t_(t)
    {
        t.lock();
    }
    ~lock_guard()
    {
        t.unlock();
    }
};

```

`lock_guard` 的特点是无空状态，无条件上锁以及无条件解锁，实际上是第一个性质导致了后两个性质。在实践中，`lock_guard` 只适合最简单的情况，考虑以下 `lock_guard` 不适合的例子：

```cpp

void run_task(mutex& m, task_queue& q)
{
    lock_guard l{m};

    if (q.empty())
        return;

    auto task = std::move(q.top());
    q.pop();

    // #1 其他代码

    task(); // 错误
}

```

`lock_guard l{m};` 能保证在 #1 抛出异常时，自动解锁；即使 #1 永不抛出异常，`l` 的存在也可以避免漏写解锁导致死锁的错误；在 #1 存在使用 `return;` 提前返回时，这种模式也能避免多次写出 `m.unlock()`，减少重复。

但以上代码有致命缺陷：`l` 会在 `task` 执行后才被析构，会导致代码变成串行执行。这种代码典型的出现在使用独立的锁保护一个线程不安全的结构时。

因此，需要将代码改写为：

```cpp

void run_task(mutex& m, task_queue& q)
{
    task t{};
    
    {
        lock_guard l{m};

        if (q.empty())
            return;

        task = std::move(q.top());
        q.pop();
    }

    // #1 其他代码

    task();
}

```

这对 `task` 是有要求的，如果 `task` 不支持默认构造，或者移动存在比较大的开销，则不适合。

另一种常见的使用 `lock_guard` 解决这个问题的方式是将线程不安全的队列转换为线程安全的：

```cpp

class concurrent_task_queue: private task_queue;

task concurrent_task_queue::pop_value()
{
    lock_guard l{m_};

    if (task_queue::empty())
        throw bizwen::empty_queue;

    auto result{std::move(task_queue::top())};
    task_queue::pop();

    return result;
}

void run_task(concurrent_task_queue& q) try
{
    auto task = q.pop_value();
    task();
} catch (decltype(bizwen::empty_queue)&)
{
}

```

但实际上这也不能解决移动存在开销的问题，当然，正如之前的文章《资源管理》所述，最佳实践是让默认构造/移动尽可能做更少的事。

而另外一种做法是扩展 `lock_guard`，使其变为 `unique_lock`：

实现如下：

```cpp

template<class T>
class unique_lock
{
    T* tp_{};

public:
    unique_lock(T& t) noexcept: tp_(&t)
    {
        t.lock();
    }
    void unlock() noexcept
    {
        tp_->unlock();
    }
    void release() noexcept
    {
        tp_ = nullptr;
    }
    ~unique_lock()
    {
        if (tp_)
            tp_->unlock();
    }
};

void run_task(mutex& m, task_queue& q)
{
    unique_lock l{m};

    if (q.empty())
        return;

    auto task = q.top();
    q.pop();

    l.unlock();
    l.release();

    task();
}

```

注意这个 `unique_lock` 实现只是一个为了完成功能的最简版本，稍后会完善它。

### unique_lock

上一节的结尾实现了一个 `unique_lock`，但实际上它称不上是 `lock`，因为它没有 `lock` 成员函数。

原因是指针只能表达是否存在锁，而不能额外表达是否上锁，因此为了实现该功能，需要使用一个 `bool` 储存锁的状态。

一个基本完善的 `unique_lock` 如下：

```cpp

template<class T>
class unique_lock
{
    T& t_{};
    bool locked_{};

public:
    unique_lock(T& t) noexcept: t_(t_), locked_(true)
    {
        t.lock();
    }
    unique_lock(T& t, defer_lock_t) noexcept: t_(t)
    {
    }
    unique_lock(T& t, adopt_lock_t) noexcept: t_(t), locked_(true)
    {
    }
    void lock() noexcept
    {
        assert(!locked_);
        t.lock();
    }
    bool try_lock() noexcept requires requires{ t.try_lock(); }
    {
        assert(!locked_);
        return t.try_lock();
    }
    void unlock() noexcept
    {
        assert(locked_);
        t.unlock();
    }
    void release() noexcept
    {
        locked_ = false;
    }
    ~unique_lock()
    {
        if (locked_)
            t.unlock();
    }
};

```

作为一个守卫，这个实现已经完整并且合格了。但有时候，用户可能想要延迟绑定锁，而在当前实现中，类储存的是锁的引用，引用没有默认值，因此实现延迟绑定需要将锁的引用改为锁的指针：

```cpp

template<class T>
class unique_lock
{
    T* tp_{};
    bool locked_{};

public:
    unique_lock() noexcept = default;
    unique_lock(T& t) noexcept: tp_(&t), locked_(true)
    {
        t.lock();
    }
    unique_lock(T& t, defer_lock_t) noexcept: tp_(&t)
    {
    }
    unique_lock(T& t, adopt_lock_t) noexcept: tp_(&t), locked_(true)
    {
    }
    void lock() noexcept
    {
        assert(tp_ && !locked_);
        tp_->lock();
    }
    bool try_lock() noexcept requires requires{ tp_->try_lock(); }
    {
        assert(tp_ && !locked_);
        return tp_->try_lock();
    }
    void unlock() noexcept
    {
        assert(tp_ && locked_);
        tp_->unlock();
    }
    void release() noexcept
    {
        locked_ = false;
    }
    ~unique_lock()
    {
        if (locked_)
            tp_->unlock();
    }
};


```

除了使用指针引用锁外，还有一个变化是增加了默认构造函数，毕竟延迟绑定锁的前提是支持构造时不绑定锁。

在此基础上，可以添加 `set_lock(T& t)`、`set_lock(T& t, defer_lock_t)`、`set_lock(T& t, adopt_lock_t)` 函数来实现延迟绑定锁。

善于思考的读者可能已经发现了，`set_lock` 的三个重载实际上就等于构造函数对应的版本，因此，实际上不需要单独实现 `set_lock`，只需要实现移动赋值（由于 `unique_lock` 独占锁，并依此析构，所以不存在复制赋值）：

```cpp

template<class T>
class unique_lock
{
    T* tp_{};
    bool locked_{};

public:
    ...

    friend void swap(unique_lock& lhs, unique_lock& rhs) noexcept
    {
        std::swap(lhs.tp_, rhs.tp_);
        std::swap(lhs.locked_, rhs.locked_);
    }
    unique_lock& unique_lock(unique_lock&& rhs) noexcept
    {
        if (locked_)
            unlock();
        swap(*this, rhs);

        return *this;
    }
    unique_lock(unique_lock&& rhs) noexcept
    {
        swap(*this, rhs);
    }

    ...
};

```

注意，锁的类的移动赋值必须先将 `*this` 解锁，这是为了防止 `*this` 被意外的延迟解锁从而阻塞或者死锁，但一般来说，调用该重载时，`*this` 应该处于不持有锁的状态。

既然实现了移动赋值，那么实现一个移动构造也是理所应当。

到现在，不难发现，`unique_lock` 居然也是句柄类！

### allocate_guard

`allocate_guard` 这个词可能很多人没听过，不过，实际上它非常常见而且经验丰富的人大概率已经独自发明过了。

它最常见的使用场景是和布置 `new` 配合；在标准库中，一些支持 `emplace` 操作的容器使用它。

现在考虑设计一个简化的 `shared_ptr`，它不追求和 `std::shared_ptr` 一致，但它拥有类似的功能，解决相同的问题，原型如下：

```cpp

template<class T>
class shared_ptr
{
    struct heap_node_
    {
        std::size_t counter_{};
        alignas(T) std::byte buffer_[sizeof(T)]{};
    };

    heap_node_* p_{};
};

```

由于是简化模型，因此不考虑支持分配器，不考虑支持弱引用，不考虑线程安全的计数，不支持别名使用。

现在设计它的构造函数：理应支持默认构造，移动构造；并且应该避免 `make_shared`，因此它需要支持从 `T&&`，`const T&` 构造，以及支持 `emplace` 构造避免多余的复制和移动，得到如下代码：

```cpp

template<class T>
class shared_ptr
{
    ...

    shared_ptr() = default;
    template<class U>
    void emplace_(U&& u) // 为了消除构造函数递归调用的歧义，设此辅助函数
    {
        p_ = new heap_node_{}; // #1
        p_->counter = 1uz;
        new (std::addressof(p_->buffer_)) T(std::forward<U&&>(u)); // #2
    }

public:
    template<class U>
    shared_ptr(U&& u)
    {
        emplace_(std::forward<U&&>(u));
    }
    shared_ptr(T&& t)
    {
        emplace_(std::move(u));
    }
    shared_ptr(const T& t): shared_ptr(t)
    {
        emplace_(u);
    }
    friend void swap(shared_ptr& lhs, shared_ptr& rhs) noexcept
    {
        std::swap(lhs.p_, rhs.p_);
    }
    shared_ptr(shared_ptr&& rhs) noexcept
    {
        swap(*this, rhs);
    }
    shared_ptr(const shared_ptr& rhs) const noexcept
    {
        if (!p_)
            return;

        ++p_->counter;
    }
    ~shared_ptr()
    {
        if (!p_)
            return;

        --p_->counter;

        if (p_->counter)
            return;

        static_cast<T*>(std::addressof(p_->buffer_))->~T();
        delete(p_);
    }
};

```

这段代码实际上是错误的，因为如果 #2 处调用 `T` 的构造函数抛出异常，之前分配的 `p_` 就会泄漏。

因此，通常的改进方式如下：

```cpp

template<class U>
void emplace_(U&& u)
{
    p_ = new heap_node_{};
    p_->counter = 1uz;
    try {
        new (std::addressof(p_->buffer_)) T(std::forward<U&&>(u));
    } catch(...)
    {
        delete(p_);
        throw;
    }
}

```

但目前来说，`catch(...)` 和 `throw;` 会阻止编译器生成最优的代码，为了解决这个问题，可以用以下代码替代：

```cpp

template<class T>
class allocate_guard
{
    T* p_{};

    public:
    allocate_guard(): p_(new T()) {}
    T* get() noexcept
    {
        return p_;
    }
    void release()
    {
        p_ = nullptr;
    }
    ~allocate_guard()
    {
        delete(p_);
    }
};

template<class U>
void emplace_(U&& u)
{
    allocate_guard<heap_node_> g{};
    p_ = g.get();
    p_->counter = 1uz;
    new (std::addressof(p_->buffer_)) T(std::forward<U&&>(u)); // #2
    g.release();
}

```

此时，在 #2 抛出异常后，`allocate_guard` 就会保护 `p_`，不发生泄漏，并且不使用 `catch(...)` 和 `throw;`。

实际上之前文章中介绍过的 `std::uninitialized_copy` 函数也可以使用相同的手法代替，这里留给读者做思考题。在我实现的 [basic_json](https://github.com/yexuanXiao/basic_json/) 中，就同时用到了这两种手法。

认真思考的读者可能已经发现：标准库的 `std::unique_ptr` 有相同的函数，实际上就是 `allocate_guard`！

是的，`std::unique_ptr` 就是 `allocate_guard`：

```cpp

template<class U>
void emplace_(U&& u)
{
    auto g{std::make_unique<T>()};
    p_ = g.get();
    p_->counter = 1uz;
    new (std::addressof(p_->buffer_)) T(std::forward<U&&>(u)); // #2
    g.release();
}

```

libc++ 的 `std::shared_ptr` 的构造函数就如此使用 `std::unique_ptr`。

基于此，可以扩展该 `allocate_guard`，使其变得更通用：

```cpp

template<class T, class A>
class allocate_guard
{
    using pointer = std::allocator_traits<A>::pointer;
    A a_{};
    pointer p_{};

    public:
    allocate_guard()
    {
        p_ = std::allocator_traits<A>::allocate(a_, 1);
    }
    allocate_guard(A const& a) noexcept :a_(a) {
        p_ = std::allocator_traits<A>::allocate(a_, 1);
    }
    pointer get() noexcept
    {
        return p_;
    }
    void release()
    {
        p_ = pointer{};
    }
    ~allocate_guard()
    {
        std::allocator_traits<A>::deallocate(a_, p_, 1);
    }
};

```

仔细思考的读者可能已经回忆到了，之前我的文章中讲过的 `vector_base` 与之非常类似，这不是巧合。

### unique_ptr

读到这里，相信读者一定彻底学会了 unique_ptr，因此这一节讨论的是一些非常细致，微妙的问题。

上述各种守卫以及不完整版 `unique_lock`，对比 `vector_base`、`std::unique_ptr` 以及完整版 `unique_lock`有什么区别？

最关键的是，后者是句柄类，而前者不是。我故意将前者全部写为无法默认构造/默认构造分配内存的形式，因为这在它们的应用场景中是最简洁的。

大部分持有单一资源的守卫都可以通过扩充变为句柄类，相对的，`std::uninitialized_copy` 的等价物就不持有单一所有权，因此它无论如何不可能变为句柄类，这实际上对应了我前文所述：

> 尽量简化句柄类的构造，让句柄类只构造自己该有的东西，例如，请让文件对象和数据库连接对象独立构造（并且支持移动）。

文件和数据库连接当然是单一所有权的。

成为句柄类后，将拥有守卫一般不具有的轻量的默认构造，移动构造和移动赋值。这些新具有的函数使句柄类能够作为容器的元素，能够作为结构体的子对象。但同时不要忘记，`unique_lock`，`vector_base` 仍然是守卫。

`std::unique_ptr` 实际上应该回归它的本职工作，即作为守卫，而不是句柄类使用，因为 `std::unique_ptr` 并没有有意义的构造函数，它不过是无条件的储存指针而已，通常，我们需要的是特殊化，专用化的句柄类，例如 `vector_base`，或者某一个 `file` 类，而不是 `std::unique_ptr`。`std::unique_ptr` 没有有意义的构造函数使其必须配合 `std::make_unique` 使用，这是一种劣化。LLVM 的代码就使用 `std::make_unique` 编写，但让 `std::unique_ptr` 拥有一个和 `std::make_unique` 等效的构造函数，才更符合 RAII，对用户来说更加轻松。
