---
layout: post
title: C++ 容器 vector
date: "2020-12-07 12:05:00"
tags: [C++,docs]
categories: [blog]
---
　　C++ 通过标准库 vector 提供了一个新的方法 std::vector，vector 有数组的特性，比如通过下标访问，但也增加了许多非常重要的特性，使 vector 可以动态增长以及支持迭代器，因此更加灵活。

<!-- more -->

　　vector 是数组的动态版本，可以通过下标访问元素的同时，不需要一开始固定大小；vector 的元素可以理解为顺序存放，所以尽量不要对中间的元素进行增加或者删除操作，但是可以任意增加元素。

　　声明：

```cpp
vector<int> arr;//定义一个可以存放整数的数组
```

　　访问：

```cpp
int i = arr[58];//将下标位置为58的元素值赋给i
```

　　添加：

```
arr.push_back(i);//arr的末尾新增了一个元素
```

　　元素数量

```
int c = arr.size();
```

　　空白

```
bool e = arr.empty();//如果元素个数为0，就返回true
```

　　下标遍历：

```
for(int i = 0; i < arr.size(); ++i)
{
    cout<<arr[i]<<endl;
}
```

　　迭代器遍历：

```
for(auto itr = arr.begin(); itr != arr.end(); ++itr)
{
    cout<<*itr<<endl;//解引用迭代器
}
```

　　范围for遍历：

```
for(auto& i : arr)
{
    cout<<i<<endl;
}
```

　　注意，vector 的空间只增不减，而且所以很容易造成内存泄漏，所以如果数据量很大，那么需要在用后释放空间，可以通过 swap 把当前 vector 和一个空的 vector 交换，之后会自动清空之前的空间：

```cpp
vector<int> nums; 
vector<int>().swap(nums);
//或者nums.swap(vector<int> ());
```

　　如果知道 vector 需要的空间的大致大小，那么可以使用 `reserve(size_type n);` 来提前分配空间。

<!-- 未完 -->

