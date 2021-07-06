---
layout: post
title: 使用 CUDA 加速 FFmpeg 编码 HEVC
date: "2020-12-06 15:01:00"
tags: [encode,docs,hevc,C++]
categories: [blog]
permalink: /blog/2020/09/14/FFmpeg-CUDA/
---
　　CUDA 是建立在 NVIDIA 的 GPUs 上的一个通用并行计算平台和编程模型，基于 CUDA 编程可以利用 GPUs 的并行计算引擎来更加高效地解决比较复杂的问题。

<!-- more -->

　　首先去 CUDA 官网下载运行环境和驱动: [CUDA Tookit](https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exenetwork)

![2020-09-14_071444](https://tva3.sinaimg.cn/mw690/005ZJ4a1ly1gipuf85mh5j32i01lsaek.jpg)

　　此时一定要选择在线安装，否则你将得到一个几乎没什么用的 2GB 的离线安装包。

　　运行后选择自定义安装，我们只需要 Driver components 下的 Display Driver，以及 CUDA 下的 Runtime。如果有后续需求，可以再运行程序进行补丁式安装。



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

　　要想使用 CUDA，需要使用如下参数：` -hwaccel cuvid -i inputfile -c:v nvenc_hevc outputfile`

　　由于使用了硬件编码器，所以 nvenc_hevc 的参数比 libx265 少很多，本人简单测试得到了一个可以用的完整参数：

```powershell

ffmpeg -hwaccel cuvid -i 1.mkv -map 0 -c copy -c:v hevc_nvenc -preset slow -tune 1 -b:v 5000k -profile main10 -level 6 -b_ref_mode 1 -bf 4 3.mkv

// -map 0 -c copy -c:v hevc_nvenc 这种顺序和写法能保证 ffmpeg 复制所有其他不进行编码的流

```


　　由于 FFmpeg 在 4.4 的时候修改了 NVENC 的程序，所以之前的参数现在不可用。

![20201206151459](https://tvax4.sinaimg.cn/large/005ZJ4a1gy1gle5quj9qrj30xt03nt8r.jpg)


　　虽然这个方法不是很准确，但是根据 ffmpeg 导出的 png 文件可以看出图片具备的数据量：


　　图 1 是原始视频文件，10Bit AVC 12000kbps，图 2 是不指定码率，自动分配码率 10Bit HEVC 2300kbps，图 3 是指定码率 5000k，实际 5100kbps，我们差不多可以得到，如果想增加 850k 的数据量（png），需要将码率翻一倍。


　　我给出的参数及指定 5000k 码率对比如下：

![1](https://tvax4.sinaimg.cn/large/005ZJ4a1gy1gle5xtd2w3j31hc0u0nph.jpg)

<pk>原始</pk>

![2](https://tvax3.sinaimg.cn/large/005ZJ4a1gy1gle5zxm3yyj31hc0u01l0.jpg)

<pk>自动</pk>

![3](https://tva2.sinaimg.cn/large/005ZJ4a1gy1gle5xor996j31hc0u0u10.jpg)

<pk>5000k</pk>


　　根据我的观察，自动分配码率的输出结果会因为数据量不够而丢失很多细节，并且增加一定的涂抹感，而将码率翻倍，指定为 5000k 时，该问题就可以得到很好的解决，并且有更少的杂色和 band，画面基本得到了还原。

附：


　　随手去网上抄了个代码改了一下，可以批量转换视频，用法自己看：

```cpp

#include <direct.h>
#include <io.h>
#include <cstdlib>
#include <vector>
#include <iostream>

using namespace std;

void getFiles2(string path, vector<string> &files, vector<string> &ownname);
void getFiles1(string path, vector<string> &files);

int main()
{
	char *filePath;
	//direct.h的方法mkdir建立输出文件夹out
	if (!mkdir("out"))
	{
		perror("mkdir error");
		return -1;
	}
	//direct.h的方法getcwd获取当前目录的绝对路径
	if ((filePath = getcwd(NULL, 0)) == NULL)
	{
		perror("getcwd error");
		return -2;
	}

	vector<string> files;
	vector<string> filesname;

	//获取该路径下的所有文件路径
	//getFiles1(filePath, files);

	//获取该路径下的所有文件路径和文件名
	getFiles2(filePath, files, filesname);
	for (int i = 0; i < filesname.size(); i++)
	{
		//c_str转换char*输出，注意不引入<string>时，cout不支持string的重载，必须先转换char*
		cout << filesname[i].c_str() << endl;
		//拼接字符串，也可以用j.append(k)成员函数的方法拼，注意拼接时第一个元素必须为string
		string j = "ffmpeg -hwaccel cuvid -i \"";
		string k = j + filesname[i].c_str() + "\" -map 0 -c copy -c:v hevc_nvenc -preset slow -tune 1 -b:v 5500k -profile main10 -level 6 -b_ref_mode 1 -bf 4 \".\\out\\" + filesname[i].c_str() + "\"";
		//用cstdlib的system调用
		system(k.c_str());
	}
}

void getFiles1(string path, vector<string> &files)
{
	//文件句柄
	//long hFile = 0;  //win7
	intptr_t hFile = 0; //win10
	//文件信息
	struct _finddata_t fileinfo; //<io.h>
	string p;
	if ((hFile = _findfirst(p.assign(path).append("\\*").c_str(), &fileinfo)) != -1)
	// "\\*"是指读取文件夹下的所有类型的文件，若想读取特定类型的文件，以png为例，则用“\\*.png”
	{
		do
		{
			//如果是目录,迭代之
			//如果不是,加入列表
			if ((fileinfo.attrib & _A_SUBDIR))
			{
				if (strcmp(fileinfo.name, ".") != 0 && strcmp(fileinfo.name, "..") != 0)
					getFiles1(p.assign(path).append("\\").append(fileinfo.name), files);
			}
			else
			{
				files.push_back(path + "\\" + fileinfo.name);
			}
		} while (_findnext(hFile, &fileinfo) == 0);
		_findclose(hFile);
	}
}

void getFiles2(string path, vector<string> &files, vector<string> &ownname)
{
	//files存储文件的路径及名称，ownname只存储文件的名称

	long hFile = 0; //文件句柄
	//文件信息
	struct _finddata_t fileinfo;
	string p;
	if ((hFile = _findfirst(p.assign(path).append("\\*mkv").c_str(), &fileinfo)) != -1)
	{
		do
		{
			//如果是目录,迭代之
			//如果不是,加入列表
			if ((fileinfo.attrib & _A_SUBDIR))
			{
				if (strcmp(fileinfo.name, ".") != 0 && strcmp(fileinfo.name, "..") != 0)
					getFiles2(p.assign(path).append("\\").append(fileinfo.name), files, ownname);
			}
			else
			{
				files.push_back(path + "\\" + fileinfo.name);
				ownname.push_back(fileinfo.name);
			}
		} while (_findnext(hFile, &fileinfo) == 0);
		_findclose(hFile);
	}
}

//https://www.cnblogs.com/yuehouse/p/10159358.html

```


```powershell

ffmpeg -i file//查看文件基本信息

ffmpeg -codecs//查看可用解码器

ffmpeg -h encoder=hevc_nvenc//获得编码器详细用法

ffmpeg  -ss 5:55.551 -i 2.mkv -vframes 1 2.png//按帧截图，不是100%准确但是比直接用ffmpeg输出png准确

```


　　今天遇到一个奇怪的问题，x264 显示 No decoder surfaces left，后来研究了一下，把解码器换一下就可以了：

```powershell

ffmpeg -hwaccel cuvid -c:v h264_cuvid -i inputfile -c:v hevc_nvenc -preset slow -tune 1 -b:v 5000k -profile main -level 6 -b_ref_mode 1 -bf 4 outputfile

```