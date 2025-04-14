---
title: C++ 非静态成员函数的引用限定修饰
date: "2022-06-20 09:30:00"
tags: [C++]
category: blog
---
本文是对知乎用户[Mick235711](https://www.zhihu.com/people/mick235711)的回答[C++为什么允许给临时对象赋值？](https://www.zhihu.com/question/533946012/answer/2509921643)的回答的整理。

C++11 开始，非静态成员函数增加了 **引用限定修饰（ref-qualifier）** ，从根本上“理论的”解决了长期存在的一个问题：允许给临时对象赋值。

<!-- more -->

观察如下代码：

```cpp

int main() {
	std::string ("aaa") + std::string ("bbb") = std::string("cccc");
	(std::string("aaa") + std::string("bbb")).capacity();
}

```

虽然可能正常人都不会这么写，但是 C++ 中这是合法的。之前我多次提到过，C++ 为了让用户自定义类型也如同基本类型一样使用，所以允许运算符重载，但是有一点是不一样的：右值的基本类型只有读取操作，而右值的用户自定义类型可以有写入操作。

例如：

```cpp

int foo(int x)
{
    return x;
}

int main() {
    6 = 5;      // 错误
    foo(6) = 5; // 错误
}

```

但是，正如上面所展示的 `std::string` 一样，一个用户自定义类型的右值却是可以被赋值的，造成这种情况的原因可以从 **赋值运算符的声明** 中看出来：`string& operator=(const string& rhs)`。观察会发现，该赋值运算符的重载 **只约束了参数和返回值，没约束 `*this`**，这就导致 `*this` 无论是一个左值，还是一个右值，都可以被赋值。

实际上成员函数之所以是成员函数，是因为默认有一个对象，这个对象就是 `*this`。实际上成员函数在实现上，就是对函数参数列表添加了一个 `this` 参数。例如上面的赋值运算符的声明“实际上是” `string& operator=(string* this, const string& rhs)`。由于 `this` 是一个指针，这就导致无法区分 `*this` 到底是左值，还是右值。理想情况下，`*this` 应该被限定为左值，这样就能避免对一个右值进行赋值。

但是很遗憾，C++ 使用 `this` 比发明引用早，所以 `this` 是一个指针而不是一个引用，在标准化的过程中因此就掩盖了这个问题（如果 `this` 是一个引用，那么这个问题就可以被很早的发现：`string& operator=(string& this, const string& rhs)`）。

由于以上原因，在非静态成员函数中进行 `decltype(*this)` 的结果是 `T&`，但实际上 `*this` 本身有可能是个右值。。。。。

在右值上进行操作不一定都是非法的，有时候确实有这种需求。

C++11 开始，引入了一种新的语法，引用限定：

```cpp

struct S
{
    void member();
    void lvalue()&;
    void rvalue()&&;
};
int main()
{
    S s;
    s.member();   // okay
    S{}.member(); // okay
    s.lvalue();   // okay
    S{}.lvalue(); // error
    s.rvalue();   // error
    S{}.rvalue(); // okay
}

```

至此，C++ 终于能对 `*this` 进行约束。所有的非静态成员函数都可以有 **引用限定修饰**，包括 `operator=`，`operator+`，`operator-` 等等。

由于该特性来的太晚了，以至于很多人都没有理清这个东西，例如很多“C++ 编写风格指南”里推荐使用 **Yoda 大师** 法使得将 == 误写为 = 时编译器能够给出警告，但是实际上这只对内置类型有效，对用户自定义类型无效：`if (a = std::string("aaa"))` 和 `if (std::string("aaa") = a)` 都是合法的，编译器不会给出任何错误。

《Effective C++》建议 `operator*` 返回 `const` 对象，以防止`if (a * b = c)`通过编译，但是现在我们发现 Scott Meyers 找错了对象，这里要改的不是 `operator*`，而是 `operator=`。让 `operator*` 返回 `const` 对象会造很多情况下造成性能损失（返回 `const` 对象会导致返回值优化和编译器自动的 `move` 失效，他自己在这本书的勘误列表里也承认了这个问题）。

标准委员会 WG21 并不是没有做过纠正的努力：在 C++11 周期中，提案 N2819 曾经大胆地提出，为当时已经在标准库中的超过 200 个类的复制赋值函数同时添加 ref-qualifier，毕竟虽然 `S{} = S{}` 的例子显得有些做作，但是将 if 的条件中的 == 写成 = 却是经常会发生的事情。

遗憾的是，为己有类型添加 **引用限定修饰**是一个很大的 breaking change（破坏性修改） —— 没准总是有那么一些人依赖于 `std::string{} = "Happy?"` 这种东西的合法性。最终，LWG 在 2009 年拒绝了这一提案，而为了保持一致，甚至以后加入的新类型也没有使用 **引用限定修饰**。

**但是 STL 怎么做是 STL 的事，为了防止对右值进行赋值，我们还是需要 _引用限定修饰_**。

**对复制/移动构造运算符添加 _引用限定修饰_** 是我推荐的的写法，同时也是 C++ 标准承认的可行写法之一。或者更进一步，我个人认为所有复合赋值操作符，`++/--` 之类的自我修改运算符都应该限制左操作对象只能是左值。比如 `operator+=` 也应该加 `&`，毕竟 `S{} += S{}` 一样显得很怪异。

WG21 的保守很快就让自己付出了代价。。。

2017 年初，range-v3 issue #573 中的一段代码引起了注意：

```cpp

struct C
{
    explicit C(std::string a) : bar(a) {}

    std::string bar;
};

int main()
{
    std::vector<C> cs = { C("z"), C("d"), C("b"), C("c") };

    ranges::sort(cs | ranges::view::transform([](const C& x) {return x.bar;}));

    for (const auto& c : cs) {
        std::cout << c.bar << std::endl;
    }
}

```

注意，这里 `views::transform` 的参数 `lambda` 的返回值类型是什么？

默认来说，`lambda` 不指定返回值就会使用 `auto` 类型推断——那么也就是返回 `std::string`。因此，`cs | views::transform(...)` 的结果是一个元素类型（`range_reference_t`）为 `std::string` 的 Range。不是 `std::string&` 哦！prvalue `std::string` 组成的 Range！

既然是 `prvalue`，那么只不过相当于是临时生成的右值，必然不可能真正排序—— `ranges::sort` 只不过是把返回的复制出来的 `std::string` 排序了一遍，`vector` 中的原始对象完全没动，上面的例子输出的还是 z d b c。

。。。

等会

Ranges（STL2）的最大优点不就是用 Concept 限定了 STL 算法，使得它们不会被不当调用嘛？`ranges::sort` 在这种情况下怎么能调用成功呢？？？（包括 `ranges::fill(<a-prvalue-std::string-range>, "Test")` 也是能成功的）。

这实在不怪 Concepts。作为排序算法，最主要的要求之一其实就是元素必须是可交换的，而 Swappable 本身就蕴含了迭代器元素类型得是 Readable 和 Writable 的（毕竟交换核心就是个 `*a = std::move(*b)` 嘛...）这里的重点是 Writable 概念，毕竟正常观念中一个右值作为临时对象，并不应该是能修改的，毕竟所做的修改很快就会丢失。Writable 的原始实现十分简单：

```cpp

template <class Out, class T>
concept bool Writable = requires(Out& o, T&& t) {
    *o = std::forward<T>(t); // not required to be equality preserving
};

```

本质上不过是简单的对 `*o` 进行赋值。然而，`*o` 的类型自然就是元素类型——这种时候就是一个右值 `std::string`，所以上面的 `ranges::sort` 本质上就是在测试 `std::string{} = std::string{}` 能不能合法（将 `move` 过后的右值 `std::string` 赋给元素类型，同样是右值 `std::string`）——而不幸的是，这个十分怪异且无意义的语句居然是合法的。

当时右值 Range 其实并没有收到很多支持，毕竟虽然 C++11 就有了 `std::move_iterator`，没人对右值 Range 有很高的注意力...普遍认为这种 Range 算是个异类与特殊情况，反正用的人少。但是到了 Ranges 的时代，右值 Range 逐渐成为了不可或缺的组成部分，`views::filter`，`views::as_rvalue`，以及 `std::generator`，这些都是非常常用的 Ranges 适配器和组件，然而它们生成的（默认来说）大多都是右值 Range。这时候大家突然发现，如果赋值操作符被普遍 & 标记从而限制右值，那么 Writable 这一简单概念就足够了（右值可以通过赋值修改的一定是代理引用，从而也就不会出问题）。现在，在兼顾代理引用的情况下，Ranges 库不得不自己通过 Concepts 来修补这个疏漏了。

好在，Eric Niebler 最后找到了一个解决方案。虽然他自己也承认是一个 hack，但是 STL2 issue #381 中提出的解决方案算是在语言层面上无法逆转这个错误的前提下最好的方案之一了。简单的来说，虽然 C++ 成员函数默认都是不区分左右值的（从而导致了右值可修改的问题），但是它们至少从最开始就做对了一件事情——常量区分。默认来说，成员函数都是可变的——常量对象并不能调用啥 cv-qualifier 都没有的成员函数。因此，至少绝大多数赋值函数都没有 `const` 修饰（因为这是默认值） ，从而常量对象不能被赋值（当然，这是件大好事）。在左右值通过赋值操作符本身的 ref-qualifier 区分这一手段已经永远失效的情况下，新的解决方案就是使用这一操作符的常量性进行区分：对于右值 Range，只要它的元素类型的常量对象是能赋值的，我们就认为这是一个代理引用类，从而通过；否则就不满足 Writable。因此，新的 Writable 要求变成了这样：

```cpp

template <class Out, class T>
concept bool Writable = requires(Out& o, T&& t) {
    *o = std::forward<T>(t); // not required to be equality preserving
    const_cast<const reference_t<Out>&&>(*o) =
       std::forward<T>(t);   // not required to be equality preserving
};

```

新的这一条 `const_cast` 要求其实就是针对右值 Range 的：根据引用折叠规则，正常的左值 Range 实际上这条 `const_cast` 是没有意义的（注意！这里非常之复杂，在 `T = int&` 的时候，`const T = int& const = int&`，所以 `const T&& = (const T)&& = (int &)&& = int &`，没有 `const` 哦！），从而两个要求是重复的。而对于右值 Range 来说，元素类型不是引用，所以这里的 `const_cast` 实际上加入了常量性， 第二个要求也就是说这个常量对象必须能够赋值。举个例子：

```cpp

int main() {
    int i{2}, j{3};
    const std::tuple<int&> t{i}, t2{j};
    t = t2; // OKAY
}


```

这里可以对常量对象 t 赋值，所以我们就可以知道 `std::tuple<int&>` 是个代理引用，从而让它可以调用 ranges::sort（比如 `ranges::sort(views::zip(vec_of_int))` 就是这样的典型例子）。这里虽然看上去很奇怪（常量对象修改？）但是实际上我们要意识到对于代理引用来说，上面的 `const` 都是 shallow-const，和 `T* const` 的性质差不多，并不实际意味着底层类型的不可变性。

举个最简单的例子：`T* const p`，而 `*p = xxx` 完全没有问题，这就是所谓的“常量赋值”。另外 `T&` 实际上就是 `T& const`，所以 `T&` 也可以看成可以常量赋值的“类”）。

这一条要求最终进入了 STL2，并且被合并进了 C++20 Ranges 库。至今我们仍然能在输出迭代器的基础 Concepts 之一 `std::indirectly_writable` 看到这个 `const_cast` 的身影。当然，这也就意味着标准库对代理引用的要求之一也就是常量赋值（想想 `T* const`，有一个常量 `operator=` 是不是没那么不可思议了？）。这一要求最终在 C++23 标准库中由 `views::zip` 家族的提案 P2321R2 部分实现（为 `std::tuple`，`std::pair` 和 `vector<bool>::reference` 实现了常量赋值操作符） 。

总结：我个人的几点倡议：

对 90% 的类来说，特殊成员中赋值操作符的定义应该带上 `&` 来仅限左值使用，也就是标准形式应该只有下面这些：

```cpp

S& S::operator=(const S& other) & {/* ... */ return *this;}               // 复制赋值（正常）
S& S::operator=(this S& self, const S& other) {/* ... */ return self; }   // 复制赋值（显式对象参数）

S& S::operator=(S&& other) & {/* ... */; return *this ;}                  // 移动赋值（正常）
S& S::operator=(this S& self, S&& other) {/* ... */ return self; }        // 移动赋值（显式对象参数）

// 或者：二合一选择
S& S::operator=(S other) & { swap(other); return *this;}                  // 复制+移动赋值（copy-and-swap）
S& S::operator=(this S& self, S other) { self.swap(other); return self; } // 复制+移动赋值（copy-and-swap，显式对象参数）

```

用上显式对象参数是不是就觉得用 & 修饰很自然了呢？感觉不修饰才不对吧，反正显式对象参数压根不让你表示原来的无 ref-qualifier。

`operator=,` `++,` `--,` `unary &` 这些操作符重载也应该带上 & 修饰（建议重载这个取地址操作符！！！）

我个人有一个更加激进一些的观点：所有非常量成员函数都应该有 ref-qualifier（而其中 90% 以上应该是 `&`）。

对于代理引用（返回一个临时对象），记得实现 const-qualified。
