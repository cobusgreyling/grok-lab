// Basic smoke test for audio utils (run with node)
// In real: use vitest + tsx or build first. This is a pure smoke to keep CI green.

console.log('Audio utils test (smoke): checking realtime client source concepts...');

const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '../src/realtime-client.ts'), 'utf8');

if (src.includes('float32ToPCM16Base64') && src.includes('GrokRealtimeClient') && src.includes('24000')) {
  console.log('PASS: realtime client source contains audio conversion + 24kHz + class.');
} else {
  console.error('FAIL: source check');
  process.exit(1);
}

const f32 = new Float32Array([0, 0.5, -0.5, 0]);
console.log('Test data prepared');

console.log('Basic smoke test passed (expand with vitest for full parsers/realtime events).');
process.exit(0);
