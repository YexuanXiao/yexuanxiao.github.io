---
title: C++ 异常 - 容器和 std::vector
date: "2022-04-07 22:57:00"
tags: [C++]
category: blog
---

之前几篇文章中讲述了如何通过 RAII 设计出异常安全的类，但是有一个问题被（故意的）忽略掉了，那就是容器类的异常安全：容器需要在动态储存区构造一组对象，但是如何保证当第 n 个对象构造时发生异常，前 `n - 1` 个对象不发生内存泄漏？最傻瓜的方法是使用一个额外的迭代器，将已经构造的对象和未构造的对象进行划分，然后在 `try` 中进行构造，在 `catch` 中对已构造的对象进行析构，然后重新抛出异常，但是这种设计显然造成了额外的负担，因此，标准库使用了一种额外的设计来避免显式在容器的构造函数中使用 `try` 块。

<!-- more -->

本文是《C++ 异常》系列第四篇文章。

《C++ 异常》目录：

1. [C++ 异常 - 类和异常](/blog/2022/04/07/Cpp-Exception-Class-and-RAII/)
2. [C++ 异常 - 智能指针](/blog/2022/04/08/Cpp-Exception-Smart-Pointer/)
3. [C++ 异常 - 资源管理](/blog/2022/06/18/Cpp-Exception-Resource-Management/)
4. 本文
5. [C++ 异常 - 守卫](/blog/2024/07/29/Cpp-Exception-Guards/)

本文以 `vector` 为示例，介绍标准库容器的异常安全设计。`vector` 所需的关键资源是用来存放其元素的内存空间，只要提供一个可以表示 `vector` 内存的辅助类，我们就能在简化代码的同时大大降低忘记释放内存的可能性 [^1]：

[^1]: 本节源自《C++ 程序设计语言》。

```cpp

template<typename T, class A = std::allocator<T>>
struct vector_base {
    A alloc;
    T* elem;
    T* space;
    T* last;

    vector_base(const A& a, typename A::size_type n)
        :alloc(a), elem(alloc.allocate(n)), space(elem + n), last(elem + n) {}

    ~vector_base() { alloc.deallocate(elem, last - elem); }

    vector_base(const vector_base&)            = delete;
    vector_base& operator=(const vector_base&) = delete;

    vector_base(vector_base&&);
    vector_base& operator=(const vector_base&&);
};

```

`vector_base` 并不处理 `T` 的对象，而是 `T` 的内存，因此构造和析构都是由 `vector` 负责。

`vector_base` 唯一的目的就是作为 `vector` 实现的一部分。复制 `vector_base` 没有什么意义，但是可以移动 `vector_base`：

```cpp

template<typename T, class A>
vector_base<T, A>::vector_base(vector_base&& a)
    :alloc(a.alloc), elem(a.elem), space(a.space), last(a.space)
{
    a.elem = a.space = a.last = nullptr;
}

template<typename T, class A>
vector_base<T, A>::& vector_base<T, A>::operator=(vector_base&& a)
{
    std::swap(this->alloc, a.alloc);
    std::swap(this->elem, a.elem);
    std::swap(this->space, a.space);
    std::swap(this->last, a.last);
    return *this;
}

```

虽然上面已经是 `vector_base` 完整的定义了，但是显然对于 `vector_base` 的实现还是有点摸不到头脑，因为实现内存分配的实际上不是 `vector_base`，而是 `std::allocator`（定义于 \<memory\>）：

`std::allocator` 是一个无状态的内存分配器，并没有任何数据成员，构造函数等一系列函数也就没实际作用。

C++20 的 `std::allocator` 有如下定义（简化） [^2]：

[^2]: 参考 Microsoft STL。

```cpp

template<typename T>
struct allocator {
    using value_type      = T;
    using size_type       = std::size_t;
    using difference_type = std::ptrdiff_t;
    using propagate_on_container_move_assignment = std::true_type; // 暂且不用管

    allocator() noexcept                   = default;
    allocator(const allocator&) noexcept   = default;
    ~allocator()                           = default;
    allocator& operator=(const allocator&) = default;

    void deallocate(T* const ptr, const std::size_t count)
    {
        ::operator delete(ptr, count);
    }
    [[nodiscard]] T* allocate(const std::size_t count)
    {
        ::operator new(sizeof(size_type) * count);
    }
};

```

不难发现，`deallocate` 实际上就是 `operator delete`，`allocate` 就是 `operator new`。

回到 `vector_base`：

```cpp

vector_base(const A& a, typename A::size_type n)
    :alloc(a), elem(alloc.allocate(n)), space(elem + n), last(elem + n) {}
~vector_base() { alloc.deallocate(elem, last - elem); }

```

`vector_base` 的构造过程首先接收一个 `allocator`，然后通过 `allocator` 构造其他成员。注意，`vector_base` 本身不负责任何对象的构造，其中 `allocate` 有可能抛出内存分配失败的异常。

在 `vector_base` 的基础上，我们可以重新定义 `vector`：

```cpp

template<typename T, class A = std::allocator<T>>
class vector {
    vector_base<T, A> vb;
    void distroy_elements();
    public:
    using size_type = std::size_t;
    explict vector(size_type n, const T& val = T(), const A& = A());
    vector(const vector &a);
    vector& operator=(const vector &a);
    vector(vector &&a);
    vector& operator=(vector &&a);
    ~vector() { destroy_elements(); }
    size_type size() const {return vb.space - vb.elem; }
    size_type capacity() const {return vb.last - vb.elem; }
    void reserve(size_type);
    void resize(size_type, T = {});
    void clear() { resize(0); }
    void push_back(const T&);
}

void vector<T, A>::destory_elements()
{
    for (T* p = vb.elem; p!= vb.space; ++p)
        p->~T(); // 显式调用析构函数
    vb.space = vb.elem;
}

```

`vector` 的析构函数为每个元素显式调用了析构函数，而不是用 `delete`，这有两个原因：

1. 最浅显的原因是内存的分配不是 `vector` 负责的，而是 `vector_base` 负责的
2. 深层原因是：使用 `vector_base` 可以整块的释放内存，只需要 `delete` 1 次，防止内存变得支离破碎

上面的代码不考虑析构函数抛出异常的情况，因为析构函数抛出异常是不可以接受的。虽然某些析构函数确实存在对象的构造，导致析构函数抛出异常，但是设想一下如果析构函数抛出了异常，那么异常就具有了嵌套结构，实际上就无法顺序的处理，此时最好的措施就是立即终止程序。所以为了避免程序被终止，请避免在析构函数中进行可能抛异常的操作。

构造函数被定义为如下形式：

```cpp

template<typename T, class A>
vector<T, A>::vector(size_type n, const T& val, const A& a)
    :vb(a, n)
{
    std::uninitialized_fill(vb.elem, vb.elem + n, val);
}

```

注意，`vector_base` 是 `vector` 的 **成员**，同时 `vector_base` 自身是个异常安全的 Handle 类，那么 `vector` 的内存分配过程就是异常安全的。

如果 `vector` 直接操纵 `vector_base` 的成员，那么就做不到这一点，这也是标准库容器保证内存分配异常安全的关键。

`std::uninitialized_fill` 是标准库提供的一个函数模板，实现如下 [^3]：

[^3]: 参考 [cppreference: std::uninitialized_fill](https://zh.cppreference.com/w/cpp/memory/uninitialized_fill)。

```cpp

template<class ForwardIt, class T>
void uninitialized_fill(ForwardIt first, ForwardIt last, const T& value)
{
    using V = typename std::iterator_traits<ForwardIt>::value_type;
    ForwardIt current = first;
    try {
        for (; current != last; ++current) {
            ::new (const_cast<void*>(static_cast<const volatile void*>(
                std::addressof(*current)))) V(value);
        }
    }  catch (...) {
        for (; first != current; ++first) {
            first->~V();
        }
        throw;
    }
}

```

实际上就是一个能在发生异常时析构已构造元素的布置 new。

复制构造函数使用 `std::uninitialized_copy`：

```cpp

template<typename T, class A>
vector<T, A>::vector(const vector<T, A>& a)
    :vb(a.alloc, a.size())
{
    std::uninitialized_copy(a.begin(),a.end(),vb.elem);
}

```

```cpp

template<class InputIt, class NoThrowForwardIt>
NoThrowForwardIt uninitialized_copy(InputIt first, InputIt last, NoThrowForwardIt d_first)
{
    using T = typename std::iterator_traits<NoThrowForwardIt>::value_type;
    NoThrowForwardIt current = d_first;
    try {
        for (; first != last; ++first, ++current) {
            ::new (const_cast<void*>(static_cast<const volatile void*>(
                std::addressof(*current)))) T(*first);
        }
        return current;
    } catch (...) {
        for (; d_first != current; ++d_first) {
            d_first->~T();
        }
        throw;
    }
}

```

移动构造和移动赋值就简单许多：

```cpp

template<typename T, class A>
vector<T, A>::vector(vector&& a)
    :vb(std::move(a.vb)) noexcept {}

template<typename T, class A>
vector<T, A>::& vector<T, A>::operator=(vector&& a) noexcept
{
    std::swap(this->vb, a.vb);
}

```

虽然使用 `swap` 会多出一次对象构造和移动，但是首先这两个多余操作可能被优化掉，其次即使没有被优化，这种开销相比复制操作本身也是微不足道的。

同时，不需要检查自赋值，因为 `vector` 中仅仅储存了 `vector_base` 中的一个 `allocator` 和 3 个指针，并且判断自赋值也是一种开销，不一定比直接自我交换快。

复制赋值因为不是简单的交换成员，所以需要绕一下：先对使用复制构造对参数（右侧对象）进行复制，然后交换这个对象和 `*this`，则可以完成复制赋值，同时保证了强异常安全以及自赋值安全。因而没必要为了极少数的自赋值情况去写额外的代码。

当目标 `vector` 的容量足够放入新的 `vector`，则无需分配新空间，此时复制赋值可以使用如下改进：

```cpp

template<typename T, class A>
vector<T, A>& vector<T,A>::operator=(const vector& a)
{
    if(this.capacity() < a.size())
    {
        vector temp{a};
        std::swap(*this, temp);
        return *this;
    }
    size_type sz = this.size();
    size_type asz = a.size();
    this.vb.alloc = a.vb.alloc;
    if (asz <= sz) {
        std::copy(a.begin(), a.begin() + asz, vb.elem);
        for (T* p = vb.elem + asz; p != vb.space; ++p)
            p->~T();
    }
    else
    {
        std::copy(a.begin(), a.begin() + asz, vb.elem);
        std::uninitialized_copy(a.begin() + sz, a.end(), vb.space);
    }
    vb.sapce = vb.elem + asz;
    return *this;
}

```

但需要注意，无条件丢弃当前储存的复制赋值是强异常安全的，它保证复制失败时，左侧对象不被改变，而这个优化后的版本不能保证这一点。

其他成员函数也不过是重复上述代码罢了，所以不进行过多叙述。

注意，在 `vector` 的实现中，除了 `std::uninitialized_copy` 之外，并没有用到 `try` 块，该设计确保抛出异常时，`vector` 仍然有效而且没有内存泄漏。

<div class="ref-label">注：</div>
