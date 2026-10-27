import {clamp,damp,smooth} from './motion.js';
import {createSequence} from './sequence.js';

const $=selector=>document.querySelector(selector),hero=$('.hero-scroll'),story=$('.flight-story'),departure=$('.departure');
const sequence=createSequence($('#hangar-canvas'));
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference.matches;
let heroValue=0,storyValue=0,departureValue=0,lastTime=0;
const panels=[...document.querySelectorAll('[data-scene]')],phases=[...document.querySelectorAll('.hero-phase')];
let aircraft;
const state={story:0,departure:0,storyActive:false,departureActive:false,reduced};
function setMotion(value){reduced=value;state.reduced=value;document.documentElement.classList.toggle('reduce-motion',value);}
preference.addEventListener('change',e=>setMotion(e.matches));setMotion(reduced);
const menu=$('.menu-toggle'),nav=$('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');nav.classList.remove('open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
$('#year').textContent=new Date().getFullYear();
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}},{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function progress(element){const rect=element.getBoundingClientRect();return{value:clamp(-rect.top/Math.max(1,element.offsetHeight-innerHeight)),active:rect.top<innerHeight&&rect.bottom>0};}
function display(el,opacity,offset=0){el.style.opacity=String(opacity);el.style.visibility=opacity>.005?'visible':'hidden';el.style.transform=`translateY(${offset}px)`;const hidden=opacity<.45;el.setAttribute('aria-hidden',String(hidden));el.inert=hidden;}
function animate(time){
 requestAnimationFrame(animate);if(document.hidden){lastTime=time;return;}
 const dt=Math.min(.1,(time-lastTime)/1000||1/60);lastTime=time;
 const hp=progress(hero),sp=progress(story),dp=progress(departure);
 heroValue=damp(heroValue,hp.value,dt,12);storyValue=damp(storyValue,sp.value,dt,9);departureValue=damp(departureValue,dp.value,dt,9);
 state.story=storyValue;state.departure=departureValue;state.storyActive=sp.active;state.departureActive=dp.active;
 if(hp.active){
  sequence.update(heroValue,reduced);
  const opacities=reduced?[1,0,0]:[1-smooth(.055,.18,heroValue),smooth(.26,.36,heroValue)*(1-smooth(.47,.57,heroValue)),smooth(.72,.83,heroValue)*(1-smooth(.94,1,heroValue))];
  phases.forEach((el,i)=>display(el,opacities[i],(1-opacities[i])*-25));
  $('.hero-media').style.transform=`scale(${1+smooth(.84,1,heroValue)*.09})`;
  $('.film-progress i').style.transform=`scaleX(${heroValue})`;$('.film-step').textContent=String(heroValue<.33?1:heroValue<.7?2:3).padStart(2,'0');
 }
 if(sp.active){
  const opacities=reduced?[1,1,1]:[1-smooth(.23,.32,storyValue),smooth(.32,.4,storyValue)*(1-smooth(.55,.64,storyValue)),smooth(.64,.72,storyValue)*(1-smooth(.86,.94,storyValue))];
  panels.forEach((el,i)=>{display(el,opacities[i],(1-opacities[i])*25);if(innerWidth>700&&!reduced)el.style.transform=`translateY(calc(-50% + ${(1-opacities[i])*25}px))`;if(reduced)el.inert=false;});
  const chapter=storyValue<.32?1:storyValue<.64?2:3;
  $('.story-counter').innerHTML=`0${chapter} <i>/</i> 03`;
  $('.story-progress i').style.transform=`scaleX(${storyValue})`;
  $('.aircraft-ident').style.opacity=String(opacities[0]);
  $('.big-type').textContent=chapter===1?'AIRFRAME':chapter===2?'EXPERTISE':'PRECISION';
 }
 if(dp.active){$('.departure-copy').style.opacity=String(reduced?1:1-smooth(.48,.9,departureValue));$('.departure-copy').style.transform=`translateY(${-departureValue*35}px)`;}
 aircraft?.render(state,dt);
}
requestAnimationFrame(animate);
// The large 3D engine does not block the first film frame or page controls.
const loadObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadObserver.disconnect();import('./aircraft.js').then(m=>m.initAircraft()).then(controller=>{aircraft=controller;}).catch(error=>{console.warn('Using the static aircraft view.',error);$('.model-status').textContent='Aircraft preview';document.body.classList.add('webgl-unavailable');document.querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.model;$('.aircraft-fallback').src=`/assets/${name.toLowerCase()}.jpg`;$('.aircraft-fallback').alt=`Airbus ${name} aircraft`;$('#aircraft-name').textContent=`AIRBUS ${name}`;document.querySelectorAll('[data-model]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});}));});}},{rootMargin:'1000px'});loadObserver.observe(story);
