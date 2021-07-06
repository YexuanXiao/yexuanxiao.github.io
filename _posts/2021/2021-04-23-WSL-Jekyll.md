---
layout: post
title: 在 WSL 2 上部署 Jekyll
date: "2021-04-23 23:56:00"
tags: [Windows,docs,WSL]
categories: [blog]
---
　　Windows 上使用 Ruby 在 WSL 出现之前十分不方便，WSL 1 对于端口转发的功能也不完善，不过这些问题都被 WSL 2 解决，使用 WSL 2 部署 Jekyll 是最方便快捷的方法。

<!-- more -->

　　参考文章：[Running Jekyll on WSL2](https://davemateer.com/2020/10/20/running-jekyll-on-wsl2)

　　cd 到项目目录，wsl 执行如下代码：

```shell

sudo apt-get update -y && sudo apt-get upgrade -y

sudo apt install ruby-full

sudo apt-get install make gcc gpp build-essential zlib1g zlib1g-dev ruby-dev dh-autoreconf

sudo apt-get clean

sudo gem update

sudo gem install bundler

# if you get errors (as I've done), go back to the start and go through these commands again
#sudo gem install jekyll

# inside jekyll repo
bundle install

# simple serve
bundle exec jekyll serve

```

　　可根据自己情况稍作修改。