---
title: Windows 绑定进程到指定核心
date: "2022-08-08 23:59:00"
tags: [C++,Windows]
category: blog
---
闲着没事写了个小工具，让指定进程运行在指定 CPU 核心。比如让某进程只运行在前 4个核心，前 6 个核心。或者屏蔽超线程，让每个线程都运行在独立核心上。原理是先根据可执行文件名获得进程的句柄，然后配合一个 64 位的掩码传给 `SetProcessAffinityMask` 函数即可。需要管理员权限才能运行，另外没有考虑 `OpenProcess` 被 Hook 的情况，有可能 `OpenProcess` 被某些反作弊软件 Hook 导致调用虚假的 `OpenProcess` 而失败。

<!-- more -->

```cpp

#include <windows.h>
#include <tlhelp32.h>
#include <tchar.h>
#include <iostream>
#include <string_view>
#include <memory>

namespace bind_process_core {

	inline HANDLE GetProcessHandleByName(LPCWSTR process_name) // 根据 exe 名查找进程句柄
	{
		PROCESSENTRY32W entry;
		entry.dwSize = sizeof(entry);
		HANDLE handle = 0;
		auto const snapshot = ::CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0); // 创建进程快照

		::Process32FirstW(snapshot, &entry);
		while (::Process32NextW(snapshot, &entry))
		{
			if (!::lstrcmpW(entry.szExeFile, process_name))
			{  // 打开目标进程句柄
				handle = ::OpenProcess(PROCESS_ALL_ACCESS, FALSE, entry.th32ProcessID);
				::CloseHandle(snapshot);
				return handle;
			}
		}

		::CloseHandle(snapshot);
		return handle;
	}

	inline void PrintUsage(const std::string_view invoke_name)
	{
		auto const pos = invoke_name.find_last_of('\\');
		auto const exename = invoke_name.substr(pos + 1, invoke_name.size() - pos);

		std::cout << "Usage:\n";
		std::cout << exename << " -name filename -cores <1, 2, 3... 64> [-mode <real, fix>]\n";
		std::cout << "real   : skip HT Cores\n";
		std::cout << "fix    : use HT Cores\n";
		std::cout << "default: use HT Cores\n";
	}

	inline int GetMode(const char* mode_name)
	{
		if (::strcmp(mode_name, "real"))
			return 1;
		else if (::strcmp(mode_name, "fix")) // 跳过超线程核心
			return 2;
		else
			return 0;
	}

	inline void CloseHandle(const HANDLE handle)
	{
		if (handle)
			::CloseHandle(handle);
	}
}

int main(int argc, char** argv)
{
	namespace bpc = bind_process_core;

	if (argc < 4) { // 小于 4 时打印 usage
		bpc::PrintUsage(argv[0]);
		::system("pause");
		return 0;
	}

	int mode = 1; // mode 缺省为 1
	if (argc == 7) { // mode 非缺省
		auto const modename = argv[6];
		if (!(mode = bpc::GetMode(modename))) {
			std::cout << "invalid mode: " << modename << '\n';
			::system("pause");
			return 0;
		}
	}

	auto cores = argv[4];
	auto const count = ::atoi(cores); // 获得待绑定核心数
	if ((mode == 1 && (count > 64 || count < 1)) || (mode == 2 && (count > 32 || count < 1))) {
		std::cout << "invalid cores: " << cores << '\n'; // 最多 64 核心或者超线程最多 32 核心
		::system("pause");
		return 0;
	}

	auto const filename = argv[2];
	auto const namesize = MultiByteToWideChar(CP_UTF8, 0, filename, -1, NULL, 0); // 计算 UTF-8 到 UTF-16 所需空间
	auto const name = std::make_unique<TCHAR[]>(sizeof(TCHAR) * namesize);
	if (!::MultiByteToWideChar(CP_UTF8, 0, filename, -1, name.get(), namesize)) { // 把 filename 转换为 wchar
		std::cout << "invalid name: " << filename << '\n';
		::system("pause");
		return 0;
	}

	DWORD_PTR bitmask = 0; // 初始化掩码
	for (auto i = count; i > 0; --i) { // 计算掩码，从右到左每一位代表一个核心
		bitmask = (bitmask << mode) | 1;
	}

	std::unique_ptr<std::remove_pointer_t<HANDLE>, void(*)(HANDLE)> handle(
		bpc::GetProcessHandleByName(name.get()),
		bpc::CloseHandle
	); // 获得目标句柄
	if (!handle) {
		std::cout << "invalid filename: " << filename << '\n';
		::system("pause");
		return 0;
	}

	auto const result = ::SetProcessAffinityMask(handle.get(), bitmask); // 绑定核心
	if (!result) {
		std::cout << "system error: " << ::GetLastError() << '\n';
		::system("pause");
		return 0;
	}

	std::cout << "successed" << '\n';
	::system("pause");
	return 0;
}

```
