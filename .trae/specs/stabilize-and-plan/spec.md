# 智能衣橱稳定化与任务规划 Spec

## Why

当前代码已实现 v1.0 MVP 与 v1.1 大部分功能，但经全面审计发现 26 项问题（4 项严重、13 项重大、9 项轻微）。核心架构在 React Native 端完全不可用（localStorage/IndexedDB），后端存在 SQL 注入与未认证接口等安全隐患，多处功能仅为 UI 占位。本 Spec 旨在系统化修复问题、补齐功能，并制定清晰的后续版本路线图。

## What Changes

- **BREAKING**: 前端存储层从 localStorage + IndexedDB 迁移至 AsyncStorage + expo-file-system，确保 React Native 端可用
- 修复后端 SQL 注入、硬编码 JWT、未认证上传接口等安全问题
- 修复 deleteOutfit 硬删除、mapCategory ID 格式错误、分类删除关联更新等数据完整性问题
- 补齐设置页"恢复备份"、"每日提醒"等占位功能
- 统一代码质量：移除 any 类型、console.log、空 catch 块
- 制定 v1.2 / v1.3 / v2.0 的明确任务规划

## Impact

- Affected specs: 衣橱管理、搭配管理、穿搭日历、数据同步、系统设置
- Affected code:
  - `src/db/database.ts` — 存储层迁移
  - `src/services/imageStore.ts` — 图片存储迁移
  - `src/services/importCloset.ts` — 分类映射修复
  - `server/src/routes/sync.js` — SQL 注入修复
  - `server/src/routes/auth.js` — JWT 安全修复
  - `server/src/routes/upload.js` — 认证与异步写入
  - `app/(tabs)/settings.tsx` — 功能补齐
  - `app/settings/categories.tsx` — 关联更新修复
  - `src/db/database.ts` — 软删除统一
  - 全局 — any/console/空 catch 清理

## ADDED Requirements

### Requirement: 前端存储层跨平台兼容
The system SHALL provide a cross-platform storage abstraction that works on both Web and React Native.

#### Scenario: Web 端正常使用
- **WHEN** 用户在浏览器中打开应用
- **THEN** 数据使用 localStorage 存储，图片使用 IndexedDB 存储

#### Scenario: React Native 端正常使用
- **WHEN** 用户在 Android/iOS 真机上运行应用
- **THEN** 数据使用 AsyncStorage 存储，图片使用 expo-file-system 存储到沙盒目录

### Requirement: 后端安全加固
The system SHALL prevent SQL injection, enforce JWT authentication on all sensitive endpoints, and use strong secrets.

#### Scenario: 同步接口安全
- **WHEN** 攻击者尝试在 sync payload 中传入恶意 table/field 名
- **THEN** 服务端拒绝执行并返回 400 错误

#### Scenario: 上传接口认证
- **WHEN** 匿名用户访问 /api/upload/remove-bg
- **THEN** 服务端返回 401 未认证

### Requirement: 设置项持久化
The system SHALL persist user preferences across app restarts.

#### Scenario: 显示价格开关
- **WHEN** 用户关闭"显示价格"开关后重启应用
- **THEN** 开关保持关闭状态

#### Scenario: 每日提醒开关
- **WHEN** 用户打开"每日提醒"开关
- **THEN** 系统注册本地推送通知；关闭时取消注册

### Requirement: 数据完整性统一
The system SHALL use soft-delete consistently and maintain referential integrity.

#### Scenario: 删除搭配
- **WHEN** 用户删除一套搭配
- **THEN** 搭配标记 deleted=1，而非从数组移除；关联日历记录仍可查看但显示"搭配已删除"

#### Scenario: 删除分类
- **WHEN** 用户删除一个子分类
- **THEN** 该分类下所有衣物的 categoryId 自动重置为空字符串（未分类）

## MODIFIED Requirements

### Requirement: 衣物导入分类映射
**原行为**: `mapCategory` 返回 `"cat_" + subName`，与实际默认分类 ID 格式 `sub_${name}` 不匹配
**新行为**: 导入时按分类名称在现有分类中查找匹配，未匹配时归入"未分类"

### Requirement: 备份恢复功能
**原行为**: "恢复备份"按钮点击后弹出 Alert"开发中"
**新行为**: 支持选择 .zip 备份文件，解压后恢复 clothing/outfits/dailyLogs/categories 数据，并合并或覆盖现有数据

### Requirement: 导出备份异常处理
**原行为**: 部分异常路径弹出 Alert"备份功能开发中"
**新行为**: 所有异常路径给出明确错误提示（如"无数据可备份"、"存储空间不足"）

## REMOVED Requirements

### Requirement: 前端 localStorage 直接存储
**Reason**: React Native 环境不存在 localStorage，导致数据读写静默失败
**Migration**: 使用 Storage 抽象层，Web 回退到 localStorage，RN 使用 AsyncStorage

### Requirement: 前端 IndexedDB 直接存储图片
**Reason**: React Native 环境不存在 IndexedDB 和 atob
**Migration**: 使用 ImageStore 抽象层，Web 回退到 IndexedDB，RN 使用 expo-file-system
