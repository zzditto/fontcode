export interface Snippet {
  key: string;
  label: string;
  language: string;
  code: string;
}

export const snippets: Snippet[] = [
  {
    key: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
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
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
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
  },
  {
    key: 'python',
    label: 'Python',
    language: 'python',
    code: `# Python — dataclass、async/await、类型注解
from dataclasses import dataclass, field
from typing import Optional, Generator
import asyncio

@dataclass
class User:
    id: int
    name: str
    email: Optional[str] = None
    tags: list[str] = field(default_factory=list)

    def display(self) -> str:
        return f"{self.name} <{self.email or 'N/A'}>"

# 生成器
def even_numbers(limit: int) -> Generator[int, None, None]:
    for i in range(limit):
        if i % 2 == 0:
            yield i

# 列表推导式
squares = [x ** 2 for x in range(10) if x % 2 == 0]

# async/await
async def fetch_data() -> dict:
    await asyncio.sleep(0.1)
    return {"status": "ok"}

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
print(squares)
print(compute())`,
  },
  {
    key: 'json',
    label: 'JSON',
    language: 'json',
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
  },
  {
    key: 'html',
    label: 'HTML',
    language: 'html',
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
  <header>
    <h1>FontCode</h1>
    <nav aria-label="主导航">
      <a href="#fonts">字体</a>
      <a href="#about">关于</a>
    </nav>
  </header>
  <main>
    <section id="fonts">
      <article class="font-card" data-font="fira-code">
        <h2>Fira Code</h2>
        <p>由 Nikita Prokopov 设计</p>
        <span class="badge">连字</span>
      </article>
    </section>
    <form onsubmit="return false">
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
</body>
</html>`,
  },
];
