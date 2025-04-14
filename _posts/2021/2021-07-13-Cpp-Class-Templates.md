---
title: C++ 类模板
date: "2021-07-13 15:16:00"
tags: [C++, docs]
category: blog
---
类模板和函数模板的基本思想是相同的，都是先声明一个通用数据类型，再使用通用类型代替固定类型，不过由于类本身和函数有很多区别，所以需要分开讨论。

<!-- more -->

类模板的基本语法很简单：

```cpp

#include <iostream>
#include <string>
template <class T1, class T2>
class Person
{
public:
	T1 name;
	T2 id;
	Person(T1 a, T2 b)
	{
		name = a;
		id = b;
	}
};

int main()
{
	Person p(std::string("Tom"), 1);
	Person q("Tom", 1);
	Person<std::string, int> r("Tom", 1);
}

```

注意，由于 C++11 不能自动推导出模板的类型，所以模板实例化出的 p 和 q 不能在 C++11 标准下编译通过，需要 C++14。

对于 C++11，必须使用尖括号的方式指定模板类型才可以通过编译，如 r。

此外要指出，任何用双引号包括的字符串都被视为 ***字面常量*** ，所以 `q.name` 是一个 `char*`，而 `p.name` 和 `r.name` 是 `string`。

类模板由于使用了通用数据类型，所以类作为函数参数时也和普通类有所区别，表现在形参上：

```cpp

#include <iostream>
#include <string>
template <class T1, class T2>
class Person
{
public:
	T1 name;
	T2 id;
	Person(T1 a, T2 b)
	{
		name = a;
		id = b;
	}
};

void show_Name(Person<std::string, int> &p)
{
	std::cout << p.name << std::endl;
}

template <class T1, class T2>
void show_Name1(Person<T1, T2> &p)
{
	std::cout << p.name << std::endl;
}

template <class T1>
void show_Name2(T1 &p)
{
	std::cout << p.name << std::endl;
}

int main()
{
	Person p(std::string("Tom"), 1);
	Person<std::string, int> r("Tom", 1);
	show_Name(r);
	show_Name1(r);
	show_Name2(r);
}

```

`show_Name` 是指定参数类型，这种方法直接指定了所有具体参数类型。

`show_Name1` 是参数模板化，让编译器推导类模板的具体参数类型。

`show_Name2` 是类模板化，让编译器推导整个类。