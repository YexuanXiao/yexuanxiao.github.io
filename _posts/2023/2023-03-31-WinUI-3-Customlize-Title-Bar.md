---
layout: post
title: WinUI 3 自定义标题栏
date: "2023-03-31 11:15:00"
tags: [C++,Windows]
categories: [blog]
---
Windows 自定义标题栏一直是个麻烦问题，WinUI 3 毫不意外的继承了这个性质，由于 WinUI 3 是纯粹的 Win32 应用，因此和所有 Win32 应用一样使用系统窗口，造成了许多问题，这两天踩了许多坑后在此分享一下经验。

<!-- more -->

UWP 使用 `AppWindow` 和 `CoreWindow` 管理标题栏，对于深度定制来说会受到 UWP API 限制（无法使用任何 `HWND` API），但统一的框架使得 UWP 的标题栏最方便使用，此外 UWP 还使用更高的标题栏和按钮。

但是 WinUI 3 的窗口是传统窗口，目前允许甚至推荐使用 `HWND` 和 Win32 API，因此 WinUI 3 的标题栏注定和 UWP 有区别，目前来说 WinUI 3 提供了 3 种标题栏：

1. Windows 默认

2. `Microsoft.UI.Xaml.Window` 类，扩展内容到标题栏

    Window 虽然支持扩展内容到标题栏，但窗口管理按钮的左侧有一小部分无法定制，参考 Windows 11 的多标签文件文件资源管理器，该位置强制保留用于拖拽窗口使用，同时窗口管理按钮贴靠窗口顶部并且不能占满整个标题栏的高度，在标题栏底部和按钮之间有间隙

    此外该方法存在按钮标志“--，[]，><” 细小的问题

3. `Microsoft.UI.Windowing.AppWindow` 类，扩展内容到标题栏

    对标题栏定制能力最强的方式，除了按钮本身都可以定制，并且支持各种调整，可以视为用 Win32 模仿 UWP 行为，但只能 Windows 11 用，我个人推测可能是依赖只有 Windows 11 可用的 DWM 属性 [DWMWINDOWATTRIBUTE](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute)，同时该按钮仍然不能填充整个标题栏高度，和 UWP 仍然不一致，同时目前接口并不友好

    我查看了 Microsoft.UI.Xaml 仓库，发现 `AppWindow` 未来可能存在更进一步的改进，目前使用 `AppWindow` 并没有什么必要

使用第二种方案的话只需要简单几个步骤：

首先设置如下的 XAML，注意必须使用 `Grid`，并让 `AppTitleBar` 为第一行

```xaml

<Border
    Name="AppTitleBar"
    Grid.Column="1"
    Height="48"
    Margin="48,0,0,0"
    VerticalAlignment="Top"
    Canvas.ZIndex="1"
    IsHitTestVisible="True">
    <StackPanel Orientation="Horizontal">
        <Image Width="18" Source="ms-appx:///Assets/TitleBarLogo.png" />
        <TextBlock
            Name="AppTitle"
            Margin="16,0,0,0"
            VerticalAlignment="Center"
            Text="{Bind AppTitleText}" />
    </StackPanel>
</Border>

```

然后对 `Window` 对象调用 `SetTitleBar`，参数为 `AppTitleBar` 对象，最后设置 `Window` 对象的属性 `ExtendsContentIntoTitleBar` 为 `true` 即可。

若要使用 `AppWindow` 的方式，则需要先获得 `Window` 的 `HWND`，然后获得 `HWND` 的 `WinRT` 表示 `WindowId`，生成一个 `AppWindow` 并设置内容扩展到标题栏。

```cpp

HWND hWnd;
window.try_as<::IWindowNative>()->get_WindowHandle(&hWnd);
WindowId wndID = ::GetWindowIdFromWindow(hWnd);
AppWindow appwindow = AppWindow::GetFromWindowI(wndID);
appwindow.TitleBar().ExtendsContentIntoTitleBar(true)

```

注意，此种方式仍然需要 `Window` 设置标题栏，但不需要扩展内容到标题栏。