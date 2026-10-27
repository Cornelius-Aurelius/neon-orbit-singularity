const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../game-core.js');
const mk=(mode='arcade')=>{const s=C.createState(mode,()=>.35);s.status='playing';return s;};
test('all twelve stage profiles have legitimate playable gate widths and speeds',()=>{
 assert.equal(C.STAGES.length,12);
 for(let i=0;i<36;i++){const p=C.profile(i*6);assert.ok(p.width>=.26&&p.width<=.53);assert.ok(p.speed>=1.6&&p.speed<=4.8);assert.ok(p.name&&p.tip);}
});
test('circular seam and perfect scoring use wrapped angles, not absolute angles',()=>{
 const s=mk();s.gate=0.03;s.angle=C.TAU-.02;
 assert.ok(C.isHit(s.angle,s));assert.ok(C.isPerfect(s.angle,s));
 const r=C.attempt(s,()=>.5);assert.equal(r.kind,'perfect');assert.equal(s.score,160);assert.equal(s.hits,1);
});
test('correct hit awards points; wrong hits remove shields and end game',()=>{
 const s=mk();for(let i=0;i<3;i++){
   s.angle=C.wrap(s.gate+Math.PI);
   const result=C.attempt(s,()=>.5);assert.equal(result.kind,'miss');assert.equal(s.lives,2-i);
 }
 assert.equal(s.status,'over');assert.equal(C.attempt(s).kind,'ignored');
});
test('practice keeps unlimited lives and never expires',()=>{
 const s=mk('practice');for(let i=0;i<50;i++){s.angle=C.wrap(s.gate+Math.PI);C.attempt(s,()=>.5);}
 assert.equal(s.lives,3);assert.equal(s.status,'playing');assert.equal(s.misses,50);
});
test('timed blitz expires after sixty seconds and cannot run below zero',()=>{
 const s=mk('blitz');for(let i=0;i<1200;i++)C.update(s,.05);
 assert.equal(s.timeLeft,0);assert.equal(s.status,'over');
});
test('stages advance after six hits, direction only reverses on marked sector milestones',()=>{
 const s=mk();for(let i=0;i<18;i++){s.angle=s.gate;const r=C.attempt(s,()=>.5);assert.equal(r.kind,'perfect');}
 assert.equal(s.hits,18);assert.equal(s.profile.number,4);assert.equal(s.dir,-1);assert.equal(s.score>0,true);
});
test('dual gates accept both windows and never bypass accuracy checks',()=>{
 const s=mk();s.hits=18;s.profile=C.profile(18);s.gate=1.0;
 s.angle=C.wrap(s.gate+Math.PI);assert.equal(C.isHit(s.angle,s),true);
 s.angle=C.wrap(s.gate+Math.PI/2);assert.equal(C.isHit(s.angle,s),false);
});
test('gate spawns ahead rather than immediately on the orb, including reverse travel',()=>{
 for(const dir of [-1,1])for(const u of [0,.5,1]){
   const angle=2.1,gate=C.gateAfter(angle,dir,()=>u);
   assert.ok(C.distance(angle,gate)>1.9);assert.ok(gate>=0&&gate<C.TAU);
 }
});
test('frame-rate independent motion and visibility safeguards',()=>{
 const a=mk(),b=mk();for(let i=0;i<60;i++)C.update(a,1/60);
 for(let i=0;i<20;i++)C.update(b,.05);
 assert.ok(C.distance(a.angle,b.angle)<1e-8);
 const before=a.angle;a.status='paused';C.update(a,1);assert.equal(a.angle,before);
});