---
layout: post
title: 排序算法 2
date: "2021-06-18 18:40:00"
tags: [C++, C, docs]
categories: [blog]
---
　　本文是排序算法的第二篇，介绍了快速排序，希尔排序和归并排序。

<!-- more -->

### 快速排序

　　快速排序是相对复杂的排序方式，由于平均排序效率最高而得名。

　　快速排序使用了递归（栈）来实现。

　　冒泡排序中，每一次循环都是一次线性遍历，导致其效率较差。在快速排序中，算法依靠递归（栈）来进行排序，将数据构建成了树 [^1] ，减少了重复比较的此时 ，是第一个平均时间复杂度突破 O(n<sup>2</sup>) 的算法，达到了 O(nlogn)，证明过程略复杂不过多赘述。

[^1]: 可参阅本站文章 再探递归

　　快速排序的基本思路是将数组以某一个数为基准，使整个数组左侧数比这个基准数小，右侧数比这个基准数大，再递归的把左侧和右侧认为是整个数组，选取一个基准数进行排序。

```cpp

void QuickSort(int *a, size_t head, size_t length)
{
    int i = head, j = length;
    if (i < j) // 当ij相同时即为排序完成
    {
        int base = a[i]; // 基准
        while (i != j)
        {
            while (j > i && a[j] >= base) // j向前逼近
                --j;
            a[i] = a[j];
            while (i < j && a[i] <= base) // i 向后逼近
                ++i;
            a[j] = a[i];
        }
        a[i] = base; // 将基准添回原位置
        QuickSort(a, head, i - 1);
        QuickSort(a, i + 1, length);
    }
}

```

　　要说明的是，快速排序并不是不需要利用辅助空间，因为必须使用栈，并且其空间复杂度是 O(logn) 到 O(n)，网络上很多所谓的迭代方法都是用栈来实现，唯一优点是防止溢出，并没有提高时间复杂度和空间复杂度。

　　并且，基准的选择也是影响快速排序效率的一大原因，数组随机性越高，快速排序效率优势越明显，如果数组随机性不高，可以选择更换算法或者增加基准的随机性。

### 希尔排序

　　希尔排序是插入排序的改进版，我们都知道，插入排序对已经有序的或者是有序程度高的序列排序是非常快的，但由于插入排序每插入一个元素都需要移动前面的大量元素，因此它的效率是十分低下的。

　　希尔排序就是为了解决插入排序的这个缺点而设计的。希尔排序不追求头部有序或者尾部有序，而是使对应的两个区间相对有序（在一次遍历内使一个区间尽可能大于另一个区间），这个区间最开始是非常大的，在每次迭代后，这个区间都会减小，并且有序程度增加，直到退化为插入排序。

　　但是，在退化为插入排序之前，整个数组内的有序程度会非常的高，此时插入排序的移动元素的次数会少很多，所以整体来看，效率得到了提升。

```cpp

void ShellSort(int *arr, size_t length)
{
    for (size_t gap = length / 2; gap > 0; gap /= 2)
    {
        for (size_t i = gap; i < length; ++i)
        {
            size_t j;
            int temp = arr[i];
            for (j = i; j >= gap && arr[j] < arr[j - gap]; j -= gap)
            {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }
}

```

　　或者写为类似冒泡排序的方式：

```cpp

void ShellSort(int *arr, size_t length)
{
    for (size_t gap = length / 2; gap > 0; gap /= 2)
    {
        for (size_t i = gap; i < length; ++i)
        {
            for (int j = i; j >= gap && arr[j] < arr[j - gap]; j -= gap)
            {
                arr[j] = arr[j] + arr[j - gap];
                arr[j - gap] = arr[j] - arr[j - gap];
                arr[j] = arr[j] - arr[j - gap];
            }
        }
    }
}

```


　　希尔排序的平均效率和增量序列有着直接关系，增量序列直接影响希尔排序的性能。原始的希尔排序使用 2 倍增量序列，此时其实效率不高甚至会退化为普通的插入排序，例如：

1,3,7,9,8,11,5,13

　　第一次排序后结果为

1,3,5,9,8,11,7,13

　　第二次为

1,3,5,9,8,11,7,13

　　第三次为

1,3,5,7,8,9,11,13

　　你会发现第二次根本就没排序，只遍历了一遍，做了无用功。

　　经过数学分析，成倍数关系的增量序列都不是好的增量序列，而互质的增量序列是一个好的增量序列，不过由于质数计算复杂，一般用类似质数的增量序列，例如 2<sup>k<sup> - 1 （Hibbard 增量）。


### 归并排序

　　归并排序实际上是快速排序的反向：快速排序优先使大组局部有序，再分割为局部有序的小组递归下去；归并排序优先使小组有序，再拼接成有序大组。不过快速排序的最大缺点是在基准数选择不当时会向 O(n<sup>2</sup>) 退化，而归并排序严格遵守 O(nlogn) 的空间复杂度和 O(n) 的时间复杂度。

步骤如下：

1. 递归的将整个数组建立为一个完全二叉树
2. 逐步遍历左右孩子，左孩子大时填入左孩子，右孩子大时填入右孩子

```cpp

void Merge(int *arr, size_t start, size_t mid, size_t length, int *brr)
{
    int i = start, j = mid + 1, k = start;
    for (k; i <= mid && j <= length; ++k)
    {
        if (arr[i] < arr[j])
        {
            brr[k] = arr[i];
            ++i;
        }
        else
        {
            brr[k] = arr[j];
            ++j;
        }
    }
    while (i <= mid)
    {
        brr[k] = arr[i];
        ++k;
        ++i;
    }
    while (j <= length)
    {
        brr[k] = arr[j];
        ++k;
        ++j;
    }
}
void MergeSort(int *arr, size_t start, size_t length, int *brr)
{
    int *crr = (int *)malloc(sizeof(int) * (length - start + 1));
    if (start == length)
    {
        brr[start] = arr[start];
    }
    else
    {
        int mid = (start + length) / 2;
        MergeSort(arr, start, mid, crr);
        MergeSort(arr, mid + 1, length, crr);
        Merge(crr, start, mid, length, brr);
    }
}

```