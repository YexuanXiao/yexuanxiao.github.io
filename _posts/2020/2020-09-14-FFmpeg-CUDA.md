---
title: 使用 CUDA 加速 FFmpeg 编码 HEVC
date: "2020-12-06 15:01:00"
tags: [media,docs,C++]
category: blog
permalink: /blog/2020/09/14/FFmpeg-CUDA/
---
CUDA 是建立在 NVIDIA 的 GPUs 上的一个通用并行计算平台和编程模型，基于 CUDA 编程可以利用 GPUs 的并行计算引擎来更加高效地解决比较复杂的问题。

<!-- more -->

首先去 CUDA 官网下载运行环境和驱动: [CUDA Tookit](https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exenetwork)

![2020-09-14_071444](https://tva3.sinaimg.cn/mw690/005ZJ4a1ly1gipuf85mh5j32i01lsaek.jpg)

此时一定要选择在线安装，否则你将得到一个几乎没什么用的 2GB 的离线安装包。

运行后选择自定义安装，只需要 Driver components 下的 Display Driver，以及 CUDA 下的 Runtime。如果有后续需求，可以再运行程序进行补丁式安装。

执行 `nvidia-smi` 可以得到 显卡情况以及正在使用显卡的程序

```powershell

Mon Sep 14 06:56:10 2020
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 451.82       Driver Version: 451.82       CUDA Version: 11.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name            TCC/WDDM | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  GeForce GTX 1660Ti WDDM  | 00000000:02:00.0 Off |                  N/A |
|  0%   51C    P0    18W /  N/A |    264MiB /  6144MiB |      9%      Default |
+-------------------------------+----------------------+----------------------+

+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|    0   N/A  N/A     11072      C   ...am Files\Tools\ffmpeg.exe    N/A      |
+-----------------------------------------------------------------------------+

```

然后去下载 FFmpeg，并添加到 `PATH` 环境变量。

执行 `ffmpeg -hwaccels` 可以得到该版本 FFmpeg 支持的硬件加速器。

```powershell

Hardware acceleration methods:
cuda
dxva2
qsv
d3d11va

```

dxva 和 d3d11va 是解码器，cuda 是 NVIDIA CUDA，qsv 是 Intel Quick Sync Video。本文重点使用 CUDA。

要想使用 CUDA，需要使用如下参数：`-c:v nvenc_hevc`

由于使用了硬件编码器，所以 nvenc_hevc 的参数比 libx265 少很多，本人简单测试得到了一个可以用的完整参数：

```powershell

ffmpeg -i input.mkv -map 0 -c copy -c:v hevc_nvenc -preset slow -tune 1 -b:v 5000k -profile:v main10 -level 6 -b_ref_mode 1 -bf 4 -c:a copy out.mkv

// -map 0 -c copy -c:v hevc_nvenc 这种顺序和写法能保证 ffmpeg 复制所有其他不进行编码的流

```

由于 FFmpeg 在 4.4 的时候修改了 NVENC 的程序，所以之前的参数现在不可用。

![20201206151459](https://tvax4.sinaimg.cn/large/005ZJ4a1gy1gle5quj9qrj30xt03nt8r.jpg)


虽然这个方法不是很准确，但是根据 ffmpeg 导出的 png 文件可以看出图片具备的数据量：


图 1 是原始视频文件，10Bit AVC 12000kbps，图 2 是不指定码率，自动分配码率 10Bit HEVC 2300kbps，图 3 是指定码率 5000k，实际 5100kbps差不多可以得到，如果想增加 850k 的数据量（png），需要将码率翻一倍。


我给出的参数及指定 5000k 码率对比如下：

![1](https://tvax4.sinaimg.cn/large/005ZJ4a1gy1gle5xtd2w3j31hc0u0nph.jpg)

<pk>原始</pk>

![2](https://tvax3.sinaimg.cn/large/005ZJ4a1gy1gle5zxm3yyj31hc0u01l0.jpg)

<pk>自动</pk>

![3](https://tva2.sinaimg.cn/large/005ZJ4a1gy1gle5xor996j31hc0u0u10.jpg)

<pk>5000k</pk>


根据我的观察，自动分配码率的输出结果会因为数据量不够而丢失很多细节，并且增加一定的涂抹感，而将码率翻倍，指定为 5000k 时，该问题就可以得到很好的解决，并且有更少的杂色和 band，画面基本得到了还原。

附：批量转换视频，需要 C++20

```cpp

#include <filesystem>
#include <format>
#include <iostream>
#include <deque>

namespace fs = std::filesystem;

template<typename T> requires requires(T t,typename T::value_type u) { t.push_back(u); }
void recursive_find_video(const fs::path& p, T& v_p)
{
    auto begin = fs::recursive_directory_iterator(p);
    auto end = fs::recursive_directory_iterator();
    while (begin != end)
    {
        try {
            const auto& entry = *begin;
            if (entry.is_regular_file())
            {
                const auto ext = entry.path().extension().string();
                if (ext == ".mp4" || ext == ".mkv") {
                    v_p.push_back(entry.path());
                    std::cout << "Added " << entry.path() << " to list." << std::endl;
                }
            }
            else {
                // other mysterious type
            }
            ++begin;
        }
        catch (fs::filesystem_error a) {
            ++begin;
        }
    }
}

// std::format针对std::filesystem::path的重载，实际没啥用，仅用于省略format参数中的path::string()
template<> class std::formatter<fs::path, char>
: public std::_Formatter_base<fs::path, char, std::_Basic_format_arg_type::_Custom_type>
// _Basic_format_arg_type是个枚举类，_Custom_type用于说明是自定义类型
{
protected:
    // 根据自定义类型的成员变量类型，定义一些内置的std::formatter对象
    formatter<string, char> string_formatter;
public:
    using BaseClass = _Formatter_base<fs::path, char, std::_Basic_format_arg_type::_Custom_type>;
    // 直接借用了基类的parse，无实际作用
    using ParseContext = basic_format_parse_context<char>;
    ParseContext::iterator parse(ParseContext& parse_ctx)
    { // parse用于解析格式化符
        return BaseClass::parse(parse_ctx);
    }
    using FormatContext = basic_format_context<back_insert_iterator<std::_Fmt_buffer<char>>, char>;
    FormatContext::iterator format(const fs::path& val, FormatContext& format_ctx) noexcept
    { // format负责具体输出
        back_insert_iterator<std::_Fmt_buffer<char>> itor = format_ctx.out();
        itor = string_formatter.format(val.string(), format_ctx);
        return itor;
    }

};

int main()
{
    std::vector<fs::path> v_p;
    recursive_find_video(fs::current_path(), v_p);
    for(auto &p1:v_p) {
        fs::path p2 = p1.parent_path();
        p2 /= p1.stem();
        p2 += "_temp";
        p2 += p1.extension();
        std::system(std::format("ffmpeg -i \"{}\" -map 0 -c copy -c:v hevc_nvenc -preset slow -tune 1 -b:v 5000k -profile:v main10 -level 6 -b_ref_mode 1 -bf 4 -c:a copy \"{}\"",
            p1, p2).c_str());
        fs::remove(p1);
        fs::rename(p2, p1);
    }
}

```

```powershell

ffmpeg -i file // 查看文件基本信息

ffmpeg -codecs // 查看可用解码器

ffmpeg -h encoder=hevc_nvenc // 获得编码器详细用法

ffmpeg -ss 5:55.551 -i 2.mkv -vframes 1 2.png // 按帧截图，不是100%准确但是比直接用ffmpeg输出png准确

```