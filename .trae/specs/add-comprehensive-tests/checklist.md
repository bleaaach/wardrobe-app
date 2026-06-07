# Checklist

## Phase 1: 测试基础设施

- [x] `server/src/index.js` 导出 `createApp()` 工厂函数，直接运行时仍监听端口
- [x] `server/src/db.js` 支持 `process.env.TEST_DB_PATH` 覆盖数据库路径
- [x] `server/package.json` 包含 `"test": "node --test tests/**/*.test.js"`
- [x] `server/tests/setup.js` 存在，提供 `resetDB()` 与 `getToken()` helper
- [x] 根目录 `package.json` 包含 `"test": "vitest run"`
- [x] `src/test-utils/mockStorage.ts` 存在，提供内存版 Storage 实现
- [x] `src/test-utils/mockPlatform.ts` 存在，支持动态切换 `Platform.OS`
- [x] `src/test-utils/mockImageStorage.ts` 存在，提供内存版 ImageStore 实现

## Phase 2: 后端 API 测试

- [x] 认证测试：`/api/auth/register` 成功返回 token，重复注册返回 409
- [x] 认证测试：`/api/auth/login` 成功返回 token，错误密码返回 401
- [x] 认证测试：`authMiddleware` 无 token / 过期 token / 非法 token 均返回 401
- [x] 同步测试：`/api/sync/pull` 按 `lastSynced` 返回用户增量数据
- [x] 同步测试：`/api/sync/push` insert / update / delete 均正确写入数据库
- [x] 同步测试：`/api/sync/push` 未知表名被跳过，不执行 SQL
- [x] 同步测试：`/api/sync/push` 白名单外字段被忽略，不会报错
- [x] 同步测试：恶意 SQL 注入 payload 被拒绝或无害化（返回 400 或忽略）
- [x] 上传测试：`/api/upload` 未认证 401，认证后上传成功返回 URL
- [x] 上传测试：`/api/upload/base64` 正确解码保存图片
- [x] 上传测试：`/api/upload/remove-bg` 未认证 401
- [x] 健康检查：`/api/health` 无需认证返回 `{ status: "ok" }`
- [x] 数据库测试：`initDB()` 正确创建 users / clothing / outfits / daily_logs / sync_log 五张表

## Phase 3: 前端数据层与工具测试

- [x] Storage 测试：web 环境实际读写 `localStorage`
- [x] Storage 测试：native 环境（mock）读写 `AsyncStorage`
- [x] Storage 测试：异常时返回 null 或静默失败，不抛未捕获错误
- [x] ImageStore 测试：web 路径 `storeImage / getImageUrl / imageExists` 正常工作
- [x] ImageStore 测试：native 路径（mock FileSystem）正常工作
- [x] database 测试：`initDatabase` 写入默认分类
- [x] database 测试：`addClothing / getAllClothing / getClothingById` 基本 CRUD
- [x] database 测试：`updateClothing` 更新字段并刷新 `updatedAt`
- [x] database 测试：`deleteClothing` 软删除，`restoreClothing` 恢复
- [x] database 测试：`getArchivedClothing` 仅返回已归档
- [x] database 测试：`getClothingByCategory` 正确过滤
- [x] database 测试：`addCategory / updateCategory / deleteCategory` 正常
- [x] database 测试：`deleteCategory` 后关联衣物 `categoryId` 变为空字符串
- [x] Outfit 测试：`addOutfit / getOutfits / updateOutfit / deleteOutfit` 软删除正常
- [x] Outfit 测试：`getOutfitsByClothingId` 正确返回关联搭配
- [x] DailyLog 测试：`addDailyLog` 使搭配内衣物 `wearCount +1`
- [x] DailyLog 测试：`updateDailyLog` 更换搭配时旧 wearCount -1、新 +1
- [x] DailyLog 测试：`deleteDailyLog` 使关联衣物 `wearCount -1`
- [x] DailyLog 测试：同一天多次记录覆盖旧记录，wearCount 正确回退/增加
- [x] Settings 测试：`getSetting / setSetting` 读写正确
- [x] Currency 测试：`parsePrice` 处理符号、逗号、空字符串、非法输入
- [x] Currency 测试：`formatCurrency` 四舍五入与千分位正确
- [x] Import 测试：最小 ZIP 正常导入衣物
- [x] Import 测试：`mapCategory` 直接匹配、别名映射、未匹配返回空字符串
- [x] Import 测试：`mapSeason` 单季节与组合季节正确
- [x] Import 测试：重复名称衣物跳过
- [x] Store 测试：`clothingStore.loadClothing / loadCategories` 加载数据
- [x] Store 测试：`addItem` 后 `items` 首部新增
- [x] Store 测试：`deleteItem` 后 `items` 移除
- [x] Store 测试：`deleteCat` 后 `categories` 与 `items` 同步刷新

## Phase 4: 前端组件测试

- [x] `AsyncImage` placeholder 状态直接渲染，不请求图片
- [x] `AsyncImage` idx:// 状态调用 `getImageUrl` 并切换成功/失败态
- [x] `AsyncImage` 失败态展示"加载失败"，点击触发重试
- [x] `ClothingCard` 点击触发 `onPress`
- [x] `ClothingCard` 收藏图标点击触发 `onFavorite`
- [x] `ClothingCard` `selected=true` 展示选中边框与勾选标记
- [x] `CollageCanvas` 无 initialLayout 时按螺旋规则生成位置
- [x] `CollageCanvas` items 减少时布局 map 同步移除
- [x] `CollageCanvas` 拖拽后 `onLayoutChange` 被调用且坐标更新
- [x] `OutfitPreview` 正确渲染搭配内衣物
- [x] `EmptyState` 按传入文案渲染

## Phase 5: 集成/E2E 与 CI

- [x] E2E 测试：注册 -> push 衣物与搭配 -> pull -> 数据一致
- [x] E2E 测试：push 软删除 -> pull 返回 `*_deleted` 列表
- [x] 根目录 `npm test` 能运行前端所有测试
- [x] `server` 目录 `npm test` 能运行后端所有测试
