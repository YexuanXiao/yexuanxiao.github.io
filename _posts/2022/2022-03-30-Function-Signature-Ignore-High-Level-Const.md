---
title: 函数签名忽略顶层 const 属性
date: "2022-03-30 01:44:00"
tags: [C++]
category: blog
---

今天看《C++ 程序设计语言》12.1.3 函数定义部分的时候注意到：`void f(int)` 和 `void f(const int)` 这两个声明对应一个函数，虽然这可能看起来违反“普遍”规则。Bjarne 对此解释为为了兼容 C。

<!-- more -->

实际上抛开兼容 C，从语言本身来讲，将这两种函数声明视为一种是行得通的，因为顶层 cv 限定只影响对应函数实现部分的语义，换句话说顶层 `const` 为参数时，调用者不必关心该限定，完全是函数内部实现负责的约束，因此可以视为同一签名。

这个规则只影响顶层 cv 限定的情况，不影响引用或者指针：

```cpp

class foo {
	int f1{};
};

foo a(const foo a1, const foo b1)
{
	std::cout << "const" << std::endl;
	return a1;
}
foo a(foo a1, const foo b1) // 重复定义
{
	std::cout << "non-const" << std::endl;
	/* */
	return a1;
}

int main() {
	foo d, e;
	const foo h;
	foo f = a(h, e);
	foo g = a(d, e);
}

```

注意，在 a 的函数调用过程中一定发生了对对象的复制，此时规则才成立。

对于非顶层 `const`，则不遵循此规则，因为非顶层 `const` 的调用过程并没有复制对象：

```cpp

class foo {
	int f1{};
};

foo a(const foo* a1, const foo* b1)
{
	std::cout << "const" << std::endl;
	return *a1;
}
foo a(foo* a1, const foo* b1) // a 发生了重载
{
	std::cout << "non-const" << std::endl;
	/* */
	return *a1;
}

int main() {
	foo d, e;
	foo f = a(const_cast<const foo*>(&d), &e);
	foo g = a(&d, &e);
}

```

由于上述两个 `a` 的重载都没有涉及顶层 `const`，所以并不是重定义。

涉及顶层 `const` 的写法如下：

```cpp

foo a(const foo* a, const foo* b);
foo a(const foo* a, const foo* const b); // 与上一行是同一函数声明

```
