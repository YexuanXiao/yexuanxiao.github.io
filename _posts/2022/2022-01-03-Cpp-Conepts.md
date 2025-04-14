---
title: C++ Concepts
date: "2022-05-01 18:01:00"
tags: [C++,STL]
category: blog
---

C++20 的一项重大特性就是概念。虽然 C++98 完成后，概念就作为一个语义出现在 C++ 的用户中，但是直到 2019 年，概念才作为一个完善的特性被加入到标准中。由于 C++ 模板的元编程能力是被发现而不是被发明的，所以模板虽然是图灵完备的，但是作为一种编程语言来说缺乏很多特性，导致其使用非常繁琐。Bjarne Stroustrup 在 2003 年写了一篇文章 [Concept checking – A more abstract complement to type checking](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2003/n1510.pdf) 标题就直截了当的阐述了概念的用途：对类型检查的一个更抽象的补充。

<!-- more -->

C++ 模板由于其高性能和泛用性，是 C++ 作为编程语言而长盛不衰的重要原因之一。模板的元编程能力被发现后，产生了一大批使用元编程设计的第一方、第三方代码库。C++ 模板得到了蓬勃发展的同时，模板错误信息的问题就随之暴露出来。

Bjarne Stroustrup 对概念的设计确定了如下的目标（虽然 C++20 的概念和 2003 年的设计有很大差距，但是设计意图是相同的）：

>**抽象**\
>本文讨论了如何表达泛型构造对其参数的要求的问题。在 C++ 模板的上下文中，它提出了基于显式声明的使用模板的“概念检查”的概念。与基于函数签名的传统类型检查相比，此概念更抽象、更灵活且更易于表达。提出的概念不仅提供了模板参数要求的精确规范和良好的编译时错误检测，而且还支持模板重载的等效性，同时保持 C++ 模板对编译时评估和内联的支持。
>本文将使用模板方法与传统函数无关方法进行了比较，以形成通用参数指定：与基于签名的方法不同，使用模板方法不需要程序员的完美预见或协作开发人员之间的完美协议。概念提供了对类型的补充，而不是替代方案。概念比类型更直接地表示抽象需求。概念的优点不仅限于 C++；它们是基础的，将适用于许多为通用编程技术提供基本支持的语言。

### `requires` 关键词

通过组合 `requires` 子句和 `requires` 表达式可以将原本冗长的错误信息进行分级，有助于摘取错误信息。

#### `requires` 子句

`requires` 子句指定对各模板实参，或对函数声明的约束。`requires` 子句 **后面是一个常量表达式**，该表达式必须是一个编译期谓词，同时允许进行合取，析取。

```cpp

template<typename T>
void f(int) requires true; // 可以作为函数声明符的末尾元素出现
 
template<typename T> requires true // 或者在模板形参列表的右边
T add(T a, T b) { return a + b; }

template<typename T>
void f1(int) requires // 要求T不仅能够转换成int，还能转换为double
    std::convertible_to<T, int> && std::convertible_to<T, double>;

```

#### `requires` 表达式

`requires` 表达式用于解决以往依赖于模板元编程方式的类型检查的错误信息不友好问题。

`requires` 表达式是一个编译期谓词，基本构成如下：`requires ( 形参列表(可选) ) { 要求序列 }`。

C++ 一般使用静态断言来测试一个表达式是否合法，静态断言的参数是一个编译期谓词，如果参数为 `true`，则什么也不做，如果参数为 `false`，则报告编译错误。编译期谓词是一个常量表达式，该表达式的结果只能是 `bool`：`true` 或者 `false`。

若 `requires` 表达式的要求序列中存在编译期推断错误，则表达式返回 `false`：

```cpp

static_assert( requires(int a,int b){ a+b; } );

```

该表达式将检测 `int` 类型的 `a`，`b` 是否可加，显然 `a`，`b` 可加，则该 `requires` 表达式返回 `true`，静态断言也随之成立。

在要求序列中，值为 `false` 的表达式也正确：

```cpp

static_assert( requires{ false; } );  //断言仍正确

```

这是由于要求序列是编译期检查的包装，在要求序列中 `false` 只是一个表达式，而不是错误。

有时候我们需要对是否抛出异常进行判定，由于异常是一个属性，不是一个值，因而无法判断，`requires` 表达式为此设计了一个额外的语法：

```cpp

static_assert(requires{ {new int} noexcept; });

```

`requires` 表达式还可以对返回值进行判断，只需要使用和尾缀返回类型相似的语法：

```cpp

static_assert(requires (int a, int b) {
    { a == b } -> std::same_as<bool>; // compare Ts with ==
    { a != b } -> std::same_as<bool>; // compare Ts with !=
});

```

要求序列中的 `{ a == b }` 要求 `int` 必须可以使用 == 进行比较，而 `{ a == b } -> std::same_as<bool>;` 指出，`int` 不仅可以使用 `==` 进行比较，比较结果的类型还需要是 `bool`。

`requires` 表达式还可以对类型成员进行判断：

```cpp

static_assert( requires (T t) {
    typename T::type;
    {*i} -> std::convertible_to<const typename T::type&>;
});

```

`requires` 子句也可以和 `requires` 表达式结合在一起用，第一个 `requires` 是 `requires` 子句的指示，第二个 `requires` 是 `requires` 表达式的指示。

```cpp

template<typename T> 
requires requires(T a){ ++a; }
T fetch_add(T a) { 
    return ++a;
}

int main(){
    fecth_add(false); // 由于布尔值不能自增，所以requires失败
}

```

但是 `requires` 仅仅将错误信息进行了层次化，并没有解决错误信息本身难以读懂的问题，由此 `concept` 被引入：

由于 `requires` 是没有名字的表达式，如同传统的元编程，所以 `requires` 也不能给出具名的错误原因。而 `concept` 就是为 `requires` 命名而使用：

### `concept`

一个 `concept` 是一个模板，由如下内容组成：`template < template-parameter-list > concept concept-name = constraint-expression`

约束表达式中可以进行合取和析取操作，两个约束的合取只有在两个约束都被满足时才会得到满足。合取从左到右短路求值。如果一个约束得到满足，那么两个约束的析取得到满足。析取从左到右短路求值。

```cpp

template<typename T>
concept Requirement_A =
    ( sizeof(T)>=4 ) &&        // T的尺寸不小于4
    requires(T a){ ++a; }      // T支持自++。
;

```

该代码表达了这样的意图：对类型参数 `T`，`Requirement_A` 需要 `T` 的大小满足大于等于 `4` 且 `T` 能够被增加。如果 `T` 不满足这个要求，将得到 `T` 不满足 `Requirement_A` 这个 `concept` 的错误。

是什么造就了一个好的概念？理想情况下，一个概念代表某个领域的基本概念，因此得名“概念”。一个概念有语义，不仅仅是一组不相关的操作和类型。如果不知道操作的含义以及它们之间的相互关系，就无法编写适用于所有适当类型的通用代码。

`std::string` 支持 `operator+`，这代表着我们可以将两个字符串连接到一起，但是 `std::string` 却不可减。如果我们设计一个数学上的概念用来阻止某些非数学类型，那么这个概念就不应该仅仅考虑是否可加，还应当考虑是否可减，或者是可乘。

由于 `concept` 也是一个编译期谓词，所以 `concept` 也可以配合静态断言使用：

```cpp

static_assert(UICompatible<Draw>);

```

概念在类型约束中接受的实参要比它的形参列表要求的要少一个，因为按语境推导出的类型会隐式地用作第一个实参：

```cpp

template<class T, class U>
concept Derived = std::is_base_of<U, T>::value;
 
template<Derived<Base> T>
void f(T); // T 被 Derived<T, Base> 约束

```

#### 模板化函数

如果函数声明使用了任意 `concept`，它将自动成为函数模板。因此，编写函数模板与编写函数一样简单。

```cpp

std::integral auto f(std::integral auto a, std::integral auto b);

```

概念和 `auto` 共同组成了一个模板约束，并且在 C++20 中，`auto` 本身就代表最小限制的约束（除 `void`），意味着以下的代码在 C++20 中也成立：

```cpp

auto gcd3(auto a, auto b);

```

当模板的参数需要是一个序列时，我们可以说：

```cpp

template<typename Seq>
    requires Sequence<Seq>
void algo(Seq& s);

```

其中 `Sequence` 是一个概念。同时，有一种简洁的方法可以避免 `Seq` 冗余的写了两次：

```cpp

template<Sequence Seq>
void algo(Seq& s);

```

我们不会说“一只动物，它需要是鸡”，而是 说 “需要一只鸡”。

`template<C T>` 意味着 `template<typename T> requires C<T>`。

```cpp

auto copy(auto begin, auto end, auto dest)
{

	static_assert(std::input_iterator<decltype(begin)>
		&& std::sentinel_for<decltype(begin), decltype(end)>
		&& std::output_iterator<decltype(dest), typename std::iterator_traits<decltype(begin)>::value_type>);

	if constexpr (std::contiguous_iterator<decltype(begin)>
		&& std::contiguous_iterator<decltype(end)>
		&& std::contiguous_iterator<decltype(dest)>
		&& std::same_as<typename std::iterator_traits<decltype(begin)>::value_type, typename std::iterator_traits<decltype(dest)>::value_type>
		&& std::is_trivially_copyable_v<typename std::iterator_traits<decltype(begin)>::value_type>
		)
	{
		if (end == begin)
			return;

		std::memcpy(std::to_address(dest), std::to_address(begin), end - begin);
	}
	else
	{
		for (; begin != end; (void)++begin, (void)++dest)
			*dest = *begin;
	}

	return dest;
}

```

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://devblogs.microsoft.com/cppblog/abbreviated-function-templates-and-constrained-auto/">
Abbreviated Function Templates and Constrained Auto
</a>
<a href="https://zh.cppreference.com/w/cpp/language/constraints">
约束与概念
</a>
<a href="https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/p0557r0.pdf">
Concepts: The Future of Generic Programming
</a>
<a href="https://blog.csdn.net/audi2/article/details/104551313">
C++20 Concept 语法
</a>
<a href="https://ggulgulia.medium.com/c-20-concepts-part-1-the-basics-40f051c72776">
C++20 Concepts: part 1 (the basics)
</a>
<a href="https://ggulgulia.medium.com/c-20-concepts-part-2-cf18475eb47">
C++20 Concepts: part 2
</a>
<span>Programming language C++ Sixth edition</span>
</div>
