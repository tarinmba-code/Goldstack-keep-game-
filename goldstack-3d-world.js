/* Goldstack Keep · 3D world (v68, Phase 1)
   Hill terrain around a flat battlefield, a koi pond, swaying sakura trees, falling petals, 3D props,
   a 3D castle keep and 3D buildings that rise out of their pads. Built in code with the same toon
   look and ink outlines as the 3D characters (goldstack-3d-chars.js), which supplies the shape kit.
   Usage: const W=GK3D_WORLD(THREE,kit,{scene}); W.terrainHeight(x,z); W.model('b_tower'); W.tick(dt); */
(function(){
'use strict';
window.GK3D_WORLD=function(T,kit,opt){
opt=opt||{};
const {G_,Rig,toonMat,shade}=kit, TAU=Math.PI*2;
const SPH=(rx,ry,rz,ws,hs)=>G_.sph(rx,ry,rz,ws||8,hs||6);   /* low-poly by default: the toon ramp hides facets */
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, sm=t=>{ t=clamp(t,0,1); return t*t*(3-2*t); };
const U={time:{value:0}};

/* ---------------------------------------------------------------- materials */
const TOON=toonMat({flat:0.12,sat:1.06,fog:true,wcap:1,soft:false,neutral:0});   /* scenery stays lit by the sun, dusk and night */
const OLS=new T.MeshBasicMaterial({color:0x1A1422,side:T.BackSide});
OLS.onBeforeCompile=sh=>{ sh.uniforms.uTime=U.time; sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  transformed += normal * 0.035;'); };
OLS.customProgramCacheKey=()=>'gk3d-ol-static';
const GLOWM=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
/* wind sway for instanced foliage: the higher a vertex, the further it sways */
function swayMat(base,amp){ const m=base.clone(); m.onBeforeCompile=sh=>{ sh.uniforms.uTime=U.time; if(base.userData&&base.userData.rim) base.onBeforeCompile(sh);
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n  #ifdef USE_INSTANCING\n  float ph=instanceMatrix[3].x*0.21+instanceMatrix[3].z*0.17;\n  #else\n  float ph=0.0;\n  #endif\n  float k=max(0.0,position.y-0.8);\n  transformed.x+=sin(uTime*1.7+ph)*'+amp.toFixed(3)+'*k; transformed.z+=cos(uTime*1.3+ph*1.3)*'+(amp*0.6).toFixed(3)+'*k;'); };
  m.customProgramCacheKey=()=>'gk3d-sway-'+amp+(m.side===T.BackSide?'b':'f'); return m; }
const TOON_SWAY=swayMat(new T.MeshToonMaterial({vertexColors:true,gradientMap:TOON.gradientMap}),0.05);
const OL_SWAY=(()=>{ const m=OLS.clone(); m.onBeforeCompile=sh=>{ sh.uniforms.uTime=U.time;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  transformed += normal * 0.035;\n  #ifdef USE_INSTANCING\n  float ph=instanceMatrix[3].x*0.21+instanceMatrix[3].z*0.17;\n  #else\n  float ph=0.0;\n  #endif\n  float k=max(0.0,position.y-0.8);\n  transformed.x+=sin(uTime*1.7+ph)*0.05*k; transformed.z+=cos(uTime*1.3+ph*1.3)*0.03*k;'); };
  m.customProgramCacheKey=()=>'gk3d-ol-sway'; return m; })();

/* ---------------------------------------------------------------- static models from parts */
function bake(build){ const R=new Rig(); build(R,G_); const g=R.build(); return g; }
function asGroup(g,o){ o=o||{}; const grp=new T.Group();
  if(g.toon){ const m=new T.Mesh(g.toon,o.sway?TOON_SWAY:TOON); m.castShadow=o.shadow!==false; m.receiveShadow=true; grp.add(m); }
  if(g.ol&&o.outline!==false){ const m=new T.Mesh(g.ol,o.sway?OL_SWAY:OLS); grp.add(m); }
  if(g.glow){ const m=new T.Mesh(g.glow,GLOWM); grp.add(m); }
  grp.userData.is3d=true; return grp; }
const CACHE={};
function model(kind){ const B=BUILD[kind]; if(!B) return null; const g=CACHE[kind]||(CACHE[kind]=bake(B.fn)); const grp=asGroup(g,B.o); grp.userData.h3d=B.h||3;
  if(B.sy) for(const c of grp.children) c.scale.y=B.sy;   /* taller walls and steeper roofs read better from the high camera */
  return grp; }
function instanced(kind,n,o){ const B=BUILD[kind]; const g=CACHE[kind]||(CACHE[kind]=bake(B.fn)); o=Object.assign({},B.o||{},o||{});
  const out=[]; if(g.toon){ const m=new T.InstancedMesh(g.toon,o.sway?TOON_SWAY:TOON,n); m.castShadow=o.shadow!==false; m.receiveShadow=true; out.push(m); }
  if(g.ol&&o.outline!==false){ out.push(new T.InstancedMesh(g.ol,o.sway?OL_SWAY:OLS,n)); }
  if(g.glow){ out.push(new T.InstancedMesh(g.glow,GLOWM,n)); }
  for(const m of out) m.frustumCulled=false; return out; }

/* ---------------------------------------------------------------- shared palette */
const WOOD=0xB98A5A, WOOD_D=0x6E4A2E, PLASTER=0xF4EFE4, STONE=0x9A958C, STONE_D=0x6E6A64, ROOF=0x46669A, ROOF_G=0x3FA394, VERM=0xC8341E, GOLD=0xF5C542, INKC=0x1A1422;

/* a Japanese roof: hipped, with upturned eave corners */
function roof(R,b,w,d,h,y,col,o){ o=o||{}; const ov=(o.ov||0.35)*0.62;
  /* tile rows and hip ridges give the slopes some structure from the high camera */
  for(const t of [0.28,0.56]){ const hw=(w/2+ov)*(1-t)+0.012, hd=(d/2+ov)*(1-t)+0.012, yy=y+t*h; for(const sz of [1,-1]){ R.add(b,G_.box(hw*2,0.045,0.045),shade(col,0.72),{p:[0,yy,sz*hd],ol:false}); R.add(b,G_.box(0.045,0.045,hd*2),shade(col,0.72),{p:[sz*hw,yy,0],ol:false}); } }
  for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.tube([[sx*(w/2+ov),y+0.02,sz*(d/2+ov)],[0,y+h,0]],0.04,0.028,4,1),shade(col,0.6),{ol:false});
  const rg=G_.cyl(0.001,1,h,4); rg.rotateY(Math.PI/4); R.add(b,rg,col,{p:[0,y+h/2,0],s:[(w/2+ov)*1.414,1,(d/2+ov)*1.414]});
  R.add(b,G_.box(w+ov*2+0.06,0.08,d+ov*2+0.06),shade(col,0.82),{p:[0,y+0.02,0]});
  for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.cone(0.07,0.32,5),shade(col,0.9),{p:[sx*(w/2+ov),y+0.1,sz*(d/2+ov)],r:[sz*-0.9,0,sx*0.9]});
  if(o.ridge!==false) R.add(b,G_.box(Math.max(0.05,w-d)+0.2,0.1,0.14),shade(col,0.7),{p:[0,y+h-0.02,0]});
  if(o.shachi) for(const sx of [1,-1]) R.add(b,G_.cone(0.08,0.25,6),GOLD,{p:[sx*Math.max(0.1,(w-d)/2+0.1),y+h+0.08,0],r:[0,0,sx*0.4],glow:false}); }
function posts(R,b,w,d,h,y,col,r){ for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.cyl(r||0.08,(r||0.08)*1.1,h,8),col,{p:[sx*w/2,y+h/2,sz*d/2]}); }
function base(R,b,w,d,h){ R.add(b,G_.box(w,h||0.22,d),STONE,{p:[0,(h||0.22)/2,0]}); R.add(b,G_.box(w+0.08,0.05,d+0.08),STONE_D,{p:[0,0.025,0],ol:false}); }
function windowGrid(R,b,x,y,z,w,h,ry){ R.add(b,G_.box(w,h,0.03),0x2A2433,{p:[x,y,z],r:[0,ry||0,0],ol:false}); for(let i=1;i<3;i++) R.add(b,G_.box(0.025,h,0.035),WOOD,{p:[x+(i/3-0.5)*w*Math.cos(ry||0),y,z-(i/3-0.5)*w*Math.sin(ry||0)],r:[0,ry||0,0],ol:false}); }
function flag(R,b,x,y,z,col,mark){ R.add(b,G_.cyl(0.03,0.03,1.6,6),WOOD_D,{p:[x,y+0.8,z]}); R.add(b,G_.box(0.34,0.9,0.02),col,{p:[x+0.19,y+1.1,z]}); if(mark) R.add(b,SPH(0.09,0.09,0.02),mark,{p:[x+0.19,y+1.25,z+0.02],ol:false}); }

const BUILD={
  /* -------- castle keep: stone base, three white tiers, layered roofs, gold ornaments */
  castle:{h:7.6,fn:(R)=>{ const b='root';
    { const sb=G_.cyl(2.6*1.414,3.2*1.414,1.6,4); sb.rotateY(Math.PI/4); R.add(b,sb,STONE,{p:[0,0.8,0],s:[0.72,1,0.62]}); }
    for(let i=0;i<6;i++){ const y=0.2+i*0.25; R.add(b,G_.box((2.3-0.43*y/1.6)*2,0.04,0.05),STONE_D,{p:[0,y,1.99-0.38*y/1.6],ol:false}); }
    const tiers=[[3.6,1.35,3.0,1.6],[2.7,1.05,2.3,3.4],[1.9,0.95,1.6,4.95]];
    tiers.forEach(([w,h,d,y],i)=>{ R.add(b,G_.box(w,h,d),PLASTER,{p:[0,y+h/2,0]});
      for(const sx of [-1,0,1]) windowGrid(R,b,sx*w*0.3,y+h*0.55,d/2+0.02,0.32,0.26);
      R.add(b,G_.box(w+0.04,0.12,d+0.04),0x2A2E36,{p:[0,y+0.06,0],ol:false});
      roof(R,b,w,d,i===2?0.85:0.55,y+h,ROOF_G,{ov:0.42-i*0.06,shachi:i===2});
      if(i<2) for(const sx of [1,-1]){ R.add(b,G_.cyl(0.001,0.62,0.45,3),ROOF_G,{p:[sx*w*0.18,y+h+0.42,d/2+0.3],r:[0,0,0],s:[1,1,0.6]}); } });
    R.add(b,G_.box(1.0,1.15,0.1),0x3F2A1C,{p:[0,2.15,1.52]}); R.add(b,G_.box(1.2,0.1,0.14),GOLD,{p:[0,2.78,1.53]});
    for(const sx of [1,-1]){ R.add(b,G_.box(0.4,1.4,0.03),VERM,{p:[sx*1.35,2.55,1.53]}); R.add(b,SPH(0.1,0.1,0.02),PLASTER,{p:[sx*1.35,2.85,1.56],ol:false}); }
    R.add(b,G_.cyl(0.05,0.05,3.4,6),0x3F2A1C,{p:[2.3,1.7,1.7]}); R.add(b,G_.box(0.05,1.4,0.75),VERM,{p:[2.3,2.75,2.1]}); } },
  /* -------- Ground Troops: archery hall with a target and a spear rack */
  b_range:{sy:1.25,h:3.2,fn:(R)=>{ const b='root'; base(R,b,2.7,2.3);
    R.add(b,G_.box(2.1,1.15,1.7),PLASTER,{p:[0,0.8,-0.1]}); posts(R,b,2.1,1.7,1.2,0.22,WOOD_D,0.07);
    R.add(b,G_.box(2.12,0.12,1.72),WOOD,{p:[0,1.3,-0.1]}); windowGrid(R,b,-0.5,0.9,0.76,0.5,0.4); R.add(b,G_.box(0.55,0.85,0.04),WOOD_D,{p:[0.45,0.65,0.76]});
    roof(R,b,2.1,1.7,0.75,1.37,ROOF,{ov:0.32});
    const tg=[0.62,0.46,0.3,0.14], tc=[0xE8D8A8,VERM,PLASTER,VERM]; tg.forEach((r,i)=>R.add(b,G_.cyl(r,r,0.06,20),tc[i],{p:[1.18,0.82,0.7],r:[Math.PI/2,0,0.2],s:[0.55,1,0.55],ol:i===0}));
    R.add(b,G_.cyl(0.04,0.04,0.9,5),WOOD_D,{p:[1.18,0.4,0.66]});
    for(let i=0;i<4;i++) R.add(b,G_.cyl(0.02,0.02,1.4,4),WOOD_D,{p:[-1.25,0.75,0.3-i*0.22],r:[0,0,0.12]}); R.add(b,G_.box(0.1,0.08,1.0),WOOD,{p:[-1.25,0.25,0]});
    flag(R,b,-0.9,1.0,0.95,0x2F5DB8,PLASTER); } },
  /* -------- Heavy Units: black-lacquered hall with an oni mask over the door */
  b_onipit:{sy:1.25,h:3.4,fn:(R)=>{ const b='root'; base(R,b,2.8,2.4,0.3);
    R.add(b,G_.box(2.2,1.3,1.8),0x2A2226,{p:[0,0.95,-0.1]}); posts(R,b,2.25,1.85,1.35,0.3,0x8C1E14,0.11);
    R.add(b,G_.box(0.8,1.0,0.05),0x14101A,{p:[0,0.82,0.82]}); for(let i=0;i<3;i++) R.add(b,G_.box(2.25,0.05,0.04),GOLD,{p:[0,0.55+i*0.38,0.81],ol:false});
    roof(R,b,2.25,1.85,0.8,1.62,0x2A2A30,{ov:0.36});
    R.add(b,SPH(0.34,0.34,0.14),0xC8342C,{p:[0,1.38,0.86]}); for(const sd of [1,-1]){ R.add(b,G_.cone(0.06,0.3,6),0xF2DEA0,{p:[sd*0.2,1.68,0.88],r:[0,0,sd*-0.4]}); R.add(b,SPH(0.06,0.04,0.03),0xF5C542,{p:[sd*0.12,1.42,0.99],glow:true}); }
    R.add(b,G_.box(0.3,0.05,0.03),0xFFFFFF,{p:[0,1.25,0.99],ol:false});
    R.add(b,G_.cyl(0.32,0.32,0.4,12),0x5A3A2A,{p:[1.25,0.5,0.85]}); R.add(b,G_.cyl(0.3,0.3,0.05,12),0xE8D8B8,{p:[1.25,0.72,0.85],ol:false}); } },
  /* -------- Mage & Ninja Academy: vermilion shrine, copper roof, small torii, spirit lanterns */
  b_shrine:{sy:1.25,h:3.6,fn:(R)=>{ const b='root'; base(R,b,2.7,2.3,0.32);
    R.add(b,G_.box(1.9,1.2,1.5),PLASTER,{p:[0,0.95,-0.15]}); posts(R,b,1.95,1.55,1.25,0.32,VERM,0.09);
    R.add(b,G_.box(1.98,0.14,1.58),VERM,{p:[0,1.55,-0.15]}); roof(R,b,1.95,1.55,0.95,1.6,ROOF_G,{ov:0.45});
    R.add(b,G_.box(0.9,0.06,0.5),WOOD,{p:[0,0.4,0.85]}); R.add(b,G_.box(0.6,0.8,0.04),0x3A2433,{p:[0,0.8,0.62]});
    for(const sx of [1,-1]){ R.add(b,G_.cyl(0.05,0.06,1.1,8),VERM,{p:[sx*0.55,0.55,1.15]}); R.add(b,G_.cyl(0.1,0.12,0.25,8),STONE,{p:[sx*1.15,0.12,1.0]}); R.add(b,G_.box(0.18,0.2,0.18),0xC58CFF,{p:[sx*1.15,0.35,1.0],glow:true}); R.add(b,G_.cone(0.18,0.14,4),STONE,{p:[sx*1.15,0.52,1.0]}); }
    R.add(b,G_.box(1.45,0.08,0.1),INKC,{p:[0,1.12,1.15]}); R.add(b,G_.box(1.25,0.06,0.08),VERM,{p:[0,0.98,1.15]}); } },
  /* -------- gold mine: rocky mound, timbered tunnel, ore cart */
  b_mine:{h:3.0,fn:(R)=>{ const b='root';
    R.add(b,SPH(1.45,1.2,1.2,10,7),0x8E8478,{p:[0,0.55,-0.25]}); R.add(b,SPH(0.8,0.7,0.7,8,6),0x7A7268,{p:[0.9,0.4,-0.1]}); R.add(b,SPH(0.6,0.5,0.6,8,6),0x9A9086,{p:[-0.95,0.3,0.05]});
    R.add(b,G_.box(0.9,1.0,0.3),0x1A1418,{p:[0,0.55,0.75],ol:false});
    for(const sx of [1,-1]) R.add(b,G_.box(0.12,1.05,0.14),WOOD_D,{p:[sx*0.5,0.55,0.86]}); R.add(b,G_.box(1.25,0.13,0.16),WOOD_D,{p:[0,1.12,0.86]});
    for(const sx of [1,-1]) R.add(b,G_.box(0.05,0.03,1.3),0x5A5650,{p:[sx*0.22,0.02,1.4],ol:false});
    R.add(b,G_.box(0.6,0.32,0.45),WOOD,{p:[0,0.32,1.35]}); for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.cyl(0.09,0.09,0.05,10),0x3A3A42,{p:[sx*0.31,0.12,1.35+sz*0.15],r:[0,0,Math.PI/2]});
    for(let i=0;i<6;i++) R.add(b,SPH(0.09+0.03*(i%2),0.08,0.09),GOLD,{p:[(i%3-1)*0.15,0.52+(i>2?0.05:0),1.3+(i%2)*0.08],glow:i%2===0});
    for(let i=0;i<5;i++){ const a=i*1.3; R.add(b,SPH(0.08),GOLD,{p:[Math.sin(a)*1.1,0.9+Math.cos(a)*0.3,0.35+Math.cos(a)*0.4],glow:true}); } } },
  /* -------- forge: stone smithy, brick chimney, glowing hearth, anvil */
  b_forge:{sy:1.25,h:3.4,fn:(R)=>{ const b='root'; base(R,b,2.6,2.2);
    R.add(b,G_.box(2.0,1.05,1.6),0x8E8A84,{p:[0,0.75,-0.15]}); for(let i=0;i<4;i++) R.add(b,G_.box(2.02,0.03,1.62),0x6E6A64,{p:[0,0.4+i*0.25,-0.15],ol:false});
    roof(R,b,2.0,1.6,0.7,1.28,0x9A5E44,{ov:0.25});
    R.add(b,G_.box(0.45,1.5,0.45),0x9A4A3A,{p:[0.6,1.85,-0.4]}); R.add(b,G_.box(0.55,0.1,0.55),0x6E3A2E,{p:[0.6,2.6,-0.4]});
    R.add(b,G_.box(0.8,0.6,0.05),0x2A1E1A,{p:[-0.3,0.55,0.66],ol:false}); R.add(b,G_.box(0.6,0.35,0.04),0xFF7A2A,{p:[-0.3,0.45,0.68],glow:true}); R.add(b,SPH(0.2,0.12,0.04),0xFFD27A,{p:[-0.3,0.4,0.7],glow:true});
    R.add(b,G_.box(0.45,0.15,0.22),0x3A3A42,{p:[0.75,0.48,0.85]}); R.add(b,G_.cyl(0.1,0.14,0.3,8),0x3A3A42,{p:[0.75,0.28,0.85]});
    R.add(b,G_.cyl(0.2,0.18,0.3,10),WOOD,{p:[-1.05,0.15,0.75]}); R.add(b,G_.cyl(0.18,0.18,0.03,10),0x4E8CC8,{p:[-1.05,0.3,0.75],ol:false}); } },
  /* -------- armory: white storehouse, weapon racks, shields */
  b_armory:{sy:1.25,h:3.3,fn:(R)=>{ const b='root'; base(R,b,2.6,2.2);
    R.add(b,G_.box(1.9,1.3,1.6),PLASTER,{p:[0,0.87,-0.15]}); R.add(b,G_.box(1.92,0.4,1.62),0x2A2E36,{p:[0,0.42,-0.15]});
    for(let i=0;i<5;i++) R.add(b,G_.box(0.03,0.38,1.63),PLASTER,{p:[-0.8+i*0.4,0.42,-0.15],ol:false});
    roof(R,b,1.9,1.6,0.7,1.52,ROOF,{ov:0.3}); R.add(b,G_.box(0.7,0.9,0.05),0x3F2A1C,{p:[0,0.7,0.67]}); R.add(b,G_.cyl(0.07,0.07,0.06,10),GOLD,{p:[0,1.0,0.7],r:[Math.PI/2,0,0],ol:false});
    for(const sx of [1,-1]){ R.add(b,G_.box(0.08,0.9,0.5),WOOD_D,{p:[sx*1.15,0.45,0.35]});
      for(let i=0;i<3;i++) R.add(b,G_.cyl(0.018,0.018,1.1,4),0xD9DEE6,{p:[sx*1.15,0.75,0.2+i*0.14],r:[0,0,sx*0.08]});
      R.add(b,G_.cyl(0.24,0.24,0.06,14),sx>0?VERM:0x2F5DB8,{p:[sx*1.2,0.5,0.9],r:[Math.PI/2-0.2,0,0]}); R.add(b,SPH(0.07,0.07,0.03),GOLD,{p:[sx*1.2,0.52,0.94],ol:false}); } } },
  /* -------- war banner: nobori flags and a war drum */
  b_banner:{h:4.0,fn:(R)=>{ const b='root'; base(R,b,2.2,1.8,0.18);
    const cols=[0xC8341E,PLASTER,0x2F5DB8,0xC8341E];
    cols.forEach((c,i)=>{ const x=(i-1.5)*0.55, z=i%2?-0.25:0.15; R.add(b,G_.cyl(0.035,0.035,3.2,6),WOOD_D,{p:[x,1.75,z]}); R.add(b,G_.box(0.36,1.6,0.02),c,{p:[x+0.2,2.3,z]}); R.add(b,G_.box(0.4,0.04,0.04),WOOD_D,{p:[x+0.2,3.12,z]});
      R.add(b,SPH(0.1,0.1,0.02),i===1?0xC8341E:PLASTER,{p:[x+0.2,2.6,z+0.02],ol:false}); });
    R.add(b,G_.cyl(0.38,0.38,0.55,16),0x8C2A1E,{p:[0.55,0.55,0.75],r:[Math.PI/2,0,0]}); for(const sz of [1,-1]) R.add(b,G_.cyl(0.36,0.36,0.03,16),0xE8D8B8,{p:[0.55,0.55,0.75+sz*0.28],r:[Math.PI/2,0,0],ol:false});
    R.add(b,G_.box(0.9,0.08,0.1),WOOD_D,{p:[0.55,0.2,0.75]}); } },
  /* -------- watchtower: four legs, braced, a deck at 2.3 for the archers, a roof above */
  b_tower:{h:4.6,fn:(R)=>{ const b='root';
    for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.cyl(0.08,0.11,2.35,8),WOOD_D,{p:[sx*0.85,1.17,sz*0.85],r:[sz*0.05,0,-sx*0.05]});
    for(const y of [0.7,1.5]) for(const [rx,rz,ry] of [[0,0.86,0],[0,-0.86,0],[0.86,0,Math.PI/2],[-0.86,0,Math.PI/2]]) R.add(b,G_.box(1.8,0.07,0.07),WOOD,{p:[rx,y,rz],r:[0,ry,0]});
    for(const [rx,rz,ry] of [[0,0.88,0],[0,-0.88,0],[0.88,0,Math.PI/2],[-0.88,0,Math.PI/2]]) R.add(b,G_.box(2.3,0.07,0.06),WOOD,{p:[rx,1.1,rz],r:[0,ry,0.68]});
    R.add(b,G_.box(3.0,0.14,3.0),WOOD,{p:[0,2.3,0]}); for(const sx of [1,-1]) for(const sz of [1,-1]) R.add(b,G_.box(0.08,0.6,0.08),WOOD_D,{p:[sx*0.95,2.0,sz*0.95],r:[sz*0.5,0,-sx*0.5]});
    for(const [rx,rz,ry,l] of [[0,1.47,0,3.0],[0,-1.47,0,3.0],[1.47,0,Math.PI/2,3.0],[-1.47,0,Math.PI/2,3.0]]){ R.add(b,G_.box(l,0.07,0.07),WOOD_D,{p:[rx,2.66,rz],r:[0,ry,0]}); }
    /* open deck so the archers stay visible from the camera: corner posts with pennants instead of a roof */
    for(const sx of [1,-1]) for(const sz of [1,-1]){ R.add(b,G_.cyl(0.05,0.05,1.1,6),WOOD_D,{p:[sx*1.42,2.9,sz*1.42]}); R.add(b,G_.cone(0.09,0.18,6),GOLD,{p:[sx*1.42,3.5,sz*1.42]}); }
    R.add(b,G_.cyl(0.035,0.035,2.2,6),WOOD_D,{p:[-1.42,3.5,-1.42]}); R.add(b,G_.box(0.5,0.32,0.02),VERM,{p:[-1.15,4.35,-1.42]}); R.add(b,SPH(0.07,0.07,0.02),PLASTER,{p:[-1.15,4.35,-1.4],ol:false});
    R.add(b,G_.box(0.5,0.12,0.5),WOOD,{p:[0,0.06,0]}); R.add(b,G_.box(0.12,2.3,0.06),WOOD_D,{p:[0,1.2,0.88],r:[0.12,0,0]}); for(let i=0;i<6;i++) R.add(b,G_.box(0.4,0.04,0.04),WOOD,{p:[0,0.25+i*0.36,0.9-i*0.045],ol:false}); } },
  /* -------- bomb tower: round stone tower, crenellations, bronze cannon */
  b_cannon:{h:4.2,fn:(R)=>{ const b='root';
    R.add(b,G_.cyl(1.05,1.25,2.2,14),STONE,{p:[0,1.1,0]}); for(let i=0;i<5;i++) R.add(b,G_.tor(1.12-i*0.03,0.025,4,20),STONE_D,{p:[0,0.3+i*0.42,0],r:[Math.PI/2,0,0],ol:false});
    R.add(b,G_.cyl(1.2,1.1,0.18,14),STONE_D,{p:[0,2.25,0]});
    for(let i=0;i<8;i++){ const a=i/8*TAU; R.add(b,G_.box(0.32,0.32,0.24),STONE,{p:[Math.sin(a)*1.05,2.5,Math.cos(a)*1.05],r:[0,a,0]}); }
    R.add(b,G_.box(0.55,0.06,0.04),0x2A1E1A,{p:[0,1.2,1.2],ol:false}); R.add(b,G_.box(0.5,0.75,0.06),0x3F2A1C,{p:[0,0.45,1.18]});
    R.add(b,SPH(0.14),0x2A2A30,{p:[0.66,2.42,-0.55]}); R.add(b,SPH(0.14),0x2A2A30,{p:[0.46,2.42,-0.7]}); R.add(b,SPH(0.14),0x2A2A30,{p:[0.58,2.6,-0.62]});
    R.add(b,G_.cyl(0.62,0.62,0.06,16),WOOD_D,{p:[0,2.36,0],ol:false}); } },
  /* v81: the gun is its own model so it can turn to aim, kick back and flash when it fires (pivot at its turntable) */
  b_cannon_gun:{h:1,fn:(R)=>{ const b='root';
    R.add(b,G_.box(0.62,0.22,0.9),WOOD,{p:[0,0.11,-0.05]}); for(const sx of [1,-1]){ R.add(b,G_.box(0.08,0.36,0.7),WOOD_D,{p:[sx*0.3,0.32,-0.02]});
      R.add(b,G_.cyl(0.24,0.24,0.09,14),WOOD_D,{p:[sx*0.37,0.2,0.18],r:[0,0,Math.PI/2]}); R.add(b,G_.cyl(0.07,0.07,0.11,8),GOLD,{p:[sx*0.38,0.2,0.18],r:[0,0,Math.PI/2],ol:false}); }
    R.add(b,G_.cyl(0.25,0.31,1.45,14),0x8C6A3A,{p:[0,0.46,0.22],r:[Math.PI/2-0.25,0,0]});
    R.add(b,G_.tor(0.27,0.06,6,16),GOLD,{p:[0,0.63,0.9],r:[-0.25,0,0]}); R.add(b,G_.tor(0.3,0.045,6,16),GOLD,{p:[0,0.37,-0.12],r:[-0.25,0,0]});
    R.add(b,SPH(0.2),0x6E5230,{p:[0,0.3,-0.5]}); R.add(b,G_.cyl(0.17,0.17,0.04,12),0x111111,{p:[0,0.64,0.93],r:[Math.PI/2-0.25,0,0],ol:false}); } },
  /* -------- props */
  p_lantern:{h:2,fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.32,0.38,0.12,6),STONE,{p:[0,0.06,0]}); R.add(b,G_.cyl(0.11,0.14,0.75,6),STONE,{p:[0,0.5,0]});
    R.add(b,G_.cyl(0.28,0.24,0.1,6),STONE,{p:[0,0.92,0]}); R.add(b,G_.box(0.34,0.32,0.34),STONE,{p:[0,1.13,0]}); R.add(b,G_.box(0.2,0.18,0.36),0xFFE9A8,{p:[0,1.13,0],glow:true});
    R.add(b,G_.cone(0.42,0.32,6),STONE_D,{p:[0,1.44,0]}); R.add(b,SPH(0.07),STONE,{p:[0,1.64,0]}); } },
  p_torii:{h:3.4,fn:(R)=>{ const b='root'; for(const sx of [1,-1]){ R.add(b,G_.cyl(0.13,0.16,3.0,10),VERM,{p:[sx*1.25,1.5,0]}); R.add(b,G_.cyl(0.2,0.22,0.25,10),INKC,{p:[sx*1.25,0.12,0]}); }
    R.add(b,G_.box(3.5,0.2,0.32),INKC,{p:[0,3.1,0]}); R.add(b,G_.box(3.2,0.16,0.26),VERM,{p:[0,2.9,0]}); R.add(b,G_.box(2.9,0.14,0.2),VERM,{p:[0,2.45,0]}); R.add(b,G_.box(0.18,0.45,0.18),VERM,{p:[0,2.68,0]}); } },
  p_bush:{h:1.2,o:{sway:true},fn:(R)=>{ const b='root'; for(let i=0;i<6;i++){ const a=i*2.1, r=0.35+0.15*(i%2); R.add(b,SPH(r,r*0.85,r),i%2?0x5E9F46:0x4E8A3A,{p:[Math.sin(a)*0.35,0.3+0.12*(i%3),Math.cos(a)*0.3]}); }
    for(let i=0;i<8;i++){ const a=i*0.8; R.add(b,SPH(0.07),i%2?0xF7B6D2:0xFFFFFF,{p:[Math.sin(a)*0.55,0.55+0.15*Math.sin(a*3),Math.cos(a)*0.45],ol:false}); } } },
  p_cart:{h:1.5,fn:(R)=>{ const b='root'; R.add(b,G_.box(1.3,0.18,0.8),WOOD,{p:[0,0.5,0]}); for(const sx of [1,-1]) R.add(b,G_.box(1.3,0.32,0.05),WOOD,{p:[0,0.72,sx*0.38]});
    for(const sz of [1,-1]) R.add(b,G_.cyl(0.32,0.32,0.08,14),WOOD_D,{p:[0,0.32,sz*0.48],r:[Math.PI/2,0,0]}); R.add(b,G_.box(1.2,0.04,0.04),WOOD_D,{p:[1.2,0.5,0],r:[0,0,0.15]});
    for(let i=0;i<4;i++) R.add(b,SPH(0.22,0.18,0.22),0xE8C86A,{p:[(i-1.5)*0.28,0.82,(i%2)*0.1-0.05]}); } },
  p_rock:{h:1.2,fn:(R)=>{ const b='root'; R.add(b,SPH(0.7,0.5,0.6,7,5),STONE,{p:[0,0.3,0]}); R.add(b,SPH(0.4,0.35,0.4,6,4),0x8E8A84,{p:[0.55,0.2,0.2]}); R.add(b,SPH(0.38,0.22,0.32,7,4),0x6E9A50,{p:[-0.1,0.66,-0.08],ol:false}); } },
  /* -------- foliage */
  t_sakura:{h:4.2,o:{sway:true},fn:(R)=>{ const b='root';
    R.add(b,G_.tube([[0,0,0],[0.1,0.8,0.05],[-0.05,1.6,0.1],[0.15,2.2,0]],0.24,0.12,6,5),0x6E4A3A,{});
    for(const [x,y,z,a] of [[0.15,2.0,0,0.8],[-0.1,1.7,0.1,-0.9],[0.1,1.5,-0.1,2.4]]) R.add(b,G_.tube([[0,0,0],[Math.sin(a)*0.5,0.4,Math.cos(a)*0.5],[Math.sin(a)*0.9,0.6,Math.cos(a)*0.9]],0.09,0.04,4,3),0x6E4A3A,{p:[x,y,z],ol:false});
    const P=[0xF49AC1,0xF7B6D2,0xEC8DB8,0xFBC8DE];
    for(let i=0;i<7;i++){ const a=i*2.9, r=i===0?0:0.8+0.2*(i%2), y=2.55+(i===0?0.35:0.15*Math.sin(i*1.7)); const s=i===0?1.0:0.72+0.12*(i%3);
      R.add(b,SPH(s*1.08,s*0.8,s*1.08,9,6),P[i%4],{p:[Math.sin(a)*r,y,Math.cos(a)*r]}); } } },
  t_pine:{h:5,o:{sway:true},fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.14,0.22,1.4,8),0x5A3E2E,{p:[0,0.7,0]});
    for(let i=0;i<4;i++) R.add(b,G_.cone(1.25-i*0.25,1.25,9),i%2?0x3F7A3A:0x356A32,{p:[0,1.5+i*0.7,0]}); } },
  rockout:{h:2,fn:(R)=>{ const b='root'; const g=SPH(1,0.75,0.9,8,6), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), n=1+0.18*Math.sin(x*5.1+z*3.7)+0.12*Math.sin(y*7.3+x*2.1); p.setXYZ(i,x*n,Math.max(-0.2,y*n),z*n); } g.computeVertexNormals();
    R.add(b,g,0x8E8A84,{p:[0,0.4,0]}); R.add(b,SPH(0.62,0.32,0.55,8,5),0x6E9A50,{p:[-0.15,0.98,-0.1],ol:false}); } },
};

/* ---------------------------------------------------------------- v79: scenery for every stage theme */
function rockGeo(r,seed){ const g=SPH(r,r*0.75,r*0.9,8,6), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), n=1+0.18*Math.sin(x*5.1/r+z*3.7/r+seed)+0.12*Math.sin(y*7.3/r+x*2.1/r); p.setXYZ(i,x*n,Math.max(-0.2*r,y*n),z*n); } g.computeVertexNormals(); return g; }
function canopy(R,b,n,cx,cy,cz,rad,cols,flat){ for(let i=0;i<n;i++){ const a=i*2.4, r=i===0?0:rad*(0.55+0.3*(i%2)), y=cy+(i===0?rad*0.3:rad*0.12*Math.sin(i*1.7)), s=rad*(i===0?0.62:0.48+0.08*(i%3));
  R.add(b,SPH(s*1.08,s*(flat||0.8),s*1.08,9,6),cols[i%cols.length],{p:[cx+Math.sin(a)*r,y,cz+Math.cos(a)*r]}); } }
function branchy(R,b,col,h,n,spread,thick){ R.add(b,G_.tube([[0,0,0],[0.08,h*0.35,0.04],[-0.05,h*0.7,0.08],[0.1,h,0]],thick||0.22,(thick||0.22)*0.45,6,6),col,{});
  for(let i=0;i<n;i++){ const a=i*2.3+0.4, y=h*(0.45+0.5*i/n), L=spread*(0.6+0.4*((i*7)%3)/2);
    R.add(b,G_.tube([[0,0,0],[Math.sin(a)*L*0.45,L*0.25,Math.cos(a)*L*0.45],[Math.sin(a)*L,L*0.35,Math.cos(a)*L],[Math.sin(a)*L*1.2,L*0.6,Math.cos(a)*L*1.2]],(thick||0.22)*0.4,0.02,5,6),col,{p:[0,y,0],ol:false}); } }
Object.assign(BUILD,{
  t_bamboo:{h:5.6,o:{sway:true},fn:(R)=>{ const b='root';
    for(let i=0;i<6;i++){ const a=i*1.9, r=0.18+0.18*(i%3), x=Math.sin(a)*r, z=Math.cos(a)*r, H=4.2+0.9*((i*5)%3)/2, lean=(i%2?1:-1)*0.04;
      R.add(b,G_.cyl(0.07,0.085,H,7),i%2?0x6FAE4A:0x5E9F3E,{p:[x+lean*H/2,H/2,z],r:[0,0,-lean],grad:0x8CC85E});
      for(let k=1;k<5;k+=1) if(k%2) R.add(b,G_.cyl(0.088,0.088,0.035,7),0x4E8A34,{p:[x+lean*H*k/5,H*k/5,z],r:[0,0,-lean],ol:false});
      for(let k=0;k<3;k++){ const aa=k*2.1+i; R.add(b,G_.cone(0.1,0.65,3),0x6FB548,{p:[x+lean*H+Math.sin(aa)*0.3,H*(0.74+k*0.06),z+Math.cos(aa)*0.3],r:[Math.cos(aa)*1.1,aa,-Math.sin(aa)*1.1],s:[1,1,0.25],ol:false}); } } } },
  t_maple:{h:4.4,o:{sway:true},fn:(R)=>{ const b='root'; branchy(R,b,0x5A3A2A,2.2,3,0.8,0.2);
    canopy(R,b,8,0,2.7,0,1.35,[0xE8542B,0xF07A2A,0xD8341E,0xF5A042]); } },
  t_snowpine:{h:5,o:{sway:true},fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.14,0.22,1.2,8),0x5A3E2E,{p:[0,0.6,0]});
    for(let i=0;i<4;i++){ const r=1.25-i*0.25, y=1.4+i*0.72; R.add(b,G_.cone(r,1.2,9),i%2?0x2F5A3A:0x3A6A44,{p:[0,y,0]});
      R.add(b,G_.cone(r*0.82,0.42,9),0xF4F8FC,{p:[0,y+0.36,0],grad:0xDCE8F2}); } } },
  t_stormpine:{h:5.4,o:{sway:true},fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.12,0.22,1.6,8),0x3A2E2A,{p:[0.1,0.8,0],r:[0,0,-0.1]});
    for(let i=0;i<4;i++) R.add(b,G_.cone(1.1-i*0.22,1.3,8),i%2?0x1E3A3A:0x2A4A48,{p:[0.25+i*0.12,1.7+i*0.75,0],r:[0,0,-0.18]}); } },
  t_cedar:{h:5.8,o:{sway:true},fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.16,0.26,1.6,8),0x6E3E2A,{p:[0,0.8,0]});
    for(let i=0;i<6;i++){ const r=0.95-i*0.13; R.add(b,SPH(r,0.55,r,10,6),i%2?0x2F5A2A:0x3A6A34,{p:[0,1.7+i*0.62,0]}); }
    R.add(b,G_.cone(0.25,0.7,7),0x2F5A2A,{p:[0,5.4,0]}); } },
  t_coastpine:{h:4.4,o:{sway:true},fn:(R)=>{ const b='root';   /* Japanese black pine: a leaning trunk with flat cloud-shaped foliage pads */
    R.add(b,G_.tube([[0,0,0],[0.25,1.0,0],[0.7,2.0,0.1],[0.9,3.0,0]],0.22,0.1,7,10),0x4A3A30,{});
    for(const [x,y,z,s] of [[0.9,3.1,0,1.0],[0.2,2.3,0.3,0.8],[1.3,2.4,-0.2,0.75],[0.4,3.5,-0.2,0.6]]){ R.add(b,SPH(s*0.95,s*0.32,s*0.8,10,6),0x2F5A34,{p:[x,y,z]}); R.add(b,SPH(s*0.7,s*0.2,s*0.6,8,5),0x4E7A44,{p:[x,y+s*0.18,z],ol:false}); } } },
  t_willow:{h:4.6,o:{sway:true},fn:(R)=>{ const b='root'; R.add(b,G_.tube([[0,0,0],[0.1,1.2,0],[-0.05,2.4,0.05],[0.05,3.2,0]],0.28,0.14,7,8),0x5A4A3A,{});
    R.add(b,SPH(1.1,0.55,1.1,10,6),0x7A9A3A,{p:[0,3.4,0]});
    for(let i=0;i<16;i++){ const a=i/16*TAU, r=0.95+0.15*(i%2), L=2.0+0.5*((i*3)%4)/3;
      R.add(b,G_.tube([[Math.sin(a)*r*0.8,3.4,Math.cos(a)*r*0.8],[Math.sin(a)*r*1.1,3.0,Math.cos(a)*r*1.1],[Math.sin(a)*r*1.15,3.4-L*0.6,Math.cos(a)*r*1.15],[Math.sin(a)*r*1.12,3.4-L,Math.cos(a)*r*1.12]],0.09,0.03,4,8),i%2?0x8CAA44:0x6E8E34,{ol:false}); } } },
  t_dead:{h:4.2,fn:(R)=>{ const b='root'; branchy(R,b,0x2A2220,2.6,5,1.0,0.24);
    for(let i=0;i<4;i++){ const a=i*1.7; R.add(b,SPH(0.06),0xFF8A2A,{p:[Math.sin(a)*0.9,2.6+i*0.3,Math.cos(a)*0.9],glow:true}); } } },
  t_ashtree:{h:4.4,fn:(R)=>{ const b='root'; branchy(R,b,0x1E1818,2.4,4,0.9,0.24);
    canopy(R,b,5,0,2.9,0,1.0,[0x6E6670,0x8A8290,0x5A5260],0.6);
    for(let i=0;i<5;i++){ const a=i*1.3; R.add(b,SPH(0.07),0xFF6A2A,{p:[Math.sin(a)*0.7,2.7+(i%2)*0.4,Math.cos(a)*0.7],glow:true}); } } },
  t_spooky:{h:4.6,fn:(R)=>{ const b='root'; branchy(R,b,0x2E2236,2.8,6,1.1,0.26);
    R.add(b,SPH(0.22,0.28,0.1),0x14101A,{p:[0.02,1.3,0.22],ol:false});
    for(let i=0;i<4;i++){ const a=i*1.6+0.4; R.add(b,G_.lathe([[0.01,0.12],[0.09,0.06],[0.1,0],[0.06,-0.08],[0.01,-0.1]],8),0xC58CFF,{p:[Math.sin(a)*1.1,2.2+i*0.25,Math.cos(a)*1.1],glow:true}); } } },
  t_crystal:{h:3.4,fn:(R)=>{ const b='root';
    for(let i=0;i<7;i++){ const a=i*2.1, r=i===0?0:0.3+0.12*(i%2), H=i===0?2.6:1.1+0.5*((i*3)%3)/2, tilt=i===0?0:0.35;
      const c=i%2?0xB98CFF:0x8E6FE6; R.add(b,G_.cyl(0.001,0.22*(i===0?1.4:1),0.5*(i===0?1.4:1),6),c,{p:[Math.sin(a)*r,H+0.22,Math.cos(a)*r],r:[Math.cos(a)*tilt,0,-Math.sin(a)*tilt],glow:true});
      R.add(b,G_.cyl(0.22*(i===0?1.4:1),0.24*(i===0?1.4:1),H,6),c,{p:[Math.sin(a)*r*0.6,H/2,Math.cos(a)*r*0.6],r:[Math.cos(a)*tilt,0,-Math.sin(a)*tilt],grad:0xE6D8FF}); }
    R.add(b,rockGeo(0.6,1),0x4A4556,{p:[0,0.1,0]}); } },
  p_fountain:{h:1.6,fn:(R)=>{ const b='root';   /* tsukubai: a stone water basin with a bamboo spout */
    R.add(b,rockGeo(0.55,2),0x8E8A84,{p:[0,0.3,0]}); R.add(b,G_.cyl(0.32,0.32,0.05,16),0x6FB8D8,{p:[0,0.62,0],glow:true,grad:0xBFE8F5});
    R.add(b,G_.cyl(0.04,0.04,0.9,7),0x8CA04A,{p:[0.55,0.45,0]}); R.add(b,G_.cyl(0.035,0.035,0.55,7),0x8CA04A,{p:[0.35,0.88,0],r:[0,0,Math.PI/2+0.25]});
    R.add(b,G_.cyl(0.02,0.02,0.22,5),0x9FE6FF,{p:[0.1,0.76,0],glow:true}); } },
  p_sign:{h:2,fn:(R)=>{ const b='root'; R.add(b,G_.cyl(0.06,0.07,1.8,7),0x6E4A2E,{p:[0,0.9,0]});
    R.add(b,G_.box(0.9,0.28,0.05),0xB98A5A,{p:[0.3,1.45,0],r:[0,0,0.08]}); R.add(b,G_.box(0.8,0.26,0.05),0xB98A5A,{p:[-0.25,1.05,0],r:[0,0.5,-0.06]});
    for(const [x,y,r] of [[0.3,1.45,0],[-0.25,1.05,0.5]]) R.add(b,G_.box(0.4,0.04,0.06),0x2A1E1E,{p:[x,y,0.01],r:[0,r,0],ol:false});
    R.add(b,G_.cone(0.18,0.15,4),0x5A4A3A,{p:[0,1.85,0],r:[0,Math.PI/4,0]}); } },
  p_pampas:{h:1.9,o:{sway:true},fn:(R)=>{ const b='root'; for(let i=0;i<10;i++){ const a=i*2.4, r=0.1+0.08*(i%3), lean=0.15+0.1*(i%2), H=1.3+0.3*((i*3)%3)/2;
      R.add(b,G_.cyl(0.012,0.016,H,4),0xB9A86A,{p:[Math.sin(a)*(r+lean*H/2),H/2,Math.cos(a)*(r+lean*H/2)],r:[Math.cos(a)*lean,0,-Math.sin(a)*lean],ol:false});
      R.add(b,SPH(0.07,0.28,0.07,5,4),0xF2EAD0,{p:[Math.sin(a)*(r+lean*H),H+0.15,Math.cos(a)*(r+lean*H)],r:[Math.cos(a)*lean,0,-Math.sin(a)*lean],grad:0xD8C89A}); }
    for(let i=0;i<4;i++){ const a=i*1.6; R.add(b,G_.cone(0.04,0.7,3),0x8CA04A,{p:[Math.sin(a)*0.15,0.3,Math.cos(a)*0.15],r:[Math.cos(a)*0.5,0,-Math.sin(a)*0.5],ol:false}); } } },
  p_grave:{h:1.6,fn:(R)=>{ const b='root'; R.add(b,G_.box(0.9,0.2,0.6),0x6E6878,{p:[0,0.1,0]}); R.add(b,G_.box(0.42,1.1,0.22),0x8E8896,{p:[0,0.75,0],grad:0x6E6878});
    R.add(b,G_.cone(0.32,0.2,4),0x6E6878,{p:[0,1.4,0],r:[0,Math.PI/4,0]}); R.add(b,G_.box(0.06,0.6,0.01),0x2A2433,{p:[0,0.8,0.115],ol:false});
    R.add(b,SPH(0.12),0xC58CFF,{p:[0.35,1.2,0.2],glow:true}); for(const sd of [1,-1]) R.add(b,G_.cyl(0.05,0.05,0.2,6),0x5A7A3A,{p:[sd*0.32,0.3,0.2]}); } },
  p_lavapool:{h:0.4,fn:(R)=>{ const b='root'; R.add(b,G_.cyl(1,1.05,0.08,20),0xFF6A1A,{p:[0,0.04,0],glow:true,grad:0xFFE27A});
    for(let i=0;i<9;i++){ const a=i/9*TAU; R.add(b,rockGeo(0.28,i),0x2A2220,{p:[Math.sin(a)*1.05,0.08,Math.cos(a)*1.05]}); } } },
});
for(const [k,col,cap] of [['rock_snow',0x8E96A6,0xF4F8FC],['rock_lava',0x3A302E,0xFF6A1A],['rock_moss',0x6E6E64,0x4E7A3A],['rock_sand',0xC8B48C,0xE8DCB8],['rock_dark',0x4A4556,0x8E6FE6],['rock_ash',0x4A4248,0x8A8290]])
  BUILD[k]={h:2,fn:(R)=>{ const b='root'; R.add(b,rockGeo(1,k.length),col,{p:[0,0.4,0],grad:shade(col,0.75)});
    const glowCap=k==='rock_lava'||k==='rock_dark';
    if(glowCap) for(let i=0;i<4;i++){ const a=i*1.6; R.add(b,G_.tube([[Math.sin(a)*0.3,0.9,Math.cos(a)*0.3],[Math.sin(a)*0.7,0.55,Math.cos(a)*0.6],[Math.sin(a)*0.9,0.1,Math.cos(a)*0.8]],0.05,0.03,4,8),cap,{glow:true,ol:false}); }
    else R.add(b,SPH(0.85,0.22,0.75,8,5),cap,{p:[-0.05,0.95,-0.05],ol:false}); } };

/* ---------------------------------------------------------------- v79: base buildings - palisade, coins, ingots, pads */
BUILD.f_wood={h:1.5,fn:(R)=>{ const b='root';   /* sharpened log stakes lashed with rope */
  for(let i=0;i<2;i++){ const x=(i-0.5)*0.2; R.add(b,G_.cyl(0.095,0.1,1.25,7),i?0xA0703F:0x8A5E34,{p:[x,0.62,0],grad:0x6E4A2A}); R.add(b,G_.cone(0.095,0.28,7),0xC8A070,{p:[x,1.39,0]}); }
  R.add(b,G_.box(0.44,0.05,0.22),0xD8C8A0,{p:[0,0.9,0],ol:false}); R.add(b,G_.box(0.44,0.05,0.22),0xD8C8A0,{p:[0,0.4,0],ol:false}); } };
BUILD.f_iron={h:1.8,fn:(R)=>{ const b='root';   /* iron-banded timber with spikes */
  R.add(b,G_.box(0.42,1.5,0.2),0x6B4626,{p:[0,0.75,0],grad:0x4A2E1A});
  for(const y of [0.35,0.85,1.3]) R.add(b,G_.box(0.44,0.08,0.22),0x5A6470,{p:[0,y,0],grad:0x8C96A2});
  for(const x of [-0.12,0.12]) R.add(b,G_.cone(0.05,0.3,4),0xB8C2CC,{p:[x,1.64,0]}); } };
BUILD.f_stone={h:2.1,fn:(R)=>{ const b='root';   /* plastered stone wall with a tiled cap, like a castle wall */
  R.add(b,G_.box(0.56,0.7,0.36),0x8E8A84,{p:[0,0.35,0],grad:0x6E6A64}); for(let k=0;k<2;k++) R.add(b,G_.box(0.57,0.02,0.37),0x6E6A64,{p:[0,0.22+k*0.25,0],ol:false});
  R.add(b,G_.box(0.52,0.85,0.3),0xF4EFE4,{p:[0,1.1,0]}); R.add(b,G_.box(0.12,0.16,0.31),0x2A2433,{p:[0,1.15,0],ol:false});
  const rg=G_.cyl(0.001,1,0.3,4); rg.rotateY(Math.PI/4); R.add(b,rg,0x3A4A5E,{p:[0,1.67,0],s:[0.42,1,0.3]});
  R.add(b,G_.box(0.6,0.05,0.44),0x2A3444,{p:[0,1.53,0]}); R.add(b,G_.cyl(0.03,0.03,0.6,6),0xF5C542,{p:[0,1.82,0],r:[0,0,Math.PI/2],ol:false}); } };

/* ---------------------------------------------------------------- terrain */
function noise2(x,z,seed){ const s=Math.sin(x*12.9898+z*78.233+seed*37.719)*43758.5453; return s-Math.floor(s); }
function vnoise(x,z,seed){ const xi=Math.floor(x), zi=Math.floor(z), xf=x-xi, zf=z-zi, u=xf*xf*(3-2*xf), v=zf*zf*(3-2*zf);
  const a=noise2(xi,zi,seed), b=noise2(xi+1,zi,seed), c=noise2(xi,zi+1,seed), d=noise2(xi+1,zi+1,seed);
  return lerp(lerp(a,b,u),lerp(c,d,u),v); }
function fbm(x,z,seed){ let s=0,a=0.5,f=1; for(let o=0;o<4;o++){ s+=a*vnoise(x*f,z*f,seed+o*11); f*=2.03; a*=0.5; } return s; }
function pointSeg(px,pz,ax,az,bx,bz){ const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz||1; let t=((px-ax)*dx+(pz-az)*dz)/l; t=clamp(t,0,1); return Math.hypot(px-(ax+dx*t),pz-(az+dz*t)); }
let TER=null;
function setupTerrain(L,keep,seed,pond){ TER={L,keep,seed,pond}; }
function laneDist(x,z){ let d=1e9; for(const pts of TER.L.lanes) for(let i=0;i<pts.length-1;i++){ const v=pointSeg(x,z,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]); if(v<d) d=v; } return d; }
function terrainHeight(x,z){ if(!TER) return 0; const K=TER.keep, d=Math.hypot(x-K.x,z-K.z);
  let ring=sm((d-25)/11); if(z>K.z+1&&d<34) ring*=sm((d-28)/8);
  if(ring<=0) return pondH(x,z);
  const n=fbm(x*0.05,z*0.05,TER.seed), amp=3.0+8.0*sm((d-30)/34);
  let h=ring*(0.35+n*1.1)*amp;
  h*=sm((laneDist(x,z)-3.2)/8);
  return h+pondH(x,z); }
function pondH(x,z){ const P=TER&&TER.pond; if(!P) return 0; const d=Math.hypot(x-P.x,z-P.z)/P.r; return d<1.15?-0.45*sm((1.15-d)/0.5):0; }
function shapeGround(geo,rotY){ /* geo: a plane already rotated flat; rotY: the mesh's Y rotation */
  const p=geo.attributes.position, c=geo.attributes.color, cs=Math.cos(rotY), sn=Math.sin(rotY);
  for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), wx=x*cs+z*sn, wz=-x*sn+z*cs; p.setY(i,terrainHeight(wx,wz)); }
  geo.computeVertexNormals();
  if(c){ const n=geo.attributes.normal; for(let i=0;i<p.count;i++){ const h=p.getY(i), up=n.getY(i), steep=1-up;
    const k=clamp(0.94+h*0.018-steep*0.9,0.62,1.08)*(0.96+0.06*noise2(i,i*3,1)); c.setXYZ(i,k*(1-steep*0.25),k*(1-steep*0.3),k*(1-steep*0.1)); } c.needsUpdate=true; } }

/* ---------------------------------------------------------------- water */
function pondMesh(P){ const g=new T.CircleGeometry(P.r,40); g.rotateX(-Math.PI/2);
  const m=new T.ShaderMaterial({transparent:true,uniforms:{uTime:U.time,uDeep:{value:new T.Color(P.deep||0x2F7FA8)},uShal:{value:new T.Color(P.shal||0x8FD8E6)}},
    vertexShader:'varying vec2 vP; void main(){ vP=position.xz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform float uTime; uniform vec3 uDeep, uShal; varying vec2 vP; uniform float uR;\n'+
      'void main(){ float d=length(vP)/'+P.r.toFixed(2)+'; float w=sin(vP.x*3.1+uTime*1.3)*sin(vP.y*2.7-uTime*1.1)+sin((vP.x+vP.y)*4.3+uTime*1.7)*0.5;\n'+
      ' vec3 col=mix(uDeep,uShal,smoothstep(0.35,1.0,d)); col+=vec3(0.18)*smoothstep(0.75,1.0,w*0.5+0.5); col=mix(col,vec3(1.0),smoothstep(0.9,1.0,d)*0.55);\n'+
      ' gl_FragColor=vec4(col,0.92); }'});
  const mesh=new T.Mesh(g,m); mesh.position.set(P.x,0.05,P.z); mesh.renderOrder=1; return mesh; }

/* ---------------------------------------------------------------- petals */
const AIR={petal:{c1:'#FBC6DC',c2:'#FFFFFF',size:0.32,fall:[0.6,1.1],drift:0.5,shape:'petal'},
  leaf:{c1:'#E8642B',c2:'#F5A042',size:0.36,fall:[0.7,1.2],drift:0.6,shape:'leaf'}, greenleaf:{c1:'#7AB548',c2:'#B8E07A',size:0.3,fall:[0.6,1.0],drift:0.5,shape:'leaf'},
  snow:{c1:'#FFFFFF',c2:'#DCEAF6',size:0.22,fall:[0.8,1.4],drift:0.35,shape:'dot'}, storm:{c1:'#FFFFFF',c2:'#C8D8EE',size:0.2,fall:[2.6,3.4],drift:1.6,shape:'dot'},
  ember:{c1:'#FF8A2A',c2:'#FFE27A',size:0.2,fall:[-1.2,-0.6],drift:0.4,shape:'dot',glow:true}, ash:{c1:'#8A8290',c2:'#C8C0C8',size:0.24,fall:[0.4,0.8],drift:0.5,shape:'dot'},
  wisp:{c1:'#C58CFF',c2:'#F0E0FF',size:0.34,fall:[-0.25,0.15],drift:0.5,shape:'dot',glow:true}, firefly:{c1:'#E8FF8A',c2:'#FFFFC8',size:0.22,fall:[-0.2,0.2],drift:0.6,shape:'dot',glow:true},
  sparkle:{c1:'#C8B8FF',c2:'#FFFFFF',size:0.2,fall:[-0.3,0.3],drift:0.3,shape:'star',glow:true}, gold:{c1:'#F5C542',c2:'#FFF0B0',size:0.24,fall:[0.4,0.7],drift:0.4,shape:'leaf'}};
function petals(n,area,center,kind){ const K=AIR[kind||'petal']||AIR.petal; const g=new T.BufferGeometry(), pos=new Float32Array(n*3), vel=[];
  const rise=K.fall[1]<=0||K.fall[0]<0&&K.fall[1]<0.3, top=rise?0.2:9;
  for(let i=0;i<n;i++){ pos[i*3]=center.x+(Math.random()-0.5)*area; pos[i*3+1]=Math.random()*9; pos[i*3+2]=center.z+(Math.random()-0.5)*area; vel.push([K.drift*(0.6+Math.random()*0.8),lerp(K.fall[0],K.fall[1],Math.random()),Math.random()*TAU]); }
  g.setAttribute('position',new T.BufferAttribute(pos,3));
  const cv=document.createElement('canvas'); cv.width=cv.height=32; const c=cv.getContext('2d');
  if(K.shape==='petal'||K.shape==='leaf'){ c.fillStyle=K.c1; c.beginPath(); c.ellipse(16,16,12,K.shape==='leaf'?8:7,0.6,0,TAU); c.fill(); c.fillStyle=K.c2; c.beginPath(); c.ellipse(13,14,4,2,0.6,0,TAU); c.fill(); }
  else if(K.shape==='star'){ const gr=c.createRadialGradient(16,16,0,16,16,15); gr.addColorStop(0,K.c2); gr.addColorStop(0.3,K.c1); gr.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gr; c.fillRect(0,0,32,32); c.fillStyle=K.c2; c.fillRect(15,2,2,28); c.fillRect(2,15,28,2); }
  else { const gr=c.createRadialGradient(16,16,0,16,16,15); gr.addColorStop(0,K.c2); gr.addColorStop(0.45,K.c1); gr.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gr; c.fillRect(0,0,32,32); }
  const m=new T.PointsMaterial({size:K.size,map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,alphaTest:K.glow?0.02:0.2,blending:K.glow?T.AdditiveBlending:T.NormalBlending});
  const pts=new T.Points(g,m); pts.frustumCulled=false;
  pts.userData.tick=(dt,t)=>{ const a=g.attributes.position.array; for(let i=0;i<n;i++){ const v=vel[i]; a[i*3]+=(v[0]+Math.sin(t*1.3+v[2])*0.5)*dt; a[i*3+1]-=v[1]*dt+(K.fall[0]<0&&K.fall[1]>0?Math.sin(t*1.7+v[2])*0.25*dt:0); a[i*3+2]+=Math.cos(t*0.9+v[2])*0.35*dt;
      const out=a[i*3+1]<0.05||a[i*3+1]>10;
      if(out){ a[i*3]=center.x+(Math.random()-0.5)*area; a[i*3+1]=v[1]<0?0.2+Math.random()*0.5:8+Math.random()*2; a[i*3+2]=center.z+(Math.random()-0.5)*area; } } g.attributes.position.needsUpdate=true; };
  return pts; }

/* ---------------------------------------------------------------- public */
const tickers=[];
return {
  model, instanced, has:k=>!!BUILD[k], heightOf:k=>(BUILD[k]&&BUILD[k].h)||3,
  geo:k=>{ const B=BUILD[k]; return B?(CACHE[k]||(CACHE[k]=bake(B.fn))):null; }, mats:{toon:TOON,ol:OLS},
  setupTerrain, terrainHeight, inPond:(x,z,m)=>!!(TER&&TER.pond&&Math.hypot(x-TER.pond.x,z-TER.pond.z)<TER.pond.r+(m||0)), shapeGround, laneDist:(x,z)=>TER?laneDist(x,z):99,
  pondMesh, petals, swayMat, U,
  addTicker:f=>tickers.push(f), clearTickers:()=>{ tickers.length=0; },
  tick(dt){ U.time.value+=dt; for(const f of tickers) f(dt,U.time.value); } };
};
})();
