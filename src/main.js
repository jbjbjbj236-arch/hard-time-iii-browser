import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82917e);
scene.fog = new THREE.Fog(0x82917e, 24, 75);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 120);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xdce8d1, 0x41483c, 2.1));
const sun = new THREE.DirectionalLight(0xffe4bd, 2.3);
sun.position.set(-14, 24, 12); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left=-32; sun.shadow.camera.right=32; sun.shadow.camera.top=32; sun.shadow.camera.bottom=-32;
scene.add(sun);

const mat = (color, roughness=.9) => new THREE.MeshStandardMaterial({color, roughness});
const concrete=mat(0x777d70), floorMat=mat(0x777e6b), wallMat=mat(0x9a9b83), dark=mat(0x333d35), metal=mat(0x68736d,.55), khaki=mat(0xb8b8a8), skin=mat(0xb97850), green=mat(0x52674c), orange=mat(0xc47a4c);
function box(w,h,d,material,x,y,z,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m}
const ground= new THREE.Mesh(new THREE.PlaneGeometry(100,100),floorMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
// Yard perimeter and block buildings
box(54,5,1.2,concrete,0,2.5,-22);box(54,5,1.2,concrete,0,2.5,22);box(1.2,5,44,concrete,-27,2.5,0);box(1.2,5,44,concrete,27,2.5,0);
box(20,7,1,wallMat,0,3.5,-10);box(1,7,20,wallMat,-10,3.5,0);box(1,7,20,wallMat,10,3.5,0);
box(18,.4,18,dark,0,7,-10);box(20,.25,20,metal,0,.1,-10);
for(let x=-24;x<=24;x+=3){box(.12,5,.12,metal,x,2.5,-21.3);box(.12,5,.12,metal,x,2.5,21.3)}
// Yard markings, basketball court, benches
for(let i=-2;i<=2;i++)box(.06,.015,12,mat(0xc1bda0),i*2,.01,9,false);
box(12,.03,.08,mat(0xc1bda0),0,.02,9,false);box(5,.04,5,mat(0xb0aa88),-16,.02,8,false);
box(3,.6,.35,mat(0x6d5944),-17,.35,2);box(3,.6,.35,mat(0x6d5944),17,.35,-2);
box(1,.12,.12,metal,-16,3,8);box(.12,3,.12,metal,-16,1.5,8);
for(let z=-18;z<19;z+=4){box(.2,3,.2,metal,-26.2,1.5,z);box(.2,3,.2,metal,26.2,1.5,z)}
// Cells and corridor dressing
for(let i=0;i<5;i++){const x=-8+i*4;box(3.4,2.8,.16,mat(0x777d72),x,1.4,-9.3);box(.08,2.7,.08,metal,x-1.35,1.35,-9);box(.08,2.7,.08,metal,x+1.35,1.35,-9);for(let j=0;j<4;j++)box(.05,2.7,.05,metal,x-.95+j*.63,1.35,-9)}
// Props
for(let i=0;i<4;i++){box(.8,.7,.8,mat(0x78614a),-5+i*3,.35,15);box(.85,.1,.85,mat(0x927a5c),-5+i*3,.75,15)}
// Player character, capsule-like assembled mesh
function makePerson(bodyColor=khaki, skinColor=skin){const g=new THREE.Group();const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.72,4,8),bodyColor);torso.position.y=1.18;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),skinColor);head.position.y=1.92;head.castShadow=true;g.add(head);const legs=[];for(const x of [-.2,.2]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.55,3,7),dark);leg.position.set(x,.43,0);leg.castShadow=true;g.add(leg);legs.push(leg)}const arms=[];for(const x of [-.48,.48]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.55,3,7),skinColor);arm.position.set(x,1.22,0);arm.rotation.z=x*.7;g.add(arm);arms.push(arm)}g.userData={legs,arms};return g}
const player=makePerson();player.position.set(0,0,15);scene.add(player);
const npcs=[];
const names=['Mack','Dre','Bones','Hector','Slick','Warden Cole','Tiny','Razor'];
const npcPositions=[[-7,7],[7,9],[-18,-1],[17,12],[-3,-3],[3,-4],[12,-12],[-13,13]];
npcPositions.forEach((p,i)=>{const g=makePerson(i===5?mat(0x536b55):i%2?mat(0x9b9d8c):mat(0x9c8064),mat([0x9a6548,0xb97850,0xd29b72,0x754a37][i%4]));g.position.set(p[0],0,p[1]);scene.add(g);npcs.push({mesh:g,name:names[i],health:100,rep:Math.floor(Math.random()*15),guard:i===5,dir:Math.random()*6.28,phase:Math.random()*10,hostile:false})});
const keys={};let yaw=0,pitch=.2,locked=false,started=false,paused=true,health=100,stamina=100,reputation=12,cash=25,clockMinutes=480,attackCooldown=0,selectedNpc=null;
const state={name:'Rookie',skin:'#b97850',outfit:'#b8b8a8',mods:[]};
const $=s=>document.querySelector(s);
function toast(t){$('#toast').textContent=t;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').textContent='',2600)}
function notice(t){$('#notice').textContent=t;$('#notice').classList.remove('hidden');setTimeout(()=>$('#notice').classList.add('hidden'),2400)}
function setOverlay(id){document.querySelectorAll('.overlay').forEach(e=>e.classList.add('hidden'));if(id)$(id).classList.remove('hidden');paused=!!id;if(!id&&started)canvas.requestPointerLock?.()}
function updateHud(){$('#player-name').textContent=state.name;$('#cash').textContent=cash;$('#health-bar').style.width=health+'%';$('#stamina-bar').style.width=stamina+'%';$('#rep-bar').style.width=reputation+'%';$('#health-value').textContent=Math.round(health);$('#stamina-value').textContent=Math.round(stamina);$('#rep-value').textContent=reputation;const h=Math.floor(clockMinutes/60)%24,m=clockMinutes%60;$('#clock').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function nearestNpc(){let best=null,dist=3.4;npcs.forEach(n=>{const d=n.mesh.position.distanceTo(player.position);if(d<dist){best=n;dist=d}});return best}
function hitNpc(n){if(attackCooldown>0||stamina<8)return;attackCooldown=.65;stamina=Math.max(0,stamina-8);if(!n){toast('No one in range.');return}n.health=Math.max(0,n.health-24);n.hostile=true;reputation=Math.min(100,reputation+2);toast(n.name+' took a hit.');if(n.health===0){toast(n.name+' is down.');cash+=5}updateHud()}
function interact(){const n=nearestNpc();if(n){selectedNpc=n;toast(n.guard?'Officer '+n.name+': Keep moving, inmate.':n.name+': What do you want? [F] challenge · [E] talk');if(!n.guard&&Math.random()>.45){reputation=Math.min(100,reputation+1);toast(n.name+' nods. Reputation +1')}updateHud()}else{toast('Nothing close enough to interact with.')} }
function movePlayer(dt){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const dir=new THREE.Vector3();if(keys.KeyW)dir.add(forward);if(keys.KeyS)dir.sub(forward);if(keys.KeyD)dir.add(right);if(keys.KeyA)dir.sub(right);if(dir.lengthSq()){dir.normalize();const running=keys.ShiftLeft&&stamina>1;player.position.addScaledVector(dir,dt*(running?8.3:4.4));if(running)stamina=Math.max(0,stamina-19*dt);else stamina=Math.min(100,stamina+9*dt);player.rotation.y=Math.atan2(dir.x,dir.z);player.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(performance.now()*.012+i*Math.PI)*.55)}else{stamina=Math.min(100,stamina+13*dt);player.userData.legs.forEach(l=>l.rotation.x*=.8)}player.position.x=THREE.MathUtils.clamp(player.position.x,-24.5,24.5);player.position.z=THREE.MathUtils.clamp(player.position.z,-19.5,19.5)}
function updateNpcs(dt,t){npcs.forEach(n=>{if(n.health<=0)return;n.phase+=dt; if(n.hostile){const v=player.position.clone().sub(n.mesh.position);if(v.length()>1.7){v.y=0;v.normalize();n.mesh.position.addScaledVector(v,dt*1.7);n.mesh.rotation.y=Math.atan2(v.x,v.z)}else if(Math.random()<dt*.8){health=Math.max(0,health-3);toast(n.name+' hit you!');updateHud()}}else{n.mesh.position.x+=Math.sin(n.phase*.42+n.dir)*dt*.22;n.mesh.position.z+=Math.cos(n.phase*.37+n.dir)*dt*.22;n.mesh.rotation.y=Math.sin(n.phase+n.dir)*.35}})}
function updateCamera(dt){const target=new THREE.Vector3(player.position.x,player.position.y+1.35,player.position.z);const distance=7.5;const desired=new THREE.Vector3(target.x+Math.sin(yaw)*distance*Math.cos(pitch),target.y+3.1+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*distance*Math.cos(pitch));camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target)}
function save(){const data={state,health,stamina,reputation,cash,clockMinutes,player:{x:player.position.x,z:player.position.z}};localStorage.setItem('ht3-browser-save',JSON.stringify(data));notice('GAME SAVED TO THIS BROWSER')}
function load(){try{const d=JSON.parse(localStorage.getItem('ht3-browser-save'));if(!d)return;Object.assign(state,d.state||{});health=d.health??100;stamina=d.stamina??100;reputation=d.reputation??12;cash=d.cash??25;clockMinutes=d.clockMinutes??480;if(d.player){player.position.x=d.player.x;player.position.z=d.player.z}applyLook();updateHud();}catch(e){console.warn('Save could not be loaded',e)}}
function applyLook(){player.children[0].material=mat(state.outfit);player.children[1].material=mat(state.skin)}
function installMod(mod){if(!mod||typeof mod!=='object'||!mod.name||!mod.version)throw new Error('Mod needs a name and version.');const safe={name:String(mod.name).slice(0,50),version:String(mod.version).slice(0,20),description:String(mod.description||'Community content').slice(0,140),type:String(mod.type||'content')};if(mod.player){if(mod.player.cashBonus)cash=Math.max(0,Math.min(999999,cash+Number(mod.player.cashBonus)||0));if(mod.player.reputationBonus)reputation=Math.max(0,Math.min(100,reputation+(Number(mod.player.reputationBonus)||0)))}if(mod.world?.ambientColor){scene.background=new THREE.Color(mod.world.ambientColor)}state.mods.push(safe);renderMods();updateHud();return safe}
function renderMods(){$('#mod-list').innerHTML=state.mods.length?state.mods.map(m=>'<div class="mod-item"><b>'+escapeHtml(m.name)+'</b><small>v'+escapeHtml(m.version)+' · '+escapeHtml(m.type)+'</small></div>').join(''):'<p class="empty">No mods installed yet.</p>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#start-btn').onclick=()=>{started=true;setOverlay(null);toast('Welcome to the yard, '+state.name+'.')};
$('#menu-btn').onclick=()=>setOverlay('#menu-screen');$('#save-btn').onclick=save;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>setOverlay(null));
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='resume')setOverlay(null);if(a==='save'){save();setOverlay(null)}if(a==='character'){ $('#edit-name').value=state.name;$('#edit-skin').value=state.skin;$('#edit-outfit').value=state.outfit;setOverlay('#editor-screen')}if(a==='mods'){renderMods();setOverlay('#mods-screen')}});
$('#apply-character').onclick=()=>{state.name=$('#edit-name').value.trim()||'Rookie';state.skin=$('#edit-skin').value;state.outfit=$('#edit-outfit').value;applyLook();updateHud();setOverlay(null);toast('Inmate record updated.')};
$('#mod-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const m=installMod(JSON.parse(await f.text()));notice('INSTALLED '+m.name.toUpperCase())}catch(err){notice('MOD ERROR: '+err.message)}e.target.value=''};
$('#download-template').onclick=()=>{const blob=new Blob([JSON.stringify({name:'My First Mod',version:'1.0.0',description:'A simple content pack',type:'gameplay',player:{cashBonus:10,reputationBonus:2},world:{ambientColor:'#82917e'}},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hard-time-mod-template.json';a.click();URL.revokeObjectURL(a.href)};
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape'){if(!$('#start-screen').classList.contains('hidden'))return;if(!$('#menu-screen').classList.contains('hidden'))setOverlay(null);else if(!paused)setOverlay('#menu-screen');else setOverlay(null)}if(e.code==='KeyE'&&!paused)interact();if(e.code==='KeyF'&&!paused)hitNpc(nearestNpc());if(e.code==='Space'&&!paused){player.position.y=.18;setTimeout(()=>player.position.y=0,170)}});
document.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('click',()=>{if(started&&!paused&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.()});
document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===canvas);
document.addEventListener('mousemove',e=>{if(locked&&!paused){yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018,-.35,.7)}});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}addEventListener('resize',resize);
load();updateHud();let previous=performance.now(),lastClock=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-previous)/1000,.04);previous=now;if(started&&!paused){movePlayer(dt);updateNpcs(dt,now/1000);attackCooldown=Math.max(0,attackCooldown-dt);lastClock+=dt;if(lastClock>4){clockMinutes=(clockMinutes+1)%1440;lastClock=0;updateHud()}if(health<=0){health=35;player.position.set(0,0,15);toast('You were escorted to the infirmary.')} }updateCamera(dt);renderer.render(scene,camera)}
requestAnimationFrame(loop);
