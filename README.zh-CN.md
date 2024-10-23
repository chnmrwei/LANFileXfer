# 局域网文件传输工具
这是一个通过局域网传输文件的工具，通过简单的网页界面在局域网内通过电脑或手机等发送和接收文件。
在大局域网校园网这样的环境下体验更佳。

## 必备工具
- Visual Studio Code
- Node.js 以及 npm（Node.js 自带）
- Express
- Nodemon

## 快速开始
你可以通过 Git 克隆此项目
```sh
git clone https://github.com/chnmrwei/LANFileXfer.git
```
或者下载项目的 ZIP 文件并解压。


## 使用 VSCode 打开项目：

导航到项目文件夹并用 Visual Studio Code 打开。

安装依赖：

```sh
npm install
npm install express
npm install -g nodemon
```
启动服务

```sh
npx nodemon ./server.js
```
等待服务启动后，你将看到如下信息：

```sh
Server running on http://127.0.0.1:3000
```
测试应用：

- 打开浏览器，访问 http://127.0.0.1:3000
- 测试文件传输功能。

## 使用说明
发送方操作：

- 最好是将你想发送的文件放入项目目录下的 uploads 文件夹中。

- 文件放置完成后，这些文件将会通过网页界面进行传输。

接收方操作：

- 确保接收方和发送方在同一个局域网内

- 在浏览器中输入发送方的内网 IP 地址加上端口号 3000，例如：

```sh
http://<内网IP>:3000
```
现在你可以通过浏览器查看并下载发送方提供的文件。

## 注意事项

- 网络配置： 发送方和接收方必须在同一个局域网内。
- 上传目录： 发送方必须将文件放在uploads文件夹内，接收方才能看到并下载文件。
- 防火墙设置： 请确保局域网内的设备允许通过端口 3000 进行流量访问。

## 其他信息
如果遇到问题或有建议，欢迎在项目仓库中提交 issue。