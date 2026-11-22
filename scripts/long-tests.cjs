// The long versions of the random-sequence and crash tests: thousands of random store actions per store and many
// more kills. `npm run test:long` (about 45 minutes); add `--steps <n>`, `--seeds <n>` or `--rounds <n>` to change them.
const {spawnSync}=require('node:child_process'),path=require('node:path');
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const env={...process.env,SLOTFORGE_FUZZ_STEPS:arg('--steps','3000'),SLOTFORGE_FUZZ_SEEDS:arg('--seeds','6'),SLOTFORGE_CRASH_ROUNDS:arg('--rounds','40')};
console.log(`Random sequences: ${env.SLOTFORGE_FUZZ_STEPS} actions × ${env.SLOTFORGE_FUZZ_SEEDS} seeds per store · crash tests: ${env.SLOTFORGE_CRASH_ROUNDS} kills per kind`);
const r=spawnSync(process.execPath,['--test','--test-reporter=spec',...['storage-sequences','crash'].map(n=>path.join(__dirname,'../tests',n+'.test.cjs'))],{stdio:'inherit',env});
process.exit(r.status??1);
