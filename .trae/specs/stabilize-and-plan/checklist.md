# Checklist

## Phase 1: 架构修复

- [x] `src/utils/storage.ts` 存在且导出 `getItem/setItem/removeItem`
- [x] `src/db/database.ts` 使用 Storage 抽象层而非直接访问 `localStorage`
- [x] Web 端（`Platform.OS === 'web'`）使用 `localStorage`
- [x] RN 端使用 `@react-native-async-storage/async-storage`
- [x] `src/utils/imageStorage.ts` 存在且提供 `storeImage/getImageBlob/getImageUrl/imageExists`
- [x] Web 端图片仍使用 IndexedDB，RN 端使用 `expo-file-system`
- [x] `AsyncImage.tsx` 使用新的 ImageStore 抽象层读取图片
- [x] 导入 `.zip` 备份时，衣物分类能正确匹配现有分类（非 `"cat_xxx"` 格式）
- [x] 导入未匹配分类时，`categoryId` 为空字符串

## Phase 2: 安全与数据完整性

- [x] `server/src/routes/sync.js` 无动态 SQL 拼接，字段使用白名单校验
- [x] 服务端恶意 payload 测试返回 400 而非执行 SQL
- [x] `server/src/routes/auth.js` 无 `JWT_SECRET` 硬编码回退值
- [x] 未设置 `JWT_SECRET` 时服务端启动失败并给出明确错误
- [x] `server/src/routes/upload.js` 所有路由挂载 `authMiddleware`
- [x] 未携带 Token 访问 `/api/upload/remove-bg` 返回 401
- [x] `deleteOutfit` 使用软删除（`deleted: 1`）而非硬删除
- [x] `getOutfits` 过滤条件包含 `deleted === 0`
- [x] 日历记录引用已删除搭配时不崩溃，显示"搭配已删除"
- [x] 删除分类后，该分类下所有衣物的 `categoryId` 变为空字符串

## Phase 3: 功能补齐

- [x] `src/db/settings.ts` 存在，支持 `getSetting/setSetting`
- [x] 设置页"显示价格"开关状态在重启后保持
- [x] 设置页"每日提醒"开关状态在重启后保持
- [x] 打开"每日提醒"时注册本地推送通知，关闭时取消
- [x] "恢复备份"支持选择 `.zip` 文件
- [x] 恢复备份提供"合并"与"覆盖"两种模式
- [x] 合并模式按 ID 去重，不覆盖现有数据
- [x] 恢复完成后衣橱/搭配/日历数据自动刷新
- [x] 导出备份异常时给出具体错误提示（非"开发中"）
- [x] 导出 `.zip` 包含图片数据
- [x] `src/config/api.ts` 存在，提供 `getApiBaseUrl()`
- [x] 前端无硬编码 `8.162.26.192` IP 地址

## Phase 4: 代码质量

- [x] 全局无 `e: any` 类型（除无法避免的场景外）
- [x] 全局无 `style?: any`
- [x] `npx tsc --noEmit` 通过无错误
- [x] 生产代码中无 `console.log`
- [x] 空 catch 块均有 `console.error` 输出
- [x] `src/utils/currency.ts` 存在，被 settings 和 statistics 引用
- [x] `src/constants/app.ts` 存在，包含 `COLORS/SEASONS/SIZES/SHOE_SIZES`
- [x] `app/closet/add.tsx` 和 `app/closet/[id].tsx` 引用常量文件而非硬编码
- [x] `CollageCanvas` 的 `useEffect` 使用稳定依赖
- [x] `AsyncImage` 加载失败时展示带重试按钮的错误态

## Phase 5: 未来版本（v1.2 / v1.3 / v2.0）

- [x] v1.2 任务规划已确定（expo-sqlite + WebDAV + 随机搭配）
- [x] v1.3 任务规划已确定（搜索增强 + 社交分享 + 深色模式）
- [x] v2.0 任务规划已确定（AI 搭配推荐 + 虚拟试衣）
