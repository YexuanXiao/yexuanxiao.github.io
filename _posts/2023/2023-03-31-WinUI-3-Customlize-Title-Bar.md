---
title: WinUI 3 自定义标题栏
date: "2023-03-31 11:15:00"
tags: [C++,Windows]
category: blog
---
Windows 自定义标题栏一直是个麻烦问题，WinUI 3 毫不意外的继承了这个性质，由于 WinUI 3 是纯粹的 Win32 应用，因此和所有 Win32 应用一样使用系统窗口，造成了许多问题，这两天踩了许多坑后在此分享一下经验。

<!-- more -->

UWP 使用 `AppWindow` 和 `CoreWindow` 管理标题栏，对于深度定制来说会受到 UWP API 限制（无法使用任何 `HWND` API），但统一的框架使得 UWP 的标题栏最方便使用，此外 UWP 还使用更高的标题栏和按钮。

但是 WinUI 3 的窗口是传统窗口，目前允许甚至推荐使用 `HWND` 和 Win32 API，因此 WinUI 3 的标题栏注定和 UWP 有区别，目前来说 WinUI 3 提供了 3 种标题栏：

1. Windows 默认

2. `Microsoft.UI.Xaml.Window` 类，扩展内容到标题栏

    Window 虽然支持扩展内容到标题栏，但窗口管理按钮的左侧有一小部分无法定制，参考 Windows 11 的多标签文件文件资源管理器，该位置强制保留用于拖拽窗口使用

    同时窗口管理按钮贴靠窗口顶部并且不能占满整个标题栏的高度，在标题栏底部和按钮之间有间隙

    使用 `ContentDialog` 时标题栏顶部 32 像素无法应用遮罩效果

    此外该方法存在按钮标志“--，[]，><” 细小的问题，这个问题或许可以通过自己设置 WindowChrome 的属性解决，我没做深入研究

3. `Microsoft.UI.Windowing.AppWindow` 类，扩展内容到标题栏

    对标题栏定制能力最强的方式，除了按钮本身都可以定制，并且支持各种调整，可以视为用 Win32 模仿 UWP 行为，但只能 Windows 11 用，我个人推测可能是依赖只有 Windows 11 可用的 DWM 属性 [DWMWINDOWATTRIBUTE](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute)

    存在的问题是无法在顶部调整窗口大小，该问题有待解决

使用第二种方案的话只需要简单几个步骤：

首先设置如下的 XAML。

```xaml

<Grid
    Name="AppTitleBar"
    Height="48"
    Margin="48,0,0,0"
    VerticalAlignment="Top"
    Canvas.ZIndex="-1000">
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
    </Grid.ColumnDefinitions>
    <StackPanel Orientation="Horizontal">
        <Image
            Width="24"
            Height="24"
            Margin="0,2,12,0"
            HorizontalAlignment="Left"
            VerticalAlignment="Center"
            Source="/Assets/Square44x44Logo.png" />
        <TextBlock
            Grid.Column="1"
            VerticalAlignment="Center"
            Style="{StaticResource CaptionTextBlockStyle}"
            Text="{x:Bind AppTitleText}" />
    </StackPanel>
</Grid>

```

然后对 `Window` 对象调用 `SetTitleBar`，参数为 `AppTitleBar` 对象，最后设置 `Window` 对象的属性 `ExtendsContentIntoTitleBar` 为 `true` 即可。

使用第三种方案的话也要添加如上的 Xaml，然后在 App.xaml.cpp 中添加如下代码：

```cpp

#include <Microsoft.UI.Xaml.Window.h>

void App::OnLaunched(LaunchActivatedEventArgs const&) {
    auto appTitleBar{ window_.Content().as<Page>().GetAppTitleBar() };
    if (AppWindowTitleBar::IsCustomizationSupported()){
        // 检测是否支持，Windows 11
        auto appWindow{ window_.AppWindow() };
        appWindow.TitleBar().ExtendsContentIntoTitleBar(true);
        appWindow.Changed({ this,&App::AppWindow_Changed });
        auto titleBar{ appWindow.TitleBar() };
        titleBar.ExtendsContentIntoTitleBar(true);
        appTitleBar.Loaded({ this,&App::AppTitleBar_Loaded });
        appTitleBar.SizeChanged({ this, &App::AppTitleBar_SizeChanged });
    } else {
        // In the case that title bar customization is not supported, fallback to WindowChrome
        window_.ExtendsContentIntoTitleBar(true);
        window_.SetTitleBar(appTitleBar);
    }
}

void App::AppTitleBar_Loaded(IInspectable const&, RoutedEventArgs const&) {
    assert(AppWindowTitleBar::IsCustomizationSupported());
    SetDragRegionForCustomTitleBar();
}

void App::AppTitleBar_SizeChanged(IInspectable const&, SizeChangedEventArgs const&) {
    assert(AppWindowTitleBar::IsCustomizationSupported());
    assert(window_.AppWindow().TitleBar().ExtendsContentIntoTitleBar());
    SetDragRegionForCustomTitleBar();
}
void App::SetDragRegionForCustomTitleBar() {
    assert(AppWindowTitleBar::IsCustomizationSupported());
    auto titleBar{ window_.AppWindow().TitleBar() };
    assert(titleBar.ExtendsContentIntoTitleBar());
    auto scaleAdjustment{ GetScaleAdjustment(window_) };
    auto appTitleBar{ window_.Content().as<Page>().GetAppTitleBar() };
    auto rect{ RectInt32{ } };
    rect.X = static_cast<int32_t>((titleBar.LeftInset() + 48) * scaleAdjustment);
    rect.Y = 0;
    rect.Height = static_cast<int32_t>(48 * scaleAdjustment);
#if defined _DEBUG
    // make application tool bar clickable
    rect.Width = static_cast<int32_t>(appTitleBar.ActualWidth() * scaleAdjustment / 3);
#else
    rect.Width = appTitleBar.ActualWidth() * scaleAdjustment - rect.X - titleBar.RightInset();
#endif
    titleBar.SetDragRectangles(winrt::array_view(&rect, &rect + 1));
}

HWND GetHandleFromWindow(winrt::Microsoft::UI::Xaml::Window const& window) {
    auto hWnd{ HWND{} };
    window.as<::IWindowNative>()->get_WindowHandle(&hWnd);
    return hWnd;
}
double GetScaleAdjustment(winrt::Microsoft::UI::Xaml::Window const& window) {
    auto dpiX{ ::GetDpiForWindow(GetHandleFromWindow(window)) };
    auto scaleFactorPercent{ (dpiX * 100 + (96 >> 1)) / 96 };
    return scaleFactorPercent / 100.;
}

```

重点是 `SetDragRegionForCustomTitleBar` 里要算出标题栏的可拖动区域。
