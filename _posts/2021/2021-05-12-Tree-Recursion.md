---
layout: post
title: 递归函数和二叉树
date: "2021-05-12 21:08:00"
tags: [C++,C,docs]
categories: [blog]
---
　　二叉树的操作中有许多可以使用递归来实现，本文用代码的形式介绍二叉树中一些递归函数的写法，帮助理解递归函数，注意本文中代码仅考虑正确输入的情况。

<!-- more -->

* toc
{:toc}

### 综述

　　理解递归函数可以从递归思想和递归底层原理两点来入手：

+ 思想：分治法，将大规模的问题本身分解为等价的小规模问题。
+ 底层原理：栈，用回溯将非线性问题在线性空间上解决。

　　特性：

+ 递归函数在将树状结构映射到线性空间解决，所以其递归顺序由栈的出入规则和命令顺序决定。
+ 虽然递归函数在线性空间上解决问题，但是，递归函数在出栈之前可以认为改递归函数进行了树状调用，而不是仅仅为线性的。


### 二叉树的结构体定义

```cpp

struct BinaryTree{
    int data;
    struct BinaryTree *LChild;
    struct BinaryTree *RChild;
};

```

### 二叉树的无返回值遍历

　　实际上所有与二叉树有关的递归函数都是由最基本的二叉树的遍历而来，其中主要分为两种，一种是没有返回值的递归函数，一种是有返回值的递归函数，大部分没有返回值的递归函数和有返回值的递归函数可以互相转换，不过各有各的优势。

#### 二叉树的简单遍历

```cpp

void Print(struct BinaryTree *);//输出节点的函数
void Traversal(struct BinaryTree *root){
    if (root){
        //Print(root);//前序
        Traversal(root->LChild);
        //Print(root);//中序
        Traversal(root->RChild);
        //Print(root);//后序
    }
}

```

　　注意，三种遍历方式虽然看上去仅仅是输出命令的位置不一样，但实际上区别却非常的大。

　　在文章 再探递归 中我指出递归函数的实现是依赖与一个隐含的栈来实现，所以我们这里用栈解释遍历过程：

+ 三种遍历方式首先都会判断当前节点是否存在，不存在则函数出栈

+ 前序遍历：入栈后立即输出当前节点，并且判断是否有左节点或者右节点进行入栈，如果没有则出栈
+ 中序遍历：入栈后先判断是否有左节点入栈，如果没有左节点则输出当前节点，然后判断是否有右节点入栈，如果没有则出栈
+ 后序遍历：入栈后判断是否有左节点或者右节点进行入栈，如果没有则输出当前节点，然后出栈

#### 删除树或者子树

```cpp

void DelTree(struct BinaryTree *root){
    if (root){
        DelTree(root->LChild);
        DelTree(root->RChild);
        free(root);//必须在出栈时释放
    }
}

```

　　此函数在出栈时回收空间，注意必须在出栈时，否则会因为空间被释放而导致无法访问左右节点。不过由于系统的内存回收机制，错误不一定显现出来，但是仍然需要避免错误代码。

#### 线性建立二叉树

```cpp

void CreatTree(BinaryTree **root)
{
    char ch;
    ch = getchar();
    if (ch == '#')
    {
        *root = 0;
    }
    else
    {
        *root = (BinaryTree *)malloc(sizeof(BinaryTree));
        (*root)->data = ch - 48;
        CreatTree(&((*root)->LChild));
        CreatTree(&((*root)->RChild));
    }
}

```

　　这个函数其实是上面遍历二叉树的变体：

+ 首先检测当前输入的字符串是否为 '#'，是则出栈
+ 否则将当前输入的数字入栈，并且判断是否有左节点或者右节点可入栈，如果没有则出栈

　　改变这个建立树的函数中写入数据的命令的位置，和改变遍历树的函数中输出节点函数的位置的作用效果是一样的。


#### 计算二叉树节点数

```cpp

void TraversalCount(struct BinaryTree *root, int *num){
    if (root){
        *num++;
        TraversalCount(root->LChild, num);
        TraversalCount(root->RChild, num);
    }
}

```

　　该函数通过传入一个指向 int 的指针记录节点数，下面还有一个通过返回值记录节点数的方案。

### 二叉树的有返回值遍历

　　注意，递归函数的最终的返回值是本次调用的返回值，即栈中最后一个出栈的调用的返回值。

#### 计算二叉树节点数

```cpp

int TraversalCount(struct BinaryTree *root){
    if (root){
        return 1 + TraversalCount(root->LChild) + TraversalCount(root->RChild);
    }
    else
        return 0;
}

```

　　该函数和上面的无返回值函数具有相同的作用。

#### 求树的深度


```cpp

int BinTreeDeep(BinaryTree *root)
{
    if (root)
    {
        int l = BinTreeDeep(root->LChild);
        int r = BinTreeDeep(root->RChild);
        return (l > r) ? (l + 1) : (r + 1);
    }
    else
        return 0;
}


```

　　该函数首先判断当前节点是否存在，左右子节点是否存在，在退栈的时候计算当前分支的深度并返回给之前的调用。

#### 判断两棵树是否相等

```cpp

int CheckEqual(BinaryTree *T1, BinaryTree *T2)
{
    if (T1 == T2) //判断指针相同或者同为0
        return 1;
    if (!T1 || !T2) //如果只有一个不为空
        return 0;
    if ((T1&&T2)&&(T1->data == T2->data)) //如果数据相同则判断后面的
        return CheckEqual(T1->LChild, T2->LChild) && CheckEqual(T1->RChild, T2->RChild);
    else
        return 0;
}

```

　　该函数对两棵树执行同步遍历然后进行数据判断，只有相等时才返回 1。

#### 判断子树

```cpp

int CheckSubTree(BinaryTree *T1, BinaryTree *T2) //判断T2是否为T1子树
{
    if (T1 == T2) //判断指针相同或者同为0
        return 1;
    if (!T1 || !T2) //如果只有一个不为空
        return 0;
    if (T1->data == T2->data) //如果数据相同则判断是否为子树
        return CheckEqual(T1, T2);
    else //如果值不同，则遍历T1直到找到与T2相同的值
        return CheckSubTree(T1->LChild, T2->LChild) || CheckSubTree(T1->RChild, T2->Rchild);
}

```

#### 判断子结构

```cpp

int CheckSubTree(BinaryTree *T1, BinaryTree *T2) //判断T2是否为T1子树
{
    if (T1 == T2) //判断指针相同或者同为0
        return 1;
    if (!T1 || !T2) //如果只有一个不为空
        return 0;
    if (T1->data == T2->data) //如果数据相同则判断是否为同一棵树
        return CheckEqual(T1, T2);
    else //如果值不同，则遍历T1直到找到与T2相同的值
        return CheckSubTree(T1->LChild, T2) || CheckSubTree(T1->RChild, T2);
}

```

#### 查找节点

　　这个函数和求树的深度类似：

```cpp

struct BinaryTree *FindNode(struct BinaryTree *root, int n)
{
    if (root)//判断是否存在节点，不存在返回0
    {
        struct BinaryTree *a = FindNode(root->LChild, n);//遍历左节点
        if (a && a->data == n)//如果a满足条件，则返回a
            return a;
        struct BinaryTree *b = FindNode(root->RChild, n);//遍历右节点
        if (b && b->data == n)//如果b满足条件，则返回b
            return b;
        if (root->data == n)//如果当前节点满足条件，则返回当前节点
        {
            return root;
        }
        else
            return 0;
    }
    else
        return 0;
}

```

#### 输出指定节点的所有祖先节点

　　将查找节点改写一下还可以得到输出指定节点的所有祖先节点的函数：

```cpp

struct BinaryTree *PrintAncestors(struct BinaryTree *root, int n, int *flag)
{
    if (root) //判断是否存在节点，不存在返回0
    {
        struct BinaryTree *a = PrintAncestors(root->LChild, n, int *flag); //遍历左节点
        if (a && a->data == n)
        { //如果a满足条件，则返回a
            if (*flag)
            {
                Print(root);
            }
            return a;
        }
        struct BinaryTree *b = PrintAncestors(root->RChild, n, int *flag); //遍历右节点
        if (b && b->data == n)
        { //如果b满足条件，则返回b
            if (*flag)
            {
                Print(root);
            }
            return b;
        }
        if (root->data == n) //如果当前节点满足条件，则返回当前节点
        {
            *flag = 1;
            return root;
        }
        else
            return 0;
    }
    else
        return 0;
}

```

　　注意，由于我们是在出栈时输出节点，而不是在入栈时，所以是 `Print(root);` 即输出当前节点。

#### 判断是否为满二叉树

```cpp

int JudgeBiTree(BiTree root)
{
    if (root)
    {
        if (root->LChild && root->RChild)
            return JudgeBiTree(root->LChild) & JudgeBiTree(root->RChild);
        else if (!root->LChild && !root->RChild)
            return TRUE;
        else
            return FALSE;
    }
}

int JudgeBiTree(BiTree root)
{
    if (root)
    {
        if (!root->LChild && !root->RChild)
            return 1;
        return (JudgeBiTree(root->LChild) & JudgeBiTree(root->RChild));
    }
    return 0;
}

int JudgeBiTree(BiTree root)
{
    if (!root)
        return 0;
    if (!root->LChild && !root->RChild)
        return 1;
    else
        return (JudgeBiTree(root->LChild) & JudgeBiTree(root->RChild));
}

```