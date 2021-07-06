---
layout: post
title: 伪开箱一个 AENZR 的 C to C 数据线
date: "2021-01-06 06:23:00"
tags: [Windows]
categories: [blog]
---
　　这条线到目前其实已经到手 3 天了，购买原因是硬盘盒长期负载，偶发 IO 错误，导致系统发出设备重置指令，硬盘下线。

<!-- more -->

　　这个问题困扰了我半个月，因为之前一直使用硬盘盒送的线并且没有出现问题。

　　IO 错误大概在负载 1 个小时到几个小时出现，显示块无法访问。

　　虽然绿联硬盘盒的 PCB 质量肯定不会很高，但是对于这种集成度高的简单电路理应也不会有什么问题，所以自然最后怀疑到了线缆头上。

　　AENZR 这跟数据线使用了 VIA Lab 的 VL152 电子标记芯片，代表着这条线支持 PD3.0，20v 5A 的规格。

　　而且这款数据线使用了 FPC 柔性电路板作为线材，在内部噪声上优于一般的线缆，不过为了保持线缆的柔韧性，并没有镀锌铜网和铝箔组成的屏蔽层，外部噪声屏蔽效果较差。

　　USB 3.2 Gen2 10Gbps 和 USB 3.2 Gen2x2 20Gbps 的工作频率是 5Ghz，和 802.11ac/ax 会有干扰。 

　　由于大部分设备的 USB 都没有接地，所以对于这款产品没有屏蔽层也就无可厚非了。

　　目前使用 3 天的情况看，并未出现之前的系统发出设备重置指令，没翻车。

![20210106_060608](https://tva1.sinaimg.cn/large/005ZJ4a1ly1gmdkivn8jfj314k1yotyi.jpg)


参考：

[村田 - USB4的降噪措施](https://www.murata.com/zh-cn/products/emc/emifil/pickup/usb4-1)

[充电头网评测](http://www.aenzr.com/nd.jsp?id=22#_np=104_377)

[ViaLabs VL152](https://www.via-labs.com/product_show.php?id=89)

[USB Type-C 和 PD 设计认证规范](https://www.keysight.com/upload/cmc_upload/All/USB_Type-C_and_PD_design_and_verification_paper.pdf)

[USB 3.1 通道损耗预算](https://www.usb.org/sites/default/files/USB_3.1_Loss_Budget_Rev_1.0_-_2015-03-02.pdf)