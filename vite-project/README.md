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

### 创建 cli 和 create 包

```sh
mkdir packages/cli packages/create

cd packages/cli

npm init -y

cd ../create

npm init -y
```

然后给`create`和`cli`包添加发布包设置:

1. 给`create`和`cli`包的`package.json`修改`name`名字`@colin123-cli/create`和`@colin123-cli/cli`且
2. 给`create`和`cli`包的`package.json`设置发布权限为公共`publishConfig: { access: "public" }`

-  cli 包添加 create 包为依赖

```sh
# 必须是package.json里的name而不是文件夹名create
pnpm --filter cli add @colin123-cli/create --workspace
# 在根项目安装 typescript
pnpm add typescript @types/node -w --save-dev
# 给cli项目执行ts初始化. 将ts作为打包编译器
pnpm --filter cli exec npx tsc --init
# 给create项目执行ts初始化. 将ts作为打包编译器
pnpm --filter create exec npx tsc --init
```

### 创建create代码执行编译打包
```bash
pnpm --filter create exec npx tsc
```

### 创建cli代码
```js
#!/usr/bin/env node
import create from '@guang-cli/create';
import { Command } from 'commander';
import fse from 'fs-extra';
import path from 'node:path';

const pkgJson = fse.readJSONSync(path.join(import.meta.dirname, '../package.json'));

const program = new Command();

program
  .name('guang-cli')
  .description('脚手架 cli')
  .version(pkgJson.version);

program.command('create')
  .description('创建项目')
  .action(async () => {
      create();
  });

program.parse();
```

### 安装依赖和打包编译
```bash
pnpm --filter cli add commander fs-extra

pnpm --filter cli add --save-dev @types/fs-extra

pnpm --filter cli exec npx tsc 

pnpm --filter cli exec node ./dist/index.js create
```

再添加`bin`配置 `"bin": { "colin-cli": "dist/index.js" }`

### 发布包
```bash
# 添加changelog日志
git add .
git commit -m 'cli 包、create 包初始化'
npx changeset add
npx changeset version
npm adduser

# changeset多包发布
git add .
git commit -m 'cli create 0.0.2'

npx changeset publish
```

#### 测试效果
```bash
$ npx @colin123-cli/cli create
# create 命令执行中...
```

### npm版本信息获取
- 创建`packages/utils`文件夹项目. 初始化项目命名`package.json`的`name: @guang-cli/utils`
```bash
# 创建项目
mkdir packages/utils

cd packages/utils

npm init -y
# ts初始化
pnpm --filter utils exec npx tsc --init
```