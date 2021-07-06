---
layout: post
title: 迭代实现树的遍历
date: "2021-04-22 11:56:00"
tags: [C++,C,docs]
categories: [blog]
---
　　本文主要解决一个问题，如何实现二叉树的前中后序遍历，有两个要求：

　　O(1) 空间复杂度，即只能使用常数空间；

　　二叉树的形状不能被破坏（中间过程允许改变其形状）。

<!-- more -->

<!--

### 汉诺塔

准备：将三根柱子按顺序排成三角型，n 为偶数时，A、B、C 按顺时针方向依次摆放；n 为奇数时，A、B、C 按逆时针方向依次摆放。

1. 把圆盘 1 从现在的柱子移动到顺时针方向的下一根柱。
2. 接着，把另外两根柱上可以移动的圆盘移动到新的柱上。
3. 如果没有达到目标要求，则返回第二步。

参考：[Wikipedia_Tower_of_Hanoi_Binary_solution](https://en.wikipedia.org/wiki/Tower_of_Hanoi#Binary_solution)

-->

　　通常，实现二叉树的前序（preorder）、中序（inorder）、后序（postorder）遍历有两个常用的方法：一是递归，二是使用栈实现的迭代版本。这两种方法都是 O(n) 的空间复杂度。

　　Morris Traversal 方法可以做到这两点，与前两种方法的不同在于该方法的空间复杂度只有 O(1)，而且同样可以在 O(n) 时间内完成。

　　要使用 O(1) 空间进行遍历，最大的难点在于，遍历到子节点的时候怎样重新返回到父节点（假设节点中没有指向父节点的 p 指针），由于不能用栈作为辅助空间。为了解决这个问题，Morris 方法用到了线索二叉树（threaded binary tree）的概念。在 Morris 方法中不需要为每个节点额外分配指针指向其前驱（predecessor）和后继节点（successor），只需要利用叶子节点中的左右空指针指向某种顺序遍历下的前驱节点或后继节点就可以了。

　　Morris 只提供了中序遍历的方法，在中序遍历的基础上稍加修改可以实现前序，而后续就要再费点心思了。所以先从中序开始介绍。

　　首先定义在这篇文章中使用的二叉树节点结构，即由 val，left 和 right 组成：

```cpp

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

```

### 中序遍历 

1. 如果当前节点的左孩子为空，则输出当前节点并将其右孩子作为当前节点。

2. 如果当前节点的左孩子不为空，在当前节点的左子树中找到当前节点在中序遍历下的前驱节点。（前驱节点即“当前节点左子树的最右叶子节点”，此时最右节点的右儿子有两种情况，一种是指向当前节点，一种是为空）
    
    a) 如果前驱节点的右孩子为空，将它的右孩子设置为当前节点。当前节点更新为当前节点的左孩子。

    b) 如果前驱节点的右孩子为当前节点，将它的右孩子重新设为空（恢复树的形状）。输出当前节点。当前节点更新为当前节点的右孩子。

3. 重复以上1、2直到当前节点为空。

　　上面1、2两步有点拗口，略作调整： 

1. 如果当前节点的左孩子为空，则输出当前节点并将当前节点的右孩子作为“新的当前节点”。
    
2. 如果当前节点的左孩子不为空，在当前节点的左子树中找到当前节点在中序遍历下的前驱节点。

    a) 如果前驱节点的右孩子为空，那么将当前节点设置为前驱节点的右孩子。把当前节点的左孩子设置为”新的当前节点“。

    b) 如果前驱节点的右孩子为当前节点，将前驱节点的右孩子重新设为空（即恢复树的形状）。然后输出当前节点，并将当前节点的右孩子设置为 “新的当前节点”。

　　下图为每一步迭代的结果（从左至右，从上到下），cur 代表当前节点，深色节点表示该节点已输出。 

![1](https://tva3.sinaimg.cn/large/005ZJ4a1ly1gpsfd83vtrj30m809gdjn.jpg "candark")

```cpp

void inorderMorrisTraversal(TreeNode *root) {
    TreeNode *cur = root, *prev = NULL;
    while (cur != NULL)
    {
        if (cur->left == NULL)          // 1.
        {
            printf("%d ", cur->val);
            cur = cur->right;
        }
        else
        {
            // find predecessor
            prev = cur->left;
            while (prev->right != NULL && prev->right != cur)
                prev = prev->right;

            if (prev->right == NULL)   // 2.a)
            {
                prev->right = cur;
                cur = cur->left;
            }
            else                       // 2.b)
            {
                prev->right = NULL;
                printf("%d ", cur->val);
                cur = cur->right;
            }
        }
    }
}

```


#### 复杂度分析：

　　空间复杂度：O(1)，因为只用了两个辅助指针。

　　时间复杂度：O(n)。证明时间复杂度为 O(n)，最大的疑惑在于寻找中序遍历下二叉树中所有节点的前驱节点的时间复杂度是多少，即以下两行代码：

```cpp

while (prev->right != NULL && prev->right != cur)
    prev = prev->right;

```

　　直觉上，认为它的复杂度是 O(n*lgn)，因为找单个节点的前驱节点与树的高度有关。事实上，寻找所有节点的前驱节点只需要O(n)时间。n 个节点的二叉树中一共有 n-1 条边，整个过程中每条边最多只走 2 次，一次是为了定位到某个节点，另一次是为了寻找上面某个节点的前驱节点，如下图所示，其中红色是为了定位到某个节点，黑色线是为了找到前驱节点。所以复杂度为 O(n)。

![2](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gpsfh7afkyj305k04q74n.jpg "candark")


### 前序遍历

　　前序遍历与中序遍历相似，代码上只有一行不同，不同就在于输出的顺序。

1. 如果当前节点的左孩子为空，则输出当前节点并将其右孩子作为当前节点。

2. 如果当前节点的左孩子不为空，在当前节点的左子树中找到当前节点在中序遍历下的前驱节点。
    
    a) 如果前驱节点的右孩子为空，将它的右孩子设置为当前节点。输出当前节点（在这里输出，这是与中序遍历唯一一点不同）。当前节点更新为当前节点的左孩子。

    b) 如果前驱节点的右孩子为当前节点，将它的右孩子重新设为空。当前节点更新为当前节点的右孩子。

重复以上1、2直到当前节点为空。

![3](https://tva4.sinaimg.cn/large/005ZJ4a1ly1gpsfi4ef1rj30m809g0wn.jpg "candark")


```cpp

void preorderMorrisTraversal(TreeNode *root) {
    TreeNode *cur = root, *prev = NULL;
    while (cur != NULL)
    {
        if (cur->left == NULL)
        {
            printf("%d ", cur->val);
            cur = cur->right;
        }
        else
        {
            prev = cur->left;
            while (prev->right != NULL && prev->right != cur)
                prev = prev->right;

            if (prev->right == NULL)
            {
                printf("%d ", cur->val);  // the only difference with inorder-traversal
                prev->right = cur;
                cur = cur->left;
            }
            else
            {
                prev->right = NULL;
                cur = cur->right;
            }
        }
    }
}

```


### 后序遍历

　　后续遍历稍显复杂，需要建立一个临时节点 dump，令其左孩子是 root。并且还需要一个子过程，就是倒序输出某两个节点之间路径上的各个节点。

1. 当前节点设置为临时节点 dump。

2. 如果当前节点的左孩子为空，则将其右孩子作为当前节点。

3. 如果当前节点的左孩子不为空，在当前节点的左子树中找到当前节点在中序遍历下的前驱节点。
    
    a) 如果前驱节点的右孩子为空，将它的右孩子设置为当前节点。当前节点更新为当前节点的左孩子。
    
    b) 如果前驱节点的右孩子为当前节点，将它的右孩子重新设为空。倒序输出从当前节点的左孩子到该前驱节点这条路径上的所有节点。当前节点更新为当前节点的右孩子。

重复以上1、2直到当前节点为空。

![4](https://tvax2.sinaimg.cn/large/005ZJ4a1ly1gpsfk4ir6nj30m80awgq9.jpg "candark")


```cpp


void reverse(TreeNode *from, TreeNode *to) // reversethe tree nodes 'from' -> 'to'.
{
    if (from == to)
        return;
    TreeNode *x = from, *y = from->right, *z;
    while (true)
    {
        z = y->right;
        y->right = x;
        x = y;
        y = z;
        if (x == to)
            break;
    }
}

void printReverse(TreeNode* from, TreeNode *to) //print the reversed tree nodes 'from' -> 'to'.
{
    reverse(from, to);

    TreeNode *p = to;
    while (true)
    {
        printf("%d ", p->val);
        if (p == from)
            break;
        p = p->right;
    }

    reverse(to, from);
}

void postorderMorrisTraversal(TreeNode *root) {
    TreeNode dump(0);
    dump.left = root;
    TreeNode *cur = &dump, *prev = NULL;
    while (cur)
    {
        if (cur->left == NULL)
        {
            cur = cur->right;
        }
        else
        {
            prev = cur->left;
            while (prev->right != NULL && prev->right != cur)
                prev = prev->right;

            if (prev->right == NULL)
            {
                prev->right = cur;
                cur = cur->left;
            }
            else
            {
                printReverse(cur->left, prev);  // call print
                prev->right = NULL;
                cur = cur->right;
            }
        }
    }
}

```

<p class="copyright">本文转载自 CSDN 博主 dxx707099957 的文章 <a herf="https://blog.csdn.net/dxx707099957/article/details/88550437">《二叉树的非递归遍历（不用栈、O(1)空间）》</a>，转载时请注明出处</p>