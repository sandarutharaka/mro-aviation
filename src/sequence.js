import {frameIndex} from './motion.js';

// Keep compressed frames in memory; retain only a small window of decoded frames.
export function createSequence(canvas,count=192){
 const context=canvas.getContext('2d',{alpha:false}),blobs=new Map(),requests=new Map(),bitmaps=new Map();
 let target=0,last=-1,busy=false,started=false,retryAfter=0,width=0,height=0;
 async function fetchFrame(index){
  if(blobs.has(index))return blobs.get(index);
  if(requests.has(index))return requests.get(index);
  const pending=fetch(`/assets/hangar-frames/${String(index+1).padStart(3,'0')}.webp`).then(r=>{if(!r.ok)throw new Error('Frame unavailable');return r.blob();}).then(blob=>{blobs.set(index,blob);requests.delete(index);return blob;}).catch(e=>{requests.delete(index);throw e;});
  requests.set(index,pending);return pending;
 }
 function paint(bitmap){
  const ratio=Math.max(canvas.width/bitmap.width,canvas.height/bitmap.height);
  const w=bitmap.width*ratio,h=bitmap.height*ratio;
  context.drawImage(bitmap,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
  document.body.classList.add('frames-ready');
 }
 async function decode(){
  if(busy||Date.now()<retryAfter)return;busy=true;
  try{
   while(last!==target){
    const index=target;
    let bitmap=bitmaps.get(index);
    if(!bitmap){const blob=await fetchFrame(index);bitmap=await createImageBitmap(blob,{resizeWidth:Math.min(1600,Math.max(960,innerWidth)),resizeQuality:'high'});bitmaps.set(index,bitmap);}
    if(Math.abs(target-index)<5){paint(bitmap);last=index;}
    while(bitmaps.size>12){const key=bitmaps.keys().next().value;if(key===index){bitmaps.delete(key);bitmaps.set(key,bitmap);continue;}bitmaps.get(key).close();bitmaps.delete(key);}
   }
  }catch(error){last=-1;retryAfter=Date.now()+1000;document.body.classList.remove('frames-ready');console.warn('Hangar frame unavailable; showing poster until retry.',error);}finally{busy=false;}
 }
 function resize(){const dpr=Math.min(devicePixelRatio,1.5),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(w!==width||h!==height){width=w;height=h;canvas.width=w;canvas.height=h;last=-1;}}
 async function prefetch(){
  // Coarse coverage first makes fast scroll jumps useful before all frames arrive.
  const coarse=Array.from({length:Math.ceil(count/8)},(_,i)=>i*8),all=Array.from({length:count},(_,i)=>i).filter(i=>i%8!==0),queue=[...coarse,...all];
  async function worker(){while(queue.length){const index=queue.shift();try{await fetchFrame(index);}catch{}}}
  await Promise.all([worker(),worker(),worker()]);
 }
 return {update(progress,reduced=false){resize();target=frameIndex(reduced?0:progress,count);decode();if(!started&&!reduced){started=true;prefetch();}},resize};
}
