---
title: Contracts
date: "2025-02-18 13:06:00"
tags: [C++, docs]
category: blog
---

最近 C++ 标准委员会的线下会议上通过了契约（本文译法，有的地方也翻译成合同），可以说是 C++26 最重要的一个特性，因此还是非常有必要单独拿出来讲一讲。其本身设计涵盖语言的各个方面，就结果而言，契约本身设计还是非常简单而且轻量的，使用起来并不会太困难。

<!-- more -->

在讲 C++26 的特性之前，还是需要讲一下背景知识。在 C++ 中，函数根据允许进行何种输入分为两类：宽契约（wide contract）和窄契约（narrow contract），宽契约指的是函数对任何输入都有明确定义的行为（异常也算明确定义），窄契约是函数对于一些输入有不确定的行为。当然在现实中宽和窄都是相对的，因为未定义行为具有传染性，例如通过错误的指针调用任何具有宽契约的函数显然也是未定义的。

### 核心语言

契约给标准加入了一个关键词 `contract_assert`，基本可以认为是 `assert` 宏的替代品，以及两个在函数声明上使用的上下文关键词 `pre` 和 `post`，前者用于表达函数的前条件，后者用于表达后条件。

`contract_assert` 的语法是：

`contract_assert 属性列表(可选) ( 条件 ) ;`

如果 `contract_assert` 断言失败，条件求值的结果是 `false`，就会调用契约违反处理函数，后面讲。

`post` 和 `pre` 的语法是：

`pre 属性列表(可选) ( 条件 )`

`post 属性列表(可选) ( 条件 )`

`post 属性列表(可选) ( 返回值标识符 : 条件 )`

`pre` 和 `post` 写在函数的参数列表的括号后面，比如：

```cpp

int foo(int x) pre(x >= 0) post(r : r < 0)
{
    x--;
    return x;
}

```

`pre` 在执行函数体前调用，`post` 在函数返回后调用。如果条件求值的结果是 `false`，那么就会调用契约违反处理函数。`pre` 和 `post` 可以出现多次，按编写顺序进行检查。

`post` 可以使用冒号引用返回值以检查返回值作为后条件，也就是上面例子中的 `(r : r < 0)`。

属性列表中的属性目前由实现定义，标准没有提供可用于契约断言的属性。

构造函数声明中的 `pre` 和 `post` 没有隐式 `this`，lambda 的 `pre` 和 `post` 不使用默认捕获，必须显式捕获才能用。

虚函数目前不能写 `pre` 和 `post`，显式默认化（`= default`）函数也不能写。

对于成员初始化列表，要写在契约后面：

```cpp

struct x
{
    int y = 1;
    x() pre( this->y == 1) : y( 2 ) {}
};

```

函数多次声明时契约必须匹配。

C++ 标准的意思就是让你在 `pre` 和 `post` 的条件中去调用具有窄契约的函数，来扩宽函数本身的契约。

契约有四种模式：ignore，observe，enforce 和 quick-enforce。默认是 enforce，即打印出信息，调用契约违反函数并终止程序；ignore 是不检查契约，直接忽略；observe 是违反契约后继续运行程序；quick-enforce 是违反契约时直接终止程序。等到编译器实现的时候会提供编译选项控制使用什么模式。当然，这四个模式具体什么行为也是编译器说的算。

契约比较特殊的是它会捕获契约条件中抛出的异常，阻止异常向外抛出。

### 标准库

标准库新定义了一个全局函数：

`void handle_contract_violation (std::contracts::contract_violation const&) noexcept;`

该函数没有声明，实现可以决定它是否是可替换的。

可替换指的是它类似 `void* ::operator new(std::size_t)`，标准库提供了一个默认实现，但用户可以定义一个自己的。因此当 `handle_contract_violation` 是可替换时，每个程序也只能定义一次，否则会链接冲突。

当程序检查出违反契约时（除了在常量求值时会直接发出诊断消息），就会调用 `handle_contract_violation`。

默认的 `handle_contract_violation` 的行为是实现定义的，一般来说它会打印消息然后返回（终止程序由编译器负责，不需要在这个函数内手动终止）。

标准库新加了 `<contracts>` 头文件，概要如下：

```cpp

namespace std::contracts
{
// 契约来源 
enum class assertion_kind : /* 未指定 */
{
    pre = 1,   // 指示是 pre 前条件违反
    post = 2,  // 后条件违反
    assert = 3 // 断言违反
};
// 契约使用的模式
enum class evaluation_semantic : /* 未指定 */
{
    ignore = 1,
    observe = 2,
    enforce = 3,
    quick_enforce = 4
};
// 契约违反的原因
enum class detection_mode : /* 未指定 */
{
    predicate_false = 1,     // 断言失败
    evaluation_exception = 2 // 捕获异常
};
class contract_violation
{
    // 用户不能主动构造
  public:
    contract_violation(const contract_violation &) = delete;
    contract_violation &operator=(const contract_violation &) = delete;
    ~contract_violation();
    const char *comment() const noexcept;
    contracts::detection_mode detection_mode() const noexcept;
    exception_ptr evaluation_exception() const noexcept;
    bool is_terminating() const noexcept;
    assertion_kind kind() const noexcept;
    source_location location() const noexcept;
    evaluation_semantic semantic() const noexcept;
};
void invoke_default_contract_violation_handler(const contract_violation &);
}

```

`comment` 函数返回实现定义的字符串，可以是字符串形式的契约条件，`evaluation_exception` 可以获得被契约捕获的异常，`is_terminating` 等于判断契约模式是不是 enforce。实际上当模式为 ignore 和 quick-enforce 时都不会调用契约违反处理函数。剩下的函数的功能自己意会。

### 功能特性测试宏

如果编译器实现了契约，那么编译器会预定义功能特性测试宏 `__cpp_contracts` 为 `202502L`。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://isocpp.org/files/papers/P2900R14.pdf">
Contracts for C++
</a>
</div>
