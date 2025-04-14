---
title: std::chrono
date: "2022-09-01 01:30:00"
tags: [C++]
category: blog
---
C++11 开始增加了 `std::chrono` 这个时间库，可以在编译期进行时间换算以及提供计时功能。同时还可以配合 `std::condition_variable` 来实现定时唤醒功能。

<!-- more -->

要使用 `chrono` 库，首先要学会 `std::chrono::duration`。

### `std::chrono::duration`

`duration` 是个类模板，两个参数，第一个参数是储存时常用的类型，第二个参数是用于换算单位的分数，这个分数由 `std::ratio` 表示。

```cpp

template<
    class Rep,
    class Period = std::ratio<1>
> class duration;

```

`ratio` 是一个类模板，两个模板参数分别表示分子和分母，例如 `std::ratio<1, 2>` 就是 1/2。

`duration` 第二个参数默认是 `std::ratio<1>`，代表这个 `duration` 以 1 秒为单位。

如果有一个 `duration` 的 `Period` 是 `std::ratio<1, 10>`，那么这个 `duration` 与单位为 1 秒的 `duration` 换算时就要变成 1/10。

标准库预定义了一些 `duration` 特化的别名用于方便使用：

+ `std::chrono::nanoseconds`  (C++11)
+ `std::chrono::microseconds` (C++11)
+ `std::chrono::milliseconds` (C++11)
+ `std::chrono::seconds`      (C++11)
+ `std::chrono::minutes`      (C++11)
+ `std::chrono::hours`        (C++11)
+ `std::chrono::days`         (C++20)
+ `std::chrono::weeks`        (C++20)
+ `std::chrono::months`       (C++20)
+ `std::chrono::years`        (C++20)

MSVC 的实现中，从 `days` 开始 `Rep` 的类型是 `int`，更小的单位使用 `long long`，保证计算不会溢出。

```cpp

#include <chrono>

int main() {
	namespace chrono = std::chrono;
    chrono::nanoseconds nano_time{ 3000 }; // 表示 3000 纳秒
	static_assert(std::same_as <chrono::duration<long long, std::nano>, chrono::nanoseconds>); // true
}

```

不同 `Period` 的 `duration` 可以进行加减乘除模这些算术运算，还可以进行比较。

实际上 `duration` 就是用来表示各种单位，借助模板的能力可以使得单位换算可以在编译期进行。

可以通过 `duration::count` 获得 `duration` 内部储存的数值，类型和 `Rep` 一致，标准库提供了 `duration_cast` 模板用于将一种 `duration` 转换到另外一种：

```cpp

#include <chrono>

int main() {
	namespace chrono = std::chrono;
	constexpr chrono::seconds a_day_time(86400);
	constexpr auto second_to_day = chrono::duration_cast<chrono::days>(a_day_time);
	static_assert(second_to_day.count() == 1);
}

```

C++14 起，为了方便使用 `duration`，标准库提供了一系列字面量：

+ `operator""h`   表示小时的 `duration` 字面量
+ `operator""min` 表示分钟的 `duration` 字面量
+ `operator""s`   表示秒的   `duration` 字面量
+ `operator""ms`  表示毫秒的 `duration` 字面量
+ `operator""us`  表示微秒的 `duration` 字面量
+ `operator""ns`  表示纳秒的 `duration` 字面量

### `std::chrono::system_clock` 和 `std::chrono::steady_clock`

`std::chrono` 提供了系统时钟 `system_clock` 和单调时钟 `steady_clock`，这两个时钟虽然是类，但是构造它们的对象没意义，都是通过静态成员函数使用，最常用的是使用 `now` 静态成员函数获得当前时间。

C++20 起 `system_clock` 被规定为使用 Unix 时间（Posix 时间），即从格林威治时间 1970 年 01 月 01 日 00 时 00 分 00 秒起至现在的总秒数，并且使用 UTC 时区。大部分系统都使用这个时间，或者提供与之转换的工具。1970 年 01 月 01 日 00 时 00 分 00 秒也叫 Unix epoch。

系统时钟有一个特点是不单调，换句话说有可能因为系统和网络时钟同步，或者用户的手动调整，导致下一个时间减上一个时间为负。由于使用了 Unix 时间，所以 `system_clock` 可以和 `time_t` 进行转换，通过 `system_clock::to_time_t` 和 `system_clock::from_time_t`。

当然，有一些情况 `system_clock` 也是单调的，可以通过 `is_steady` 这个静态成员函数（谓词）判断。

如果需要单调时间，可以使用 `steady_clock`，`steady_clock` 保证物理上晚的时间一定大于物理上早的时间，但是要注意一点，`steady` 获得的时间的起始点不是 1970 年，大部分实现中是系统开机时刻，不要和系统时钟的起始点混淆。

`system_clock` 一般用于描述现实时间，`steady_clock` 一般用于程序内部计算使用。C++20 开始，标准库还提供了一些其他的时钟，不过不常用。

时钟和时钟之间可以通过 `clock_cast` 转换（C++20），和 `duration_cast` 类似。

有了 `duration` 和 `clock` 之后就可以构造 `std::chrono::time_point`：

### `std::chrono::time_point`

```cpp

template<
    class Clock,
    class Duration = typename Clock::duration
> class time_point;

```

`time_point` 表示一个时间点，不同时钟的时间点不一样。`time_point` 的第一个模板参数是时钟类型，第二个参数是 `duration` （时间单位），默认根据时钟类型决定时间单位。

`system_clock::now` 和 `steady_clock::now` 返回的正是 `time_point`。

`time_point` 可以使用 `time_point_cast` 进行转换。

`time_point::time_since_epoch` 函数返回一个 `duration`，储存着这个时钟到当前时间。

### 年月日表示法

由于闰秒闰年的存在，使得不能直接计算出协调世界时（UTC），不过好消息是前几天（2022 年 11 月 18 日）国际计量大会决定 2035 年之后不再使用闰秒，因此 13 年后计算 UTC 时间可以简化不少。但是也因此 C++ 标准库并未直接提供从 UTC 时间得到 Unix 时间的方式，需要用 C 的库函数间接获得：

```cpp

struct tm_impl {
    int tm_sec;
    int tm_min;
    int tm_hour;
    int tm_mday;
    int tm_mon;
    int tm_year; // 从 1990 年开始的年数
    int tm_wday; // 从星期日开始的天数
    int tm_yday; // 从一月开始的天数
    int tm_isdst; // 夏令时，不要用
    // 不保证顺序，同时不保证只有这些成员
};

int main() {
    std::tm time{}; // 首先构造一个全 0 的 tm
    time.year = 2035 - 1990; // 设置年份
    std::time_t unix_time = std::mktime(&time);
    // 转换为 表示 Unix 时间的 time_t
    auto time_point = std::chrono::system_clock::from_time_t(unix_time);
    // 转换为 time_point
}

```

### 例子

可以使用如下代码简单的测量函数执行时间：

```cpp

int main()
{
    auto pre = std::chrono::steady_clock::now();
    foo();
    auto now = std::chrono::steady_clock::now();
    std::cout << "Time difference: " << std::chrono::duration_cast<std::chrono::milliseconds>(pre - now).count() << " milliseconds\n";
}

```

<div class="ref-label">参考：</div>
<div class="ref-list">
<a href="https://zh.cppreference.com/w/cpp/header/chrono">
std::chrono
</a>
<a href="https://zh.cppreference.com/w/cpp/header/ctime">
&lt;ctime&gt;
</a>
</div>
