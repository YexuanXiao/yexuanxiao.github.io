---
title: C++ 代码编写建议
date: "2022-07-28 07:33:00"
tags: [C++]
category: blog
permalink: /proposal/
---
这是一份 C++ 的代码编写建议书，本建议书类似于 Google C++ Style Guide，但更倾向于推广现代 C++。不同于 C++ Core Guidelines，本建议更为细致。本建议书具有强烈的个人倾向，也会参考其他建议。如果建议在 C 中也可行，则同时对 C 也适用。

<!-- more -->

目前处于初期阶段。

1. 避免使用具有静态储存周期的可变量，例如命名空间内变量，非常量静态成员，非常量函数内静态变量

    理由：
    1. 静态储存周期变量的生命周期不可控
    2. 静态声明周期变量打破了函数的局部性，使得函数的运行结果依赖于函数参数之外的对象，更容易产生 bug 以及更难以调试

2. 避免虚假的数组声明，使用指针，例如 `void func(int *c)` 而不是 `void func(int c[])`

    理由：
    1. 使用这种虚假的数组声明往往会带来一种误解，使得数组长度被忽视，并且曲解了 c 的真正类型

3. 避免在正式交付的软件中做不必要的边界检查用于 debug，例如 `std::vector<T, U>::at`，应使用提前检查，例如判断 `size`，或在正式发布时禁用检查，例如使用 `assert`

    理由：
    1. 完全可以使用提前检查 `size` 来实现相同效果
    2. 抛出该类型异常会增加软件复杂度
    3. at 不是原子的，不具有线程安全性

4. 避免使用 `define` 宏定义，使用 `constexpr` 表示常量

    理由：
    1. 宏没有作用域约束
    2. 宏展开的结果无法预测
    3. 宏没有类型

5. 类成员函数仅在类内声明而不实现

    理由：
    1. 存在循环依赖的情况下不得不声明和实现分类
    2. 类声明的行数过长不利于阅读
    3. 友元函数通常需要在类外声明（除了隐藏友元）

6. 使用 `const` 变量传递参数

    理由：
    1. 对象状态清晰，方便维护
    2. 避免误操作导致产生野指针或者悬垂引用

7. 使用 `inline` 修饰静态成员变量（C++17）

    理由：
    1. 直观，减少冗余
    2. 避免重复定义的报错

8. 使用 `using` 和函数类型构造函数指针

    理由：
    1. 清晰

    例如：

    ```cpp

    using f_type = void(int, int);
    using f_pointer = f_type*;
    void f_impl(int a, int b);
    f_pointer a = f_impl;

    ```

9. 避免内存别名使用

    理由：
    1. 别名使用通常存在 bug，错误的使用会导致错误的结果
    2. 别名使用影响编译器优化

    例如：

    ```cpp

    template<typename T>
    void accumulate(T* source, size_t len, T* target) {
        for (size_t i = 0; i < len; ++i) {
            *target += source[i];
        }
    }

    template<typename T>
    void accumulate1(T* source, size_t len, T* target) {
        T acc = *target;
        for (size_t i = 0; i < len; ++i) {
            acc += source[i];
        }
        *target = acc;
    }

    ```

    注意这两个 `accumulate` 函数的区别：`accumulate` 每次做 `+=` 操作都会通过 `target` 指针进行间接访问，造成效率降低，由于 `source` 和 `target` 的类型都是 `T*`，所以编译器不能贸然将 `accumulate` 优化为 `accumulate1`，因为两个函数语义上不等价：当 `target` 是 `source` 的一个元素，两个函数的结果不一样

    这种现象叫做内存别名使用：编译器无法判断指针是否重叠。一个好的方案是引入一个中间变量，这种方式首先能避免别名使用，还能提高可读性：字符数少的代码有可能性能差又难读

10. 使用引用限定修饰赋值意义的运算符重载函数，限制 `*this` 的值类别（参考 [C++ 非静态成员函数的引用限定修饰](//mysteriouspreserve.com/blog/2022/06/20/Cpp-Reference-Quality-Member-Function/)）

    理由：

    1. 对一个右值进行赋值通常是无意义的
    2. 允许对一个右值进行赋值可能会使形如 `if(foo() = 8)` 的语句合法

11. 避免抛出含有状态的异常，使用无状态异常（参考 [C++ 异常问题的简单分析](//mysteriouspreserve.com/blog/2022/07/18/Cpp-Exception/)）

    理由：
    1. 带状态异常会存在堆内存分配，存在逻辑矛盾
    2. 带状态异常性能差

12. 使用 `std::string_view` 代替字符串常量（C++17）

    理由：
    1. `std::string_view` 编译器计算长度，避免不必要的 `strlen`
    2. `std::string_view` 自带长度，方便使用和传递

13. 使用 `std::string_view` 和 `std::span` 作为数组视图（C++17）

    理由：
    1. 避免不必要的堆内存分配
    2. 自带长度方便使用和传递

14. 使用到 `std::string_view` 的推导指引代替 `char*`（C++17）

    理由：
    1. 编译期即可计算长度，避免不必要的 `strlen`
    2. 方便使用和传递

15. 同类型比较使用成员函数，非同类比较使用友元函数

    理由：
    1. 同类比较实现为成员可以防止函数扩散到其他作用域
    2. 非同类比较实现为友元便于维持对称性
    3. 非同类比较实现为友元可以避免循环引用

16. 实现三路比较代替实现谓词比较，以及优先启用默认比较（C++20）

    理由：
    1. 三路比较能提高有序容器的性能
    2. 三路比较能简化比较函数实现
    3. 三路比较具有对称性
    4. 默认比较避免了冗余代码

17. 使用无符号数（例如 `size_t`）代替有符号数

    理由：
    1. 有符号数溢出通常未定义
    2. 无符号数能表示更大范围

18. 使用 `std::unique_ptr` 代替多次 `new`

    理由：
    1. 保证动态内存分配的异常安全（参考 [C++ 异常安全 - 智能指针](//mysteriouspreserve.com/blog/2022/04/08/Cpp-Exception-Smart-Pointer/)）

19. 使用 `const_cast`，`static_cast` 和 `reinterpret_cast` 代替 C 风格的转换

    理由：
    1. `static_cast` 可以检查溢出和非常规转换
    2. 由于错误转换而存在 bug 时利于发现
    3. 防止 `reinterpret_cast` 造成非对齐访问内存，参考第 34 条

20. 使用枚举类代替枚举

    理由：
    1. 枚举类的成员不会泄漏

21. 使用匿名命名空间代替 `static`

    理由：
    1. 更易于维护

22. 使用 `inline` 函数和 `inline` 变量代替 `extern`（C++17）

    理由：
    1. 防止定义冲突
    2. 便于维护
    3. 不违反 odr

23. 使用 copy-and-swap idiom 实现移动构造和移动赋值

    理由：
    1. 异常安全
    2. 方便编写

24. 默认构造，移动构造，移动赋值，析构和无异常函数使用 `noexcept` 修饰

    理由：
    1. 默认构造应该只进行 0 初始化，不进行资源分配（参考 [C++ 异常 - 资源管理](//mysteriouspreserve.com/blog/2022/06/18/Cpp-Exception-Resource-Management/)），不会产生异常
    2. 移动构造和移动赋值应该使用 copy-and-swap idiom，天生异常安全
    3. 析构函数的异常无法正确处理（参考 [C++ 异常 - 类和异常](//mysteriouspreserve.com/blog/2022/04/07/Cpp-Exception-Class-and-RAII/)）

25. 避免使用 `using` 指令

    理由：
    1. `using` 指令只影响查找规则，不引入名字到当前作用域，所以可能会发生遮蔽，造成错误的函数调用（参考 [C++ 命名空间和 using](//mysteriouspreserve.com/blog/2022/04/13/Cpp-namespace-and-using/)）

26. 避免使用无限定调用，例如避免依赖 ADL 或者 ADL 两步法，改为使用限定调用

    理由：
    1. 无限定调用会增加查找范围，增加编译时间
    2. 无限定调用会启动 ADL，依赖 ADL 不利于维护，如果 ADL 查找到的函数在将来被错误修改，会使用错误的函数
    3. ADL 两步法会造成代码无法维护，在使用 ADL 两步法后，不能贸然删除 `using std::swap;` 以及将无限定调用改为限定调用
    4. 无限定调用有可能会因为函数遮蔽问题找不到正确实现，或者使用错误实现

27. 优先支持 STL 工具，而不是对 STL 进行重载或特化，例如增加成员函数 swap 以及实现移动以支持 `std::swap`

    理由：
    1. 给 STL 工具添加特化不利于维护
    2. 对 STL 函数增加重载通常是错误的

28. 使用只属于 global namespace 内变量及函数时加上 global 限定

    理由：
    1. 消除 `std` 和 global 同名名字的歧义
    2. 限定查找缩小了查找范围，加快编译速度

29. 使用大括号进行默认初始化而不是使用 0 进行值初始化

    理由：
    1. 只有基本类型使用可以使用 0 进行初始化
    2. 使用大括号初始化可以将 C 风格的结构体（聚合类）方便的初始化为空

    由于只有基本类型才能够使用 0 进行值初始化，非基本类型中的构造函数有可能有接受 0 的重载，但这通常导致无意义甚至错误的结果，例如 `std::basic_string` 的构造函数接受一个指针，但该指针不能为 0

    此外由于 C 没有简便方法对结构体中的所有成员初始化为空，并且结构体中有些成员可能当前无意义或未文档化，导致“按需”进行了不完全的初始化

30. 使用直接初始化而不使用[复制初始化](https://zh.cppreference.com/w/cpp/language/copy_initialization)

    理由：
    1. 复制初始化不考虑 `explicit` 构造函数
    2. 复制初始化期待目标类型，而直接初始化期待到目标类型的隐式转换，这使得复制初始化不考虑用户定义的转换函数

31. 如果函数确定不会抛异常，则添加 `noexcept` 修饰

    理由：
    1. `noexcept` 修饰使得编译器不用为此函数插入处理异常的代码，因此能减小二进制体积
    2. 由于标准目前未强制使得用户定义的移动构造不抛出异常，这使得在某些情况下必须有 `noexcept` 修饰才能使用移动构造（参考 [std::move_if_noexcept](https://zh.cppreference.com/w/cpp/utility/move_if_noexcept)）

32. 优先考虑通过显式 `this` 调用函数而不是隐含 `this`

    理由：
    1. 增强没有代码提示下的代码可读性

33. 考虑将 `private` 成员添加下划线后缀

    理由：
    1. 增强没有代码提示下的代码可读性
    2. 区分成员和非成员

34. 慎用 `reinterpret_cast` 和从字节流中隐式创造对象

    理由：
    1. 从字节流隐式创造对象可能创造未对齐的访问
    2. 使用 `reinterpret_cast` 可能创造指向未对齐对象的指针
    3. `reinterpret_cast` 通常来说是不必要的，应该由 `static_cast` 代替

    例如：

    假设存在函数 `void foo(int* i) { i = 0; }`，若传入参数为 `0xFFF0001` 这个地址，则在某些 CPU 上会产生硬件中断。原因为硬件指令可能要求读取和写入内存只能在 4 的整数倍地址上进行。即使某些 CPU 允许非对齐访问，但会造成效率降低

    通常来说编译器会进行基础的对齐保证，例如将所有类型为 x，且 `sizeof(!x<4)` 的变量的地址对齐到 4 字节和在结构体中填充额外位，例如 `struct S {int i; char c;};` 在 int 为 4 字节的情况下，`sizeof` 的结果是 8，这是由于在数组中，结构体对象是紧密排列的，若不在尾部进行填充，则会导致从第二个结构体开始出现非对齐的数据

    因此唯一能创造非对齐访问的情况下就是字节流中隐式的对象，以及经过 `reinterpret_cast` ，或者经过 `void*` 转换的指针，此时应该添加额外代码确保对象是对齐的，或者使用 `memcpy` 将对象重新装入满足对齐要求的缓冲区

35. 避免混用有符号/无符号类型进行算术运算（但允许在得有保证的情况下进行赋值）

    理由：
    1. C++ 中同样宽度的有符号整数和无符号整数进行算术运算时会提升到同样宽度的无符号数，将导致出现难以理解并且伴随 UB

    例如：

    ```cpp

    int x = -2;
	unsigned y = 1u;

	int c = x / y;
	long long d = x / y;

    ```

    假设 int 的宽度为 32 位，long long 的宽度为 64 位，则 c 通常被初始化为 -2，d 则是 4294967294

    这是由于 x 被提升为 unsigned 以和 y 进行计算，导致计算的结果是无符号的 4294967294，同时将无符号的 4294967294 赋值给 32 位有符号整数将得到 -2（存在 UB：溢出），但赋值给 64 位的有符号整数则得到原值 4294967294

36. 优先使用现有函数对象而不是随意定义 lambda

    理由：
    1. 使用具名对象可防止由于 lambda 符号的随机性使得模板产生额外的无法消除的函数实体

    例如：

    ```cpp

    #include <functional>
    #include <array>
    #include <algorithm>

    int main() {
        std::array arr1 = { 1,4,7,2,5,8 };
        auto arr2 = arr1;
        std::sort(arr1.begin(), arr1.end(), std::greater());
        std::sort(arr2.begin(), arr2.end(), [](int l, int r) noexcept {return l > r; });
    }

    ```

    两次 `std::sort` 调用虽然功能一致，但是由于 `std::greater<void>::operator()(int&, int&)` 和 `main::lambda(int, int)::opeartor()(int, int)` 是两个符号，使得 `std::sort<std::array<int>::iterator, iterator, T>` 中的 `T` 被处理为两个符号，导致 `std::sort` 被生成了两份相同但无法消除的代码，增大了二进制体积

    若标准库无法满足需求可定义其他具名 lambda，只有在确保 lambda 不会重复使用时才考虑使用匿名 lambda

37. 使用枚举创建新的整数类型而不是使用类型别名（C++17）

    理由：
    1. 枚举真正发明新的类型而不是类型别名
    2. 枚举避免了窄化转换更安全

    参考 C++ Reference 的枚举声明一节