---
layout: post
title: 排序算法 1
date: "2021-06-17 13:23:00"
tags: [C++, C, docs]
categories: [blog]
---
　　效率可以说是计算机程序设计的追求，而排序算法则是解决实际问题中最常见基础类型。

　　本文介绍了三种简单排序算法，包括冒泡排序，选择排序，插入排序，有关其他排序算法的介绍可以参考下一篇。

<!-- more -->

<p class="center">常见排序算法性能比较</p>

| 算法 | 平均时间复杂度 | 最坏时间复杂度 | 空间复杂度 |
| :--- | :----- | :---- | :---- |
| 简单排序 | O(n<sup>2</sup>) | O(n<sup>2</sup>) | O(1) |
| 快速排序 | O(nlogn) | O(n<sup>2</sup>) | O(nlogn) |
| 堆排序   | O(nlogn) | O(nlogn) | O(1) |
| 归并排序 | O(nlogn) | O(nlogn) | O(n) |
| 基数排序 | O(d(n+rd)) | O(d(n+rd)) | O(rd) |

<p class="center">事实结论</p>

1. 简单排序只适合规模小的数据的排序
2. 插入排序和归并排序在数据基本有序时效果最好
3. 快速排序是平均性能最好的排序
4. 基数排序针对不定长位数数据效率较高，且关键位数较少
5. 按情况选择排序算法

## 简单排序

　　简单排序是所有平均时间复杂度为 O(n<sup>2</sup>) 的排序算法。

　　下面的算法用到了 **size_t** 这个类型，这个类型在之前的文章 地址原理 中提到过。

　　实际上 C 语言中 **理论数组元素的个数** 是用 size_t 这个类型表示 [^1] （实际上个数必须小于，而且远小于 size_t），size_t 和 int 的区别和 int 和 short 的区别类似，并且 sizeof 运算符的结构的类型是 size_t。

　　sizeof 也不过多解释，不过此处指明一点， **sizeof 不是函数** [^2]  。

[^1]: [cppreference: size_t](https://zh.cppreference.com/w/c/types/size_t)：size_t 通常用于数组下标和循环计数
[^2]: [cppreference: sizeof](https://zh.cppreference.com/w/c/language/sizeof)：sizeof 为运算符

### 冒泡排序

　　冒泡排序可以说是最简单的排序算法，其核心比较前一项和后一项的大小，如果前一项比后一项大，那么交换两项，不断重复。

　　由于在循环过程中实际上同时获得了前一项和后一项，所以循环截至在倒数第二项，所以遍历该数组实际上需要 n - 1 次循环，用 j 记录该循环。

　　当第一项为整个数组中最大的一项时，该项会从位置 1 移动到位置 n，移动了 n - 1 次，也就是需要 n - 1 次循环，用 i 记录该循环。

　　所以整个算法就是两层 n - 1 次的循环 f(n) = (n - 1)<sup>2</sup>，时间复杂度 O(f(n)) = O(n<sup>2</sup>)。

　　由于算法中实际上额外只用了两个用来储存循环次数的变量，数组的地址和数组的长度一共 4 个变量，所以空间复杂度 O(1)。

```cpp

#include <stdio.h>
void BubbleSort(int *, size_t);
int main(void)
{
    int a[] = {2, 3, 1, 4, 7, 22, 33, 44, 21, 13}; //10个数
    BubbleSort(a, sizeof(a)/sizeof(int));
    for (int i = 0; i < sizeof(a)/sizeof(int); ++i)
    {
        printf("%d ", a[i]);
    }
    printf("\n");
}

void BubbleSort(int *arr, size_t length)
{
    for (size_t i = 0; i < length - 1; ++i)
    {
        for (size_t j = 0; j < length - 1; ++j)
        {
            if (arr[j] > arr[j + 1])
            {
                arr[j + 1] = arr[j] + arr[j + 1];
                arr[j] = arr[j + 1] - arr[j];
                arr[j + 1] = arr[j + 1] - arr[j];
            }
        }
    }
}

```

　　实际上这个算法还可以进行改进：

#### 改进的冒泡排序 1

　　通过观察我们会发现，第一次循环之后，整个数组中最大的数会被移动到数组末端，第二次循环后第二大的数会被移动到数组的倒数第二个位置。

　　由于算法会在无序数列中选择最大的使之移动到后面的有序部分，所以叫冒泡排序。

　　所以进行 i 次循环之后，从后往前数直到第 i 个位置都是有序的，于是我们便能得到改进后的算法：

```cpp

void BubbleSort(int *arr, size_t length)
{
    for (size_t i = 0; i < length - 1; ++i)
    {
        for (size_t j = 0; j < length - 1 - i; ++j)//注意这里多了一个 - i
        {
            if (arr[j] > arr[j + 1])
            {
                arr[j + 1] = arr[j] + arr[j + 1];
                arr[j] = arr[j + 1] - arr[j];
                arr[j + 1] = arr[j + 1] - arr[j];
            }
        }
    }
}

```

　　此时 f(n) = (n - 1) * ((n - 1) / 2 ) = (n - 1)<sup>2</sup> / 2，O(f(n)) = O(n<sup>2</sup>)。

　　注意一件事，如果这个数组本身就是有序的，或者执行到 k 次循环时，数组变成有序了，并且 k < n，那么之后的循环实际上都是无效循环，所以我们可以再次改进算法使数组有序时直接跳出循环：

#### 改进的冒泡排序 2

```cpp

void BubbleSort(int *arr, size_t length)
{
    int is_order;//标志
    for (size_t i = 0; i < length - 1; ++i)
    {
        is_order = 1;//清空标志
        for (size_t j = 0; j < length - 1 - i; ++j)
        {
            if (arr[j] > arr[j + 1])
            {
                arr[j + 1] = arr[j] + arr[j + 1];
                arr[j] = arr[j + 1] - arr[j];
                arr[j + 1] = arr[j + 1] - arr[j];
                is_order = 0;//设置标志
            }
        }
        if (is_order)
        {
            break;//退出循环
        }
    }
}

```

　　由于 j 循环用于遍历数组，所以在 j 循环内，当有需要调换大小的时候，我们把标志设置为 0。

　　由于 i 循环用于保证循环次数足够多使数组有序，我们在每次进入 i 循环的时候将标志设为 1。

　　这样当存在一次 j 循环未执行 if 语句时，说明数组已经有序，此时标志 is_order 为 1，程序退出 i 循环，然后结束。

　　这时，虽然时间复杂度并没有改变，但是在最好的情况下也保证了 O(n) 的时间复杂度。

### 插入排序

　　通过之前的冒泡排序可以知道，冒泡排序是先使较大数有序，再使较小数有序；而插入排序通常是先使较小数有序放在前面，再使较大数有序。

　　插入排序也非常简单，分以下几步：

1. 比较前一项和后一项的大小，如果前一项大于后一项，则将后一项记录为 temp
2. 逐个比较 temp 和 temp 之前的项的大小
3. 如果该项比 temp 大，则将该项后移一位
4. 直到遇到比 temp 小的项，将 temp 插入到该小项的后面
5. 重复 n 次

　　插入排序实际上就是倒过来的冒泡排序，时间复杂度和空间复杂度都是一模一样的。插入排序使用 temp 变量记录临时数据，天生不用做 改进的冒泡排序 这类优化，而优化后的冒泡排序使用标志来保证最好时间复杂度。

```cpp

void InsertSort(int *arr, size_t length)
{
    for (size_t i = 1; i < length; ++i)
    {
        if (arr[i - 1] > arr[i])
        {
            size_t j;
            int temp = arr[i];
            for (j = i; j > 0 && temp < arr[j - 1]; --j)
            {
                arr[j] = arr[j - 1];
            }
            arr[j] = temp;
        }
    }
}

```

　　或者将它改为与冒泡排序类似的写法：

```cpp

void InsertSort(int *arr, size_t length)
{
    for (size_t i = 1; i < length; ++i)
    {
        for (int j = i; j > 0 && arr[j] < arr[j - 1]; --j)
        {
            arr[j] = arr[j] + arr[j - 1];
            arr[j - 1] = arr[j] - arr[j - 1];
            arr[j] = arr[j] - arr[j - 1];
        }
    }
}

```

　　注意，在冒泡排序中，i 初始为 0 且小于 n - 1，而在插入排序中，i 初始为 1 且小于 n，这是为了方便步骤 3，否则代码会写的很难看。

　　准确选出 i 的初始值的方法是：i 永远是你将要进行移动的那项。

### 选择排序

　　选择排序也是冒泡排序的翻版，冒泡排序通过持续的交换使较大值排列在数组尾部，而选择排序是选择较小的放在数组头部。

　　步骤很简单：

1. 初始化最小值变量 min 为 i
2. 将第 min 个数与第 j 个数依次比较，使 min 为数组里最小的数的下标
3. 当循环结束时，交换第 i 个数和第 min 个数，i 是 0 到 n - 1
4. 循环 i 次

```cpp

void SelectSort(int *arr, size_t length)
{
    for (size_t i = 0; i < length - 1; ++i)
    {
        size_t min = i;
        for (size_t j = i + 1; j < length; ++j)
        {
            if (arr[j] < arr[min])
            {
                min = j;
            }
        }
        if (i != min)//防止交换同一个变量导致变量被清0
        {
            arr[i] = arr[min] + arr[i];
            arr[min] = arr[i] - arr[min];
            arr[i] = arr[i] - arr[min];
        }
    }
}

```


参考：