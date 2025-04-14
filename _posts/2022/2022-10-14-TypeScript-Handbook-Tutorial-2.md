---
title: TypeScript 手册指北 Part2
date: "2022-10-14 23:33:00"
tags: [TypeScript,Web]
category: blog
---
TypeScript 手册指北 第二部分，第一部分在 [TypeScript 手册指北 Part1](/blog/2022/10/12/TypeScript-Handbook-Tutorial/)，记录了本人阅读 TypeScript 官方手册的一些想法，包含 Type Manipulation 的内容。

<!-- more -->

#### 泛型函数

```ts

function identity<Type>(arg: Type): Type {
    return arg
}
 
let myIdentity: <Input>(arg: Input) => Input = identity
let callAbleMyIdentity: { <Type>(arg: Type): Type } = identity

```

和 C++ 类似，泛型参数类型只需要在自己的定义内保持一致。并且也支持泛型调用签名。

另外不同一点是，C++ 中的模板是鸭子类型，模板约束是可选的，而 TypeScript 中则必须受约束：

```ts

interface Lengthwise {
    length: number
}

function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
    console.log(arg.length) // Now we know it has a .length property, so no more error
    return arg
}

```

由于上面的这种类型约束可能过于强大了，例如要求 Type 必须含有类型为 `number` 的属性 `length`，而有时候其实不需要约束 `length` 的类型。所以 TypeScript 加入了 `keyof` 关键词来约束属性：

```ts

function getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
    return obj[key]
}

let x = { a: 1, b: 2, c: 3, d: 4 }

getProperty(x, 'a')
// getProperty(x, 'm')
// Argument of type ''m'' is not assignable to parameter of type ''a' | 'b' | 'c' | 'd''.

```

#### 泛型类

TypeScript 的泛型类和 C++ 类似：

```ts

class GenericNumber<NumType> {
    zeroValue: NumType
    add: (x: NumType, y: NumType) => NumType
}

let myGenericNumber = new GenericNumber<number>()
myGenericNumber.zeroValue = 0
myGenericNumber.add = function (x, y) {
    return x + y
}

```

一个和 C++ 不同的地方在于，类的静态成员不能使用泛型参数。

由于泛型函数的泛型参数类型必须受约束，所以构造函数也得受约束：

```ts

// method 1
function create<Type>(c: { new (): Type }): Type {
    return new c()
}

```

#### typeof

Part1 介绍过如何使用 `typeof` 来判断类型，`typeof` 表达式也可放在类型标注位置推断类型：

```ts

let s = 'hello'
let n: typeof s

function f() {
    return { x: 10, y: 3 }
}
type P = ReturnType<typeof f> // 函数是对象而不是类型，所以需要 typeof

```

注意，`typeof` 是静态推断，所以 `typeof` 的操作数不能是一个函数调用。

```ts

declare function stringOrNum(x: string): number
declare function stringOrNum(x: number): string
declare function stringOrNum(x: string | number): string | number

type T1 = ReturnType<typeof stringOrNum>
// T1 = string | number

```

如果函数有多个重载，则一般会使用最通用的（最后一个）调用签名。

#### keyof

keyof 操作可以获得属性的字面值，并以或的形式结合在一起：

```ts

type Point = { x: number y: number }
type P = keyof Point

// type P = “x” | “y”

```

如果类型别名或者接口中含有索引签名，则 `keyof` 的结果是索引签名的索引类型（实际上只有 `sting`，或者 `string | number` 两种情况）。

可以根据属性名获得其类型：

```ts

type Person = { age: number name: string alive: boolean }
type Age = Person['age']
type I1 = Person['age' | 'name']
// type I1 = string | number
type AliveOrName = 'alive' | 'name'
type I3 = Person[AliveOrName]
// type I3 = string | boolean

```

可以通过 `keyof` 获得类型内的属性名，进而获得对应的类型：

```ts

type I4 = keyof Person    
// type I4 = 'age' | 'name' | 'alive'
type I2 = Person[keyof Person]
// type I2 = string | number | boolean

```

也可以通过 `keyof` 获得数组成员的类型：

```ts

const MyArray = [
    { name: 'Alice', age: 15 },
    { name: 'Bob', age: 23 },
    { name: 'Eve', age: 38 },
]

type Person = typeof MyArray[number]
// type Person = {
//     name: string
//     age: number
// }

type Age = typeof MyArray[number]['age']

```

#### 条件类型

TypeScript 中可以为变量添加条件，类型自然也可以添加条件：

```ts

let x = true ? 'string' : 1
// x: string | number

interface Animal {
    live(): void
}
interface Dog extends Animal {
    woof(): void
}

type Example1 = Dog extends Animal ? number : string
// type Example1 = number

type Example2 = RegExp extends Animal ? number : string
// type Example2 = string

```

不过和变量不同的是，条件类型不是联合类型。

条件类型在泛型中比较有用：

```ts

type NameOrId<T extends number | string> = T extends number ? IdLabel : NameLabel

let a = createLabel('typescript')
// a: NameLabel

let b = createLabel(2.8)
// b: IdLabel

let c = createLabel(Math.random() ? 'hello' : 42)
// c: NameLabel | IdLabel

```

由于 TypeScript 的泛型约束是强制的，所以有时候需要其他手段来标注属性：

```ts

type MessageOf<T> = T extends { message: unknown } ? T['message'] : never
 
interface Email {
    message: string
}

interface Dog {
    bark(): void
}
 
type EmailMessageContents = MessageOf<Email>
// type EmailMessageContents = string

type DogMessageContents = MessageOf<Dog>
// DogMessageContents = never

```

TypeScript 还可以通过条件类型来实现类似 C++ 中根据重载实现的 `std::remove_reference` 类型萃取：

```ts

type Flatten<T> = T extends any[] ? T[number] : T

// Extracts out the element type.
type Str = Flatten<string[]>
// Str = string
// Leaves the type alone.

type Num = Flatten<number>
// Num = number

type Flatten<Type> = Type extends Array<infer Item> ? Item : Type
// 使用 infer 关键词

type Num = GetReturnType<() => number>
// Num = number

```

也可以实现复杂类型的构造：

```ts

type ToArray<Type> = Type extends any ? Type[] : never

```

有一种情况需要注意：TypeScript 的泛型实参会自动展开联合类型，这意味着泛型会分别对每一个类型进行相同的操作并创造一个新的联合类型：

```ts

type StrArrOrNumArr = ToArray<string | number>
// type StrArrOrNumArr = string[] | number[]

type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never

// 'StrArrOrNumArr' is no longer a union.
type StrArrOrNumArr = ToArrayNonDist<string | number>
// StrArrOrNumArr = (string | number)[]

```

为了阻止这一点，可以使用方括号来保护类型的完整性。不过个人觉得可以使用参数括起来，或者通过构造一个不使用联合的 `type` 来阻止这一点：

```ts

type ToArray<Type> = Type extends any ? Type[] : never

// method1
type StrOrNumArr2 = ToArray<(string|number)>

// method2
type Atom<T> = T
type ToArray<Type> = Atom<Type> extends any ? Type[] : never

type StrOrNumArr2 = ToArray<string|number>

```

#### 映射类型

有时候一个类型依赖于其他类型，在泛型中尤其常见，例如从一个类型构建一个具有相同属性名，但属性的类型不同的类型：

```ts

type OptionsFlags<Type> = {
    [Property in keyof Type]: boolean
}

type FeatureFlags = {
    darkMode: () => void
    newUserProfile: () => void
}

type FeatureOptions = OptionsFlags<FeatureFlags>
// FeatureOptions = {
//     darkMode: boolean
//     newUserProfile: boolean
// }

```

#### 映射修饰符

不光能使用映射来自动生成属性，还可以修改修饰符：使用 `+`，`-` 用来增加或者删除 `readonly` 和 `?`：

```ts

// Removes 'readonly' attributes from a type's properties
type CreateMutable<Type> = {
    -readonly [Property in keyof Type]: Type[Property]
}

type LockedAccount = {
    readonly id: string
    readonly name: string
}

type UnlockedAccount = CreateMutable<LockedAccount>
// UnlockedAccount = {
//     d: string
//     name: string
// }

// Removes 'optional' attributes from a type's properties
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property]
}

type MaybeUser = {
    id: string
    name?: string
    age?: number
}

type User = Concrete<MaybeUser>
// type User = {
//     id: string
//     name: string
//     age: number
// }

```

#### 重新映射

本节未完成

[Key Remapping via as](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)

#### 模板字面类型

模板字面类型基于字符串字面类型，模板字符串在 ECMAScript 6 中被引入，TypeScript 使得字符串字面类型可以结合模板字符串使用：

```ts

type World = 'world'
type Greeting = `hello ${World}`

type EmailLocaleIDs = 'welcome_email' | 'email_heading'
type FooterLocaleIDs = 'footer_title' | 'footer_sendoff'

type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`
// AllLocaleIDs = 'welcome_email_id' | 'email_heading_id' | 'footer_title_id' | 'footer_sendoff_id'

```

模板字符串字面类型的的可变部分必须也是一个字符串字面类型，和 TypeScript 的泛型类似，可变部分如果是一个联合类型，则先将联合类型拆分，分别应用模板，再合并为一个新的联合类型，最后的结果类似笛卡儿积。

可以结合上述特性实现根据函数模板自动生成函数名和参数（反射）：

```ts

type PropEventSource<Type> = {
    on(eventName: `${string & keyof Type}Changed`, callback: (newValue: any) => void): void
}
 
/// Create a 'watched object' with an 'on' method
/// so that you can watch for changes to properties.
declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>

const person = makeWatchedObject({
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26
})

person.on('firstNameChanged', () => {})

```

TypeScript 还内置了一些编译器实现的类型模板用来处理字符串字面值：`Uppercase`，`Lowercase`，`Capitalize`，`Uncapitalize`。
