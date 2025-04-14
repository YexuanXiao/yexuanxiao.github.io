---
title: TypeScript 手册指北 Part3
date: "2022-10-18 15:33:00"
tags: [TypeScript,Web]
category: blog
---
TypeScript 手册指北 第三部分，第二部分在 [TypeScript 手册指北 Part2](/blog/2022/10/14/TypeScript-Handbook-Tutorial-2/)，记录了本人阅读 TypeScript 官方手册的一些想法，包含 Classes 的内容。

<!-- more -->

ECMAScript 6 和 TypeScript 的 Class 本质上是带属性的函数的模板，这是由于 JavaScript 中的函数，在 new 之后可以通过 this 来对自身的属性赋值，如果不是通过 `new`，则 `this` 一般指向全局对象。

TypeScript 的 Class 声明在开启 strictPropertyInitialization 后强制使用初始化器或者提供构造函数，以防出现未初始化的变量：

```ts

class Point {
    x: number = 0
    y: number = 0
}

class OKGreeter {
    // Not initialized, but no error
    name!: string
}

```

理所当然的，在有初始化器的情况下类型标注是可选的。如果既没有类型标注也没有初始化器，则类型也理所当然的是 `any`。

如果某一类型的对象来自外部的库，则可使用 ! 来让编译器放弃对初始化的要求。

与 C++ 不同的是，构造函数必须使用 `this` 来对属性进行赋值，这其实也是理所当然的，因为 Class 在实现上等价于函数：

```ts

class GoodGreeter {
    name: string
    constructor() {
        this.name = 'hello'
    }
}

function GoodGreeter() {
    this.name = 'hello'
    return this
}

```

当然，TypeScript 的语法中 Class 不是函数，这两种写法不等价，这种表示只是为了说明原因。

和 C++ 的 `const` 类似，TypeScript 可以把属性标记为只读，但构造函数不受此限制：

```ts

class Greeter {
    readonly name: string
    constructor(otherName: string = '') {
        this.name = otherName
    }
    /*
    constructor(otherName?: string) {
        if (otherName !== undefined) {
            this.name = otherName
        }       
        otherName = ''
    }
    */
}

```

和普通函数一样，构造函数也可也有默认值，也可以有可选参数，初始化的方式和 C++ 一样多样，并且构造函数和普通函数一样支持重载。

和 C++ 类似的是，构造函数也没有泛型参数和返回值。

很不幸的是，TypeScript 可能是为了减轻 JavaScript 学习者的负担，派生类调用基类构造并没有选择 C++ 和 C# 的先进方式，而是选择了与 JavaScript 兼容，使用了和 Java 一样的方式，通过在派生类的函数体第一句上使用 `super` 代表基类构造函数来完成基类的构造。所以 JavaScript 和 Java 没有关系这句话是假的。2015 年还抄 Java 的这个特性，看得出来 ECMAScript 委员会真的很没品。

TypeScript 还支持 getter 和 setter：

```ts

class C {
    private _length = 0
    get length() {
        return this._length
    }
    set length(value) {
        this._length = value
    }
}

```

getter 和 setter 可以伪装成一个只读/只写的属性，内部操纵真正的属性，从而使得成员为 `private` 的时候能够进行单向访问控制。

TypeScript 4.3 开始 setter 和普通函数一样参数支持联合类型（实际上本来就可以支持，因为如果不标注默认为 `any`）。

由于 [Type-only Field Declarations](https://www.typescriptlang.org/docs/handbook/2/classes.html#type-only-field-declarations) 的原因，不建议用 getter 和 setter，属于垃圾特性。

#### 索引签名

Classes 和 `object` 类型类似，支持索引签名：

```ts

class MyClass {
    [s: string]: boolean | ((s: string) => boolean)
    check(s: string) {
        return this[s] as boolean
    }
}

```

#### 继承

```ts

interface Pingable {
    ping(): void
}
class Sonar implements Pingable {
    ping() {
        console.log('ping!')
    }
}

```

TypeScript 中派生类可以实现（implements）多个接口或者类型别名，使用逗号分隔。

和 C++ 不同的是，TypeScript 中的 `interface` 和 `type` 的类型系统和 `class` 的类型系统是独立的两个系统，这意味着实现了 `interface` 的一个 `class` 并不代表它也是这个 `interface` 的对象：记住，`class` 的对象是 `function`，而 `interface` 的对象是 `object`。

实际上实现 `interface` 或者 `type` 更像是加上了一种约束，并且 `class` 内的属性必须完全和其实现的接口或者类型别名一致，这意味着不能依赖实现目标来自动推导出属性的类型。

和 C++ 的继承类似的是 `extends`，当然，TypeScript 没有虚函数，所以整套“继承”系统实际上是通过“实现”来约束属性，通过“扩展”来复用代码。

```ts

class Animal {
    move() {
        console.log('Moving along!')
    }
}

class Dog extends Animal {
    woof(times: number) {
        for (let i = 0 i < times i++) {
            console.log('woof!')
        }
    }
}

```

理所当然的，“扩展”后的派生类也支持覆盖基类的函数，同时，和 Java 类型，使用 `super` 关键词来指代基类实现调用基类被覆盖的函数。

和 C++ 类似的是，派生类重写的函数必须兼容被覆盖的函数：

```ts

class Base {
    greet() {
        console.log('Hello, world!')
    }
}

class Derived extends Base {
    greet(name?: string) {
        if (name === undefined) {
            super.greet()
        } else {
            console.log(`Hello, ${name.toUpperCase()}`)
        }
    }
    // greet(name: string)
    // not assignable to the same property
    // Type '(name: string) => void' is not assignable to type '() => void'.
}

```

TypeScript 的成员初始化方式和 C++ 类似，先使用基类初始化器，再使用构造函数，再使用派生类初始化器和派生类构造函数。

TypeScript 的函数也是属性的一种，函数也是对象，由于 [Type-only Field Declarations](https://www.typescriptlang.org/docs/handbook/2/classes.html#type-only-field-declarations) 的原因，需要避免基类和派生类中的属性名字撞车，除非覆盖掉基类的函数，否则不要使用一个名字。

实际上现行版本中，在派生类中重复定义的基类属性，会覆盖掉基类的属性，并且可以改变 `protected` 可见性。

#### 成员可见性

TypeScript 支持成员可见性，使用类似 C++ 的 `protected`，`private` 和 `public` 来控制成员是否对外部或者派生类可见。

幸运的是，ECMAScript 不支持成员可见性，所以 TypeScript 不需要向 ECMAScript 妥协：若类 `Base` 存在受保护成员 `p`，则外部不可以直接访问 `p`；`Derived` 继承 `Base`，则 `Derived` 的成员函数不能通过 `Base` 的引用访问 `p`，但可以通过 `Dervied` 的引用访问 `p`。C# 和 C++ 遵循相同的规则，而 Java 允许此时通过 Base 的引用访问 `p`。

和 C++ 类似，基类的受保护成员的可见性可以被修改，而基类的私有成员则不可见。

此外，TypeScript 允许使用下标属性访问法访问私有成员。

#### 构造函数

不仅仅通过属性声明来声明属性，还可以通过构造函数声明属性：

```ts

class FileSystemObject {
    constructor(public path: string, private networked: boolean) {}
}

class FileRep extends FileSystemObject {
    constructor(path: string, public content: string) {
    }
}

```

在构造函数的参数上添加可见性修饰符，或者只读说明符则可将该参数声明为属性，构造函数内会自动生成 `this.para = para`。

#### 静态成员

和 C++ 类似，TypeScript 也支持静态成员。静态成员可以控制可见性，使用和 C# 一样的访问方式。

有一点需要注意的是，在 JavaScript 的类型系统中，继承是通过原型实现的，所以有一些名字已经被使用了，无法作为静态成员：`name`，`length` 和 `call`。

#### 静态块

TypeScript 从 ECMAScript 2022 中间接的继承了 Java 的静态块用于初始化静态成员。但这实在是一个鸡肋的功能，除了增加逻辑的复杂度以外毫无用处。

#### 泛型类

理所当然的，类也支持泛型，并且和泛型函数有着类似的语法。并且和 C++ 的类模板实参推导（CTAD）类似的是，TypeScript 支持泛型类实参推导，这意味着可以通过构造函数来推导出泛型类型。

#### this 归属

由于 JavaScript 为动态类型，因此代码的行为会随着类型的改变而改变：

```ts

class MyClass {
    name = 'MyClass'
    getName() {
        return this.name
    }
}
const c = new MyClass()
const obj = {
    name: 'obj',
    getName: c.getName,
}
 
// Prints 'obj', not 'MyClass'
console.log(obj.getName())

```

虽然这种写法在 TypeScript 不常见而且很难发生，但是需要注意的是，`obj` 可能是用户创建的，并且所有 TypeScript 代码都会转换为 JavaScript 执行。

为了解决这个问题，有两种解决方案：

```ts

class MyClass {
    name = 'MyClass'
    getName = () => {
        return this.name
    }
}

```

使用箭头函数可以消除错误，但是会占用更多的内存，并且不能再使用 `super` 来调用基类的函数。

```ts

class MyClass {
    name = 'MyClass'
    getName(this: MyClass) {
        return this.name
    }
}

```

另一种则是类似 C++ 中的显式对象形参，添加额外的 `this` 参数来进静态检查：在 TypeScript 环境中不允许对 `this` 类型进行转换。因此错误的使用会被检查出来。

#### `this` 类型

在类内，`this` 还可以作为类型标注：

```ts

class Box {
    content: string = ''
    sameAs(other: this) {
        return other.content === this.content
    }
}

```

注意，这时候 `this` 类似于 C++ 中的模板显式对象形参，这意味着一个派生自 `Box` 的类的引用不能使用 `sameAs`。

#### 类型谓词

可以使用 is 来构造类型谓词：

```ts

class FileSystemObject {
    isFile(): this is FileRep {
        return this instanceof FileRep
    }
    isDirectory(): this is Directory {
        return this instanceof Directory
    }
    isNetworked(): this is Networked & this {
        return this.networked
    }
    constructor(public path: string, private networked: boolean) {}
}

```

一个常见的应用是判断可选属性：

```ts

class Box<T> {
    value?: T
    hasValue(): this is { value: T } {
        return this.value !== undefined
    }
}

const box = new Box()
box.value = 'Gameboy'
// (property) Box<unknown>.value?: unknown

if (box.hasValue()) {
    box.value
    // (property) value: unknown
}

```

#### 抽象成员和方法

和 C++ 的抽象类类似，TypeScript 使用 `abstract` 关键词来声明一个抽象类：

```ts

abstract class Base {
    abstract getName(): string
    printName() {
        console.log('Hello, ' + this.getName())
    }
}

const b = new Base()
// Cannot create an instance of an abstract class.

```

不同的是，必须先把类定义为抽象，才能声明抽象方法。

#### 构造签名

Part2 中提到过约束泛型类的构造，还有另一种方式：

```ts

function create<Type>(c: { new (): Type }): Type {
    return new c()
}
// 可以改写为如下形式：
function create<Type>(c: new () => Type ): Type {
    return new c()
}

```

实际上也可以约束普通函数：

```ts

function greet(ctor: new () => Base) {
    const instance = new ctor()
    instance.printName()
}
greet(Derived)

```

其中 `Derived` 继承 `Base`。

#### 类型之间的关系

TypeScript 中，具有相同属性的类型是同一类型，在一个类型的基础上添加属性，则原类型是添加后的类型的子类型。
