/* NEON ORBIT ∞ SINGULARITY — original game engine by Cornelius Aurelius.
   Pure rules shared by browser and automated tests. */
(function(root,factory){
  const core=factory();
  if(typeof module==='object' && module.exports)module.exports=core;
  else root.OrbitCore=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TAU=Math.PI*2;
  const STAGES=[
    {name:'IGNITION',       tip:'Learn the orbit. Tap while the spark crosses the glowing gate.',speed:1.60,width:.52,drift:0,pulse:0,twins:false,reverse:false},
    {name:'NARROW BEAM',    tip:'Smaller gates. Sharper timing.',speed:1.85,width:.49,drift:0,pulse:0,twins:false,reverse:false},
    {name:'POLARITY',       tip:'The orbit changes direction. Watch the arrow.',speed:2.05,width:.47,drift:0,pulse:0,twins:false,reverse:true},
    {name:'DOUBLE SIGNAL',  tip:'Two glowing gates. Either one scores.',speed:2.18,width:.43,drift:0,pulse:0,twins:true,reverse:false},
    {name:'SOLAR DRIFT',    tip:'The gates move gently. Follow the light.',speed:2.24,width:.44,drift:.16,pulse:0,twins:false,reverse:false},
    {name:'REVERSED FIELD', tip:'Direction flips again. Adapt quickly.',speed:2.50,width:.42,drift:0,pulse:0,twins:false,reverse:true},
    {name:'ECHO CHAMBER',   tip:'Two windows. Only a clean hit keeps your combo.',speed:2.65,width:.39,drift:.12,pulse:0,twins:true,reverse:false},
    {name:'PHOTON EDGE',    tip:'The window grows tighter.',speed:2.90,width:.37,drift:0,pulse:0,twins:false,reverse:false},
    {name:'PULSE WAVE',     tip:'The glowing window breathes in and out.',speed:3.10,width:.39,drift:0,pulse:.055,twins:false,reverse:false},
    {name:'TWIN PARADOX',   tip:'Two slim gates move in opposing orbits.',speed:3.30,width:.36,drift:.19,pulse:0,twins:true,reverse:true},
    {name:'EVENT HORIZON',  tip:'Follow the drifting gate at full focus.',speed:3.48,width:.35,drift:.25,pulse:.025,twins:false,reverse:false},
    {name:'SINGULARITY',    tip:'Master the orbit. Every successful hit extends your run.',speed:3.65,width:.33,drift:.22,pulse:.035,twins:true,reverse:true}
  ];
  const HITS_PER_STAGE=6;
  function wrap(angle){return ((angle%TAU)+TAU)%TAU;}
  function delta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  function distance(a,b){return Math.abs(delta(a,b));}
  function stageIndex(hits){return Math.floor(Math.max(0,hits)/HITS_PER_STAGE);}
  function profile(hits){
    const i=stageIndex(hits),stage=STAGES[i%STAGES.length],cycle=Math.floor(i/STAGES.length);
    return {...stage,index:i,number:i+1,cycle,speed:Math.min(4.8,stage.speed+cycle*.18),width:Math.max(.29,stage.width-cycle*.014)};
  }
  function widthAt(p,time){return Math.max(.26,p.width+(p.pulse?Math.sin(time*3.4)*p.pulse:0));}
  function gateCenters(state){return state.profile.twins?[state.gate,wrap(state.gate+Math.PI)]:[state.gate];}
  function isHit(angle,state){const w=widthAt(state.profile,state.elapsed);return gateCenters(state).some(c=>distance(angle,c)<=w);}
  function isPerfect(angle,state){const w=widthAt(state.profile,state.elapsed);return gateCenters(state).some(c=>distance(angle,c)<=Math.min(.105,w*.25));}
  function award(combo,perfect){return (perfect?160:100)+Math.min(300,Math.max(0,combo-1)*15);}
  function gateAfter(angle,direction,random){const u=Math.max(0,Math.min(1,random()));return wrap(angle+direction*(2.12+u*1.85));}
  function createState(mode='arcade',random=Math.random){
    const p=profile(0);return {mode,status:'ready',score:0,best:0,hits:0,combo:0,bestCombo:0,lives:3,
      angle:wrap(-Math.PI/2),gate:gateAfter(-Math.PI/2,1,random),dir:1,profile:p,
      elapsed:0,timeLeft:mode==='blitz'?60:null,good:0,perfect:0,misses:0,celebration:0,
      lastJudgment:'',fx:[],sessionStart:0};
  }
  function changeStage(state){
    const old=state.profile;state.profile=profile(state.hits);
    if(state.profile.index!==old.index && state.profile.reverse)state.dir*=-1;
    return state.profile.index!==old.index;
  }
  function attempt(state,random=Math.random){
    if(state.status!=='playing')return {kind:'ignored'};
    const hit=isHit(state.angle,state);
    if(hit){
      const perfect=isPerfect(state.angle,state);state.combo++;state.bestCombo=Math.max(state.bestCombo,state.combo);
      state.hits++;state.good++;if(perfect)state.perfect++;
      const points=award(state.combo,perfect);state.score+=points;
      const leveled=changeStage(state);
      state.gate=gateAfter(state.angle,state.dir,random);
      state.lastJudgment=perfect?'PERFECT':'NICE';state.celebration=.55;
      return {kind:perfect?'perfect':'good',points,leveled,stage:state.profile.number};
    }
    state.misses++;state.combo=0;state.celebration=.36;state.lastJudgment='MISS';
    if(state.mode!=='practice'){
      state.lives=Math.max(0,state.lives-1);
      if(state.lives===0)state.status='over';
    }
    state.gate=gateAfter(state.angle,state.dir,random);
    return {kind:'miss',gameOver:state.status==='over'};
  }
  function update(state,dt){
    if(state.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.06);
    state.elapsed+=dt;
    state.angle=wrap(state.angle+state.dir*state.profile.speed*dt);
    state.gate=wrap(state.gate+state.profile.drift*dt*(state.profile.index===9?-1:1));
    if(state.celebration>0)state.celebration=Math.max(0,state.celebration-dt);
    if(state.mode==='blitz'){
      state.timeLeft=Math.max(0,state.timeLeft-dt);
      if(state.timeLeft<.000001){state.timeLeft=0;state.status='over';}
    }
  }
  return {TAU,STAGES,HITS_PER_STAGE,wrap,delta,distance,stageIndex,profile,widthAt,gateCenters,isHit,isPerfect,award,gateAfter,createState,changeStage,attempt,update};
});