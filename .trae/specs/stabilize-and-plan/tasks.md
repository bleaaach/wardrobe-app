# Tasks

## Phase 1: 架构修复（P0 — 阻断性问题）

- [ ] Task 1: 创建跨平台 Storage 抽象层
  - [x] SubTask 1.1: 新建 `src/utils/storage.ts`，提供 `getItem/setItem/removeItem` 接口
  - [x] SubTask 1.2: Web 端使用 localStorage 实现
  - [x] SubTask 1.3: React Native 端使用 `@react-native-async-storage/async-storage` 实现
  - [x] SubTask 1.4: 替换 `src/db/database.ts` 中的 `storage` 对象使用新抽象层
  - [x] SubTask 1.5: 验证 Web 端与 RN 端（通过 `Platform.OS` 判断）都能正常读写

- [ ] Task 2: 创建跨平台 ImageStore 抽象层
  - [x] SubTask 2.1: 新建 `src/utils/imageStorage.ts`，提供 `storeImage/getImageBlob/getImageUrl/imageExists` 接口
  - [x] SubTask 2.2: Web 端保持 IndexedDB 实现
  - [x] SubTask 2.3: React Native 端使用 `expo-file-system` 写入 `FileSystem.documentDirectory` 沙盒目录
  - [x] SubTask 2.4: 替换 `src/services/imageStore.ts` 的导出为新的跨平台实现
  - [x] SubTask 2.5: 替换 `AsyncImage.tsx` 中的图片读取逻辑

- [ ] Task 3: 修复导入分类映射逻辑
  - [x] SubTask 3.1: 修改 `src/services/importCloset.ts` 中的 `mapCategory` 函数
  - [x] SubTask 3.2: 按分类名称在现有分类列表中查找匹配，优先匹配子分类
  - [x] SubTask 3.3: 未匹配时 `categoryId` 设为空字符串（未分类），而非硬编码 `"cat_xxx"`

## Phase 2: 安全与数据完整性（P1）

- [ ] Task 4: 后端 SQL 注入修复
  - [x] SubTask 4.1: 修改 `server/src/routes/sync.js`，将动态 SQL 拼接改为预定义语句映射
  - [x] SubTask 4.2: `/pull` 路由使用固定的 `SELECT * FROM ${table}` 白名单 + 参数化 `user_id/updated_at`
  - [x] SubTask 4.3: `/push` 路由使用预定义字段白名单，拒绝任何未知字段写入
  - [x] SubTask 4.4: 服务端运行单元测试验证恶意 payload 被拒绝

- [ ] Task 5: 后端 JWT 与认证加固
  - [x] SubTask 5.1: 修改 `server/src/routes/auth.js`，移除 `JWT_SECRET` 的硬编码回退值
  - [x] SubTask 5.2: 若 `process.env.JWT_SECRET` 未设置，服务启动时抛出错误并退出
  - [x] SubTask 5.3: 修改 `server/src/routes/upload.js`，为所有 `/api/upload/*` 路由挂载 `authMiddleware`
  - [x] SubTask 5.4: 验证未携带 Token 访问上传接口返回 401

- [ ] Task 6: 统一软删除策略
  - [x] SubTask 6.1: 修改 `src/db/database.ts` 中的 `deleteOutfit`，改为 `updateOutfit(id, { deleted: 1 })`
  - [x] SubTask 6.2: 修改 `getOutfits` 过滤 `deleted === 0`
  - [x] SubTask 6.3: 修改 `app/outfits/[id].tsx` 中删除后的跳转逻辑（无需变更，仍为 router.back()）
  - [x] SubTask 6.4: 检查日历记录中引用已删除搭配时的展示，确保不崩溃

- [ ] Task 7: 分类删除关联更新
  - [x] SubTask 7.1: 修改 `app/settings/categories.tsx` 的 `handleDelete` 或调用 `deleteCat` 后的逻辑
  - [x] SubTask 7.2: 在 `src/db/database.ts` 的 `deleteCategory` 中，将关联衣物的 `categoryId` 更新为空字符串
  - [x] SubTask 7.3: 确保删除后衣橱页面能正确显示"未分类"衣物

## Phase 3: 功能补齐（P1）

- [ ] Task 8: 设置项持久化
  - [x] SubTask 8.1: 新建 `src/db/settings.ts`，提供 `getSetting(key)/setSetting(key, value)`，使用 Storage 抽象层
  - [x] SubTask 8.2: 修改 `app/(tabs)/settings.tsx`，在组件 mount 时从持久化存储读取 `showPrice` 和 `dailyReminder`
  - [x] SubTask 8.3: `showPrice` 变更时立即写入持久化存储
  - [x] SubTask 8.4: `dailyReminder` 变更时调用 `expo-notifications` 注册/取消每日推送（如未安装则先安装依赖）

- [ ] Task 9: 恢复备份功能
  - [x] SubTask 9.1: 修改 `app/(tabs)/settings.tsx`，实现"恢复备份"的文件选择（Web 用 `<input type="file">`，RN 用 `expo-document-picker`）
  - [x] SubTask 9.2: 使用 `jszip` 解压选中的 `.zip` 文件
  - [x] SubTask 9.3: 解析其中的 JSON 数据，校验结构合法性
  - [x] SubTask 9.4: 提供"合并"与"覆盖"两种恢复模式，合并时保留现有数据并追加新数据（按 ID 去重）
  - [x] SubTask 9.5: 恢复完成后刷新 Zustand store 状态

- [ ] Task 10: 导出备份完善
  - [x] SubTask 10.1: 修改 `app/(tabs)/settings.tsx` 中导出异常路径的 Alert 文案
  - [x] SubTask 10.2: 区分"无数据可备份"、"生成失败"等具体错误提示
  - [x] SubTask 10.3: 确保导出文件包含图片（从 ImageStore 抽象层读取所有图片 Blob 一并打包）

- [ ] Task 11: API 基地址配置化
  - [x] SubTask 11.1: 新建 `src/config/api.ts`，从 `process.env.EXPO_PUBLIC_API_URL` 或 `app.json` extra 字段读取基地址
  - [x] SubTask 11.2: 提供默认值为 `"http://8.162.26.192/sync"`
  - [x] SubTask 11.3: 替换 `app/closet/add.tsx`、`app/(tabs)/settings.tsx` 等文件中的硬编码 IP

## Phase 4: 代码质量（P2）

- [ ] Task 12: 类型安全清理
  - [x] SubTask 12.1: 全局搜索 `e: any`，替换为 `e: Error | unknown` 并配合 `instanceof Error` 判断
  - [x] SubTask 12.2: 全局搜索 `style?: any`，替换为 `StyleProp<ViewStyle>` 或 `StyleProp<ImageStyle>`
  - [x] SubTask 12.3: 全局搜索 `as any`，用正确类型断言替代
  - [x] SubTask 12.4: 运行 `npx tsc --noEmit` 确保无类型错误

- [ ] Task 13: 日志与调试清理
  - [x] SubTask 13.1: 移除所有 `console.log`（保留必要的 `console.error`）
  - [x] SubTask 13.2: 为空 catch 块添加 `console.error` 输出（如 `src/db/database.ts`、`AsyncImage.tsx`）

- [ ] Task 14: 公共工具函数提取
  - [x] SubTask 14.1: 新建 `src/utils/currency.ts`，提取 `parsePrice` 和 `formatCurrency`
  - [x] SubTask 14.2: 替换 `app/(tabs)/settings.tsx` 和 `app/settings/statistics.tsx` 中的重复定义
  - [x] SubTask 14.3: 新建 `src/constants/app.ts`，提取 `COLORS`、`SEASONS`、`SIZES`、`SHOE_SIZES`
  - [x] SubTask 14.4: 替换 `app/closet/add.tsx`、`app/closet/[id].tsx` 中的硬编码枚举

- [ ] Task 15: 性能与 UX 微调
  - [x] SubTask 15.1: 修复 `CollageCanvas` 的 `useEffect` 依赖项，避免 `[items.map(...).join(",")]` 频繁触发
  - [x] SubTask 15.2: 修复 `OutfitPreview` 使用 `key={item.id + i}` 的问题，改为稳定 key
  - [x] SubTask 15.3: 优化 `AsyncImage` 加载失败时的占位展示（从静态 "📷" 改为带重试按钮的错误态）
  - [x] SubTask 15.4: `app/closet/[id].tsx` 中 `costPerWear` 为 0 时显示"尚未穿着"而非 "-"

## Phase 5: 未来版本路线图（P3）

### v1.2 目标：数据层迁移与 WebDAV 同步

- [x] Task 16: 前端数据库迁移到 expo-sqlite
  - [x] SubTask 16.1: 设计 SQLite Schema（clothing/outfits/daily_logs/categories/settings 五张表）
  - [x] SubTask 16.2: 实现 `src/db/sqlite.ts` 封装 `expo-sqlite` 的 open/close/exec/query
  - [x] SubTask 16.3: 实现数据迁移脚本：首次启动时将 localStorage JSON 数据导入 SQLite
  - [x] SubTask 16.4: 重写 `src/db/database.ts` 所有 CRUD 函数，使用 SQLite 事务
  - [x] SubTask 16.5: 验证穿搭日历的穿着次数联动统计在 SQLite 下正确工作

- [ ] Task 17: WebDAV 同步实现
  - [x] SubTask 17.1: 调研并选择 WebDAV 客户端库（如 `webdav` npm 包）
  - [x] SubTask 17.2: 在设置页增加 WebDAV 服务器地址、用户名、密码输入框
  - [x] SubTask 17.3: 实现 WebDAV 连接测试与保存凭证（使用 `expo-secure-store` 或 Storage 抽象层）
  - [x] SubTask 17.4: 实现增量同步逻辑：将本地变更打包为 JSON 上传到 WebDAV，或从 WebDAV 拉取变更合并
  - [x] SubTask 17.5: 支持手动同步与自动同步（按设置间隔）

- [ ] Task 18: 随机搭配生成
  - [x] SubTask 18.1: 在搭配页面增加"随机搭配"按钮
  - [x] SubTask 18.2: 按简单规则随机选择：1件上装 + 1件下装 + 1件鞋子 + 可选外套/配饰
  - [x] SubTask 18.3: 支持按季节过滤（与当前月份匹配）
  - [x] SubTask 18.4: 随机结果可一键保存为新搭配

### v1.3 目标：体验优化与社区功能

- [ ] Task 19: 搜索与筛选增强
  - [x] SubTask 19.1: 支持按品牌、颜色、季节、价格区间组合筛选
  - [x] SubTask 19.2: 支持按穿着次数排序（最常穿/最少穿）
  - [x] SubTask 19.3: 衣橱页面支持网格/列表两种视图切换

- [ ] Task 20: 穿搭灵感与社交分享
  - [x] SubTask 20.1: 搭配详情页支持生成分享卡片（长图）
  - [x] SubTask 20.2: 支持保存分享图到相册或分享至微信/小红书
  - [x] SubTask 20.3: 日历穿搭记录支持添加心情/天气/场合标签

- [ ] Task 21: 深色模式支持
  - [x] SubTask 21.1: 在 `src/design/tokens.ts` 中定义深色配色方案
  - [x] SubTask 21.2: 使用 React Context 或 Zustand 管理主题状态
  - [x] SubTask 21.3: 所有组件读取当前主题并应用对应 token

### v2.0 目标：AI 能力（远期）

- [ ] Task 22: AI 搭配推荐
  - [x] SubTask 22.1: 调研接入开源 LLM API（如通义千问、智谱）或本地模型
  - [x] SubTask 22.2: 用户输入场合与天气，AI 从衣橱中推荐搭配组合
  - [x] SubTask 22.3: 推荐结果可一键保存并记录到日历

- [x] Task 23: AI 虚拟试衣
  - [x] SubTask 23.1: 调研虚拟试衣开源方案（如 Stable Diffusion + ControlNet / IDM-VTON）
  - [x] SubTask 23.2: 用户上传自拍 + 选择衣物，服务端生成试穿效果图
  - [x] SubTask 23.3: 试衣结果可保存到搭配库

# Task Dependencies

- Task 2 (ImageStore) depends on Task 1 (Storage)
- Task 8 (设置项持久化) depends on Task 1 (Storage)
- Task 9 (恢复备份) depends on Task 2 (ImageStore)
- Task 10 (导出备份) depends on Task 2 (ImageStore)
- Task 16 (expo-sqlite 迁移) depends on Task 1 (Storage) 和 Task 2 (ImageStore)
- Task 17 (WebDAV) depends on Task 16 (expo-sqlite)
- Phase 2 任务可并行于 Phase 1（除数据层直接调用者外）
- Phase 3 任务建议在 Phase 1 完成后开始
- Phase 4 可与其他 Phase 并行进行
