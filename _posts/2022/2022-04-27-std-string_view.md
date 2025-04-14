---
title: std::string_view
date: "2022-04-28 00:36:00"
tags: [C++]
category: blog
---
C++17 对标准库补充了一些非常使用的容器（C++20 起 std::string_view 就不能叫容器了，因为其不持有对象，准确的叫法是视图），`std::string_view` 就是其中之一，`std::string_view` 是个只读的字符串视图，解决了传统 C 字符串的孱弱和减少了额外的 `std::string` 构造。

<!-- more -->

C++17 之前，如果一个函数需要一个常量字符串，参数通常有两个选择：`const char*` 或者 `const std::string&`。前者存在的问题是无法知道长度，后者存在的问题是如果实际传入了字面值，那么还是有潜在的对象构造。

C++17 引入了 `std::string_view` 用于表示字符串常量，彻底取代了传统的字符串字面值，减少了无用的内存分配。`std::string_view` 实际上是 `std::basic_string_view` 的 `char` 特化。

`std::basic_string_view` 用于任何只需要观测，而不需要修改的情况，同时，为了最大化提高性能，`std::basic_string_view` 持有的字符串不一定以 0 结尾。典型情况为持有已有字符串中的某一段，这意味着 `std::basic_string_view` 能从 C 风格接口中构造，但是不能被传递给一个 C 风格接口。

`std::basic_string_view` 的数据成员只有两个：字符串指针和字符串长度，没有 `allocator`，也没有 `capacity`，这代表着 `std::basic_string_view` 从不主动进行内存分配。同时，这种极简的设计有一个重要的好处：`std::basic_string_view` 可以指向一个实际存在的字符串的任意一个部分：`std::basic_string_view::substr` 是线性时间复杂度。传统的子串查找返回迭代器或者返回一个新对象，而使用迭代器进行处理会变的十分复杂，返回新对象可能会造成潜在的内存分配。

经典的 `std::basic_string_view` 有四个构造函数和一个赋值运算符重载：

```cpp

std::basic_string_view() noexcept;
std::basic_string_view(const basic_string_view& other) noexcept = default;
std::basic_string_view(const char_type* s);
std::basic_string_view(const char_type* s, size_type count);
std::basic_string_view& operator=( const basic_string_view& view ) noexcept = default;

```

其中默认构造是为了与容器兼容，第二个是从现有 `std::basic_string_view` 构造，第三个构造是 O(n) 时间复杂度的 C 风格字符串构造，第四个构造是 O(1) 时间复杂度的 C 风格字符串构造，其中第二个参数是手动指定的长度。

在使用字符串字面量构造 `std::basic_string_view` 时，编译器会选择第四个构造函数，在编译期得出字符串长度。

实际上 `std::basic_string_view` 还可以从 `std::basic_string` 构造，因为 `std::basic_string` 实现了到 `std::basic_string_view` 的类型转换运算的重载。

由于 `std::basic_string_view` 不实际持有对象，即 `std::basic_string_view` 不管理对象的生命周期，所以需要注意悬垂引用问题：不能从一个将亡的 `std::basic_string` 构造一个 `std::basic_string_view`。`std::basic_string_view` 没有实现移动，因为 `std::basic_string_view` 的复制就是天生的移动。

`std::basic_string_view` 支持随机访问容器的大部分操作，但是是只读的。同时还支持如下操作：

+ `remove_prefix` 以后移起点收缩视图
+ `remove_suffix` 以前移终点收缩视图
+ `swap` 交换内容
+ `copy` 复制字符
+ `substr` 返回子串
+ `compare` 比较二个视图
+ `starts_with` 检查 `string_view` 是否始于给定前缀 (C++20)
+ `ends_with` 检查 `string_view` 是否终于给定后缀 (C++20)
+ `contains` 检查字符串视图是否含有给定的子串或字符 (C++23)
+ `find` 在视图中查找字符
+ `rfind` 寻找子串的最后一次出现
+ `find_first_of` 查找字符的首次出现
+ `find_last_of` 查找字符的最后一次出现
+ `find_first_not_of` 查找字符的首次不出现
+ `find_last_not_of` 查找字符的最后一次不出现

`std::basic_string_view` 典型的用于如下场景：

1. 持有一个字符串字面量
2. 用作常量字符串的视图
3. 用于字符串查找的结果
4. 用作容器的成员

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/string/basic_string_view">
std::basic_string_view
</a>
<a href="https://zh.cppreference.com/w/cpp/string/basic_string/operator_basic_string_view">
std::basic_string::operator basic_string_view
</a>
</div>
