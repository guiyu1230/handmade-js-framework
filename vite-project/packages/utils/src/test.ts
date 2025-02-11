import NpmPackage from "./NpmPackage.js";
import path from 'node:path';
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pkg = new NpmPackage({
    targetPath: path.join(dirname, '../aaa'),
    name: '@babel/core'
  })

  if(await pkg.exists()) {
    await pkg.update();
  } else {
    await pkg.install();
  }

  console.log(await pkg.getPackageJSON())
}

main();
