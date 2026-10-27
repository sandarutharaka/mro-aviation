export const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
export const videoTime=(progress,duration)=>Number.isFinite(duration)&&duration>0?clamp(progress)*Math.max(0,duration-.04):0;
export const frameIndex=(progress,count)=>Math.round(clamp(progress)*Math.max(0,count-1));
export const damp=(value,target,dt,speed=11)=>value+(target-value)*(1-Math.exp(-speed*Math.min(.1,Math.max(0,dt))));
export const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};
export function flightPose(progress){
 const keys=[{p:0,x:2.1,y:.1,rx:.16,ry:-.9,rz:-.12,scale:1,wire:0},{p:.23,x:2.1,y:.1,rx:.3,ry:-.55,rz:.06,scale:1.07,wire:0},{p:.43,x:-2.5,y:0,rx:.58,ry:.65,rz:-.22,scale:.94,wire:0},{p:.55,x:-2.5,y:0,rx:.65,ry:1,rz:-.05,scale:1,wire:.1},{p:.7,x:2.1,y:.1,rx:1.15,ry:2.65,rz:.12,scale:1.08,wire:1},{p:.85,x:2.1,y:.1,rx:1.25,ry:3.2,rz:.15,scale:1.08,wire:1},{p:1,x:16,y:5,rx:.6,ry:4.2,rz:-.45,scale:.35,wire:0}];
 const p=clamp(progress),i=Math.max(0,keys.findIndex(k=>k.p>=p)-1),a=keys[i],b=keys[i+1],t=smooth(a.p,b.p,p);
 return Object.fromEntries(['x','y','rx','ry','rz','scale','wire'].map(k=>[k,a[k]+(b[k]-a[k])*t]));
}
