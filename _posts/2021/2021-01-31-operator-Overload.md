---
layout: post
title: C++ 类的运算符重载
date: "2021-01-31 15:45:00"
tags: [C++,docs]
categories: [blog]
---
　　运算符重载是 C++ 类的一个终要特性，能够帮助我们简化代码。

<!-- more -->

　　运算符重载的对象都是类成员，而运算符重载有两种形式，分别是作为成员函数重载和作为全局函数重载。

　　前文 “C++ 类的基本知识” 说明了 C++ 如何声明和定义类，本文将继续对前文的代码进行补充

### 重载 + 加号运算符

```cpp

class Testd{
    ...
public:
    Testd operator+(Testd &p){//作为成员函数
        Testd temp;
        temp.a = this->a + p.a;
        return temp;//返回对象，接收时调用拷贝构造函数
    }
};

Testd operator+(Testd &p, Testd &q){
    Testd temp;
    temp.a = p.a + q.a;
    return temp;
}

Testd p2,p3,p4;
p2 = p3 + p4;

```

### 重载 << 左移运算符

```cpp

class Testd{
    ...
public:
    friend ostream& operator<<(ostream &out, Testd &p);//作为友元类使重载后函数可以私有成员变量
private:
    int a;
}
ostream& operator<<(ostream &out, Testd &p){//返回ostream 类型的引用，使之可以连续传递ostream对象。
    out << a;
    return out;
};

int main(){
    Testd m;
    cout << m << endl;
}

```

### 重载 ++ 自增运算符

```cpp
class Testd{
public:
    ...
    Testd& operator++(){//前置递增，返回自身的引用
        ++a;
        return *this;
    }

    Testd operator++(int){//后置递增，返回递增前的副本，int用于区分重载函数，占位用
        Testd temp = *this;
        ++a;
        return temp;
    }
};
int main(){
    Testd m;
    ++m;
    ++(++m);//重载函数返回自身的引用，可以一直加
    m++;//重载函数返回临时的副本，第二次加会加在副本上
}

```

### 重载 = 赋值运算符

```cpp

class Testd{
public:
    ...
    Testd& operator=(Testd &p){
        if (b){
            *b = *p.b
        } else {//利用赋值运算符创建对象时
            b = new int(*p.b);
        }
    }
    Testd(){
        b = new int;
    }
private:
int *b;
};

int main(){
    Testd a;
    Testd d;
    Testd c = d = a;
}

```

### 重载关系运算符

```cpp

class Testd{
public:
    ...
    int operator==(Testd &p){
        if (a == this->a) return 1;
        else return 0;
    }
    int operator!=(Testd &p){
        if (a == this->a) return 1;
        else return 0;
    }
};

```

### 重载函数调用运算符（仿函数）

```cpp

class Print{
public:
    void operator()(string str1){
        cout << str1 << endl;
    }
};

int main(){
    Print p_print;
    p_print("Hello world");
}

```

　　同时，C++ 允许使用匿名对象，进行一些基本操作：

```cpp

Print()("Hello World")

```

### 重载构造函数的隐式类型转换

　　根据上文 C++ 类的封装，我们也可以对构造函数进行重载，而 C++ 中允许在调用函数时隐式转换初始化类对象。

　　以 string 对象为例：

```cpp

class A{
    A(string s){};//带参构造函数定义，接受一个string参数
    copy_S(string s){};//函数定义，作用是复制类中的一个string对象到另一个类
};

int main(){
    A a;
    string b = "string b"
    a.copy(b);//此时会隐式构造一个A类临时对象
    a.copy("string c");//错误，C++只允许一步就可以完成的类型转换
    a.copy(string("string d"));//正确，"string d"是一个C风格字符串，显式转换为 string，再隐式转换为一个临时对象
    a.copy(A("string e"));//正确，先隐式转换为string，再显式构造一个临时对象
}

```

　　只有含一个参数的构造函数可以进行隐式转换，含有多个参数的构造函数不能进行隐式转换。

　　如果我们不想让某个构造函数进行隐式转换，那么可以在构造函数前加上关键字 explicit 来阻止可能的隐式转换。

　　注意 ***explicit 关键字只能在类内使用，不能通过作用域运算符在类外使用。***
