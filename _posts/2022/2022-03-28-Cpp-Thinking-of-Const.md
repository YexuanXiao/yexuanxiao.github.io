---
title: 关于 const 的一个思考
date: "2022-03-28 09:41:00"
tags: [C++]
category: blog
---

我在编写代码的过程中曾经注意到 `const` 成员函数、`const` 参数函数，它们于非 `const` 重载版本可以拥有类似但是不同的语义（使用不用的函数定义），产生不同的效果（`const` 与否都可以带来额外性能的提高， **并没有优劣之分** ）。`const` 是由 Bjarne Stroustrup 在 C++ 早期设计引入的：K&R C 中并没有 `const` 的概念，而 Bjarne 发现缺少 `const` 会存在一个实现缺陷以及二个语义缺陷。

<!-- more -->

1. const 内容可以放到只读储存区，对于某些硬件来说可写储存区会非常昂贵
2. 使用 const 传递参数可表达一种不变的概念，防止对变量进行意外的更改
3. 使用 const 可表达常量，用于常量表达式

ANSI C 相比 K&R C 采纳了前两点，但是 ANSI C 中 `const` 仍然不能表示常量，K&R C 和 ANSI C 必须用字面值来表示常量。

Bjarne 设计 `const` 的目的大致就是为了解决如上问题 [^1] 。

[^1]: 参考《C++ 语言的设计和演化》。

此外，对于第二点修复，`const` 实际带来了更复杂的特性：

```cpp

string operator+(const string& a, const string &b)
{
    string res;
    /* */
    return res;
}

```

考虑如上的 `string` 拼接定义，由于参数为两个 `const string`，所以函数必须构造一个新的 `string` 用于容纳拼接后的字符串，这在一些情况下会导致性能低下：

```cpp

string a, b, c;
/* */
string d = a + b + c;

```

实际上该操作产生了至少一个额外的 `string` 对象：`(a + b)` （由于 C++ 规定 `+` 是右结合），并且永远不能被优化。

基于此，实际上可以写出另一种函数：

```cpp

string& operator+(string& a, const string &b)
{
    /* */
    return a;
}

```

这种函数会在左侧对象上应用拼接，返回值也是左侧对象的引用，因而每次拼接操作都会应用到最左侧对象，`a + b + c` 相当于展开为逗号运算：`a + b, a + c`。

不过由此产生了 `operator+` 的重载选择问题：对于两个非 `const` 的 `a` 和 `b` 应用 `operator+`，默认会选择非 `const` 的版本，因为非 `const` 版本更精准。

此时如果想要匹配 `const` 版本，需要使用 `const_cast`：

```cpp

foo d = const_cast<const foo&>(a) + b + c;

```

这里有个小细节：虽然只给 `a` 加上了 `const` 限定，但是却使用了两次 `const` 版本的 +，是因为右值无法绑定到左值引用。

还可以使用一个 `const` 辅助模板用于简化 `const_cast`：

```cpp

template<typename T>
auto use_const(T& t) { // 注意，标准库中有 add_const 模板，但不能用于此
	return const_cast<const T&>(t);
}

```

其实读到这里读者就会发现，非 `const` 版本的 `operator+`，实际上和 `operator+=` 的实现非常类似，不过 += 也不尽全是优点：`a += b += c` 这样的代码可能并不如 `a + b + c` 清晰，不过 += 能解决重载匹配问题。

实际上我以前还发现过 C++ 标准库容器中使用 `const` 作为参数，省略掉一次复制构造带来效率提高的例子，不过时间久远遗忘了细节（作为使用 `const` 优化效率的正面例子）。
