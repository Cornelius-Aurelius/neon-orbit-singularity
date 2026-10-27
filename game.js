/* NEON ORBIT ∞ SINGULARITY — browser controller and visuals. © Cornelius Aurelius. */
(()=>{
 'use strict';
 const core=window.OrbitCore;
 const $=id=>document.getElementById(id);
 const cvs=$('orbit'),ctx=cvs.getContext('2d',{alpha:false});
 const modes={arcade:'ARCADE',blitz:'60s BLITZ',practice:'PRACTICE'};
 const PALETTES={aurora:['#4df4ed','#aa74ff','#ff61ad'],solar:['#ffd36b','#ff7795','#ff9865'],matrix:['#a2fb69','#4ac8a9','#ffee73']};
 const THEME_NAMES={aurora:'Aurora',solar:'Solar',matrix:'Matrix'};
 const STORAGE='neon-orbit-singularity-v2';
 const prefReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let saved={};try{saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');}catch{saved={};}
 let theme=THEME_NAMES[saved.theme]?saved.theme:'aurora';
 let sound=!!saved.sound;
 let state=core.createState('arcade');
 let mode='arcade',lastTick=0,judgmentTimer=0,screen='menu',audio=null;
 let canvasWidth=0,canvasHeight=0,pxRatio=1,stars=[];
 const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(saved));}catch{}};
 const bestFor=which=>Number(saved['best-'+which])||0;
 const bestComboFor=which=>Number(saved['combo-'+which])||0;
 const announce=msg=>{$('announcer').textContent=msg;};
 const label=(id,val)=>{$(id).textContent=val;};
 function setTheme(value){theme=value;document.documentElement.setAttribute('data-theme',theme);saved.theme=theme;save();$('theme-toggle').innerHTML='◈ <span>'+THEME_NAMES[theme]+'</span>';render();}
 function setSound(on){sound=on;saved.sound=on;save();$('sound-toggle').setAttribute('aria-pressed',on?'true':'false');$('sound-toggle').setAttribute('aria-label',on?'Disable sound':'Enable sound');$('sound-toggle').innerHTML=on?'♫ <span>Sound on</span>':'♪ <span>Sound off</span>';}
 function playTone(freq=500,duration=.07,type='sine',volume=.065){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const oscillator=audio.createOscillator(),amp=audio.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(freq,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(freq*1.16,audio.currentTime+duration);amp.gain.setValueAtTime(volume,audio.currentTime);amp.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);oscillator.connect(amp);amp.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration+.01);}catch{}}
 function fmt(n){return Math.floor(n).toLocaleString('en-US');}
 function hud(){
  const p=state.profile,accuracy=state.hits+state.misses;
  label('score',String(Math.floor(state.score)).padStart(6,'0'));
  label('combo','×'+state.combo);label('best',mode==='practice'?'UNRANKED':fmt(Math.max(bestFor(mode),state.score)));
  label('resource-label',mode==='blitz'?'TIME LEFT':mode==='practice'?'MISSES':'SHIELDS');
  label('resource',mode==='blitz'?Math.ceil(state.timeLeft)+'s':mode==='practice'?String(state.misses):'♥ '.repeat(state.lives).trim()||'—');
  label('accuracy',accuracy?Math.round(state.hits/accuracy*100)+'%':'—');
  label('mode-label',modes[mode]);
  label('sector-label','SECTOR '+String(p.number).padStart(2,'0'));
  label('sector-name',p.name);label('sector-tip',p.tip);
  label('sector-progress-label',(state.hits%core.HITS_PER_STAGE)+' / '+core.HITS_PER_STAGE);
  $('sector-progress').style.width=(state.hits%core.HITS_PER_STAGE)/core.HITS_PER_STAGE*100+'%';
  $('progress-bar').style.width=(mode==='blitz'?state.timeLeft/60*100:(state.hits%core.HITS_PER_STAGE)/core.HITS_PER_STAGE*100)+'%';
  label('status-tag',state.status==='playing'?'IN FLIGHT':state.status==='paused'?'PAUSED':state.status==='over'?'MISSION COMPLETE':'STANDBY');
 }
 function overlay(kicker,heading,copy,buttons=true,stats=null){
   label('overlay-kicker',kicker);label('overlay-heading',heading);label('overlay-copy',copy);
   $('mode-actions').hidden=!buttons;
   const rs=$('overlay-results');rs.hidden=!stats;if(stats){rs.textContent='';for(const s of stats){const d=document.createElement('div');d.textContent=s;rs.appendChild(d);}}
   $('overlay').hidden=false;$('tap-button').disabled=true;$('pause-toggle').hidden=true;
 }
 function showMenu(){screen='menu';state.status='ready';overlay('WELCOME TO THE ORBIT','CHOOSE YOUR MISSION','Watch the rotating spark. Tap the glowing gate at the right moment. Aim for its bright centre to earn a Perfect bonus.');hud();}
 function launch(which){
   mode=which;state=core.createState(which);state.status='playing';state.sessionStart=performance.now();
   $('overlay').hidden=true;$('pause-toggle').hidden=false;$('pause-toggle').innerHTML='Ⅱ <span>Pause</span>';
   $('tap-button').disabled=false;label('mode-label',modes[which]);
   screen='playing';lastTick=performance.now();hud();announce(which+' started. Tap or press Space as the spark passes through the highlighted gate.');playTone(440,.12);render();
 }
 function finish(){
   if(screen==='over')return;
   screen='over';state.status='over';$('tap-button').disabled=true;
   const old=bestFor(mode);if(mode!=='practice'&&state.score>old){saved['best-'+mode]=state.score;}
   if(state.bestCombo>bestComboFor(mode)&&mode!=='practice')saved['combo-'+mode]=state.bestCombo;
   save();
   const runText=state.score>old&&mode!=='practice'?'NEW PERSONAL BEST':'RUN COMPLETE';
   overlay(runText,mode==='blitz'&&state.timeLeft===0?'TIME IS UP':'ORBIT DISCONNECTED',
   'The orbit is waiting for your next run. Can you beat your personal best?',true,
   ['SCORE '+fmt(state.score),'CLEAN HITS '+state.hits+' • PERFECT '+state.perfect,'BEST COMBO ×'+state.bestCombo]);
   hud();announce('Game over. Score '+state.score+'. Choose a mode to play again.');playTone(190,.24,'sawtooth',.04);
 }
 function pause(){if(state.status!=='playing')return;state.status='paused';screen='paused';overlay('ORBIT SUSPENDED','PAUSED','Your run is safe. Choose Resume to continue or a mode below to start fresh.',true);
    $('mode-actions').insertAdjacentHTML('afterbegin','<button id="resume-action" class="primary-btn">▶ RESUME RUN</button>');$('resume-action').addEventListener('click',resume,{once:true});
    hud();announce('Paused.');}
 function resume(){const r=$('resume-action');if(r)r.remove();if(state.status!=='paused')return;state.status='playing';screen='playing';lastTick=performance.now();$('overlay').hidden=true;$('pause-toggle').hidden=false;$('tap-button').disabled=false;hud();announce('Game resumed.');}
 function clearResume(){const r=$('resume-action');if(r)r.remove();}
 function popMessage(text,miss=false){const j=$('judgment');j.className='judgment';void j.offsetWidth;j.textContent=text;j.className='judgment active'+(miss?' miss':'');clearTimeout(judgmentTimer);judgmentTimer=setTimeout(()=>{j.className='judgment';},500);}
 function tap(){
    if(state.status!=='playing')return;
    const result=core.attempt(state);
    if(result.kind==='good'||result.kind==='perfect'){
      popMessage(result.kind==='perfect'?'✦ PERFECT +'+result.points:'NICE +'+result.points);
      playTone(result.kind==='perfect'?840:600,.07,result.kind==='perfect'?'triangle':'sine');
      if(result.leveled){popMessage('SECTOR '+result.stage+' UNLOCKED');announce('Sector '+result.stage+'. '+state.profile.name+'. '+state.profile.tip);playTone(920,.12);}
    }else if(result.kind==='miss'){popMessage('✕ MISS',true);playTone(230,.17,'sawtooth',.045);announce('Miss. '+(mode==='practice'?'Try again.':state.lives+' shields remaining.'));}
    if(result.gameOver)finish();hud();
 }
 function radiusLine(x,y,r,start,end,col,thick,blur=0){ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.lineWidth=thick;ctx.lineCap='round';ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=blur;ctx.stroke();ctx.shadowBlur=0;}
 function resize(){const rect=cvs.getBoundingClientRect();if(rect.width===0||rect.height===0)return;const w=Math.round(rect.width),h=Math.round(rect.height),pr=Math.min(window.devicePixelRatio||1,2);if(w!==canvasWidth||h!==canvasHeight||pr!==pxRatio){canvasWidth=w;canvasHeight=h;pxRatio=pr;cvs.width=Math.round(w*pr);cvs.height=Math.round(h*pr);ctx.setTransform(pr,0,0,pr,0,0);stars=Array.from({length:76},(_,i)=>({x:(i*47.791+23)%101/101*w,y:(i*37.239+7)%97/97*h,r:i%6===0?1.45:.62}));}}
 function render(){
   resize();const w=canvasWidth,h=canvasHeight;if(!w||!h)return;
   const [a,b,hot]=PALETTES[theme];ctx.clearRect(0,0,w,h);
   const cx=w/2,cy=h/2,r=Math.min(w*.36,h*.365,230);
   const grad=ctx.createRadialGradient(cx,cy,4,cx,cy,Math.max(w,h)*.72);grad.addColorStop(0,theme==='solar'?'#2b1c3c':theme==='matrix'?'#12392c':'#172a49');grad.addColorStop(.55,'#0b1428');grad.addColorStop(1,'#060b17');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
   for(const st of stars){ctx.fillStyle='rgba(160,220,255,.35)';ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,core.TAU);ctx.fill();}
   for(let i=0;i<3;i++)radiusLine(cx,cy,r+(i-1)*17,-Math.PI,Math.PI,i===1?'#33516f':'#2d4059',1.4);
   const cloud=ctx.createRadialGradient(cx,cy,0,cx,cy,r*.86);cloud.addColorStop(0,'rgba(100,90,185,.12)');cloud.addColorStop(1,'rgba(3,8,20,0)');ctx.fillStyle=cloud;ctx.beginPath();ctx.arc(cx,cy,r*.86,0,core.TAU);ctx.fill();
   radiusLine(cx,cy,r,0,core.TAU,'#1d3b59',19);
   radiusLine(cx,cy,r,0,core.TAU,'#406681',4);
   // Small track subdivisions hint at precision, without any gameplay clutter.
   for(let i=0;i<48;i++){const ang=i*core.TAU/48,z=i%4===0?11:5;
     const x1=cx+Math.cos(ang)*(r-17),y1=cy+Math.sin(ang)*(r-17),x2=cx+Math.cos(ang)*(r-17-z),y2=cy+Math.sin(ang)*(r-17-z);
     ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle='#81a9cc55';ctx.lineWidth=1;ctx.stroke();}
   const pw=core.widthAt(state.profile,state.elapsed);
   for(const g of core.gateCenters(state)){
     radiusLine(cx,cy,r,g-pw,g+pw,a,23,!prefReduced?19:2);
     radiusLine(cx,cy,r,g-pw,g+pw,'#b5fffa',3);
     // Bright inner centre marks the narrow perfect-hit region.
     radiusLine(cx,cy,r,g-.10,g+.10,'#fff',8,!prefReduced?9:1);
     const tx=cx+Math.cos(g)*(r+36),ty=cy+Math.sin(g)*(r+36);
     ctx.fillStyle=a;ctx.beginPath();ctx.arc(tx,ty,2,0,core.TAU);ctx.fill();
   }
   ctx.font=`850 ${Math.max(12,Math.min(19,r*.13))}px system-ui`;
   ctx.fillStyle='#e6faff';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(state.status==='playing'?state.profile.name:'THE ORBIT',cx,cy-15);
   ctx.font=`750 ${Math.max(10,Math.min(13,r*.082))}px system-ui`;ctx.fillStyle='#9db8d0';
   ctx.fillText(state.status==='playing'?(state.dir>0?'↻ CLOCKWISE':'↺ COUNTER-CLOCKWISE'):'✦ READY TO ASCEND ✦',cx,cy+16);
   // Orb glow is proportional to screen size and stays visible on small displays.
   const x=cx+Math.cos(state.angle)*r,y=cy+Math.sin(state.angle)*r,o=Math.max(8,Math.min(14,r*.095));
   const halo=ctx.createRadialGradient(x,y,0,x,y,o*3.8);halo.addColorStop(0,'rgba(255,255,255,.22)');halo.addColorStop(.35,hot+'88');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,o*3.8,0,core.TAU);ctx.fill();
   ctx.shadowBlur=!prefReduced?18:5;ctx.shadowColor=hot;ctx.fillStyle=hot;ctx.beginPath();ctx.arc(x,y,o,0,core.TAU);ctx.fill();ctx.shadowBlur=0;
   ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,o*.58,0,core.TAU);ctx.stroke();
   // Hairline indicator helps locate the moving orb irrespective of hue.
   const ex=cx+Math.cos(state.angle)*(r-33),ey=cy+Math.sin(state.angle)*(r-33);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.strokeStyle='#edfaffb8';ctx.lineWidth=1.8;ctx.stroke();
 }
 function frame(now){if(!document.hidden&&state.status==='playing'){
     const dt=lastTick?Math.min(.05,(now-lastTick)/1000):0;
     core.update(state,dt);
     if(state.status==='over')finish();
     if(mode==='blitz')hud();
   }
   lastTick=now;if(!document.hidden)render();requestAnimationFrame(frame);
 }
 // Accessible controls: canvas interaction, real button, keyboard shortcuts and pause.
 cvs.addEventListener('pointerdown',e=>{if(state.status!=='playing')return;e.preventDefault();tap();});
 $('tap-button').addEventListener('click',tap);
 document.addEventListener('keydown',e=>{
   if(e.code==='Escape'&&state.status==='playing'){e.preventDefault();pause();return;}
   if(e.code==='Escape'&&state.status==='paused'){e.preventDefault();resume();return;}
   if(e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
   const tag=e.target?.tagName;
   if(tag==='BUTTON'||tag==='INPUT'||tag==='A'||tag==='TEXTAREA')return;
   if(state.status==='playing'){e.preventDefault();tap();}
   else if(state.status==='paused'){e.preventDefault();resume();}
 });
 for(const which of Object.keys(modes))$('mode-'+which).addEventListener('click',()=>{clearResume();launch(which);});
 $('pause-toggle').addEventListener('click',()=>{state.status==='paused'?resume():pause();});
 $('help-toggle').addEventListener('click',()=>{const help=$('help-panel');const hidden=help.classList.toggle('help-highlight');$('help-toggle').setAttribute('aria-expanded',hidden?'true':'false');help.scrollIntoView({behavior:prefReduced?'instant':'smooth',block:'nearest'});});
 $('theme-toggle').addEventListener('click',()=>{const arr=Object.keys(PALETTES);setTheme(arr[(arr.indexOf(theme)+1)%arr.length]);announce('Theme '+THEME_NAMES[theme]);});
 $('sound-toggle').addEventListener('click',()=>{setSound(!sound);playTone(740,.08);announce(sound?'Sound enabled.':'Sound muted.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.status==='playing')pause();lastTick=performance.now();});
 if('ResizeObserver' in window){new ResizeObserver(()=>resize()).observe(cvs);}else window.addEventListener('resize',resize);
 label('year',new Date().getFullYear());setSound(sound);setTheme(theme);showMenu();requestAnimationFrame(frame);
 window.__neonOrbitDebug={getState:()=>state,getMode:()=>mode,launch,attempt:tap,core};
})();