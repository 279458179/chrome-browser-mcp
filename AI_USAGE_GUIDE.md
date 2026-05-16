# Chrome Browser MCP Server - AI 使用指南

> 本文档专为 AI 大模型（Claude、OpenAI、Hermes 等）编写，帮助你理解并高效使用此 MCP 服务。

---

## 一、核心概念：你将获得什么能力

通过本 MCP 服务器，你将获得 **完整的浏览器操控能力**：

- **感知页面**：获取页面内容、截图、DOM 结构
- **执行操作**：点击、输入、滚动、导航
- **管理状态**：多标签页、Cookie、localStorage
- **调试能力**：网络请求监控、控制台日志、执行 JavaScript

**核心优势**：
1. **登录状态保留** — 使用用户真实的 Chrome profile，Gmail、GitHub 等已登录服务可直接访问
2. **Token 高效** — 使用 accessibility tree（100-500 tokens）而非截图（2000-5000 tokens）
3. **自动连接** — 无需配置，自动检测并连接用户的 Chrome

---

## 二、安装与配置

### 前置条件

- Node.js >= 18.0.0
- Chrome 浏览器已安装

### 安装方式

**方式一：NPM 全局安装**
```bash
npm install -g chrome-browser-mcp
```

**方式二：从源码安装**
```bash
git clone https://github.com/279458179/chrome-browser-mcp.git
cd chrome-browser-mcp
npm install
npm link
```

### MCP 配置

根据你运行的 AI 客户端，添加以下配置：

**Claude Desktop** — 配置文件位置：
- macOS/Linux: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Claude Code CLI** — 配置文件位置：
- `.claude/settings.json`（项目级）或 `~/.claude/settings.json`（全局）

配置内容：
```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "chrome-browser-mcp"
    }
  }
}
```

### 环境变量（可选）

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `CHROME_PROFILE_PATH` | 自定义 Chrome profile 路径 | 用户默认 profile |
| `CHROME_EXECUTABLE_PATH` | 自定义 Chrome 可执行文件路径 | 自动检测 |
| `CHROME_DEBUGGING_PORT` | 远程调试端口 | 9222 |

---

## 三、工具详解与最佳实践

### 3.1 连接管理

#### `browser_connect`

**描述**：连接到 Chrome 浏览器。自动检测现有 Chrome 或启动新实例。

**何时使用**：
- 开始任何浏览器操作前，首先调用此工具
- 如果之前的操作报错 "not connected"，调用此工具重新连接

**参数**：
- `profilePath`（可选）：指定 Chrome profile 路径
- `debuggingPort`（可选）：指定调试端口，默认 9222
- `headless`（可选）：是否无头模式，默认 false

**最佳实践**：
```
1. 用户请求涉及网页操作时，立即调用 browser_connect
2. 不需要每次操作都调用 — 连接会保持
3. 优先使用默认配置，除非用户明确要求
```

#### `browser_disconnect`

**描述**：断开浏览器连接，保留用户会话。

**何时使用**：
- 完成所有浏览器任务后
- 用户明确要求关闭连接

---

### 3.2 导航工具

#### `browser_navigate`

**描述**：导航到指定 URL。

**参数**：
- `url`：目标 URL（必填）
- `timeout`：超时时间（可选）

**使用示例**：
```
browser_navigate(url: "https://github.com")
browser_navigate(url: "https://mail.google.com", timeout: 30000)
```

#### `browser_back` / `browser_forward` / `browser_reload`

**描述**：浏览器历史导航。

**何时使用**：
- `browser_back`：返回上一页
- `browser_forward`：前进到下一页  
- `browser_reload`：刷新当前页

---

### 3.3 内容获取工具 — 核心能力

#### `browser_snapshot` ⭐ 最重要

**描述**：获取页面的 accessibility tree，包含元素 UID。

**为什么优先使用此工具**：
- Token 消耗极低（100-500 tokens vs 截图的 2000-5000）
- 包含交互所需的元素 UID
- 比 CSS selector 更稳定可靠

**何时使用**：
- **每次交互前必须先调用**，获取页面结构
- 需要了解页面有哪些可交互元素时

**返回格式示例**：
```
Accessibility Tree Snapshot:
---
[uid_1] WebArea: "GitHub"
  [uid_2] button: "Sign in"
  [uid_3] link: "Pull requests"
  [uid_4] textbox: "Search" (value: "")
  [uid_5] button: "New repository"
---
```

**关键理解**：
- `[uid_X]` 是元素的唯一标识符
- 交互工具（click, fill）可以使用这个 UID
- role 字段表示元素类型（button, link, textbox 等）

#### `browser_screenshot`

**描述**：获取页面截图。

**参数**：
- `fullPage`：是否截取整页（可选）
- `path`：保存路径（可选）

**何时使用**：
- 需要视觉验证页面外观
- 用户明确要求截图
- accessibility tree 无法理解时作为补充

**注意**：Token 消耗高，谨慎使用。

#### `browser_get_text`

**描述**：获取页面文本内容。

**参数**：
- `selector`：CSS 选择器（可选），不填则获取全部文本

**何时使用**：
- 需要提取特定文本内容
- 需要读取页面中的数据（价格、标题、内容等）

#### `browser_get_html`

**描述**：获取完整 HTML。

**何时使用**：
- 需要分析页面结构
- debugging 时查看实际 DOM

#### `browser_get_url` / `browser_get_title`

**描述**：获取当前 URL 和页面标题。

**何时使用**：
- 验证导航是否成功
- 确认当前页面状态

---

### 3.4 交互工具 — 执行操作

#### `browser_click`

**描述**：点击元素。

**参数**：
- `target`：元素 UID 或 CSS selector（必填）
- `doubleClick`：是否双击（可选）

**最佳实践**：
```
1. 先调用 browser_snapshot 获取 UID
2. 使用 UID 作为 target（如 "uid_5"）
3. UID 比 CSS selector 更稳定
```

**使用示例**：
```
browser_click(target: "uid_3")  // 使用 UID
browser_click(target: "#submit-button")  // 使用 CSS selector
```

#### `browser_fill` ⭐ 常用

**描述**：填写输入框、下拉选择框。

**参数**：
- `target`：元素 UID 或 CSS selector（必填）
- `value`：要填写的值（必填）
- `clear`：是否先清空（可选）
- `submit`：填写后是否按 Enter（可选）

**何时使用**：
- 填写表单
- 输入搜索内容
- 选择下拉选项

**使用示例**：
```
browser_fill(target: "uid_4", value: "mcp server", submit: true)  // 搜索框
browser_fill(target: "uid_10", value: "john@example.com", clear: true)
```

#### `browser_type`

**描述**：向当前焦点元素输入文本。

**参数**：
- `text`：要输入的文本
- `submitKey`：输入后按键（如 "Enter", "Tab"）

**何时使用**：
- 已经点击了输入框，只需输入文本
- 不确定具体元素 selector 时

#### `browser_hover`

**描述**：悬停在元素上。

**何时使用**：
- 触发下拉菜单
- 查看 tooltip
- 测试悬停效果

#### `browser_press_key`

**描述**：按键或组合键。

**参数**：
- `key`：按键名称或组合

**常用按键**：
- 单键：`Enter`, `Escape`, `Tab`, `Backspace`, `ArrowDown`
- 组合：`Control+A`, `Control+C`, `Control+V`, `Meta+Enter`

**使用示例**：
```
browser_press_key(key: "Enter")
browser_press_key(key: "Control+A")  // 全选
browser_press_key(key: "Escape")  // 关闭弹窗
```

#### `browser_scroll`

**描述**：滚动页面。

**参数**：
- `x`：水平滚动量（可选）
- `y`：垂直滚动量（可选）
- `selector`：滚动到指定元素（可选）

**使用示例**：
```
browser_scroll(y: 500)  // 向下滚动 500px
browser_scroll(selector: "#comments")  // 滚动到评论区
```

#### `browser_drag`

**描述**：拖拽元素。

**参数**：
- `source`：源元素
- `target`：目标元素

---

### 3.5 标签页管理

#### `browser_new_page`

**描述**：打开新标签页。

**参数**：
- `url`：新标签页打开的 URL（可选）

#### `browser_list_pages`

**描述**：列出所有标签页。

**返回格式**：
```
page_1: GitHub (https://github.com) [ACTIVE]
page_2: Gmail (https://mail.google.com)
```

#### `browser_select_page`

**描述**：切换到指定标签页。

**参数**：
- `pageId`：标签页 ID

#### `browser_close_page`

**描述**：关闭标签页。

**参数**：
- `pageId`：要关闭的标签页 ID（可选，不填关闭当前页）

---

### 3.6 等待与同步

#### `browser_wait_for`

**描述**：等待文本或元素出现。

**参数**：
- `text`：等待特定文本出现（可选）
- `selector`：等待特定元素出现（可选）
- `timeout`：超时时间（可选）

**何时使用**：
- 页面加载慢时等待内容出现
- 等待 AJAX 加载完成
- 等待弹窗或对话框出现

**使用示例**：
```
browser_wait_for(text: "Results loaded", timeout: 10000)
browser_wait_for(selector: ".notification", timeout: 5000)
```

---

### 3.7 JavaScript 执行

#### `browser_evaluate`

**描述**：在页面中执行 JavaScript。

**参数**：
- `script`：JavaScript 代码

**何时使用**：
- 需要获取页面数据（如 `document.querySelector(...).innerText`）
- 需要执行页面特定操作
- accessibility tree 无法满足需求时

**使用示例**：
```
browser_evaluate(script: "document.querySelectorAll('.price').map(e => e.innerText)")
browser_evaluate(script: "localStorage.getItem('token')")
```

---

### 3.8 网络监控

#### `browser_start_network_monitor`

**描述**：开始监控网络请求。

**何时使用**：
- 需要分析 API 调用
- debugging 网络问题
- 查看页面加载了哪些资源

#### `browser_list_network_requests`

**描述**：列出捕获的网络请求。

**参数**：
- `resourceTypes`：按类型过滤（document, script, xhr, fetch 等）

#### `browser_stop_network_monitor`

**描述**：停止监控。

---

### 3.9 控制台监控

#### `browser_start_console_monitor`

**描述**：开始监控控制台消息。

#### `browser_list_console_messages`

**描述**：列出控制台消息。

**参数**：
- `types`：按类型过滤（log, warn, error, info, debug）

#### `browser_stop_console_monitor`

**描述**：停止监控。

---

### 3.10 存储访问

#### `browser_get_cookies`

**描述**：获取 cookies。

**参数**：
- `domain`：按域名过滤（可选）

#### `browser_set_cookie`

**描述**：设置 cookie。

#### `browser_get_local_storage`

**描述**：获取 localStorage 内容。

#### `browser_set_local_storage`

**描述**：设置 localStorage。

---

### 3.11 设备模拟

#### `browser_emulate_viewport`

**描述**：设置视口尺寸。

**参数**：
- `width`：宽度
- `height`：高度

#### `browser_emulate_device`

**描述**：模拟特定设备。

**参数**：
- `device`：设备名称（如 "iPhone 12", "iPad Pro"）

#### `browser_set_user_agent`

**描述**：设置自定义 User-Agent。

#### `browser_set_geolocation`

**描述**：设置地理位置。

**参数**：
- `latitude`：纬度
- `longitude`：经度
- `accuracy`：精度（可选）

#### `browser_emulate_color_scheme`

**描述**：模拟颜色方案。

**参数**：
- `scheme`：`"light"` 或 `"dark"`

---

## 四、标准工作流程

### 流程 A：页面导航与信息提取

```
Step 1: browser_connect()          // 连接浏览器
Step 2: browser_navigate(url)      // 导航到目标页面
Step 3: browser_wait_for(...)      // 等待页面加载（如需要）
Step 4: browser_snapshot()         // 获取 accessibility tree
Step 5: browser_get_text(...)      // 提取所需文本（如需要）
Step 6: 向用户报告结果
```

### 流程 B：表单填写与提交

```
Step 1: browser_connect()
Step 2: browser_navigate(url)
Step 3: browser_snapshot()         // 获取表单元素 UID
Step 4: browser_fill(target: uid_X, value: "...")  // 填写各字段
Step 5: browser_click(target: uid_submit)          // 点击提交
Step 6: browser_wait_for(text: "Success")          // 等待确认
```

### 流程 C：登录后操作（利用已有 session）

```
Step 1: browser_connect()          // 自动使用用户 profile
Step 2: browser_navigate(url)      // 如 Gmail，已登录状态
Step 3: browser_snapshot()         // 获取页面结构
Step 4: 执行后续操作...
```

### 流程 D：多标签页操作

```
Step 1: browser_connect()
Step 2: browser_navigate(url_1)
Step 3: browser_new_page(url_2)    // 打开第二个标签页
Step 4: browser_list_pages()       // 查看所有标签页
Step 5: browser_select_page(pageId: "page_1")  // 切回第一个
Step 6: 执行操作...
```

---

## 五、UID vs CSS Selector：如何选择

### UID（推荐）

**优点**：
- 更稳定，不受页面结构变化影响
- 直接来自 accessibility tree，语义清晰
- 自动生成，无需猜测

**使用方式**：
```
1. 调用 browser_snapshot()
2. 从输出中识别目标元素的 UID（如 [uid_5]）
3. 在 click/fill 中使用 "uid_5"
```

### CSS Selector

**适用场景**：
- 元素在 accessibility tree 中不可见
- 需要精确定位特定元素
- 已知固定 selector

**使用方式**：
```
browser_click(target: "#submit-button")
browser_fill(target: "input[name='email']")
```

---

## 六、常见场景示例

### 场景 1：搜索并获取结果

```
用户请求："在 GitHub 上搜索 MCP server 相关项目"

执行步骤：
1. browser_connect()
2. browser_navigate(url: "https://github.com")
3. browser_snapshot()
4. browser_fill(target: "uid_search_box", value: "MCP server", submit: true)
5. browser_wait_for(selector: ".repo-list")
6. browser_snapshot()
7. browser_get_text(selector: ".repo-list-item")
8. 向用户报告找到的项目
```

### 场景 2：发送邮件（Gmail 已登录）

```
用户请求："给 john@example.com 发邮件，主题 Meeting"

执行步骤：
1. browser_connect()
2. browser_navigate(url: "https://mail.google.com")
3. browser_wait_for(text: "Compose")
4. browser_snapshot()
5. browser_click(target: "uid_compose_button")
6. browser_wait_for(selector: "[aria-label='To']")
7. browser_fill(target: "uid_to_field", value: "john@example.com")
8. browser_fill(target: "uid_subject_field", value: "Meeting")
9. browser_click(target: "uid_send_button")
```

### 场景 3：网页数据抓取

```
用户请求："获取 Hacker News 前 5 条新闻标题"

执行步骤：
1. browser_connect()
2. browser_navigate(url: "https://news.ycombinator.com")
3. browser_snapshot()
4. browser_get_text(selector: ".titleline > a")
5. 解析并返回前 5 条
```

### 场景 4：填写复杂表单

```
用户请求："在 signup 页面填写注册表"

执行步骤：
1. browser_connect()
2. browser_navigate(url: "https://example.com/signup")
3. browser_snapshot()
4. browser_fill(target: "uid_name", value: "John Doe", clear: true)
5. browser_fill(target: "uid_email", value: "john@example.com", clear: true)
6. browser_fill(target: "uid_password", value: "SecurePass123")
7. browser_click(target: "uid_terms_checkbox")
8. browser_click(target: "uid_submit")
9. browser_wait_for(text: "Welcome")
```

---

## 七、错误处理与调试

### 常见错误及解决

#### 错误：Chrome not found

**解决**：
```bash
# 设置环境变量指定 Chrome 路径
export CHROME_EXECUTABLE_PATH=/path/to/chrome
```

#### 错误：Profile in use

**原因**：Chrome 已被其他进程使用。

**解决**：
- 关闭所有 Chrome 窗口
- 或使用不同的 profile：
```
browser_connect(profilePath: "/path/to/alternate/profile")
```

#### 错误：Element not found

**解决**：
1. 重新调用 `browser_snapshot()` 获取最新 UID
2. 使用 `browser_wait_for()` 等待元素出现
3. 尝试使用 CSS selector 替代 UID

#### 错误：Timeout

**解决**：
- 增加超时时间：`browser_navigate(url, timeout: 60000)`
- 使用 `browser_wait_for()` 等待关键元素

### 调试技巧

1. **网络监控**：
```
browser_start_network_monitor()
执行操作...
browser_list_network_requests(resourceTypes: ["xhr", "fetch"])
```

2. **控制台监控**：
```
browser_start_console_monitor()
执行操作...
browser_list_console_messages(types: ["error", "warn"])
```

3. **JavaScript 调试**：
```
browser_evaluate(script: "console.log(document.activeElement)")
```

---

## 八、性能优化建议

### 减少 Token 消耗

1. **优先使用 `browser_snapshot`** 而非 `browser_screenshot`
2. **使用 `browser_get_text` + selector** 定位提取，而非获取全文
3. **避免频繁重新 snapshot** — UID 在同一页面会保持有效

### 提高操作可靠性

1. **导航后等待**：`browser_navigate()` 后调用 `browser_wait_for()`
2. **操作前确认**：交互前先 `browser_snapshot()` 确认元素存在
3. **分步执行**：复杂操作拆分为多步，每步验证结果

---

## 九、总结：核心要点

1. **每次任务开始**：先 `browser_connect()`
2. **每页操作开始**：先 `browser_snapshot()` 获取 UID
3. **交互使用 UID**：比 CSS selector 更稳定
4. **等待加载完成**：使用 `browser_wait_for()`
5. **优先 snapshot**：比 screenshot 省大量 token
6. **利用 session**：用户已登录的网站可直接操作

---

## 十、工具清单速查

| 类别 | 工具 | 核心用途 |
|------|------|----------|
| 连接 | `browser_connect` | 开始任务时调用 |
| 导航 | `browser_navigate` | 打开页面 |
| 内容 | `browser_snapshot` | ⭐ 获取 UID，最常用 |
| 内容 | `browser_get_text` | 提取文本 |
| 交互 | `browser_click` | 点击元素 |
| 交互 | `browser_fill` | ⭐ 填写表单，最常用 |
| 交互 | `browser_press_key` | 按键操作 |
| 标签 | `browser_list_pages` | 管理多标签页 |
| 等待 | `browser_wait_for` | 等待加载 |

---

*此文档应帮助你以 90%+ 的效能使用 Chrome Browser MCP Server。如有疑问，参考源码或提交 issue。*