---
title: C++ 成员指针
date: "2022-01-28 06:34:00"
tags: [C++]
category: blog
---

C 中存在两种指针：函数指针和对象指针，并且其宽度典型为 CPU 位数。而由于 C++ 引入了类，从而产生了新的指针种类：成员数据指针和成员函数指针。

<!-- more -->

#### 成员数据指针

成员数据指针能用做成员指针访问运算符 `operator.*` 与 `operator->*` 的右侧操作数：

```cpp

struct C { int m; };
 
int main()
{
    int C::* p = &C::m;          // 指向类 C 的数据成员 m，实际上相当于 m 在类 C 中相对于起始地址的偏移量
    C c = {7};
    std::cout << c.*p << std::endl;   // 通过 c 的地址和偏移量 p 打印出 int 值 7
    C* cp = &c;
    cp->m = 10;
    std::cout << cp->*p << std::endl; // 打印 10
}

```

指向一个可访问且 **无歧义** 的非虚基类的数据成员的指针，可以隐式转换成指向派生类的同一数据成员的指针：

```cpp

struct Base { int m; };
struct Derived : Base { int n; };
 
int main()
{
    int Base::* bp = &Base::m;
    int Derived::* dp = bp;
    Derived d;
    d.m = 1;
    std::cout << d.*dp << ' ' << d.*bp << std::endl; // 打印 1 1
}

```

由于 `Derived` 是直接继承了 `Base` 类，所以 `m` 对于 `Derived` 和 `Base` 的任何成员都有相同的偏移量，`Derived` 类似于 `{ int m; int n; }`，这就是上述所说的无歧义。

编译器遵循相同的模式进行寻址：

```cpp

struct Base1 { int x; };
struct Base2 { int y; };
struct Derived : Base1, Base2 { int z; };

int main()
{
    int Base2::* bp = &Base2::y;
    int Derived::* bp1 = &Derived::y;
    Derived d;
    d.x = 0;
    d.y = 1;
    int a = d.*bp;
    int b = d.*bp1;
}

```

上面这个代码看似 `a == 0`，`b == 1` 都为真，但实际上都等于 1：神奇的 **成员指针访问运算符 `operator.*`** 会在 `d.*bp` 时 `static_cast<Base2>(d)`，完整过程即 `*(int*)(reinterpret_cast<void *>(&static_cast<Base2>(d)) + dp)` 先将 `d` 的地址转换为 `d` 中 `Base2` 的地址，再根据 `Base2` 的地址加上偏移量 `bp`，再以 `int` 类型解引用指针。

```asm

main:
    pushq   %rbp
    movq    %rsp, %rbp
    movq    $0, -8(%rbp)
    movq    $4, -16(%rbp)
    movl    $0, -36(%rbp)
    movl    $1, -32(%rbp)
    movq    -8(%rbp), %rax
    leaq    -36(%rbp), %rdx
    addq    $4, %rdx        // 此处是 Derived 转 Base2
    addq    %rdx, %rax
    movl    (%rax), %eax
    movl    %eax, -20(%rbp)
    movq    -16(%rbp), %rax
    leaq    -36(%rbp), %rdx
    addq    %rdx, %rax
    movl    (%rax), %eax
    movl    %eax, -24(%rbp)
    movl    $0, %eax
    popq    %rbp
    ret

```

上述情况也是无歧义的。

相反方向的转换，即从指向派生类的数据成员的指针到指向无歧义非虚基类的数据成员的指针，允许由 `static_cast` 和显式转型来进行，即使基类并无该成员（但必须通过有该成员变量的派生类的成员来访问）：

```cpp

struct Base {};
struct Derived : Base { int m; };
 
int main()
{
    int Derived::* dp = &Derived::m;
    int Base::* bp = static_cast<int Base::*>(dp);
 
    Derived d;
    d.m = 7;
    std::cout << d.*bp << std::endl; // OK：打印 7
 
    Base b;
    std::cout << b.*bp << std::endl; // 未定义行为
}

```

成员指针的被指向类型也可以是成员指针自身：成员指针可为多级，而且在每级可以有不同的 cv 限定。指针和成员指针的混合也可以多级组合：

```cpp

struct A
{
    int m;
    int A::* const p;// 指向非 const 成员的 const 指针
};
 
int main()
{
    int A::* const A::* p1 = &A::p;// 指向（A 的）数据成员的非 const 指针
    // 该成员是一个指向【（A 的）非 const 成员】的 const 指针
    const A a = {1, &A::m};
    std::cout << a.*(a.*p1) << std::endl; // 打印 1
 
    // 指向一个【指向（A 的）非 const 成员的 const 指针】的常规非 const 指针
    int A::* const* p2 = &a.p;
    std::cout << a.**p2 << std::endl; // 打印 1
}

```

#### 成员函数指针

这种指针可以用作成员指针访问运算符 `operator.*` 与 `operator->*` 的右操作数。其结果表达式只能用作函数调用运算符的左侧操作数：

```cpp

struct C
{
    void f(int n) { std::cout << n << std::endl; }
};
 
int main()
{
    void (C::* p)(int) = &C::f; // 指向类 C 的成员函数 f 的指针
    C c;
    (c.*p)(1);                  // 打印 1
    C* cp = &c;
    (cp->*p)(2);                // 打印 2
}

```

注意，`f` 虽然不依赖任何一个成员变量，但是其仍然 **不是** 一个静态成员函数。对于上述代码，使用成员函数指针是多余的，因为将 `f` 声明为 `static` 后可以使用普通函数指针指向 `f`。同时，对于所有静态成员函数，都不可以使用成员函数指针。

指向基类的成员函数的指针可以隐式转换成指向派生类的同一成员函数的指针：

```cpp

struct Base
{
    void f(int n) { std::cout << n << std::endl; }
};
struct Derived : Base {};
 
int main()
{
    void (Base::* bp)(int) = &Base::f;
    void (Derived::* dp)(int) = bp;
    Derived d;
    (d.*dp)(1);
    (d.*bp)(2);
}


```

相反方向的转换，即从指向派生类的成员函数的指针到指向无歧义非虚基类的成员函数的指针，允许由 `static_cast` 与显式转型来进行，即使基类没有该成员函数（但必须通过有该函数的派生类的成员来调用）：

```cpp

struct Base {};
struct Derived : Base
{
    void f(int n) { std::cout << n << std::endl; }
};
 
int main()
{
    void (Derived::* dp)(int) = &Derived::f;
    void (Base::* bp)(int) = static_cast<void (Base::*)(int)>(dp);
 
    Derived d;
    (d.*bp)(1); // OK：打印 1
 
    Base b;
    (b.*bp)(2); // 未定义行为
}

```

由于 C++ 引入了多继承和虚继承，所以成员指针（尤其是函数指针）的宽度不一定为一倍指针宽度：

+ 单倍宽度：对于非继承或者单继承类
  + 成员变量在类的内存分布中的偏移量
  + 成员函数在代码区的起始地址
+ 双倍宽度：多继承且函数为虚
  + `this` 指针调整值 + 虚表偏移量

C++ 标准未对此做出过多描述，不过编译器普遍支持上述情况。由于 C++ 继承存在更复杂情况，此时成员函数指针实现可能更为复杂，但并未得到广泛支持。

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/language/pointer">
指针声明
</a>
</div>
