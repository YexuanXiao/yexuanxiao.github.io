---
title: C++ 可调用对象和 std::invoke
date: "2021-09-25 00:29:00"
tags: [C++, docs]
category: blog
---

C++11 添加了 lambda 的支持，这使得 C++ 拥有了 5 种可调用对象：函数，函数指针，lambda，仿函数（Functor）和成员函数。这使在传递可调用对象时不得不对这 5 种方式进行兼容。C++17 引入了 std::invoke 来统一这 5 种可调用对象，大大简化了代码。

<!-- more -->

std::invoke 在 GCC 中的实现如下：

```cpp

template <typename _Functor, typename... _ArgTypes>
struct invoke_result
    : public __invoke_result<_Functor, _ArgTypes...>
{
};

template <typename _Fn, typename... _Args>
using invoke_result_t = typename invoke_result<_Fn, _Args...>::type;

template <typename _Callable, typename... _Args>
inline invoke_result_t<_Callable, _Args...>
invoke(_Callable &&__fn, _Args &&...__args) noexcept(is_nothrow_invocable_v<_Callable, _Args...>)
{
    return std::__invoke(std::forward<_Callable>(__fn),
                         std::forward<_Args>(__args)...);
}

```

其中 invoke_result 其实是编译器的一个黑魔法，invoke_result 代表可调用对象的返回值，invoke_result_t 是 invoke_result 的类型，通过别名模板定义。

is_nothrow_invocable_v 用于检查调用是否合法。

std::__invoke 内部实际上是将参数传递给了 std::__invoke_impl：

```cpp

template <typename _Callable, typename... _Args>
constexpr typename __invoke_result<_Callable, _Args...>::type
__invoke(_Callable &&__fn, _Args &&...__args) noexcept(__is_nothrow_invocable<_Callable, _Args...>::value)
{
    using __result = __invoke_result<_Callable, _Args...>;
    using __type = typename __result::type;
    using __tag = typename __result::__invoke_type;
    return std::__invoke_impl<__type>(__tag{}, std::forward<_Callable>(__fn),
                                      std::forward<_Args>(__args)...);
}

```

std::__invoke_impl 分别实现了不同情况下的函数调用，有五种重载。

```cpp

//1
template <typename _Res, typename _Fn, typename... _Args>
constexpr _Res
__invoke_impl(__invoke_other, _Fn &&__f, _Args &&...__args)
{
    return std::forward<_Fn>(__f)(std::forward<_Args>(__args)...);
}
//2
template <typename _Res, typename _MemFun, typename _Tp, typename... _Args>
constexpr _Res
__invoke_impl(__invoke_memfun_ref, _MemFun &&__f, _Tp &&__t,
              _Args &&...__args)
{
    return (__invfwd<_Tp>(__t).*__f)(std::forward<_Args>(__args)...);
}
//3
template <typename _Res, typename _MemFun, typename _Tp, typename... _Args>
constexpr _Res
__invoke_impl(__invoke_memfun_deref, _MemFun &&__f, _Tp &&__t,
              _Args &&...__args)
{
    return ((*std::forward<_Tp>(__t)).*__f)(std::forward<_Args>(__args)...);
}
//4
template <typename _Res, typename _MemPtr, typename _Tp>
constexpr _Res
__invoke_impl(__invoke_memobj_ref, _MemPtr &&__f, _Tp &&__t)
{
    return __invfwd<_Tp>(__t).*__f;
}
//5
template <typename _Res, typename _MemPtr, typename _Tp>
constexpr _Res
__invoke_impl(__invoke_memobj_deref, _MemPtr &&__f, _Tp &&__t)
{
    return (*std::forward<_Tp>(__t)).*__f;
}


```

值得注意的是，std::__invoke_impl 对成员函数进行了额外的处理：它会使用 args 的第一个参数作为类的 this，args 中剩余的参数被传递给 Callable。

对于其他可调用对象，所有 args 被传递给 Callable。

```cpp

#include <functional>
#include <iostream>
 
struct Foo {
    Foo(int num) : num_(num) {}
    void print_add(int i) const { std::cout << num_+i << '\n'; }
    int num_;
};
void print_num(int i) {
    std::cout << i << '\n';
}
struct Print {
    void operator()(int i) const
    {
        std::cout << i << '\n';
    }
};
int main() {
    auto *a = print_num;
    std::invoke(print_num, -9);
    std::invoke(a, -9);
    std::invoke([]() { print_num(42); });
    const Foo foo(314159);
    std::invoke(&Foo::print_add, foo, 1);
    std::cout << "num_: " << std::invoke(&Foo::num_, foo) << std::endl;
    std::invoke(Print(), 18);
}

```

通过 std::invoke 和 完美转发，能够轻松设计出接收任意可调用对象的函数。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/utility/functional/invoke">
std::invoke, std::invoke_r
</a>
<a href="https://zh.cppreference.com/w/cpp/named_req/Callable">
C++ 具名要求：可调用 (Callable)
</a>
</div>