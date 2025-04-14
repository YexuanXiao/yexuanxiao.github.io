---
title: 结构化绑定
date: "2022-01-07 23:49:00"
tags: [C++]
category: blog
---

C++17 带来了许多重要语法改进，其中对于广大 C++ 使用者而言最有用的特性便是结构化绑定。结构化绑定是对于一组数据进行分解的表达式，能够极大的简化以往繁琐的成员访问语法。

<!-- more -->

结构化绑定的基本语法：

`属性<sub>可选</sub> cv-auto 引用运算符<sub>可选</sub> [ 标识符列表 ] 表达式`

其中最后的表达式类似于初始化表达式，可选择等号，大括号和小括号的方式。

### 绑定数组元素

```cpp

int a[2] = { 1,2 };
// std::array<int,2> a = { 1,2 };
 
auto [x,y] = a; // 创建 e[2]，复制 a 到 e，然后 x 指代 e[0]，y 指代 e[1]
auto& [xr, yr] = a; // xr 指代 a[0]，yr 指代 a[1]

```

结构化绑定能够直接分解数组，将数组元素暴露出来，同时支持 C 风格数组和 std::array，不过不是很常用。

### 绑定数据成员

```cpp

struct S {
    mutable int x1 : 2;
    volatile double y1;
};
S f();

const auto [x, y] = f(); // x 是标识 2 位位域的 int 左值
                         // y 是 const volatile double 左值

S s;
auto& [x2, y2] = s;

```

结构化绑定支持对返回值的绑定也支持直接对对象进行绑定。

结构化绑定的绑定类似 lambda 的捕获，可以选择值捕获也可以选择引用捕获，只不过引用运算符写在标识符列表的外面，并且要注意避免悬垂引用。

### 绑定 std::tuple 的元素

结构化绑定第一大有用点在于绑定类的数据成员，而第二大有用点就在于绑定 std::tuple 的元素。

```cpp

float x{};
char  y{};
int   z{};
 
std::tuple<float&,char&&,int> tpl(x,std::move(y),z);
const auto& [a,b,c] = tpl;
// a 指名指代 x 的结构化绑定；decltype(a) 为 float&
// b 指名指代 y 的结构化绑定；decltype(b) 为 char&&
// c 指名指代 tpl 的第 3 元素的结构化绑定；decltype(c) 为 const int

```

注意，此时 tuple 中的元素第二个元素是右值，所以结构化绑定时必须使用 const & 才能将右值（右值引用）绑定到左值上。

一般情况就简单很多：

```cpp

float x{};
char  y{};
int   z{};

std::tuple<float&, char&, int> tpl(x, y, z);
auto [a, b, c] = tpl; // 其实c是一个右值引用，表现为普通变量

```

这时 a，b 也都为引用，但是不必是 const。

同时 z 先被复制到 tuple 中，再从 tuple 中复制到了 c 中，而 tuple 中的 x 和 b 都是最开始 的 x 的引用。

如果你不使用结构化绑定，那你就必须使用如下的丑陋代码：

```cpp

float x{};
char  y{};
int   z{};

std::tuple<float&, char&, int> tpl(x, y, z);

auto a = std::get<0>(tpl); // 通过std::get<>取出tuple中的元素

```

### 绑定 std::pair 的元素

由于 std::pair 和 std::tuple，std::array 一样都在编译时确定元素数量和类型，所以结构化绑定理所当然的支持 std::pair。并且由于 std::pair 被大量应用于诸如 std::map 这类容器中，所以使用结构化绑定能够大大缓解 std::pair 使用上的不便：

```cpp

float x{};
char  y{};
std::pair<int, double> p2(x, y);

auto && [x1, y1] = p2;
auto [x2, y2] = std::make_pair(x, y);

```

同时，结构化绑定也支持右值引用（注意，右值引用是左值，实际上相当于一个普通变量）。

```cpp

std::map<int, int> mapa;
if (auto&& [iter, inserted] = mapa.insert({ 1, 2 }); inserted)
    std::cout << "inserted successfully" << std::endl;
for (auto&& [key, value] : map)
    std::cout << "[" << key << ", " << value << "]" << std::endl;

```

### 万能引用

```cpp

float x{};
char  y{};
int   z{};

std::tuple<float&, char&&, int> tpl(x, std::move(y), z);

auto& [a1, b1, c1] = tpl;
auto&& [a, b, c] = tpl;

```

最后一句其实等价于上一句，这实际上是由于数据被绑定到的 tuple 类型的 tpl 是一个左值，`auto&&` 实际上是万能引用，而万能引用是兼容左值引用的。 **引用说明是对于目标元组而言的** 。

对于下面的代码，就必须使用万能引用，而不能使用左值引用：

```cpp

float x{};
char  y{};
int   z{};

std::tuple<float&, char&&, int> tpl(x, std::move(y), z);

auto&& [a, b, c] = std::move(tpl); // 使用左值引用会提示 非常量引用的初始值必须为左值
const auto& [a1, b1, c1] = std::move(tpl); // 因此可以使用常量引用

```

此处使用常量引用（顶层 const）则代表引用不可修改（而不是引用的对象不可修改，由于是顶层 const，所以可以储存 x 和 z 的值）。

### 注意事项

结构化绑定要求标识符列表中标识符数量于目标元组中元素数量一致，换句话说不能遗漏，这是为了防止如果以后目标元组元素数量改变，会造成潜在的错误绑定。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/language/structured_binding">
结构化绑定
</a>
<a href="https://zh.cppreference.com/w/cpp/utility/pair">
std::pair
</a>
</div>