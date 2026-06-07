# 全功能模块测试覆盖 Spec

## Why

当前项目（智能衣橱 v1.0+）前后端均无任何自动化测试，代码变更缺乏回归保障。随着功能迭代（SQLite 迁移、WebDAV 同步、AI 功能），手动验证成本越来越高，且已出现过 SQL 注入、分类映射错误、存储层跨平台失效等生产级缺陷。本 Spec 旨在建立一套覆盖前后端所有功能模块的自动化测试体系，作为持续交付的质量门禁。

## What Changes

- 新增后端 API 测试套件（认证、同步、上传、健康检查）
- 新增前端数据层测试套件（database、storage、imageStorage、settings）
- 新增前端业务逻辑测试（currency、importCloset、Zustand store）
- 新增前端组件渲染测试（AsyncImage、ClothingCard、CollageCanvas 等核心 UI）
- 新增集成/端到端测试脚本（启动服务端并验证完整同步链路）
- 新增测试运行命令到 `package.json` 与 `server/package.json`

## Impact

- Affected specs: 全量功能模块
- Affected code:
  - `server/src/routes/*.js` — 需暴露 app 实例供测试注入
  - `server/src/db.js` — 支持测试数据库隔离
  - `src/db/database.ts` — 需验证所有 CRUD 与边缘场景
  - `src/utils/*.ts` — 跨平台分支覆盖
  - `src/services/importCloset.ts` — ZIP 解析与分类映射
  - `src/components/*.tsx` — 渲染、事件、状态变化

## ADDED Requirements

### Requirement: 后端 API 自动化测试
The system SHALL provide automated tests for all backend routes with isolated database state.

#### Scenario: 用户注册与登录
- **WHEN** 向 `/api/auth/register` 发送合法用户名密码
- **THEN** 返回 200 与有效 JWT token
- **WHEN** 使用同一用户名再次注册
- **THEN** 返回 409 冲突错误
- **WHEN** 使用错误密码登录
- **THEN** 返回 401 认证失败

#### Scenario: 同步接口安全与功能
- **WHEN** 携带有效 token 向 `/api/sync/pull` 发送 lastSynced
- **THEN** 返回该用户自该时间后的增量数据
- **WHEN** 向 `/api/sync/push` 发送含非法字段的 payload
- **THEN** 非法字段被忽略或返回 400，服务端不报错
- **WHEN** 向 `/api/sync/push` 发送未知表名
- **THEN** 服务端静默跳过，不执行 SQL

#### Scenario: 上传接口认证
- **WHEN** 未携带 token 访问 `/api/upload/remove-bg`
- **THEN** 返回 401
- **WHEN** 携带 token 上传 base64 图片
- **THEN** 返回可访问的图片 URL

#### Scenario: 健康检查
- **WHEN** 访问 `/api/health`
- **THEN** 返回 status ok，无需认证

### Requirement: 前端数据层测试
The system SHALL verify all frontend database operations through mocked storage.

#### Scenario: 衣物 CRUD
- **WHEN** 调用 `addClothing` 添加衣物
- **THEN** `getAllClothing` 能返回该衣物且字段完整
- **WHEN** 调用 `deleteClothing` 删除衣物
- **THEN** `getAllClothing` 不再返回，但 `getArchivedClothing` 可返回（软删除）
- **WHEN** 调用 `updateClothing` 修改价格与品牌
- **THEN** 读取时字段已更新且 `updatedAt` 变化

#### Scenario: 分类与关联完整性
- **WHEN** 调用 `deleteCategory` 删除分类
- **THEN** 原属于该分类的衣物 `categoryId` 变为空字符串
- **WHEN** 应用首次启动调用 `initDatabase`
- **THEN** 默认分类被写入存储

#### Scenario: 搭配与每日记录联动
- **WHEN** 创建一套搭配并记录到某日 `addDailyLog`
- **THEN** 搭配内所有衣物 `wearCount` +1
- **WHEN** 修改该日记录为另一套搭配
- **THEN** 旧搭配衣物 `wearCount` -1，新搭配衣物 `wearCount` +1
- **WHEN** 删除该日记录
- **THEN** 关联搭配衣物 `wearCount` -1

#### Scenario: 设置读写
- **WHEN** 调用 `setSetting("showPrice", "true")`
- **THEN** `getSetting("showPrice")` 返回 `"true"`

### Requirement: 跨平台存储与图片存储测试
The system SHALL verify storage abstraction works on both web and native paths.

#### Scenario: Storage 抽象层
- **WHEN** 在 web 环境调用 `storage.setItem/getItem/removeItem`
- **THEN** 实际读写 `localStorage`
- **WHEN** 在 native 环境调用
- **THEN** 实际读写 `AsyncStorage`（通过 mock 验证）
- **WHEN** 读写抛出异常
- **THEN** 返回 null 或静默失败，不抛未捕获错误

#### Scenario: ImageStore 抽象层
- **WHEN** 在 web 环境存入 base64 图片
- **THEN** `getImageUrl` 返回 blob URL，`imageExists` 返回 true
- **WHEN** 在 native 环境（mock）存入图片
- **THEN** `getImageUrl` 返回文件路径

### Requirement: 业务逻辑工具测试
The system SHALL verify all pure utility functions.

#### Scenario: 货币工具
- **WHEN** `parsePrice("¥1,299.50")`
- **THEN** 返回 `1299.5`
- **WHEN** `formatCurrency(1299.5)`
- **THEN** 返回 `"¥1,300"`

#### Scenario: 导入分类映射
- **WHEN** ZIP 内衣物分类为 `"短袖"`
- **THEN** `mapCategory` 映射到 `"T恤"` 子分类
- **WHEN** ZIP 内分类完全不存在于当前系统
- **THEN** `categoryId` 为空字符串

#### Scenario: 季节位运算转换
- **WHEN** `mapSeason(1)` / `mapSeason(2)` / `mapSeason(4)` / `mapSeason(8)`
- **THEN** 分别返回 `"春"` / `"夏"` / `"秋"` / `"冬"`
- **WHEN** `mapSeason(5)` (春+秋)
- **THEN** 返回 `"春/秋"`

### Requirement: 前端组件渲染测试
The system SHALL verify key components render correctly and respond to interactions.

#### Scenario: AsyncImage 状态机
- **WHEN** uri 为 `"placeholder"`
- **THEN** 直接展示加载完成占位，不请求图片
- **WHEN** uri 为 `"idx://uuid"`
- **THEN** 调用 `getImageUrl` 并在成功/失败时切换状态
- **WHEN** 图片加载失败
- **THEN** 展示"加载失败"文本，点击可重试

#### Scenario: ClothingCard 交互
- **WHEN** 渲染并传入 `onPress`
- **THEN** 点击触发 `onPress`
- **WHEN** 传入 `onFavorite`
- **THEN** 点击心形图标触发 `onFavorite`
- **WHEN** `selected=true`
- **THEN** 展示选中边框与勾选标记

#### Scenario: CollageCanvas 布局
- **WHEN** 传入 3 个 items 且无 initialLayout
- **THEN** 按螺旋规则生成初始位置
- **WHEN** 从 items 中移除一个
- **THEN** 布局 map 中同步移除该 item
- **WHEN** 拖拽一个 item
- **THEN** `onLayoutChange` 被调用且坐标更新

### Requirement: Zustand Store 测试
The system SHALL verify store actions update state correctly.

#### Scenario: clothingStore
- **WHEN** 调用 `addItem`
- **THEN** `items` 数组首部新增该 item
- **WHEN** 调用 `deleteItem`
- **THEN** `items` 数组移除该 item
- **WHEN** 调用 `deleteCat`
- **THEN** `categories` 与 `items` 同时刷新（关联更新）

### Requirement: 集成与端到端测试
The system SHALL provide a script that validates the full sync loop.

#### Scenario: 完整同步链路
- **WHEN** 注册新用户并获取 token
- **THEN** 向 `/api/sync/push` 推送衣物与搭配数据成功
- **WHEN** 随后向 `/api/sync/pull` 拉取
- **THEN** 拉取到的数据与推送一致
- **WHEN** 推送软删除标记后再拉取
- **THEN** 拉取到 `*_deleted` 数组包含该 id

## MODIFIED Requirements

### Requirement: 后端数据库初始化
**原行为**: `initDB()` 直接操作生产数据库文件
**新行为**: 支持通过环境变量 `TEST_DB_PATH` 指定测试数据库路径，测试完成后自动清理

### Requirement: 服务端启动脚本
**原行为**: `server/src/index.js` 直接监听端口
**新行为**: 导出 `createApp()` 工厂函数供测试使用，`index.js` 仅在直接运行时启动服务器

## REMOVED Requirements

无
