# 代码预览区高度撑满 & 代码丰富紧凑化

**日期**: 2026-06-10

## 目标

1. 右侧代码预览区高度撑到屏幕底部，背景色填满
2. 代码片段更紧凑（缩小行间距）
3. 代码片段更丰富（每个 snippet 从 10-25 行扩展到 40-55 行）

## 布局调整

### CodePreview 撑满剩余空间

**方案**：flex 自动填充（方案 A），不依赖硬编码 calc。

**改动文件**：

1. `src/components/content/MainContent.vue` — CodePreview 增加 `flex: 1; min-height: 0;`
2. `src/styles/code-themes.css`：
   - `.code-preview-wrapper` 增加 `display: flex; flex-direction: column; height: 100%;`
   - `pre` 改为 `flex: 1; overflow: auto;`，去掉 `min-height: 320px`

### 效果

- CodeTabs 固定高度在上
- CodePreview 自动填满从 CodeTabs 下方到屏幕底部的全部空间
- 代码不够时背景色也填满
- 代码超出时 `overflow: auto` 出现滚动条

## 代码紧凑化

`code-themes.css` 中 `pre` 样式调整：

| 属性 | 旧值 | 新值 |
|------|------|------|
| padding | 24px 28px | 20px 28px |
| line-height | 1.7 | 1.55 |

## 代码丰富化

每个 snippet 从 10-25 行扩展到 40-55 行，增加更多语法特性：

| 语言 | 新增内容 |
|------|----------|
| JavaScript | 闭包、Proxy、生成器、Promise 链、数组方法链 |
| TypeScript | 泛型约束、工具类型 (Partial/Pick)、条件类型、枚举 |
| Python | dataclass、async/await、类型注解、上下文管理器 |
| JSON | 更深嵌套、更多字段 |
| HTML | 表单、SVG、语义标签 |

## 不涉及

- 侧边栏布局不变
- 主题颜色不变
- 组件结构不变（不新增/删除组件）
- 字号滑块逻辑不变
