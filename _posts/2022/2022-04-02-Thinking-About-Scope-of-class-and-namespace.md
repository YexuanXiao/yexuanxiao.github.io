---
title: 关于 C++ 类和命名空间作用域的思考
date: "2022-04-02 01:44:00"
tags: [C++]
category: blog
---
命名空间是 Bjarne 和当初的 ANSI/ISO 工作组的一些人在 1993 年设计的一个特性，Bjarne 首先注意到 C 的链接安全问题，C 由于所有函数都属于全局命名空间，而大型项目中有成千上万个函数，想维护这些函数名是一件庞大繁琐的工作，并且 C 不支持函数重载，相比于 C++ 更容易存在冲突；其次，C++ 的库远比 C 的大，尤其是加入了模板和泛型算法后，出现严重的冲突是可以预期的。

<!-- more -->

当时的人们就已经开始使用 C++ 的类静态成员来解决这个问题，这种方案也被 Java 采纳 [^1]。但是在 C++ 中，将所有函数和全局变量都写到类内并不一定是个好主意，起码不够方便：所有声明都要加上 `static`，并且函数体和静态成员初始化要写到外面。显然，这种方案不够完善。

[^1]: 很不幸，Java 诞生于 1995 年，而 C++ 在 1998 年完成标准化，所以 Java 可能恰好错过了这种机制。

Bjarne 总结了一些想法：

+ 能够保证链接安全性
+ 能够保证命名安全性
+ 能够进行扩充
+ 能够进行选择
+ 兼容以往的代码
+ 没有运行时成本
+ 便于使用

标准委员会最终设计了一种新的定义作用域的机制 `namespace` ，用于打开作用域的工具 `using`，以及用于指示作用域的运算符 ::。 _类作用域可看作命名空间作用域的特殊情况。_ 并且使得全局的 `static` 关键词无意义。

实际上，`using` 的引入还解决了 C++ 此前长期“遗留”的问题：在派生类中访问基类成员。

Bjarne 同时意识意识到，类作用域实际上应该是命名空间作用域的一种特例，而不是反过来。类的功能就是设计一种用户自定义类型，如果使用类实现类似命名空间的功能，势必带来混乱。

以上内容总结自《C++ 语言的设计和演化》第十七章。本文原本旨在于记录 `namespace` 和类作用域实现的异同，不过在参考《C++ 语言的设计和演化》后发现已经没什么可说的了。

以下是一个简单的示例：

```cpp

struct Date0 {
public:
    static int getDate() {
        return 0;
    }
};

struct Date01 :public Date0 {
    using Date0::getDate;
};

struct Date1 {
    struct Date11 {
        static int getDate() {
            return 11;
        }
    };
    // using Date11::getDate; 非法，Date11不是基类
    // struct Date11 :public Date1; 不允许使用不完整类型
};

namespace Date2 {
    namespace Date21 {
        int getDate() {
            return 21;
        }
    }
    using Date21::getDate;
}

namespace Date3::Date31 {
    int getDate() {
        return 31;
    }
}

struct Date5 {
    static int getDate() {
        return 5;
    }
};

// using Date5::getDate; // msvc:不允许使用类型限定名，gcc：在非class作用域对成员使用using

int main() {
    int a = Date0::getDate();
    int b = Date01::Date0::getDate();
    int c = Date01::getDate();

    int d = Date1::Date11::getDate();

    int e = Date2::getDate();
    int f = Date2::Date21::getDate();

    int g = Date3::Date31::getDate();
}

```

<div class="ref-label">注：</div>
