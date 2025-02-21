---
title: C++ 抽象类和虚函数
date: "2021-03-22 21:38:00"
tags: [C++,docs]
category: blog
---
C++ 的抽象类就是所谓的接口，目的在于将相似或者近似数据类型实际应用时的代码统一，并分离不同类型的实现。

<!-- more -->

C++ 中，由于作用域的原因，当基类和派生类拥有同一个成员函数时，使用基类指针指向派生类对象，再通过基类指针调用成员函数时，即使该对象类型是派生类，但是仍然因为指针作用域的关系而调用基类的函数。

为了让所有操作都通过基类的成员函数，而实际上却使用派生类的成员函数，达到在使用上统一多个派生类，新派生类可在基类的基础上进行扩展，便于维护，所以 C++ 引入了虚函数和纯虚函数概念。

虚函数的语法是在基类成员函数前加上 virtual 关键词，有二种成员函数不支持 virtual 关键词，分别是构造函数和友元函数，常见还有两种关键词不能和 virtual 共存，分别是 static 和 inline，并且此函数必须可以被继承。

C++ 还引入了一种新的声明方法纯虚函数，形式如下：`virtual type function-name() = 0;` 此时函数只有声明而不用定义，并且基类变为抽象类无法实例化。

C++ 抽象类在使用上可以概括为使用基类指针或引用指向派生类对象，通过调用基类虚函数隐式调用派生类的函数实现，达到隐藏不同派生类实现的目的，也就是基类是不同派生类的统一接口。

示例：

```cpp

#include <iostream>

class Base {
public:
    virtual void get_name() = 0;
};

class A :public Base {
public:
    void get_name() {
        std::cout << "class A" << std::endl;
    }
};

class B :public Base {
public:
    void get_name() {
        std::cout << "class B" << std::endl;
    }
};
void ref_test(Base &ref){
    ref.getname();
}
int main(){
    B b_inst;
    Base* father = &b_inst;//此时指针类型为 Base
    b_inst.get_name();//此时输出：`"class B"`
    ref_test(b_inst);//此时输出：`"class B"`
}

```


注意，抽象类中的函数必须在继承后为 public 权限，否则无法访问。

当一个类有一个纯虚函数，这个类就变为抽象类，抽象类不能实例化，抽象类的派生类也可以是抽象类，能实例化的只有派生出的普通类。

有虚函数的类在内存中会有一个额外的指针 vfptr，指向一个虚函数表 vftable，vfptr 和 vftable 会继承到派生类。

***当派生类函数主动在堆区分配内存，需要使用虚析构函数释放*** ，此时先执行派生类的析构函数，再执行基类的析构函数。

虚析构函数也可以声明为纯虚函数，当基类在堆区主动申请内存时，纯虚析构函数可以在类外通过作用域运算符重载析构函数的实现。