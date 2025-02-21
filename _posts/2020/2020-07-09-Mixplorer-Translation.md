---
title: MiXplorer 翻译
date: "2020-07-09 05:16:00"
tags: [Android,docs]
category: backup
---

MiXplorer 是 Android 最好的文件管理器。

<!-- more -->

2015年的时候在酷安发现了这个文件管理器，凭借娇小的体积，丰富的功能，漂亮的 UI，便捷的操作还有丰富的扩展，MiXplorer 变成为了我的主力文件管理器（另一个是三星自带的文件，因为 Android 6.0 开始取消了第三方文件管理器直接控制 SD 卡的权限，所以第三方文件管理不能剪切 SD 卡的文件，只有自带的才可以）。

不过由于这个软件是外国人开发的，所以当时的本地化工作十分不足，但是 MiXplorer 一直支持加载外部语言包，所以索性自己动手翻译。

从2016年最初接手时可能大概有的200-300行缝缝补补到现在的700多行，还是很有成就感。

以往都是在酷安发布更新，不过去年年末由于众所周知的原因舍弃酷安，借这次（2020/07/09）更新遂创建了这个界面用于发布翻译。

由于我并没有每个字符串的具体描述，所以翻译难免有些许错误，如果发现，还请在评论区指出。

MiX 现在的语言文件使用 zip 压缩，扩展名为 mil便于 MiX识别，目录结构如下。

values-zh-rCN
├── arrays.xml
├── plurals.xml
└── strings.xml

其中 value-zh-rCN 为最上层的文件夹

arrays.xml 内容如下，其本质是 xml 定义的数组（其实 Android 对 xml 的辨别不依赖文件名或者放置位置，而是由 xml 标签来辨别）。

这个文件从2016年的时候就没变过。


&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;

&lt;resources&gt;

&lt;string-array name=&quot;days_long&quot;&gt;

&lt;item&gt;周日&lt;/item&gt;

&lt;item&gt;周一&lt;/item&gt;

&lt;item&gt;周二&lt;/item&gt;

&lt;item&gt;周三&lt;/item&gt;

&lt;item&gt;周四&lt;/item&gt;

&lt;item&gt;周五&lt;/item&gt;

&lt;item&gt;周六&lt;/item&gt;

&lt;/string-array&gt;

&lt;string-array name=&quot;months_short&quot;&gt;

&lt;item&gt;1月&lt;/item&gt;

&lt;item&gt;2月&lt;/item&gt;

&lt;item&gt;3月&lt;/item&gt;

&lt;item&gt;4月&lt;/item&gt;

&lt;item&gt;5月&lt;/item&gt;

&lt;item&gt;6月&lt;/item&gt;

&lt;item&gt;7月&lt;/item&gt;

&lt;item&gt;8月&lt;/item&gt;

&lt;item&gt;9月&lt;/item&gt;

&lt;item&gt;10月&lt;/item&gt;

&lt;item&gt;11月&lt;/item&gt;

&lt;item&gt;12月&lt;/item&gt;

&lt;/string-array&gt;

&lt;string-array name=&quot;units&quot;&gt;

&lt;item&gt;EB&lt;/item&gt;

&lt;item&gt;PB&lt;/item&gt;

&lt;item&gt;TB&lt;/item&gt;

&lt;item&gt;GB&lt;/item&gt;

&lt;item&gt;MB&lt;/item&gt;

&lt;item&gt;KB&lt;/item&gt;

&lt;item&gt;B&lt;/item&gt;

&lt;item&gt;Bytes&lt;/item&gt;

&lt;/string-array&gt;

&lt;/resources&gt;


然后是 plurals.xml，这个文件是定义数量的。不过如同前文所述，其实写不写在这个文件里无所谓。


&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;

&lt;resources&gt;

&lt;plurals name=&quot;num_items&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 个项目&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_folders&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 个文件夹&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_files&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 个文件&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;less_than_one_minute&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;刚刚&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_minutes_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 分钟前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;half_hour_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;半小时前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_hours_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 小时前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_days_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 天前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_weeks_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 周前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_months_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 月前&lt;/item&gt;

&lt;/plurals&gt;

&lt;plurals name=&quot;num_years_ago&quot;&gt;

&lt;item quantity=&quot;other&quot;&gt;%d 年前&lt;/item&gt;

&lt;/plurals&gt;

&lt;/resources&gt;


最后才是真正的重头戏，strings.xml。

本次更新日期为2020/07/09,支持 MiX 6.47.2。

百度网盘1：链接: https://pan.baidu.com/s/1J1_OS-YpXMDW6DlW7z4NJw 提取码: mnun

历史翻译：链接: https://pan.baidu.com/s/1NVo2kwqWqoIhTV8VGbngqA 提取码: dgpr

&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;

&lt;resources&gt;

&lt;string name=&quot;description&quot;&gt;by 萧叶轩&lt;/string&gt;

&lt;string formatted=&quot;false&quot; name=&quot;lollipop_permission_msg&quot;&gt;请选择 %s: %s 来获得权限&lt;/string&gt;

&lt;string formatted=&quot;false&quot; name=&quot;not_enough_free_space&quot;&gt;可用空间不足！&lt;/string&gt;

&lt;string name=&quot;abort&quot;&gt;终止&lt;/string&gt;

&lt;string name=&quot;access_denied&quot;&gt;访问被拒绝&lt;/string&gt;

&lt;string name=&quot;action_bar&quot;&gt;活动栏&lt;/string&gt;

&lt;string name=&quot;action_menu&quot;&gt;活动菜单&lt;/string&gt;

&lt;string name=&quot;add&quot;&gt;添加&lt;/string&gt;

&lt;string name=&quot;add_column&quot;&gt;添加纵行&lt;/string&gt;

&lt;string name=&quot;add_prefix_a&quot;&gt;添加前缀 A&lt;/string&gt;

&lt;string name=&quot;add_storage&quot;&gt;添加&lt;/string&gt;

&lt;string name=&quot;add_suffix_a&quot;&gt;添加后缀 A&lt;/string&gt;

&lt;string name=&quot;add_tab&quot;&gt;添加标签&lt;/string&gt;

&lt;string name=&quot;add_to&quot;&gt;添加到&lt;/string&gt;

&lt;string name=&quot;added_to_queue&quot;&gt;操作添加到队列&lt;/string&gt;

&lt;string name=&quot;advanced_settings&quot;&gt;高级设置&lt;/string&gt;

&lt;string name=&quot;alarm&quot;&gt;闹铃&lt;/string&gt;

&lt;string name=&quot;algorithm&quot;&gt;算法&lt;/string&gt;

&lt;string name=&quot;alias&quot;&gt;别名&lt;/string&gt;

&lt;string name=&quot;all&quot;&gt;全部&lt;/string&gt;

&lt;string name=&quot;alpha&quot;&gt;透明度&lt;/string&gt;

&lt;string name=&quot;alternate&quot;&gt;交叉&lt;/string&gt;

&lt;string name=&quot;analyze&quot;&gt;分析&lt;/string&gt;

&lt;string name=&quot;animation&quot;&gt;动画&lt;/string&gt;

&lt;string name=&quot;app_info&quot;&gt;App 信息&lt;/string&gt;

&lt;string name=&quot;app_name&quot;&gt;Libraries&lt;/string&gt;

&lt;!--   app_name=Codes1，6.29引入，不知道什么鬼，6.33.7改成了Libraries --&gt;

&lt;string name=&quot;app_desc&quot;&gt;文件管理器&lt;/string&gt;

&lt;string name=&quot;append&quot;&gt;追加&lt;/string&gt;

&lt;string name=&quot;app_label&quot;&gt;MiXplorer&lt;/string&gt;

&lt;string name=&quot;apply&quot;&gt;应用&lt;/string&gt;

&lt;string name=&quot;archive&quot;&gt;压缩&lt;/string&gt;

&lt;string name=&quot;archive_folders&quot;&gt;压缩文件夹&lt;/string&gt;

&lt;string name=&quot;archive_split_length&quot;&gt;压缩分卷大小（最小64KB）&lt;/string&gt;

&lt;string name=&quot;archive_to&quot;&gt;压缩到…&lt;/string&gt;

&lt;string name=&quot;archived_x_files&quot;&gt;已压缩 %s&lt;/string&gt;

&lt;string name=&quot;archiving_x_files&quot;&gt;正在压缩 %s&lt;/string&gt;

&lt;string name=&quot;are_you_sure&quot;&gt;您确定吗？&lt;/string&gt;

&lt;string name=&quot;attention&quot;&gt;注意&lt;/string&gt;

&lt;string name=&quot;audio_tracks&quot;&gt;音轨&lt;/string&gt;

&lt;string name=&quot;author&quot;&gt;作者&lt;/string&gt;

&lt;string name=&quot;auto&quot;&gt;自动&lt;/string&gt;

&lt;string name=&quot;auto_complete&quot;&gt;自动完成&lt;/string&gt;

&lt;string name=&quot;auto_hide_ctrls&quot;&gt;自动隐藏控件&lt;/string&gt;

&lt;string name=&quot;auto_increment_number&quot;&gt;自动增量编号&lt;/string&gt;

&lt;string name=&quot;auto_indent&quot;&gt;自动缩进&lt;/string&gt;

&lt;string name=&quot;auto_rename&quot;&gt;自动命名&lt;/string&gt;

&lt;string name=&quot;auto_tasks&quot;&gt;自动任务&lt;/string&gt;

&lt;string name=&quot;auto_tag&quot;&gt;自动标记&lt;/string&gt;

&lt;string name=&quot;auto_update_latest&quot;&gt;已经是最新版本&lt;/string&gt;

&lt;string name=&quot;back&quot;&gt;返回&lt;/string&gt;

&lt;string name=&quot;backed_up_x_files&quot;&gt;已备份 %s&lt;/string&gt;

&lt;string name=&quot;background&quot;&gt;后台&lt;/string&gt;

&lt;string name=&quot;backing_up_x_files&quot;&gt;正在备份 %s&lt;/string&gt;

&lt;string name=&quot;backup&quot;&gt;备份&lt;/string&gt;

&lt;string name=&quot;backward&quot;&gt;后退&lt;/string&gt;

&lt;string name=&quot;between&quot;&gt;两者之间&lt;/string&gt;

&lt;string name=&quot;block_size&quot;&gt;块大小&lt;/string&gt;

&lt;string name=&quot;bookmarks&quot;&gt;书签&lt;/string&gt;

&lt;string name=&quot;busy&quot;&gt;忙碌&lt;/string&gt;

&lt;string name=&quot;by_parents&quot;&gt;按父级排序&lt;/string&gt;

&lt;string name=&quot;cache_hashed_key&quot;&gt;缓存哈希值&lt;/string&gt;

&lt;string name=&quot;cancel&quot;&gt;取消&lt;/string&gt;

&lt;string name=&quot;cannot_get_clipboard&quot;&gt;无法获取剪切板中的内容&lt;/string&gt;

&lt;string name=&quot;capitalize&quot;&gt;首字母大写&lt;/string&gt;

&lt;string name=&quot;cast&quot;&gt;投送&lt;/string&gt;

&lt;string name=&quot;certificate&quot;&gt;证书&lt;/string&gt;

&lt;string name=&quot;chained_name_iv&quot;&gt;链接名称 IV&lt;/string&gt;

&lt;string name=&quot;chars&quot;&gt;字符&lt;/string&gt;

&lt;string name=&quot;chars_count&quot;&gt;%s 个字符&lt;/string&gt;

&lt;string name=&quot;charset&quot;&gt;字符集&lt;/string&gt;

&lt;string name=&quot;check_connection&quot;&gt;请检查网络连接&lt;/string&gt;

&lt;string name=&quot;check_tcp_server&quot;&gt;请检查目标设备的 TCP 服务是否启动&lt;/string&gt;

&lt;string name=&quot;choose&quot;&gt;选择&lt;/string&gt;

&lt;string name=&quot;checksum&quot;&gt;哈希值&lt;/string&gt;

&lt;string name=&quot;chromaprint&quot;&gt;音频指纹&lt;/string&gt;

&lt;!--  这是类似于听歌识曲的东西  --&gt;

&lt;string name=&quot;clear&quot;&gt;清除&lt;/string&gt;

&lt;string name=&quot;clear_lock&quot;&gt;禁用锁定&lt;/string&gt;

&lt;string name=&quot;clear_thumbs_cache&quot;&gt;清空缓存&lt;/string&gt;

&lt;string name=&quot;click_to_see_options_dialog&quot;&gt;点击查看选项&lt;/string&gt;

&lt;string name=&quot;clipboard&quot;&gt;剪贴板&lt;/string&gt;

&lt;string name=&quot;clone_tab&quot;&gt;复制标签&lt;/string&gt;

&lt;string name=&quot;close_left_tabs&quot;&gt;关闭左侧&lt;/string&gt;

&lt;string name=&quot;close_other_tabs&quot;&gt;关闭其他&lt;/string&gt;

&lt;string name=&quot;close_right_tabs&quot;&gt;关闭右侧&lt;/string&gt;

&lt;string name=&quot;close_tab&quot;&gt;关闭标签&lt;/string&gt;

&lt;string name=&quot;clouds&quot;&gt;云盘&lt;/string&gt;

&lt;string name=&quot;color&quot;&gt;颜色&lt;/string&gt;

&lt;string name=&quot;commit_changes&quot;&gt;提交更改&lt;/string&gt;

&lt;string name=&quot;commit_transaction_msg&quot;&gt;确认提交吗?&lt;/string&gt;

&lt;string name=&quot;computing&quot;&gt;正在计算…&lt;/string&gt;

&lt;string name=&quot;computers&quot;&gt;计算机&lt;/string&gt;

&lt;string name=&quot;confirm&quot;&gt;确认&lt;/string&gt;

&lt;string name=&quot;contact&quot;&gt;联系&lt;/string&gt;

&lt;string name=&quot;contains&quot;&gt;包含&lt;/string&gt;

&lt;string name=&quot;contributor&quot;&gt;贡献者&lt;/string&gt;

&lt;string name=&quot;convert&quot;&gt;转换&lt;/string&gt;

&lt;string name=&quot;converted_x_files&quot;&gt;%s 已转换&lt;/string&gt;

&lt;string name=&quot;converting_x_files&quot;&gt;转换 %s&lt;/string&gt;

&lt;string name=&quot;copied_x_files&quot;&gt;已复制 %s&lt;/string&gt;

&lt;string name=&quot;copy&quot;&gt;复制&lt;/string&gt;

&lt;string name=&quot;copy_name&quot;&gt;复制名称&lt;/string&gt;

&lt;string name=&quot;copy_path&quot;&gt;复制路径&lt;/string&gt;

&lt;string name=&quot;copy_to&quot;&gt;复制到…&lt;/string&gt;

&lt;string name=&quot;copying_x_files&quot;&gt;正在复制 %s&lt;/string&gt;

&lt;string name=&quot;corrupted_archive_file&quot;&gt;文件可能已损坏&lt;/string&gt;

&lt;string name=&quot;created&quot;&gt;创建日期&lt;/string&gt;

&lt;string name=&quot;create_section&quot;&gt;分区&lt;/string&gt;

&lt;string name=&quot;create_shortcut&quot;&gt;创建快捷方式&lt;/string&gt;

&lt;string name=&quot;current_folder&quot;&gt;当前文件夹&lt;/string&gt;

&lt;string name=&quot;custom&quot;&gt;自定义&lt;/string&gt;

&lt;string name=&quot;custom_query&quot;&gt;查询&lt;/string&gt;

&lt;string name=&quot;custom_title&quot;&gt;自定义标题&lt;/string&gt;

&lt;string name=&quot;cut&quot;&gt;剪切&lt;/string&gt;

&lt;string name=&quot;database&quot;&gt;数据库&lt;/string&gt;

&lt;string name=&quot;data&quot;&gt;数据&lt;/string&gt;

&lt;string name=&quot;date&quot;&gt;日期&lt;/string&gt;

&lt;string name=&quot;date_after&quot;&gt;结束日期：&lt;/string&gt;

&lt;string name=&quot;date_before&quot;&gt;起始日期：&lt;/string&gt;

&lt;string name=&quot;date_picker&quot;&gt;选择日期&lt;/string&gt;

&lt;string name=&quot;dayly&quot;&gt;每天&lt;/string&gt;

&lt;string name=&quot;decrypt&quot;&gt;解密&lt;/string&gt;

&lt;string name=&quot;decrypted_x_files&quot;&gt;已解密 %s&lt;/string&gt;

&lt;string name=&quot;decrypting_x_files&quot;&gt;正在解密 %s&lt;/string&gt;

&lt;string name=&quot;def&quot;&gt;默认&lt;/string&gt;

&lt;string name=&quot;default_path&quot;&gt;默认路径&lt;/string&gt;

&lt;string name=&quot;delete&quot;&gt;删除&lt;/string&gt;

&lt;string name=&quot;delete_msg&quot;&gt;你确定要删除 %s 吗?&lt;/string&gt;

&lt;string name=&quot;delete_source&quot;&gt;删除源文件&lt;/string&gt;

&lt;string name=&quot;deleted_x_files&quot;&gt;已删除 %s&lt;/string&gt;

&lt;string name=&quot;deleting_x_files&quot;&gt;正在删除 %s&lt;/string&gt;

&lt;string name=&quot;descr&quot;&gt;描述&lt;/string&gt;

&lt;string name=&quot;details&quot;&gt;详细信息&lt;/string&gt;

&lt;string name=&quot;device&quot;&gt;位置&lt;/string&gt;

&lt;string name=&quot;dir_sign&quot;&gt;&amp;lt;dir&gt;&lt;/string&gt;

&lt;string name=&quot;dictionary_size&quot;&gt;目录大小&lt;/string&gt;

&lt;string name=&quot;direct_link&quot;&gt;直链&lt;/string&gt;

&lt;string name=&quot;directory&quot;&gt;目录&lt;/string&gt;

&lt;string name=&quot;done&quot;&gt;完成&lt;/string&gt;

&lt;string name=&quot;dotfile&quot;&gt;点文件&lt;/string&gt;

&lt;string name=&quot;download&quot;&gt;下载&lt;/string&gt;

&lt;string name=&quot;drag_drop&quot;&gt;支持拖拽&lt;/string&gt;

&lt;string name=&quot;drop_x&quot;&gt;拖动 %s 以&lt;/string&gt;

&lt;string name=&quot;dual_panel_landscape&quot;&gt;双排横向面板&lt;/string&gt;

&lt;string name=&quot;duplicates&quot;&gt;查重&lt;/string&gt;

&lt;string name=&quot;ebook_reader&quot;&gt;PDF阅读器&lt;/string&gt;

&lt;string name=&quot;edit&quot;&gt;编辑&lt;/string&gt;

&lt;string name=&quot;edit_tag&quot;&gt;编辑标签&lt;/string&gt;

&lt;string name=&quot;editable&quot;&gt;编辑&lt;/string&gt;

&lt;string name=&quot;editor_code&quot;&gt;代码编辑器&lt;/string&gt;

&lt;string name=&quot;editor_text&quot;&gt;文本编辑器&lt;/string&gt;

&lt;string name=&quot;effective&quot;&gt;已生效&lt;/string&gt;

&lt;string name=&quot;empty&quot;&gt;N/A&lt;/string&gt;

&lt;string name=&quot;empty_date&quot;&gt;N/A&lt;/string&gt;

&lt;!--  database界面有这个，原文是EMPTY，不是很好看  --&gt;

&lt;string name=&quot;email&quot;&gt;邮件&lt;/string&gt;

&lt;string name=&quot;encfs&quot;&gt;EncFS&lt;/string&gt;

&lt;string name=&quot;encrypt&quot;&gt;加密&lt;/string&gt;

&lt;string name=&quot;encrypt_file_names&quot;&gt;加密文件名&lt;/string&gt;

&lt;string name=&quot;encrypted&quot;&gt;加密&lt;/string&gt;

&lt;string name=&quot;encrypted_x_files&quot;&gt;已加密 %s&lt;/string&gt;

&lt;string name=&quot;encrypting_x_files&quot;&gt;正在加密 %s&lt;/string&gt;

 &lt;string name=&quot;encryption&quot;&gt;加密&lt;/string&gt;

&lt;string name=&quot;enclosed_by&quot;&gt;关闭于&lt;/string&gt;

&lt;string name=&quot;enter_command&quot;&gt;输入命令&lt;/string&gt;

&lt;string name=&quot;enter_key&quot;&gt;输入密码&lt;/string&gt;

&lt;string name=&quot;enter_key_path&quot;&gt;输入密钥库路径&lt;/string&gt;

&lt;string name=&quot;enter_key_pass&quot;&gt;输入密钥密码&lt;/string&gt;

&lt;string name=&quot;enter_name&quot;&gt;输入名称&lt;/string&gt;

&lt;string name=&quot;enter_new_key&quot;&gt;输入新密码&lt;/string&gt;

&lt;string name=&quot;enter_path&quot;&gt;输入路径&lt;/string&gt;

&lt;string name=&quot;enter_pass&quot;&gt;输入密码&lt;/string&gt;

&lt;string name=&quot;enter_text&quot;&gt;输入文字&lt;/string&gt;

&lt;string name=&quot;enter_url&quot;&gt;输入URL&lt;/string&gt;

&lt;string name=&quot;equalizer&quot;&gt;均衡器&lt;/string&gt;

&lt;string name=&quot;error&quot;&gt;错误&lt;/string&gt;

&lt;string name=&quot;execute&quot;&gt;执行&lt;/string&gt;

&lt;string name=&quot;exit&quot;&gt;退出&lt;/string&gt;

&lt;string name=&quot;exit_twice&quot;&gt;轻触返回键退出&lt;/string&gt;

&lt;string name=&quot;experimental&quot;&gt;实验的&lt;/string&gt;

&lt;string name=&quot;explore&quot;&gt;浏览&lt;/string&gt;

&lt;string name=&quot;exponent&quot;&gt;说明&lt;/string&gt;

&lt;string name=&quot;export&quot;&gt;导出&lt;/string&gt;

&lt;string name=&quot;extension&quot;&gt;扩展名&lt;/string&gt;

&lt;string name=&quot;extract_data&quot;&gt;解压数据&lt;/string&gt;

&lt;string name=&quot;extract_to&quot;&gt;解压到…&lt;/string&gt;

&lt;string name=&quot;extract&quot;&gt;解压缩&lt;/string&gt;

&lt;string name=&quot;extracted_x_files&quot;&gt;已解压 %s&lt;/string&gt;

&lt;string name=&quot;extracting_x_files&quot;&gt;正在解压 %s&lt;/string&gt;

&lt;string name=&quot;failed&quot;&gt;失败&lt;/string&gt;

&lt;string name=&quot;faq&quot;&gt;FAQ&lt;/string&gt;

&lt;string name=&quot;fast&quot;&gt;Rm -r&lt;/string&gt;

&lt;!--  通过rm命令删除，所以对储存卡及USB设备无效  --&gt;

&lt;string name=&quot;file_contents&quot;&gt;文件内容&lt;/string&gt;

&lt;string name=&quot;file_doc&quot;&gt;Word 文档&lt;/string&gt;

&lt;string name=&quot;file_empty&quot;&gt;空文件&lt;/string&gt;

&lt;string name=&quot;file_exists&quot;&gt;文件已存在&lt;/string&gt;

&lt;string name=&quot;file_operation&quot;&gt;文件操作&lt;/string&gt;

&lt;string name=&quot;file_pdf&quot;&gt;Adobe PDF&lt;/string&gt;

&lt;string name=&quot;file_sheet&quot;&gt;Excel 表格&lt;/string&gt;

&lt;string name=&quot;file_slide&quot;&gt;PPt 幻灯片&lt;/string&gt;

&lt;string name=&quot;file_text&quot;&gt;Text 纯文本&lt;/string&gt;

&lt;string name=&quot;filename&quot;&gt;文件名&lt;/string&gt;

&lt;string name=&quot;files&quot;&gt;文件&lt;/string&gt;

&lt;string name=&quot;filter&quot;&gt;筛选&lt;/string&gt;

&lt;string name=&quot;find&quot;&gt;查找&lt;/string&gt;

&lt;string name=&quot;fixed_drawer&quot;&gt;固定横向抽屉&lt;/string&gt;

&lt;string name=&quot;folder&quot;&gt;文件夹&lt;/string&gt;

&lt;string name=&quot;folder_exists&quot;&gt;文件夹已存在&lt;/string&gt;

&lt;string name=&quot;folders_first&quot;&gt;文件夹优先&lt;/string&gt;

&lt;string name=&quot;font_size&quot;&gt;字体大小&lt;/string&gt;

&lt;string name=&quot;font_viewer&quot;&gt;字体查看器&lt;/string&gt;

&lt;string name=&quot;forward&quot;&gt;前进&lt;/string&gt;

&lt;string name=&quot;free&quot;&gt;剩余&lt;/string&gt;

&lt;string name=&quot;free_libs&quot;&gt;开源软件库&lt;/string&gt;

&lt;string name=&quot;from&quot;&gt;从&lt;/string&gt;

&lt;string name=&quot;from_x_tabs&quot;&gt;从标签 %s 选择&lt;/string&gt;

&lt;string name=&quot;ftp_server&quot;&gt;FTP 服务器&lt;/string&gt;

&lt;string name=&quot;full_name&quot;&gt;全名&lt;/string&gt;

&lt;string name=&quot;fullscreen&quot;&gt;全屏&lt;/string&gt;

&lt;string name=&quot;generate_thumbnails&quot;&gt;生成缩略图&lt;/string&gt;

&lt;string name=&quot;glob&quot;&gt;展开通配符&lt;/string&gt;

&lt;string name=&quot;global&quot;&gt;全局&lt;/string&gt;

&lt;string name=&quot;global_search_hint&quot;&gt;输入搜索关键词&lt;/string&gt;

&lt;string name=&quot;go&quot;&gt;开始&lt;/string&gt;

&lt;string name=&quot;go_to&quot;&gt;转到&lt;/string&gt;

&lt;string name=&quot;go_to_location&quot;&gt;转到位置&lt;/string&gt;

&lt;string name=&quot;half_day&quot;&gt;每半天&lt;/string&gt;

&lt;string name=&quot;half_hour&quot;&gt;每半小时&lt;/string&gt;

&lt;string name=&quot;hash_types_descr&quot;&gt;点按即可复制到剪贴板或长按以与剪贴板中的哈希值进行比较。&lt;/string&gt;

&lt;string name=&quot;hex_viewer&quot;&gt;Hex查看器&lt;/string&gt;

&lt;string name=&quot;hidden&quot;&gt;隐藏&lt;/string&gt;

&lt;string name=&quot;hide&quot;&gt;隐藏&lt;/string&gt;

&lt;string name=&quot;highlight_as&quot;&gt;语法高亮&lt;/string&gt;

&lt;string name=&quot;history&quot;&gt;历史记录&lt;/string&gt;

&lt;string name=&quot;home&quot;&gt;首页&lt;/string&gt;

&lt;string name=&quot;home_screen&quot;&gt;主界面&lt;/string&gt;

&lt;string name=&quot;hour&quot;&gt;每小时&lt;/string&gt;

&lt;string name=&quot;html_viewer&quot;&gt;HTML查看器&lt;/string&gt;

&lt;string name=&quot;if_not_equal&quot;&gt;&quot;如果他们不相等&quot;&lt;/string&gt;

&lt;string name=&quot;http_server&quot;&gt;HTTP服务器&lt;/string&gt;

&lt;string name=&quot;ignore_col_headers&quot;&gt;忽略纵行标题&lt;/string&gt;

&lt;string name=&quot;image_viewer&quot;&gt;图片查看器&lt;/string&gt;

&lt;string name=&quot;import1&quot;&gt;导入&lt;/string&gt;

&lt;string name=&quot;increment_num_format&quot;&gt;增加数字格式&lt;/string&gt;

&lt;string name=&quot;install&quot;&gt;安装&lt;/string&gt;

&lt;string name=&quot;insert&quot;&gt;插入&lt;/string&gt;

&lt;string name=&quot;insert_color&quot;&gt;Hex颜色&lt;/string&gt;

&lt;!--  插入HEX颜色，很奇葩的功能，可能是给写html的人用的，那应该再加一个叫插入unicode码 --&gt;

&lt;string name=&quot;install_update_addon&quot;&gt;请安装或更新插件: &lt;/string&gt;

&lt;string name=&quot;installation_completed&quot;&gt;安装完成&lt;/string&gt;

&lt;string name=&quot;installation_completed_desc&quot; formatted=&quot;false&quot;&gt;已安装 %d/%d&lt;/string&gt;

&lt;string name=&quot;installed_version&quot;&gt;安装版本&lt;/string&gt;

&lt;string name=&quot;installing_x&quot;&gt;正在安装 %s&lt;/string&gt;

&lt;string name=&quot;internal_storage&quot;&gt;内部储存&lt;/string&gt;

&lt;string name=&quot;interval&quot;&gt;间隔&lt;/string&gt;

&lt;string name=&quot;inverse&quot;&gt;反选&lt;/string&gt;

&lt;string name=&quot;jump_to&quot;&gt;跳转到&lt;/string&gt;

&lt;string name=&quot;keep_both&quot;&gt;全部保留&lt;/string&gt;

&lt;string name=&quot;keep_both_desc&quot;&gt;新文件将被重命名&lt;/string&gt;

&lt;string name=&quot;keywords&quot;&gt;关键词&lt;/string&gt;

&lt;string name=&quot;key&quot;&gt;钥匙&lt;/string&gt;

&lt;!--  WTF,这个Key孤零零的怎么翻译。。。。 --&gt;

&lt;string name=&quot;key_bar&quot;&gt;按键栏&lt;/string&gt;

&lt;string name=&quot;key_not_matched&quot;&gt;密钥不匹配&lt;/string&gt;

&lt;string name=&quot;key_size&quot;&gt;密匙长度&lt;/string&gt;

&lt;string name=&quot;key_type&quot;&gt;密钥类型&lt;/string&gt;

&lt;string name=&quot;keystore&quot;&gt;密钥库&lt;/string&gt;

&lt;string name=&quot;label&quot;&gt;标签&lt;/string&gt;

&lt;string name=&quot;launcher_label&quot;&gt;MiX&lt;/string&gt;

&lt;string name=&quot;letters&quot;&gt;字母&lt;/string&gt;

&lt;string name=&quot;level_fast&quot;&gt;快&lt;/string&gt;

&lt;string name=&quot;level_fastest&quot;&gt;最快&lt;/string&gt;

&lt;string name=&quot;level_maximum&quot;&gt;最大&lt;/string&gt;

&lt;string name=&quot;level_normal&quot;&gt;标准&lt;/string&gt;

&lt;string name=&quot;level_store&quot;&gt;存储&lt;/string&gt;

&lt;string name=&quot;level_ultra&quot;&gt;极限&lt;/string&gt;

&lt;string name=&quot;line_break&quot;&gt;换行符&lt;/string&gt;

&lt;string name=&quot;line_break_cr&quot;&gt;Mac OS (\\r)&lt;/string&gt;

&lt;string name=&quot;line_break_crlf&quot;&gt;Windows (\\r\\n)&lt;/string&gt;

&lt;string name=&quot;line_break_lf&quot;&gt;Linux,Unix (\\n)&lt;/string&gt;

&lt;string name=&quot;line_numbers&quot;&gt;行号&lt;/string&gt;

&lt;string name=&quot;line_wrap&quot;&gt;换行&lt;/string&gt;

&lt;string name=&quot;lines&quot;&gt;行数&lt;/string&gt;

&lt;string name=&quot;linked_to&quot;&gt;链接到&lt;/string&gt;

&lt;string name=&quot;live_counting&quot;&gt;实时计数&lt;/string&gt;

&lt;string name=&quot;locale&quot;&gt;定位&lt;/string&gt;

&lt;string name=&quot;lock&quot;&gt;锁定&lt;/string&gt;

&lt;string name=&quot;log_out&quot;&gt;注销&lt;/string&gt;

&lt;string name=&quot;login&quot;&gt;登录&lt;/string&gt;

&lt;string name=&quot;login_prompt&quot;&gt;请登录您的帐户。&lt;/string&gt;

&lt;string name=&quot;lollipop_permission_msg&quot; formatted=&quot;false&quot;&gt;请选择 %s: %s 以获得权限&lt;/string&gt;

&lt;string name=&quot;long_press_to_expand&quot;&gt;长按折叠/展开&lt;/string&gt;

&lt;string name=&quot;loop&quot;&gt;循环&lt;/string&gt;

&lt;string name=&quot;lowercase&quot;&gt;转小写&lt;/string&gt;

&lt;string name=&quot;magic_packet&quot;&gt;魔术包（网络唤醒）&lt;/string&gt;

&lt;!--  可以来唤醒休眠的电脑，不过需要网卡支持 --&gt;

&lt;string name=&quot;main_menu&quot;&gt;主菜单&lt;/string&gt;

&lt;string name=&quot;manifest&quot;&gt;Manifest&lt;/string&gt;

&lt;!--  Android Manifest，同样是奇葩的功能，不解释  --&gt;

&lt;string name=&quot;match_case&quot;&gt;区分大小写&lt;/string&gt;

&lt;string name=&quot;matched&quot;&gt;匹配&lt;/string&gt;

&lt;string name=&quot;max&quot;&gt;最大&lt;/string&gt;

&lt;string name=&quot;media&quot;&gt;媒体&lt;/string&gt;

&lt;string name=&quot;media_all&quot;&gt;所有文件&lt;/string&gt;

&lt;string name=&quot;media_apk&quot;&gt;安装包&lt;/string&gt;

&lt;string name=&quot;media_app&quot;&gt;应用&lt;/string&gt;

&lt;string name=&quot;media_archive&quot;&gt;压缩包&lt;/string&gt;

&lt;string name=&quot;media_audio&quot;&gt;音频&lt;/string&gt;

&lt;string name=&quot;media_document&quot;&gt;文档&lt;/string&gt;

&lt;string name=&quot;media_folders&quot;&gt;所有文件夹&lt;/string&gt;

&lt;string name=&quot;media_image&quot;&gt;图片&lt;/string&gt;

&lt;string name=&quot;media_misc&quot;&gt;杂项&lt;/string&gt;

&lt;string name=&quot;media_player&quot;&gt;媒体播放器&lt;/string&gt;

&lt;string name=&quot;media_system_app&quot;&gt;系统应用&lt;/string&gt;

&lt;string name=&quot;media_user_app&quot;&gt;用户应用&lt;/string&gt;

&lt;string name=&quot;media_video&quot;&gt;视频&lt;/string&gt;

&lt;string name=&quot;menu&quot;&gt;菜单&lt;/string&gt;

&lt;string name=&quot;merge_x_with&quot;&gt;合并：%s&lt;/string&gt;

&lt;string name=&quot;meta_album&quot;&gt;专辑名称&lt;/string&gt;

&lt;string name=&quot;meta_album_artist&quot;&gt;作曲家&lt;/string&gt;

&lt;string name=&quot;meta_artist&quot;&gt;艺术家&lt;/string&gt;

&lt;string name=&quot;meta_author_url&quot;&gt;作者网站&lt;/string&gt;

&lt;string name=&quot;meta_auto_rename&quot;&gt;重命名文件&lt;/string&gt;

&lt;!--  这里是按照mix的规则自动重命名文件，适合文件名不统一的时候用，其实没什么卵用  --&gt;

&lt;string name=&quot;meta_comment&quot;&gt;注释&lt;/string&gt;

&lt;string name=&quot;meta_composer&quot;&gt;作曲者&lt;/string&gt;

&lt;string name=&quot;meta_copyright&quot;&gt;版权信息&lt;/string&gt;

&lt;string name=&quot;meta_custom_tag&quot;&gt;自定义标签&lt;/string&gt;

&lt;string name=&quot;meta_director&quot;&gt;指挥者&lt;/string&gt;

&lt;string name=&quot;meta_disc&quot;&gt;CD 编号&lt;/string&gt;

&lt;!--

&lt;string name=&quot;meta_disc&quot;&gt;Disk&lt;/string&gt;

--&gt;

&lt;string name=&quot;meta_dual_mono&quot;&gt;双单声道&lt;/string&gt;

&lt;string name=&quot;meta_encoder&quot;&gt;编码者&lt;/string&gt;

&lt;string name=&quot;meta_episode&quot;&gt;章节&lt;/string&gt;

&lt;!--

&lt;string name=&quot;meta_episode&quot;&gt;Episode&lt;/string&gt;

--&gt;

&lt;!--  不知道啥意思，随便翻译的  --&gt;

&lt;string name=&quot;meta_genre&quot;&gt;流派&lt;/string&gt;

&lt;string name=&quot;meta_imprint&quot;&gt;印记&lt;/string&gt;

&lt;string name=&quot;meta_itunes&quot;&gt;iTunes&lt;/string&gt;

&lt;string name=&quot;meta_joint_stereo&quot;&gt; Joint Stereo&lt;/string&gt;

&lt;!--  加空格为了显示的时候能换行,不然这个词会被切成两行  --&gt;

&lt;string name=&quot;meta_length&quot;&gt;时长&lt;/string&gt;

&lt;string name=&quot;meta_lyrics&quot;&gt;歌词&lt;/string&gt;

&lt;string name=&quot;meta_mono&quot;&gt;单声道&lt;/string&gt;

&lt;string name=&quot;meta_publisher&quot;&gt;出版商&lt;/string&gt;

&lt;string name=&quot;meta_remove_covers&quot;&gt;移除封面&lt;/string&gt;

&lt;string name=&quot;meta_review&quot;&gt;评论&lt;/string&gt;

&lt;string name=&quot;meta_rights&quot;&gt;权利&lt;/string&gt;

&lt;string name=&quot;meta_season&quot;&gt;季节&lt;/string&gt;

&lt;!--   这里是歌曲的tag信息，不过没见过有season这个ID --&gt;

&lt;string name=&quot;meta_source&quot;&gt;来源&lt;/string&gt;

&lt;string name=&quot;meta_stereo&quot;&gt;Stereo&lt;/string&gt;

&lt;!--  同上面JS  --&gt;

&lt;string name=&quot;meta_subject&quot;&gt;主体&lt;/string&gt;

&lt;string name=&quot;meta_title&quot;&gt;标题&lt;/string&gt;

&lt;string name=&quot;meta_track&quot;&gt;音轨号&lt;/string&gt;

&lt;string name=&quot;meta_version&quot;&gt;版本&lt;/string&gt;

&lt;string name=&quot;meta_writer&quot;&gt;编码者&lt;/string&gt;

&lt;string name=&quot;meta_year&quot;&gt;年份&lt;/string&gt;

&lt;string name=&quot;metadata&quot;&gt;元数据&lt;/string&gt;

&lt;string name=&quot;min&quot;&gt;最小&lt;/string&gt;

&lt;string name=&quot;min_android&quot;&gt;最小 SDK&lt;/string&gt;

&lt;string name=&quot;mix_task&quot;&gt;合并任务&lt;/string&gt;

&lt;string name=&quot;modified&quot;&gt;修改&lt;/string&gt;

&lt;string name=&quot;modify&quot;&gt;修改&lt;/string&gt;

&lt;string name=&quot;modules&quot;&gt;组件&lt;/string&gt;

&lt;string name=&quot;monthly&quot;&gt;每月&lt;/string&gt;

&lt;string name=&quot;more&quot;&gt;更多&lt;/string&gt;

&lt;string name=&quot;more_details&quot;&gt;详细&lt;/string&gt;

&lt;string name=&quot;mount_point&quot;&gt;路径&lt;/string&gt;

&lt;string name=&quot;move&quot;&gt;移动&lt;/string&gt;

&lt;string name=&quot;move_to&quot;&gt;移动到…&lt;/string&gt;

&lt;string name=&quot;move_to_left&quot;&gt;向左移动&lt;/string&gt;

&lt;string name=&quot;move_to_right&quot;&gt;向右移动&lt;/string&gt;

&lt;string name=&quot;moved_x_files&quot;&gt;已移动 %s&lt;/string&gt;

&lt;string name=&quot;moving_x_files&quot;&gt;正在移动 %s&lt;/string&gt;

&lt;string name=&quot;name&quot;&gt;名称&lt;/string&gt;

&lt;string name=&quot;name_display&quot;&gt;显示名称&lt;/string&gt;

&lt;string name=&quot;navbar_menu&quot;&gt;导航菜单&lt;/string&gt;

&lt;string name=&quot;new_file_name&quot;&gt;新建文件&lt;/string&gt;

&lt;string name=&quot;new_folder_name&quot;&gt;新建文件夹&lt;/string&gt;

&lt;string name=&quot;new_name&quot;&gt;新名称&lt;/string&gt;

&lt;string name=&quot;new_name_desc&quot;&gt;设置一个自定义名称&lt;/string&gt;

&lt;string name=&quot;new_table&quot;&gt;新表格&lt;/string&gt;

&lt;string name=&quot;new_task&quot;&gt;新建任务&lt;/string&gt;

&lt;string name=&quot;new1&quot;&gt;新建&lt;/string&gt;

&lt;string name=&quot;next&quot;&gt;下一个&lt;/string&gt;

&lt;string name=&quot;night_mode&quot;&gt;夜间模式&lt;/string&gt;

&lt;string name=&quot;once&quot;&gt;一次&lt;/string&gt;

&lt;string name=&quot;no&quot;&gt;否&lt;/string&gt;

&lt;string name=&quot;no_item&quot;&gt;无项目&lt;/string&gt;

&lt;string name=&quot;no_keyboard&quot;&gt;无键盘&lt;/string&gt;

&lt;string name=&quot;none&quot;&gt;清除&lt;/string&gt;

&lt;string name=&quot;not_archive_file&quot;&gt;压缩文件格式未知！&lt;/string&gt;

&lt;string name=&quot;not_enough_memory&quot;&gt;没有足够的内存！&lt;/string&gt;

&lt;string name=&quot;not_exists&quot;&gt;不存在！&lt;/string&gt;

&lt;string name=&quot;not_found&quot;&gt;找不到！&lt;/string&gt;

&lt;string name=&quot;not_matched&quot;&gt;不匹配！&lt;/string&gt;

&lt;string name=&quot;not_possible&quot;&gt;不可能！&lt;/string&gt;

&lt;string name=&quot;not_specified&quot;&gt;尚未指定&lt;/string&gt;

&lt;string name=&quot;not_started&quot;&gt;尚未开始&lt;/string&gt;

&lt;string name=&quot;not_supported&quot;&gt;尚不支持！&lt;/string&gt;

&lt;string name=&quot;notification&quot;&gt;通知&lt;/string&gt;

&lt;string name=&quot;now&quot;&gt;立即&lt;/string&gt;

&lt;string name=&quot;null&quot;&gt;空白&lt;/string&gt;

&lt;string name=&quot;obex_bluetooth&quot;&gt;OBEX蓝牙&lt;/string&gt;

&lt;string name=&quot;oid&quot;&gt;OID&lt;/string&gt;

&lt;string name=&quot;ok&quot;&gt;确定&lt;/string&gt;

&lt;string name=&quot;on_exit&quot;&gt;退出时&lt;/string&gt;

&lt;string name=&quot;ongoing&quot;&gt;进行中&lt;/string&gt;

&lt;string name=&quot;only_files&quot;&gt;仅文件&lt;/string&gt;

&lt;string name=&quot;open&quot;&gt;打开&lt;/string&gt;

&lt;string name=&quot;open_app&quot;&gt;打开应用&lt;/string&gt;

&lt;string name=&quot;open_as&quot;&gt;打开为&lt;/string&gt;

&lt;string name=&quot;open_in_new_tab&quot;&gt;新标签&lt;/string&gt;

&lt;string name=&quot;open_with&quot;&gt;打开到&lt;/string&gt;

&lt;string name=&quot;operation_aborted&quot;&gt;操作终止&lt;/string&gt;

&lt;string name=&quot;operation_added_to_list&quot;&gt;已添加到任务列表。&lt;/string&gt;

&lt;string name=&quot;operation_failed&quot;&gt;操作失败&lt;/string&gt;

&lt;string name=&quot;operation_finished&quot;&gt;操作已完成&lt;/string&gt;

&lt;string name=&quot;operation_running&quot;&gt;操作正在运行&lt;/string&gt;

&lt;string name=&quot;optional&quot;&gt;自选&lt;/string&gt;

&lt;string name=&quot;options&quot;&gt;设定&lt;/string&gt;

&lt;string name=&quot;orientation_by&quot;&gt;旋转&lt;/string&gt;

&lt;string name=&quot;origin&quot;&gt;来源&lt;/string&gt;

&lt;string name=&quot;package_name&quot;&gt;包名&lt;/string&gt;

&lt;string name=&quot;password&quot;&gt;密码&lt;/string&gt;

&lt;string name=&quot;paste&quot;&gt;粘贴&lt;/string&gt;

&lt;string name=&quot;path&quot;&gt;路径&lt;/string&gt;

&lt;string name=&quot;pattern&quot;&gt;布局&lt;/string&gt;

&lt;string name=&quot;pause&quot;&gt;暂停&lt;/string&gt;

&lt;string name=&quot;paused&quot;&gt;已暂停&lt;/string&gt;

&lt;string name=&quot;perm_exec&quot;&gt;执行&lt;/string&gt;

&lt;string name=&quot;perm_gid&quot;&gt;GID&lt;/string&gt;

&lt;string name=&quot;perm_group&quot;&gt;群组&lt;/string&gt;

&lt;string name=&quot;perm_others&quot;&gt;其他&lt;/string&gt;

&lt;string name=&quot;perm_owner&quot;&gt;所有&lt;/string&gt;

&lt;string name=&quot;perm_read&quot;&gt;可读&lt;/string&gt;

&lt;string name=&quot;perm_sticky&quot;&gt;粘滞位&lt;/string&gt;

&lt;string name=&quot;perm_uid&quot;&gt;UID&lt;/string&gt;

&lt;string name=&quot;perm_write&quot;&gt;可写&lt;/string&gt;

&lt;string name=&quot;permanent&quot;&gt;普通&lt;/string&gt;

&lt;string name=&quot;permission_denied&quot;&gt;权限申请被拒绝&lt;/string&gt;

&lt;string name=&quot;permissions&quot;&gt;权限&lt;/string&gt;

&lt;string name=&quot;pick&quot;&gt;拾取&lt;/string&gt;

&lt;string name=&quot;pin&quot;&gt;固定&lt;/string&gt;

&lt;string name=&quot;pinch_to_zoom&quot;&gt;捏合缩放&lt;/string&gt;

&lt;string name=&quot;play&quot;&gt;播放&lt;/string&gt;

&lt;string name=&quot;play_store&quot;&gt;应用商店&lt;/string&gt;

&lt;string name=&quot;playlist&quot;&gt;播放列表&lt;/string&gt;

&lt;string name=&quot;port&quot;&gt;端口&lt;/string&gt;

&lt;string name=&quot;prefix&quot;&gt;置于首部&lt;/string&gt;

&lt;string name=&quot;preview&quot;&gt;预览&lt;/string&gt;

&lt;string name=&quot;previous&quot;&gt;上一个&lt;/string&gt;

&lt;string name=&quot;print&quot;&gt;打印&lt;/string&gt;

&lt;string name=&quot;privacy_policy&quot;&gt;隐私政策&lt;/string&gt;

&lt;string name=&quot;privacy_policy_descr&quot;&gt;点击确定代表您同意 %s&lt;/string&gt;

&lt;string name=&quot;producer&quot;&gt;制片人&lt;/string&gt;

&lt;string name=&quot;properties&quot;&gt;属性&lt;/string&gt;

&lt;string name=&quot;publicated&quot;&gt;发行日期&lt;/string&gt;

&lt;string name=&quot;public_key&quot;&gt;公钥&lt;/string&gt;

&lt;string name=&quot;public_link&quot;&gt;公开链接&lt;/string&gt;

&lt;string name=&quot;quarter&quot;&gt;每十五分钟&lt;/string&gt;

&lt;!--  看到quarter很懵，十五分钟是quarter，二十五分钱也是，四分之一的东西都是  --&gt;

&lt;string name=&quot;queued&quot;&gt;排队中&lt;/string&gt;

&lt;string name=&quot;random&quot;&gt;随机&lt;/string&gt;

&lt;string name=&quot;read_only&quot;&gt;只读&lt;/string&gt;

&lt;string name=&quot;receive&quot;&gt;接收&lt;/string&gt;

&lt;string name=&quot;recursive&quot;&gt;递归&lt;/string&gt;

&lt;string name=&quot;recent_files&quot;&gt;最近文件&lt;/string&gt;

&lt;string name=&quot;redo&quot;&gt;重做&lt;/string&gt;

&lt;string name=&quot;redundants&quot;&gt;冗余&lt;/string&gt;

&lt;string name=&quot;reenter&quot;&gt;重新输入&lt;/string&gt;

&lt;string name=&quot;refresh&quot;&gt;刷新&lt;/string&gt;

&lt;string name=&quot;refresh_media_store&quot;&gt;刷新缓存&lt;/string&gt;

&lt;string name=&quot;regex&quot;&gt;正则表达式&lt;/string&gt;

&lt;string name=&quot;remember&quot;&gt;记住&lt;/string&gt;

&lt;string name=&quot;remnants&quot;&gt;应用残留&lt;/string&gt;

&lt;string name=&quot;remount_as&quot;&gt;重载为 %s&lt;/string&gt;

&lt;string name=&quot;remove&quot;&gt;移除&lt;/string&gt;

&lt;string name=&quot;remove_all&quot;&gt;清空&lt;/string&gt;

&lt;string name=&quot;remove_chars&quot;&gt;删除字符&lt;/string&gt;

&lt;string name=&quot;remove_extension&quot;&gt;删除扩展名&lt;/string&gt;

&lt;string name=&quot;rename&quot;&gt;重命名&lt;/string&gt;

&lt;string name=&quot;renamed_x_files&quot;&gt;已重新命名 %s&lt;/string&gt;

&lt;string name=&quot;renaming_x_files&quot;&gt;正在重新命名 %s&lt;/string&gt;

&lt;string name=&quot;repair&quot;&gt;修复&lt;/string&gt;

&lt;string name=&quot;replace&quot;&gt;替换&lt;/string&gt;

&lt;string name=&quot;replace_a_b&quot;&gt;用 A 替换 B&lt;/string&gt;

&lt;string name=&quot;replace_all&quot;&gt;全部替换&lt;/string&gt;

&lt;string name=&quot;replace_modified&quot;&gt;不一致时替换&lt;/string&gt;

&lt;string name=&quot;replace_modified&quot;&gt;还原修改&lt;/string&gt;

&lt;string name=&quot;replace_x_with&quot;&gt;替换：%s&lt;/string&gt;

&lt;string name=&quot;reset&quot;&gt;重置 %s&lt;/string&gt;

&lt;string name=&quot;reset_defaults&quot;&gt;重置&lt;/string&gt;

&lt;!--

&lt;string name=&quot;reset_defaults&quot;&gt;设置为默认&lt;/string&gt;

--&gt;

&lt;string name=&quot;reset_tabs&quot;&gt;重置标签&lt;/string&gt;

&lt;string name=&quot;restore&quot;&gt;恢复&lt;/string&gt;

&lt;string name=&quot;restored_x_files&quot;&gt;已恢复 %s&lt;/string&gt;

&lt;string name=&quot;restoring_x_files&quot;&gt;正在恢复 %s&lt;/string&gt;

&lt;string name=&quot;resume&quot;&gt;继续&lt;/string&gt;

&lt;string name=&quot;resume_desc&quot;&gt;继续复制当前文件。&lt;/string&gt;

&lt;string name=&quot;resume_on_start&quot;&gt;保存进度&lt;/string&gt;

&lt;string name=&quot;reverse_list&quot;&gt;反转列表&lt;/string&gt;

&lt;string name=&quot;rewrite&quot;&gt;重写&lt;/string&gt;

&lt;string name=&quot;ringtone&quot;&gt;铃声&lt;/string&gt;

&lt;string name=&quot;root&quot;&gt;根目录&lt;/string&gt;

&lt;string name=&quot;rotate&quot;&gt;旋转&lt;/string&gt;

&lt;string name=&quot;running&quot;&gt;正在运行&lt;/string&gt;

&lt;string name=&quot;same_type&quot;&gt;同类型&lt;/string&gt;

&lt;string name=&quot;save&quot;&gt;保存&lt;/string&gt;

&lt;string name=&quot;save_as&quot;&gt;另存为&lt;/string&gt;

&lt;string name=&quot;save_in_temp&quot;&gt;分享到文件&lt;/string&gt;

&lt;!--

&lt;string name=&quot;save_in_temp&quot;&gt;保存在临时文件夹&lt;/string&gt;

--&gt;

&lt;string name=&quot;save_msg&quot;&gt;你想要保存该文件吗？&lt;/string&gt;

&lt;string name=&quot;save_tabs&quot;&gt;保存标签&lt;/string&gt;

&lt;string name=&quot;saving&quot;&gt;保存到…&lt;/string&gt;

&lt;string name=&quot;scan&quot;&gt;扫描&lt;/string&gt;

&lt;string name=&quot;scheme_not_valid&quot;&gt;URI 方案无效。&lt;/string&gt;

&lt;string name=&quot;scroll_alphabet&quot;&gt;ABCDEFGHIJKLMNOPQRSTUVWXYZ&lt;/string&gt;

&lt;string name=&quot;sd_card&quot;&gt;SD Card&lt;/string&gt;

&lt;string name=&quot;search&quot;&gt;搜索&lt;/string&gt;

&lt;string name=&quot;search_local&quot;&gt;本地搜索&lt;/string&gt;

&lt;string name=&quot;search_recursively&quot;&gt;搜索&lt;/string&gt;

&lt;string name=&quot;sections&quot;&gt;按字母分组&lt;/string&gt;

&lt;string name=&quot;secure&quot;&gt;安全&lt;/string&gt;

&lt;string name=&quot;select&quot;&gt;选择&lt;/string&gt;

&lt;string name=&quot;select_all&quot;&gt;全选&lt;/string&gt;

&lt;string name=&quot;send&quot;&gt;发送&lt;/string&gt;

&lt;string name=&quot;send_log&quot;&gt;发送日志&lt;/string&gt;

&lt;string name=&quot;sensor&quot;&gt;传感器&lt;/string&gt;

&lt;string name=&quot;separator&quot;&gt;分离器&lt;/string&gt;

&lt;string name=&quot;serial_number&quot;&gt;序列号&lt;/string&gt;

&lt;string name=&quot;separate_folder&quot;&gt;独立文件夹&lt;/string&gt;

&lt;string name=&quot;separate_with&quot;&gt;分离&lt;/string&gt;

&lt;string name=&quot;send_to&quot;&gt;发送到&lt;/string&gt;

&lt;string name=&quot;server_exists_prompt&quot;&gt;该地址已被占用&lt;/string&gt;

&lt;string name=&quot;servers&quot;&gt;服务器&lt;/string&gt;

&lt;string name=&quot;set_as&quot;&gt;设为&lt;/string&gt;

&lt;string name=&quot;set_as_default&quot;&gt;设为默认&lt;/string&gt;

&lt;string name=&quot;set_as_home&quot;&gt;设为首页&lt;/string&gt;

&lt;string name=&quot;set_as_wallpaper&quot;&gt;设为壁纸&lt;/string&gt;

&lt;string name=&quot;settings&quot;&gt;设置&lt;/string&gt;

&lt;string name=&quot;settings_about&quot;&gt;关于&lt;/string&gt;

&lt;string name=&quot;settings_add_on&quot;&gt;插件&lt;/string&gt;

&lt;string name=&quot;settings_allow_root&quot;&gt;Root&lt;/string&gt;

&lt;string name=&quot;settings_animations&quot;&gt;动画&lt;/string&gt;

&lt;string name=&quot;settings_auto_remount&quot;&gt;自动挂载&lt;/string&gt;

&lt;string name=&quot;settings_bottom_bar&quot;&gt;底栏&lt;/string&gt;

&lt;string name=&quot;settings_buttons&quot;&gt;按钮&lt;/string&gt;

&lt;string name=&quot;settings_cache_thumbs&quot;&gt;缩略图&lt;/string&gt;

&lt;string name=&quot;settings_custom_datetime&quot;&gt;日期格式&lt;/string&gt;

&lt;string name=&quot;settings_can_undo&quot;&gt;撤销&lt;/string&gt;

&lt;string name=&quot;settings_custom_otg&quot;&gt;OTG&lt;/string&gt;

&lt;string name=&quot;settings_draw_tab_close&quot;&gt;标签关闭&lt;/string&gt;

&lt;string name=&quot;settings_enable_logging&quot;&gt;日志&lt;/string&gt;

&lt;string name=&quot;settings_folder_preview&quot;&gt;文件夹预览&lt;/string&gt;

&lt;string name=&quot;settings_full_wake_lock&quot;&gt;唤醒锁&lt;/string&gt;

&lt;string name=&quot;settings_highlight_visited&quot;&gt;高亮文件夹&lt;/string&gt;

&lt;string name=&quot;settings_keep_last_modified&quot;&gt;上次修改时间&lt;/string&gt;

&lt;string name=&quot;settings_localization&quot;&gt;语言&lt;/string&gt;

&lt;string name=&quot;settings_merge_tasks&quot;&gt;合并任务&lt;/string&gt;

&lt;string name=&quot;settings_open_archive&quot;&gt;打开存档&lt;/string&gt;

&lt;string name=&quot;settings_more&quot;&gt;设置&lt;/string&gt;

&lt;string name=&quot;settings_select_by_icon&quot;&gt;选择文件&lt;/string&gt;

&lt;string name=&quot;settings_show_breadcrumb&quot;&gt;地址栏&lt;/string&gt;

&lt;string name=&quot;settings_show_tab_bar&quot;&gt;标签栏&lt;/string&gt;

&lt;string name=&quot;settings_show_toast&quot;&gt;显示 Toast 消息&lt;/string&gt;

&lt;string name=&quot;settings_show_tool_bar&quot;&gt;工具栏&lt;/string&gt;

&lt;string name=&quot;settings_skins&quot;&gt;皮肤&lt;/string&gt;

&lt;string name=&quot;settings_split_action_bar&quot;&gt;分行操作栏&lt;/string&gt;

&lt;string name=&quot;settings_startup_lock&quot;&gt;启动锁&lt;/string&gt;

&lt;string name=&quot;settings_static_enc_key&quot;&gt;静态加密密钥&lt;/string&gt;

&lt;string name=&quot;settings_swipe_new_tab&quot;&gt;滑动标签&lt;/string&gt;

&lt;string name=&quot;settings_tap_execute&quot;&gt;单击执行&lt;/string&gt;

&lt;string name=&quot;settings_update_media_store&quot;&gt;媒体存储&lt;/string&gt;

&lt;string name=&quot;settings_updates&quot;&gt;更新&lt;/string&gt;

&lt;string name=&quot;share&quot;&gt;分享&lt;/string&gt;

&lt;string name=&quot;share_local_link&quot;&gt;HTTP服务器&lt;/string&gt;

&lt;!-- 我第一眼看这个功能还以为是使用 file:// 这个协议，结果却打开了 HTTP 服务器，于是就这么翻译了

&lt;string name=&quot;share_local_link&quot;&gt;分享本地链接&lt;/string&gt;

--&gt;

&lt;string name=&quot;shared&quot;&gt;已分享&lt;/string&gt;

&lt;string name=&quot;show_extensions&quot;&gt;显示扩展名&lt;/string&gt;

&lt;string name=&quot;show_full_path&quot;&gt;完整路径&lt;/string&gt;

&lt;string name=&quot;show_hidden_globally&quot;&gt;显示隐藏文件&lt;/string&gt;

&lt;string name=&quot;show_hidden_recursively&quot;&gt;显示隐藏文件(递归)&lt;/string&gt;

&lt;string name=&quot;show_hide_bars_scroll&quot;&gt;滚动时只显示标题栏&lt;/string&gt;

&lt;!-- 其实是隐藏标签栏，底栏和地址栏 --&gt;

&lt;string name=&quot;show_in_map&quot;&gt;显示映射&lt;/string&gt;

&lt;string name=&quot;show_long_names&quot;&gt;强制显示全名&lt;/string&gt;

&lt;string name=&quot;show_thumbnails&quot;&gt;显示缩略图&lt;/string&gt;

&lt;string name=&quot;shred&quot;&gt;粉碎&lt;/string&gt;

&lt;string name=&quot;shuffled&quot;&gt;乱序&lt;/string&gt;

&lt;string name=&quot;sign&quot;&gt;签名&lt;/string&gt;

&lt;string name=&quot;signature&quot;&gt;签名&lt;/string&gt;

&lt;string name=&quot;signature_algorithm&quot;&gt;签名算法&lt;/string&gt;

&lt;string name=&quot;signed_x_files&quot;&gt;%s 已签名&lt;/string&gt;

&lt;string name=&quot;signing_x_files&quot;&gt;正在签名 %s&lt;/string&gt;

&lt;string name=&quot;signup&quot;&gt;注册&lt;/string&gt;

&lt;string name=&quot;size&quot;&gt;大小&lt;/string&gt;

&lt;string name=&quot;size_bigger&quot;&gt;大于：&lt;/string&gt;

&lt;string name=&quot;size_smaller&quot;&gt;小于：&lt;/string&gt;

&lt;string name=&quot;skip&quot;&gt;跳过&lt;/string&gt;

&lt;string name=&quot;skip_desc&quot;&gt;跳过当前文件&lt;/string&gt;

&lt;string name=&quot;sort&quot;&gt;顺序&lt;/string&gt;

&lt;string name=&quot;sort_by_icon&quot;&gt;根据图标&lt;/string&gt;

&lt;string name=&quot;sort_date_asc_deleted&quot;&gt;日期(删 除)&lt;/string&gt;

&lt;string name=&quot;sort_date_asc&quot;&gt;日期(新-旧)&lt;/string&gt;

&lt;string name=&quot;sort_date_desc&quot;&gt;日期(旧-新)&lt;/string&gt;

&lt;string name=&quot;sort_name_asc&quot;&gt;名称(A - Z)&lt;/string&gt;

&lt;string name=&quot;sort_name_desc&quot;&gt;名称(Z - A)&lt;/string&gt;

&lt;string name=&quot;sort_size_asc&quot;&gt;大小(小-大)&lt;/string&gt;

&lt;string name=&quot;sort_size_desc&quot;&gt;大小(大-小)&lt;/string&gt;

&lt;string name=&quot;sort_type_asc&quot;&gt;格式(升 序)&lt;/string&gt;

&lt;string name=&quot;sort_type_desc&quot;&gt;格式(降 序)&lt;/string&gt;

&lt;string name=&quot;spell_check&quot;&gt;拼写检查&lt;/string&gt;

&lt;string name=&quot;sqlite_editor&quot;&gt;SQL编辑器&lt;/string&gt;

&lt;string name=&quot;ssl_not_trusted&quot;&gt;无法验证 OpenSSL证书，您想要继续吗？&lt;/string&gt;

&lt;string name=&quot;start_on_boot&quot;&gt;开机自启&lt;/string&gt;

&lt;string name=&quot;start_num&quot;&gt;起始数字&lt;/string&gt;

&lt;string name=&quot;start_x&quot;&gt;开始 %s&lt;/string&gt;

&lt;string name=&quot;start_with_keyboard&quot;&gt;自动打开键盘&lt;/string&gt;

&lt;string name=&quot;stop_x&quot;&gt;停止 %s&lt;/string&gt;

&lt;string name=&quot;storage&quot;&gt;储存器&lt;/string&gt;

&lt;string name=&quot;subtitle&quot;&gt;副标题&lt;/string&gt;

&lt;string name=&quot;suffix&quot;&gt;扩展名&lt;/string&gt;

&lt;string name=&quot;streaming&quot;&gt;串流…&lt;/string&gt;

&lt;string name=&quot;summary_allow_root&quot;&gt;在设备上申请 Root权限&lt;/string&gt;

&lt;string name=&quot;summary_animations&quot;&gt;开启过渡动画&lt;/string&gt;

&lt;string name=&quot;summary_auto_remount&quot;&gt;自动将只读文件夹挂载为可写&lt;/string&gt;

&lt;string name=&quot;summary_bottom_bar&quot;&gt;顶部的栏显示在底部&lt;/string&gt;

&lt;string name=&quot;summary_can_undo&quot;&gt;使某些操作可以恢复&lt;/string&gt;

&lt;string name=&quot;summary_custom_otg&quot;&gt;在 OTG 设备上使用定制驱动&lt;/string&gt;

&lt;string name=&quot;summary_draw_tab_close&quot;&gt;在标签栏显示按钮关闭标签&lt;/string&gt;

&lt;string name=&quot;summary_enable_logging&quot;&gt;启用错误日志，保存在/MIX_LOG&lt;/string&gt;

&lt;string name=&quot;summary_full_wake_lock&quot;&gt;保持屏幕开启直到任务完成&lt;/string&gt;

&lt;string name=&quot;summary_keep_last_modified&quot;&gt;在 Root 设备上保留修改时间&lt;/string&gt;

&lt;string name=&quot;summary_merge_tasks&quot;&gt;将相同类型的任务合并为一项&lt;/string&gt;

&lt;string name=&quot;summary_open_archive&quot;&gt;在触碰时打开一个存档&lt;/string&gt;

&lt;string name=&quot;summary_select_by_icon&quot;&gt;点击列表视图的图标选择文件&lt;/string&gt;

&lt;string name=&quot;summary_show_breadcrumb&quot;&gt;在标签栏下面显示地址栏&lt;/string&gt;

&lt;string name=&quot;summary_show_tab_bar&quot;&gt;显示一个独立的标签栏&lt;/string&gt;

&lt;string name=&quot;summary_show_toast&quot;&gt;启用 Toasts 消息&lt;/string&gt;

&lt;string name=&quot;summary_show_tool_bar&quot;&gt;显示一个独立的工具栏&lt;/string&gt;

&lt;string name=&quot;summary_split_action_bar&quot;&gt;竖屏下启用双行操作栏&lt;/string&gt;

&lt;string name=&quot;summary_startup_lock&quot;&gt;设置启动密码&lt;/string&gt;

&lt;string name=&quot;summary_static_enc_key&quot;&gt;禁用将无法在不同设备登录&lt;/string&gt;

&lt;string name=&quot;summary_swipe_new_tab&quot;&gt;左滑新建标签右滑打开侧边栏&lt;/string&gt;

&lt;string name=&quot;summary_update_media_store&quot;&gt;在每次操作后刷新媒体存储&lt;/string&gt;

&lt;string name=&quot;summary_tap_execute&quot;&gt;单击任务按钮执行任务，长按显示所有任务&lt;/string&gt;

&lt;string name=&quot;summary_updates&quot;&gt;在启动时检查更新&lt;/string&gt;

&lt;string name=&quot;swipe_down_refresh&quot;&gt;顶端向下滑动刷新&lt;/string&gt;

&lt;string name=&quot;symlink&quot;&gt;软链接&lt;/string&gt;

&lt;string name=&quot;sync&quot;&gt;同步&lt;/string&gt;

&lt;string name=&quot;system&quot;&gt;系统&lt;/string&gt;

&lt;string name=&quot;tab_menu&quot;&gt;标签菜单&lt;/string&gt;

&lt;string name=&quot;target_android&quot;&gt;目标 SDK&lt;/string&gt;

&lt;string name=&quot;task_list&quot;&gt;任务列表&lt;/string&gt;

&lt;string name=&quot;tcp_server&quot;&gt;TCP服务器&lt;/string&gt;

&lt;string name=&quot;team_drives&quot;&gt;团队云储存&lt;/string&gt;

&lt;string name=&quot;text&quot;&gt;文本&lt;/string&gt;

&lt;string name=&quot;text_copied&quot;&gt;已复制到剪贴板&lt;/string&gt;

&lt;string name=&quot;theme&quot;&gt;主题&lt;/string&gt;

&lt;string name=&quot;three_dot&quot;&gt;…&lt;/string&gt;

&lt;!-- 这三个点似乎没有任何卵用 --&gt;

&lt;string name=&quot;thumbs_scrolling&quot;&gt;滑动时加载缩略图&lt;/string&gt;

&lt;string name=&quot;time&quot;&gt;时间&lt;/string&gt;

&lt;string name=&quot;time_picker&quot;&gt;选择时间&lt;/string&gt;

&lt;string name=&quot;timeout&quot;&gt;超时(分钟)&lt;/string&gt;

&lt;string name=&quot;title&quot;&gt;标题&lt;/string&gt;

&lt;string name=&quot;to&quot;&gt;到&lt;/string&gt;

&lt;string name=&quot;toggle_line_numbers&quot;&gt;显示行号&lt;/string&gt;

&lt;string name=&quot;toggle_slide_show&quot;&gt;幻灯片&lt;/string&gt;

&lt;string name=&quot;toggle_wrap&quot;&gt;自动换行&lt;/string&gt;

&lt;string name=&quot;tool&quot;&gt;创建器&lt;/string&gt;

&lt;string name=&quot;tool_bar&quot;&gt;工具栏&lt;/string&gt;

&lt;string name=&quot;tools&quot;&gt;工具&lt;/string&gt;

&lt;string name=&quot;torrent_server&quot;&gt;BT服务器&lt;/string&gt;

&lt;string name=&quot;total_size&quot;&gt;总大小&lt;/string&gt;

&lt;string name=&quot;total_used&quot;&gt;总使用&lt;/string&gt;

&lt;string name=&quot;transaction_error_msg&quot; formatted=&quot;false&quot;&gt;问题行 %d &lt;/string&gt;

&lt;string name=&quot;total&quot;&gt;大小&lt;/string&gt;

&lt;string name=&quot;trash&quot;&gt;回收站&lt;/string&gt;

&lt;string name=&quot;trigger_after&quot;&gt;触发后&lt;/string&gt;

&lt;string name=&quot;trigger_at&quot;&gt;触发于&lt;/string&gt;

&lt;string name=&quot;truncate&quot;&gt;截取&lt;/string&gt;

&lt;string name=&quot;try_again&quot;&gt;请重试&lt;/string&gt;

&lt;string name=&quot;type&quot;&gt;类型&lt;/string&gt;

&lt;string name=&quot;type_the_word&quot;&gt;输入关键词&lt;/string&gt;

&lt;string name=&quot;type_to_filter&quot;&gt;过滤类型&lt;/string&gt;

&lt;string name=&quot;undo&quot;&gt;还原&lt;/string&gt;

&lt;string name=&quot;unhide&quot;&gt;取消隐藏&lt;/string&gt;

&lt;string name=&quot;uninstall&quot;&gt;卸载&lt;/string&gt;

&lt;string name=&quot;uninstallation_completed&quot;&gt;卸载完成&lt;/string&gt;

&lt;string name=&quot;uninstallation_completed_desc&quot; formatted=&quot;false&quot;&gt;已卸载 %d/%d&lt;/string&gt;

&lt;string name=&quot;uninstalling_x&quot;&gt;正在卸载 %s&lt;/string&gt;

&lt;string name=&quot;unique_iv&quot;&gt;唯一的 IV&lt;/string&gt;

&lt;!-- 又是一个不明所以的词 --&gt;

&lt;string name=&quot;unknown&quot;&gt;未知&lt;/string&gt;

&lt;string name=&quot;unlock&quot;&gt;解锁&lt;/string&gt;

&lt;string name=&quot;unmount&quot;&gt;卸载&lt;/string&gt;

&lt;string name=&quot;unpin&quot;&gt;解除固定&lt;/string&gt;

&lt;string name=&quot;unshare&quot;&gt;取消分享&lt;/string&gt;

&lt;string name=&quot;update&quot;&gt;更新&lt;/string&gt;

&lt;string name=&quot;update_album_art&quot;&gt;更新封面&lt;/string&gt;

&lt;string name=&quot;upload&quot;&gt;上传&lt;/string&gt;

&lt;string name=&quot;uppercase&quot;&gt;转大写&lt;/string&gt;

&lt;string name=&quot;uri_address&quot;&gt;Uri 地址&lt;/string&gt;

&lt;string name=&quot;usb&quot;&gt;USB %s&lt;/string&gt;

&lt;string name=&quot;used&quot;&gt;已用&lt;/string&gt;

&lt;string name=&quot;user_agreement&quot;&gt;用户协议&lt;/string&gt;

&lt;string name=&quot;username&quot;&gt;用户名&lt;/string&gt;

&lt;string name=&quot;valid_from&quot;&gt;生效于&lt;/string&gt;

&lt;string name=&quot;valid_until&quot;&gt;截止到&lt;/string&gt;

&lt;string name=&quot;version&quot;&gt;APK 版本&lt;/string&gt;

&lt;string name=&quot;version_code&quot;&gt;内部版本&lt;/string&gt;

&lt;string name=&quot;view&quot;&gt;视图&lt;/string&gt;

&lt;string name=&quot;view_columned&quot;&gt;分栏&lt;/string&gt;

&lt;string name=&quot;view_compact&quot;&gt;紧凑&lt;/string&gt;

&lt;string name=&quot;view_detailed&quot;&gt;详细&lt;/string&gt;

&lt;string name=&quot;view_gallery&quot;&gt;画册&lt;/string&gt;

&lt;string name=&quot;view_grid&quot;&gt;网格&lt;/string&gt;

&lt;string name=&quot;view_minimal&quot;&gt;极简&lt;/string&gt;

&lt;string name=&quot;view_wrapped&quot;&gt;两栏&lt;/string&gt;

&lt;string name=&quot;waiting&quot;&gt;请等待…&lt;/string&gt;

&lt;string name=&quot;wallpaper&quot;&gt;壁纸&lt;/string&gt;

&lt;string name=&quot;web&quot;&gt;网页&lt;/string&gt;

&lt;string name=&quot;weekly&quot;&gt;每周&lt;/string&gt;

&lt;string name=&quot;whitespace&quot;&gt;空格&lt;/string&gt;

&lt;string name=&quot;wifi_direct&quot;&gt;WLAN 直连&lt;/string&gt;

&lt;!--  Windows10取消了Soft AP，推广这个，但体验非常糟糕，只有SamsungFlow能用  --&gt;

&lt;string name=&quot;word_size&quot;&gt;文字大小&lt;/string&gt;

&lt;string name=&quot;words&quot;&gt;关键词&lt;/string&gt;

&lt;string name=&quot;wrong_key&quot;&gt;密码错误&lt;/string&gt;

&lt;string name=&quot;wrong_user_pass&quot;&gt;用户名或密码错误&lt;/string&gt;

&lt;string name=&quot;x_selected&quot;&gt;已选择 %s&lt;/string&gt;

&lt;string name=&quot;yes&quot;&gt;是&lt;/string&gt;

&lt;string name=&quot;zip_align&quot;&gt;优化&lt;/string&gt;

&lt;!-- LICENSE --&gt;

&lt;string name=&quot;copyrignt&quot;&gt;© 2016-2020 YexuanXiao. All rights reserved.&lt;/string&gt;

&lt;/resources&gt;

<style>
.post-text p {
-moz-user-select:text !important;
-webkit-user-select:text !important;
-ms-user-select:text !important;
user-select:text !important;
}
</style>