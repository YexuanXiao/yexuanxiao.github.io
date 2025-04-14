---
title: 严格别名规则和指针安全性
date: "2022-01-30 21:04:00"
tags: [C++,STL]
category: blog
---

C++ 的一大特性是能够通过指针直接管理内存，但是 C++ 提供的一些高级抽象存在着额外的内存布局规则，只有在满足严格别名规则的情况下，才能保证正确访问。虽然在大部分情况下，指针的错误转换能得到正确的结果，但是不正确的转换常常是隐含的 bug，编译器不对此做任何的保证，特别是在使用激进的优化策略时，常常会导致程序出现错误，所以了解严格别名规则是非常有意义且重要的。

<!-- more -->

C++ 的指针可以对任何类型的数据构成进行二次解释，但是解释结果的正确是有前提的，举个简单例子：

```cpp

int a = 1; // 假设 int 为 32 位
float d = *(float*)(&a);

```

这段代码在大部分编译器的默认配置下都是可以直接编译通过的，但是很明显，d 的值是没意义的。

大部分人也都能理解这其中的不同，因为 `int` 和 `float` 并不是一个 **兼容** 类型，需要使用额外的复杂计算才能使得 `d` 能够正确储存 `a` 的值。

再有如下例子：

```cpp

class A
{
    int a = 1;
};

class B: public A
{
    int b = 2;
};

int main()
{
    B b;
    A a = *(A*)(&a);
}

```

因为 `A` 是 `B` 的基类，理所当然的支持 `B` 到 `A` 的向上转换，所以 `A` 和 `B` 是兼容类型。

`A` 的指针和 `B` 的指针可以随意转换，但是如果使用 `A` 的指针来初始化 `B` 的成员，必须要确定这个 `A` 的指针是从另一个 `B` 的成员创建而来的。

#### 严格别名规则

给定一个拥有有效类型 `T1` 的对象，使用相异类型的 `T2` 左值表达式（典型的是解引用指针）访问它在以下情况下是有效的：

+ `T2` 和 `T1` 是兼容类型。
+ `T2` 是与 `T1` 兼容的类型的 cv 限定版本。
+ `T2` 是与 `T1` 兼容的类型的有符号或无符号版本。
+ `T2` 是聚合体或联合体类型，其成员中包含一个前述类型（包含、递归包含、子聚合体或被包含的联合体的成员）。
+ `T2` 是字符类型（ `char`、`signed char` 或 `unsigned char` ）。

例如：

```cpp

int i = 7;
char* pc = (char*)(&i);
if(pc[0] == (char)7) { // 通过 char 别名使用是 OK 的
    puts("This system is little-endian");
} else {
    puts("This system is big-endian");
}

```

此处使用 `char` 指针来读取 `int` 的首个字节，用于判断大小端，这是合理的。

但是有一点需要注意：`char` 有可能是 `unsigned` 或者 `signed`。

**cppreference 提出了一种“极端”条件下影响编译器优化的例子：**

```cpp

// int* 与 double* 不能别名使用
void f1(int *pi, double *pd, double d)
{   // 编译器认为 pi 和 pd 没有潜在关联
    // 从 *pi 的读取可以只做一次，在循环前
    for (int i = 0; i < *pi; i++) *pd++ = d;
}

struct S { int a, b; };
// int* 和 struct S* 可以别名使用，因为 S 拥有 int 类型的成员

void f2(int *pi, struct S *ps, struct S s)
{   // 编译器认为 pi 和 ps 可能存在关联
    // 从 *pi 的读取必须在每次通过 *ps 写入后进行
    for (int i = 0; i < *pi; i++) *ps++ = s;
}

```

在违反严格别名规则的要求下，例如 `f1` 的 `pi` 和 `pd` 指向同一地址，编译器可能优化产生错误结果。

#### 起源

我在 Bjarne Stroustrup 所著《C++ 语言的设计和演化》中找到了如下两段：

![屏幕截图 2022-02-08 112610](https://tvax1.sinaimg.cn/large/005ZJ4a1ly1gz6r1qqkycj31hy0hggxh.jpg "candark")
![屏幕截图 2022-02-08 112934](https://tvax1.sinaimg.cn/large/005ZJ4a1ly1gz6r1vojszj318w0si4h7.jpg "candark")

简单来讲就是：C 中数组是第二类公民，数组是不能直接传递的，而 Fortran 可以直接传递数组。C 中必须使用指针传递数组，但是对于小型数组来说使用指针传递的效率非常低，并且使用指针传递从根本上拒绝了向量化：编译器很难判断两个指针是否重叠，这个问题是 C 设计的一个污点，严重影响了性能。

Fortran 的设计也不一定是尽善尽美的：由于 Fortran 注重于数学运算，所以相对于 C 而言不够灵活。

C 标准委员会的解决方案是使用严格别名规则和 `restrict` 关键词来指导编译器进行主动优化，这显然是丑陋的，但也是无奈之举。

而 C++ 为了兼容 C，并且保持灵活性，选择使用 `std::array`：`std::array` 是对象，不是数组，是一等公民，并且传递 `std::array` 可以使用寄存器而不是指针，可以放心向量化。

在此基础上，C++ 也逐渐切换到 Fortran 的模式，为以后的优化进行铺路，进而设计出 `std::launder` 指导编译器取消优化：

#### 缺陷报告 P0593R6

已经纳入标准[^2] 的缺陷报告 [P0593R6 Implicit creation of objects for low-level object manipulation](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p0593r6.html) 指出，如下代码 **存在未定义行为**：

[^2]: [P2131R0](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p2131r0.html) 确认了 P0593R6 已经纳入标准。

```cpp

struct X { int a, b; };
X* make_x() {
	X* p = (X*)malloc(sizeof(struct X));
	p->a = 1; // #1
	p->b = 2;
	return p;
}

```

未定义行为发生在对 `p->a` 和 `p->b` 的赋值上，`malloc` 仅仅申请了一块内存空间，并没有在该内存空间上构造对象，所以不存在对象 `*p`，也就不能执行 `p->a` 和 `p->b`。

改写的方法是使用布置 new [^1]：

[^1]: 布置 new 的使用参见之前的文章 [C++ new 和 delete](/blog/2021/08/23/new-and-delete/)。

```cpp

#include <new>
struct X { int a, b; };
X* make_x() {
	X* p = new(malloc(sizeof(struct X)))X;
	p->a = 1;
	p->b = 2;
	return p;
}

```

换句话说，C++ 中只有使用了 `new` 表达式，才做到了在内存中构造对象。

> An *object* is created by a definition, by a *new-expression*, when implicitly changing the active member of a union, or when a temporary object is created.

P0593R6 中还指出了如下问题：

```cpp

void process(Stream* stream) {
    unique_ptr<char[]> buffer = stream->read();
    if (buffer[0] == FOO)
        process_foo(reinterpret_cast<Foo*>(buffer.get())); // #1
    else
        process_bar(reinterpret_cast<Bar*>(buffer.get())); // #2
}

```

许多程序试图访问一段来自网络或者文件的比特流，虽然你确定 #1 处的强制转换是合法的，但是这不代表它满足 C++ 对 **对象** 和解引用的要求。

解决方法是使用 C++17 的 `std::byte` 或者使用 `unsigned char` 作为中间类型，并且使得解引用指针的行为作用在一个真正被构造出来的对象上。

并且值得注意的是，对于一个非指向数组中元素的指针来说，自增和自减操作都是未定义行为。

上面这些行为的本质在于，你需要先有一个 `T` 的对象 `t`，才能够使用 `T` 的指针 `p` 去访问这个对象，直接通过强制转换访问未创建的对象是未定义行为。

P0593R6 提出，纯粹的内存数据没有明确的生命周期，对于 C++ 来说，对象必须先创建才能访问，所以使用强制转换去访问比特流是未定义行为。

还有如下的例子：

```cpp

#include <new>

struct X {
	const int n;
};

int main() {
	X p{ 7 };
	new(&p) X{ 8 }; // placement new 的返回值不应该忽略
	int b = p.n; //未定义行为，b 的值是不确定的
}

```

上述代码出现 ub 的原因是没有通过 `new` 的返回值来初始化 b，这将导致编译器做出错误优化：编译器认为 `X::n` 是 `const`，并且 `p` 是一个栈上对象，所以 `p.n` 是一个常量，所以 `int b = p.n` 可以被移动到它的上一句的前面。

正因为这个问题，所以 `new` 的返回值从来都不应该被忽略。

C++17 引入了一个新的设施 `std::launder` 来修正潜在的依赖顺序：

```cpp

#include <new>

struct X {
	const int n;
};

int main() {
	X p{ 7 };
	new(&p) X{ 8 };
	int b = std::launder(&p)->n; // 标准定义行为，b 的值是 8
	int c = p.n; // 未定义行为，b 的值是不确定的
	auto new_ptr = std::launder(&p);
	int d = new_ptr->n; // 标准定义行为，std::launder 的返回值可以重复使用
}

```

注意 `int c = p.n` 仍然是未定义行为，因为依赖修正仅存在于依赖于 `std::launder` 的语句，而 `int c = p.n` 并没有依赖 `std::launder`。

#### 修正

P0593R6 进行了一种修正：将某些内存操作认定为隐式创造对象：

+ 创建一个 `char`、`unsigned char` 或 `std::byte` 的数组
+ 调用 `malloc`、`calloc`、`realloc` 或任何名为 `operator new` 或 `operator new[]` 的函数
+ `std::allocator<T>::allocate(n)` 隐式地在其返回的存储空间中创建了一个 `T[n]` 对象；`allocator` 的要求使得其他分配器的实现也必须如此
+ 使用 `memcpy`，`memmove`，`std::bitcast`
+ 非标准内存分配器，如 `mmap` 或者 `VirtualAlloc`

此修正并不改变 `reinterpret_cast`，即强制类型转换不认为存在隐式创建。

此修正使得 C++ 中可以合法的直接使用 `malloc`，而不需要 placement new 来创造一个对象。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://eel.is/c++draft/ptr.launder">
Pointer optimization barrier
</a>
<a href="https://zh.cppreference.com/w/cpp/utility/launder">
std::launcher
</a>
<a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p0593r6.html">
P0593R6 Implicit creation of objects for low-level object manipulation
</a>
<a href="https://www.zhihu.com/question/454829347">
C++ 中从 char* 转换到其它类型的指针是否违反严格别名规则？
</a>
<a href="https://zhuanlan.zhihu.com/p/38281022">
在 C++ 中正确地转换类型
</a>
</div>
<div class="ref-label">注：</div>
