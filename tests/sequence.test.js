import test from 'node:test';
import assert from 'node:assert/strict';
import {createSequence} from '../src/sequence.js';

test('a failed frame restores the poster and a later update recovers after resize',async()=>{
 const originals=Object.fromEntries(['document','fetch','createImageBitmap','innerWidth','devicePixelRatio'].map(k=>[k,globalThis[k]]));
 const originalNow=Date.now,originalWarn=console.warn;
 const classes=new Set(),draws=[];let fail=true,clock=0;
 globalThis.document={body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}}};
 globalThis.innerWidth=1200;globalThis.devicePixelRatio=1;
 globalThis.fetch=async url=>{if(url.endsWith('002.webp')&&fail)throw new Error('Temporary frame error');return{ok:true,blob:async()=>({url})};};
 globalThis.createImageBitmap=async blob=>({width:1600,height:900,url:blob.url,close(){}});
 Date.now=()=>clock;console.warn=()=>{};
 const canvas={clientWidth:1200,clientHeight:800,width:0,height:0,getContext:()=>({drawImage:bitmap=>draws.push(bitmap.url)})};
 const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
 try{
  const sequence=createSequence(canvas,2);sequence.update(0);await flush();
  assert.ok(classes.has('frames-ready'));
  sequence.update(1);await flush();
  assert.equal(classes.has('frames-ready'),false,'poster must return on a frame failure');
  canvas.clientWidth=800;sequence.update(1);await flush();
  assert.equal(classes.has('frames-ready'),false,'resize must retain the poster while retry is pending');
  fail=false;clock=1500;sequence.update(1);await flush();
  assert.ok(classes.has('frames-ready'));
  assert.ok(draws.at(-1).endsWith('002.webp'));
 }finally{for(const[k,value]of Object.entries(originals)){if(value===undefined)delete globalThis[k];else globalThis[k]=value;}Date.now=originalNow;console.warn=originalWarn;}
});
