---
title: 给你的博客添加 Sign With Google 登录按钮 
date: "2021-06-18 18:40:00"
update: "2024-10-31 07:14"
tags: [HTML, docs]
category: blog
---
今天发现第三方网站可以使用 Google 的登录接口，便研究了一下如何接入以自动获取基本信息，在这里介绍一下流程和踩的坑。

<!-- more -->

2024-10-31 更新：谷歌已经不再使用该方案，请参考新文档。

开发者网站有一些指南如下：

1. [Integrating Google Sign-In into your web app](https://developers.google.com/identity/sign-in/web/sign-in)
2. [Add Google Sign-In to Your Web App](https://developers.google.com/identity/sign-in/web)
3. [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2)
4. [Building a custom Google Sign-In button](https://developers.google.com/identity/sign-in/web/build-button)
5. [Getting profile information](https://developers.google.com/identity/sign-in/web/people)

Google 的这个指南其实不是很清晰，我简单整理了一下：

1. 登录 Google 账号，访问 [APIS](https://console.developers.google.com/apis/)。
2. 点击左侧的 OAuth consent screen，创建。注意，创建后不用 Publish，把必须项目填好，其他的默认。
3. 点击左侧的 Credentials，上面会有一个 Create Credentials 按钮，点击后会有一个菜单，点击 OAuth cilent ID，选择 Web application，填好内容，这时会得到一个二级域名是 googleusercontent.com 的域名，复制下来。
4. 如果你向傻瓜化添加按钮，那么可以参考上面第一条指南，但是这个按钮很难看。
5. 想自定义登录按钮可以看第四条指南，但是官方文档写的很迷惑人，删减后的代码我贴在这里：

    ```javascript

    var element
	var auth2
    element.setAttribute('data-onsuccess', 'onSignIn')
    var googleUser = {}
	var startApp = function () {
		gapi.load('auth2', function () {
			// Retrieve the singleton for the GoogleAuth library and set up the client.
			auth2 = gapi.auth2.init({
				client_id: '这里填写之前复制的那个域名',
				cookiepolicy: 'single_host_origin',
				scope: 'additional_scope'
			});
			attachSignin(element);
		});
	};
	function attachSignin(element) {
		auth2.attachClickHandler(element, {},
			function (googleUser) {
				// do something
			}, function (error) {
				console.err(JSON.stringify(error, undefined, 2));
			});
	}
	startApp()

    ```

    element 是 DOM 节点，必须能够添加 click 事件。

最坑的地方来了，如果你仅仅找到了前四个指南，你会发现你在全局作用域是获取不到登录信息的，那个 googleUser 的变量就是摆设。

比如它提供了下面这些方法:

+ `var profile = googleUser.getBasicProfile()`
+ `profile.getId()`
+ `profile.getName()`
+ `profile.getGivenName()`
+ `profile.getFamilyName()`
+ `profile.getImageUrl()`
+ `profile.getEmail()`
+ `googleUser.getAuthResponse().id_token`

但是实际上全都不能在全局作用域使用，并且前四个指南甚至有的本身就因为这个问题不能用。

经过我的不懈努力，找到了第五篇指南，里面给出了一个全局可以使用的动态取得当前登录信息的方法：

`auth2.currentUser.get()`，这个方法返回一个 googleUser 对象，可以这样用：

`var profile = auth2.currentUser.get().getBasicProfile();`

你可以参考本站的代码实现一个自定义登录按钮：[comment.js](https://github.com/YexuanXiao/yexuanxiao.github.io/blob/master/assets/js/comment.js)
