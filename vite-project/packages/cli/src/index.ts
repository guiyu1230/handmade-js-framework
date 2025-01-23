#! /usr/bin/env node
import create from '@colin123-cli/create';
import { Command } from 'commander';
import fse from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = fse.readJsonSync(path.join(dirname, '../package.json'));

const program = new Command();

program
  .name('colin123-cli')
  .description('创建项目')
  .version(pkg.version);

program.command('create')
  .description('创建项目')
  .action(() => {
    create();
  });

program.parse(process.argv);