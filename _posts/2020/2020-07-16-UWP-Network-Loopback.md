---
title: UWP 应用使用代理服务器
date: "2020-07-16 18:33:00"
tags: [Windows,UWP,docs]
category: blog
---
微软在 Windows 8 开始推出了新一代应用架构 UWP，由于为了保证安全性， UWP 大多运行在沙盒中，所以 UWP 默认无法使用系统代理，不过微软提供了开关。

<!-- more -->

1. 以管理员模式打开 Windows PowerShell， 执行 `Get-AppxPackage > applist.txt` ，这时会在当前目录生成一个 AppX 应用列表（applist.txt）。

    其中内容如下

    ```powershell

    Name              : windows.immersivecontrolpanel
    Publisher         : CN=Microsoft Windows, O=Microsoft Corporation, L=Redmond, S=Washington, C=US
    Architecture      : Neutral
    ResourceId        : neutral
    Version           : 10.0.2.1000
    PackageFullName   : windows.immersivecontrolpanel_10.0.2.1000_neutral_neutral_cw5n1h2txyewy
    InstallLocation   : C:\Windows\ImmersiveControlPanel
    IsFramework       : False
    PackageFamilyName : windows.immersivecontrolpanel_cw5n1h2txyewy
    PublisherId       : cw5n1h2txyewy
    IsResourcePackage : False
    IsBundle          : False
    IsDevelopmentMode : False
    NonRemovable      : True
    IsPartiallyStaged : False
    SignatureKind     : System
    Status            : Ok

    ......

    ```

    应用的每个信息按照上面图中顺序所示。

2. 去设置/应用，点击你需要使用代理服务器的应用，选择高级选项。

    这时可以看到一个版本号，将版本号记下来，在 `app-list.txt` 中搜索该版本号。

    此时就找到了这个应用的信息。

3. 搜索到的版本号下面第四行，就是需要的 PackageFamilyName，将冒号后面的字符复制下来。

4. 在 PowerShell 中执行 `CheckNetIsolation LoopbackExempt -a -n="PackageFamilyName"`

    其中 PackageFamilyName 就是第三步复制下来的内容，注意命令中需要将 PackageFamilyName 用英文引号引起来。

此时重启应用即可使用代理服务器。

若要恢复默认，则将第四步的命令换为 `CheckNetIsolation LoopbackExempt -d -n="PackageFamilyName"`

对于某些 Windows 自带应用，如邮件，请额外执行 `CheckNetIsolation LoopbackExempt -d -n="microsoft.windows.authhost.a_8wekyb3d8bbwe"`