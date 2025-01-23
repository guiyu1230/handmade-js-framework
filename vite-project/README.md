## monorepo脚手架cli、项目模板封装

monorepo 的形式管理，分为 template-vue、template-react 三个包，以及 cli、create 这几个包。

首先使用scope创建`@colin123-cli`组织 然后创建monorepo项目

```bash
mkdir vite-project
cd vite-project
npm init -y
```

然后主项目package.json设置`private: true`. 不参与发布

添加 pnpm-workspace.yaml 配置文件：`packages: - 'packages/*'`

创建 template-react 和 template-vue 包，我们直接复制 create-vite 的项目模版过来
把 template-react-ts 和 template-vue-ts 复制出来，到项目的 packages 目录下：
分别放到 packages/template-vue/template 目录，packages/template-react/template 目录

```bash
npm install --no-save create-vite
cd packages/template-vue
npm init -y
cd ../template-react
npm init -y
```

name 加上 scope，并且加上 publishConfig 指定这个是公开访问的包. `publishConfig: {"access": "public"}`

### 登录npm账号. 使用changeset
- `npm login`登录npm账号 

#### 安装changeset. 执行`安装changeset init`初始化. 会多一个 .changeset 目录：
```bash
pnpm add --save-dev -w @changesets/cli prettier-plugin-organize-imports prettier-plugin-packagejson

npx changeset init
```

#### 执行`changeset add`: 添加changeset的changelog记录
```bash
git add .

git commit -m '初始化项目，创建 template-react template-vue'

npx changeset add
```

#### 执行`changeset version`命令来生成最终的 CHANGELOG.md 还有更新版本信息：
```bash
npx changeset version
```

### 执行 changeset publish 命令：
- `changeset publish`可对于monorepo多包同时发布
- 其相当于执行`npm publish`发布
- 同时会给最新的 `commit` 打 `tag`。
```bash
git add .
git commit -m '项目模版 1.1.0'

npx changeset publish
```