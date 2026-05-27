// postbuild: sync root version.json → server/version.json
import { copyFileSync, readFileSync } from 'node:fs';

copyFileSync('version.json', 'server/version.json');
const { version } = JSON.parse(readFileSync('version.json', 'utf-8'));
console.log(`[version] server/version.json updated to ${version}`);
