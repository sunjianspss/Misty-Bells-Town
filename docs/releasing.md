# 雾铃小镇发布流程

这份项目现在采用“代码推 `main`、版本推 tag”的双轨方式：

- `main`：持续更新 GitHub Pages 在线试玩
- `vX.Y.Z` tag：生成可追踪的 GitHub Release

## 版本号规则

- `MAJOR`：世界观、流程结构或存档逻辑发生不兼容变化
- `MINOR`：新增完整章节、主要地图区域、核心系统或显著扩展试玩范围
- `PATCH`：修复 bug、改 UI、调音频、补文档、优化演出

当前基线版本位于仓库根目录的 `VERSION` 文件。

## 每次发布要做什么

1. 更新 `VERSION`

把根目录的 `VERSION` 改成准备发布的版本号，例如 `0.3.1`。

2. 更新 `CHANGELOG.md`

把本次变更从 `Unreleased` 整理到新版本区块，例如：

```md
## [0.3.1] - 2026-04-25

### Fixed
- 修复移动端触屏按钮与游戏画面分离的问题。
```

3. 自查试玩页与文案

至少确认这些内容和版本状态一致：

- 在线试玩是否正常打开
- 章节导览 / 今日目标 / 操作提示是否工作正常
- README 的“在线试玩”和“版本发布”说明是否仍然准确

4. 提交代码

```bash
git add VERSION CHANGELOG.md README.md docs/releasing.md .github/workflows/release.yml scripts/release_notes.py
git commit -m "Prepare v0.3.1 release"
```

5. 打标签

```bash
git tag v0.3.1
```

6. 推送

```bash
git push origin main
git push origin v0.3.1
```

## 自动发布行为

- 推送到 `main`：继续触发 GitHub Pages 工作流，更新在线试玩站点
- 推送 `vX.Y.Z` 标签：触发 GitHub Release 工作流，自动生成该版本的 Release

## 这个流程的好处

- 线上试玩更新和“正式版本节点”分开，不会互相干扰
- 版本号有唯一来源，不再只是页面里的一句文案
- `CHANGELOG.md` 能长期积累，方便以后回看每次迭代做了什么
- 以后要做 `v0.4.0`、`v0.5.0` 或正式版时，路径已经清楚
