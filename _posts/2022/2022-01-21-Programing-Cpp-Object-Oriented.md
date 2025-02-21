---
title: 程序设计，C++ 与面向对象
date: "2022-01-21 06:34:00"
update: "2022-02-09 04:13:00"
tags: [C++,philosophy]
category: blog
---

纵观大型软件开发，主流三大操作系统 Linux（发行版），Windows，macOS 的内建应用都广泛使用 C/C++ 作为主要开发语言；Java 和 Go 作为服务器后端开发语言；作为 Native UI 开发使用 C#（.NET），C++（KDE），Swift（iOS），OBJ-C（iOS），Java（Android），Kotlin（Android）。这其中除了 C 语言之外都具备两个特点：静态类型和面向对象。

<!-- more -->

静态类型语言由于其对于数据的储存和使用更轻量，并且可以在编译期确定类型，所以效率比动态类型语言高许多。
而面向对象最主要的特性是提供了对接口的封装，使得程序的逻辑更清晰，便于维护。

必须承认许多应用广泛的项目还在用 C 甚至 Fortran，这也是一种合理的选择：C 和 Fortran 的语法相对简单，易于上手，并且很多老项目拥有庞大的代码，不可能迁移到其他语言，这里列举一些 C 语言和 C++ 的例子阐述这种原因：

+ Windows，Linux 以及 BSD（如 macOS）：作为系统内核开发，C++ 比 C 确实没有过多优势，C++ 的不当使用反而会造成额外负担，C 简洁易于控制。相比之下，驱动开发和高效应用就广泛使用 C++，例如 CUDA 和 Chrome。
+ x264：x264 最早写于 2004 年，作为一个图像编码软件，x264 更在意数学算法而不是抽象设计。作为对比，x265 写于 2013 年，使用 C++ 开发。此外，x264 和 x265 也大量使用汇编。
+ Redis：作为 NoSQL 数据库，Redis 的终极目标就是快，而 C++ 的很多抽象设计降低了效率的上限。相比之下 MySQL 设计为功能完善的通用数据库，使用 C++ 无可厚非。

C 不支持类不代表不支持 OO，只不过类能够提供额外便利使得 OO 的结构更清晰：

### 封装

面向对象的语言通常提供了多种层次的封装。

最基础的就是命名空间（C++/C#），Java 中类似的是 package。命名空间是对代码名称的封装，直接解放了广大程序员瘠薄的词汇表，心安理得的使用组合来保证命名清晰且不冲突，并且易于使用。当然也可以使用没有成员变量的类来进行封装。

第二层封装是对数据的封装，类的设计让类中用于实现类内功能的变量对外隐藏，通过成员函数访问和操作对象。这样可以使得代码更清晰，因为调用成员函数的时候就已经确定了对象是哪一个，同时成员函数属于类定义的一部分，使得代码编写的时候能够更好的对代码进行审查。

第三层封装是对接口的封装。C# 和 Java 使用委托，通过继承实现接口（Interface）。而 C++ 的模板可以避免一部分的接口使用继承，不过 C++ 的多态仍需要使用继承实现接口。

此外还有友元函数的封装性：友元函数通常是重载的全局函数，用于简化某些全局接口，同时避免使用多层包装器造成的代码不清晰问题。

### 继承

主流静态类型面向对象语言实现了基于 **类** 的继承，包括 C++，C#，Java 等，继承实现了组合和多态。

OO 的常见错误思想是尽可能的继承（通过分类），但这种思想是不尽合理的：陈硕在 [C++ 工程实践经验谈](https://github.s3.amazonaws.com/downloads/chenshuo/documents/CppPractice.pdf) 中提到了一个非常恰当的例子：不会飞的企鹅是不是鸟：如果企鹅继承自鸟，鸟实现了飞行接口，那企鹅如何对这个接口进行实现？

在继承这种设计发明之后，人们就发现了继承关系不能很好的表达现实世界中的继承关系。虽然 C++ 甚至罕见的支持非虚基类的多继承（相比于 C# 和 Java 的虚基类多继承），把继承关系从树解放成为了图，但是仍然不能解决企鹅该不该继承鸟的问题。

即使不存在上述问题，滥用继承仍然会导致继承关系复杂，毕竟图可比树在理解和实践中都复杂多了。典型例子就是标准库中的 iostream，参考陈硕的分析 [C++ 工程实践(7)：iostream 的用途与局限](https://www.cnblogs.com/Solstice/archive/2011/07/17/2108715.html)。

![iostream](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gym5q5yzhrj30u70fqady.jpg "candark")

我还找到了 Bjarne Stroustrup 在 C++ 标准化之时写的 stream 的类图 [^1] ，初始的 stream 类虽然仍有虚继承（甚至于 C++ 设计虚继承的原因之一就是为了描述 iostream），不过没有 streambuf 和 ios_base，更没有 locale，但是这种基本的设计仍然能满足于现今的使用，不得不让人质疑这些扩展的必要性。

![image](https://tvax3.sinaimg.cn/large/005ZJ4a1ly1gz6qlfrmzaj30o00mogn0.jpg "candark")

就现在来看，标准库中的许多设施似乎并未考虑作为基类提供给用户进一步继承使用，但是这些设施又存在一定局限性，由此产生了矛盾，进而遭受许多批判。

设计继承关系时一定要谨慎：

1. 如果已经有多个完整类型，并且这些类型有相似之处，则基类必须是从多个类中 **抽象** 出来的，而不是靠简单的分类分出来的。换句话说基类不管是不是抽象类，一定要保证基类能 **完整** 的表示一个 **概念**，如果基类自身不完整，则说明这个基类的抽象意义不大；同时也要保证基类的 **纯粹**，即基类只应该负责自己该负责的部分，不应该过度设计。
2. 如果从头设计整个类和继承关系，则也应从实际出发，先设计接口，再设计类。等到所有派生类设计完成后，再考虑每个派生类是否含有公共的部分，公共部分是否完整，在保持纯粹的前提下将基类抽象出来。

OOP 提出过一种表示关系的方法：is-a 和 has-a。is-a 表示派生类一定是基类，下文的多态表达式就是这种关系；has-a 表示接口抽象，派生类具有基类的接口，下文的多态接口就是这种关系。但这两种表示方式不足以表示继承关系，我认为还需要第三种关系：shall-a，即派生类的实例化成员可被作为基类使用，并且派生类不一定覆写基类接口。基类自己就可以独立完成工作，但是派生类为基类的构造提供了便利。

总的来说，OOP 最重要的是接口，接口的设计优先于一切，在接口设计完成的前提下，再去考虑设计组合和继承关系，并且继承关系尽可能的清晰。

[^1]: 出自《C++ 语言的设计和演化》第十二章。

### 多态容器

面向对象多态的最直接用法就是多态容器，即使用基类指针或者基类引用管理不同类型。

对于 C++ 来说，此时就需要基类使用虚析构函数使得派生类能够被正确的析构而不会内存泄漏。

同时这种手法也是 Java 泛型的实现：所有 Java 类都继承 Object，因此实现了 Object 的容器即可用于其他类。

### 多态接口

C++，C# 和 Java 都可以用虚继承实现接口：定义一个没有成员变量的虚基类，使派生类继承该接口，该派生类即具有基类的接口。使用时只需要传递派生类的指针或者引用作为基类的指针或者引用，再对基类调用成员函数即可。调用者不需要关心派生类的实现细节。

对于 C++ 而言，由于支持模板技术，通过编译器的参数类型推导即可使用静态接口。

### 多态表达式

多态表达式是类式继承最大化的利用方式，两本经典 C++ 著作都对其进行了详细的表述：

+ C++ 沉思录：第八章 一个面向对象程序范例
+ C++ Primer：第十五章 面向对象程序设计

#### 数学表达式

C++ 沉思录中介绍了如下的一种数学表达式：

`Expr e = Expr("*", Expr("-", 5), Expr("+", 3, 4));`

`e = Expr("*", t, t);`

很明显，这是前缀表达式，第一个表达式计算 (- 5) * (3 + 4)。

![image](https://tva2.sinaimg.cn/large/005ZJ4a1gy1gyr7cpfbhvj30fo0drt9h.jpg "candark")

对于节点，可以将其分类：整数，一元表达式，二元表达式。

同时，这三种节点不可继续拆分。那么先设计一个能表示所有种类节点的基类：

```cpp

class Expr_node {
    friend std::ostream& operator<< (std::ostream&, const Expr_node&);
protected:
    virtual std::ostream& print(std::ostream&) const = 0;
    virtual ~Expr_node(){}
};

```

首先这个类需要一个虚析构函数，这样才能保证子类对象能够正确被析构。

注意虚析构函数必须有定义，因为虚构函数不同于其他虚函数：子类析构时，会产生一个析构链，先调用子类析构函数再调用基类析构函数，如果基类没有析构函数的定义，则会产生链接错误。

不过，析构函数也可以定义为纯虚函数，即声明为 `= 0;` 的同时在类外通过作用域运算符定义函数体：

```cpp

class Expr_node {
    friend std::ostream& operator<< (std::ostream& o, const Expr_node& e){
        return e.print(o);
    }
protected:
    virtual std::ostream& print(std::ostream&) const = 0;
    virtual ~Expr_node() = 0;
};

Expr_node::~Expr_node(){}

```

实际上所有纯虚函数都可以使用相同方法添加定义，并且除了纯虚析构函数以外的有定义纯虚函数只能通过作用域运算符显式调用。

其次定义了一个友元函数 `operator<<` 用于输出节点，但是由于友元函数不是成员函数，不具有多态，所以还需要额外的 print 函数用于输出。并且由于友元函数可以访问非公开成员，所以 print 函数被设计为 protected。由于 print 函数不修改节点内容，所以 print 函数声明为 const，同理友元函数的节点变量也声明为 const。

然后分别实现整数节点，一元表达式节点和二元表达式节点：

```cpp

class Int_node : public Expr_node {
    int n;
    std::ostream& print(std::ostream& o) const {
        return o << n;
    }
public:
    Int_node(int k) : n(k) {}
};

class Unary_node : public Expr_node {
    std::string op;
    const Expr_node* opnd;
    std::ostream& print(std::ostream& o) const {
        return o << "(" << op << *opnd << ")";
    }
public:
    Unary_node(const std::string a, const Expr_node* b) : op(a), opnd(b) {}
};

class Binary_node : public Expr_node {
    std::string op;
    const Expr_node* left;
    const Expr_node* right;
    std::ostream& print(std::ostream& o) const {
        return o << "(" << *left << op << *right << ")";
    }
public:
    Binary_node(const std::string& a, const Expr_node* b, const Expr_node* c) : op(a), left(b), right(c) {}
};

```

现在这个类已经初具雏形了，但是此时有一个严重的问题摆在面前：一元表达式和二元表达式的创建期望获得指针，但是并没有使用任何内存回收，这将导致内存泄漏：

```cpp

Binary_node *e = new Binary_node("*", new Unary_node("-", new Int_node(5)), new Binary_node("+", new Int_node(3), new Int_node(4)));

std::cout << *e << std::endl; // 打印((-5)*(3+4))

```

并且不得不公开派生类的构造函数。

使用 C++11 增加的 std::unique_ptr 类能够防止内存泄漏，但这并不是最初的目的。

真正的解决方法是额外设计一个用于管理节点的表达式类，这个类是所有节点类的友元类（由于友元关系不能继承），用于表示边：

```cpp

class Expr {
    friend std::ostream& operator<<(std::ostream&, const Expr&);
    Expr_node *node;
public:
    Expr(int n) {
        node = new Int_node(n);
    }
    Expr(const std::string& op, Expr t){
        node = new Unary_node(op, t);
    }
    Expr(const std::string& op, Expr left, Expr right){
        node = new Binary_node(op, left, right);
    }
    Expr(const Expr& t);
    ~Expr();
    Expr& operator=(const expr& rhs);
};

```

![屏幕截图 2022-01-26 172837](https://tvax1.sinaimg.cn/large/005ZJ4a1gy1gyrekh6gskj30fo0fajs7.jpg "candark")

基本思路是每个边持有一个节点，每个一元节点持有一个边，每个二元节点持有两个边。每个节点持有一个引用计数。

`Expr t = Expr("*", Expr("-", Expr(5)), Expr("+", Expr(3), Expr(4)));`

由于允许隐式转换，所以可以进行简写（不过仍需使用根本方式进行理解）：

`Expr e = Expr("*", Expr("-", 5), Expr("+", 3, 4));`

从根节点开始构造，在这种表示方式下，二叉树的边数等于节点数，正如所看到的使用 6 个 Expr 对 t 进行构造，每次构造 Expr 时，都会顺带构造一个 Expr_node，并持有其指针。

完整代码及注释如下：

```cpp

#include <iostream>
#include <string>


class Expr_node;

class Expr {
    friend std::ostream& operator<<(std::ostream& o, const Expr& e);
    Expr_node* node;
public:
    Expr(int data);
    Expr(const std::string& op, Expr e);
    Expr(const std::string& op, Expr a, Expr b);
    Expr(const Expr& e);
    Expr& operator=(const Expr& rhs);
    std::ostream& print(std::ostream&) const;
    ~Expr();
};

class Expr_node {
    friend class Expr;
    friend std::ostream& operator<<(std::ostream& o, const Expr_node& e);
    friend std::ostream& operator<<(std::ostream& o, const Expr& e);
protected:
    Expr_node() : count(0) {}
    virtual ~Expr_node() = default;
private:
    unsigned int count;
    virtual std::ostream& print(std::ostream&) const = 0;
};

class Int_node final: public Expr_node {
    friend class Expr;
    int num;
    Int_node(int k) :Expr_node(), num(k) {}
    std::ostream& print(std::ostream& o) const override { return o << num; }
};

class Unary_node final: public Expr_node {
    friend class Expr;
    std::string op;
    Expr opend;
    Unary_node(const std::string& a, Expr b)
        :Expr_node(), op(a), opend(b) {}
    std::ostream& print(std::ostream& o) const override {
        return o << "(" << op << opend << ")";
    }
};

class Binary_node final: public Expr_node {
    friend class Expr;
    std::string op;
    Expr left;
    Expr right;
    Binary_node(const std::string a, Expr b, Expr c)
        :Expr_node(), op(a), left(b), right(c) {}
    std::ostream& print(std::ostream& o) const override {
        return o << "(" << left << op << right << ")";
    }
};

Expr::Expr(int data) {
    node = new Int_node(data);
}

Expr::Expr(const std::string& op, Expr e) {
    node = new Unary_node(op, e);
}

Expr::Expr(const std::string& op, Expr a, Expr b) {
    node = new Binary_node(op, a, b);
}

Expr::Expr(const Expr& e) {
    node = e.node; // 由于表达式是使用指针形成的树状结构，若不提供完整的结构化复制，则必须采用引用计数
    ++node->count; // 由于该函数是利用已有表达式构造新的表达式，且已有表达式内含节点指针，则该指针被两个表达式共享
}

Expr::~Expr() {
    if (node->count == 0)
    {
        delete node;
    }
}

Expr& Expr::operator=(const Expr& rhs) {
    rhs.node->count++; // 此处也是使用已有表达式构造新表达式
    if (node->count == 0) // 此处判断子节点是否有意义，若无意义则回收内存
    {
        delete node;
    }
    node = rhs.node;
    return *this;
}

std::ostream& Expr::print(std::ostream& o) const {
    return node->print(o); // 转发器
}

std::ostream& operator<<(std::ostream& o, const Expr& e) {
    return e.node->print(o); // 必须同时为 Expr 和 Expr_node 的友元才能通过通过 node 访问 print
    // return e.print(o); // 或者使用转发器
}

int main() {
    Expr t = Expr("*", Expr("-", Expr(5)), Expr("+", Expr(3), Expr(4)));
    std::cout << t << std::endl;
    t = Expr("*", t, t);
    std::cout << t << std::endl;
    return 0;
}

```

由于 Expr 类和 Expr_node 类互相依赖，则需要注意以下几点，否则无法编译：

1. Expr_node 中的友元函数 `std::ostream& operator<<(std::ostream& o, const Expr& e)` 有 Expr 类参数，所以 Expr 的定义必须在 Expr_node 之前
2. 由于 `std::ostream& operator<<(std::ostream& o, const Expr& e)` 依赖 Expr 和 Expr_node 的定义，所以函数必须定义在两者定义之后
3. 由于 Expr 中存在指向 Expr_node 的指针，但又要求 Expr 在 Expr_node 之前定义，所以需要对 Expr 进行前置声明
4. Expr 类的构造函数需要 Int_node，Unary_node，Binary_node 三个类的定义，但是又要求 Expr 在 Expr_node 之前定义，所以构造函数必须在三种节点之后定义

本例中实现了自己维护的引用计数代码，实践中也可以使用 std::shared_ptr 之类的智能指针进行内存回收。

最后，还可以为该表达式计算类添加计算函数，按照 print 的逻辑就可以。

#### 文本查询表达式

C++ Primer 提出了一种文本查询类，该类被设计为可以使用 C++ 自身的逻辑运算符（实际是对操作符进行重载）进行文本查询：

`Query q = Query("fiery") & Query("bird") | Query(wind)`

这与上述的数学表达式类稍有不同，但是，基本思路是一样的。

同样的，查询过程是树状的，书中有非常详细的解释：

![image](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gysg4owh5ej31390zztng.jpg "candark")

![image](https://tva2.sinaimg.cn/large/005ZJ4a1ly1gysg5kcsj2j31280u2aos.jpg "candark")

```cpp

#include <vector>
#include <set>
#include <map>
#include <memory>
#include <sstream>
#include <iostream>
#include <algorithm>

namespace {
	using vsize_t = std::vector<std::string>::size_type;
	using std::map;
	using std::string;
	using std::vector;
	using std::set;
	using std::shared_ptr;
	using std::make_shared;
	using std::ostream;
	using std::cout;
	using std::endl;
	using std::istream;
	using std::istringstream;
}

class TextQuery;
class Query;
class WordQuery;

class QueryResult {
	friend ostream& operator<<(ostream&, const QueryResult&);
public:
	QueryResult(const string& s, shared_ptr<set<vsize_t>> set,
		shared_ptr<vector<string>> v)
		: expect(s), lines(set), text(v) {}
	auto begin() { return lines->begin(); }
	auto end() { return lines->end(); }
	auto get_text() { return text; } // 保存文本的每行
private:
	string expect;
	shared_ptr<set<vsize_t>> lines; // 用 set 保存行号，自动排序
	shared_ptr<vector<string>> text; // 保存文本的每行
};

class TextQuery {
public:
	TextQuery(istream&);
	QueryResult query(const string&) const;

private:
	shared_ptr<vector<string>> text; // 保存输入的 vector 的智能指针
	map<string, shared_ptr<set<vsize_t>>> result; // 单词及其对应的行号
};

class Query;
class Query_base {
	friend class Query;
protected:
	virtual ~Query_base() = default;
private:
	virtual QueryResult eval(const TextQuery&) const = 0; // 返回查询结果
	virtual string rep() const = 0; // 生成要查询的内容
};

class WordQuery : public Query_base {
	friend class Query;
	WordQuery(const string& s) :expect(s) {}
	QueryResult eval(const TextQuery& t) const {
		return t.query(expect);
	}
	string rep() const { return expect; }
	string expect;
};

class Query {
	friend Query operator~(const Query&);
	friend Query operator|(const Query&, const Query&);
	friend Query operator&(const Query&, const Query&);
public:
	Query(const string& s) : q(new WordQuery(s)) {}
	QueryResult eval(const TextQuery& t) const
	{
		return q->eval(t);
	}
	string rep() const { return q->rep(); }
private:
	Query(shared_ptr<Query_base> query) : q(query) {} // And,Or,Not
	shared_ptr<Query_base> q;
};

class NotQuery : public Query_base {
	friend Query operator~(const Query&);
	NotQuery(const Query& q) : query(q) {}
	string rep() const { return "~(" + query.rep() + ")"; } // WordQuery::rep() 
	QueryResult eval(const TextQuery&) const;
	Query query;
};

class BinaryQuery : public Query_base
{
protected:
	BinaryQuery(const Query& left, const Query& right, string s) :
		lhs(left), rhs(right), opSym(s) {}
	string rep() const { return "(" + lhs.rep() + " " + opSym + " " + rhs.rep() + ")"; }
	Query lhs, rhs;
	string opSym;
};

class AndQuery : public BinaryQuery {
	friend Query operator&(const Query&, const Query&);
	AndQuery(const Query& left, const Query& right) : BinaryQuery(left, right, "&") {}
	QueryResult eval(const TextQuery&) const;
};

class OrQuery : public BinaryQuery {
	friend Query operator|(const Query&, const Query&);
	OrQuery(const Query& left, const Query& right) : BinaryQuery(left, right, "|") {}
	QueryResult eval(const TextQuery&) const;
};

ostream& operator<<(ostream& os, const Query& query) {
	return os << query.rep(); // 输出要查询的字符串
}

TextQuery::TextQuery(istream& is) : text(new vector<string>) { // 以行存放字符串的 vector
	string line; // 一行
	while (getline(is, line)) // <fstream>
	{
		text->push_back(line); // 当前行全部存入 vector
		vsize_t n = text->size() - 1; // 当前行号
		istringstream lines(line); // 分解行文本为单词
		string word;
		while (lines >> word)
		{
			auto& lines = result[word];// 根据当前 word 返回存放行号的 shared_ptr<set<vsize_t>>
			if (!lines) // 如果之前没有出现过该关键词则为空
			{
				lines.reset(new set<vsize_t>); // 分配一个新的 set
			}
			lines->insert(n); // 将当前行号 n 插入到 set
		}
	}
}

QueryResult TextQuery::query(const string& expect) const {
	static shared_ptr<set<vsize_t>> nodata(new set<vsize_t>);
	auto loc = result.find(expect); // 查找关键词，返回迭代器

	if (loc == result.end())
		return QueryResult(expect, nodata, text);
	else
		return QueryResult(expect, loc->second, text); // loc->second 根据当前 word 返回存放行号的 shared_ptr<set<vsize_t>>
}

Query operator~(const Query& operand) {
	return shared_ptr<Query_base>(new NotQuery(operand)); // 返回一个新建的 Query_base 指针，指向 NotQuery，调用 Query 构造函数
}
QueryResult NotQuery::eval(const TextQuery& text) const {
	auto result = query.eval(text); // 查询结果，得到行号
	auto lines = make_shared<set<vsize_t>>(); // 行号集合
	auto beg = result.begin(), end = result.end();
	auto sz = result.get_text()->size(); // 总行数       
	for (vsize_t n = 0; n != sz; ++n)
	{
		if (beg == end || *beg != n)
			lines->insert(n); // 如果不在查询结果中，则放入结果
		else if (beg != end)
			++beg;
	}
	return QueryResult(rep(), lines, result.get_text());
}

Query operator&(const Query& lhs, const Query& rhs) {
	return shared_ptr<Query_base>(new AndQuery(lhs, rhs));
}
QueryResult AndQuery::eval(const TextQuery& text) const {
	auto right = rhs.eval(text), left = lhs.eval(text);
	auto lines = make_shared<set<vsize_t>>();
	set_intersection(left.begin(), left.end(), right.begin(), right.end(),
		inserter(*lines, lines->begin())); // 交集放入 lines
	return QueryResult(rep(), lines, left.get_text());
}

Query operator|(const Query& lhs, const Query& rhs) {
	return shared_ptr<Query_base>(new OrQuery(lhs, rhs));
}

QueryResult OrQuery::eval(const TextQuery& text) const {
	auto right = rhs.eval(text), left = lhs.eval(text);
	auto lines = make_shared<set<vsize_t>>(left.begin(), left.end()); // 复制左侧运算结果
	lines->insert(right.begin(), right.end()); // 加上右侧运算结果，并集
	return QueryResult(rep(), lines, left.get_text());
}

ostream& operator<<(ostream& o, const QueryResult& qr) {
	o << qr.expect << " occors " << qr.lines->size() << " times " << endl; // 关键词和出现次数
	for (auto num : *qr.lines)
	{
		o << " \t(line " << num + 1 << ")" << *(qr.text->begin() + num) << endl; // 关键词所在行
	}
	return o;
}

int main() {
	istringstream str;
	str.str("Alice Emma has long flowing red hair.\nHer Daddy says when the wind blows\nthrough her hair, it looks almost alive,\nlike a fiery bird in flight.\nA beautiful fiery bird, he tells her,\nmagical but untamed.\n“Daddy, shush, there is no such thing,”\nshe tells him, at the same time wanting\nhim to tell her more.\nShyly, she asks, “I mean, Daddy, is there?”");
	TextQuery file = str;
	Query q = Query("fiery") & Query("bird") | Query("wind");
	cout << "Executing Query for: " << q << endl;
	auto result = q.eval(file);
	cout << result << endl;
	return 0;
}

```

### 使用模板代替继承来对类型进行限制

Bjarne Stroustrup 在《C++ 语言的设计和演化》第 15.4.1 节有过如下表述：

![image](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gz6wvbkidoj318q0vykfz.jpg "candark")

<div class="ref-label">注：</div>
