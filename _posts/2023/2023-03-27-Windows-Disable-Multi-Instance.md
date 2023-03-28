---
layout: post
title: Windows 禁止应用多实例
date: "2023-03-27 19:28:00"
tags: [C++]
categories: [blog]
---
“简单”研究了一下 Windows 如何禁止应用开启多实例，实际有两个通用方案：使用 `CreateFileW` 在临时文件夹中创建一个独占的文件实现互斥以及使用 `CreateMutexExW` 创建一个独占的具名互斥锁实现互斥；需要监听端口的程序使用 `bind` 时也自带这种效果。这些方法都能实现原子的互斥，我曾经遇到过手速过快导致某些禁止多实例的应用开启多实例的问题，而这些方法能避免此问题。

<!-- more -->

微软实际上推荐使用 `CreateFileW` 在用户文件夹里创建唯一的文件，因为这样可以只禁止单用户多实例不禁止每个月用户有自己实例，但考虑到使用文件的方式会有写入磁盘的开销，并且获得临时文件夹路径的 API 不保证临时文件夹一定可用（这代表可能因此出现其他的失败情景或者需要进一步处理），实际上我选择了一种折衷方案：获得临时文件夹的路径作为具名互斥锁的名字。

基础代码非常简单：

```cpp

#include <Windows.h>

// use user's temp folder name as part of mutex name
// extra name
constexpr std::wstring_view extra{ L"PlayerWinMutex\0" };
// name buffer
std::array<wchar_t, MAX_PATH + 2 + extra.size() + 1> name;
// get tmp folder, not guaranteed path availablity
auto length{ GetTempPathW(static_cast<DWORD>(name.size()), &name[0]) };
// add extra to path
std::memcpy(&name[length], extra.data(), extra.size() + 1);
// check mutex is held by another instance, NO NEED TO USE GetLastError
if (!::CreateMutexExW(NULL, &name[0], CREATE_MUTEX_INITIAL_OWNER, NULL)) {
    // do something else,
    // such as print log, notify user or synchroniz with other instance
    ::ExitProcess(1u);
}

```

注意，由于互斥锁是独占的，因此 `CreateMutexExW` 一定会因为无法创建同名互斥锁而返回 0，不需要使用 `GetLastError` 进行额外的判断。

对于 GUI 程序，新实例可以选择将旧实例唤醒并置于顶层，我采用如下设计：将上面的互斥代码放置于程序创建窗口之前，并且在发现已经存在实例的分支中加入如下代码：

```cpp

// enumerate all direct child windows of desktop
for (auto pre{ ::FindWindowExW(NULL, NULL, NULL, NULL) };
    // return null if at the end
    pre != NULL;
    // pass the pre as the 2nd argument to get next handle
    pre = ::FindWindowExW(NULL, pre, NULL, NULL))
{
    // check if window has the specified property
    // set in MainWindow constructor
    if (::GetPropW(pre, L"PlayerWinRT")) {
        // show and restore window
        ::ShowWindow(pre, SW_RESTORE);
        // activate, set foreground and get forcus
        ::SetForegroundWindow(pre);
        // exit app, DO NOT USE this->EXIT BECAUSE NOT CONSTRUCTED
        ::ExitProcess(1u);
    }
}

```

在创建窗口时添加如下代码：

```cpp

HWND hWnd; // current window's hwnd

::SetPropW(hWnd, L"PlayerWinRT", hWnd);

```

原理是通过给窗口设置一个辨识应用的属性（字符串），注意微软的文档有误，`SetPropW` 的第三个参数（属性的值的 HANDLE）为必填，如果该值为 0 会导致 `GetPropW` 返回 0（等同于属性不存在），这里使用当前窗口的 `HWND`，并无实际意义。