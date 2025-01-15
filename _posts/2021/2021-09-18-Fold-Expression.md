---
title: C++17 折叠表达式
date: "2021-09-18 23:15:00"
tags: [C++, docs]
category: blog
---
C++17 中对可变参数模板的参数包进行了一项改进，即使用折叠表达式（Fold Expression）来简化递归式的“函数调用”，简化了语法。

<!-- more -->

在之前的文章 [C++ 可变参数模板](/blog/2021/08/11/Cpp-Variadic-Template/) 和 [C++17 constexpr if 和 constexpr lambda](/blog/2021/09/12/Cpp-17-constexpr-if-and-constexpr-lambda/) 中都有提到过参数包（parameter pack），其中利用参数包实现了一个接收任意数量的参数的 variadicPrint 打印函数，实际上还可以通过折叠表达式进一步简化。

使用折叠表达式的前提是使用受支持的 32 个操作符：`+` `-` `*` `/` `%` `^` `&` `|` `=` `<` `>` `<<` `>>` `+=` `-=` `*=` `/=` `%=` `^=` `&=` `|=` `<<=` `>>=` `==` `!=` `<=` `>=` `&&` `||` `,` `.*` `->*`。

C++17 的折叠表达式根据标识符的位置分为左折叠和右折叠，根据操作的对象数量分为一元折叠和二元折叠。

只有三个运算符允许参数包为空：`&&` `||` 和 `,`，其中`&&` 为 true，`||` 为false，`,` 为 `void()`。

### 一元折叠

假设表达式是 E，操作符是 op，E 包含标识符（参数包）：

+ 一元左折叠：`(... op E)` 展开为 <code>(E<sub>1</sub> op (... op (E<sub>N-1</sub> op E<sub>N</sub>)))</code>
+ 一元右折叠：`(E op ...)` 展开为 <code>(((E<sub>1</sub> op E<sub>2</sub>) op ...) op E<sub>N</sub>)</code>


折叠表达式其实就是使用折叠标记 `...` 和参数包 `args` 将参数展开的的语法糖，任何折叠表达式都包含折叠标记，标识符和操作符三部分。

最简单的折叠表达式的实例是求和函数：

```cpp

template <typename ... Ts>
auto sumL(Ts ... ts)
{
    return (ts + ...); // 右折叠
}

template <typename ... Ts>
auto sumR(Ts ... ts)
{
    return (... + ts); // 左折叠
}

```

当调用 `sum(1, 2, 3, 4, 5)` 时，右折叠会沿右侧不断将参数包展开，变为 `1 + (2 + (3 + (4 + 5)))`（括号只是为了说明展开方向，真实结果不会添加括号），这其中经历了 3 次展开，第一次展开为 `1 + (2 + ts)`，然后继续进行第二次展开为 `1 + (2 + (3 + ts))`。左折叠的展开方向与之相反。

还可以有下面这个稍微复杂点的例子：

```cpp

template <class... T>
void variadicPrint(T... t)
{
    ((std::cout << t), ...) << std::endl;
}

template <class... T>
void variadicPrint(T... t)
{
    (..., (std::cout << t << std::endl)); // 左右折叠都可
}

```

其中 `(std::cout << t)`（或者 `(std::cout << t << std::endl)`）是包含参数包的表达式，编译阶段使用逗号运算符连接展开的表达式，复制 `(std::cout << t)`，并将参数包 t 替换为实际参数。

对于大部分不需要考虑结合性的情况，左折叠和右折叠没有区别；其他一些情况则需要考虑结合性，例如 `std::string` 的字符串字面值赋值，必须使用右折叠，因为字符串字面值是右值，不能做加运算，此外除法和减法也类似。

由于模板是在编译期进行推导，所以其实不必通过函数的参数传递参数，允许直接将参数直接传递给模板：

```cpp

template <auto... T>
void variadicPrint()
{
    ((std::cout << T), ...) << std::endl;
}

int main()
{
    variadicPrint<1,2,3>();
}

```

不过这也存在着非常明显的缺陷：模板参数类型必须为常量，所以必须为 constexpr 类型的变量才可做为模板参数，这极大的限制了这个函数的用途，因为用户自定义类基本都不是 constexpr 的。

C++17 添加了 `std::string_view` 来构造一个不需要内存分配的“字符串”，以及 C++20 添加了 `std::string` 的 constexpr 构造，因此可以通过此方法通过模板参数输出一个字符串：

```cpp

#include <iostream>
#include <string_view>
using namespace std::literals;
template <const auto&... T>
void variadicPrint() {
    ((std::cout << T), ...) << std::endl;
}
constexpr auto a = "aaa"sv; // 注意，a 必须是具有静态储存期的常量表达式
int main() { variadicPrint<a>(); }


```

#### 一元折叠技巧

通过上面以及之前的代码可以实现一个打印函数，这个函数每打印一次就可以换一次行，也可以打印多次最后再换行，那么可不可以像参数列表一样只在前 n - 1 次打印时输出逗号，最后一次不输出呢？答案肯定是可以的，有四种方法可以实现这种效果：

使用运行期迭代：

```cpp

template <class ...T>
void variadicPrint(T... t)
{
    constexpr last = sizeof ...(t) - 1;
    int i = 0;
    ((i < last ? (std::cout << t << ", ") : (std::cout << t <<std::endl), ++i), ...);
}

```

使用 if constexpr：

```cpp

template <typename T, typename... Ts>
void variadicPrint(T head, Ts... tail)
{
    std::cout << head << ", ";
    if constexpr (sizeof...(tail) > 0)
        variadicPrint(tail...);
    std::cout << std::endl;
}

```

使用 lambda 递归：

```cpp

template<typename Head, typename... T>
void variadicPrint(const Head& head, const T&... args) {
    std::cout << first;
    auto wrapper = [](const auto& arg){
        std::cout<<", ";
        return arg;
    };
    (std::cout << ... << wrapper(args));
}

```

使用 lambda 迭代：

```cpp

template <class ...T>
void variadicPrint()
{
    constexpr last = sizeof ...(t) - 1;
    int i = 0;
    auto wrapper = [i]<class Arg>(Arg arg) mutable // C++20
    {
        if (last == i)
        {
            std::cout << arg << endl;
        } else
        {
            std::cout << arg << ", ";
        }
    }
    (wrapper(t), ...);
}

```

constexpr if 的写法其实是效率最高也最直观的，因此一般推荐使用该方法。

#### 二元折叠

+ 二元左折叠：`(I op ... op E)` 展开为 <code>((((I op E<sub>1</sub>) op E<sub>2</sub>) op ...) op E<sub>N</sub>)</code>
+ 二元右折叠：`(E op ... op I)` 展开为 <code>(E<sub>1</sub> op (... op (E<sub>N-1</sub> op (E<sub>N</sub> op I))))</code>

虽然一元折叠已经足够好用，但是二元折叠仍然有其用武之地：

```cpp

template<typename... Ts>
int removeFrom(int num, Ts... args)
{
    return (num - ... - args); //Binary left fold
    // Note that a binary right fold cannot be used
    // due to the lack of associativity of operator-
}

int result = removeFrom(1000, 5, 10, 15); //'result' is 1000 - 5 - 10 - 15 = 970

```

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4295.html">
Folding expressions
</a>
<a href="https://riptutorial.com/cplusplus/example/8932/binary-folds">
Binary Folds
</a>
<a href="https://en.cppreference.com/w/cpp/language/fold">
fold expression
</a>
</div>
