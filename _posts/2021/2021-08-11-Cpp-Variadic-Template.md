---
title: C++ 可变参数模板
date: "2021-08-11 18:44:00"
tags: [C++, docs]
category: blog
---
C 语言中编译器通过标准 IO 库提供了 printf 和 scanf 两个函数，这两个函数的特点是参数数量可变。而 C++11 增加了可变参数模板的特性以实现函数的参数可变。

<!-- more -->

C++ 的可变参数模板实际上就是对参数进行递归展开，然后用模板特化作为递归出口。

```cpp

void variadicPrint()
{
    std::cout << std::endl;
}

template <typename T, typename... Ts>
void variadicPrint(T Head, Ts... Tail)
{
    std::cout << Head;
    variadicPrint(Tail...);
}

int main()
{
    variadicPrint(3.14, 2048L, "RecurseEnd");
}

```

这个函数模板每次递归都取最左侧参数然后进行打印输出。

当无参数时匹配无参函数（特化的函数模板）结束递归。

常见的例子是类型安全的 printf：

```cpp

template<>
void tprintf(const char* format) // base function
{
    std::cout << format;
}
 
template<typename T, typename... Targs>
void tprintf(const char* format, T value, Targs... Fargs) // recursive variadic function
{
    for ( ; *format != '\0'; format++ ) {
        if ( *format == '%' ) {
           std::cout << value;
           tprintf(format+1, Fargs...); // recursive call
           return;
        }
        std::cout << *format;
    }
}
 
int main()
{
    tprintf("% world% %\n","Hello",'!',123);
    return 0;
}

```

输出结果为

> `Hello world! 123`

Trgs 被称为 parameter pack。

此外，可以通过 sizeof 运算符计算参数个数，但是，C++ 的可变参数是需要在编译阶段展开的，所以不能直接用 if 语句加上 sizeof 运算符退出函数（如果这样可行的话，可以省略那个无参的特化）。

为了解决这个问题，C++17 引入了编译阶段专用的表达式 if constexpr，表明该表达式用于辅助编译器计算。

那么 `variadicPrint` 就可以改写为如下形式：

```cpp

template<typename T, typename... Ts>
void variadicPrint(T Head, Ts... Tail){
    std::cout << Head;
    if constexpr(sizeof...(Tail) > 0){
        variadicPrint(Tail...);
    }
}

```

此外，不光函数可以使用可变参数模板，类也可以使用可变参数模板：

```cpp

template<typename... Elements> class tuple;
template<typename Head, typename... Tail>
class tuple<Head, Tail...> : private tuple<Tail...>
{
    Head head;
public:
    /* implementation */
};
template<>
class tuple<>
{
    /* zero-tuple implementation */
};

```

使用的时候类似普通模板：`tuple<int, float, std::string> t(1, 3.14, "Tail")`

这个模板将会被递归展开，通过私有继承来储存任意数据。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zhuanlan.zhihu.com/p/104450480">
C++的可变参数模板 - Gemfield
</a>
<a href="https://blog.csdn.net/qq_38410730/article/details/105247065">
C++11可变参数模板 - Yngz_Miao
</a>
<a href="https://www.cnblogs.com/muxue/archive/2013/04/13/3018608.html">
C++ variadic template - 唐风
</a>
<span>
侯捷 C++ 新标准 - C++11/14
</span>
</div>