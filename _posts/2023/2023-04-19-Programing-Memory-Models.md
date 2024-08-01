---
layout: post
title: Programming Language Memory Models
date: "2023-04-19 19:45:00"
tags: [C++,C]
categories: [blog]
---
这是 Go 语言现任领队 Russ Cox 在 2021 年写的文章 [Programming Language Memory Models](https://research.swtch.com/plmm) 的翻译。

本文是第二篇，重点阐述了 C++ 和 Java 对内存模型设计的历史，以及 ECMAScript 2017 的初步尝试。

<!-- more -->

# 编程语言内存模型

（_内存模型，第二部分_）

发布于 2021 年 7 月 6 日星期二。

* toc
{:toc}

编程语言内存模型回答了并行程序可以依赖哪些行为在其线程之间共享内存的问题。例如，考虑这个类似 C 语言的程序，其中 `x` 和 `done` 初始值为 0。

```c

// Thread 1           // Thread 2
x = 1;                while(done == 0) { /* loop */ }
done = 1;             print(x);

```

程序尝试将 `x` 中的消息从线程 1 发送到线程 2，使用 `done` 作为消息已准备好接收的信号。如果线程 1 和线程 2 各自在自己的专用处理器上运行，都运行到完成，则此程序是否保证按预期完成并打印 1？编程语言内存模型回答了这个问题和其他类似的问题。

尽管每种编程语言在细节上有所不同，但基本上所有现代多线程语言（包括 C，C++，Go，Java，JavaScript，Rust 和 Swift）都有一些通用答案：

* 首先，如果 `x` 和 `done` 是普通变量，那么线程 2 的循环可能永远不会停止。常见的编译器优化是在变量首次使用时将其加载到寄存器中，然后尽可能长时间地重用该寄存器以供将来访问该变量。如果线程 2 在线程 1 执行之前将 `done` 复制到寄存器中，则它可能会在整个循环中继续使用该寄存器，而不会注意到线程 1 稍后修改了 `done`。
* 其次，即使线程 2 的循环确实停止，在观察到 `done == 1` 之后，它仍然可能打印出 `x` 为 0。编译器通常根据优化启发式方法重新排序程序读取和写入，甚至只是基于生成代码时最终遍历哈希表或其他中间数据结构的方式。线程 1 的编译代码可能最终在“完成”而不是“之前”之后写入 `x` ，或者线程 2 的编译代码可能最终在循环之前读取 `x` 。

在给出程序破坏的原因后，重点是如何修复它。

现代语言以 _原子变量_ 或 _原子操作_ 的形式提供特殊功能，以允许程序同步其线程。如果我们使`done`成为原子变量（或使用原子操作，在采用该方法的语言中操作它），那么我们的程序可以保证完成并打印 1。使 `done` 原子具有许多效果：

* 线程 1 编译的代码必须确保对 `x` 的写入已完成，并且在写入 `done` 变得可见之前对其他线程可见。
* 线程 2 编译的代码必须在循环的每次迭代中（重新）读取 `done`。
* 线程 2 编译的代码必须在从 `done` 读取后从 `x` 读取。
* 编译的代码必须执行任何必要的操作来禁用可能重新引入任何这些问题的硬件优化。

使 `done` 原子化的最终结果是程序按照我们想要的方式运行，成功地将 `x` 中的值从线程 1 传递到线程 2。

在原始程序中，在编译器的代码重新排序之后，线程 1 可能在线程 2 读取它的同时写入 `x`。这是一个 _数据竞争_。在修订后的程序中，原子变量  `done` 用于同步对 `x` 的访问：现在线程 1 不可能在线程 2 读取它的同时写入 `x`。该程序 _无数据竞争_。一般来说，现代语言保证无数据争用的程序始终以顺序一致的方式执行，就好像来自不同线程的操作任意但不重新排序地交错到单个处理器上。这是在编程语言上下文中采用的 [硬件内存模型中的 DRF-SC 属性](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/#drf)。

顺便说一句，这些原子变量或原子操作更合适地称为“同步原子”。确实，这些操作在数据库意义上是原子的，允许同时读取和写入，其行为就像按某种顺序顺序运行：普通变量上的竞争在使用原子时不是竞争。但更重要的是，原子同步程序的其余部分，提供一种消除非原子数据竞争的方法。不过，标准术语是简单的“原子”，所以本文也这么使用。除非另有说明，请记住将“原子”理解为“同步原子”。

编程语言内存模型指定了程序员和编译器所需内容的确切细节，作为它们之间的契约。上面概述的一般特征基本上适用于所有现代语言，但直到最近，事情才趋于一致：在 2000 年代初期，变化明显更多。即使在今天，不同语言在二阶问题上也存在显着差异，包括：

* 原子变量本身的顺序保证是什么？
* 一个变量可以被原子操作和非原子操作访问吗？
* 除了原子之外还有同步机制吗？
* 是否存在不同步的原子操作？
* 带有种族的节目有任何保证吗？

经过一些准备工作后，本文的其余部分将研究不同的语言如何回答这些问题和相关问题，以及它们实现这一目标所采取的路径。本文还强调了这一过程中的许多错误开始，以强调我们仍然在很大程度上了解什么有效，什么无效。

## [硬件，Litmus 测试，先发生于和 DRF-SC](#hw)

在我们了解任何特定语言的详细信息之前，我们需要记住[硬件内存模型](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/)的经验教训的简要总结。

不同的体系结构允许不同数量的指令重新排序，因此在多个处理器上并行运行的代码可以根据体系结构具有不同的允许结果。黄金标准是[顺序一致性](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/#sc)，其中任何执行都必须表现得好像在不同处理器上执行的程序只是以某种顺序交错到单个处理器上。该模型对于开发人员来说更容易推理，但目前还没有重要的架构提供它，因为较弱的保证带来了性能提升。

It is difficult to make completely general statements comparing different memory models. Instead, it can help to focus on specific test cases, called _litmus tests_. If two memory models allow different behaviors for a given litmus test, this proves they are different and usually helps us see whether, at least for that test case, one is weaker or stronger than the other. For example, here is the litmus test form of the program we examined earlier:

比较不同的内存模型很难做出完全通用的陈述。相反，它可以帮助您专注于特定的测试用例，称为 _litmus 测试_。如果两个记忆模型对于给定的 litmus 测试允许不同的行为，这证明它们是不同的，并且通常可以帮助我们了解至少对于该测试用例，一个模型是否比另一个更弱或更强。例如，这是我们之前检查的程序的 litmus 测试形式：

> _Litmus 测试：消息传递_
>
> 这个程序能观测到 `r1 = 1`，`r2 = 0` 吗？

```c

// Thread 1           // Thread 2
x = 1                 r1 = y
y = 1                 r2 = x

```

> 在顺序一致的硬件上：否。
>
> 在 x86（或其他 TSO）上：否。
>
> 在 ARM/POWER 上：_是！_
>
> 在任何使用普通变量的现代编译语言中：_是！_

与上一篇文章一样，我们假设每个示例都以所有共享变量初始值都为 0。名称 `r`_N_ 表示私有存储，如寄存器或函数局部变量；其他名称如 `x` 和 `y` 是不同的、共享的（全局）变量。我们询问在执行结束时是否可以对寄存器进行特定设置。在回答硬件的 litmus 测试时，我们假设没有编译器来重新排序线程中发生的事情：列表中的指令直接转换为提供给处理器执行的汇编指令。

结果 `r1 = 1`、`r2 = 0` 对应于原始程序的线程 2 完成其循环（`done` 是 `y`），但随后打印 0。在程序操作的任何顺序一致交错中都不可能出现此结果。对于汇编语言版本，在 x86 上不可能打印 0，但由于处理器本身的重新排序优化，在 ARM 和 POWER 等更宽松的体系结构上可以打印 0。在现代语言中，无论底层硬件是什么，编译期间可能发生的重新排序都使得这种结果成为可能。

正如我们前面提到的，今天的处理器不是保证顺序一致性，而是保证一个称为[“无数据争用顺序一致性”或 DRF-SC](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/#drf)（有时也写为 SC-DRF）的属性。保证 DRF-SC 的系统必须定义称为 _同步指令_ 的特定指令，它提供了一种协调不同处理器（相当于线程）的方法。程序使用这些指令在一个处理器上运行的代码与另一个处理器上运行的代码之间创建“先发生于”关系。

例如，这里描述了一个程序在两个线程上的短暂执行；像往常一样，假设每个都位于其自己的专用处理器上：

![](mem-adve-4.png)

我们在上一篇文章中也看到了这个程序。线程1和线程2执行同步指令 S\(a\)。在程序的这个特定执行中，两条 S\(a\) 指令建立了从线程 1 到线程 2 的 happens-before 关系，因此线程 1 中的 W\(x\) 先发生于线程 2 的 R\(x\)。

不同处理器上按 happens-before 排序的两个事件可能同时发生：确切顺序尚不清楚。我们说他们 _并发_ 执行。数据争用是指对变量的写入与对该变量的读取或另一次写入同时执行。提供 DRF-SC 的处理器（现在的所有处理器）保证程序 _没有_ 数据竞争的行为，就像它们在顺序一致的架构上运行一样。这是在现代处理器上编写正确的多线程汇编程序的基本保证。

正如我们之前看到的，DRF-SC也是现代语言所采用的基本保证，使得用高级语言编写正确的多线程程序成为可能。

## [编译器和优化](#compilers)

我们已经多次提到，编译器可能会在生成最终可执行代码的过程中对输入程序中的操作重新排序。让我们仔细看看该声明以及其他可能导致问题的优化。

人们普遍认为，编译器可以几乎任意地对普通的读取和写入进行重新排序，前提是重新排序不能改变单线程执行时代码的可见行为。例如，考虑以下程序：

```c

w = 1
x = 2
r1 = y
r2 = z

```

由于 `w`、`x`、`y` 和 `z` 都是不同的变量，因此这四个语句可以按照编译器认为的最佳任何顺序执行。

正如我们上面提到的，如此自由地重新排序读取和写入的能力使得普通编译程序的保证至少与 ARM/POWER 宽松内存模型一样弱，因为编译程序无法通过消息传递 litmus 测试。事实上，对已编译程序的保证较弱。

在硬件文章中，我们将一致性作为 ARM/POWER 架构保证的一个例子：

> _Litmus 测试：一致性_
>
> 这个程序能观察到 `r1 = 1`, `r2 = 2`, `r3 = 2`, `r4 = 1` 吗？
>
> （线程 3 能在 `x = 1` 在 `x = 2` 之前，并且线程 4 看到相反的结果吗？）

```c

// Thread 1    // Thread 2    // Thread 3    // Thread 4
x = 1          x = 2          r1 = x         r3 = x
                              r2 = x         r4 = x

```

> 在顺序一致的硬件上：否。
>
> 在 x86 上（或其他 TSO）：否。
>
> 在 ARM/POWER 上：否。
>
> 在任何使用普通变量的现代编译语言中： _是！_

所有现代硬件都保证了一致性，这也可以看作是单个内存位置上操作的顺序一致性。在这个程序中，其中一个写入必须覆盖另一个，整个系统必须同意一个固定顺序。事实证明，由于编译过程中的程序重新排序，现代语言甚至不提供一致性。

假设编译器对线程 4 中的两个读取重新排序，然后指令按以下顺序交错运行：

```c

// Thread 1    // Thread 2    // Thread 3    // Thread 4
                                             // \(reordered\)
\(1\) x = 1                     \(2\) r1 = x     \(3\) r4 = x
               \(4\) x = 2      \(5\) r2 = x     \(6\) r3 = x

```

结果是 `r1 = 1`，`r2 = 2`，`r3 = 2`，`r4 = 1`，这在汇编程序中是不可能的，但在高级语言中是可能的。从这个意义上说，编程语言内存模型都比最宽松的硬件内存模型弱。

但还有一些保证。每个人都同意需要提供 DRF-SC，这不允许引入新读取或写入的优化，即使这些优化在单线程代码中有效。

例如，请考虑以下代码：

```c

if (c) {
	x++;
} else {
	... lots of code ...
}

```

有一个 `if` 语句，`else` 中有很多代码，而 `if` 主体中只有一个 `x++`。减少分支并完全消除 `if` 主体可能会更“便宜”。我们可以通过在 `if` 之前运行 `x++` 来做到这一点，然后如果我们错了，则在大的 else 主体中使用 `x--` 进行调整。也就是说，编译器可能会考虑将该代码重写为：

```c

x++;
if (!c) {
	x--;
	... lots of code ...
}

```

这是安全的编译器优化吗？在单线程程序中，是的。在多线程程序中，当 `c` 为 false 时，`x` 与另一个线程共享，否：优化会在 `x` 上引入原始程序中不存在的竞争。

此示例源自 Hans Boehm 2004 年的论文中的一个，“[线程不能作为库实现](https://www.hpl.hp.com/techreports/2004/HPL-2004-209.pdf)”，这使得语言不能对多线程执行的语义保持沉默。

编程语言内存模型试图准确回答这些问题：哪些优化是允许的，哪些是不允许的。通过研究过去几十年来尝试编写这些模型的历史，我们可以了解哪些有效，哪些无效，并了解事情的发展方向。

## [原始的 Java 内存模型（1996）](#java96)


Java 是第一个尝试写下它对多线程程序的保证的主流语言。它包括互斥体并定义了它们隐含的内存排序要求。它还包括“易失性”原子变量：所有易失性变量的读写都需要直接在主内存中按程序顺序执行，使得对易失性变量的操作以顺序一致的方式表现。最后，Java 还指定了（或至少尝试指定）具有数据竞争的程序的行为。其中一部分是要求普通变量具有某种形式的一致性，我们将在下面详细讨论。不幸的是，这种尝试在[_Java语言规范_（1996）](http://titanium.cs.berkeley.edu/doc/java-langspec-1.0.pdf)第一版中至少有两个严重的问题缺陷。通过事后诸葛亮和使用我们已经设定的预备知识，它们很容易解释。当时，它们远没有那么明显。

### [原子需要同步](#atomics)

第一个缺陷是易失性原子变量是非同步的，因此它们无助于消除程序其余部分中的竞争。我们上面看到的消息传递程序的 Java 版本是：

```java

int x;
volatile int done;

// Thread 1           // Thread 2
x = 1;                while\(done == 0\) \{ /\* loop \*/ \}
done = 1;             print\(x\);

```

因为 `done` 被声明为易失性，所以保证循环完成：编译器无法将其缓存在寄存器中并导致无限循环。但是，程序不保证打印 1。不禁止编译器重新排序对 `x` 和 `done` 的访问，也不需要禁止硬件执行相同的操作。

由于 Java 易失性是非同步原子，因此您无法使用它们来构建新的同步原语。从这个意义上说，原始的 Java 内存模型太弱了。

### [一致性与编译器优化不兼容](#coherence)

原始的 Java 内存模型也太强大了：强制一致性——一旦线程读取了内存位置的新值，它就不能再读取旧值了——不允许进行基本的编译器优化。之前我们研究了重新排序读取会如何破坏一致性，但您可能会想，好吧，只是不要重新排序读取。这是另一种优化可能会破坏一致性的更微妙的方式：公共子表达式消除。

考虑如下 Java 程序：

```java

// p 和 q 可能指向同一个对象，也可能不指向同一个对象。
int i = p.x;
// ...也许此时另一个线程写入 p.x...
int j = q.x;
int k = p.x;

```

在此程序中，公共子表达式消除会注意到 `p.x` 被计算了两次，并将最后一行优化为 `k = i` 。但是，如果 `p` 和 `q` 指向同一个对象，并且另一个线程在读取 `i` 和 `j` 之间写入 `p.x` ，则将旧值 `i` 重用于 `k` 会违反一致性：读入 `i` 时看到旧值，读入 `j` 时看到较新的值，但随后重用 `i` 读入 `k` 时将再次看到旧值。无法优化掉冗余读取会阻碍大多数编译器，使生成的代码变慢。

硬件比编译器更容易提供一致性，因为硬件可以应用动态优化：它可以根据给定内存读取和写入序列中涉及的确切地址调整优化路径。相比之下，编译器只能应用静态优化：他们必须提前写出一个指令序列，无论涉及什么地址和值，这个指令序列都是正确的。在该示例中，编译器无法根据 `p` 和 `q` 是否碰巧指向同一对象来轻松更改发生的情况，至少在不为这两种可能性编写代码的情况下不会，从而导致大量的时间和空间开销。编译器对内存位置之间可能的混叠的了解不完整，这意味着实际提供一致性需要放弃基本的优化。

Bill Pughn 在1999年的论文中指出了这个问题和其他问题 “[修复 Java 内存模型](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.17.7914&rep=rep1&type=pdf)。”

## [新的 Java 内存模型（2004）](#java04)

由于这些问题，而且原始的 Java 内存模型即使对于专家来说也很难理解，Pugh 和其他人开始努力为 Java 定义一个新的内存模型。该模型成为 JSR-133，并在 2004 年发布的 Java 5.0 中采用。规范参考文献是“[Java 内存模型](http://rsim.cs.uiuc.edu/Pubs/popl05.pdf)”（2005），作者：Jeremy Manson、Bill Pugh 和 Sarita Adve，其他详细信息请参见 [Manson 博士的论文](https://drum.lib.umd.edu/bitstream/handle/1903/1949/umi-umd-1898.pdf;jsessionid=4A616CD05E44EA7D47B6CF4A91B6F70D?sequence=1)。新模型遵循 DRF-SC 方法：保证无数据竞争的 Java 程序以顺序一致的方式执行。

### [同步原子和其他操作](#sync)

正如我们之前看到的，要编写一个无数据竞争的程序，程序员需要可以建立“先发生于”边缘的同步操作，以确保一个线程不会同时写入非原子变量，而另一个线程读取或写入它。在 Java 中，主要的同步操作是：

* 线程的创建先发生于线程中的第一个操作。
* 对互斥锁 _m_ 的解锁先发生于任何后续对 _m_ 的上锁。
* 一个对易失性变量 _v_ 的写先发生于任何后续对 _v_ 的读。

“后续”是什么意思？Java 定义所有锁定、解锁和易失性变量访问的行为就像它们在某种顺序一致的交错中发生一样，从而对整个程序中的所有这些操作给出总顺序。“后续”是指该总顺序中的稍后。也就是说：锁定、解锁和易失性变量访问的总顺序定义了后续的含义，然后使用特定执行中的 happens-before 边缘定义后续，然后先发生于边缘定义该特定执行是否具有数据争用。如果没有争用，则执行的行为是顺序一致的。

易失性访问必须像在存在某些总排序一样运行，这意味着在 [存储缓冲区 litmus 测试](https://mysteriouspreserve.com/blog/2023/04/19/Hardware-Memory-Model-zh/#x86) 中，不能以 `r1 = 0` 和 `r2 = 0` 结束：

> _Litmus 测试：储存缓冲区_
>
> 这个程序能观测到 `r1` `=` `0`, `r2` `=` `0` 吗？

```java

// Thread 1           // Thread 2
x = 1                 y = 1
r1 = y                r2 = x

```

> 在顺序一致的硬件上：否。
>
> 在 x86（或其他 TSO）：_是！_
>
> 在 ARM/POWER：_是！_
>
> 在 Java 中使用 volatiles：否。

在 Java 中，对于易失变量 `x` 和 `y`，读取和写入不能重新排序：一个写入必须排在第二个位置，第二个写入之后的读取必须看到第一个写入。如果我们没有顺序一致的要求——比如说，如果易失性只需要连续——那么这两个读取可能会错过写入。

这里有一个重要但微妙的点：所有同步操作的总顺序与 happens-before 的关系是分开的。在程序中的每个锁定、解锁或易失性变量访问之间，在一个方向或另一个方向上存在一个 happens-before 边缘 _不是_ 真的：你只能从写入到观察写入的读取获得一个 happens-before 边缘。例如，不同互斥锁的锁定和解锁在它们之间没有 happens-before 边缘，不同变量的易失性访问也没有，即使这些操作必须共同表现得像遵循单个顺序一致的交错一样。

### [程序的竞争语义](#racy)

DRF-SC 仅保证程序的行为顺序一致，没有数据竞争。与原始模型一样，新的 Java 内存模型定义了有竞争的程序的行为，原因如下：

* 支持 Java 的一般安全和安全保证。
* 使程序员更容易发现错误。
* 使攻击者更难利用问题，因为竞争可能造成的损害更加有限。
* 让程序员更清楚地了解他们的程序是做什么的。

新模型不再依赖于连续性，而是重用了先发生于关系（已经用于确定程序是否有竞争）来决定竞争读取和写入的结果。

Java 的具体规则是，对于字大小或更小的变量，读取变量（或字段） _x_ 必须看到通过对 _x_ 的单个写入来存储的值。对 _x_ 的写入可以通过读取 _r_ 来观察，前提是 _r_ 不会在 _w_ 之前发生。这意味着 _r_ 可以观察在 _r_ 之前发生的写入（但也不会在 _r_ 之前被覆盖），并且可以观察与 _r_ 竞争的写入。

以这种方式使用先发生于，结合同步原子（volatiles）可以建立新的先发生于边缘，是对原始 Java 内存模型的重大改进。它为程序员提供了更有用的保证，并且最终允许大量重要的编译器优化。这项工作仍然是今天 Java 的内存模型。也就是说，它仍然不太正确：这种试图使用先发生于定义竞争程序的语义存在问题。

### [先发生于不排除不连续](#incoherence)

使用先发生于定义程序语义的第一个问题与连续性有关（再次！）。（下面的例子取自 Jaroslav Ševčík 和David Aspinall 的论文，“[关于 Java 内存模型中程序转换的有效性](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.112.1790&rep=rep1&type=pdf)” \(2007\)。）

这是一个包含三个线程的程序。假设已知线程 1 和线程 2 在线程 3 开始之前完成。

```java

// Thread 1           // Thread 2           // Thread 3
lock(m1)              lock(m2)
x = 1                 x = 2
unlock(m1)            unlock(m2)
                                            lock(m1)
                                            lock(m2)
                                            r1 = x
                                            r2 = x
                                            unlock(m2)
                                            unlock(m1)

```

线程 1 在持有互斥锁 `m1` 时写入 `x = 1`。线程 2 在持有互斥锁 `m2` 的同时写入 `x = 2`。这些是不同的互斥体，所以两者写竞争。但是，只有线程 3 读取 `x`，并且在获取两个互斥体后读取。读入 `r1` 可以观测到任一写入：两者都先发生于它，并且都不会明确覆盖另一个。通过相同的参数，读入`r2` 可以观测到任一写入。但严格来说，Java 内存模型中没有任何内容表明两个读取必须一致：从技术上讲，`r1` 和 `r2` 可以读取不同的 `x` 值。也就是说，该程序可以以 `r1` 和 `r2` 结束，保持不同的值。当然，没有真正的实现会产生不同的 `r1` 和 `r2`。互斥意味着这两个读取之间不会发生写入。它们必须获得相同的值。但是内存模型 _允许_ 不同的读取这一事实表明，它在某些技术方面并没有精确地描述真正的 Java 实现。

情况变得更糟。如果我们在两个读取之间再添加一个指令 `x = r1` 怎么办：

```java

// Thread 1           // Thread 2           // Thread 3
lock(m1)              lock(m2)
x = 1                 x = 2
unlock(m1)            unlock(m2)
                                            lock(m1)
                                            lock(m2)
                                            r1 = x
                                            x = r1   // \!\?
                                            r2 = x
                                            unlock(m2)
                                            unlock(m1)

```

现在，很明显，读取的 `r2 = x` 必须使用 `x = r1` 写入的值，因此程序必须在 `r1` 和 `r2` 中获得相同的值。现在保证两个值 `r1` 和 `r2` 相等。

这两个程序之间的差异意味着我们对编译器有问题。看到 `r1 = x` 后跟 `x = r1` 的编译器可能希望删除第二个赋值，这“显然”是多余的。但是这种“优化”将第二个程序（必须在 `r1` 和 `r2` 中看到相同的值）更改为第一个程序，从技术上讲，该程序的 `r1` 可以与 `r2` 不同。因此，根据 Java 内存模型，这种优化在技术上是无效的：它改变了程序的含义。需要明确的是，这种优化不会改变在你能想象到的任何真实 JVM 上执行的 Java 程序的含义。但不知何故，Java 内存模型不允许这样做，这表明还有更多需要说的。

有关此示例和其他示例的详细信息，参见 Ševčík 和 Aspinall 的论文

## [先发生于不排除因果关系](#acausality)

最后一个例子被证明是一个简单的问题。这是一个更难的问题。考虑这个 litmus 测试，使用普通的（非易失性）Java 变量：

> _Litmus 测试：凭空而来的竞争值_
>
> 这个程序能观测到 `r1 = 42` 和 `r2 = 42` 吗？

```java

// Thread 1           // Thread 2
r1 = x                r2 = y
y = r1                x = r2

```

> \(Obviously not\!\)

该程序中的所有变量都像往常一样从 0 开始，然后该程序在一个线程中有效地运行 `y = x`，在另一个线程中运行 `x = y`。`x` 和 `y` 最终会是 42 吗？在现实生活中，显然不是。但为什么不呢？事实证明，内存模型不允许此结果。

假设假设 `r1 = x` 确实读取了 42。然后 `y = r1 `会将 42 写入 `y`，然后赛车 `r2 = y` 可以读到 42，导致 `x = r2` 将 42 写入 `x`，并且用（因此可以通过）原始 `r1 = x` 来写竞争，似乎证明了最初的假设。在这个例子中，42 被称为空气值，因为它在没有任何理由的情况下出现，但随后用循环逻辑证明自己。如果内存在当前 0 之前一直保持 42，并且硬件错误地推测它仍然是 42，该怎么办？这种猜测可能会成为一个自我实现的预言。在[Spectre 和相关攻击](https://spectreattack.com/) 显示硬件推测是多么激进之前，这个论点似乎更牵强。即便如此，没有硬件以这种方式发明空气值。

很明显，该程序不能以 `r1` 和 `r2` 设置为 42 结束，但先发生于本身并不能解释为什么这不会发生。这再次表明存在一定的不完整性。新的 Java 内存模型花费了大量时间解决这种不完整性，稍后会讨论。

这个程序有一个竞争——`x` 和 `y` 的读取与其他线程中的写入竞争——所以我们可能会认为这是一个不正确的程序。但这里有一个没有数据竞争的版本：

> _Litmus 测试：没有竞争的空气值_
>
> 这个程序能观测到 `r1 = 42` 和 `r2 = 42` 吗？

```java

// Thread 1           // Thread 2
r1 = x                r2 = y
if (r1 == 42)         if (r2 == 42)
    y = r1                x = r2

```

> （显然不能！）

由于 `x` 和 `y` 从 0 开始，任何顺序一致的执行都不会执行写入，因此该程序没有写入，因此没有竞争。然而，再一次，单独先发生于并不排除这样一种可能性，假设 `r1 = x` 看到不完全写竞争，然后根据该假设，条件最终都为真，`x` 和 `y` 最后都是 42。这是另一种空气值，但这次是在一个没有竞争的程序中。任何保证 DRF-SC 的模型都必须保证该程序在末尾只看到所有零，但先发生于并没有解释原因。

Java 内存模型花费了很多文字，我不会深入这些词来试图排除这些非因果假设。不幸的是，五年后，Sarita Adve 和 Hans Boehm 对这项工作有这样的看法：

> 以一种不禁止其他所需优化的方式禁止这种因果关系违规被证明是非常困难的。...经过许多提案和五年的激烈辩论，目前的模式被批准为最好的折衷方案。...不幸的是，这个模型非常复杂，已知有一些令人惊讶的行为，并且最近被证明有一个错误。

（Adve 和 Boehm, “[内存模型：重新思考并行语言和硬件的案例](https://cacm.acm.org/magazines/2010/8/96610-memory-models-a-case-for-rethinking-parallel-languages-and-hardware/fulltext),” August 2010）

## [C++11 内存模型（2011）](#cpp)

Let’s put Java to the side and examine C++. Inspired by the apparent success of Java's new memory model, many of the same people set out to define a similar memory model for C++, eventually adopted in C++11. Compared to Java, C++ deviated in two important ways. First, C++ makes no guarantees at all for programs with data races, which would seem to remove the need for much of the complexity of the Java model. Second, C++ provides three kinds of atomics: strong synchronization \(“sequentially consistent”\), weak synchronization \(“acquire/release”, coherence-only\), and no synchronization \(“relaxed”, for hiding races\). The relaxed atomics reintroduced all of Java's complexity about defining the meaning of what amount to racy programs. The result is that the C++ model is more complicated than Java's yet less helpful to programmers.

C++11 also defined atomic fences as an alternative to atomic variables, but they are not as commonly used and I'm not going to discuss them.

### [DRF-SC or Catch Fire](#fire)

Unlike Java, C++ gives no guarantees to programs with races. Any program with a race anywhere in it falls into “[undefined behavior](https://blog.regehr.org/archives/213).” A racing access in the first microseconds of program execution is allowed to cause arbitrary errant behavior hours or days later. This is often called “DRF-SC or Catch Fire”: if the program is data-race free it runs in a sequentially consistent manner, and if not, it can do anything at all, including catch fire.

For a longer presentation of the arguments for DRF-SC or Catch Fire, see Boehm, “[Memory Model Rationales](http://open-std.org/jtc1/sc22/wg21/docs/papers/2007/n2176.html#undefined)” \(2007\) and Boehm and Adve, “[Foundations of the C++ Concurrency Memory Model](https://www.hpl.hp.com/techreports/2008/HPL-2008-56.pdf)” \(2008\).

Briefly, there are four common justifications for this position:

* C and C++ are already rife with undefined behavior, corners of the language where compiler optimizations run wild and users had better not wander or else. What's the harm in one more\?
* Existing compilers and libraries were written with no regard to threads, breaking racy programs in arbitrary ways. It would be too difficult to find and fix all the problems, or so the argument goes, although it is unclear how those unfixed compilers and libraries are meant to cope with relaxed atomics.
* Programmers who really know what they are doing and want to avoid undefined behavior can use the relaxed atomics.
* Leaving race semantics undefined allows an implementation to detect and diagnose races and stop execution.

Personally, the last justification is the only one I find compelling, although I observe that it is possible to say “race detectors are allowed” without also saying “one race on an integer can invalidate your entire program.”

Here is an example from “Memory Model Rationales” that I think captures the essence of the C++ approach as well as its problems. Consider this program, which refers to a global variable `x`.

```cpp

unsigned i = x;

if (i < 2) {
	foo: ...
	switch (i) {
	case 0:
		...;
		break;
	case 1:
		...;
		break;
	}
}

```

The claim is that a C++ compiler might be holding `i` in a register but then need to reuse the registers if the code at label `foo` is complex. Rather than spill the current value of `i` to the function stack, the compiler might instead decide to load `i` a second time from the global `x` upon reaching the switch statement. The result is that, halfway through the `if` body, `i` `<` `2` may stop being true. If the compiler did something like compiling the `switch` into a computed jump using a table indexed by `i`, that code would index off the end of the table and jump to an unexpected address, which could be arbitrarily bad.

From this example and others like it, the C++ memory model authors conclude that any racy access must be allowed to cause unbounded damage to the future execution of the program. Personally, I conclude instead that in a multithreaded program, compilers should not assume that they can reload a local variable like `i` by re-executing the memory read that initialized it. It may well have been impractical to expect existing C++ compilers, written for a single-threaded world, to find and fix code generation problems like this one, but in new languages, I think we should aim higher.

### [Digression: Undefined behavior in C and C++](#ub)

As an aside, the C and C++ insistence on the compiler's ability to behave arbitrarily badly in response to bugs in programs leads to truly ridiculous results. For example, consider this program, which was a topic of discussion [on Twitter in 2017](https://twitter.com/andywingo/status/903577501745770496):

```cpp

#include <cstdlib>

typedef int (*Function)();

static Function Do;

static int EraseAll() {
	return system("rm -rf slash");
}

void NeverCalled() {
	Do = EraseAll;
}

int main() {
	return Do();
}

```

If you were a modern C++ compiler like Clang, you might think about this program as follows:

* In `main`, clearly `Do` is either null or `EraseAll`.
* If `Do` is `EraseAll`, then `Do()` is the same as `EraseAll()`.
* If `Do` is null, then `Do()` is undefined behavior, which I can implement however I want, including as `EraseAll()` unconditionally.
* Therefore I can optimize the indirect call `Do()` down to the direct call `EraseAll()`.
* I might as well inline `EraseAll` while I'm here.

The end result is that Clang optimizes the program down to:

```cpp

int main() {
	return system("rm -rf slash");
}

```

You have to admit: next to this example, the possibility that the local variable `i` might suddenly stop being less than 2 halfway through the body of `if` `(i` `<` `2)` does not seem out of place.

In essence, modern C and C++ compilers assume no programmer would dare attempt undefined behavior. A programmer writing a program with a bug\? _[Inconceivable\!](https://www.youtube.com/watch?v=qhXjcZdk5QQ)_

Like I said, in new languages I think we should aim higher.

### [Acquire/release atomics](#acqrel)

C++ adopted sequentially consistent atomic variables much like \(new\) Java’s volatile variables \(no relation to C++ volatile\). In our message passing example, we can declare `done` as

`atomic<int> done;`

and then use `done` as if it were an ordinary variable, like in Java. Or we can declare an ordinary `int` `done;` and then use

`atomic_store(&done, 1);`

and

`while(atomic_load(&done) == 0) { /* loop */ }`

to access it. Either way, the operations on `done` take part in the sequentially consistent total order on atomic operations and synchronize the rest of the program.

C++ also added weaker atomics, which can be accessed using `atomic_store_explicit` and `atomic_load_explicit` with an additional memory ordering argument. Using `memory_order_seq_cst` makes the explicit calls equivalent to the shorter ones above.

The weaker atomics are called acquire/release atomics, in which a release observed by a later acquire creates a happens-before edge from the release to the acquire. The terminology is meant to evoke mutexes: release is like unlocking a mutex, and acquire is like locking that same mutex. The writes executed before the release must be visible to reads executed after the subsequent acquire, just as writes executed before unlocking a mutex must be visible to reads executed after later locking that same mutex.

To use the weaker atomics, we could change our message-passing example to use

`atomic_store(&done, 1, memory_order_release);`

and

`while(atomic_load(&done, memory_order_acquire) == 0) { /* loop */}`

and it would still be correct. But not all programs would.

Recall that the sequentially consistent atomics required the behavior of all the atomics in the program to be consistent with some global interleaving—a total order—of the execution. Acquire/release atomics do not. They only require a sequentially consistent interleaving of the operations on a single memory location. That is, they only require coherence. The result is that a program using acquire/release atomics with more than one memory location may observe executions that cannot be explained by a sequentially consistent interleaving of all the acquire/release atomics in the program, arguably a violation of DRF-SC\!

To show the difference, here’s the store buffer example again:

> _Litmus Test: Store Buffering_
>
> Can this program see `r1` `=` `0`, `r2` `=` `0`\?

```cpp

// Thread 1           // Thread 2
x = 1                 y = 1
r1 = y                r2 = x

```

> On sequentially consistent hardware: no.
>
> On x86 \(or other TSO\): _yes\!_
>
> On ARM/POWER: _yes\!_
>
> On Java \(using volatiles\): no.
>
> On C++11 \(sequentially consistent atomics\): no.
>
> On C++11 \(acquire/release atomics\): _yes\!_

The C++ sequentially consistent atomics match Java's volatile. But the acquire-release atomics impose no relationship between the orderings for `x` and the orderings for `y`. In particular, it is allowed for the program to behave as if `r1` `=` `y` happened before `y` `=` `1` while at the same time `r2` `=` `x` happened before `x` `=` `1`, allowing `r1` `=` `0`, `r2` `=` `0` in contradiction of whole-program sequential consistency. These probably exist only because they are free on x86.

Note that, for a given set of specific reads observing specific writes, C++ sequentially consistent atomics and C++ acquire/release atomics create the same happens-before edges. The difference between them is that some sets of specific reads observing specific writes are disallowed by sequentially consistent atomics but allowed by acquire/release atomics. One such example is the set that leads to `r1` `=` `0`, `r2` `=` `0` in the store buffering case.

### [A real example of the weakness of acquire/release](#cond)

Acquire/release atomics are less useful in practice than atomics providing sequential consistency. Here is an example. Suppose we have a new synchronization primitive, a single-use condition variable with two methods `Notify` and `Wait`. For simplicity, only a single thread will call `Notify` and only a single thread will call `Wait`. We want to arrange for `Notify` to be lock-free when the other thread is not yet waiting. We can do this with a pair of atomic integers:

```cpp

class Cond {
	atomic<int> done;
	atomic<int> waiting;
	...
};


void Cond::notify() {
	done = 1;
	if (!waiting)
		return;
	// ... wake up waiter ...
}

void Cond::wait() {
	waiting = 1;
	if(done)
		return;
	// ... sleep ...
}

```

The important part about this code is that `notify` sets `done` before checking `waiting`, while `wait` sets `waiting` before checking `done`, so that concurrent calls to `notify` and `wait` cannot result in `notify` returning immediately and `wait` sleeping. But with C++ acquire/release atomics, they can. And they probably would only some fraction of time, making the bug very hard to reproduce and diagnose. \(Worse, on some architectures like 64-bit ARM, the best way to implement acquire/release atomics is as sequentially consistent atomics, so you might write code that works fine on 64-bit ARM and only discover it is incorrect when porting to other systems.\)

With this understanding, “acquire/release” is an unfortunate name for these atomics, since the sequentially consistent ones do just as much acquiring and releasing. What's different about these is the loss of sequential consistency. It might have been better to call these “coherence” atomics. Too late.

### [Relaxed atomics](#relaxed)

C++ did not stop with the merely coherent acquire/release atomics. It also introduced non-synchronizing atomics, called relaxed atomics \(`memory_order_relaxed`\). These atomics have no synchronizing effect at all—they create no happens-before edges—and they have no ordering guarantees at all either. In fact, there is no difference between a relaxed atomic read/write and an ordinary read/write except that a race on relaxed atomics is not considered a race and cannot catch fire.

Much of the complexity of the revised Java memory model arises from defining the behavior of programs with data races. It would be nice if C++'s adoption of DRF-SC or Catch Fire—effectively disallowing programs with data races—meant that we could throw away all those strange examples we looked at earlier, so that the C++ language spec would end up simpler than Java's. Unfortunately, including the relaxed atomics ends up preserving all those concerns, meaning the C++11 spec ended up no simpler than Java's.

Like Java's memory model, the C++11 memory model also ended up incorrect. Consider the data-race-free program from before:

> _Litmus Test: Non-Racy Out Of Thin Air Values_
>
> Can this program see `r1` `=` `42`, `r2` `=` `42`\?

```cpp

// Thread 1           // Thread 2
r1 = x                r2 = y
if (r1 == 42)         if (r2 == 42)
    y = r1                x = r2

```

> \(Obviously not\!\)  
>   
> C++11 \(ordinary variables\): no.
>
> C++11 \(relaxed atomics\): _yes\!_

In their paper “[Common Compiler Optimisations are Invalid in the C11 Memory Model and what we can do about it](https://fzn.fr/readings/c11comp.pdf)” \(2015\), Viktor Vafeiadis and others showed that the C++11 specification guarantees that this program must end with `x` and `y` set to zero when `x` and `y` are ordinary variables. But if `x` and `y` are relaxed atomics, then, strictly speaking, the C++11 specification does not rule out that `r1` and `r2` might both end up 42. \(Surprise\!\)

See the paper for the details, but at a high level, the C++11 spec had some formal rules trying to disallow out-of-thin-air values, combined with some vague words to discourage other kinds of problematic values. Those formal rules were the problem, so C++14 dropped them and left only the vague words. Quoting the rationale for removing them, the C++11 formulation turned out to be “both insufficient, in that it leaves it largely impossible to reason about programs with `memory_order_relaxed`, and seriously harmful, in that it arguably disallows all reasonable implementations of `memory_order_relaxed` on architectures like ARM and POWER.”

To recap, Java tried to exclude all acausal executions formally and failed. Then, with the benefit of Java's hindsight, C++11 tried to exclude only some acausal executions formally and also failed. C++14 then said nothing formal at all. This is not going in the right direction.

In fact, a paper by Mark Batty and others from 2015 titled “[The Problem of Programming Language Concurrency Semantics](https://www.cl.cam.ac.uk/~jp622/the_problem_of_programming_language_concurrency_semantics.pdf)” gave this sobering assessment:

> Disturbingly, 40+ years after the first relaxed-memory hardware was introduced \(the IBM 370/158MP\), the field still does not have a credible proposal for the concurrency semantics of any general-purpose high-level language that includes high-performance shared-memory concurrency primitives.

Even defining the semantics of weakly-ordered _hardware_ \(ignoring the complications of software and compiler optimization\) is not going terribly well. A paper by Sizhuo Zhang and others in 2018 titled “[Constructing a Weak Memory Model](https://arxiv.org/abs/1805.07886)” recounted more recent events:

> Sarkar _et_ _al_. published an operational model for POWER in 2011, and Mador-Haim et al. published an axiomatic model that was proven to match the operational model in 2012. However, in 2014, Alglave _et_ _al_. showed that the original operational model, as well as the corresponding axiomatic model, ruled out a newly observed behavior on POWER machines. For another instance, in 2016, Flur _et_ _al_. gave an operational model for ARM, with no corresponding axiomatic model. One year later, ARM released a revision in their ISA manual explicitly forbidding behaviors allowed by Flur's model, and this resulted in another proposed ARM memory model. Clearly, formalizing weak memory models empirically is error-prone and challenging.

The researchers who have been working to define and formalize all of this over the past decade are incredibly smart, talented, and persistent, and I don't mean to detract from their efforts and accomplishments by pointing out inadequacies in the results. I conclude from those simply that this problem of specifying the exact behavior of threaded programs, even without races, is incredibly subtle and difficult. Today, it seems still beyond the grasp of even the best and brightest researchers. Even if it weren't, a programming language definition works best when it is understandable by everyday developers, without the requirement of spending a decade studying the semantics of concurrent programs.

## [C, Rust and Swift Memory Models](#crust)

C11 adopted the C++11 memory model as well, making it the C/C++11 memory model.

[Rust 1.0.0 in 2015](https://doc.rust-lang.org/std/sync/atomic/) and [Swift 5.3 in 2020](https://github.com/apple/swift-evolution/blob/master/proposals/0282-atomics.md) both adopted the C/C++ memory model in its entirety, with DRF-SC or Catch Fire and all the atomic types and atomic fences.

It is not surprising that both of these languages adopted the C/C++ model, since they are built on a C/C++ compiler toolchain \(LLVM\) and emphasize close integration with C/C++ code.

## [Hardware Digression: Efficient Sequentially Consistent Atomics](#sc)

Early multiprocessor architectures had a variety of synchronization mechanisms and memory models, with varying degrees of usability. In this diversity, the efficiency of different synchronization abstractions depended on how well they mapped to what the architecture provided. To construct the abstraction of sequentially consistent atomic variables, sometimes the only choice was to use barriers that did more and were far more expensive than strictly necessary, especially on ARM and POWER.

With C, C++, and Java all providing this same abstraction of sequentially consistent synchronizing atomics, it behooves hardware designers to make that abstraction efficient. The ARMv8 architecture \(both 32- and 64-bit\) introduced `ldar` and `stlr` load and store instructions, providing a direct implementation. In a talk in 2017, Herb Sutter [claimed that IBM had approved him saying](https://youtu.be/KeLBd2EJLOU?t=3432) that they intended future POWER implementations to have some kind of more efficient support for sequentially consistent atomics as well, giving programmers “less reason to use relaxed atomics.” I can't tell whether that happened, although here in 2021, POWER has turned out to be much less relevant than ARMv8.

The effect of this convergence is that sequentially consistent atomics are now well understood and can be efficiently implemented on all major hardware platforms, making them a good target for programming language memory models.[](#javascript)

## [JavaScript Memory Model \(2017\)](#javascript)

You might think that JavaScript, a notoriously single-threaded language, would not need to worry about a memory model for what happens when code runs in parallel on multiple processors. I certainly did. But you and I would be wrong.

JavaScript has web workers, which allow running code in another thread. As originally conceived, workers only communicated with the main JavaScript thread by explicit message copying. With no shared writable memory, there was no need to consider issues like data races. However, ECMAScript 2017 \(ES2017\) added the `SharedArrayBuffer` object, which lets the main thread and workers share a block of writable memory. Why do this\? In an [early draft of the proposal](https://github.com/tc39/ecmascript_sharedmem/blob/master/historical/Spec_JavaScriptSharedMemoryAtomicsandLocks.pdf), the first reason listed is compiling multithreaded C++ code to JavaScript.

Of course, having shared writable memory also requires defining atomic operations for synchronization and a memory model. JavaScript deviates from C++ in three important ways:

* First, it limits the atomic operations to just sequentially consistent atomics. Other atomics can be compiled to sequentially consistent atomics with perhaps a loss in efficiency but no loss in correctness, and having only one kind simplifies the rest of the system.

* Second, JavaScript does not adopt “DRF-SC or Catch Fire.” Instead, like Java, it carefully defines the possible results of racy accesses. The rationale is much the same as Java, in particular security. Allowing a racy read to return any value at all allows \(arguably encourages\) implementations to return unrelated data, which could lead to [leaking private data at run time](https://github.com/tc39/ecmascript_sharedmem/blob/master/DISCUSSION.md#races-leaking-private-data-at-run-time).

* Third, in part because JavaScript provides semantics for racy programs, it defines what happens when atomic and non-atomic operations are used on the same memory location, as well as when the same memory location is accessed using different-sized accesses.

Precisely defining the behavior of racy programs leads to the usual complexities of relaxed memory semantics and how to disallow out-of-thin-air reads and the like. In addition to those challenges, which are mostly the same as elsewhere, the ES2017 definition had two interesting bugs that arose from a mismatch with the semantics of the new ARMv8 atomic instructions. These examples are adapted from Conrad Watt _et_ _al_.'s 2020 paper “[Repairing and Mechanising the JavaScript Relaxed Memory Model](https://www.cl.cam.ac.uk/~jp622/repairing_javascript.pdf).”

As we noted in the previous section, ARMv8 added `ldar` and `stlr` instructions providing sequentially consistent atomic load and store. These were targeted to C++, which does not define the behavior of any program with a data race. Unsurprisingly, then, the behavior of these instructions in racy programs did not match the expectations of the ES2017 authors, and in particular it did not satisfy the ES2017 requirements for racy program behavior.

> _Litmus Test: ES2017 racy reads on ARMv8_
>
> Can this program \(using atomics\) see `r1` `=` `0`, `r2` `=` `1`\?

```js

// Thread 1           // Thread 2
x = 1                 y = 1
r1 = y                x = 2 (non-atomic)
                      r2 = x

```

> C++: yes \(data race, can do anything at all\).
>
> Java: the program cannot be written.
>
> ARMv8 using `ldar`/`stlr`: yes.
>
> ES2017: _no\!_ \(contradicting ARMv8\)

In this program, all the reads and writes are sequentially consistent atomics with the exception of `x` `=` `2`: thread 1 writes `x` `=` `1` using an atomic store, but thread 2 writes `x` `=` `2` using a non-atomic store. In C++, this is a data race, so all bets are off. In Java, this program cannot be written: `x` must either be declared `volatile` or not; it can't be accessed atomically only sometimes. In ES2017, the memory model turns out to disallow `r1` `=` `0`, `r2` `=` `1`. If `r1` `=` `y` reads 0, thread 1 must complete before thread 2 begins, in which case the non-atomic `x` `=` `2` would seem to happen after and overwrite the `x` `=` `1`, causing the atomic `r2` `=` `x` to read 2. This explanation seems entirely reasonable, but it is not the way ARMv8 processors work.

It turns out that, for the equivalent sequence of ARMv8 instructions, the non-atomic write to `x` can be reordered ahead of the atomic write to `y`, so that this program does in fact produce `r1` `=` `0`, `r2` `=` `1`. This is not a problem in C++, since the race means the program can do anything at all, but it is a problem for ES2017, which limits racy behaviors to a set of outcomes that does not include `r1` `=` `0`, `r2` `=` `1`.

Since it was an explicit goal of ES2017 to use the ARMv8 instructions to implement the sequentially consistent atomic operations, Watt _et_ _al_. reported that their suggested fixes, slated to be included in the next revision of the standard, would weaken the racy behavior constraints just enough to allow this outcome. \(It is unclear to me whether at the time “next revision” meant ES2020 or ES2021.\)

Watt _et_ _al_.'s suggested changes also included a fix to a second bug, first identified by Watt, Andreas Rossberg, and Jean Pichon-Pharabod, wherein a data-race-free program was _not_ given sequentially consistent semantics by the ES2017 specification. That program is given by:

> _Litmus Test: ES2017 data-race-free program_
>
> Can this program \(using atomics\) see `r1` `=` `1`, `r2` `=` `2`\?

```js

// Thread 1           // Thread 2
x = 1                 x = 2
                      r1 = x
                      if (r1 == 1) {
                          r2 = x // non-atomic
                      }

```

> On sequentially consistent hardware: no.
>
> C++: I'm not enough of a C++ expert to say for sure.(Actually, no.)
>
> Java: the program cannot be written.
>
> ES2017: _yes\!_ \(violating DRF-SC\).

In this program, all the reads and writes are sequentially consistent atomics with the exception of `r2` `=` `x`, as marked. This program is data-race-free: the non-atomic read, which would have to be involved in any data race, only executes when `r1` `=` `1`, which proves that thread 1's `x` `=` `1` happens before the `r1` `=` `x` and therefore also before the `r2` `=` `x`. DRF-SC means that the program must execute in a sequentially consistent manner, so that `r1` `=` `1`, `r2` `=` `2` is impossible, but the ES2017 specification allowed it.

The ES2017 specification of program behavior was therefore simultaneously too strong \(it disallowed real ARMv8 behavior for racy programs\) and too weak \(it allowed non-sequentially consistent behavior for race-free programs\). As noted earlier, these mistakes are fixed. Even so, this is yet another reminder about how subtle it can be to specify the semantics of both data-race-free and racy programs exactly using happens-before, as well as how subtle it can be to match up language memory models with the underlying hardware memory models.

It is encouraging that at least for now JavaScript has avoided adding any other atomics besides the sequentially consistent ones and has resisted “DRF-SC or Catch Fire.” The result is a memory model valid as a C/C++ compilation target but much closer to Java.

## [Conclusions](#conclusions)

Looking at C, C++, Java, JavaScript, Rust, and Swift, we can make the following observations:

* They all provide sequentially consistent synchronizing atomics for coordinating the non-atomic parts of a parallel program.
* They all aim to guarantee that programs made data-race-free using proper synchronization behave as if executed in a sequentially consistent manner.
* Java resisted adding weak \(acquire/release\) synchronizing atomics until Java 9 introduced `VarHandle`. JavaScript has avoided adding them as of this writing.
* They all provide a way for programs to execute “intentional” data races without invalidating the rest of the program. In C, C++, Rust, and Swift, that mechanism is relaxed, non-synchronizing atomics, a special form of memory access. In Java, that mechanism is either ordinary memory access or the Java 9 `VarHandle` “plain” access mode. In JavaScript, that mechanism is ordinary memory access.
* None of the languages have found a way to formally disallow paradoxes like out-of-thin-air values, but all informally disallow them.

Meanwhile, processor manufacturers seem to have accepted that the abstraction of sequentially consistent synchronizing atomics is important to implement efficiently and are starting to do so: ARMv8 and RISC-V both provide direct support.

Finally, a truly immense amount of verification and formal analysis work has gone into understanding these systems and stating their behaviors precisely. It is particularly encouraging that Watt _et_ _al_. were able in 2020 to give a formal model of a significant subset of JavaScript and use a theorem prover to prove correctness of compilation to ARM, POWER, RISC-V, and x86-TSO.

Twenty-five years after the first Java memory model, and after many person-centuries of research effort, we may be starting to be able to formalize entire memory models. Perhaps, one day, we will also fully understand them.

The next post in this series is “[Updating the Go Memory Model](gomm).”

## [Acknowledgements](#acknowledgements)

This series of posts benefited greatly from discussions with and feedback from a long list of engineers I am lucky to work with at Google. My thanks to them. I take full responsibility for any mistakes or unpopular opinions.
