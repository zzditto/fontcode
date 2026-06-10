# 代码预览区高度撑满 & 代码丰富紧凑化 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 代码预览区高度撑到屏幕底部 + 代码片段更紧凑更丰富

**架构：** 纯 CSS flex 布局调整（CodePreview 用 `flex: 1` 撑满 MainContent 剩余空间）+ 代码片段数据扩展（每个 snippet 40-55 行）

**技术栈：** Vue 3 + TypeScript + CSS

---

### 任务 1：CodePreview 撑满剩余空间 — CSS 布局

**文件：**
- 修改：`src/components/content/MainContent.vue`
- 修改：`src/styles/code-themes.css`

- [ ] **步骤 1：MainContent.vue — CodePreview 增加 flex: 1**

在 `<style scoped>` 中，`.main-content` 后追加规则：

```css
.main-content > :last-child {
  flex: 1;
  min-height: 0;
}
```

完整 style 块变为：

```css
.main-content {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-width: 0;
}

.main-content > :last-child {
  flex: 1;
  min-height: 0;
}
```

- [ ] **步骤 2：code-themes.css — wrapper 和 pre 改为 flex 填充**

修改 `.code-preview-wrapper`：

```css
.code-preview-wrapper {
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
```

修改 `.code-preview-wrapper pre`：

```css
.code-preview-wrapper pre {
  margin: 0;
  padding: 20px 28px;
  tab-size: 2;
  line-height: 1.55;
  overflow: auto;
  flex: 1;
  font-family: inherit;
  font-size: inherit;
}
```

- [ ] **步骤 3：验证布局 — 启动 dev server 检查**

运行：`npm run dev`

打开浏览器，检查：
- 代码预览区是否从 CodeTabs 下方一直延伸到屏幕底部
- 背景色是否填满整个区域（深色主题看 `#2b2118`，浅色看 `#f8f8f0`）
- 切换不同语言 tab，确认高度保持一致
- 字号调大（如 24px）确认代码超出时出现纵向滚动条

- [ ] **步骤 4：Commit**

```bash
git add src/components/content/MainContent.vue src/styles/code-themes.css
git commit -m "style: CodePreview 高度撑满视口，代码紧凑化"
```

---

### 任务 2：代码片段丰富化 — 扩展 snippets

**文件：**
- 修改：`src/data/snippets.ts`

- [ ] **步骤 1：替换 JavaScript snippet**

将 `key: 'javascript'` 的 `code` 字段替换为：

```ts
code: `// 现代 JavaScript — 闭包、Proxy、生成器、Promise
const greet = (name) => \`Hello, \${name}!\`;

// 解构 & 展开
const user = { name: 'Alice', role: 'developer', skills: ['Vue', 'TS'] };
const { name, role, skills } = user;
const merged = { ...user, active: true };

// 闭包
function createCounter(init = 0) {
  let count = init;
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count,
  };
}

const counter = createCounter(10);
counter.inc();
counter.inc();

// Promise 链 & async/await
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
};

// Proxy
const handler = {
  get(target, prop) {
    return prop in target ? target[prop] : \`No \${String(prop)}\`;
  },
};
const proxy = new Proxy({ a: 1, b: 2 }, handler);

// 生成器
function* range(start, end) {
  for (let i = start; i <= end; i++) yield i;
}

// 数组方法链
const nums = [1, 2, 3, 4, 5, 6];
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n ** 2)
  .reduce((a, b) => a + b, 0);

// Set & Map
const uniq = [...new Set([1, 2, 2, 3, 3, 4])];
const map = new Map([['a', 1], ['b', 2]]);

console.log(greet(name), proxy.c, [...range(1, 3)], result, uniq);`,
```

- [ ] **步骤 2：替换 TypeScript snippet**

将 `key: 'typescript'` 的 `code` 字段替换为：

```ts
code: `// TypeScript — 泛型约束、工具类型、条件类型
interface User {
  id: number;
  name: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
}

type Nullable<T> = T | null;
type UserPreview = Pick<User, 'id' | 'name'>;
type UserPatch = Partial<Pick<User, 'email' | 'role'>>;

// 条件类型
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'

// 泛型约束
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

class DataStore<T extends { id: number }> {
  private items: Map<number, T> = new Map();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  get(id: number): T | undefined {
    return this.items.get(id);
  }

  getAll(): readonly T[] {
    return [...this.items.values()];
  }

  remove(id: number): boolean {
    return this.items.delete(id);
  }
}

enum Status { Active = 'ACTIVE', Inactive = 'INACTIVE', Pending = 'PENDING' }

const store = new DataStore<User>();
store.add({ id: 1, name: 'Alice', role: 'admin' });
store.add({ id: 2, name: 'Bob', role: 'editor' });

const user = store.get(1);
const name = user ? getProp(user, 'name') : 'Unknown';
console.log(name, store.getAll().length, Status.Active);`,
```

- [ ] **步骤 3：替换 Python snippet**

将 `key: 'python'` 的 `code` 字段替换为：

```ts
code: `# Python — dataclass、async/await、类型注解
from dataclasses import dataclass, field
from typing import Optional, Generator
import asyncio
import json

@dataclass
class User:
    id: int
    name: str
    email: Optional[str] = None
    tags: list[str] = field(default_factory=list)

    def display(self) -> str:
        return f"{self.name} <{self.email or 'N/A'}>"


def fibonacci(n: int) -> list[int]:
    """生成前 n 个斐波那契数。"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result


# 生成器
def even_numbers(limit: int) -> Generator[int, None, None]:
    for i in range(limit):
        if i % 2 == 0:
            yield i


# 列表推导式 & 字典推导式
squares = [x ** 2 for x in range(10) if x % 2 == 0]
lookup = {x: x ** 2 for x in range(5)}


# async/await
async def fetch_config(path: str) -> dict:
    await asyncio.sleep(0.1)  # 模拟 I/O
    with open(path, 'r') as f:
        return json.load(f)


# 装饰器
def timer(func):
    from functools import wraps
    import time

    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f'{func.__name__} took {elapsed:.3f}s')
        return result
    return wrapper


@timer
def compute() -> int:
    return sum(even_numbers(1000))


user = User(id=1, name='Alice', tags=['python', 'async'])
print(user.display())
print(fibonacci(10))
print(squares)
print(lookup)
print(compute())`,
```

- [ ] **步骤 4：替换 JSON snippet**

将 `key: 'json'` 的 `code` 字段替换为：

```ts
code: `{
  "name": "fontcode",
  "version": "1.0.0",
  "description": "编程字体预览平台",
  "license": "MIT",
  "fonts": [
    "Fira Code",
    "JetBrains Mono",
    "Cascadia Code",
    "Source Code Pro",
    "IBM Plex Mono",
    "Hack",
    "Inconsolata",
    "Consolas"
  ],
  "theme": {
    "dark": {
      "background": "#2b2118",
      "foreground": "#e8d5bc",
      "selection": "#4a3a2a",
      "lineHighlight": "#332a20"
    },
    "light": {
      "background": "#f8f8f0",
      "foreground": "#725d42",
      "selection": "#e0d5c0",
      "lineHighlight": "#f0ead8"
    }
  },
  "settings": {
    "fontSize": 14,
    "tabSize": 2,
    "ligatures": true,
    "lineNumbers": false,
    "wordWrap": "off"
  },
  "snippets": [
    { "key": "javascript", "label": "JavaScript" },
    { "key": "typescript", "label": "TypeScript" },
    { "key": "python", "label": "Python" },
    { "key": "json", "label": "JSON" },
    { "key": "html", "label": "HTML" }
  ],
  "contributors": [
    { "name": "Alice", "role": "maintainer" },
    { "name": "Bob", "role": "designer" }
  ]
}`,
```

- [ ] **步骤 5：替换 HTML snippet**

将 `key: 'html'` 的 `code` 字段替换为：

```ts
code: `<!-- HTML5 — 语义标签、表单、SVG -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FontCode — 编程字体预览</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="app-header">
    <h1>FontCode</h1>
    <nav aria-label="主导航">
      <a href="#fonts">字体</a>
      <a href="#about">关于</a>
      <a href="#settings">设置</a>
    </nav>
  </header>

  <main>
    <section id="fonts" class="font-grid">
      <article class="font-card" data-font="fira-code">
        <h2>Fira Code</h2>
        <p>由 Nikita Prokopov 设计</p>
        <span class="badge">连字</span>
      </article>
      <article class="font-card" data-font="jetbrains-mono">
        <h2>JetBrains Mono</h2>
        <p>由 JetBrains 设计</p>
        <span class="badge">连字</span>
      </article>
    </section>

    <form class="settings-form" onsubmit="return false">
      <fieldset>
        <legend>偏好设置</legend>
        <label>
          <span>字号</span>
          <input type="range" min="10" max="24" value="14" name="fontSize">
        </label>
        <label>
          <input type="checkbox" name="ligatures" checked>
          <span>启用连字</span>
        </label>
        <label>
          <span>主题</span>
          <select name="theme">
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </label>
      </fieldset>
    </form>

    <svg width="200" height="60" viewBox="0 0 200 60"
         xmlns="http://www.w3.org/2000/svg" aria-label="FontCode 图标">
      <text x="10" y="40" font-family="monospace" font-size="28"
            font-weight="bold" fill="currentColor">
        &lt;FC /&gt;
      </text>
    </svg>
  </main>

  <footer>
    <small>&copy; 2026 FontCode</small>
  </footer>
</body>
</html>`,
```

- [ ] **步骤 6：验证代码片段 — 启动 dev server 逐语言检查**

运行：`npm run dev`

逐一切换 5 个语言 tab，检查：
- 语法高亮是否正常（关键字、字符串、注释颜色正确）
- 代码是否 40-55 行
- 无语法错误（TypeScript 泛型、Python async 等）
- 代码紧凑度是否提升（行间距更小）

- [ ] **步骤 7：Commit**

```bash
git add src/data/snippets.ts
git commit -m "feat: 代码片段丰富化，每个 snippet 扩展至 40-55 行"
```

---

### 任务 3：最终验证 & 构建

- [ ] **步骤 1：类型检查 + 构建**

```bash
npm run build
```

预期：`vue-tsc` 类型检查通过，`vite build` 成功，无错误。

- [ ] **步骤 2：预览构建产物**

```bash
npm run preview
```

打开预览 URL，确认生产构建下布局和代码片段均正常。

- [ ] **步骤 3：Commit（如有遗漏）**

如有任何遗漏文件，commit。
