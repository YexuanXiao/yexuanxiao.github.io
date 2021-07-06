---
layout: post
title: 如何编写递归程序（分治法）
date: "2021-03-30 15:15:00"
tags: [C++,docs]
categories: [blog]
---
　　递归是一个过程在其过程中间接调用自身的一种方法，它通常把一个复杂的问题转化为一个由原问题分解的规模较小的问题来解决，递归只需少量指令就可描述出解题所需要的多次重复计算，大大地减少了代码量。

<!-- more -->

　　递归主要需要解决下面两个问题：

+ 如何找到递归形式？
+ 如何找到递归边界？

　　递归算法一般用于解决三类问题：

+ 数据的定义按递归定义（Fibonacci 函数）
+ 问题解法按递归实现（回溯）
+ 数据的结构按递归定义（树的遍历，图的搜索）

　　递归算法的优缺点

+ 优点：结构清晰，可读性强，而且容易用数学归纳法来证明算法的正确性。
+ 缺点：运行效率较低，在递归调用的过程当中系统为每一层的返回点、局部变量等开辟了栈来存储。

　　递归算法可以分为两种类型：基于分治策略的递归算法和基于回溯策略的递归算法。

## 基于分治策略的递归 ##

　　分治的思想：把问题划分为若干个子问题，以同样的方式分别去处理各个子问题，把各个子问题的处理结果综合来，形成最终的处理结果。

### 计算 n 的阶乘 ###

　　n!     可以分解为 n * (n-1)!

　　(n-1)! 可以分解为 (n-1) * (n-2)!

　　依次类推，形式为 ：n! = n * (n-1)!

　　同时当n = 1 时阶乘为 1，所以递归边界为：n! = 1


　　代码实现：

```cpp

int fact(int n)
{
    if (n == 1) // 递归边界
        return 1;
    else
        return (n * fact(n - 1)); // 递归形式
}

```

## Fibonacci 数列 ##

　　兔子繁殖问题： 如果每对兔从出生后第三个月起每个月繁殖一对子兔，小兔长到第三个月后每个月又生一对兔，试问一对兔一年能繁殖多少对兔？

　　由于小兔子在第一个月和第二个月均不产生兔子，因此递归边界为 n = 1 或者 n = 2。兔子的规律为数列 1,1,2,3,5,8,13,21...。可以看出从第三个数开始，每个数都是之前两个数之和，因此递归形式为 `F(n) = F(n-1) + F(n-2)`

　　代码实现：

```cpp

int F(int n) // n为月数
{
    if (n == 1 || n == 2)// 递归边界
    {
        return 1;
    }
    else 
    {
        return F(n - 1) + F(n - 2);// 递归形式
    }
}

```

### 汉诺（Hanoi）塔问题 ###

　　大梵天创造世界的时候做了三根柱子，在一根柱子上从下往上按照大小顺序摞着 64片 圆盘。婆罗门把圆盘从下面开始按大小顺序重新摆放在另一根柱子上。并且规定，在小圆盘上不能放大圆盘，在三根柱子之间一次只能移动一个圆盘。

　　可以先从最简单的情况分析，在 A 柱上只有一只盘子，假定盘号为 1， 这时只需将该盘直接从 A 搬至 C，记为

`move from A to C`

　　在A柱上有二只盘子，1为小盘2为大盘。分三步进行：

`move from A to B;`

`move from A to C;`

`move form B to C;`

　　在A柱上有3只盘子，从小到大分别为1号，2号，3号。将过程分解成三步：

`move 2 discs from A to B using C；`

　　利用两个盘子的方法，先把 A 的上面两层移到 B      

`move from A to C；`

　　把 A 的 3 号移到 C

`move 2 discs from B to C using A ；`

　　把 B 的两层移到 C

　　因此得出 n 个盘子的递归形式为

 `move n-1 discs from A to B using C；    ` 

 `move 1 discs from A to C；`

 `move n-1 discs from B to C using A ；`

　　递归边界为 n = 1。

　　代码实现：

```cpp

#include <stdio.h>
void move(int n, char L, char M, char R);
int main(void)
{
    int n;
    printf("请输入一个整数：");
    scanf("%d", &n);
    move(n, 'A', 'B', 'C');
}

void move(int n, char L, char M, char R) // L上的n 个盘子移到 R上
{
    if (n == 1)                                  // 递归边界
        printf("move #1 from %c to %c\n", L, R); // 从 L移动到R上
    else
    {
        move(n - 1, L, R, M);                        // 将 L 的（n-1）个盘子移动到 R上
        printf("move #%d from %c to %c\n", n, L, R); // 将L 的一个盘子移动到 R上
        move(n - 1, M, L, R);                        // 将R 上的（n-1）个盘子移动到 R上
    }
}

```

<p class="copyright">本文来源：CSDN 用户 xgf415 所写文章《<a href="https://blog.csdn.net/xgf415/article/details/52026961">如何编写递归程序（分治法）</a>》，有删改，遵守 CC 4.0 BY-SA 协议。</p>