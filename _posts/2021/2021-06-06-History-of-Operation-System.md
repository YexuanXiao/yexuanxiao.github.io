---
title: 开源 1 - 操作系统历史
date: "2021-06-06 16:38:00"
tags: [opensource]
category: blog
---

如果要说出计算机软件领域伟大的思想，那么开源肯定在其中占据重要的一席之地，本篇是讲述开源的第一篇，从操作系统历史讲述开源。

<!-- more -->

## 操作系统历史

### Multics 计划

在早期计算机中，实际上不存在现代意义的 **操作系统** （Operation System），在计算机上只有有限的程序和有限的功能，每个公司推出的计算机各不相同，在某一个品牌的计算机上的软件不能用在其他计算机上，并且可移植性很差。

1964 年，麻省理工，通用电气和 **AT&T** 的贝尔实验室，共同发起了一个 Multics 计划。Multics 目的是开发设计一个可以运行各类复杂，大型，多任务的程序并且可靠的操作系统，这也是 **现代操作系统理念的雏形** 。

### Unix 的诞生

由于 Multics 进展缓慢，贝尔实验室退出计划。在贝尔实验室任职，加州大学伯克利分校毕业的的工程师 Ken Thompson 和 Dennis Ritchie 在此基础上继续开发，在 1970 年使用 B 语言开发出了第一版 Unix 系统。1971 年两人共同 **发明了 C 语言** ，并在 1973 年用 C 语言重写了 Unix。C 语言代码简洁可移植性高，为 Unix 的发展提供了动力。

### BSD 的诞生

由于第一版 Unix 的作者是在贝尔实验室任职期间开发的 Unix，目的也是给 AT&T 开发，所以这时的 Unix 属于 AT&T。为了摆脱 AT&T 的版权控制，加州大学伯克利分校在 1974 年开发了基于 Unix 的操作系统 **BSD**（Berkeley Software Distribution），包括 Unix 的部分和一些新的软件。之后 BSD 着手去除原始 Unix 的代码。BSD 的主要负责人是 Bill Joy，他在 1988 年发布了 BSD License，将去除原始 Unix 代码的 BSD 正式开源。

### GNU 的诞生

虽然 BSD 通过重写 Unix 避免了直接的版权问题，但是 AT&T 仍认为自己持有 BSD 的一部分版权，为了减少纠纷，伯克利分校规定，BSD 只能免费提供给持有 AT&T 许可的公司，这大大阻碍了 BSD 的发展。

实际上，由于反垄断法， **最早 AT&T 并不能出售 Unix 以赚取收入** 。

1983 年，Richard Stallman 发布了 **GNU 计划以及 GNU 宣言** ，宣布开发一个完全独立，和 Unix 没有任何版权关系但是目标是兼容 Unix 的操作系统。GNU 即 GNU’s Not Unix 的递归简写。同时第一版 **GNU Public License** 协议诞生。

### Linux 的诞生

1991 年，Linus Torvalds 在芬兰赫尔辛基大学上学时，对操作系统很好奇。他对 MINIX 只允许在教育上使用很不满（在当时 MINIX 不允许被用作任何商业使用），于是他便开始写他自己的操作系统内核，这就是后来的 Linux。Linus Torvalds 最早在 MINIX 上开发 Linux，为 MINIX 写的软件也可以在 Linux 内核上使用。后来使用 GNU 软件代替 MINIX 的软件，因为使用从 GNU 来的源代码可以自由使用，这对Linux的发展有益。 **为了让Linux 可以在商业上使用，Linus Torvalds 决定更改他会限制商业免费使用的原来的协议，以 GPL 协议来代替** 。Linux 实际上不是 GNU 计划的一部分。

在当时，Richard Stallman 仅完成了部分操作系统的软件的开发的工作，包括 GNU 自己的 C 语言编译器 GCC，调试器 GDB，IDE Emacs，唯独没有自己的完善的操作系统内核，GNU 自己的内核 GNU Hurd 直到 1991 年都不能使用。

由于 1984 年 AT&T 被肢解，导致之前的反垄断承诺失效，**AT&T 得以重新进入计算机市场** 。虽然 Unix 并不赚钱，但是 AT&T 依旧起诉了使用 BSD 的商业公司，而这场官司等到 1992 年才“解决”，因此 BSD 错过了发展的最佳时机，被 Linux 代替。

### 其他操作系统

微软早期曾经购买 AT&T 的 Unix 授权后开发商业 OEM 操作系统 Xenix OS 卖给计算机生产商。微软中期为 IBM 公司的计算机开发 MS-DOS 商业操作系统。后来微软独立开发并出售 Windows 软件，Windows 并不是模仿 Unix 或者由 Unix 衍生而来的操作系统。

苹果电脑内置的 "mac" 操作系统衍生自 BSD。

Unix 较为知名的模仿和衍生者时间线如下：

![Unix Timeline](https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Unix_timeline.en.svg/1579px-Unix_timeline.en.svg.png "candark")

### 总结

早期操作系统大部分捆绑计算机销售，或者需要购买商业许可。BSD 和 GNU 的出现使得计算机软件领域产生新的概念，即 **免费，自由和开源** ，关于这三点的内容将在专门的一节介绍。


参考：维基百科相关词条

