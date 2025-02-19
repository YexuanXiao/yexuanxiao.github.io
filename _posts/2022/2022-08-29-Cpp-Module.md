---
title: C++ Module
date: "2022-08-28 09:30:00"
tags: [C++]
category: blog
---
C++20 的一个重要特性是模块，模块是一种全新的源文件组织方式，旨在解决以往使用源文件包含的方式导致翻译单元过大以及模板重复实例化问题，有利于加快编译速度。

<!-- more -->

### 模块单元

一个模块是一个翻译单元，这里的翻译单元不是传统意义上翻译到中间表示（IR）或者机器码（binary）的翻译单元，而是一种新的基于 C++ 抽象机的的模块翻译单元。以往利用 `inline namespace` 和 `static` 来限制链接的可见性，如今可以使用 `export` 关键词来指定是否导出。

以 `std` 开头的名字不能作为模块名，这些名字是保留的。

以 `export` 声明的模块是模块接口单元，剩下的是模块实现单元。一个模块必须只有一个模块接口单元。

```cpp

// helloworld-impl.cpp
module helloworld;       // 模块实现

export void hello() {
    std::cout << "Hello world!\n";
}

// helloworld.cpp
export module helloworld; // 声明一个模块并作为模块接口

export void hello();      // 声明一个导出函数

// main.cpp
import helloworld;        // 导入模块接口

int main() {
    hello();
}

```

只有在模块接口单元内进行导出，才能在该模块外被导入使用，模块接口单元决定了声明的访问性。

使用一个模块前，需要导入模块，可以同时使用 `export` 和 `import` 使得被导入模块同时被导出。

### 模块分区

一个模块分区是一个模块单元，模块分区必须被直接或者间接的被主模块导入：

```cpp

// A-B.cpp   
export module A:B;

// A-C.cpp
module A:C;

// A.cpp
export module A; // 声明主模块单元 A，并且可访问模块分区 B 和 C

import :C;
export import :B;

```

模块分区单元也是模块单元，模块分区内的所有声明和定义在将其导入的模块单元中均可见，无论它们是否被导出。

模块分区可以是模块接口单元。必须被主模块接口单元第二次导出才能导出一个模块分区。

```cpp

// A.cpp
export module A;     // 声明模块接口单元 A
export import :Foo;  // 导入 A:Foo 模块分区
export int baz();    // 导出函数

// A-Foo.cpp
export module A:Foo; // 声明一个 A 的模块分区 Foo，同时 Foo 也是模块接口单元
import :Internals;   // 导入 A:Internals
export int foo() { return 2 * (bar() + 1); } // 导出函数

// A-Int-impl.cpp
module A:Internals;  // 声明模块分区 Internals，Internals 只有模块 A 能访问，因为没有声明模块接口 
int bar();

// A-impl.cpp

module A;
export import :Foo;  // 导入 Foo 分区同时导出
int bar() { return baz() - 10; }
int baz() { return 30; }

```

注意，模块和命名空间是正交的，并不是替代的关系，在模块中也可以使用命名空间。

如果需要导出多个声明，则可使用大括号：

```cpp

export {
    int one()  { return 1; }
    int zero() { return 0; }
}

```

一个模块名可以带 `.`，`.` 没有什么特殊含义，不过按照惯例，`.` 表示层次关系。

命名空间也是可以导出的：

```cpp

module M;

export namespace N {}

```

导出一个命名空间仅代表导入该处命名空间内的声明，不能导出一个匿名命名空间，因为匿名命名空间具有内部链接，同时，也不能导出一个声明为 `static` 的函数或者命名空间内变量，这些声明明确的具有内部链接。

类也是可以导出的：

```cpp

export class A {};

```

C++20 允许将一个模块单元拆分成多个文件，因此可以对模块进行扩充，就像 `namespace` 一样，但需要导出的声明必须在模块接口单元内导出。

### 全局模块片段

有些时候需要使用全局的预处理指令来进行控制，例如根据不同平台选择使用不同的头文件，则可以使用全局模块片段：

```cpp

module;

// 只能出现预处理指令
#define _MSC_VER 1932
#ifdef _MSC_VER
#include <win_impl.h>
#endif

export module A; // 全局模块单元只能出现在头部，并且紧跟着一个模块声明

```

全局模块片段中的内容就像没有模块一样，可以被当前模块使用。

### 私有模块片段

私有模块片段可以定义一个非模块单元的模块实现区域，并且只能被当前模块访问。一个模块只能有一个私有模块片段，私有模块片段通常用于在单一文件中实现整个模块，这可以减少重编译：

```cpp

export module SingleFile;

// interface

module :private;

// implement

```

### 实践

实践中，模块接口单元起到以前的头文件的作用，模块实现单元起到实现文件的作用，在这种情况下，模块接口单元中只包括变量和函数的声明，不包括定义。

对于头文件库或者可以源码分发的库，不需要区分模块接口单元和模块实现单元。

如果需要导入宏，那么可以将宏抽离到一个单独的头文件中，然后全局模块片段中使用 `#include` 导入。

需要使用 C 库或者老的 C++ 库头文件时，也在全局模块片段中使用 `#include` 导入。

<div class="ref-label">参考：</div>
<div class="ref-list">
<span>
ISO/IEC 14882:2020 Programming languages — C++
</span>
<a href="https://zh.cppreference.com/w/cpp/language/modules">
Modules
</a>
<a href="https://stackoverflow.com/questions/70432629/how-to-use-c-module-private-fragment-with-templates">
How to use C++ module :private fragment with templates?
</a>
<a href="https://learn.microsoft.com/en-us/cpp/cpp/tutorial-named-modules-cpp?view=msvc-170">
Named modules tutorial (C++)
</a>
<a href="http://www.modernescpp.com/index.php/c-20-modules-private-module-fragment-and-header-units">
C++20 Modules: Private Module Fragment and Header Units
</a>
</div>
