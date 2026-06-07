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
    code: `// 现代 JavaScript — 箭头函数、模板字符串、解构
const greet = (name) => \`Hello, \${name}!\`;

const user = { name: 'Alice', role: 'developer' };
const { name, role } = user;

const fetchData = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
};

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

console.log(greet(name), role, doubled, evens);`,
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    code: `// TypeScript — 类型注解、接口、泛型
interface User {
  id: number;
  name: string;
  email?: string;
}

type Role = 'admin' | 'editor' | 'viewer';

function getUser<T extends User>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

class DataStore<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): readonly T[] {
    return this.items;
  }
}

const store = new DataStore<User>();
store.add({ id: 1, name: 'Alice', email: 'alice@example.com' });
console.log(getUser(store.getAll(), 1)?.name ?? 'Not found');`,
  },
  {
    key: 'python',
    label: 'Python',
    language: 'python',
    code: `# Python — 函数、列表推导式、with 语句
def fibonacci(n: int) -> list[int]:
    """生成前 n 个斐波那契数。"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

# 列表推导式
squares = [x ** 2 for x in range(10) if x % 2 == 0]

# With 语句（上下文管理器）
with open('config.json', 'r') as f:
    config = json.load(f)

# 装饰器
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f'{func.__name__} took {time.time() - start:.3f}s')
        return result
    return wrapper

print(fibonacci(10))
print(squares)`,
  },
  {
    key: 'json',
    label: 'JSON',
    language: 'json',
    code: `{
  "name": "fontcode",
  "version": "1.0.0",
  "description": "编程字体预览平台",
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
      "foreground": "#e8d5bc"
    },
    "light": {
      "background": "#f8f8f0",
      "foreground": "#725d42"
    }
  },
  "settings": {
    "fontSize": 14,
    "tabSize": 2,
    "ligatures": true
  }
}`,
  },
  {
    key: 'html',
    label: 'HTML',
    language: 'html',
    code: `<!-- HTML5 — 语义标签、属性、嵌套结构 -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FontCode — Programming Font Preview</title>
</head>
<body>
  <header class="app-header">
    <h1>FontCode 🏝</h1>
    <nav aria-label="Main">
      <a href="#fonts">Fonts</a>
      <a href="#about">About</a>
    </nav>
  </header>
  <main>
    <section id="fonts" class="font-grid">
      <article class="font-card" data-font="fira-code">
        <h2>Fira Code</h2>
        <p>Designed by Nikita Prokopov</p>
      </article>
    </section>
  </main>
  <footer>&copy; 2026 FontCode</footer>
</body>
</html>`,
  },
];
