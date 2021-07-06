---
layout: post
title: C 语言线性链表和结构体指针
date: "2020-12-15 23:16:00"
tags: [C,C++,docs]
categories: [blog]
---
　　C 语言的线性链表可以说是基础中的基础，其本质并不复杂，但是要求有一定的抽象能力并能够熟练的运用各种操作符。

<!-- more -->

　　链表本质是一个结构体，与一般的结构体不同的是，链表结构体的成员中有一个类型为结构体本身的指针。

　　由于 C 语言中结构体所占空间的大小是不可以动态修改的，所以结构体中所有数据的大小必须已知。所以我们需要通过指针这种固定大小的数据类型，来对链表的储存容量进行动态扩展。

* toc
{:toc}

## 链表的声明和初始化

```c

struct Link{
    int data;//数据成员
    struct Link *next;//指向本结构体类型的指针
};//注意，结构体声明后需要分号

```

　　这就是一个最基本的 C 语言链表。

　　声明链表头：

`struct Link *Head = 0;`//把指针初始化为空

　　为了方便在链表头部插入元素，我们需要将头部也声明为一个指针。

　　引入 stdlib 后可以使用 NULL 代替 0 初始化空指针，C++ 11 引入了 nullptr 来代替 0 初始化空指针。虽然他们实际上最后都使用了预处理指令变为 0，但是 使用 NULL 和 nullptr 可读性更强。

　　为了简化代码，我们可以使用类型别名的方式来代替繁琐的声明：

***注意，此处用法上，C 和 C++ 是有区别的：***

　　C：

```c

typedef struct Link{
    int data;
    struct Link *next;
}link;

```

　　此时 Link 是模板名，link是（复合）类型别名，可以用 `link *Head;` 代替声明。

```c

typedef struct{
    int data;
    struct Link *next;
}link;

```

　　这种形式也是合法的，但是此时只能用 `link *Head;` 这种格式声明，因为没有模板名，只有类型别名。

C++：

```cpp

struct Link{
    int data;
    struct Link *next;
};

```

　　***C++ 允许直接使用模板名作为类型别名***

　　所以此时可以直接使用 `Link *Head;`，也可以 `struct Link *Head = 0;`

　　而使用 typedef 时与 C 相同。

　　但是，***C++ 允许直接声明结构体变量：***

```cpp

struct Link{
    int data;
    struct Link *next;
}link;

```

　　此时 link 是一个结构体变量，***而不是类型别名！***


## 头结点、头指针和首元结点

　　链表中存放数据的结构体叫做结点。

　　一般，在链表的第一个具有实际意义的结点之前会额外增设一个结点，这个节点一般不存放数据，此结点被称为头结点。

　　如果头结点的指针成员，表明链表是空表。头结点对于链表来说，不是必须的，在处理某些问题时，给链表添加头结点会使问题变得简单。

　　首元结点是链表中第一个元素所在的结点，它是头结点后边的第一个结点。

　　头指针是指向链表中第一个结点的位置的指针（如果链表有头结点，头指针指向头结点；否则头指针指向首元结点）。

## 链表的操作

### 在结尾增加结点

　　动态内存申请需要用到 malloc.h 或者 stdlib.h

　　C：

```cpp

typedef struct Link{
    int data;
    struct Link *next;
}link;

link* append(link *head){//功能：在结尾增加结点并返回当前指针
    link *p = 0;
    link *pre = head;
    int data;
    p = (link *)malloc(sizeof(link));//申请一个结构体大小的内存，返回结构体类型的指针给p，也可以直接写在if里
    if (!p){//注：NULL实际上是一个 `((void *)0)` 的宏，在 stdio 或者 stdlib 有定义，但是规范中使用 0 和 ! 是完全正确的。
        printf("no enough memeory");//一定要判断内存是否申请成功
    }
    if (!head){//如果头指针为空则把p作为首指针
        head = p;
    } else {//如果不是，找到为空的指针
        while (pre -> next){
            pre = pre -> next;//也可以写到while里
        }
        pre -> next = p;//把p添加到末尾
    }
    pre = p;//此时pre是最后一个有效结点
    pre -> next = 0;//设置最后一个结点的指针成员为空指针，防止野指针，重要！
    return pre;//返回当前指针
}

```

### 释放链表内存

由于链表的内存是使用 malloc 在栈中申请的，所以在不使用的时候需要释放内存

```cpp

void freelink(link *rel){//注意，该函数会把所有结点释放，包括首结点
    while(rel){
        link *temp = rel -> next;//创建临时变量储存下一个结点的地址然后释放
        free(rel);
        rel = temp;
    }
}

```

### 删除指定结点

```cpp

link* delnode(link *rel,int offset){//删除指定位置的结点，从首结点之后的一个结点开始计算
        for (int i = 0; i < offset; ++i){
            rel = rel -> next;//每次循环向后移动
            if (!(rel -> next)){//确保该节点存在
                printf("address overflow");
                return rel;
            }
        }
        link *temp = rel -> next;//临时变量用于储存要释放的结点
        if (rel -> next -> next){//如果后面有结点
            rel -> next = rel -> next -> next;//跳过结点
        } else {
            rel -> next = 0;
        }
        free(temp);
        return rel;//返回要删除的结点的前一个结点
}

```

### 搜索某个节点

```cpp

link* findnode(link *rel,int n){
    while(rel){
        if(rel -> data == n)
            return rel;
        else
            rel = rel -> next;
    }
    return 0;
}

```

### 插入结点

```cpp

link* addnode(link *rel,int offset){//添加结点并返回该结点的地址
        for (int i = 0; i < offset; ++i){
            if(!(rel -> next)){//空链表返回空指针
                printf("address overflow");
                return 0;
            } else if (rel -> next){//插入位置在中间
            } else {//插入位置在结尾就调用append
                rel = append(rel);
                return rel -> next;
            }
            rel = rel -> next;
        }
        link *p = (link *)malloc(sizeof(link));//创建新结点
        link *temp = rel -> next;//temp指向后一个结点
        rel -> next = p;//rel的下一个指向p
        p -> next = temp;//p指向temp
        return p;
}

```

### 得到某个结点

```cpp

link* getnode(link *rel,int offset){
    for (int i = 0; i < offset; ++i){
        if (!(rel -> next)){//判断是否是结尾
            printf("address overflow");
            return rel;
        }
        rel = rel -> next;
    } 
    return rel;
}

```

### 删除某个节点

```cpp

int delNode(link *head, int num)
{ //删除指定位置的结点，从首结点之后的一个结点开始计算
    Node *relptr = head;
    if (num < 1)
    {
        return 0;
    }
    if (head->next == 0 && num == 1)
    {
        pList = 0;
        return 0;
    }
    if (head->next == 0 && num > 1)
    {
        return 0;
    }
    for (int i = 2; i < num; ++i)
    {
        //每次循环向后移动
        if (!(relptr->next))
        { //确保该节点存在
            return 0;
        }
        relptr = relptr->next;
    }
    if (relptr->next)
    {
        if (!(relptr->next->next))
        {
            free(relptr->next);
            relptr->next = 0;
            return 1;
        }
        if (relptr->next->next)
        {                              //如果后面有结点
            Node *temp = relptr->next;    //临时变量用于储存要释放的结点
            Node *p = relptr->next->next; //跳过结点
            relptr->next = p;
            free(temp);
            return 1;
        } //else {
        //    rel -> next = 0;
        //}
    }
    return 0;
}

```

## 实例

```cpp

int main(void){
    link *Head = append(Head);//初始化头指针
    for(int i=0;i<20;++i){
        link *rel = append(Head);
        rel -> data = i;
    }
    delnode(Head,5);
    addnode(Head,16);
    link *p = getnode(Head,18);
    p -> data =21;
    freelink(Head);
}

int main(void){
    link *Head = append(Head);//初始化头指针
    for(int i=0;i<20;++i){
        link *rel = append(Head);
        rel -> data = i;
    }
    Head -> data = 32;
    addnode(Head,30);
    addnode(Head,12);
    link *t = getnode(Head,13);
    t -> data = 43;
    //delnode(Head,20);
    //delnode(Head,21);
    addnode(Head,20);
    getnode(Head,21);
    getchar();
}

```