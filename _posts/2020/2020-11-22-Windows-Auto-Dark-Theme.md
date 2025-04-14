---
title: Windows 10 自动黑暗颜色模式
date: "2020-11-22 20:04:00"
update: "2020-11-25 22:40:00"
tags: [Windows,docs]
category: blog
---
2020 年的当下，主流系统和不少软件都支持了黑色主题，本站也对黑色主题进行了适配。但是 Windows 10 本身并没有定时启用黑色主题功能，那么就需要自己进行设置。

<!-- more -->

基本思路来自 2015 年的文章 [How to turn on Windows 10 Dark Theme using Registry Tweak](https://www.thewindowsclub.com/enable-windows-10-dark-theme)，本质是通过修改注册表的方式切换主题。经过我的测试，发现 Windows 监听了文中的注册表项，修改注册表后会立即切换。

根据文章可以知道，这个项目保存到了 `HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize` 的 `SystemUsesLightTheme` 和 `AppsUseLightTheme` 中。

其中 `SystemUsesLightTheme` 是系统颜色模式，`AppsUseLightTheme` 是应用颜色模式，DWORD 为 1 代表浅色，0 代表深色。

现在就可以根据以上信息得到四句修改注册表的命令：

```powershell

//深色
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 0 /f
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme /t REG_DWORD /d 0 /f

```

```powershell

//浅色
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 1 /f
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme /t REG_DWORD /d 1 /f

```

此时需要老朋友 任务计划程序 来定时执行的命令：

![20201122211958](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gkyaav3tsgj30z40u0q3k.jpg "candark")
![20201122212004](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gkyaawsm6uj30wu0sowf3.jpg "candark")
![20201122212004](https://tva2.sinaimg.cn/large/005ZJ4a1ly1gkyaawsm6uj30wu0sowf3.jpg "candark")
![20201122212013](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gkyaawwtvtj30z40u074v.jpg "candark")
![20201122212017](https://tvax1.sinaimg.cn/large/005ZJ4a1ly1gkyaax7u1lj30p80rsaa7.jpg "candark")
![20201122212024](https://tvax1.sinaimg.cn/large/005ZJ4a1ly1gkyaasuyh2j30z40u03z6.jpg "candark")

浅色模式也一样，确定即可。

<br>
<p class="large">2020/11/24 更新</p>
<br>

需要开启 第一张图片 > 常规 > 使用最高权限运行，否则在某些情况下可能导致命令执行失败。

由于 任务计划程序 只有定时启动，没有在某个时间段后开机立即启动，所以单纯设置两个任务计划只能保证开机状态下的主题切换，如果在执行计划的时间，电脑处于关机状态，那么就不能保证真正的自动切换，所以需要再添加一个任务计划来在开机时执行。

由于任务计划本身是不包含逻辑判断的，那么就需要使用 Powershell 或者 C++ 来进行判断。

```powershell

PowerShell if(([int](Get-Date -Format %H) -gt 6) -and ([int](Get-Date -Format %H) -lt 20)) {reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 1 /f} else {reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 0 /f}

PowerShell if(([int](Get-Date -Format %H) -gt 6) -and ([int](Get-Date -Format %H) -lt 20)) {reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme /t REG_DWORD /d 1 /f} else {reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme /t REG_DWORD /d 0 /f}

```

或者 C++ :

```cpp

#include <iostream>
#include <ctime>
#include <cstdlib>
using namespace std;
 
int main()
{
   time_t now = time(0);
   tm *ltm = localtime(&now);
   short h = ltm->tm_hour;
   if (h > 5 && h < 20){
       system("reg add HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 1 /f");
       system("reg add HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v AppsUseLightTheme /t REG_DWORD /d 1 /f");
   } else {
       system("reg add HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v SystemUsesLightTheme /t REG_DWORD /d 0 /f");
       system("reg add HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v AppsUseLightTheme /t REG_DWORD /d 0 /f");
   }
}

```

<br>
<p class="large">2020/11/25 更新</p>
<br>

今天发现了一个新的问题：Windows 处于休眠或者睡眠状态时，任务不会被执行，我 Bing 了一下，从 V2EX 的一个问题下面得到了一部分答案和思路：[win10 怎样设置休眠唤醒后执行程序？](https://www.v2ex.com/t/487131)

文中给出了用 Windows Power-Troubleshooter 事件触发任务计划代码方法，但是 Windows 在睡眠中唤醒，并不会触发 Power-Troubleshooter 事件。

不过他这个方法隐含着一个思路：用 Windows 事件触发任务计划。

由于用 Windows 事件触发任务计划需要知道三件事：日志文件类别，日志来源，事件 ID，那么就可以使用 Windows 事件查看器获得这三个事件。

可以先记下当前时间，然后睡眠/关机/休眠，这样事件查看器里就会留下事件记录。

打开事件查看器，展开到 系统。

![20201125221939](https://tvax3.sinaimg.cn/large/005ZJ4a1ly1gl1s7wx3h6j30ay0awaa6.jpg "candark")

此时右侧就能看到各种事件，此时根据时间和来源就可以判断需要的到底是哪个事件：

![20201125214122](https://tva2.sinaimg.cn/large/005ZJ4a1ly1gl1s7x6gfjj31qq0ok3zs.jpg "candark")

这个事件来源是 Kernel-Power，ID 507。事件是从睡眠状态唤醒 Windows，原因是使用了鼠标。

![20201125214133](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gl1s7xeky2j31pi0h1t9c.jpg "candark")

这个事件来源是 Kernel-Power，ID 507。事件是从睡眠状态唤醒 Windows，原因是使用了键盘（这条不需要，和上一条等效）。

![20201125220511](https://tva4.sinaimg.cn/large/005ZJ4a1ly1gl1s7xljcmj31kl0m7myc.jpg "candark")

这个事件来源是 Kernel-General，ID 1。事件是调整事件，原因是系统时间因为关机，所以根据 BIOS 调整（这条不需要）。

![20201125220818](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gl1s7xs2vdj31oj0qnabd.jpg "candark")

这个事件来源是 Power-Troubleshooter，ID 1。事件是从低功耗状态下唤醒，原因是退出了了关机/休眠状态。

经过我的测试，退出关机/休眠 都会触发 Power-Troubleshooter ID 1 事件，所以只需要这一个事件就可以。

那么就需要这样的一个计划任务

![20201125221835](https://tvax3.sinaimg.cn/large/005ZJ4a1ly1gl1sqo5yz3j30z40u0wf6.jpg "candark")
![20201125221717](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gl1sqoqcyvj30wu0soq3l.jpg "candark")
![20201125221809](https://tva3.sinaimg.cn/large/005ZJ4a1ly1gl1sqox45vj30wu0somxv.jpg "candark")
![20201125221819](https://tvax4.sinaimg.cn/large/005ZJ4a1ly1gl1sqpfaf1j30z40u00tb.jpg "candark")
![20201125221829](https://tva3.sinaimg.cn/large/005ZJ4a1ly1gl1sqpjbqsj30z40u0mxt.jpg "candark")

<br>
<p class="large">2020/11/26 更新</p>
<br>
<p class="big">注意：本方法并不能保证壁纸 100% 生效，原因是 <pre>RunDll32.exe USER32.DLL,UpdatePerUserSystemParameters</pre> 不可靠</p>

今天我又研究了一下 PowerShell 怎么更换壁纸，参考了如下文章：

[Window10定时换壁纸](https://blog.csdn.net/qq_42838723/article/details/88951726)

[Win10当前壁纸保存位置](https://blog.csdn.net/qq_35040828/article/details/79398080)

[【Answers 分享】如何删除Win10背景图片（壁纸）历史记录](https://answers.microsoft.com/zh-hans/windows/forum/windows_10-start-win_desk/answers/ff6e02c1-b329-4faf-99ae-e2fd1b65fc6f)

得到两个目录：

`%userprofile%\AppData\Local\Microsoft\Windows\Themes`

`%userprofile%\AppData\Roaming\Microsoft\Windows\Themes`

第一个目录是主题位置，第二个目录是当前壁纸缓存。

首先需要在 PowerShell 里执行 `cmd /c echo "%userprofile%\AppData\Local\Microsoft\Windows\Themes"` 得到完整目录，然后将输出的结果复制下来。

然后将想要更换的两张壁纸放入这个目录，再在之前设置好的开关机触发的任务计划中添加如下操作：

```powershell

PowerShell if(([int](Get-Date -Format %H) -gt 6) -and ([int](Get-Date -Format %H) -lt 20)) {reg add reg add "hkcu\control panel\desktop" /v wallpaper /d "浅色图片地址" /f} else {reg add reg add "hkcu\control panel\desktop" /v wallpaper /d "深色图片地址" /f /t REG_DWORD /d 0 /f}
RunDll32.exe USER32.DLL,UpdatePerUserSystemParameters

```

浅色触发的：

```powershell

reg add reg add "hkcu\control panel\desktop" /v wallpaper /d "浅色图片地址" /f /t REG_DWORD /d 0 /f
RunDll32.exe USER32.DLL,UpdatePerUserSystemParameters

```

深色触发的：

```powershell

reg add reg add "hkcu\control panel\desktop" /v wallpaper /d "深色图片地址" /f /t REG_DWORD /d 0 /f
RunDll32.exe USER32.DLL,UpdatePerUserSystemParameters

```

即可实现随着自动切换颜色模式而切换壁纸。