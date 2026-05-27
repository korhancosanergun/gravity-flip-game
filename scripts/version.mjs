// prebuild: generate a version string and write version.json
import { writeFileSync } from 'node:fs';

const version = Math.floor(Date.now() / 1000).toString();
writeFileSync('version.json', JSON.stringify({ version }, null, 2));
console.log(`[version] Build version: ${version}`);
