---
date: "2020-02-07 23:00"
layout: post
title: 代码高亮测试
categories: [blog]
tags: [test, markdown, docs]
---

　　本页用于测试代码高亮情况

<!-- more -->

```html
<!DOCTYPE html>
<html>
    <head>
        <mate charest="utf-8" />
        <meta name="keywords" content="Editor.md, Markdown, Editor" />
        <title>Hello world!</title>
        <style type="text/css">
            body{font-size:14px;color:#444;font-family: "Microsoft Yahei", Tahoma, "Hiragino Sans GB", Arial;background:#fff;}
            ul{list-style: none;}
            img{border:none;vertical-align: middle;}
        </style>
    </head>
    <body>
        <h1 class="text-xxl">Hello world!</h1>
        <p class="text-green">Plain text</p>
    </body>
</html>
```

```java
package com.mysterious;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.security.Key;
import java.security.KeyPair;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import sun.misc.BASE64Encoder;
import sun.security.pkcs.PKCS8Key;

public class ks2x509v2
{
  public static void main(String[] args)
    throws Exception
  {
    if (args.length < 4) {
      System.out.println("");
      System.out.println("ks2x509 v2");
	  System.out.println("keystore to pem pk8 converter");
	  System.out.println("");
      System.out.println("Copyright (c) 2012-2016 YexuanXiao");
      System.out.println("");
      System.out.println("Usage: ks2x509 <keystore> <alias> <kspw> <kpw>");
      System.out.println("");
	  System.out.println("<kspw> :Key library password");
	  System.out.println("<kpw> :Private key password");
      System.out.println("");
      return; } String filename = args[0].trim();
    String keyalias = args[1].trim();
    String kspw = args[2].trim();
    String kpw = args[3].trim();
    File ksfile = new File(filename);
    String filepath = ksfile.getAbsolutePath();
    File kspath = new File(filepath);
    filepath = kspath.getParent();
    
     String ksfilenamebody = ksfile.getName().substring(0, ksfile.getName().lastIndexOf("."));
     
     KeyStore localKeyStore = KeyStore.getInstance(KeyStore.getDefaultType());
     FileInputStream localFileInputStream;
	 
     try { localFileInputStream = new FileInputStream(ksfile);
     } catch (Exception localException) {
	   System.err.println("");
       System.err.println("Open keystore failed !");
	   System.err.println("");
       return;
     }
     
	 System.out.println("");
     System.out.println("Export keystore ...");
	 System.out.println("");
	 
     localKeyStore.load(localFileInputStream, kspw.toCharArray());
     
     BASE64Encoder localBASE64Encoder = new BASE64Encoder();
     
     Certificate localCertificate = localKeyStore.getCertificate(keyalias);
     Key localKey = localKeyStore.getKey(keyalias, kpw.toCharArray());
     
     KeyPair localKeyPair = new KeyPair(localCertificate.getPublicKey(), (PrivateKey)localKey);
	 
     System.out.println("Writing x509 ...");
	 System.out.println("");
	 
     FileOutputStream localFileOutputStream1 = new FileOutputStream(filepath + "/" + keyalias + ".x509.pem");
     localFileOutputStream1.write("-----BEGIN CERTIFICATE-----\n".getBytes());
     localFileOutputStream1.write(localBASE64Encoder.encode(localCertificate.getEncoded()).getBytes());
     localFileOutputStream1.write("\n".getBytes());
     localFileOutputStream1.write("-----END CERTIFICATE-----".getBytes());
     localFileOutputStream1.close();
      
     System.out.println("Writing pk8 ...");
	 System.out.println("");
     PKCS8Key localPKCS8Key = (PKCS8Key)localKeyPair.getPrivate();
     FileOutputStream localFileOutputStream2 = new FileOutputStream(filepath + "/" + keyalias + ".pk8");
     localFileOutputStream2.write(localKeyPair.getPrivate().getEncoded());
     localFileOutputStream2.close();
	 
     System.out.println("Conversion success !");
	 System.out.println("");
   }
 }
```

```c++

#include <stdlib.h>
#include <graphics.h>
struct Snow/*雪的一些参数*/
{
int x;
int y;
int speed;
}snow[100];
int snownum=0;/*雪的个数*/
int size;/*保存区域的大小*/
int change=10;/*变颜色有关*/
void *save1,*save2;/*保存空间*/
void Copy();/*保存区域*/
void DrawSnow();/*具体实现*/
void Pr();/*输出字体以及发声音*/
void main(void)
{int gd=DETECT,gm;
initgraph(&gd,&gm,"c:\\tc");
Copy();
DrawSnow();
getch();
closegraph();
}
void Copy()
{
setcolor(0);
setfillstyle(SOLID_FILL,15);
  fillellipse(200,200,4,4);
size=imagesize(196,196,204,204);
save1=malloc(size);
save2=malloc(size);
getimage(196,196,204,204,save1);
getimage(96,96,104,104,save2);
}
void Pr()
{
int s[15]={0,100,150,200,150,200,250,150,250,300,250,150,100,250,350};/*这里可以自己编调子*/
setcolor(change/10);
settextstyle(0,0,4);
outtextxy(100,200,"Merry Christmas");
sound(s[change/10]);
}
void DrawSnow()
{int i;
int sx[62];
randomize();
for(i=0;i<62;i++)
  sx[i]=(i+2)*10;
cleardevice();
while(!kbhit())
{
  Pr();
  if(snownum!=100)
  {
   snow[snownum].speed=2+random(5);
   i=random(62);
   snow[snownum].x=sx[i];
   snow[snownum].y=10-random(100);
  }
  for(i=0;i<snownum;i++)/*去雪*/
   putimage(snow[i].x,snow[i].y,save2,COPY_PUT);
   Pr();
  if(snownum!=100)
   snownum++;
  /*delay(300);*/
  setfillstyle(SOLID_FILL,15);/*画雪*/
  for(i=0;i<snownum;i++)
   {
    snow[i].y+=snow[i].speed;
    putimage(snow[i].x,snow[i].y,save1,COPY_PUT);
    if(snow[i].y>500)
    snow[i].y=10-random(200);
   }
  change++;
  if(change==140)/*和颜色的变化有关*/
  change=10;
  }
  nosound();
}

/* 原文链接：https://blog.csdn.net/jqh2002_blog/article/details/25650877 */
```
