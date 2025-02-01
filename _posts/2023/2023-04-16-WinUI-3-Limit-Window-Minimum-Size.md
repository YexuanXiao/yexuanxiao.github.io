---
title: WinUI 3 限制窗口最小宽高
date: "2023-04-16 19:45:00"
tags: [C++,Windows]
category: blog
---
WinUI 3 软件开发中最无语的一件事就是限制窗口大小居然需要自己处理 Win32 消息。。。。。

<!-- more -->

```cpp

#include <Microsoft.UI.Xaml.Window.h>

HWND GetHandleFromWindow(winrt::Microsoft::UI::Xaml::Window const& window) {
    auto hWnd{ HWND{} };
    window.as<::IWindowNative>()->get_WindowHandle(&hWnd);
    return hWnd;
}
std::atomic<uintptr_t> old_proc;
LRESULT CALLBACK WindowProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    auto scaleFactor(::GetDpiForWindow(hWnd));
    if (WM_GETMINMAXINFO == uMsg) {
        reinterpret_cast<MINMAXINFO*>(lParam)->ptMinTrackSize.x = (362 * scaleFactor + (96 >> 1)) / 96;
        reinterpret_cast<MINMAXINFO*>(lParam)->ptMinTrackSize.y = (170 * scaleFactor + (96 >> 1)) / 96;
    }
    return ::CallWindowProcW(reinterpret_cast<WNDPROC>(old_proc.load(std::memory_order_acquire)), hWnd, uMsg, wParam, lParam);
}
void InitializeWindowMinSize(winrt::Microsoft::UI::Xaml::Window const& window) {
    old_proc.store(
        ::SetWindowLongPtrW(GetHandleFromWindow(window), GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(&WindowProc)),
        std::memory_order_release);
}

```

原理实际上非常简单，但网上对于真正可用的代码却都是缄默不语，所幸找到了 PowerToys 相关的项目中的 **历史提交** 里的 Workaround [Settings UI](https://github.com/WinUICommunity/SettingsUI/blob/eaa1dd28c73aea7366cceeca485342e6edf389d6/src/SettingsUI/Tools/Helpers/WindowHelper/WindowHelper.ReSizeWindow.cs)。

之所以强调 **历史提交** 是因为它已经被删了，PowerToys 目前实际上也没有这个特性。

用法很简单，把 362 和 170 改成自己想要的宽和高即可，然后调用 `InitializeWindowMinSize`。不过这本身是 workaround，所以这个方法实际上不怎么好用，因为依赖一个全局变量，假设你想要限制不同窗口有不同的最小大小，则行不通，不过如果你的应用和 UWP 一样使用单一窗口则还算可用。
