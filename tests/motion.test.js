import test from 'node:test';
import assert from 'node:assert/strict';
import { videoTime, flightPose, frameIndex, damp } from '../src/motion.js';
test('video seeking stays inside duration, including overscroll and unknown metadata',()=>{
 assert.equal(videoTime(-1,12),0);
 assert.equal(videoTime(.5,12),5.98);
 assert.equal(videoTime(2,12),11.96);
 assert.equal(videoTime(.5,NaN),0);
});
test('frame sequence reaches both endpoints and reverses immediately with scroll',()=>{
 assert.equal(frameIndex(-.5,192),0);
 assert.equal(frameIndex(1,192),191);
 assert.equal(frameIndex(2,192),191);
 assert.ok(frameIndex(.4,192)<frameIndex(.5,192));
 assert.equal(frameIndex(NaN,192),0);
});
test('scroll smoothing converges without overshooting in either direction',()=>{
 let value=0;
 for(let i=0;i<120;i++)value=damp(value,1,1/60);
 assert.ok(value>.999&&value<=1);
 for(let i=0;i<120;i++)value=damp(value,0,1/60);
 assert.ok(value<.001&&value>=0);
});
test('aircraft reveals its engineering wireframe before the final departure',()=>{
 assert.equal(flightPose(0).wire,0);
 assert.ok(flightPose(.72).wire>.9);
 assert.ok(Math.abs(flightPose(.72).rx-flightPose(0).rx)>.5);
 assert.ok(flightPose(1).scale<flightPose(.72).scale);
});
test('aircraft travels between sides and departs beyond the viewport before the footer',()=>{
 assert.ok(flightPose(0).x>0);
 assert.ok(flightPose(.5).x<0);
 assert.ok(flightPose(1).x>10);
 for(let p=0;p<=1;p+=.01)for(const v of Object.values(flightPose(p)))assert.ok(Number.isFinite(v));
});
