# Tasks

## Phase 1: 测试基础设施（必须先完成）

- [x] Task 1: 后端测试框架与数据库隔离
  - [x] SubTask 1.1: 修改 `server/src/index.js` 导出 `createApp()` 工厂函数，`index.js` 直接运行时仍启动服务器
  - [x] SubTask 1.2: 修改 `server/src/db.js` 支持通过 `process.env.TEST_DB_PATH` 覆盖数据库路径
  - [x] SubTask 1.3: 在 `server/package.json` 中添加 `"test": "node --test tests/**/*.test.js"` 脚本
  - [x] SubTask 1.4: 创建 `server/tests/setup.js` 测试辅助模块（数据库清理、JWT 生成 helper）

- [x] Task 2: 前端 utility 测试环境搭建
  - [x] SubTask 2.1: 根目录 `package.json` 添加 `"test": "vitest run"` 脚本（使用 vitest 以支持 TS）
  - [x] SubTask 2.2: 创建 `src/test-utils/mockStorage.ts` 提供内存版 Storage mock
  - [x] SubTask 2.3: 创建 `src/test-utils/mockPlatform.ts` 支持切换 Platform.OS 为 web/android/ios
  - [x] SubTask 2.4: 创建 `src/test-utils/mockImageStorage.ts` 提供内存版 ImageStore mock

## Phase 2: 后端 API 测试（依赖 Task 1）

- [x] Task 3: 认证路由测试
  - [x] SubTask 3.1: 测试 `/api/auth/register` 成功注册与 409 重复注册
  - [x] SubTask 3.2: 测试 `/api/auth/login` 成功登录与 401 错误密码
  - [x] SubTask 3.3: 测试 `authMiddleware` 无 token / 过期 token / 非法 token 均返回 401

- [x] Task 4: 同步路由测试
  - [x] SubTask 4.1: 测试 `/api/sync/pull` 返回用户增量数据（按 lastSynced 过滤）
  - [x] SubTask 4.2: 测试 `/api/sync/push` insert / update / delete 三种 action
  - [x] SubTask 4.3: 测试 `/api/sync/push` 传入未知表名被静默跳过
  - [x] SubTask 4.4: 测试 `/api/sync/push` 传入白名单外字段被忽略
  - [x] SubTask 4.5: 测试 `/api/sync/push` 恶意 SQL 注入 payload 被拒绝或无害化

- [x] Task 5: 上传路由测试
  - [x] SubTask 5.1: 测试 `/api/upload` 未认证返回 401，认证后上传文件返回 URL
  - [x] SubTask 5.2: 测试 `/api/upload/base64` 解码并保存 base64 图片
  - [x] SubTask 5.3: 测试 `/api/upload/remove-bg` 未认证返回 401

- [x] Task 6: 健康检查与数据库测试
  - [x] SubTask 6.1: 测试 `/api/health` 无需认证返回 ok
  - [x] SubTask 6.2: 测试 `initDB()` 能正确创建所有表（users/clothing/outfits/daily_logs/sync_log）

## Phase 3: 前端数据层与工具测试（依赖 Task 2）

- [x] Task 7: Storage 与 ImageStore 测试
  - [x] SubTask 7.1: 测试 `storage.setItem/getItem/removeItem` 在 web 环境读写 localStorage
  - [x] SubTask 7.2: 测试 `storage` 在 native 环境读写 AsyncStorage（通过 mock）
  - [x] SubTask 7.3: 测试 `storage` 异常时返回 null / 静默失败
  - [x] SubTask 7.4: 测试 `imageStorage` web 路径（storeImage/getImageUrl/imageExists）
  - [x] SubTask 7.5: 测试 `imageStorage` native 路径（通过 mock FileSystem）

- [x] Task 8: database.ts CRUD 测试
  - [x] SubTask 8.1: 测试 `initDatabase` 写入默认分类
  - [x] SubTask 8.2: 测试 `addClothing / getAllClothing / getClothingById` 基本 CRUD
  - [x] SubTask 8.3: 测试 `updateClothing` 更新字段并刷新 `updatedAt`
  - [x] SubTask 8.4: 测试 `deleteClothing` 软删除与 `restoreClothing` 恢复
  - [x] SubTask 8.5: 测试 `getArchivedClothing` 仅返回已归档
  - [x] SubTask 8.6: 测试 `getClothingByCategory` 过滤
  - [x] SubTask 8.7: 测试 `addCategory / updateCategory / deleteCategory`
  - [x] SubTask 8.8: 测试 `deleteCategory` 后关联衣物 `categoryId` 置空

- [x] Task 9: Outfit 与 DailyLog 联动测试
  - [x] SubTask 9.1: 测试 `addOutfit / getOutfits / updateOutfit / deleteOutfit` 软删除
  - [x] SubTask 9.2: 测试 `getOutfitsByClothingId` 正确返回关联搭配
  - [x] SubTask 9.3: 测试 `addDailyLog` 使搭配内衣物 `wearCount +1`
  - [x] SubTask 9.4: 测试 `updateDailyLog` 更换搭配时旧搭配 wearCount -1、新搭配 +1
  - [x] SubTask 9.5: 测试 `deleteDailyLog` 使关联衣物 wearCount -1
  - [x] SubTask 9.6: 测试同一天多次 `addDailyLog` 会覆盖旧记录并正确回退/增加 wearCount

- [x] Task 10: Settings 与 currency 测试
  - [x] SubTask 10.1: 测试 `getSetting / setSetting` 读写持久化值
  - [x] SubTask 10.2: 测试 `parsePrice` 处理带货币符号、逗号、空字符串、非法输入
  - [x] SubTask 10.3: 测试 `formatCurrency` 四舍五入与千分位格式化

- [x] Task 11: importCloset 业务逻辑测试
  - [x] SubTask 11.1: 构造最小 ZIP（含 exporterData.json + images/）测试 `importClosetData` 正常导入
  - [x] SubTask 11.2: 测试 `mapCategory` 直接匹配、SUB_CAT_MAP 映射、未匹配返回空字符串
  - [x] SubTask 11.3: 测试 `mapSeason` 单季节与组合季节位运算
  - [x] SubTask 11.4: 测试重复名称衣物跳过不重复导入

- [x] Task 12: Zustand Store 测试
  - [x] SubTask 12.1: 测试 `clothingStore.loadClothing / loadCategories` 加载数据到 state
  - [x] SubTask 12.2: 测试 `addItem` 后 `items` 数组首部新增
  - [x] SubTask 12.3: 测试 `deleteItem` 后 `items` 数组移除
  - [x] SubTask 12.4: 测试 `deleteCat` 后 `categories` 与 `items` 同步刷新

## Phase 4: 前端组件测试（依赖 Task 2）

- [x] Task 13: 核心组件渲染与交互测试
  - [x] SubTask 13.1: 测试 `AsyncImage` placeholder / idx:// / http:// / 加载失败 / 重试 各状态渲染
  - [x] SubTask 13.2: 测试 `ClothingCard` 点击、收藏点击、选中态渲染
  - [x] SubTask 13.3: 测试 `CollageCanvas` 初始布局生成、items 增减同步、onLayoutChange 回调
  - [x] SubTask 13.4: 测试 `OutfitPreview` 正确渲染搭配内衣物列表
  - [x] SubTask 13.5: 测试 `EmptyState` 按传入文案渲染

## Phase 5: 集成/E2E 测试与 CI 适配

- [x] Task 14: 端到端同步链路测试
  - [x] SubTask 14.1: 编写 `server/tests/e2e-sync.test.js` 启动内存数据库 + 注册 + push + pull + 断言一致性
  - [x] SubTask 14.2: 测试软删除推送后 pull 返回 `*_deleted` 列表

- [x] Task 15: 测试命令与文档
  - [x] SubTask 15.1: 根目录 `package.json` 确保 `npm test` 能运行前端 utility + 组件测试
  - [x] SubTask 15.2: `server/package.json` 确保 `npm test` 能运行后端 API + E2E 测试
  - [x] SubTask 15.3: 在根目录 README 或测试目录添加运行说明（如用户要求）

# Task Dependencies

- Task 3/4/5/6 依赖 Task 1
- Task 7/8/9/10/11/12 依赖 Task 2
- Task 13 依赖 Task 2
- Task 14 依赖 Task 1
- Phase 2、Phase 3、Phase 4 之间无依赖，可并行
