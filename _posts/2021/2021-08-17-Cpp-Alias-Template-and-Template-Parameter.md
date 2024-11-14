---
title: C++ 模板的模板参数和别名模板
date: "2021-08-17 08:02:00"
tags: [C++, docs]
category: blog
---
C++ 的模板是现代 C++ 开发必不可少的一部分。C++11 引入了别名模板的特性，使模板嵌套模板能更加方便。

<!-- more -->

对于类模板，在之前的文章中进行过简短的阐述，类模板的实例化需要显式指定参数类型或者参数类型推导。但是如果想使用模板的嵌套，这就产生一个问题，外层模板匹配内层模板，内层模板匹配实例化参数类型。

### 别名模板

语法：

```cpp

template <class T>
using Vec = std::vector<T>;

Vec<int> coll;

```

```cpp

template <class T>
using Vect = std::vector<T, std::allocator<T>>;

Vec<int> coll;

```

表面来看，这只是简单的别名而已，但是别名模板有两个特点：

1. 由于模板是需要知道参数类型才能实例化的，而 C 语言的 define 宏和 typedef 都无法做到 **将参数传递给原来的模板** ，所以 C++ 增加了别名模板这一特性， **使 using 也支持类型推导** ，从而实现 模板 + 别名。
2. 下文会提到，别名模板具有 **让编译器自动推导第二个参数** 的能力。

### 嵌套模板

在编写嵌套模板时，一般来说是这样：

```cpp

template <typename T, typename Container>
class Stack
{
public:
  Container elems; // elements5
};

int main()
{
  Stack<double, std::vector<double>> dblStack;
  //Stack<double, std::vector<double> > dblStack; before C++11
}

```

同时，还可以给模板加上默认 **模板参数** ：

```cpp

template <typename T, typename Container = std::vector>

Stack<double> dblStack;

```

这时候会发现，如果想要同时传递一个容器，并且声明容器中的元素类型，需要给模板传递两个参数，并且第一个参数实际上是“多余的”。

### 模板的模板参数

C++11 提供了一种新的方式：模板的模板参数（Template Template Parameters）：

```cpp

template <typename T, template <typename> class Container>
class Stack {
public:
  Container<T> elems; // elements
};


int main()
{
  Stack<double, std::vector> dblStack;
}

```

这样确实可以省略重复的参数，但是你还是得写 2 个参数，并且这个代码是不能通过编译的，因为 vector 模板有 2 个参数，而此时编译器不能自动推断出来：

> 对于标准库的大部分模板，都是有两个实例化参数的，一个是元素类型，一个是分配器。如果将标准库的模板嵌套进的模板，需要将两个参数都传给标准库模板。<br>第二个实例化参数分配器也是个模板，分配器需要知道元素类型，所以在单独使用标准库模板的时候，实际上是编译器依靠模板自动推导了第二个参数。<br>但是对于自己定义的模板而言，编译器是没有这种自动推导参数的能力的。

而使用别名模板就可以成功解决自己的模板嵌套标准库模板，使标准库模板的第二个参数无法匹配第一个参数的类型的问题：

```cpp

template <typename T>
using Vect = std::vector<T, std::allocator<T>>;

template <typename T, template <typename> class Container>
class Stack
{
public:
  Container<T> elems; // elements
};

int main()
{
  Stack<int, Vect> vStack;
}

```

如果不想用别名模板，那就必须手动指定第二个参数：

```cpp

template <typename T,
  template <typename Elem, typename Alloc = std::allocator<Elem>>
  class Container>
class Stack
{
public:
  Container<T> elems; // elements
};

int main()
{
  Stack<int, std::vector> vStack;
}

```

这样的后果是显而易见的，Stack 模板会 **强制要求容器模板支持第二个参数** 。

或者使用 **可变参数模板**：

```cpp

template <typename T,
  template <typename ...>
  class Container>
class Stack
{
public:
  Container<T> elems; // elements
};

int main()
{
  Stack<int, std::vector> vStack;
}

```

此时，别名模板也具有一定优势：可以指定自己的分配器，而 **不影响原本的 Stack 模板** 。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://www.cnblogs.com/zhangyachen/p/14083672.html">
C++11-17 模板核心知识（十二）—— 模板的模板参数 Template Template Parameters
</a>
<span>
侯捷 C++ 新标准 - C++11/14
</span>
</div>