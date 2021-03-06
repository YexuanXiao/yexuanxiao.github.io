---
layout: post
title: 哈夫曼编码和哈夫曼树
date: "2021-04-29 12:31:00"
tags: [C++,C,docs]
categories: [blog]
---
　　哈夫曼编码是一种无损压缩编码，哈夫曼编码的原理可以简单概括为建立一个 **码长可变的二进制码表** ，每个数据对应的码的前缀都不相同，由此保证不会出现二义性，而哈夫曼树是用于建立码表的最优二叉树，也即 **带权路径长度最短的二叉树**。

<!-- more -->

### 概念

　　建立哈夫曼编码需要需要了解几个概念：

1. 权，即权重，也即该字符在整个数据中出现的概率
2. 路径长度，即从根节点开始得到叶节点，中途移动的次数
3. 带权路径长度，即权 乘以 路径长度

　　哈夫曼编码依靠哈夫曼树来实现，哈夫曼树是依靠权来构建的带权路径长度最短的二叉树。

### 哈夫曼树的建立

　　哈夫曼树的建造过程也不复杂，有以下几步：

1. 算出每个字符对应的权，比如 aabbccddef 中，a，b，c，d 的权是 20%，而 e，f 的权是 10%。在实际使用中可以对权进行二次处理保证权在整体上的比例和权的大小顺序不变即可。
2. 找到最小的两个权，这里给出几个权做示例：2，4，6，8，9，10，最小的两个权即 2，4。
3. 将 2，4 作为叶子节点，2 + 4 的结果 6 作为根节点，然后把权的表中的 2，4 删掉并加入 6。
4. 此时再查找权表中最小的权，是 6 和 6 （注意权是可以重复的），其中一个 6 本身就在树上，那么这个 6 所在节点作为 6 + 6 的结果 12 的子节点，此时树上有 2，4，6，6，12。
5. 重复 3 和 4 ，直到权表中只有一个权，此时这个权为二叉树的根节点。

### 哈夫曼编码的编解码

　　当树建立完成后，我们会发现所有叶节点就是所有的权，此时将 **所有右侧路径标 1 ，左侧路径标 0** ，从根节点开始记录路径，走到叶节点时累计的二进制数就是这个权对应的二进制码。

　　权实际上也对应一个字符，将字符与权所对应的二进制码结合，这时候我们就会得到一个码表，再用码表去替换每个字符，就得到了哈夫曼码。

#### 编码

　　实际应用中我们需要用建立好的哈夫曼树来编解码：

1. 我们先得到第一个字符，然后找到这个字符对应的权，再找到权对应的叶子节点，从叶子结点出发，向根前进。

2. 如果此时的子节点是父节点的左节点，则记录 0，如果是右节点，则记录 1。

3. 走到根节点时，将记录下来的二进制码逆序储存。

4. 重复 1，2，3 步，将后续的二进制码逆序后添加在队尾。

#### 解码

解码实际上就是编码的逆序：

1. 从根节点出发，输入 0 则向左走，输入 1 则向右走。

2. 走到叶子节点时打印字符

3. 重复 1，2 步骤直到达到结尾

### 分析

哈夫曼编码算法的简单分析：

1. 算法根据权重来区别不同字符，权重越大的字符生成的二进制码越短，权重越大的字符在整体占比越高，所以编码后在整体上减小了数据量。
2. 算法使用了前缀编码的概念，即在哈夫曼树生成的码表中，任何一个编码都不是其他任何编码的前缀，这保证了解码时的唯一性。
3. 由于树的性质可知，因为所有的权都是叶子节点，在我们将左路径标 0，右路径标 1 后，每条根节点通往叶子节点的路径都不一样，这就保证了前缀编码。
4. 哈夫曼树的建立过程中，越小的权在树中深度越大，根节点到该权的路径越长，生成的二进制码越长，反过来越大的权对应的二进制码越短，保证了带权路径长度最短。

### 代码实现

（略）
