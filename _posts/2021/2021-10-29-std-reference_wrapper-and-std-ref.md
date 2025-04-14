---
title: C++ std::reference_wrapper 和 std::ref
date: "2021-10-29 19:28:00"
tags: [C++, docs]
category: blog
---

std::reference_wrapper 是 C++11 开始添加的一个类模板，作用是将引用包装为一般对象，使之可以当作普通对象来储存和传递，std::ref 是通过 std::reference_wrapper 实现的辅助函数，用于自动构建 std::reference_wrapper 临时对象。

<!-- more -->

之前的文章 [C++ std::move](/blog/2021/09/23/Cpp-std-move/) 提到过函数模板 std::remove_reference 用于去除参数的引用，而 std::ref [^1] 则刚好与其相反。

[^1]: [std::ref, std::cref](https://zh.cppreference.com/w/cpp/utility/functional/ref)

std::thread 构造函数的第二个参数就是经过了 std::remove_reference 的处理，因为 std::thread 通常期望将传入的参数复制一份传递给 Callables，而引用在语义上不是一个真正的对象（在实现上，引用是可与其指向的对象进行区分的），仅仅作为原始对象的别名。

所以，如果希望将一个引用传递给 std::thread，那么就必须使用 std::reference_wrapper [^2] 构建一个可传递的引用，为了简便书写，可直接使用 std::ref 函数，std::ref 会将左值和左值引用统一为左值引用，然后将其装入 std::reference_wrapper，其使用方法和 std::move 类似。

[^2]: [std::reference_wrapper](https://zh.cppreference.com/w/cpp/utility/functional/reference_wrapper)

<div class="ref-label">注：</div>