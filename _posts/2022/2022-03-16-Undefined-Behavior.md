---
title: 浅谈 C++ Undefined Behavior
date: "2022-03-16 10:45:00"
tags: [C++,Standard]
category: blog
---

如果评比 C++ 中最隐秘的一个角落，那不会是 name mangling，不会是模板匹配规则，而是未定义行为。大部分人对于未定义行为都讳莫如深，但未定义也是 C++ 设计理念的一部分。作为一个半学术性质的语言，C++ 选择相信程序员，程序员应该充分了解 C++ 的语法规则。未定义行为的存在，使得编译器可以近乎任意的优化程序，而不用关心代码到底被编译成了何种硬件指令。基于此，C++ 可以写出最适合硬件的代码，进而被优化为最简单的指令。

本文是对知乎用户 [Lancern](https://www.zhihu.com/people/lancern) 的文章 [浅谈 C++ Undefined Behavior](https://zhuanlan.zhihu.com/p/391088391) 的转载。了解未定义行为不是目的，了解编译器行为才是。

<!-- more -->

最近我在知乎回答了一个有关 undefined behavior 的问题（知乎回答见[这里](https://www.zhihu.com/answer/1996085890)），这个问题以及这个回答的关注数量和获赞数量都远远超出了我对一个普通的 C++ 问题能获得的关注的预期。由此可见，虽然几乎人人都知道 C/C++ 中存在 undefined behavior 这个语言设计，但大部分开发人员并不清楚它实际的意义以及现代的编译器在处理包含 undefined behavior 的源程序时所使用的策略和手段。在本文中，我将尝试分别从 C++ 语言设计的角度以及现代编译器的角度，对 C++ 中的 undefined behavior 进行介绍和探讨。

## Undefined Behavior 到底是什么

为了给 undefined behavior 下一个准确的定义，以及弄清为什么几乎所有的系统级编程语言都有或多或少的 undefined behavior，我们需要补充一些编程语言设计的背景知识。

### Abstract Machine

几乎所有的高级编程语言，其最重要的核心设计之一便是语言中各个语言元素的语义（Semantics）。描述一个语言的语义主要有三种模型：operational semantics（操作语义）、denotational semantics（符号语义）以及 axiom semantics（公理语义）。对于现今绝大部分程序设计语言来说，它们的语言标准和规范都是采用 operational semantics 对语言的语义进行规定的，因为 operational semantics 最简单、且最符合大部分语言用户对“计算”这一过程的认知，C++ 也不例外。简单地来说，为了使用 operational semantics 描述语言的语义，我们需要首先抽象出一个 abstract machine，这一台 abstract machine 是一台虚拟的计算机，它的“机器代码”就是被描述的语言的源代码。也就是说，abstract machine 可以直接加载执行语言的源代码。operational semantics 则规定了，当 abstract machine 处在某个初始状态，并执行了被描述的语言中的某一条语句时，abstract machine 的最终状态应该是怎样的。换句话说，operational semantics 规定了 abstract machine 的状态转移关系。

### Language Implementation

从 abstract machine 的角度考虑，一个 C++ implementation 就是一组程序和软件包，这一组程序和软件包能够在真实的计算机上模拟出 abstract machine 执行源代码时的行为。通常，一个 implementation 包含全套的编译工具链、所有必须的标准库以及为了支撑 C++ 代码在宿主平台上运行所需的各种支持软件包。这些部件协同工作，将 C++ 源代码转换为宿主计算机能够直接运行的机器代码（编译），这一组机器代码将使得宿主计算机在执行它们时能够模拟出 C++ abstract machine 直接执行源代码时的行为。

### Well-defined Behavior, Implementation-defined Behavior, Unspecified Behavior, Undefined Behavior

C++ 标准中一共规定有四类 behavior，分别是 well-defined behavior 、implementation-defined behavior 、unspecified behavior 以及 undefined behavior。

well-defined behavior 很容易理解。它就是标准明确规定的所有的 C++ implementation 都需要实现和遵守的行为。从 abstract machine 的角度考虑，当 abstract machine 从初始状态开始，执行一个仅包含 well-defined behavior 的程序，最终 abstract machine 一定处于一个确定的、由标准明确规定的最终状态。

Implementation-defined behavior 在标准中的定义如下：

> \[defns.impl.defined\]  
> behavior, for a well-formed program construct and correct data, that depends on the implementation and that each implementation documents.

即，implementation-defined behavior 是那些标准没有明确规定、但要求每个 C++ implementation 必须在其文档中明确规定的行为。求值表达式 `sizeof(int)` 的结果就是一个典型的 implementation-defined behavior。从 abstract machine 的角度考虑，implementation-defined behavior 与 well-defined behavior 非常类似：当 abstract machine 从初始状态开始，执行完毕一个仅包含 well-defined behavior 和 implementation-defined behavior 的程序后，abstract machine 一定处于一个确定的、由 C++ implementation 的文档所明确指明的状态。Well-defined behavior 和 implementation-defined behavior 规定了 abstract machine 的确定性行为。

unspecified behavior 在标准中的定义如下：

> \[defns.unspecified\]  
> behavior, for a well-formed program construct and correct data, that depends on the implementation \[_Note_: The implementation is not required to document which behavior occurs. The range of possible behaviors is usually delineated by this International Standard. — _end note_\]

即，unspecified behavior 是那些标准没有明确规定、也不要求每个 C++ implementation 必须在其文档中明确规定的行为。但标准会规定一组可能的行为，unspecified behavior 的具体运行时行为只能是这一组可能的行为中的一个或多个。从 abstract machine 的角度考虑，unspecified behavior 规定了 abstract machine 的非确定性状态转移：abstract machine 从一个初始的状态开始，执行一个包含 unspecified behavior 的程序，abstract machine 的最终状态可能是标准所限定的若干最终状态中的一个。一个经典的 unspecified behavior 是表达式 `fun1() + fun2()` 的求值顺序：是先调用 `fun1` 函数还是先调用 `fun2` 函数，是 unspecified behavior。

最后，undefined behavior 在标准中的定义如下：

> \[defns.undefined\]  
> behavior for which this International Standard imposes no requirements.  
> \[_Note_: Undefined behavior may be expected when this International Standard omits any explicit definition of behavior or when a program uses an erroneous construct or erroneous data. Permissible undefined behavior ranges from ignoring the situation completely with unpredictable results, to behaving during translation or program execution in a documented manner characteristic of the environment (with or without the issuance of a diagnostic message), to terminating a translation or execution (with the issuance of a diagnostic message). Many erroneous program constructs do not engender undefined behavior; they are required to be diagnosed. Evaluation of a constant expression never exhibits behavior explicitly specified as undefined (8.20). — _end note_\]

即，undefined behavior 是那些标准没有明确规定、不要求每个 C++ implementation 在其文档中明确规定、且标准也没有对具体的 behavior 施加任何限制的行为。从 abstract machine 的角度考虑，undefined behavior 与 unspecified behavior 也类似，它规定了 abstract machine 的非确定性状态转移：abstract machine 从一个初始的状态开始，执行一个包含 undefined behavior 的程序，abstract machine 的最终状态可能是任何一个状态。标准没有对 abstract machine 的最终状态施加任何限制。经典的 undefined behavior 包括：数组索引越界、null pointer / dangling pointer 解引用、有符号整数上下溢等。

## 为什么存在 Undefined Behavior

为什么 C++ 标准需要规定 undefined behavior？为什么不事无巨细地在标准和 C++ implementation 中规定好所有行为，直接消灭掉 unspecified behavior 和 undefined behavior？

这个问题的答案是多方面的。

首先，abstract machine 只是一个假想的模型，但实际上的硬件 / 软件环境太多太多，在某个平台上的 well-defined behavior 可能是另一个平台上的 undefined behavior；相应地，语言的语义也就不存在一个适用于现实世界中所有运行环境的设计。举例来说，在大部分 CPU 上，有符号整数的溢出是一个 perfectly well-defined behavior；然而，在某些 CPU 芯片上，有符号整数的溢出却会导致 trap。再举一例，在绝大部分平台上，对空指针的解引用操作将会导致 trap；然而，在某些嵌入式平台上，对地址为 0 处的读写操作却是完全合法的操作。这些现实世界的平台的行为不一致性，导致 C++ 这样一门拥有直接操纵硬件能力的系统级编程语言的语义设计一定无法同时符合所有平台的原生行为；对于这些在不同的平台上存在严重分歧的行为， **特别是那些会在某些平台上导致 trap 的行为** ，C++ 将其设计为 undefined behavior，因为当发生 trap 后，程序进一步的行为将完全是未知的，完全取决于更底层的操作系统或硬件设计。

其次，再好的语言设计也无法保证其程序在关键数据损坏的前提下仍然拥有良好的、预期的行为。这里的数据损坏可能来自于程序内部，例如某些包含 bug 的程序产生了不符合要求的数据或破坏了已有的关键数据结构；也可能来自于程序外部，例如恶意攻击者恶意地注入了或修改了程序中的关键数据。例如，如果一个程序中的 use-after-free 的 bug 被触发导致某个对象的虚表指针被篡改，那么你不可能指望程序依然拥有预期的行为；再例如，如果两个类型完全不兼容的指针发生了 alias，那么同样你也不可能指望程序依然拥有预期的行为，因为使用其中一个指针的写操作将会导致使用另一个指针的读操作以某种不可预期的方式受到影响。又例如，即使是 Rust 这样类型系统十分强悍、编译期检查十分充分的语言，也定义了许多的 undefined behavior，其中最经典的便是 Rust 引用必须指向一个合法的且类型匹配的对象，不能为空、不能为 dangling reference。当在 Rust 程序内部因为 unsafe 代码的 bug，在 Rust 程序外部因为恶意的攻击导致某个引用是空时，Rust 也无法保证程序仍然按照预期的行为执行。因此，C++ 标准规定在数据受到损坏时，任何与损坏的数据发生交互的行为都是 undefined behavior。

另外，更高级的、完全没有 undefined behavior 的语言，其消灭 undefined behavior 的代价是限制语言的能力（例如不能直接读写内存、不能操作指针等），并辅以大量的编译期或运行期检查。然而，这两个代价中的任何一个都不可能被 C++ 所考虑：首先，C++ 是一门能够直接操控硬件的系统级编程语言，因此不能对其语言能力做过多的限制；其次，编译期和运行期检查永远不可能做到精确无误（soundness）和无一遗漏（completeness），一定会存在误报和漏报，还会严重影响编译时间和运行效率，这也是 C++ 不能容忍的。例如，检查数组索引是否越界需要额外存储数组的长度，并在每次访问数组时检查索引，这带来了时间和空间开销，不符合 C++ 的零开销抽象原则。再例如，检查指针是否 dangling 会消耗大量的内存和 CPU 时间，也无法保证检查出的 dangling 确实 dangling、无法保证没有 dangling pointer 被遗漏。在之后的一节我们将看到，有太多的 UB 是编译期 / 运行期检查所无法检查的。既然它们无法被精准无缺地检查，C++ 则干脆放任 undefined behavior 不管，不对存在 undefined behavior 的程序的行为进行任何限制。

最后，标准其实没有约束语言的实现如何处理 undefined behavior。这一自由让编译器实际上拥有了更强的对程序进行优化的能力。在下一节我们将看到，编译器可以建立一个完全符合标准要求的优化假设，这个优化假设将使编译器执行优化的能力大大提高。

综上所述，规定 undefined behavior 的原因归根结底就是 **现实世界太复杂了** 。Undefined behavior 是极度简洁的语言设计和极其复杂的真实世界之间的不可调和的矛盾的产物。

## 现代编译器对 Undefined Behavior 的处理方式

C++ 标准没有对 undefined behavior 的具体行为进行任何的限定，同时也没有对编译器处理 undefined behavior 的方式进行任何限定。在具体的实现上，现代编译器在编译程序源代码时一般不会考虑 undefined behavior 的影响；更激进地，编译器在执行优化时甚至会直接 **假定程序中的任何一条路径均不存在 undefined behavior** ，由此导致许多难以发现和调试的 bug。

下面，我将对于一些经典的 undefined behavior，通过举例的方式介绍编译器如何处理这些 undefined behavior。使用的编译器是 clang 10.0.0。

本节的许多例子来自于 CppCon 2016 的一个 talk，视频链接在[这里](https://link.zhihu.com/?target=https%3A//youtu.be/g7entxbQOCc)。

### 空指针解引用

这个例子来源于 gcc 源代码中的一个 bug。考虑如下代码：

```cpp

void foo();

void bar(int *ptr) {
  *ptr = 0;
  if (!ptr) {
    foo();
  }
}


```

显然， `if` 检查与向 `ptr` 指向的整数赋值两个操作的顺序被弄反了。当不开启优化编译时，编译器生成如下代码：

```asm

_Z3barPi: # @_Z3barPi
  pushq %rbp
  movq %rsp, %rbp
  subq $16, %rsp
  movq %rdi, -8(%rbp)
  movq -8(%rbp), %rax
  movl $0, (%rax)
  cmpq $0, -8(%rbp)
  jne .LBB0_2
  callq _Z3foov
.LBB0_2:
  addq $16, %rsp
  popq %rbp
  retq

```

可以看到编译器生成的代码与源代码是对应的；但一旦开启优化（ `-O1` ），编译器将生成如下代码：

```asm

_Z3barPi: # @_Z3barPi
  movl $0, (%rdi)
  retq

```

可以看到，整个 `if` 块已经被完全移除。这是因为，编译器看到程序中对 `ptr` 进行了解引用操作，由此判定 `ptr` 不可能为空指针，否则将产生 UB；利用这个知识，编译器得以完全移除后面的 `if` 块。

### 解引用已经 remalloc 的指针

考虑如下例子：

```cpp

int foo(int *ptr, size_t size) {
  auto realloc_ptr = reinterpret_cast<int *>(realloc(ptr, size * 2));
  
  *ptr = 10;
  *realloc_ptr = 20;

  return *ptr;
}

```

请思考，在开启编译优化时，编译器会不会将 `return *ptr` 直接优化为 `return 10` 。

乍一看可能会认为编译器不能执行这个优化。因为 `ptr` 和 `realloc_ptr` 可能会 alias（即指向同一个 `int` ），这时 `return` 的值将不是 10 而是 20。

来看编译器生成的代码：

```asm

_Z3fooPim: # @_Z3fooPim
  pushq %rbx
  movq %rdi, %rbx
  addq %rsi, %rsi
  callq realloc
  movl $10, (%rbx)
  movl $20, (%rax)
  movl $10, %eax   ; Here!
  popq %rbx
  retq

```

可以看到，编译器很自信地将 `return *ptr` 优化为了 `return 10` 。究其原因，是因为当 `realloc` 在不能在原址处重新分配一个指定大小的内存区域时， `realloc` 会在别处重新分配一块内存区域，并 `free` 原先的内存块。此时， `ptr` 将变为一个 dangling pointer；对 `ptr` 的解引用将成为一个 UB。为了理解编译器为什么能够分析出来这一点并完成优化，我们不妨再看看编译器生成的 IR：

```ir

define dso_local i32 @_Z3fooPim(i32* nocapture %0, i64 %1) local_unnamed_addr #0!dbg !225 {
  call void @llvm.dbg.value(metadata i32* %0, metadata !230, metadata !DIExpression()), !dbg !233
  call void @llvm.dbg.value(metadata i64 %1, metadata !231, metadata !DIExpression()), !dbg !233
  %3 = bitcast i32* %0 to i8*, !dbg !234
  %4 = shl i64 %1, 1, !dbg !235
  %5 = call i8* @realloc(i8* %3, i64 %4) #3, !dbg !236
  %6 = bitcast i8* %5 to i32*, !dbg !237
  call void @llvm.dbg.value(metadata i32* %6, metadata !232, metadata !DIExpression()), !dbg !233
  store i32 10, i32* %0, align 4, !dbg !238, !tbaa !239
  store i32 20, i32* %6, align 4, !dbg !243, !tbaa !239
  ret i32 10, !dbg !244
}

declare dso_local noalias i8* @realloc(i8* nocapture, i64) local_unnamed_addr #1

```

我们重点关注 `realloc` 函数的声明。注意 `realloc` 函数的返回值类型声明为 `noalias i8*` ，其中的 `noalias` 前缀指明了 `realloc` 函数返回的指针不可能与其他任何的指针 alias。因此，编译器在后续的过程中可以大胆推断 `realloc_ptr` 与 `ptr` 不可能 alias，从而完成我们看到的优化。

### 有符号整数溢出

考虑如下代码：

```cpp

void foo();

void bar_signed() {
  for (int i = 1; i >= 1; ++i) {
    foo();
  }
}

void bar_unsigned() {
  for (unsigned i = 1; i >= 1; ++i) {
    foo();
  }
}
    
```

`bar_signed` 函数和 `bar_unsigned` 函数的唯一区别在于循环变量 i 的类型是否为有符号类型。在我们看来，这两个 `for` 循环都不是死循环：循环变量最终都会上溢，上溢后的值将 wrap around 到对应类型的最小值，届时循环条件将不再满足。

编译器在开启优化的情况下将生成如下的代码：

```asm

_Z10bar_signedv: # @_Z10bar_signedv
  pushq %rax
.LBB0_1: # =>This Inner Loop Header: Depth=1
  callq _Z3foov
  jmp .LBB0_1

_Z12bar_unsignedv: # @_Z12bar_unsignedv
  pushq %rbx
  movl $-1, %ebx
.LBB1_1: # =>This Inner Loop Header: Depth=1
  callq _Z3foov
  addl $-1, %ebx
  jne .LBB1_1
  popq %rbx
  retq

```

可以看到，编译器直接将 `bar_signed` 中的 `for` 循环优化为了死循环，然而却没有相应地优化 `bar_unsigned` 中的循环。这是因为有符号整数的溢出是 UB，而无符号溢出是 well-defined behavior。由于有符号整数的溢出是 UB，因此编译器假定有符号版本的 `i` 永不溢出，进而推断出循环条件恒成立；由于无符号整数的溢出是 well-defined behavior，因此编译器知道无符号版本的 `i` 将最终发生上溢并导致循环条件不再成立。

### Strict Aliasing Rule

考虑如下代码：

```cpp

int64_t foo(int32_t *lhs, int64_t *rhs) {
  *lhs = 10;
  *rhs = 20;
  return *lhs + *rhs;
}

```

与之前某一节的问题一样，请思考编译器能否将 `return *lhs + *rhs` 直接优化为 `return 30` 。我们可能会认为， `lhs` 与 `rhs` 可能会 alias；此时的返回值将是 40 而不是 30。

编译器生成的代码如下：

```asm

_Z3fooPiPl: # @_Z3fooPiPl
  movl $10, (%rdi)
  movq $20, (%rsi)
  movl $30, %eax
  retq

```

编译器非常自信地直接将返回值优化为常量 30。这是因为 C++ 的 strict aliasing rule：简单地来讲，对于两个指针类型 `T1 *` 与 `T2 *` ，如果 `T1` 与 `T2` 在去除 cv-qualification 后是不兼容的类型并且 `T1` 与 `T2` 都不是 `char` 、 `signed char` 或 `unsigned char` 类型，那么这两个指针类型的实例禁止发生 alias，否则将产生 UB。在这里，编译器看到 `lhs` 的类型是 `int32_t *` ， `rhs` 的类型是 `int64_t *` ，而 `int32_t` 与 `int64_t` 这两个类型并不兼容，因此判定 `lhs` 与 `rhs` 不可能 alias，进而完成优化。

### 使用未初始化的变量

考虑如下代码：

```cpp

int foo(bool flag) {
  int a;
  if (flag) {
    a = 10;
  }
  return a;
}

```

当 `flag` 为 `false` 时，局部变量 `a` 在 `return` 时将没有得到初始化，产生一个 UB。

编译器生成的代码如下：

```asm

_Z3foob: # @_Z3foob
  movl $10, %eax
  retq

```

由于当 `flag` 为 `false` 时会导致 UB，因此编译器直接假定 `flag` 为 `true` ，进而将代码优化为上述形式。

### 死递归

考虑如下代码：

```cpp

int foo(bool flag) {
  if (flag) {
    return foo(flag);
  }
  return 10;
}

```

当 `flag` 为 `true` 时，代码将进入死递归，产生一个 UB。编译器会生成如下代码：

```asm

_Z3foob: # @_Z3foob
  movl $10, %eax
  retq

```

类似地，既然 `flag` 为 `true` 时会产生死递归，那么编译器直接假定 `flag` 恒为 `false` ，进而优化产生上述代码。

### 没有副作用的死循环

下面的代码在 C++ 社区内是一个非常著名的 meme，用于展示 C++ 编译器“可以”证伪费马大定理（请读者自觉不信谣不传谣）：

```cpp

bool TryDisproveFermatTheorem() {
  constexpr int MAXN = 1e9;
  
  int a = 1;
  int b = 1;
  int c = 1;
  
  while (true) {
    if (a*a*a + b*b*b == c*c*c) {
      // We have disproved Fermat's big theorem!
      return true;
    }

    ++c;
    if (c > MAXN) {
      c = 1;
      ++b;
    }
    if (b > MAXN) {
      b = 1;
      ++a;
    }
    if (a > MAXN) {
      a = 1;
    }
  }

  return false;
}
    
```

可以看到，编译器直接将 `TryDisproveFermatTheorem` 函数优化为了一条 `return 1`，这说明编译器已经在编译期自己证伪了费马大定理（不是）。编译器做这个优化的原理是：首先推断出 `return false` 语句不可达，因为 `while (true)` 这一循环不可能退出；然后，编译器发现整个函数中只有一条 `return true` 语句能够从函数返回、且整个函数没有副作用（没有读写全局变量、没有调用存在副作用的函数），因此编译器直接将整个函数优化为一条 `return true` 语句。这个代码中存在的 UB 是 `while (true)` 循环是死循环但是其循环体却没有任何副作用。

### 控制流到达返回值不为 `void` 的函数的末尾

考虑如下代码：

```cpp

void foo();

int bar() {
  for (int i = 0; i < 10; ++i) {
    foo();
  }
}

```

我们可能会认为，由于 `bar` 函数中的 `for` 循环不是死循环，因此 `bar` 函数最终会返回，但是其返回值是一个不确定的值。

编译器在开启优化的情况下，会生成如下的代码：

```asm

_Z3barv: # @_Z3barv
  pushq %rbx
  xorl %ebx, %ebx
.LBB0_1: # =>This Inner Loop Header: Depth=1
  callq _Z3foov
  addl $1, %ebx
  jmp .LBB0_1

```

出乎意料地，编译器直接将 `bar` 中的循环优化为了一个死循环。编译器的理由是，如果 `bar` 中的 `for` 循环退出，那么控制流将到达 `bar` 函数的末尾，而 bar 函数的返回值类型不为 `void` ，因此这是一个 UB。编译器假定 UB 不可能在程序的任何一条路径中出现，因此反推出 `bar` 中的 `for` 循环不可能退出，进而将 `bar` 中的 `for` 循环优化为死循环。

## 编译器处理 Undefined Behavior 的方式与 C++ 的设计理念

由于标准并没有对具体实现应该如何处理 undefined behavior 进行任何限制，因此任何处理方式都是符合标准要求的，假定程序中不包含 undefined behavior 也符合这一要求。因此，编译器利用 undefined behavior 形成的这一优化假设是合理的、符合标准的。

然而，有不少人质疑编译器在处理上一节中最后一个例子时的方法是否妥当。在这个例子中，编译期没有考虑源代码中真正编写的循环条件，而仅凭 undefined behavior 不应该发生这一优化假设，就将 `bar` 函数中的 `for` 循环优化为了一个死循环。许多人质疑，为什么 C++ 编译器不明确报告一个编译错误，提示用户 `bar` 在没有指定返回值的情况下控制流就已经到达了函数末尾。毕竟，在几乎其他任何一门现代的高级编程语言中，类似的代码一定会被编译器拒绝编译。

编译器这样的处理方式体现出了 C++ 的设计理念中最核心的几点之一：要 100% 地相信人类程序员，相信他们会写出良好的代码。在这样的设计理念引导下，只要标准没有明确要求编译器必须拒绝某段代码，则编译器一定会接受这段代码并完成编译任务。由于标准没有明确规定，当控制流到达一个返回值类型不为 `void` 的函数的末尾时编译器必须报错，因此编译器能够成功编译这样的代码。

当然，编译器也完全可以拒绝编译这样的代码，这样处理同样符合 C++ 标准。但所有主流的 C++ 编译器均没有选择这样的实现方式。前文已经提到，编译器在编译期静态检测 UB 是不 sound 也不 complete 的，因此不论怎样的处理方式，都会导致某些不存在 UB 的代码被拒绝编译、某些存在 UB 的代码通过编译。其他语言选择相信机器，只要可能有 UB 就拒绝编译；主流 C++ 编译器选择相信人类，需要人类来保证“确实没有 UB”。
