---
title: C++ 命名空间和 using
date: "2022-04-13 10:05:00"
tags: [C++,docs]
category: blog
---
之前的文章 [关于 C++ 类和命名空间作用域的思考](/blog/2022/04/02/Thinking-About-Scope-of-class-and-namespace/) 中简要说明了 `namespace` 的历史。同时 `using` 被发明出来。而 C++11 又由于 `typedef` 存在缺陷，将 `using` 的功能扩展，添加了命名别名的功能。

<!-- more -->

虽然 `namespace` 的语法存在内在联系和规律，但是不如把所有使用方法展开来的直观：

1. `namespace 命名空间名 { 声明序列 }`
2. `using namespace 命名空间名;`
3. `inline namespace 命名空间名` (C++11 起)
4. `namespace { 声明序列 }`
5. `命名空间名 :: 成员名`
6. `using 命名空间名 :: 成员名;`
7. `namespace 名字 = 有限定命名空间;`
8. `namespace 命名空间名 :: 内部命名空间名 { 声明序列 }` (C++17 起)
9. `namespace 命名空间名::inline 内部命名空间名 { 声明序列 }` (C++20 起)

解释（详细解释参考 [cppreference: 命名空间](https://zh.cppreference.com/w/cpp/language/namespace)）：

1. 具名命名空间声明
2. `using` 指令：`using` 指令只影响查找规则，不引入新的名字，会使得操纵的命名空间内的名字如同在当前命名空间和操纵的命名空间的公共父命名空间内一样。 [^1]
3. 内联命名空间声明，内联命名空间隐式的插入了一条 `using` 指令
4. 无名命名空间中的名字仅限当前文件访问，且具有内部链接
5. 使用作用域解析运算符可以访问命名空间中的名字
6. `using` 声明：将操纵的名字引入该作用域
7. 定义命名空间别名
8. 嵌套（内部）命名空间定义，`namespace A::B {/* */}` 表示 `B` 命名空间在 `A` 中，等价于 `namespace A { namespace B {/* */} }`
9. 嵌套内联命名空间定义，在 8 的基础上指示内部命名空间是内联的

[^1]: 由于 `using` 指令不在当前命名空间引入新名字，所以 `using` 指令操纵的命名空间中的相同的名字不会和当前作用域内的名字进行重载，而是会被当前命名空间中的名字覆盖（对于非函数模板），所以具有一定危险性，具体规则见 [cppreference: 命名空间](https://zh.cppreference.com/w/cpp/language/namespace#using_.E6.8C.87.E4.BB.A4)。

<div class="ref-label">注：</div>
