---
title: C++ 类模板 2 - 继承，作用域运算和友元
date: "2021-07-14 01:30:00"
tags: [C++, docs]
category: blog
---
本篇文章介绍 C++ 类模板的继承，作用域运算和友元。

<!-- more -->

对于一个派生类，有两种方式可以继承基类，第一种是直接指定基类中成员变量的类型，第二种是使用模板声明一个通用数据类型，再继承基类。

```cpp

template <class T1>
class Base
{
public:
	T1 name;
};

class Son1 : public Base<std::string>
{
};

template <class T1, class T2>
class Son2 : public Base<T1>
{
public:
	T2 id;
	Son2(T2 i)
	{
		id = i;
	}
};

```

当然，如果基类有构造函数，那么也可以使用初始化列表调用基类的构造函数，参考之前的文章 [C++ 构造函数初始化列表和聚合类初始化](/blog/2021/03/24/Cpp-Init-List/)。


由于类模板使用了通用数据类型，所以在类外定义成员函数也和普通类有所区别，需要加上模板参数列表（用“<>”表示）：

```cpp

template <class T1, class T2>
class Person
{
public:
	T1 name;
	T2 id;
	Person(T1 a, T2 b);
	void show_Name(T1 a, T2 b);
};

template <class T1, class T2>
Person<T1,T2>::Person(T1 a, T2 b)
{
	name = a;
	id = b;
}

template <class T1, class T2>
void Person<T1,T2>::show_Name(T1 a, T2 b)
{
	std::cout << name << endl;
}

```

友元函数是一种特殊的函数，它是普通全局函数但是同时它却有访问类的私有成员的能力。在模板类内声明友元函数和在普通类内是一样的，但是想要在类的外部声明友元函数，此时就复杂了很多。

```cpp

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
	friend void show_Id(Person &p)
	{
		std::cout << p.id << std::endl;
	}
};

int main()
{
	Person r(std::string("Tom"), 1);
	show_Id(r);
}

```

```cpp

template <class T1, class T2>
class Person;

template <class T1, class T2>
void show_Id(Person<T1, T2>& p)
{
	std::cout << p.id << std::endl;
}

template <class T3>
void show_Id1(T3& p)
{
	std::cout << p.id << std::endl;
}

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
	friend void show_Id<>(Person<T1, T2>& p);
	//friend void show_Id<T1, T2>(Person<T1, T2> &p);
	template <class T3>
	friend void show_Id1(T3& p);
	//friend void show_Id1<>(T3& p); 这句使用 VS2022 编译通过，但是 G++ 提示用法错误。关于空模板参数列表此处存疑，可能是由于 VS2022 不严格
};

int main()
{
	Person r(std::string("Tom"), 1);
	show_Id(r);
	show_Id1(r);
}

```