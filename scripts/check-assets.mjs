import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
for(const anchor of anchors)assert.ok(ids.has(anchor),`Missing #${anchor}`);
const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)].map(m=>m[1]);
for(const asset of assets)assert.ok(fs.existsSync(new URL(`../public${asset}`,import.meta.url)),`Missing ${asset}`);
for(let i=1;i<=192;i++)assert.ok(fs.existsSync(new URL(`../public/assets/hangar-frames/${String(i).padStart(3,'0')}.webp`,import.meta.url)),`Missing frame ${i}`);
for(const model of ['A350','A380']){
 const b=fs.readFileSync(new URL(`../public/assets/${model}_nologo.glb`,import.meta.url));
 assert.equal(b.toString('utf8',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
}
console.log(`Verified ${anchors.length} section links, ${assets.length} image references, 192 film frames, and both GLB models.`);
