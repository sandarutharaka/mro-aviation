import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clamp,damp,flightPose,smooth} from './motion.js';

export async function initAircraft(){
 const canvas=document.querySelector('#aircraft-canvas'),storyHost=document.querySelector('.flight-sticky'),departureHost=document.querySelector('.departure-sticky');
 document.querySelector('#departure-canvas').hidden=true;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,1.9,12);camera.lookAt(0,0,0);
 const generator=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=generator.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=1.1;room.dispose();generator.dispose();
 scene.add(new THREE.HemisphereLight(0xd5e5ff,0x1b3559,2));
 const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-4,7,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0x438cff,5);rim.position.set(3,2,-5);scene.add(rim);
 const fill=new THREE.DirectionalLight(0x9dc5ff,1.5);fill.position.set(5,0,5);scene.add(fill);
 const group=new THREE.Group();scene.add(group);
 const loader=new GLTFLoader(),cache=new Map();let current=null,selected='A350',loadVersion=0,contextLost=false,lastWire=-1;
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;document.body.classList.remove('webgl-ready');});canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;document.body.classList.add('webgl-ready');});
 async function load(name){
  let item=cache.get(name);if(item)return item;
  const {scene:model}=await loader.loadAsync(`/assets/${name}_nologo.glb`);
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=6.1/Math.max(size.x,size.y,size.z);
  model.scale.multiplyScalar(scale);model.position.sub(center.multiplyScalar(scale));
  const wrapper=new THREE.Group();wrapper.add(model);wrapper.rotation.y=Math.PI/2;
  const meshes=[];model.traverse(object=>{if(object.isMesh)meshes.push(object);});
  const solids=[],wires=[];
  for(const mesh of meshes){
   mesh.material=mesh.material.clone();mesh.material.metalness=.32;mesh.material.roughness=.29;mesh.material.transparent=true;solids.push(mesh.material);
   const material=new THREE.LineBasicMaterial({color:0x83b7ff,transparent:true,opacity:0,depthWrite:false});
   const wire=new THREE.LineSegments(new THREE.WireframeGeometry(mesh.geometry),material);wire.visible=false;mesh.add(wire);wires.push(wire);
  }
  item={wrapper,solids,wires};cache.set(name,item);return item;
 }
 async function select(name){
  const version=++loadVersion,status=document.querySelector('.model-status');status.textContent='Loading aircraft…';
  document.querySelectorAll('[data-model]').forEach(b=>b.disabled=true);
  try{
   const item=await load(name);if(version!==loadVersion)return;
   if(current)group.remove(current.wrapper);current=item;selected=name;lastWire=-1;group.add(item.wrapper);
   document.querySelector('#aircraft-name').textContent=`AIRBUS ${name}`;
   const fallback=document.querySelector('.aircraft-fallback');fallback.src=`/assets/${name.toLowerCase()}.jpg`;fallback.alt=`Airbus ${name} aircraft`;
   document.querySelectorAll('[data-model]').forEach(b=>{const on=b.dataset.model===name;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});status.textContent='';
  }catch(error){status.textContent=`Unable to load ${name}. Please try again.`;if(!current)throw error;}
  finally{document.querySelectorAll('[data-model]').forEach(b=>b.disabled=false);}
 }
 await select('A350');document.body.classList.add('webgl-ready');
 document.querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.model!==selected)select(button.dataset.model);}));
 let targetX=0,targetY=0,mouseX=0,mouseY=0,host=storyHost,lastWidth=0,lastHeight=0;
 storyHost.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'){const rect=storyHost.getBoundingClientRect();targetX=(event.clientX/rect.width-.5)*2;targetY=((event.clientY-rect.top)/rect.height-.5)*2;}},{passive:true});storyHost.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
 function setWire(amount){if(Math.abs(amount-lastWire)<.003)return;lastWire=amount;current.solids.forEach(mat=>{mat.opacity=1-amount*.88;mat.depthWrite=amount<.5;});current.wires.forEach(wire=>{wire.visible=amount>.01;wire.material.opacity=amount*.66;});}
 return {render(state,dt){
  if(contextLost||state.reduced||(!state.storyActive&&!state.departureActive))return;
  const departing=state.departureActive,newHost=departing?departureHost:storyHost;
  if(host!==newHost){host=newHost;host.appendChild(canvas);lastWidth=0;}
  const width=host.clientWidth,height=host.clientHeight,mobile=width<=700;
  if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();lastWidth=width;lastHeight=height;}
  mouseX=damp(mouseX,targetX,dt,4);mouseY=damp(mouseY,targetY,dt,4);
  if(departing){
   const p=state.departure,t=smooth(.05,.95,p),spread=mobile?.55:1;
   group.position.set((-3.2+t*20)*spread,-1.8+t*8,-t*12);
   group.rotation.set(.12+t*.2,-.7-t*1.1,-.1-t*.32);
   group.scale.setScalar((mobile?.66:1.1)*(1-t*.7));setWire(0);
  }else{
   const pose=flightPose(state.story),aspect=width/height;
   const x=mobile?(state.story>.88?smooth(.88,1,state.story)*12:0):pose.x*Math.min(1.25,aspect/1.6);
   const y=mobile?-1.15+(state.story>.88?smooth(.88,1,state.story)*6:0):pose.y;
   group.position.set(x,y,0);group.rotation.set(pose.rx+mouseY*.045,pose.ry+mouseX*.13,pose.rz+mouseX*.025);
   group.scale.setScalar(pose.scale*(mobile?clamp(width/640,.52,.9):Math.min(1.12,aspect/1.5)));setWire(pose.wire);
  }
  renderer.render(scene,camera);
 }};
}
