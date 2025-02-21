---
title: 给你的 Jekyll 博客添加评论
date: "2020-05-18 14:34:00"
tags: [Jekyll,docs]
category: blog
---

国内的评论服务基本都已经无法使用，disqus 又遭到封锁，我又不喜欢 github 仓库一堆无效 issue，Valine 似乎成为了静态博客评论系统唯一选择 。

<!-- more -->

1. 去 https://leancloud.app 注册一个账号，邮箱登录，但是需要提供手机号。
2. 进入首页后创建应用，选择开发板。
3. 点击应用，在控制面板左下角找到设置。
4. 打开应用 Keys ，找到 `AppID` 和 `Appkey` 并记住。
5. 继续打开安全中心，找到第二项 Web 安全域名 ，在其中填写你的博客地址，注意按照要求，端口号非必须。
6. 关闭 leancloud 网站，在仓库的 `_includes` 文件夹建立 `valine.html`，内容如下

  ```html
  {% raw %}
  <hr>
  <div id="comments"></div>
  <!--Leancloud 操作库:-->
  <script src="//cdn.jsdelivr.net/npm/leancloud-storage@3/dist/av-min.js"></script>
  <!--Valine 的核心代码库:-->
  <script src="//cdn.jsdelivr.net/npm/valine@1.4.14/dist/Valine.min.js"></script>
  <script>
  	new Valine({
  		av: AV,
  		el: '#comments',
  		app_id: '{{ site.valine.appid }}',
  		app_key: '{{ site.valine.appkey }}',
  		placeholder: '{{ site.valine.placeholder }}',
  		recordIP: '{{ site.valine.recordIP }}',
  		enableQQ: '{{ site.valine.enableQQ }}',
  	})
  </script>
  {% endraw %}
  ```

7. 在 `_config.yml` 中添加如下内容

  ```yml
  # Valine.
  # You can get your appid and appkey from https://leancloud.app
  # more info please open https://valine.js.org
  valine:
    enable: true
    appid:  # 填写 leancloud 的AppID
    appkey: # 填写 leancloud 的AppKey
    avatar: # gravatar style
    placeholder: 在此处留下你的评论 # comment box placeholder
    pageSize: 10 # pagination size
    recordIP: true # 是否记录评论者IP
    enableQQ: false # 是否启用昵称框自动获取QQ昵称和QQ头像, 默认关闭
  ```

8. 在 `_layouts\post.html` 合适位置添加 &#123;% include valine.html %&#125;

即可实现评论框。