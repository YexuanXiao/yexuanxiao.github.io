---
title: C++ 可比较性和三路比较
date: "2022-04-22 16:07:00"
tags: [C++]
category: blog
---
三路比较 (Three-Way Comparison) 运算是 C++20 新增的一种支持重载的比较运算，旨在解决以往 C++ 需要写过多的比较运算符重载和多次比较效率问题，三路比较运算符又被称为宇宙飞船运算符。三路比较运算并不返回布尔值，而是返回包装枚举的三类对象：`std::strong_ordering`，`std::weak_ordering` 和 `std::partial_ordering`。三路比较使得有序容器的元素插入最坏情况只需要一次三路比较和两次值判断，使得插入字符串这种线性时间比较类的算法的时间复杂度从 Θ(2n) 降低到了 Θ(n)，和以往相比简化了一次比较过程从而提高了效率。

<!-- more -->

### C++20 之前

C++20 之前，一共支持 6 种比较运算符重载：

```cpp

bool operator<(L, R);
bool operator>(L, R);
bool operator<=(L, R);
bool operator>=(L, R);
bool operator==(L, R);
bool operator!=(L, R);

```

同时，也支持 6 种作为成员函数的比较运算符重载。

由于重载范围过于庞大，在实践中一般遵循如下约定：

1. 相同类型比较使用成员函数
2. 不同类型比较使用非成员函数
3. 优先实现 `>`，`<`，`==` 的重载
4. 如无必要，使用 `>`，`<`，`==` 实现另外三种重载

上述约定能提高代码清晰度，但是正确实现这些重载仍然是一个复杂的工程。

C++20 添加了三路比较运算符的重载，此后只需要实现两个重载函即可：

```cpp

bool operator==(L, R);
bool operator<=>(L, R);

```

三路比较运算符可以生成四种偏序/全序比较运算符的重载，等于运算符可以生成不等于运算符的重载。

等于运算符有些情况下可以通过特殊的优化使得不等路径可以更快速，例如优先比较 `size`。

### 有序概念

任何一个有序集合的创建，都需要对元素进行比较，为了达到全序的目的，大部分算法遵从此规则：如果 `a < b` 和 `a > b` 都不成立，则 `a == b` 成立。

```cpp

void insert(const Comparable &x, Container &v){

    if(t = nullptr){
        /* 空 */
    } else if (x < v.element) {
        /* 小于 */
    } else if (x > v.element) {
        /* 等于 */
    } else
    {
        /* 相等 */
    };
}

```

可以看出，`a == b` 全等于 `!(a > b) && !(a < b)`

大部分 STL 有序容器都遵循此规则，这种基本的比较方案非常自然，但是也存在着问题：

1. 必须实现 `<` 和 `>` 运算符的重载
2. 必须保证重载的正确实现，否则集合的有序性将被破坏

基于以上原因，C++ 提出了比较性和有序性的一些概念：

+ 等价（equivalent）：若 `f(a)` 和 `f(b)` 存在相同副作用，则对于 `f`，`a` 等价于 `b`。
+ 相等（equal）：`a` 全等于 `b`，相等是等价的特殊情况。

+ 强有序（strong ordering）：对于整数类型来说天生就是强有序，强有序要求定义大于，小于和等价。
+ 弱有序（weak ordering）：根据值的一部分来确定顺序，要求定义大于，小于和等价。
+ 部分有序（partial ordering）：部分值有序，例如浮点数有坏值（NaN），坏值不可比较。要求定义大于，小于，等价和不可比。

+ 强等（strong equality）：只有相等和非相等，例如和空指针进行比较。
+ 弱等（weak equality）：只有等价和不等价，例如 `unordered_map` 中的元素之间都是不等价关系。

其中约束性强的概念可以转化为约束性较弱的概念。

数值表示：

| Category         | -1   | 0          | +1            | Non-numeric values |
| -                | -    | -          | -             | -                  |
| strong_ordering  | less | equal      | greater       |                    |
| weak_ordering    | less | equivalent | greater       |                    |
| partial_ordering | less | equivalent | greater       | unordered          |
| strong_equality  |      | equal      | nonequal      |                    |
| weak_equality    |      | equivalent | nonequivalent |                    |

强有序必须比较所有成员/元素。大部分 STL 有序容器要求为弱有序。`std::string` 的备选有序类型为弱有序。

### 实践

在 C++20 之前比较运算符的重载不能声明为 `default`，但是 C++20 放开了此限制，任意比较运算符的重载都可以声明为 `default`，编译器会生成强有序（如成员有 `double` 则应为部分有序）的比较运算的重载。

在定义 `operator==` 后，编译器可以自动生成 `operator!=`，在定义 `operator<=>` 后，编译器可以自动生成其他 4 种比较运算。

此外，对于非成员的 `operator<=>`，编译器会生成相反参数顺序的重载，相比之前减少了冗余。

C++20 根据有序概念设计了 3 种对象：

+ `std::strong_ordering`
+ `std::weak_ordering`
+ `std::partial_ordering`

其中 `std::strong_ordering` 和 `std::weak_ordering` 提供了用户定义类型转换运算符的重载，所以可以向下转换。

以往的比较函数返回布尔值，而三路比较运算符返回枚举，三种 ordering 对象就是对枚举的包装，枚举的值就是上面的数值表示。

三路比较满足如下规律：

+ `(a <=> b == 0) == bool(a == b)` is true
+ `(a <=> b != 0) == bool(a != b)` is true
+ `((a <=> b) <=> 0)` and `(0 <=> (b <=> a))` are equal
+ `(a <=> b < 0) == bool(a < b)` is true
+ `(a <=> b > 0) == bool(a > b)` is true
+ `(a <=> b <= 0) == bool(a <= b)` is true
+ `(a <=> b >= 0) == bool(a >= b)` is true

一个正确实现的三路比较必须满足以上规律，标准库提供了 `three_way_comparable` 这个概念用于验证此规律，该 concept 在 \<compare\> 中定义。

以下是使用三路比较运算符的简单实践：

```cpp

#include <compare>
#include <cassert>
#include <cmath>

struct Point2D {
	int x{ 0 };
	int y{ 0 };
};

struct Point3D {
	int x{ 0 };
	int y{ 0 };
	int z{ 0 };
	constexpr std::strong_ordering operator<=>(const Point3D&) const = default;
	constexpr bool operator==(const Point3D&) const = default;
};

inline constexpr std::strong_ordering operator<=>(const Point3D& a, const Point2D b) {
	if (auto res = a.x <=> b.x; res != std::strong_ordering::equal)
	    return res;
	return a.y <=> b.y;
}

struct ComparableClass {
	int x{ 0 };
	constexpr std::strong_ordering operator<=>(const ComparableClass& a) const
	{ // 为了给某些未能直接实现三路比较运算的类提供三路比较，必须通过大于和小于的重载实现三路比较
	  // 此时需要手动返回less，greater和equal，而不能依赖于编译器
		if (this->x < a.x) return std::strong_ordering::less;
		if (this->x > a.x) return std::strong_ordering::greater;
		return std::strong_ordering::equal;
		// 该函数是使用大于和小于实现三路比较的正确实现
		// 若a<b为true，则a<=>b返回less，而不是greater
	}
};

void testPoint3D()
{
	Point3D a{ 1,2,3 };
	Point3D b{ 1,2,4 };
	// 测试生成的3种重载
	assert(a != b);
	assert(a < b);
	assert(a <= b);
}

void testPoint3Dx2D()
{
	Point3D a{ 1,2,3 };
	Point2D b{ 1,3 };
	// 测试生成的相反参数顺序的重载
	assert(a < b);
	assert(b > a);
}

void testConvert()
{
	// strong可转换为weak，weak可转换为partial，且具有传递性
	std::strong_ordering res = 12 <=> 20;
	std::weak_ordering weak = res;
	std::partial_ordering part = weak;
}

void testValue()
{
	// 测试数值表示
	assert(std::strong_ordering::less == static_cast<std::strong_ordering>(-1));
	assert(std::strong_ordering::equal == static_cast<std::strong_ordering>(0));
	assert(std::strong_ordering::greater == static_cast<std::strong_ordering>(1));
	assert(std::strong_ordering::equal == std::strong_ordering::equivalent);
	assert(std::weak_ordering::equivalent == std::strong_ordering::equivalent);
	// std::partial_ordering::unordered 的值由实现定义
	double a = NAN; // NAN 宏在<cmath>中定义，double的比较是partial，和NAN比较返回unordered
	double b = 0.0;
	assert(std::partial_ordering::unordered == a <=> b);
}

void testUserDefined()
{
	ComparableClass a{ 1 };
	auto res = ComparableClass{} <=> a;
	// 测试<=>重载生成的其他重载的规则，若x<y，则x<=>y返回less
	assert(res == std::strong_ordering::less);
}

void CompareExample()
{ // 此用例为有序容器的插入函数的比较部分的参考
	ComparableClass a{ 0 }, b{ 1 };
    // 注意ComparableClass的比较是强有序，但是有序容器一般只需要弱有序
	auto res = a <=> b;
	if (res == std::weak_ordering::less) {
		// insert or other operation
	}
	if (res == std::weak_ordering::greater) {
		/* */
	}
	else { // equivalent
		/* */
	}
	assert(res == std::weak_ordering::less);
    // 以往这种插入操作需要进行三次比较函数的调用，但是使用三路比较只需要一次
}

int main() {
	testPoint3D();
	testPoint3Dx2D();
	testConvert();
	testValue();
	testUserDefined();
	CompareExample();
}

```

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/header/compare">
&lt;compare&gt;
</a>
<a href="https://zh.cppreference.com/w/cpp/utility/compare/strong_ordering">
std::strong_ordering
</a>
<a href="http://open-std.org/JTC1/SC22/WG21/docs/papers/2017/p0515r0.pdf">
P0515R0 Consistent comparison
</a>
</div>
