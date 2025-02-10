import { getLatestVersion } from './versionUtils.js';

(async() => {
  const info = await getLatestVersion('create-vite');

  console.log(info);
})()
