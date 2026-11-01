const { readdirSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
for (const dir of ['src', 'renderer', 'scripts', 'tests']) {
  for (const file of readdirSync(dir).filter(name => /\.(cjs|js)$/.test(name))) {
    execFileSync(process.execPath, ['--check', `${dir}/${file}`], { stdio: 'inherit' });
  }
}
console.log('JavaScript syntax checks passed.');
