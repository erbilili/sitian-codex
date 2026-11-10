# 司天阁 · Codex 桌面主题

司天阁 V2 为 Windows 上的 Codex 提供启动动画、驻守背景和可选桌宠「小司天」。本项目基于 [baili-codex](https://github.com/chenyi380/baili-codex) 的 Windows 启动器改造，保留原代码许可。

- 七步启动仪式逐行保留，随后显示「司天阁」欢迎语，再淡入工作界面。开场与交接共 12 秒。
- 驻守画面静音循环 16 秒，背景星轨缓慢转动；手中浑天仪保留原画。
- 小司天含待机、行走、挥手、跳跃等九种状态及 16 向注视，共 73 帧。

![小司天挥手](sitian-pet/preview/waving.gif)

## 预览

需要 [Node.js](https://nodejs.org/) 22.3 或更新版本。下载或克隆仓库，在仓库目录运行 `npm run preview`，打开终端打印的本机地址。预览使用模拟工作界面，无需启动 Codex。桌宠可打开 `sitian-pet/preview/index.html` 单独预览。

## Windows 安装和恢复

需要官方签名的 Windows 版 Codex 和 PowerShell 7。仓库附带开场、交接与驻守影片，无需重新渲染。

1. 在仓库目录运行 `pwsh -NoProfile -File scripts/install.ps1`。安装器使用文档目录下的 `Codex/SitianCodexV2`，若目标已存在则停止，避免覆盖。
2. 保存工作，完全退出 Codex（含 Mini 与后台），然后使用桌面「Codex · 司天阁」入口。首次启动请本人阅读提示并输入 `YES`。
3. 用右下角「司天 · 设置」或 `Ctrl+Alt+B` 调整外观；按 `Esc` 跳过开场。恢复官方外观时，在设置中恢复并完全退出，再用官方入口启动。

启动器不修改官方程序文件；它通过回环调试端口接入当前客户端。该端口在客户端完全退出前保持开放，同机程序可能连接。单独预览不会打开 Codex 的调试端口。

## 小司天桌宠

将 `sitian-pet/package/` 下的 `pet.json` 与 `spritesheet.webp` 复制到 `%USERPROFILE%\.codex\pets\sitian\`（如配置了 `CODEX_HOME`，则使用该目录下的 `pets\sitian\`），重新打开 Mini，在桌宠选择中选「小司天」。白璃等桌宠可继续使用。详见[桌宠说明](sitian-pet/README.md)。

## 制作与许可

`npm test` 运行启动、背景和预览服务测试。重新制作影片时，先 `npm install`，自行提供有权使用的仿宋字体，放到 `production/public/simfang.ttf`，再运行 `npm run studio` 或 `npm run render`。

代码许可见 [LICENSE](LICENSE)；图像与影片的权利说明见 [ASSET-NOTICE.md](runtime/ASSET-NOTICE.md)。本项目为非官方主题。
