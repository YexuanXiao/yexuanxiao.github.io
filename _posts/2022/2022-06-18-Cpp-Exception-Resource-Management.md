---
title: C++ 异常 - 资源管理
date: "2022-06-18 11:47:00"
tags: [C++]
category: blog
---
之前的文章文章讲述了 C++ 异常的概念和如何保证基本的异常安全，本文负责讲述如何通过智能指针等技术，设计句柄类，保证无内存泄漏以及强异常安全；如何实现安全，异常安全以及高效的构造，复制，移动这三大成员函数。

<!-- more -->

本文是《C++ 异常》系列第三篇文章。

《C++ 异常》目录：

1. [C++ 异常 - 类和异常](/blog/2022/04/07/Cpp-Exception-Class-and-RAII/)
2. [C++ 异常 - 智能指针](/blog/2022/04/08/Cpp-Exception-Smart-Pointer/)
3. 本文
4. [C++ 异常 - 容器和 std::vector](/blog/2022/04/07/Cpp-Exception-Container-and-std-vector/)
5. [C++ 异常 - 守卫](/blog/2024/07/29/Cpp-Exception-Guards/)

### 值类，句柄类和复合类

#### 值类

观察如下的 `AppleProperty` 类，用于表示苹果的属性：

```cpp

enum class Color
{
	Red = 0, Yellow, Green
};

enum class Mouthfeel {
	Hard = 0, Soft, Crisp
};

struct AppleProperty {
    using price_type = int;
	Color color = Color::Red;
	Mouthfeel mouthfeel = Mouthfeel::Hard;
	price_type price = 0;
};

```

使用枚举来表示苹果的颜色和口感，因为苹果的颜色和口感是有穷可列的（如果有反对意见，请姑且这么认为），同时定义了一个 `price_type` 用来表达价格。虽然这个 `price_type` 看着很多余，且用 `int` 是非常自然的表达价格的一种方式，但是这可以提高可维护性：`int` 能用来表示价格，但并不意味着 `int` 就是价格，使用别名能让人牢记 `price` 的类型是 `price_type`，而不是 `int`，这是 **将类型抽象化**。

由于 `AppleProperty` 的成员都是标量类型，并且没有代表外部资源，那么这个 `AppleProperty` 类就是个 **值类型**：完全 **可以使用编译器生成的构造，赋值，交换和移动**。

同时，由于 `AppleProperty` 的每个成员都是互不相干的：价格和颜色没关系，价格和口感没关系，口感和颜色没关系；这些成员都天然代表着苹果的某一方面的属性，而不是内部的一些看不到的小角落，所以将其设置为 `struct`： **所有成员都是 `public`**，这时候没必要用所谓的 getter 和 setter，多此一举。

#### 句柄类

接下来考虑如下的 `String` 类：

```cpp

class String {
	using char_type = char;
	size_t size;
	size_t capacity;
	char_type* str;
};

```

`String` 类就是一个句柄（handle）类，因为其成员有一个指针，该指针指向某个不属于 `String` 类自身的外部资源（字符串缓冲区）。

在这个 `String` 的定义中，使用了 `class` 而不是 `struct`，这是因为 `String::size`，`String::capacity` 和 `String::str` 直接相关，这三者其中一者的修改往往会导致另一者也必须修改：独立的修改某个成员会导致该字符串被破坏。所以这就需要使用 `private` 而不是 `public`。

那么这个 `String` 类就 **不能使用编译器生成的构造，赋值，交换和移动**。

标准库中有一个实现好了的 `String` 类 `std::string`。

一个实现优良的 `String` 类能像值类一样构造，赋值，交换和移动，换句话说 **一个实现优良的句柄类能像值类一样构造，赋值，交换和移动**：可以使用 `()` 进行构造，使用 `=` 进行赋值，使用 `std::swap` 进行交换，使用 `std::move` 进行移动。 **句柄类使得无论多复杂的对象，都和值一样自然的使用**。

#### 复合类

有了 `String`，就有了补完苹果类的最后一块木板：

```cpp

struct Apple {
	using string_type = std::string;
	AppleProperty prop;
	string_type name;
};

```

现在观察上面的 `AppleProperty` 类和 `String` 类，分别对应值类和句柄类：

1. `AppleProperty` 类的所有成员都是 **`public`**，并且有 **非静态数据成员初始化**
2. `String` 类所有成员都是 `private`，且没有 **非静态数据成员初始化**

为什么这么设计：

1. **值类的默认初始化通常是有意义的**。例如苹果可以默认为红色，3 元一斤的脆苹果，或者一个复数类，默认是 `{0, 0i}`。
2. 值类型中每个成员的属性通常都是独立的，例如一个复数类的实部和虚部都可以独立访问和独立修改，苹果的颜色和价格也是独立的。
3. **句柄类的默认初始化通常是无意义的** 。例如默认初始化一个 `String`，肯定会初始化为空串，此时就没必要为这个 `String` 分配内存，你也可以尝试输出 `std::vector<int>().capacity()`，即默认构造的 `std::vector` 的预分配空间，结果是 `0`。如果存在一个 `File` 类持有某个文件资源，那么这个 `File` 类的默认构造就是不持有任何文件，而不是持有一个新文件，因为连新文件的名字也没有。再比如一个数据库连接类，总不能凭空获得一个数据库连接。
4. 句柄类的每个成员通常是不独立的，例如 `String`。

**C++ 中基本数据类型和自定义数据类型都是一等公民，这使得泛型设计不用关心对象的类型是不是基本的。**

经过分析会得到如下特征：

| 类别          | 是否 `public` | 默认有意义 |
| ------------- | ----------- | -------- |
| `AppleProperty` | Yes         | Yes      |
| `String`        | No          | No       |
| `Apple`         | Yes         | Yes      |

换句话说，只含有句柄类和值类的类，即复合类，其表现也如同值类：**可以使用编译器生成的构造，赋值，交换和移动**。

```cpp

enum class Color
{
	Red = 0, Yellow, Green
};

enum class Mouthfeel {
	Hard = 0, Soft, Crisp
};

struct AppleProperty {
	using price_type = int;
	Color color = Color::Red;
	Mouthfeel feel = Mouthfeel::Hard;
	price_type price = 0;
};

class String {
	using char_type = char;
	size_t size = 0;
	size_t capacity = 0;
	char_type* str = 0;
public:
	String(const String& lhs) {
		std::cout << "String copy" << std::endl;
	}
	String() = default;
};

struct Apple {
	using string_type = String;
	AppleProperty prop;
	string_type name;
};

int main() {
	Apple a;
	Apple b = a; // 控制台会输出 String copy
}

```

### 资源管理

#### 构造，异常安全和智能指针

对于上面值类和句柄类的例子，都是很清晰很自然的情况，但是世界是复杂的，不是每个程序都有良好设计的句柄类。

考虑如下情况：

```cpp

template<class T, class U>
class Mixin {
	T* t = 0;
	U* u = 0;
public:
	Mixin(T&& lhs, U&& rhs) {
		t = new T(lhs);
		u = new U(rhs);
    }
};

```

如果你认真看过之前的文章，那么就很清楚其问题所在：连续的两次 `new` 存在内存泄漏的可能。

但是，如果将构造函数进行改写：

```cpp

template<class T, class U>
Mixin<T,U>::Mixin(T&& lhs, U&& rhs) {
	char* buffer = new char[sizeof(T) + sizeof(U)];
	t = new(buffer) T(lhs);
	u = new(buffer + sizeof(T)) U(rhs);
}

```

虽然将实际的内存分配减小到一次了，但是由于 `U` 和 `T` 的构造过程中本身可能抛异常，若 `T` 已经构造好了，`U` 抛出异常，则还是无法自动析构 `T`（`new` 出来的对象不会被自动析构）。

当然，如果你 100% 确信 `T` 的构造就是不会抛异常，例如 `T` 是一个基本类型（并且不代表某种资源），那你完全就可以放心这么写（比如 `std::make_shared` 就这么干）。

但是，这个例子里仅有 `t`，`u` 两个对象，实际可能存在 `t`，`u`，`d`，`e` 等等多个对象，你很难确保只有最后一个被构造的对象抛异常，或者全都不抛异常。

那么最简单的方法就是让成员不是裸指针，而是 `std::unique_ptr`（或者 `std::shared_ptr`）：

```cpp

template<class T, class U>
class Mixin {
	std::unique_ptr<T> t;
	std::unique_ptr<U> u;
public:
	Mixin(T&& lhs, U&& rhs);
};

template<class T, class U>
Mixin<T,U>::Mixin(T&& lhs, U&& rhs) {
	t = std::make_unique<T>(lhs);
	u = std::make_unique<U>(rhs);
}

```

由于 `std::unique_ptr` 是一个句柄类模板，所以 `std::unique_ptr<T>` 表现为值类，构造的时候和值一样构造，使得 `Mixin` 从句柄类变为了值类，那么整个构造过程就是异常安全的。

实际上会发现，使用 `std::unique_ptr` 的 `Mixin` 完全没有出现一次 `new`，甚至所有成员函数都消除了 `new`。

#### 复制赋值

考虑如下代码：

```cpp

class HandleA {
	int* intptr = 0;
public:
	HandleA() = default;
	HandleA(int lhs) {
		intptr = new int(lhs);
	}
    ~HandleA() {
        delete intptr;
    }
};

int main() {
	HandleA a(1), b(2);
	a = b;                    // #1 复制赋值
}

```

#1 处用到了复制赋值，但由于并不存在自定义的复制赋值，所以编译器会粗暴的执行 `a.intptr = b.intptr`，那么 a 就存在内存泄漏和 double free（对 `b.intptr` 的值 `delete` 两次），程序会因此崩溃。

所以一般有两种方案：

```cpp

HandleA& HandleA::operator=(const HandleA& rhs) {
	delete this->intptr;
	this->intptr = new int(*(rhs.intptr));
}

// 或者

HandleA& HandleA::operator=(const HandleA& rhs) {
	*(this->intptr) = *(rhs.intptr);
}

```

前一种适用于不定长数组的情况，后一种适用于定长数据的情况，总之这是一种简化模型。

第二种看上去很美好对不对？但是这实际上是错的，错的很彻底，因为有一个什么也不干的默认构造函数：

```cpp

int main() {
    Handle a, b(1);
    a = b;
}

```

此时 `a.intptr == 0` 为真，对于 第一种实现而言，由于 `delete 0` 是合法的，所以没问题。但是对第二种情况而言，由于函数根本就没检查 `this->intptr` 是否为 `0`，就粗暴的进行解引用，对 `0` 解引用是 UB（未定义行为），会直接导致程序崩溃。所以如果采用第二种，必须要检查对象是否处于合法状态：

```cpp

HandleA& HandleA::operator=(const HandleA& rhs) {
    if (this->intptr) {
	    *(this->intptr) = *(rhs.intptr);
    } else {
        this->intptr = new int(*(rhs.intptr));
    }
}

```

那么有人就要说了， **为什么不能让默认构造多干点事？先说结论：Handle 类的默认构造就应该什么也不干**。

在上面的内容中，说明了第一点原因：句柄类的默认构造没意义，因为你构造不出默认的文件，默认的数据库连接。在此，给出第二点原因： **和容器兼容**。

由于大部分容器都有 `resize` 函数，而 `resize` 函数在当前 `size` 小于新 `size` 的时候会 **默认构造一系列新对象**，而这些新对象是完全没任何意义的，因为它 **马上就会被有意义的对象所替代**。换句话说，默认构造将导致一系列完全不必要的内存分配。

经过分析会发现，保持高效和默认构造进行内存分配之间存在着逻辑上的冲突， **不可能在默认构造进行内存分配的前提下做出高效的容器**。

如果你想优化掉这次无用的默认构造，那就必须让默认构造本身的开销达到最小，浅显的话就是默认构造不进行内存分配。

当然，默认构造最小化 **还是要将成员简单初始化为 0，使得默认构造的对象处于合法状态**，否则你也无法判断他到底分没分配资源。

有人又要说了，不用 `new` 行不行，用 `malloc`，用 `malloc` 就不会调用默认构造。但这种想法也是幼稚的。之前的文章[严格别名规则和指针安全性](/blog/2022/01/30/Strict-Aliasing-Rules/) 提到过，C++20 之前，如果仅用 `malloc`，而不用 `new`，是未定义行为。因为 `new` 的设计使得 C++ 的内存分配避免了 `alias`，有利于编译器优化，并且 **符合 C++ 的对象模型：一个对象必须有构造过程**。

又有人要说了， **C++20 之后用 malloc 不是也可以了吗？但是按照文章说的编写代码会有额外负担吗？唯一的负担就是需要认真看本篇文章**。

#### 移动构造

其实文章看到这里，才真正看到写文章时最初的目的。直接构造，复制赋值，复制构造，实际上都是非常简单的内容，没有任何难度，而下面所述就相对复杂了，但经过分析还是简单的。

首先考虑移动构造：

```cpp

HandleA::HandleA(HandleA&& rhs) noexcept {
	this->intptr = rhs.intptr;
	rhs.intptr = 0;              // 这里必须清零
}

```

这个想法很简单，把需要舍弃的 `rhs` 的参数复制给当前对象，然后把 `rhs` 置 `0`。

但是有没有想过 `rhs` 的未来是什么？使用代码和展开后的伪代码模拟整个过程：

```cpp

int main() {
    HandleA a(1);
    HandleA b{std::move(a)}; // 进行移动构造，a 就是 rhs
}

```

其展开后的伪代码如下：

1. 创造 a 对象
2. 对 a 调用构造函数
3. 给 a.intptr 分配内存
4. 将 1 赋值给 *a.intptr
5. 构造函数返回
6. 创造 b 对象
7. 对 b 调用移动构造
8. 将 a.intptr 赋值给 b.intptr
9. 将 a.intptr 置 0
10. 移动构造返回
11. 对 b 进行析构
12. 清除 b.intptr 指向的内存
13. 析构函数返回
14. 对 a 进行析构
15. 清除 a.intptr 指向的内存
16. 析构函数返回

注意第 11 和 第 14 条：虽然 a 被移动给 b 了，但是 **仍然是需要对 a 进行析构！！！！**，所以移动构造必须对被移动的对象清零。

换句话说， **移动并不改变原有的析构过程** ，理解这一步是理解移动的关键之一。

清零后 `b.intptr` 为 `0`， **`delete 0` 是合法的操作** ，理解这点是理解移动的关键之二。

实际上我更愿意写这样的移动构造：

```cpp

HandleA::HandleA(HandleA&& rhs) noexcept {
	this->intptr = 0;
	std::swap(this->intptr,rhs.intptr);
}

```

这种写法代表着，先构造一个不持有任何资源的 `a`，然后再交换 `a` 和 `b`。这么写是构造出一个统一的思想，这种思想就是： **移动不是单向的，而是双向的，换句话说移动是交换，不是赋值。**

### 移动赋值

理解了移动构造，再理解移动赋值就非常简单：

```cpp

HandleA& HandleA::operator=(HandleA&& rhs) noexcept {
	std::swap(this->intptr, rhs.intptr);
}

```

**移动赋值居然是交换所有成员！**这就和我上面写到移动构造完成了语义上的统一：移动构造先构造一个空对象，再交换成员；移动赋值直接交换所有成员。

经过分析，会发现使用这种方式，就不存在内存泄漏，并且代码也变得简洁：因为移动赋值涉及到了两个对象，那这两个对象理应析构两次。既然编译器已经自动生成了两次析构，那么利用这一特点，移动操作就完全变成了交换操作。

此时也可以注意到，在移动构造和移动赋值的实现上，不需要任何的 `new` 和 `delete`，这使得移动构造和移动赋值天然就是异常安全的。

### `std::swap`

以下是 `std::swap` 对于左值引用的经典实现：

```cpp

namespace std {
    template<class T>
    void swap(T& lhs, T& rhs){
        T temp = std::move(lhs);
        lhs = std::move(rhs);
        rhs = std::move(temp);
    }
}

```

`std::swap` 通过移动构造和移动赋值实现了两个对象的交换，没有任何一点多余之处！

需要指出的是，移动构造和移动赋值中 **不能使用 `std::swap(*this, rhs)` 实现自身的交换**，这将导致死递归，但是可以使用 `std::swap` 分别交换每个成员。
