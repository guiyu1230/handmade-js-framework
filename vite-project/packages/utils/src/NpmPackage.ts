import fs from 'node:fs';
import fse from 'fs-extra';
import path from 'node:path';
// @ts-ignore
import npminstall from 'npminstall';
import { getLatestVersion, getNpmRegistry } from './versionUtils.js';

export interface NpmPackageOptions {
  name: string;
  targetPath: string;
}

class NpmPackage {
  name: string = '';
  version: string = '';
  targetPath: string = '';
  storePath: string = '';

  constructor(options: NpmPackageOptions) {
    this.name = options.name;
    this.targetPath = options.targetPath;
    this.storePath = path.resolve(options.targetPath, 'node_modules');
  }

  async prepare() {
    if(!fs.existsSync(this.storePath)) {
      fse.mkdirpSync(this.targetPath);
    }
    const version = await getLatestVersion(this.name);
    this.version = version;
  }

  async install() {
    await this.prepare();

    await npminstall({
      pkgs:[
        {
          name: this.name,
          version: this.version
        }
      ],
      register: getNpmRegistry(),
      root: this.targetPath
    });
  }

  get npmFilePath() {
    return path.resolve(this.storePath, `.store/${this.name.replace('/', '+')}@${this.version}/node_modules/${this.name}`);
  }

  async exists() {
    await this.prepare();

    return fs.existsSync(this.npmFilePath);
  }

  // 判断模板是否存在且是旧版本
  async existsAndIsOld() {
    if(await this.exists()) {
      const latestVersion = await this.getLatestVersion();
      const packageJSON = await this.getPackageJSON();
      return packageJSON.version !== latestVersion;
    }
    return false;
  }

  async getPackageJSON() {
    if(await this.exists()) {
      return fse.readJSONSync(path.resolve(this.npmFilePath, 'package.json'));
    }
    return null;
  }

  async getLatestVersion() {
    return getLatestVersion(this.name);
  }

  async update() {
    const latestVersion = await this.getLatestVersion();
    return npminstall({
      root: this.targetPath,
      register: getNpmRegistry(),
      pkgs: [
        {
          name: this.name,
          version: latestVersion,
        }
      ]
    })
  }
}

export default NpmPackage;