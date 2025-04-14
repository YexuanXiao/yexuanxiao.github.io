---
title: C++ 分层互斥器技巧防止死锁
date: "2021-09-15 18:41:00"
tags: [C++, docs]
category: blog
---
C++ 并发编程实战第二版展示了一种 C++ 多线程设计技巧 hierarchical_mutex，由于书中对此解释比较混乱，在此做个笔记。

<!-- more -->


`hierarchical_mutex` 可以理解为是一种半自动的 `std::lock`，`std::lock` 是使用原子操作去防止死锁，保证顺序，而 `hierarchical_mutex` 是使用数字顺序作为层次保证互斥器的逻辑顺序正确从而防止死锁。

```cpp

class hierarchical_mutex
{
    std::mutex internal_mutex;
    size_t const hierarchy_value;
    size_t previous_hierarchy_value;
    static thread_local size_t this_thread_hierarchy_value; // 1
    void check_for_hierarchy_violation()
    {
        if (this_thread_hierarchy_value <= hierarchy_value) // 2
        {
            throw std::logic_error("mutex hierarchy violated");
        }
    }
    void update_hierarchy_value()
    {
        previous_hierarchy_value = this_thread_hierarchy_value; // 3
        this_thread_hierarchy_value = hierarchy_value;
    }

public:
    explicit hierarchical_mutex(size_t value) : hierarchy_value(value),
                                                       previous_hierarchy_value(0)
    {
    }
    void lock()
    {
        check_for_hierarchy_violation();
        internal_mutex.lock();    // 4
        update_hierarchy_value(); // 5
    }
    void unlock()
    {
        if (this_thread_hierarchy_value != hierarchy_value)
            throw std::logic_error("mutex hierarchy violated"); // 9
        this_thread_hierarchy_value = previous_hierarchy_value; // 6
        internal_mutex.unlock();
    }
    bool try_lock()
    {
        check_for_hierarchy_violation();
        if (!internal_mutex.try_lock()) // 7
            return false;
        update_hierarchy_value();
        return true;
    }
};
thread_local size_t
    hierarchical_mutex::this_thread_hierarchy_value(0xffffffff); // 8

```

`hierarchical_mutex` 中有 3 个数字记录，分别是：

1. this_thread_hierarchy_value：初始化为最大值，每一个线程独有一份
2. hierarchy_value：手动指派的层次数，构造时传入
3. previous_hierarchy_value：this_thread_hierarchy_value 的互斥临时备份

`hierarchical_mutex` 有 4 个公开成员函数，分别是：

+ 构造函数：将 `2` 初始化为传入的数值，并将 `3` 初始化为 0，这是由于 `3` 只是 `1` 的临时备份，所以构造时无实际意义。
+ lock：检查 `3` 是否大于 `2`，如果大于 `2`，则上锁并且将 `1` 备份到 `3`，并把 `1` 更新为 `2`。
+ unlock：由于 lock 把 1 更新为 2，所以解锁时理应二者相等，如果不相等则一定存在其他错误，如果相等，则将备份用的 `3` 赋给 `1`，并进行解锁。
+ try_lock：同 lock，不过加了一个判断，避免重复上锁。

回到最初的话题，设计互斥器的目的是为了保证指令按需执行操作特定的对象，设计分层互斥器的目的是为了避免死锁。

使用这个分层互斥器的核心就是在同一个线程中，按照数字标记递减的顺序构造多个分层互斥器，这时这 3 个分层互斥器就会按照构造函数进行构造。

维持防止死锁的核心关键在于 check 和 update 两个函数，其中 check 的目的是保证当前线程环境下，当前线程的层级一定大于等于将要上锁的分层互斥器的层级。update 的目的是将当前线程下的层级更新为互斥器的层级。

以上就代表着，当前线程的层级标记在每次有互斥锁被锁定时，一定大于等于该互斥锁的层级，并且变为该互斥锁的层级，从而保证大的层级的互斥锁一定不会在低层级互斥锁被锁定之后被锁定。