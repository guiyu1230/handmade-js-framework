import { select, input, confirm } from '@inquirer/prompts';
import os from 'node:os';
import { NpmPackage } from '@colin123-cli/utils';
import path from 'node:path';
import ora from 'ora';
import fse from 'fs-extra';
import { glob } from 'glob';
import ejs from 'ejs';

async function create() {

  const projectTemplate = await select({
    message: '请选择项目模板',
    choices: [
      {
        name: 'react项目',
        value: '@colin123-cli/template-react'
      },
      {
        name: 'vue项目',
        value: '@colin123-cli/template-vue'
      }
    ]
  });

  let projectName = '';
  while (!projectName) {
    projectName = await input({ message: '请输入项目名称' });
  }

  console.log(projectTemplate, projectName);
  // console.log(os.homedir());

  const pkg = new NpmPackage({
    name: projectTemplate,
    targetPath: path.join(os.homedir(), '.colin123-cli-template'),
  })

  if(!await pkg.exists()) {
    const spinner = ora('下载模板中...').start();
    await pkg.install();
    await sleep(1000);
    spinner.succeed('下载模板成功');
  } else if(await pkg.existsAndIsOld()) {
    const spinner = ora('更新模板中...').start();
    await pkg.update();
    await sleep(1000);
    spinner.succeed('更新模板成功');
  } else {
    ora('模板已是最新').succeed();
  }

  const spinner = ora('创建项目中...').start();
  await sleep(1000);

  const templatePath = path.join(pkg.npmFilePath, 'template');
  const targetPath = path.join(process.cwd(), projectName);

  const files = await glob('**', {
    cwd: targetPath,
    nodir: true,
    ignore: 'node_modules/**'
  })

  for(let i = 0; i < files.length; i++) {
    const filePath = path.join(targetPath, files[i]);
    const renderResult = await ejs.renderFile(filePath, { projectName });
    fse.writeFileSync(filePath, renderResult);
  }

  console.log(files);

  if(fse.existsSync(targetPath)) {
    spinner.stop();
    const empty = await confirm({ message: '该目录不为空,  是否清空' });
    if(empty) {
      fse.emptyDirSync(targetPath);
    } else {
      process.exit(0);
    }
  }

  fse.copySync(templatePath, targetPath);

  spinner.succeed('创建项目成功');
}

function sleep(timeout: number) {
  return new Promise((resolve => {
      setTimeout(resolve, timeout);
  }));
}

create();

export default create;