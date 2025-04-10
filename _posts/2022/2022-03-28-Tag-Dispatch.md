---
title: C++ 模板元编程 - 标签派发
date: "2022-03-28 20:09:00"
tags: [C++]
category: blog
---

标签派发是 C++20 引入 concept 之前模板编程的一个手段：由于 C++ 不支持函数模板的偏特化，所以为了实现“偏特化”而产生的一个技巧。

<!-- more -->

参考 [C++ Core Guidelines](https://github.com/isocpp/CppCoreGuidelines/blob/master/CppCoreGuidelines.md#t65-use-tag-dispatch-to-provide-alternative-implementations-of-a-function)。

#### T.65: Use tag dispatch to provide alternative implementations of a function 使用标签分发提供函数的不同实现

##### Reason 原因

* A template defines a general interface.
* 模板定义普遍接口。
* Tag dispatch allows us to select implementations based on specific properties of an argument type.
* 标签分发允许我们根据参数类型的特定属性选择实现方式。
* Performance.
* 性能

##### Example 示例

This is a simplified version of std::copy (ignoring the possibility of non-contiguous sequences)

这是一个 `std::copy` 的简化版本（忽略非连续序列）

```cpp

struct pod_tag {};
struct non_pod_tag {};

template<class T> struct copy_trait { using tag = non_pod_tag; };   // T is not "plain old data"

template<> struct copy_trait<int> { using tag = pod_tag; };         // int is "plain old data"

template<class Iter>
Out copy_helper(Iter first, Iter last, Iter out, pod_tag)
{
    // use memmove
}

template<class Iter>
Out copy_helper(Iter first, Iter last, Iter out, non_pod_tag)
{
    // use loop calling copy constructors
}

template<class Iter>
Out copy(Iter first, Iter last, Iter out)
{
    return copy_helper(first, last, out, typename copy_trait<Iter>::tag{})
}

void use(vector<int>& vi, vector<int>& vi2, vector<string>& vs, vector<string>& vs2)
{
    copy(vi.begin(), vi.end(), vi2.begin()); // uses memmove
    copy(vs.begin(), vs.end(), vs2.begin()); // uses a loop calling copy constructors
}

```

This is a general and powerful technique for compile-time algorithm selection.

这是一个可以在编译时选择算法的普遍和强大的技术。

##### Note 注意

When concepts become widely available such alternatives can be distinguished directly:

当概念可以被普遍使用时，这样的选则可以直接区分：

```cpp

template<class Iter>
    requires Pod<Value_type<iter>>
Out copy_helper(In, first, In last, Out out)
{
    // use memmove
}

template<class Iter>
Out copy_helper(In, first, In last, Out out)
{
    // use loop calling copy constructors
}

```
