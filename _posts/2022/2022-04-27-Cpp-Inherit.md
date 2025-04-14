---
title: C++ protected 和 private 继承
date: "2022-04-27 14:00:00"
tags: [C++]
category: blog
---
C++ 的访问权限控制除了用在成员上，也可以用在继承上，但是 `protected` 和 `private` 继承似乎很少被用到，但并不是说  `protected` 和 `private` 继承就没有用。

<!-- more -->

之前的文章 [C++ 异常 - 容器和 `std::vector`](/blog/2022/04/07/Cpp-Exception-Container-and-std-vector/) 提到过 `vector` 的设计：`vector` 为了保证异常安全，内存分配过程是交给 `vector_base` 这个基类来负责的，`vector_base` 持有 `vector` 的全部成员，`vector` 本身只负责元素的分配。其中，`vector_base` 有一个成员 `allocator`，该成员默认为 `std::allocator`，`std::allocator` 是个无状态的分配器。

而 C++ 规定一个对象必须有一个唯一的地址，换句话说虽然 `std::allocator` 虽然没有任何数据成员，但是仍然要占用至少一个字节的内存，虽然一个字节的开销看似不大，但是如果考虑内存对齐，则将导致需要占用 4 字节或者 8 字节。标准库中类似的容器数不胜数，在一个大型程序中可能存在成百上千个没任何意义的占用，此时开销将十分可观。

为了解决这个问题，STL 的库设计者通常使用这种设计：将 `allocator` 设计为 `vector_base` 的基类。此时若 `allocator` 为无数据成员的 `std::allocator`，同时由于 **无数据成员的基类可和派生类重叠**，导致 `std::allocator` 的空间可以被优化掉，这种设计叫做空基类优化。

但是，这又带来了另一个问题：继承具有多态性。若 `vector_base` 继承 `allocator` 的方式为 **`public`**，就代表着 **`vector_base` 也是一个 `allocator`**！如果一个函数的参数是 `allocator` 的引用，那么 `vector_base` 就可以做这个函数的参数，这 **完全是不合理的**。

此时，可以将 `public` 继承改为 `protected` 继承，此时若将 `vector_base` 传递给如上所述的函数，就会得到一个错误：`vector_base` 的基类不可访问，阻止了这种情况的发生。

从继承的访问权限设计本身来说，`public` 表示了一种 is-a 的关系，如果该关系不是 is-a，那么就不适用于 `public`。

虽然 `vector_base` 继承 `allocator` 是为了空基类优化，但是这种关系不止用于空基类优化：如果想通过继承几个基类实现一组复合功能，那么使用 `public` 继承有可能会导致二义性，此时就需要隐藏基类，复合类对基类进行二次包装。或者派生类本身就想对基类功能进行屏蔽，此时也不能使用 `public` 继承。换句话说，`protected` 和 `private` 继承， **表面是继承，实际是组合**。

C++20 添加了 `[[no_unique_address]]` 属性，用于指示数据成员可以被覆盖，可以直接做到空基类优化的效果。

`[[no_unique_address]]` 使此成员子对象潜在重叠，即允许此成员与其类的其他非静态数据成员或基类子对象重叠。这表示若该成员拥有空类型（例如无状态分配器），则编译器可将它优化为不占空间，正如同假如它是空基类一样。若该成员非空，则其中的任何尾随填充空间亦可复用于存储其他数据成员。

多继承或是单一继承后又在头部声明空基类的成员，则适用 `[[no_unique_address]]` 而不适用空基类优化。

类似的问题还发生在 `std::tuple` 的实现上：`std::tuple` 是使用递归式的继承实现的，每次继承添加一个数据成员。这代表着 `std::tuple` 如果使用 `public` 继承，同样具有多态性，这导致函数调用过程中可能存在潜在的元组类型转换：一个 `tuple<int, float, char>` 的对象能够被传递给参数为 `tuple<float, char>` 的引用/指针的函数，这是非常危险的。

同样还是因为多态：若一个基类和一个派生类都实现了移动构造，且派生类 `public` 继承自基类，那么 **就可以使用基类的移动构造去移动一个派生类**，这将导致派生类的不变性被破坏。在派生类和基类同时非平凡析构的条件下，会造成错误的析构！

`using` 声明可以将基类成员引入到派生类的定义中，例如将基类的受保护成员暴露为派生类的公开成员。此时 嵌套名说明符 必须指名所定义的类的某个基类。如果这个名字是该基类的某个重载的成员函数的名字，那么具有该名字的所有基类成员函数均被引入。如果派生类已包含具有相同名字、形参列表和限定的成员，那么派生类成员隐藏或覆盖从基类引入的成员（不与之冲突）。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://www.zhihu.com/question/425852397/answer/1528656579">
IceBear 的回答 - 知乎
</a>
<a href="https://www.zhihu.com/question/425852397/answer/1529160286">
暮无井见铃的回答 - 知乎
</a>
<a href="https://www.zhihu.com/question/425852397/answer/1529214411">
匿名用户的回答 - 知乎
</a>
<a href="https://www.zhihu.com/question/425852397/answer/2446242643">
Cherrise 的回答 - 知乎
</a>
<a href="https://zh.cppreference.com/w/cpp/language/attributes/no_unique_address">
C++ 属性： no_unique_address
</a>
<a href="https://zh.cppreference.com/w/cpp/language/using_declaration">
using 声明
</a>
</div>
