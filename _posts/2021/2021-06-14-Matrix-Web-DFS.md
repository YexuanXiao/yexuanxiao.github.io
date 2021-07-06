---
layout: post
title: 邻接矩阵深度优先遍历
date: "2021-06-14 22:53:00"
tags: [C++, C, docs]
categories: [blog]
---

<!-- more -->

```cpp

void DFS(MatrixGraph G, int v, int *vis)
{
    //从第一个点开始
    if (!vis[v])
    {
        printf("%c ", G.vertex[v]);
        vis[v] = 1;
    }
    for (int i = 1; i <= G.numVertexes; i++)
    {
        if (G.arc[v][i] != INFINITY && !vis[i])
            DFS(G, i, vis);
    }
}

```