---
layout: post
title: KMP 快速模式匹配算法
date: "2021-04-09 12:52:00"
tags: [C++,docs]
categories: [blog]
---
　　Knuth-Morris-Pratt 快速模式匹配算法，这个算法由 Donald Knuth、Vaughan Pratt、James H. Morris 三人于 1977 年联合发表，故取这 3 人的姓氏命名此算法。

　　给定两个字符串 S 和 P，S 为目标串，P 称为模式串，从 S 的给定位置开始搜索模式 P。

<!-- more -->

　　先看 BP 算法，即暴力匹配：

　　逐字比较目标串和模式串，如果不匹配，目标串的开始位置后移一位，直到每一个字符都相同，或者没有匹配成功的段。

　　KMP 算法是对暴力匹配的改进算法，旨在通过 **建立一个跳转表减少对目标串的移动次数** 。

　　跳转数组的原理： **将模式串中的重复字符或者字符串做成的一个表，使回溯操作在模式内而不是在主串内** 。

　　由于 BP 算法是在主串内回溯，时间复杂度成为了 mn，但是由于 KMP 算法是在串内回溯，所以时间复杂度最好为 m+n，最坏为 n^2。

　　KMP 算法不是最高效的算法，所以不要过于纠结为什么这样去做，把算法理解就好。

　　跳转表的建立：

　　首先我们引入一个概念，真前缀

　　比如对于abcdabd来说，真前缀指

    a
    ab
    abc
    abcd
    abcdabd

　　那么我们现在需要计算他的最长相同前缀长度：

　　第一个a我们认为它的相同真前缀长度为-1，因为a前面没有字符

　　截至abcda的a我们认为他的相同真前缀长度为0，因为没有重复

　　从b开始有一个相同真前缀a，重复长度为1

　　从d开始有一个相同真前缀ab，重复长度为2

     ABCDABD
    -1000012

　　此时跳转表就建立成功，下面看这个表怎么用:

设定目标串为

    ABCDAB ABCDABCDABDE

1. 
```
    ABCDAB ABCDABCDABDE
    ABCDABD
```

    此时D和空格不匹配，但是我们查表可知，d前面的2个字符为真前缀，所以我们将模式串的匹配位置移动到第2+1个字符C，即将AB与AB对齐

2. 
```
    ABCDAB ABCDABCDABDE
        ABCDABD
```

    然后C与空格也不匹配，我们接下来会这样

3. 
```
    ABCDAB ABCDABCDABDE
           ABCDABD
```

    D和C也不匹配，我们再移动

4. 
```
    ABCDAB ABCDABCDABDE
               ABCDABD
```

    此时从ABC的C开始对比


　　注意，第一步的第 2+1 个字符 C，在 C 语言的数组里对应的下标正是 2。


　　代码实现：

```cpp

#include <iostream>
#include <string>
using namespace std;

void GetTable(string P, int (*table)[100])//获取表
{
    int p_len = P.length();
    int i = 0; // P 的下标
    int j = -1;
    (*table)[0] = -1;
    while (i < p_len)
    {
        if (P[i] == P[j] || j == -1)
        {                    //入口条件：如果两个字符相等，或者第一次进入循环。初始i比j打1
            ++i;             //i作用是遍历整个模式中的字符，j的作用是记录相同真前缀大小，换句话说j在真前缀内移动，而i在整个模式的字符中移动一次
            ++j;             //如果i=j，说明开始存在真前缀，那么ij加一去判断下一个位置是不是也是真前缀
            (*table)[i] = j; //由于j记录真前缀大小，i记录所在字符位置，所以让表内i位置等于j
        }
        else
        {
            j = (*table)[j]; //如果不等，那么让j重新等于表中j的位置
        }                    //第一遍直到开始出现前缀之前，这个的作用是让循环重新进入if(true)，然后让j=0=i=table[i]
        //当出现前缀的时候，即P[i]=P[j],那么本应进入else，此时j=0，却进入了if(ture),然后j=1=i=table[i]
        //当跳出前缀的时候，j=table[j]，即j使用表中之前有的数据来确定自己的位置
        //这样做的目的在于，模式可能有多次多层重复前缀
    }
}

int KMP(string S, string P, int (*next)[100])
{
    GetTable(P, next);
    int i = 0;//s
    int j = 0;//p
    int s_len = S.size();
    int p_len = P.size();

    while (i < s_len && j < p_len)
    {
        if (j == -1 || S[i] == P[j])
        {
            ++i;
            ++j;
        }
        else
            j = (*next)[j];
    }

    if (j == p_len)
        return i - j;

    return -1;
}

int main()
{
    string a = "ABCDABD";
    int b[100] = {0};
    string c = "ABCDAB ABCDABCDABDE";
    cout << KMP(c, a, &b) << endl;
}

```