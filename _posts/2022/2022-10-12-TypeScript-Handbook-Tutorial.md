---
title: TypeScript 手册指北 Part1
date: "2022-10-12 15:10:00"
tags: [TypeScript,Web]
category: blog
---
之前的 JavaScript 知识本人都是现学现卖，前几天花了点时间粗读了一下 TypeScript 的官方[手册](https://www.typescriptlang.org/docs/handbook)，其中有一部分语法尚未理解。本文是在第二次阅读中对手册的额外的解释。包含从 The Basis 到 Object Types 一共 5 章的内容。

<!-- more -->

#### typeof

typeof 只能判断一些基础类型：

| Type      | Result      |
| :-------- | :---------- |
| Undefined | 'undefined' |
| Boolean   | 'boolean'   |
| Number    | 'number'    |
| BigInt    | 'bigint'    |
| String    | 'string'    |
| Symbol    | 'symbol'    |
| Function  | 'function'  |
| Null      | 'object'    |
| Others    | 'object'    |

另外，class 是 Function。

#### 内置对象

JavaScript 标准内置了一些对象，例如 `Date`，`Math`，`BigInt`，`Number`，`String`，`RegExp`，`Array`，`Map`，`Set`，`JSON`，`Promise`，`Generator` 等等，详细的信息可以在[MDN 标准内置对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects)中查阅。

其中包括 `Date` 到 `Set` 的这些对象通常使用 `new` 调用其构造函数创建相应的类对象使用，其他对象则通常使用其静态成员函数返回一个对象。

#### 函数参数类型标注

最常见的类型标注就是对函数参数的标注，其他的类型都可以靠推导，但函数参数显然不能：

```ts

function greet(person: string, date: Date): string {
    return `Hello ${person}, today is ${date.toDateString()}!`
}

```

返回值的类型标注当然是可以省略的，可以根据返回语句推导出类型，同样，需要保证任何路径的返回类型一致。

理所当然的，对于有初始值的对象，不用特意标注类型。

对于函数参数，类型标注也可以是一种匿名类型：

```ts

function printCoord(pt: { x: number; y: number }) {
    console.log('The coordinate's x value is ' + pt.x)
    console.log('The coordinate's y value is ' + pt.y)
}
printCoord({ x: 3, y: 7 })

```

使用的时候传入一个初始化器即可。

```ts

function printName(obj: { first: string; last?: string }) {
    // Error - might crash if 'obj.last' wasn't provided!
    // console.log(obj.last.toUpperCase())
    // Object is possibly 'undefined'.
    if (obj.last !== undefined) {
        // OK
        console.log(obj.last.toUpperCase())
    }
    // A safe alternative using modern JavaScript syntax:
    console.log(obj.last?.toUpperCase())
}

```

毫不意外的，也支持可选参数，可选参数在读取之前必须判断其是否 `undefined`。

注意，如果一个函数的返回值不标注为 `void`，则函数实际上返回 `any`。

#### 数组声明

数组声明可以用类似于 C 的方括号语法，也可以用类似 C++ 的泛型写法，实际上和 C++ 类似；JavaScript 的数组是一个 `Object`。

```ts

let fruits: string[] = ['Apple', 'Banana']
let numbers: Array<number> = [1]

function getArrayLength(arr: number[]) {
    return arr.length
}
function getArrayLength2(arr: Array<number>) {
    return arr.length
}

console.assert(typeof arr === 'object')

```

理所当然的，如果数组有初始化器，则编译器可以自动推断。

注意，要区分数组的初始化器和 `tuple` 的声明。

#### any 类型

TypeScript 需要无缝兼容 JavaScript 引擎，所以实际上 TypeScript 继承了 JavaScript 的对象模型，因此 TypeScript 仍然是动态类型语言，只不过加上了类型检查。`any` 类型就是 JavaScript 最真实的类型，并且 TypeScript 编译为 JavaScript 实际上大部分情况仅仅是转化了一下声明方式并且把类型检查去掉。

一个 `any` 类型的变量可以被赋予任何类型的值：

```ts

let obj: any = { x: 0 }

```

即使初始化器是一个匿名的 `Object`，但由于类型标注的存在使得 `obj` 可以是任何类型，因此可以进行任意操作，编译器不会检查。但是为了充分利用静态类型检查带来的优势，最好开启 noImplicitAny 来禁止使用 `any`，防止 TypeScript 变成 AnyScript。

#### 联合类型

TypeScript 相比于 JavaScript 在类型系统上更进一步的第一个要点就在于联合类型：

```ts

let uni: string | number = '123456'
type ID = string | number // 可以用 type 关键词来定义一个类型别名

ID uni1 = 123456

function printId(id: number | string) {
    console.log('Your ID is: ' + id)
}

```

使用或运算可以声明一个联合类型，TypeScript 会检查对该类型的变量的操作是否对于任何类型都有效。同时，可以使用条件语句来窄化 TypeScript 对类型的限制，使得在窄化分支上可以进行一些类型独有操作：

```ts

function printId(id: number | string) {
    if (typeof id === 'string') {
        // In this branch, id is of type 'string'
        console.log(id.toUpperCase())
    } else {
        // Here, id is of type 'number'
        console.log(id)
    }
}

```

对于基本类型，可以使用 `typeof` 运算来区分不同情况，但是对于非基本类型，情况要复杂很多，例如 `Array` 的悲剧：

由于 `typeof [1, 2]` 的结果是 `'object’`，而 `typeof '123'` 的结果是 `'string'`，所以尚可用 `typeof` 区分 `string[]` 和 `string`，但是无法使用 `typeof` 区分 `string[]` 和 `object`，并且更严重的是 JavaScript 中有一些数组并不是标准内置对象的数组，所以某些情况下甚至不能使用 `instanceof` 来确定是否是数组类型，例如有些库可能更改了数组的原型，或者来自 DOM 属性的数组。

ES5 提供了一个安全的方式：函数 `Array.isArray`。

#### 类型别名

类型别名可以给一个类型创造别名，通常用于 `union` 和自定义类型，拥有相同初始化器的两个类型别名是同一类型，类似于 C++ 中的 `using`（但是 `using` 不能定义 `union`）：

```ts

type Point = {
    x: number
    y: number
}
type ID = number | string
type InputType = string

```

使用类型别名就和直接使用类型名，或者匿名类型一样。

#### Interfaces

`interface` 是一种不同于 `type` 的语法，`interface` 用于描述一种概念，类似于 C++ 中的 `requires`，同时，`interface` 是可扩展的：

```ts

interface Window {
    title: string
}
interface Window {
    id: number
}

```

两个同名 `interface` 的声明会把属性合并到一起。具有相同结构的 `interface` 或相同结构的类型别名是相同的。注意，类型别名和接口都不是类型。

#### 多态和类型转换

对于有继承关系的类型，有时候需要进行转换，例如 `getElementByID` 返回 `HTMLElement | null`，由于我们通常知道该元素的实际类型，并且 TypeScript 不会私自对类型进行任何的转换，所以必须转换其返回值：

```ts

const myCanvas: HTMLCanvasElement = document.getElementById('main_canvas') as HTMLCanvasElement
const myCanvas1 = <HTMLCanvasElement>document.getElementById('main_canvas')

```

在 JSX 中由于尖括号具有特殊含义，只能使用第一种。

#### 字面值类型

TypeScript 相对于 JavaScript 的第二个改进是支持字面值类型（Literal Types），字面值类型类似于 C++ 的枚举，但可以是字符串。

和 C++ 类似，TypeScript 可以声明一个常量字符串，常量字符串是不可修改的：

```ts

const constantString = 'Hello World'
let x: 'hello' = 'hello'

```

特别的是，TypeScript 支持将字符串作为类型，并使得其值只能为本身，这意味着即使使用 `let` 声明，该对象也不可更改。

字面值类型最大的作用就是作为枚举：

```ts

function printText(s: string, alignment: 'left' | 'right' | 'center') {
    // 当编译器发现 alignment 的实参不是其中一种字面值，则会告知错误
}

function compare(a: string, b: string): -1 | 0 | 1 {
    // 同理，返回值只能是 -1，0，1 中之一
    return a === b ? 0 : a > b ? 1 : -1
}

interface Options {
    width: number
}
function configure(x: Options | 'auto') {
    // ...
}
configure({ width: 100 })
configure('auto')

```

TypeScript 提供了简便的声明一个对象的方式，但不同于 C++，TypeScript 不能给对象的属性添加 `const` 修饰，这使得必须存在一种额外的补丁使得对象的属性也为 `const`，否则有些接口不能使用该属性：

```ts

const req = { url: 'https://example.com', method: 'GET' }
handleRequest(req.url, req.method)
// Argument of type 'string' is not assignable to parameter of type ''GET' | 'POST''.

```

为了解决这个问题，有两种方式：

```ts

// Way 1:
// Change 1:
const req = { url: 'https://example.com', method: 'GET' as 'GET' }
// Change 2
handleRequest(req.url, req.method as 'GET')

// Way 2:
const req = { url: 'https://example.com', method: 'GET' } as const
handleRequest(req.url, req.method)

```

第一种方式使得属性为字面类型，第二种方式使得整个对象为字面类型。

字面值类型也可以作为 `type` 或者 `interface` 的属性的类型：

```ts

interface Shape {
    kind: 'circle' | 'square'
}

```

#### 非空检查

TypeScript 使用编译器开关 strictNullChecks 来决定是否检查 `null` 和 `undefined`。

如果 strictNullChecks 为 `off`，则编译器默认变量永远不为 `null` 和 `undefined`，如果为 `on`，则必须使用条件语句进行窄化。

在为 on 的时候可以使用非空断言操作符来指示变量非空：

```ts

function liveDangerously(x?: number | null) {
    // No error
    console.log(x!.toFixed())
}

```

#### `in` 操作符

TypeScript 中访问对象的不存在的属性是错误，而在 JavaScript 中则是 `undefined`，在开启了严格空检查后，不能通过判断属性是否为 `undefined` 来判断属性是否存在，此时需要使用 `in` 操作符：

```ts

type Fish = { swim: () => void }
type Bird = { fly: () => void }
 
function move(animal: Fish | Bird) {
    if ('swim' in animal) {
        return animal.swim()
    }
    return animal.fly()
}

```

在一些复杂情况下，需要尤其注意窄化操作是否完全：

```ts

type Fish = { swim: () => void }
type Bird = { fly: () => void }
type Human = { swim?: () => void; fly?: () => void }
 
function move(animal: Fish | Bird | Human) {
    if ('swim' in animal) {
        animal // animal: Fish | Human
    } else {
        animal // animal: Bird | Human
    }
}

```

#### instanceof

在无法通过 `typeof` 进行判断时，有有时可以使用 `instanceof`：`x instanceof Foo` 检查 x 的原型链（prototype chain）是否包含 `Foo.prototype`

这种方式只适用于直接属于或者具有继承关系的情况，不适用于使用 `type` 和 `interface` 定义的类型别名和接口。

#### 类型谓词

和 C++ 类似的是，一个普通 TypeScript 函数并不能当作静态编译期谓词使用，TypeScript 中如果想要自定义一个类型谓词，需要使用 `is` 关键词：

```ts

type Fish = { swim: () => void }
type Bird = { fly: () => void }

function isFish(pet: Fish | Bird): pet is Fish {
    //return (pet as Fish).swim !== undefined
    return 'swim' in pet
}

function test(pet: Fish | Bird) {
    if (isFish(pet)) {
        pet.swim()
    } else {
        pet.fly()
    }
}

```

`pet is Fish` 是一个类型谓词，`pet` 必须是参数列表中的参数。`isFish` 函数通过另一个谓词判断参数的真实类型，然后返回。TypeScript 官网的教程使用的是被注释掉的写法，不知道为什么用了比较丑的方式，可能是为了说明可以将 `pet` 转换为 `Fish` 在一些情况中是合法的。

#### `never` 类型

如果经过窄化后的分支永远不可达，则该分支上的对象具有 `never` 类型。`never` 类型只存在于 TypeScript 的类型系统中，不存在于 JavaScript。

任何类型的对象都可以被 `never` 赋值，但是 `never` 类型的对象只能被 `never` 赋值，利用这个性质可以设计出一个禁止对参数类型进行扩展的函数：

```ts

interface Circle {
    kind: 'circle'
    radius: number
}
 
interface Square {
    kind: 'square'
    sideLength: number
}

interface Triangle {
    kind: 'triangle'
    sideLength: number
}

type Shape = Circle | Square;
// type Shape = Circle | Square | Triangle
 
function getArea(shape: Shape) {
    switch (shape.kind) {
        case 'circle':
            return Math.PI * shape.radius ** 2
        case 'square':
            return shape.sideLength ** 2
        default:
            const _exhaustiveCheck: never = shape
            // Type 'Triangle' is not assignable to type 'never'.
            return _exhaustiveCheck
    }
}

```

`getArea` 函数在设计的时候 `Shape` 的类型只能是 `Circle` 或者 `Square`，此时 `default` 分支中 `shape` 的类型为 `never`，因此可以赋值给 `_exhaustiveCheck`。当后来扩充了 `Shape` 的类型时，`default` 分支内，`shape` 的类型被窄化为 `Triangle`，由于 `Triangle` 类型的 `shape` 不能赋值给 `_exhaustiveCheck`，所以编译器会报错。

#### 函数类型

TypeScript 中的函数类型和匿名函数的语法很相似，但不一样，函数类型的箭头后面是返回值类型，而不是函数体。

```ts

function greeter(fn: (a: string) => void) {
    fn('Hello, World')
}
function printToConsole(s: string) {
    console.log(s)
}
 
greeter(printToConsole)

```

和 C++ 不同的是，函数类型应该包含参数名，这是为了解决一个悲剧：`(string) => void` 中 `string` 是一个 `any` 类型的形参，而不是类型。

JavaScript 的函数可以添加不存在的属性，TypeScript 也继承了这一点，侧面也佐证了 TypeScript 是动态类型：

```ts

function func1(arg: number) { return true }
func1.description = 'Function'

type DescribableFunction = {
    description: string
    (someArg: number): boolean
};

function doSomething(fn: DescribableFunction) {
    console.log(fn.description + ' returned ' + fn(6))
}

doSomething(func1)

// false: type '(arg: number) => true' lack property 'description'
// let func: DescribableFunction = (arg: number) => { return true }

```

非常遗憾的是，无法一次性创造一个满足 `DescribableFunction` 的对象，必须先声明一个函数再为其添加属性。

`DescribableFunction` 中的 `(someArg: number): boolean` 被成为调用签名，代表对象可调用。

同时，还可以在 `type` 和 `interface` 声明内添加构造签名：

```ts

type SomeConstructor = {
    new (s: string): SomeObject
};

function fn(ctor: SomeConstructor) {
    return new ctor('hello')
}

interface CallOrConstruct {
    new (s: string): Date
    (n?: number): number
}

// also
type CallOrConstruct = {
    new (s: string): Date
    (n?: number): number
}

```

JavaScript 中的 `Date` 等对象就是既可以调用也可以构造的对象，但需要注意的是，`Date` 的调用返回一个字符串，`Date` 的构造返回一个 `Date` 类型的对象。

目前我们还不知道如何创造一个满足这个构造签名的对象，但不要着急，后面讲述 `class` 的部分会继续叙述。

#### 泛型函数

由于 TypeScript 和 JavaScript 都是动态类型语言，所以支持泛型显然理所当然。但是 TypeScript 的意义在于使用静态检查保证代码的安全，所以就需要一种提取类型的方法：

```ts

// work, but bad
function firstElement(arr: any[]) {
    return arr[0]
}
// good
function firstElement<Type>(arr: Type[]): Type {
    return arr[0]
}

```

TypeScript 的泛型使用和 C++ 类似的语法，将类型参数化。理所当然的，返回值类型可以根据 `return` 语句推导。

大部分情况下上述代码工作的很好，但是如果传递给它一种奇怪的类型 `firstElement([])`，则返回值是 `never`。官网的教程将返回值定义为了 `Type | undefined`，我认为这种特殊情况应该视为 `bug`，`never` 类型也适合编译器检查，不需要增加 `undefined` 的可能性。

```ts

function longest<Type extends { length: number }>(a: Type, b: Type) {
    if (a.length >= b.length) {
        return a
    } else {
        return b
    }
}

```

TypeScript 的类型别名和和接口一些具有 C++ 类的性质和泛型约束的性质，可以使用 `extends` 关键词约束类型。

需要注意的是，匿名的结构体的类型也是匿名的，这和 C++ 的类有着相似的性质，这意味着有时候类型必须完全匹配，而不仅仅需要满足其结构：

```ts

function minimumLength<Type extends { length: number }>(
    obj: Type,
    minimum: number
): Type {
    if (obj.length >= minimum) {
        return obj
    } else {
        return { length: minimum } // error
        // Type '{ length: number; }' is not assignable to type 'Type'.
    }
}

```

虽然 `{ length: number; }` 满足类型约束，是 `Type` 的子类型，但是仍然不是 `Type`。

#### 可选参数和默认实参

TypeScript 支持可选参数，个人认为这应该是 `type = Type | undefined` 的语法糖：

```ts

function f(x?: number) {
    if (x !== undefined) {
        // do x
    }
}

function fd(x = 10) {
    // ...
}

```

和 C++ 类似，也支持默认参数，同时也可根据默认参数推导出类型。

#### 函数重载

TypeScript 也支持函数重载，不过是以一种奇妙的方式：

```ts

function makeDate(timestamp: number): Date
function makeDate(m: number, d: number, y: number): Date
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
    if (d !== undefined && y !== undefined) {
        return new Date(y, mOrTimestamp, d)
    } else {
        return new Date(mOrTimestamp)
    }
}

function fn(x: string): string
function fn(x: number): string
function fn(x: string | number) {
    return 'oops'
}

```

上面这个函数的前两行是函数重载签名，最后一行是函数实现签名，不同的函数重载签名通常根据函数参数数量或者类型进行区分，而函数实现签名需要兼容之前所有版本的函数重载签名，然后定义函数体。

函数重载可以实现类似泛型的效果，实际上这种情况也可以写成 `union`：

```ts

function len(s: string): number
function len(arr: any[]): number
function len(x: any) {
    return x.length
}

function len(x: any[] | string) {
    return x.length
}

```

#### this

本节未完成

[Declaring this in a Function](https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function)

本节待完成

#### 可变参数

TypeScript 提供了一种语法糖使得可以方便的将函数参数合成为数组以及将数组解散成参数：

```ts

function multiply(n: number, ...m: number[]) {
    return m.map((x) => n * x)
}
// 'a' gets value [10, 20, 30, 40]
const a = multiply(10, 1, 2, 3, 4)

const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]
arr1.push(...arr2)

// Inferred as 2-length tuple
const args = [8, 5] as const
// OK
const angle = Math.atan2(...args)

```

注意，数组默认是可变的，有时候需要转换为字面值才能使用。

#### 参数解构

TypeScript 支持将类的属性解散以方便的使用，类似于 C++ 的结构化绑定：

```ts

function sum({ a, b, c }: { a: number; b: number; c: number }) {
    console.log(a + b + c)
}

// Same as prior example
type ABC = { a: number; b: number; c: number }
function sum({ a, b, c }: ABC) {
    console.log(a + b + c)
}

```

#### readonly

`type` 和 `interface` 可以定义只读的属性：

```ts

interface SomeType {
    readonly prop: string
}

```

注意，`readonly` 只修饰其直接修饰的对象，而不修饰对象的属性。

#### 索引签名

索引签名用于描述 k-v 型的结构：

```ts

interface StringByString {
    [key: string]: string
}
 
const heroesInBooks: StringByString = {
    'Gunslinger': 'The Dark Tower',
    'Jack Torrance': 'The Shining'
};

interface Options {
    [key: string]: string | number | boolean
    timeout: number
}
 
const options: Options = {
    timeout: 1000,
    timeoutMessage: 'The request timed out!',
    isFileUpload: false
};

```

`[key: string]: string` 声明了该索引的 `key` 是 `string` 类型，`value` 是 `string` 类型。带有索引签名的类型别名或接口可以包含属性，这些额外的属性的类型必须和 `value` 的属性保持一致。声明中的 `key` 作为名字其实是任意的，可以更改成其他名字：`[index: string]: string`。

索引的类型也可以为 `number`，但实际上 JavaScript 会把数字索引转换为字符串，这意味着 `obj[1]` 等价于 `obj['1']`。

索引签名的存在使得使用该对象时可以事先不知道对象具有的属性名，`obj['property']` 等价于 `obj.property`。

同时可以在索引签名前加上 `readonly` 关键词使得属性不可更改。

#### 扩展类型

类型别名和接口都是可以扩展的，类似 C++ 中的继承：

```ts

interface Animal {
    name: string
}
interface Bear extends Animal {
    honey: boolean
}

type Animal = {
    name: string
}
type Bear = Animal & { 
    honey: boolean 
}

interface Colorful {
    color: string
}
interface Circle {
    radius: number
}
type ColorfulCircle = Colorful & Circle

```

#### 泛型类型

和泛型函数一样，接口和类型别名也支持泛型：

```ts

interface Box<Type> {
    contents: Type
}
type Box<Type> = {
    contents: Type
}

let boxA: Box<string> = { contents: 'hello' }

function setContents<Type>(box: Box<Type>, newContents: Type) {
    box.contents = newContents
}

```

之前也提到过，使用泛型可以避免出现 `any`，并减少函数重载的使用。

特别的是，使用泛型配合类型别名可以设计出一些实用的帮助类型：

```ts

type OrNull<Type> = Type | null
type OneOrMany<Type> = Type | Type[]
type OneOrManyOrNull<Type> = OrNull<OneOrMany<Type>>
// OneOrManyOrNull<Type> = OneOrMany<Type> | null
type OneOrManyOrNullStrings = OneOrManyOrNull<string>
// OneOrManyOrNullStrings = OneOrMany<string> | null

```

#### Array 和 Readonly Array

`Array` 理所当然的是泛型，同时，存在 `ReadOnlyArray` 泛型类，`ReadOnlyArray` 没有构造函数，但是可以从 `Array` 构造。

#### Tuple 类型

使用类型别名可以声明一个元组类型：

```ts

type StringNumberPair = [string, number]

function doSomething(pair: [string, number]) {
    const a = pair[0]
    // a: string
    const b = pair[1]
    // b: number
}

doSomething(['hello', 42])

function doSomething(stringHash: [string, number]) {
    const [inputString, hash] = stringHash
    // use
}

```

元组可以使用下标访问，同时也可以解构。

可以使用接口模拟元组：

```ts

interface StringNumberPair {
    // specialized properties
    length: 2
    0: string
    1: number
 
    // Other 'Array<string | number>' members...
    slice(start?: number, end?: number): Array<string | number>
}

```

元组可以在尾部有可选属性，可选属性影响元组的长度。

元组也支持不定长，但是必须保证可以解析：

```ts

type StringNumberBooleans = [string, number, ...boolean[]]
type StringBooleansNumber = [string, ...boolean[], number]
type BooleansStringNumber = [...boolean[], string, number]

```

`tuple` 也可以声明为 `readonly` 和 `const`：

```ts

function doSomething(pair: readonly [string, number]) {
    // ...
}
let point = [3, 4] as const

```
