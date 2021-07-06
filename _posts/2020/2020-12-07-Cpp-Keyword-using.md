---
layout: post
title: C++ 关键字 using
date: "2020-12-07 11:05:00"
tags: [C++,C,docs]
categories: [blog]
---
　　C++ 相比 C 提供了许多新的关键字，其中 using 关键字可以说是 C++ 最重要的关键字之一。using 的两个功能是定义别名和函数重载。

<!-- more -->

## 函数重载

```cpp
using namespace std;//释放整个命名空间到当前作用域
using std::cout;    //释放某个变量到当前作用域
```

## 定义别名
　　C 语言中提供两种定义别名的方式，#define 预处理指令和 typedef，C++ 提供了 using

　　#define x y 可以将后续代码中的 x 替换为 y，例如 `#define DString std::string`；C++ 支持带参数的宏 `#define MAX(x,y) (((x)>(y))?(x):(y))

　　typedef y x; 可以将 x 替换为 y，例如 `typedef std::string TString;`，并且 typedef 支持复杂一些的别名。

　　`typedef void (tFunc*)(void);` `using tFunc = void(*)(void);` 这两句是等价的。

　　并且 typedef 不支持模板别名，而 using 可以：`using line_sim = std::vector<string>::size_type;`
