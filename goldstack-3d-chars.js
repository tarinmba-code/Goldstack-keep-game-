/* Goldstack Keep · 3D characters (v68)
   Every hero and boss is built in code from shaped parts, toon-shaded with an ink outline, and rigged
   on a skeleton that is animated procedurally each frame: idle breathing, walk and run cycles, wind-up and
   strike for each attack style, hit flinch, boss casts (slam, volley, line, donut, summon, blink, dash).
   Each character draws in three calls (toon body, outline, glowing details) whatever its part count.
   Usage: const C=GK3D_CHARS(THREE,{gradTex}); C.begin(); C.drive(entity,key,params); C.end(); */
(function(){
'use strict';
window.GK3D_CHARS=function(T,opt){
opt=opt||{};
const gradTex=opt.gradTex||(()=>{ const t=new T.DataTexture(new Uint8Array([95,95,95,255,175,175,175,255,255,255,255,255]),3,1,T.RGBAFormat); t.minFilter=t.magFilter=T.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t; })();
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, sm=t=>{ t=clamp(t,0,1); return t*t*(3-2*t); };
/* character style: 'anime' = heroic anime proportions (default), 'chibi' = the big-headed look of the 2D art */
let STYLE=opt.style||window.GK_STYLE||(()=>{ try{ const q=new URLSearchParams(location.search).get('style'); if(q==='anime'||q==='chibi'){ localStorage.setItem('gk-style2',q); return q; } return localStorage.getItem('gk-style2')||'chibi'; }catch(e){ return 'chibi'; } })();   /* chibi (big heads) is the default */
const TAU=Math.PI*2;
/* v82: anime-style humans draw this much taller than their gameplay size, so a slim adult figure keeps the same
   on-screen presence as the big-headed chibi troops around it. Visual only: hit boxes and spacing are unchanged. */
const ANIME_PRESENCE=1.2;

/* ================================================================ geometry kit
   Every helper returns a non-indexed BufferGeometry with position + normal only, so parts merge freely. */
function ni(g){ let n=g.index?g.toNonIndexed():g; for(const k of Object.keys(n.attributes)) if(k!=='position'&&k!=='normal') n.deleteAttribute(k); if(!n.attributes.normal) n.computeVertexNormals(); return n; }
/* v83: SEGK scales every curved part's segment count; troops are built at a fraction of hero detail */
let SEGK=1; const sg=(n,min)=>Math.max(min,Math.round(n*SEGK));
const G_={
  sph:(rx,ry,rz,ws,hs)=>{ const m=Math.max(rx,ry==null?rx:ry,rz==null?rx:rz); if(ws==null){ ws=m<0.05?7:m<0.12?10:m<0.3?14:16; hs=m<0.05?5:m<0.12?7:m<0.3?10:12; } const g=new T.SphereGeometry(1,sg(ws,5),sg(hs,3));   /* fewer segments for small parts */ g.scale(rx,ry==null?rx:ry,rz==null?rx:rz); return ni(g); },
  part:(rx,ry,rz,ps,pl,ts,tl,ws=18,hs=12)=>{ const g=new T.SphereGeometry(1,sg(ws,5),sg(hs,3),ps,pl,ts,tl); g.scale(rx,ry,rz); return ni(g); },
  hemi:(rx,ry,rz,ws=16)=>{ const g=new T.SphereGeometry(1,sg(ws,5),sg(8,3),0,TAU,0,Math.PI/2); g.scale(rx,ry,rz); return ni(g); },
  cap:(r,len,rs=10)=>ni(new T.CapsuleGeometry(r,Math.max(0.001,len),sg(4,1),sg(rs,4))),
  cyl:(rt,rb,h,rs=12,open=false)=>ni(new T.CylinderGeometry(rt,rb,h,sg(rs,4),1,open)),
  cone:(r,h,rs=10)=>ni(new T.ConeGeometry(r,h,sg(rs,4))),
  box:(w,h,d)=>ni(new T.BoxGeometry(w,h,d)),
  tor:(R,r,rs=8,ts=24,arc=TAU)=>ni(new T.TorusGeometry(R,r,sg(rs,3),sg(ts,6),arc)),
  lathe:(pts,seg=16,phi0=0,phiL=TAU)=>{ const q=pts[0][1]>pts[pts.length-1][1]?pts.slice().reverse():pts;   /* profile must run bottom-up so faces point outward */
    return ni(new T.LatheGeometry(q.map(p=>new T.Vector2(Math.max(0.0005,p[0]),p[1])),sg(seg,5),phi0,phiL)); },
  /* tapered tube along a smooth curve: radius goes r0 -> r1 */
  tube:(pts,r0,r1,rs=7,seg=14)=>{ rs=sg(rs,3); seg=sg(seg,4); const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])));
    const g=new T.TubeGeometry(curve,seg,1,rs,false), pos=g.attributes.position, nrm=g.attributes.normal, P=new T.Vector3();
    for(let i=0;i<=seg;i++){ const t=i/seg, r=lerp(r0,r1,t), c=curve.getPointAt(t);
      for(let j=0;j<=rs;j++){ const k=i*(rs+1)+j; P.fromBufferAttribute(pos,k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k,P.x,P.y,P.z); } }
    g.computeVertexNormals(); const out=ni(g);
    const tip=G_.sph(Math.max(r1,0.004),Math.max(r1,0.004),Math.max(r1,0.004),5,3); tip.translate(pts[pts.length-1][0],pts[pts.length-1][1],pts[pts.length-1][2]);
    const cap0=G_.sph(r0,r0,r0,rs,4); cap0.translate(pts[0][0],pts[0][1],pts[0][2]);
    return mergeRaw([out,cap0,tip]); },
  /* flat extruded outline (crests, feathers, fans, blades) drawn in the XY plane, depth along Z */
  shape:(pts,depth=0.03,bevel=0.008)=>{ const s=new T.Shape(); s.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) s.lineTo(pts[i][0],pts[i][1]);
    const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:6}); g.translate(0,0,-depth/2); return ni(g); },
  crescent:(R,thick,depth=0.04)=>{ const pts=[]; for(let i=0;i<=20;i++){ const a=Math.PI*(0.1+0.8*i/20); pts.push([Math.cos(a)*R,Math.sin(a)*R]); }
    for(let i=20;i>=0;i--){ const a=Math.PI*(0.1+0.8*i/20); pts.push([Math.cos(a)*(R-thick)*1.0,Math.sin(a)*(R-thick)*0.82+thick*0.25]); }
    return G_.shape(pts,depth); },
  star:(R,r,n=5,depth=0.03)=>{ const pts=[]; for(let i=0;i<n*2;i++){ const a=Math.PI/2+i*Math.PI/n, rr=i%2?r:R; pts.push([Math.cos(a)*rr,Math.sin(a)*rr]); } return G_.shape(pts,depth); },
  leaf:(w,l,depth=0.02)=>{ const pts=[]; for(let i=0;i<=12;i++){ const t=i/12; pts.push([Math.sin(t*Math.PI)*w*(1-t*0.3),t*l]); } for(let i=11;i>0;i--){ const t=i/12; pts.push([-Math.sin(t*Math.PI)*w*(1-t*0.3),t*l]); } return G_.shape(pts,depth,0.004); },
};
function mergeRaw(list){ let n=0; for(const g of list) n+=g.attributes.position.count;
  const P=new Float32Array(n*3), N=new Float32Array(n*3); let o=0;
  for(const g of list){ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; }
  const out=new T.BufferGeometry(); out.setAttribute('position',new T.BufferAttribute(P,3)); out.setAttribute('normal',new T.BufferAttribute(N,3)); return out; }

/* ================================================================ rig builder
   Bones are created in a bind pose with no rotation, so a bone's model-space bind transform is just the sum
   of its parents' offsets. A part's vertices = bone origin + the part's own position/rotation/scale. */
const _m=new T.Matrix4(), _q=new T.Quaternion(), _e=new T.Euler(), _v=new T.Vector3(), _s=new T.Vector3(), _nm=new T.Matrix3(), _c=new T.Color();
class Rig{
  constructor(){ this.bones=[]; this.byName={}; this.parts=[]; this.root=this.bone('root',null,[0,0,0]); }
  bone(name,parent,off){ const b=new T.Bone(); b.name=name; b.position.set(off[0],off[1],off[2]);
    b.userData.rest=b.position.clone(); b.userData.idx=this.bones.length; b.userData.world=new T.Vector3(off[0],off[1],off[2]);
    if(parent){ const p=this.byName[parent]; p.add(b); b.userData.world.add(p.userData.world); }
    this.bones.push(b); this.byName[name]=b; return b; }
  /* add a shaped part to a bone: o.p offset, o.r rotation (radians), o.s scale, o.glow unlit, o.ol outline (default on) */
  add(bone,geo,col,o){ o=o||{}; this.parts.push({bone:typeof bone==='string'?this.byName[bone]:bone,geo,col,p:o.p||[0,0,0],r:o.r||[0,0,0],s:o.s||[1,1,1],glow:!!o.glow,ol:o.ol!==false&&!o.glow,grad:o.grad!=null?o.grad:null,gax:o.gax||1}); return this; }
  build(){
    const groups={toon:[],ol:[],glow:[]};
    for(const pt of this.parts){
      let rad=1; if(this.minPart||this.minPartOl){ const g=pt.geo; if(!g.boundingSphere) g.computeBoundingSphere(); rad=g.boundingSphere.radius*Math.max(pt.s[0],pt.s[1],pt.s[2]); if(this.minPart&&rad<this.minPart&&!pt.glow) continue; }   /* v83: troops skip specks */
      const b=pt.bone, w=b.userData.world;
      _q.setFromEuler(_e.set(pt.r[0],pt.r[1],pt.r[2])); _s.set(pt.s[0],pt.s[1],pt.s[2]); _v.set(pt.p[0]+w.x,pt.p[1]+w.y,pt.p[2]+w.z);
      _m.compose(_v,_q,_s); _nm.getNormalMatrix(_m);
      const src=pt.geo, n=src.attributes.position.count, P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3), SI=new Uint16Array(n*4), SW=new Float32Array(n*4);
      _c.set(pt.col); let gy0=0,gy1=1; const gc=pt.grad!=null?new T.Color(pt.grad):null, c0=_c.clone();
      if(gc){ gy0=1e9; gy1=-1e9; for(let i=0;i<n;i++){ const y=src.attributes.position.getY(i); if(y<gy0) gy0=y; if(y>gy1) gy1=y; } }
      for(let i=0;i<n;i++){ if(gc){ const y=src.attributes.position.getY(i), u=gy1>gy0?(gy1-y)/(gy1-gy0):0; _c.copy(c0).lerp(gc,Math.pow(u,pt.gax)); }
        _v.fromBufferAttribute(src.attributes.position,i).applyMatrix4(_m); P[i*3]=_v.x; P[i*3+1]=_v.y; P[i*3+2]=_v.z;
        _v.fromBufferAttribute(src.attributes.normal,i).applyMatrix3(_nm).normalize(); N[i*3]=_v.x; N[i*3+1]=_v.y; N[i*3+2]=_v.z;
        C[i*3]=_c.r; C[i*3+1]=_c.g; C[i*3+2]=_c.b; SI[i*4]=b.userData.idx; SW[i*4]=1; }
      const rec={P,N,C,SI,SW,n};
      if(pt.glow) groups.glow.push(rec); else { groups.toon.push(rec); if(pt.ol&&!(this.minPartOl&&rad<this.minPartOl)) groups.ol.push(rec); } }
    const geo=list=>{ if(!list.length) return null; let n=0; for(const r of list) n+=r.n;
      const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3),SI=new Uint16Array(n*4),SW=new Float32Array(n*4); let o=0;
      for(const r of list){ P.set(r.P,o*3); N.set(r.N,o*3); C.set(r.C,o*3); SI.set(r.SI,o*4); SW.set(r.SW,o*4); o+=r.n; }
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('normal',new T.BufferAttribute(N,3));
      g.setAttribute('color',new T.BufferAttribute(C,3)); g.setAttribute('skinIndex',new T.Uint16BufferAttribute(SI,4)); g.setAttribute('skinWeight',new T.BufferAttribute(SW,4));
      g.computeBoundingBox(); g.computeBoundingSphere(); return g; };
    return {toon:geo(groups.toon),ol:geo(groups.ol),glow:geo(groups.glow)};
  }
}

/* ================================================================ materials */
/* v82 ink outline: pushed out in screen space so the line keeps the same pixel width at any distance.
   At the game camera a hero is only 40-70 pixels tall, and the old model-space outline thinned to under a
   pixel there, so the character melted into the ground. Now the width is the larger of the model-space
   width (close-ups stay bold) and a minimum of OUTLINE.minPx screen pixels, capped at OUTLINE.maxPx. */
const OUTLINE={world:0.022, minPx:1.35, maxPx:4};
const OL_U={uOut:{value:1}, uRes:{value:new T.Vector2(1280,720)}, uMinPx:{value:OUTLINE.minPx}, uMaxPx:{value:OUTLINE.maxPx}, uWorld:{value:OUTLINE.world}};
const _rv=new T.Vector2();
/* v85 death dissolve: a noisy cut-off that eats the character from the head down; the cut edge burns gold to crimson.
   Every character has its own material, so the amount is a per-material uniform. */
const GK_DIS_GLSL='float gkHash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }\nfloat gkDis(vec3 p){ return gkHash(floor(p*17.0))*0.55+(1.0-clamp(p.y/4.0,0.0,1.0))*0.45; }\n';
/* ink outline. tint=true (code-built heroes, bosses and troops) darkens each part's own colour into the line, so skin gets a warm
   brown line and a red oni a deep crimson one instead of one flat black; imported models keep plain ink. */
function olMake(tint,own){ const m=new T.MeshBasicMaterial({color:tint?0xFFFFFF:0x1A1422,side:T.BackSide,fog:false,vertexColors:!!tint});
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,OL_U); if(own) sh.uniforms.uDis=own; else sh.uniforms.uDis={value:0}; if(!tint) m.userData.sh=sh;
    sh.vertexShader='uniform float uOut; uniform vec2 uRes; uniform float uMinPx; uniform float uMaxPx; uniform float uWorld;\nvarying vec3 vGkP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGkP=position;').replace('#include <project_vertex>','#include <project_vertex>\n'+
    '#ifdef USE_SKINNING\n{ vec3 nV=normalize(normalMatrix*objectNormal); vec2 d=(projectionMatrix*vec4(nV,0.0)).xy; float dl=length(d);\n'+
    '  if(dl>1e-5){ float sc=length(modelMatrix[0].xyz); float w=max(gl_Position.w,1e-3);\n'+
    '    float px=clamp(uWorld*sc*projectionMatrix[1][1]*0.5*uRes.y/w, uMinPx, uMaxPx)*uOut;\n'+
    '    gl_Position.xy += (d/dl)*px*2.0/uRes*w; } }\n#endif');
    sh.fragmentShader='uniform float uDis; varying vec3 vGkP;\n'+GK_DIS_GLSL+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  if(uDis>0.001&&gkDis(vGkP)<uDis*1.12+0.1) discard;'+(tint?'\n  diffuseColor.rgb=mix(vec3(0.102,0.078,0.133),diffuseColor.rgb*0.30,0.55);':'')); };
  m.customProgramCacheKey=()=>'gk3d-outline-v85'+(tint?'c':'p'); return m; }
const OL_MAT=olMake(false), OL_MATC=olMake(true);
/* keeps the screen size and pixel ratio current for the outline; costs a few uniform writes per character */
function olBeforeRender(r){ r.getDrawingBufferSize(_rv); OL_U.uRes.value.copy(_rv); const pr=r.getPixelRatio(); OL_U.uMinPx.value=OUTLINE.minPx*pr; OL_U.uMaxPx.value=OUTLINE.maxPx*pr; }
/* glow layer: breathes slowly so magic reads as alive; a second, additive shell (the halo) fakes bloom without a post pass */
const GK_T={value:0};
const GLOW_MAT=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false});
GLOW_MAT.onBeforeCompile=sh=>{ sh.uniforms.uGt=GK_T; sh.fragmentShader='uniform float uGt;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  diffuseColor.rgb*=0.93+0.17*sin(uGt*4.4);'); };
GLOW_MAT.customProgramCacheKey=()=>'gk3d-glow-v85';
const HALO_MAT=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false,transparent:true,opacity:0.34,blending:T.AdditiveBlending,depthWrite:false});
HALO_MAT.onBeforeCompile=sh=>{ sh.uniforms.uGt=GK_T;
  sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normal*0.055;');
  sh.fragmentShader='uniform float uGt;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  diffuseColor.a*=0.7+0.3*sin(uGt*4.4+1.2);'); };
HALO_MAT.customProgramCacheKey=()=>'gk3d-halo-v85';
/* heroes and bosses must read as clearly as the painted troops: no fog, and half of their colour is unlit so night
   and dusk lighting never wash them out; a touch of extra saturation keeps them vivid next to the sprites */
const softGrad=(()=>{ const t=new T.DataTexture(new Uint8Array([168,168,168,255,222,222,222,255,255,255,255,255]),3,1,T.RGBAFormat); t.minFilter=t.magFilter=T.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t; })();
function toonMat(o){ o=Object.assign({flat:0.32,sat:1.2,fog:false,wcap:0.84,soft:true,neutral:0.8},o||{}); const m=new T.MeshToonMaterial({vertexColors:true,gradientMap:o.soft?softGrad:gradTex,color:0xFFFFFF,emissive:0x000000,fog:o.fog});
  m.onBeforeCompile=sh=>{ if(o.wcap<1) sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  { float L0=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114)); if(L0>'+o.wcap.toFixed(2)+') diffuseColor.rgb*='+o.wcap.toFixed(2)+'/L0; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
    '{ vec3 lit=outgoingLight; float Ld=max(dot(diffuseColor.rgb,vec3(0.299,0.587,0.114)),0.02); lit=mix(lit,diffuseColor.rgb*(dot(lit,vec3(0.299,0.587,0.114))/Ld),'+(o.neutral!=null?o.neutral:0.8).toFixed(2)+'); outgoingLight=mix(lit,diffuseColor.rgb*vec3(1.04),'+o.flat.toFixed(2)+'); float lum=dot(outgoingLight,vec3(0.299,0.587,0.114)); outgoingLight=clamp(mix(vec3(lum),outgoingLight,'+o.sat.toFixed(2)+'),0.0,1.0); float rim=1.0-max(dot(normalize(normal),normalize(vViewPosition)),0.0); outgoingLight+=diffuseColor.rgb*smoothstep(0.55,1.0,rim)*0.32+vec3(0.06)*smoothstep(0.75,1.0,rim); }\n#include <opaque_fragment>'); };
  m.customProgramCacheKey=()=>'gk3d-toon-rim4-'+o.neutral+o.soft+o.flat+'-'+o.sat+'-'+o.fog+'-'+o.wcap; return m; }
/* v82 anime cel shading for heroes and bosses (the "Basic Anime" double-shade look):
   a crisp light/shadow line from the sun's direction, a cool violet first shade, a deeper second shade
   for the side facing away, and a lit-side rim. Brightness follows the scene's lights, so dusk and night
   stages still darken characters, but the shading shape no longer depends on light strength. */
const CEL={step1:0.44, step2:0.16, feather:0.024, keyTint:0.5, fillTint:0.55, ring:0.9, ringLo:0.42, ringHi:0.62, shade1:[0.80,0.74,0.92], shade2:[0.60,0.54,0.76], lit:1.03, rim:0.30, sat:1.16, wcap:0.84, dayRef:2.55};
/* v83 bone-texture skinning: many troops share one mesh; each instance reads its 22 bone matrices (3 rows each) from
   a float texture row chosen by gl_InstanceID. Every part of a code-built character follows exactly one bone. */
const BONE_GLSL='uniform highp sampler2D uBones;\nattribute float aBone;\nmat4 gkBoneM(){ int b=int(aBone+0.5)*3, r=gl_InstanceID; return transpose(mat4(texelFetch(uBones,ivec2(b,r),0),texelFetch(uBones,ivec2(b+1,r),0),texelFetch(uBones,ivec2(b+2,r),0),vec4(0.0,0.0,0.0,1.0))); }\n';
function celMat(o){ o=o||{}; const f=v=>(+v).toFixed(3), v3=a=>'vec3('+a.map(f).join(',')+')';
  const m=new T.MeshToonMaterial({vertexColors:true,gradientMap:softGrad,color:0xFFFFFF,emissive:0x000000,fog:false}), U={value:0}; m.userData.dis=U;
  m.onBeforeCompile=sh=>{ sh.uniforms.uDis=U;
    if(o.bones){ sh.uniforms.uBones={value:o.bones};
      sh.vertexShader=BONE_GLSL+sh.vertexShader.replace('#include <beginnormal_vertex>','mat4 gkM=gkBoneM();\nvec3 objectNormal=mat3(gkM)*vec3(normal);').replace('#include <begin_vertex>','vec3 transformed=(gkM*vec4(position,1.0)).xyz;'); }
    sh.vertexShader='varying vec3 vGkP;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvGkP=position;');
    sh.fragmentShader='uniform float uDis; varying vec3 vGkP;\n'+GK_DIS_GLSL+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  float gkEdge=0.0; if(uDis>0.001){ float dd=gkDis(vGkP), cut=uDis*1.12-0.06; if(dd<cut) discard; gkEdge=1.0-smoothstep(0.0,0.085,dd-cut); }\n  { float L0=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114)); if(L0>'+f(CEL.wcap)+') diffuseColor.rgb*='+f(CEL.wcap)+'/L0; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
    '{ vec3 W=vec3(0.299,0.587,0.114), N=normalize(normal), base=diffuseColor.rgb; float hl=0.72, env=1.0; vec3 keyC=vec3(1.0), fillC=vec3(1.0);\n'+
    '#if NUM_DIR_LIGHTS > 0\n  hl=dot(N,directionalLights[0].direction)*0.5+0.5; env=dot(directionalLights[0].color,W)*0.6; keyC=directionalLights[0].color/max(max(directionalLights[0].color.r,directionalLights[0].color.g),max(directionalLights[0].color.b,1e-3));\n#endif\n'+
    '#if NUM_HEMI_LIGHTS > 0\n  env+=dot(hemisphereLights[0].skyColor+hemisphereLights[0].groundColor,W)*0.5; fillC=hemisphereLights[0].skyColor/max(max(hemisphereLights[0].skyColor.r,hemisphereLights[0].skyColor.g),max(hemisphereLights[0].skyColor.b,1e-3));\n#endif\n'+
    '  env=clamp(env/'+f(CEL.dayRef)+',0.5,1.12);\n'+
    '  float m1=smoothstep('+f(CEL.step1-CEL.feather)+','+f(CEL.step1+CEL.feather)+',hl), m2=smoothstep('+f(CEL.step2-CEL.feather*1.5)+','+f(CEL.step2+CEL.feather*1.5)+',hl);\n'+
    '  vec3 tone=mix('+v3(CEL.shade2)+',mix('+v3(CEL.shade1)+',vec3('+f(CEL.lit)+'),m1),m2);\n'+
    '  vec3 c=base*tone; float l=dot(c,W); c=mix(vec3(l),c,'+f(CEL.sat)+'+0.12*(1.0-m1));\n'+
    /* v85 light colour: the lit side takes the key light\'s warmth, the shadow side the sky fill's cool, so dusk and night stages colour the characters too */
    '  c*=mix(vec3(1.0),keyC,'+f(CEL.keyTint)+'*m1); c*=mix(vec3(1.0),fillC*1.04,'+f(CEL.fillTint)+'*(1.0-m1));\n'+
    /* v85 hair/armour sheen: a hard-edged highlight band on dark surfaces, the anime "angel ring" */
    '  float bl=dot(base,W), ring=smoothstep('+f(CEL.ringLo)+','+f(CEL.ringLo+0.03)+',N.y)*(1.0-smoothstep('+f(CEL.ringHi)+','+f(CEL.ringHi+0.03)+',N.y));\n'+
    '  c+=(base*1.9+vec3(0.07,0.08,0.14))*ring*smoothstep(0.36,0.12,bl)*m1*'+f(CEL.ring)+';\n'+
    '  float rim=1.0-max(dot(N,normalize(vViewPosition)),0.0);\n'+
    '  c+=base*smoothstep(0.58,1.0,rim)*'+f(CEL.rim)+'*(0.35+0.65*m1)+vec3(0.05)*smoothstep(0.8,1.0,rim);\n'+
    '  outgoingLight=clamp(c*env,0.0,1.0)+totalEmissiveRadiance; outgoingLight=mix(outgoingLight,mix(vec3(1.0,0.78,0.3),vec3(1.0,0.28,0.12),clamp(vGkP.y*0.4,0.0,1.0)),gkEdge*step(0.001,uDis)); }\n#include <opaque_fragment>'); };
  m.customProgramCacheKey=()=>o.bones?'gk3d-cel2-bones':'gk3d-cel2'; return m; }
/* ink outline for bone-texture troops: same screen-space width rules as the heroes' outline */
function olBonesMat(tex){ const m=new T.MeshBasicMaterial({color:0xFFFFFF,side:T.BackSide,fog:false,vertexColors:true});
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,OL_U); sh.uniforms.uBones={value:tex};
    sh.vertexShader=BONE_GLSL+'uniform float uOut; uniform vec2 uRes; uniform float uMinPx; uniform float uMaxPx; uniform float uWorld;\n'+sh.vertexShader
      .replace('#include <begin_vertex>','mat4 gkM=gkBoneM();\nvec3 transformed=(gkM*vec4(position,1.0)).xyz; vec3 gkN=normalize(mat3(instanceMatrix)*(mat3(gkM)*normal));')
      .replace('#include <project_vertex>','#include <project_vertex>\n{ vec3 nV=normalize((viewMatrix*vec4(gkN,0.0)).xyz); vec2 d=(projectionMatrix*vec4(nV,0.0)).xy; float dl=length(d);\n  if(dl>1e-5){ float w=max(gl_Position.w,1e-3); float sc=length(instanceMatrix[0].xyz); float px=clamp(uWorld*sc*projectionMatrix[1][1]*0.5*uRes.y/w,uMinPx*0.85,uMaxPx)*uOut; gl_Position.xy+=(d/dl)*px*2.0/uRes*w; } }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  diffuseColor.rgb=mix(vec3(0.102,0.078,0.133),diffuseColor.rgb*0.30,0.55);'); };
  m.customProgramCacheKey=()=>'gk3d-ol-bones2'; return m; }

/* ================================================================ palette helpers */
const shade=(c,f)=>{ _c.set(c); const r=Math.min(255,Math.round(_c.r*255*f)), g=Math.min(255,Math.round(_c.g*255*f)), b=Math.min(255,Math.round(_c.b*255*f)); return (r<<16)|(g<<8)|b; };
const INK=0x1A1422;

/* ================================================================ HUMANOID
   Model units: feet at y=0, about 2 units tall. Faces +Z. */
const BUILDS={
  chibi:  {head:0.36,leg:0.62,torso:0.5, w:0.28,limb:0.088,arm:0.5},
  hero:   {head:0.33,leg:0.72,torso:0.56,w:0.27,limb:0.075,arm:0.58},
  slim:   {head:0.32,leg:0.76,torso:0.56,w:0.25,limb:0.068,arm:0.58},
  normal: {head:0.31,leg:0.74,torso:0.58,w:0.3, limb:0.082,arm:0.6},
  broad:  {head:0.29,leg:0.7, torso:0.64,w:0.4, limb:0.11, arm:0.66},
  giant:  {head:0.29,leg:0.7, torso:0.7, w:0.48,limb:0.14, arm:0.74},
  round:  {head:0.3, leg:0.5, torso:0.6, w:0.48,limb:0.1,  arm:0.55},
  heroic: {head:0.27,leg:0.96,torso:0.74,w:0.36,limb:0.1,  arm:0.78},   /* warriors: tall, broad shoulders, smaller head */
  titan:  {head:0.26,leg:0.9, torso:0.82,w:0.48,limb:0.13, arm:0.86},   /* warlords and war gods */
  divine: {head:0.25,leg:1.0, torso:0.7, w:0.3, limb:0.08, arm:0.76},
  /* heroic anime, tuned for the game camera (v82): heads about a sixth of the body rather than a seventh,
     because at 50-70 pixels tall a seventh-size head leaves the face as a few pixels; limbs a touch thicker */
  a_male:   {head:0.21, leg:1.12,torso:0.8, w:0.28,limb:0.072,arm:0.85},
  a_female: {head:0.203,leg:1.13,torso:0.72,w:0.225,limb:0.06,arm:0.79},
  a_youth:  {head:0.218,leg:1.0, torso:0.72,w:0.26,limb:0.068,arm:0.77},
  a_hero:   {head:0.2,  leg:1.1, torso:0.9, w:0.37,limb:0.09, arm:0.91},
  a_titan:  {head:0.2,  leg:1.06,torso:1.0, w:0.47,limb:0.118,arm:1.0},
  a_round:  {head:0.23, leg:0.72,torso:0.78,w:0.5, limb:0.1,  arm:0.7},
  /* chibi class bodies: big heads on bodies shaped by class */
  c_warrior:{head:0.33, leg:0.64,torso:0.6, w:0.35,limb:0.1,  arm:0.6},
  c_titan:  {head:0.32, leg:0.64,torso:0.7, w:0.47,limb:0.13, arm:0.7},
  c_divine: {head:0.33, leg:0.72,torso:0.56,w:0.26,limb:0.07, arm:0.56}};
const CHIBI_OF={heroic:'c_warrior',titan:'c_titan',divine:'c_divine'};
const FEMALE=new Set(['kitsune','amaterasu','izanami','marishi','yukionna','hannya','jorogumo','ungai','orizuru','inari','mioya']);
const YOUTH=new Set(['hero','samurai','onmyoji','ninja','kitsune','amaterasu']);
function animeBuild(sp){ if(sp.abuild) return sp.abuild; const b=sp.build||'normal', k=sp.key, fem=FEMALE.has(k);
  if(b==='round') return 'a_round'; if(b==='giant'||b==='titan') return 'a_titan'; if(b==='broad'||b==='heroic') return 'a_hero';
  return fem?'a_female':YOUTH.has(k)?'a_youth':'a_male'; }  /* serene gods: tall and elegant */

/* ================================================================ v71 detail kit
   Shared building blocks that bring a code-built character closer to its painted art:
   layered anime eyes, strand-by-strand flowing hair, an open layered furisode with hanging sleeves,
   a flaming sun halo and an ornate bow. Every part can carry a colour gradient (o.grad). */
function faceAnime(R,hr,hy,eyes,hairCol,skin,sp){
  sp=sp||{}; const ec=eyes.col||0x6A4A2A, fierce=!!eyes.fierce, glow=!!eyes.glow, old=sp.head==='old'||!!eyes.old, closed=eyes.style==='closed';
  const big=(sp.build==='chibi'||sp.build==='slim'||sp.build==='hero')&&!fierce?1:0.86;
  const ew=hr*0.2*big, eh=hr*(fierce?0.2:old?0.13:0.27)*big, sx=hr*0.36, ey=hy-hr*(fierce?0.08:0.14);
  for(const sd of [1,-1]){
    const x=sd*sx, z=hr*0.98*Math.sqrt(Math.max(0,1-(x/hr)**2-((ey-hy)/(1.05*hr))**2)), ry=sd*Math.asin(Math.min(0.9,Math.abs(x)/hr))*0.85;
    const P=(dx,dy,dz)=>[x+dx*Math.cos(ry)+dz*Math.sin(ry), ey+dy, z-dx*Math.sin(ry)+dz*Math.cos(ry)];
    const at=(dx,dy,dz)=>({p:P(dx,dy,dz),r:[0,ry,0],ol:false});
    const tube=(pts,r0,r1,col,o)=>R.add('head',G_.tube(pts.map(q=>P(q[0],q[1],q[2])),r0,r1,6,12),col,Object.assign({ol:false},o||{}));
    if(closed){ tube([[-sd*ew*0.9,0,0],[0,-eh*0.35,ew*0.05],[sd*ew*0.95,0,0]],ew*0.1,ew*0.05,0x1A1018);
      tube([[-sd*ew*0.75,eh*1.25,-ew*0.02],[sd*ew*0.15,eh*1.5,0],[sd*ew*1.0,eh*1.3,-ew*0.08]],ew*0.07,ew*0.03,shade(hairCol,0.62)); continue; }
    R.add('head',G_.sph(ew*1.06,eh*1.02,ew*0.3,18,12),glow?shade(ec,0.5):0xFFFFFF,Object.assign(at(0,0,-ew*0.1),glow?{glow:true}:{}));
    if(glow){ R.add('head',G_.sph(ew*0.85,eh*0.85,ew*0.3,16,10),ec,Object.assign(at(0,-eh*0.05,-ew*0.05),{glow:true,grad:0xFFFFFF}));
      R.add('head',G_.sph(ew*0.3,eh*0.35,ew*0.22,10,6),0xFFFFFF,Object.assign(at(0,-eh*0.05,ew*0.05),{glow:true})); }
    else {
      R.add('head',G_.sph(ew*0.8,eh*0.92,ew*0.28,18,12),shade(ec,0.45),Object.assign(at(-sd*ew*0.04,-eh*0.04,-ew*0.04),{grad:shade(ec,1.4),gax:1.3}));
      R.add('head',G_.sph(ew*0.62,eh*0.7,ew*0.27,16,10),shade(ec,0.75),Object.assign(at(-sd*ew*0.04,-eh*0.1,-ew*0.02),{grad:shade(ec,1.6)}));
      R.add('head',G_.sph(ew*(fierce?0.28:0.36),eh*0.46,ew*0.25,12,8),0x1A0E10,at(-sd*ew*0.04,-eh*0.02,0));
      R.add('head',G_.sph(ew*0.3,eh*0.26,ew*0.2,10,6),0xFFFFFF,Object.assign(at(-ew*0.26,eh*0.34,ew*0.07),{glow:true}));
      R.add('head',G_.sph(ew*0.14,eh*0.12,ew*0.15,8,6),0xFFFFFF,Object.assign(at(ew*0.24,-eh*0.36,ew*0.06),{glow:true})); }
    if(fierce){ tube([[-sd*ew*1.05,eh*0.2,0],[-sd*ew*0.2,eh*0.85,ew*0.05],[sd*ew*0.7,eh*0.95,ew*0.03],[sd*ew*1.25,eh*0.75,0]],ew*0.15,ew*0.07,0x1A1018);
      tube([[-sd*ew*1.0,eh*1.0,0],[-sd*ew*0.1,eh*1.45,0],[sd*ew*1.1,eh*2.0,-ew*0.06]],ew*0.16,ew*0.06,shade(eyes.browCol||hairCol,0.55)); }   /* heavy angry brow sloping down to the nose */
    else { tube([[-sd*ew*1.05,eh*0.5,0],[-sd*ew*0.3,eh*0.98,ew*0.05],[sd*ew*0.6,eh*0.92,ew*0.03],[sd*ew*1.12,eh*0.62,0],[sd*ew*1.5,eh*0.92,-ew*0.08]],ew*0.13,ew*0.05,0x1A1018);
      tube([[sd*ew*0.15,-eh*0.98,0],[sd*ew*0.7,-eh*0.82,0],[sd*ew*1.0,-eh*0.55,0]],ew*0.045,ew*0.02,0x3A2228);
      tube([[-sd*ew*0.75,eh*1.55+(old?eh*0.6:0),-ew*0.02],[sd*ew*0.15,eh*1.82+(old?eh*0.6:0),0],[sd*ew*1.0,eh*1.62+(old?eh*0.5:0),-ew*0.08]],ew*(old?0.12:0.07),ew*0.03,shade(eyes.browCol||hairCol,0.62)); }
    if(!fierce&&!old&&eyes.blush!==false) R.add('head',G_.sph(ew*0.55,eh*0.22,ew*0.12,10,6),0xF6A2AE,at(sd*ew*0.35,-eh*1.45,-ew*0.05)); }
  const zm=hr*0.84;
  if(eyes.grin){ R.add('head',G_.tube([[-hr*0.3,hy-hr*0.42,zm-0.01],[0,hy-hr*0.6,zm+hr*0.02],[hr*0.3,hy-hr*0.42,zm-0.01]],hr*0.06,hr*0.05,6,10),0x3A1414,{ol:false});
    R.add('head',G_.box(hr*0.48,hr*0.06,hr*0.05),0xFFFFFF,{p:[0,hy-hr*0.46,zm+hr*0.06],ol:false});
    for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.06,hr*0.2,5),0xFFFFFF,{p:[sd*hr*0.22,hy-hr*0.4,zm+hr*0.05],ol:false}); }
  else if(fierce) R.add('head',G_.tube([[-hr*0.13,hy-hr*0.53,zm],[0,hy-hr*0.49,zm+hr*0.01],[hr*0.13,hy-hr*0.53,zm]],hr*0.022,hr*0.018,5,8),0x5A2020,{ol:false});
  else if(eyes.mouth!==false) R.add('head',G_.tube([[-hr*0.075,hy-hr*0.5,zm],[0,hy-hr*0.535,zm+hr*0.01],[hr*0.075,hy-hr*0.5,zm]],hr*0.018,hr*0.014,5,8),0x9A3A3A,{ol:false});
  R.add('head',G_.sph(hr*0.035,hr*0.025,hr*0.02),shade(skin,0.85),{p:[0,hy-hr*0.3,hr*0.97],ol:false});
  if(old) for(let i=0;i<2;i++) R.add('head',G_.box(hr*0.55,0.01,0.01),shade(skin,0.72),{p:[0,hy+hr*(0.45+i*0.12),hr*0.92],ol:false}); }

function hairFlow(R,H,hr,hy,cap,hk){
  const c=H.col||0x2A2433, tip=H.col2||shade(c,1.3), root=shade(c,0.82), L=hr*(H.len||4)*(hk||1), fl=H.flare||1.4;
  cap();
  const nb=H.bangs||9;
  for(let i=0;i<nb;i++){ const u=i/(nb-1)-0.5, a=u*2.1, side=Math.abs(u)*2, len=hr*(0.62+0.45*side*side+((i%3)-1)*0.05);
    const pts=[[Math.sin(a)*hr*0.3,hy+hr*1.02,Math.cos(a)*hr*0.35],[Math.sin(a)*hr*0.72,hy+hr*0.72,Math.cos(a)*hr*1.0],[Math.sin(a)*hr*(0.8+side*0.18),hy+hr*0.98-len,Math.cos(a)*hr*(0.98-side*0.12)]];
    R.add('head',G_.tube(pts,hr*0.16,hr*0.015,6,10),c,{grad:tip,gax:1.5}); }
  for(const sd of [1,-1]) for(let k=0;k<2;k++){ const o=k*hr*0.12;
    R.add('head',G_.tube([[sd*hr*0.82,hy+hr*0.45,hr*0.3+o],[sd*(hr*0.98+o),hy-hr*0.35,hr*0.45],[sd*(hr*0.9+o*1.5),hy-hr*(1.2+k*0.3),hr*0.55],[sd*(hr*0.98+o*2),hy-hr*(2.0+k*0.4),hr*0.5]],hr*(0.26-k*0.05),hr*0.03,7,14),k?root:c,{grad:tip}); }
  const hb=p=>[p[0],p[1]-hr*0.9,p[2]+hr*0.4], n=Math.max(4,Math.round((H.strands||16)*SEGK));   /* back hair hangs from the swaying hair bone */
  R.add('hair',G_.lathe([[hr*0.9,hy+hr*0.55],[hr*1.12,hy-hr*0.4],[hr*(1.25+fl*0.35),hy-L*0.5],[hr*(1.3+fl*0.75),hy-L*0.9],[hr*(1.1+fl*0.7),hy-L*0.97]],20),root,{p:hb([0,0,-hr*0.78]),s:[1,1,0.38],grad:tip,gax:1.2});
  for(let i=0;i<n;i++){ const u=i/(n-1)-0.5, a=u*2.3, au=Math.abs(u), w=Math.sin(i*1.7)*hr*0.18;
    const pts=[[Math.sin(a)*hr*0.85,hy+hr*0.5*Math.cos(u*1.3),-Math.cos(a)*hr*0.62-hr*0.08],
      [Math.sin(a)*hr*(1.2+au*0.6),hy-hr*0.45,-hr*0.78-Math.cos(a)*hr*0.18],
      [Math.sin(a)*hr*(1.3+fl*au*0.9)+w,hy-L*0.55,-hr*0.62+Math.cos(i)*hr*0.1],
      [Math.sin(a)*hr*(1.35+fl*au*1.5)-w,hy-L*(0.9+0.08*Math.sin(i*2.3)),-hr*0.4]].map(hb);
    R.add('hair',G_.tube(pts,hr*(0.36-au*0.08),hr*0.04,6,14),i%3===1?root:c,{grad:tip,gax:0.8}); }
  if(H.ornament==='sun') for(const sd of [1,-1]){
    R.add('head',G_.cyl(hr*0.24,hr*0.24,hr*0.06,16),0xF5C542,{p:[sd*hr*0.95,hy+hr*0.42,hr*0.12],r:[0,0,sd*Math.PI/2]});
    R.add('head',G_.star(hr*0.36,hr*0.2,10,hr*0.04),0xFFB020,{p:[sd*hr*0.99,hy+hr*0.42,hr*0.12],r:[0,sd*Math.PI/2,0],glow:true});
    R.add('head',G_.sph(hr*0.12,hr*0.12,hr*0.05),0xFFF1B0,{p:[sd*hr*1.03,hy+hr*0.42,hr*0.12],r:[0,sd*Math.PI/2,0],glow:true});
    for(let k=0;k<3;k++) R.add('head',G_.sph(hr*0.11),0xFFFFFF,{p:[sd*hr*(0.82+k*0.08),hy+hr*(0.7+k*0.06),hr*(0.35-k*0.12)]});      /* white blossoms */
    R.add('head',G_.tube([[0,0,0],[sd*hr*0.05,-hr*0.5,hr*0.02],[sd*hr*0.02,-hr*1.1,0]],hr*0.05,hr*0.035,5,8),0xD8241A,{p:[sd*hr*1.0,hy+hr*0.3,hr*0.12]});   /* tassels */
    R.add('head',G_.sph(hr*0.07),0xF5C542,{p:[sd*hr*1.02,hy-hr*0.82,hr*0.12]}); } }

function outfitFurisode(R,o,B,legL,spineH,chestH,armSeg,skin){
  const oc=o.col||0xFFF6E6, red=o.col2||0xD8341E, trim=o.trim||0xF5C542, len=legL*0.98, gap=0.42;
  const prof=[[B.w*1.0,0.06],[B.w*1.12,-len*0.25],[B.w*1.42,-len*0.7],[B.w*1.72,-len],[B.w*1.68,-len*1.01]];
  const rAt=y=>{ for(let i=0;i<prof.length-1;i++){ const a=prof[i],b=prof[i+1]; if(y<=a[1]&&y>=b[1]) return lerp(a[0],b[0],(a[1]-y)/(a[1]-b[1])); } return prof[prof.length-1][0]; };
  /* inner red layers, then the open white outer robe */
  R.add('skirt',G_.lathe([[B.w*0.95,0.05],[B.w*1.02,-len*0.3],[B.w*1.25,-len*0.75],[B.w*1.45,-len*1.02],[B.w*1.4,-len*1.03]],22),red,{grad:shade(red,0.78)});
  R.add('skirt',G_.lathe([[B.w*0.9,0.0],[B.w*0.98,-len*0.35],[B.w*1.08,-len*0.8],[B.w*1.16,-len*1.04]],18),0xFFFFFF,{p:[0,-0.01,0]});
  R.add('skirt',G_.lathe(prof,26,gap,TAU-gap*2),oc,{grad:shade(oc,0.86),gax:1.4});
  const edge=phi=>prof.map(q=>[Math.sin(phi)*(q[0]+0.006),q[1],Math.cos(phi)*(q[0]+0.006)]);
  for(const phi of [gap,TAU-gap]) R.add('skirt',G_.tube(edge(phi),0.028,0.028,6,16),trim,{});
  const hem=[]; for(let k=0;k<=24;k++){ const phi=gap+(TAU-gap*2)*k/24; hem.push([Math.sin(phi)*prof[3][0]*1.01,-len+0.01,Math.cos(phi)*prof[3][0]*1.01]); }
  R.add('skirt',G_.tube(hem,0.03,0.03,6,48),trim,{});
  for(let k=0;k<12;k++){ const phi=gap+0.25+(TAU-gap*2-0.5)*k/11, y=-len*(0.42+0.36*((k*7)%3)/2), rr=rAt(y)+0.012;   /* sun motifs */
    R.add('skirt',G_.star(0.075,0.03,8,0.012),o.motif||trim,{p:[Math.sin(phi)*rr,y,Math.cos(phi)*rr],r:[0,phi,0],ol:false});
    R.add('skirt',G_.sph(0.028,0.028,0.012),0xE8341E,{p:[Math.sin(phi)*(rr+0.01),y,Math.cos(phi)*(rr+0.01)],r:[0,phi,0],ol:false}); }
  /* collar: red under-collar, white, gold edge */
  for(const sd of [1,-1]){ R.add('chest',G_.box(0.085,chestH*1.1,0.03),red,{p:[sd*B.w*0.2,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.48]});
    R.add('chest',G_.box(0.03,chestH*1.1,0.035),trim,{p:[sd*B.w*0.27,chestH*0.42,B.w*0.71],r:[0.12,0,sd*0.48],ol:false}); }
  R.add('chest',G_.sph(B.w*0.32,chestH*0.22,0.04),trim,{p:[0,chestH*0.62,B.w*0.72]});                            /* chest ornament */
  R.add('chest',G_.star(B.w*0.28,B.w*0.14,12,0.02),0xFFC531,{p:[0,chestH*0.62,B.w*0.76],glow:true});
  /* obi, cords, front brooch, big bow behind, tassels */
  R.add('spine',G_.cyl(B.w*1.0,B.w*1.02,spineH*0.62,22),o.belt||0xC8241A,{p:[0,spineH*0.2,0],s:[1,1,0.78]});
  for(const dy of [-0.22,0.22]) R.add('spine',G_.tor(B.w*1.02,0.014,5,28),trim,{p:[0,spineH*(0.2+dy),0],r:[Math.PI/2,0,0],s:[1,0.78,1],ol:false});
  R.add('spine',G_.sph(0.07,0.07,0.03),0xFFE27A,{p:[0,spineH*0.2,B.w*0.8],glow:true}); R.add('spine',G_.tor(0.075,0.014,5,16),trim,{p:[0,spineH*0.2,B.w*0.8]});
  for(const sd of [1,-1]){ R.add('spine',G_.tor(0.13,0.045,6,14),o.belt||0xC8241A,{p:[sd*0.13,spineH*0.3,-B.w*0.85],r:[0,sd*0.5,0],s:[1,0.75,0.6]});
    R.add('spine',G_.box(0.1,0.42,0.03),o.belt||0xC8241A,{p:[sd*0.07,-spineH*0.6,-B.w*0.86],r:[0.1,0,sd*0.12],grad:shade(o.belt||0xC8241A,0.7)});
    R.add('spine',G_.tube([[0,0,0],[sd*0.02,-0.25,0.02],[sd*0.03,-0.5,0]],0.018,0.016,5,8),0xD8241A,{p:[sd*0.12,spineH*0.05,B.w*0.8]});
    R.add('spine',G_.sph(0.035),trim,{p:[sd*0.15,spineH*0.05-0.5,B.w*0.8]}); }
  /* furisode sleeves: long hanging panels with red lining and a gold hem */
  for(const sd of [1,-1]){ const L=sd>0?'L':'R';
    R.add('elbow'+L,G_.lathe([[B.limb*1.6,armSeg*0.45],[0.18,armSeg*0.1],[0.26,-0.2],[0.28,-0.45],[0.21,-0.6],[0.001,-0.63]],18),oc,{p:[sd*0.07,0,-0.02],r:[0,0,sd*0.12],s:[1,1,0.42],grad:shade(oc,0.86)});
    R.add('elbow'+L,G_.lathe([[0.2,-0.5],[0.23,-0.56],[0.001,-0.64]],14),red,{p:[sd*0.07,0,-0.02],r:[0,0,sd*0.12],s:[1,1,0.44]});
    const hm=[]; for(let k=0;k<=12;k++){ const a=k/12*TAU; hm.push([Math.sin(a)*0.235,-0.55-Math.cos(a)*0.02,Math.cos(a)*0.235*0.43]); }
    R.add('elbow'+L,G_.tube(hm,0.018,0.018,5,24),trim,{p:[sd*0.07,0,-0.02],r:[0,0,sd*0.12]});
    for(const dy of [-0.18,-0.4]) R.add('elbow'+L,G_.star(0.075,0.03,8,0.012),trim,{p:[sd*(0.07+0.04),dy,0.125],ol:false});
    R.add('elbow'+L,G_.tor(B.limb*1.5,B.limb*0.35,6,14),red,{p:[0,-armSeg*0.82,0.0],r:[Math.PI/2,0,0]});
    /* sandals and anklets */
    R.add('foot'+L,G_.box(B.limb*1.7,0.035,B.limb*3.3),0xC8A060,{p:[0,-0.035,B.limb*0.9]}); R.add('foot'+L,G_.box(B.limb*1.2,0.03,0.025),0xD8241A,{p:[0,0.04,B.limb*1.6],ol:false});
    R.add('knee'+L,G_.tor(B.limb*1.1,0.018,5,14),trim,{p:[0,-0.0,0],r:[Math.PI/2,0,0],ol:false}); } }

function backSunflame(R,K,B,sp){
  const hr=B.head, hy=hr*0.95, c=[0,hy+hr*0.1,-hr*1.25];
  const at=(dz,rz)=>({p:[c[0],c[1],c[2]+dz],r:[0,0,rz||0],glow:true});
  R.add('head',G_.star(hr*2.35,hr*1.75,22,0.03),0xFF8A14,at(-0.03));
  R.add('head',G_.star(hr*2.05,hr*1.62,22,0.03),0xFFB424,at(-0.015,Math.PI/22));
  R.add('head',G_.cyl(hr*1.6,hr*1.6,0.02,40),0xFFE36E,Object.assign(at(0),{r:[Math.PI/2,0,0],grad:0xFFF6C8}));
  R.add('head',G_.tor(hr*1.62,hr*0.07,6,48),0xF5B820,{p:c});
  R.add('head',G_.tor(hr*1.2,hr*0.035,5,40),0xFFF1B0,{p:[c[0],c[1],c[2]+0.012],glow:true});
  for(let i=0;i<12;i++){ const a=i/12*TAU+0.13, r0=hr*1.85, sx=Math.sin(a), cy=Math.cos(a), tx=Math.cos(a), ty=-Math.sin(a), cr=(i%2?1:-1);
    const pts=[[sx*r0,cy*r0,0],[sx*hr*2.35+tx*hr*0.2*cr,cy*hr*2.35+ty*hr*0.2*cr,0],[sx*hr*2.65-tx*hr*0.08*cr,cy*hr*2.65-ty*hr*0.08*cr,0],[sx*hr*2.8+tx*hr*0.2*cr,cy*hr*2.8+ty*hr*0.2*cr,0]];
    R.add('head',G_.tube(pts,hr*0.17,hr*0.01,5,10),0xFF9A1E,{p:[c[0],c[1],c[2]-0.02],glow:true,grad:0xFFE27A}); } }

function weaponSunbow(R,W,B){
  const g=W.col||0xF5C542, p={p:[0.05,-B.limb*0.7,0.07]};
  const arc=[[0,-0.92,0],[0.14,-0.6,0],[0.22,-0.2,0],[0.24,0,0],[0.22,0.2,0],[0.14,0.6,0],[0,0.92,0]];
  R.add('handL',G_.tube(arc,0.04,0.03,7,28),g,Object.assign({grad:0xFFB020},p));
  for(const sd of [1,-1]){ const curl=[];   /* flame curls at each tip */
    for(let k=0;k<=10;k++){ const a=k/10*Math.PI*1.6, r=0.13*(1-k/14); curl.push([-0.02-Math.sin(a)*r, sd*(0.92+0.12-Math.cos(a)*r*0.9+0.0), 0]); }
    R.add('handL',G_.tube(curl,0.03,0.008,6,20),0xFFC531,{p:p.p,grad:0xFF8A14});
    R.add('handL',G_.cone(0.05,0.28,5),0xFF9A1E,{p:[p.p[0]+0.14,p.p[1]+sd*0.62,p.p[2]],r:[0,0,sd>0?-0.6:Math.PI+0.6],glow:true}); }
  R.add('handL',G_.cyl(0.05,0.05,0.2,10),0xC8241A,{p:p.p});
  R.add('handL',G_.sph(0.09),0xFFE27A,{p:[p.p[0]+0.26,p.p[1],p.p[2]],glow:true}); R.add('handL',G_.star(0.17,0.09,10,0.02),0xFFB020,{p:[p.p[0]+0.26,p.p[1],p.p[2]-0.01],glow:true});
  R.add('handL',G_.cyl(0.006,0.006,1.84,3),0xFFF1B0,{p:[p.p[0]-0.005,p.p[1],p.p[2]],glow:true}); }

/* ================================================================ v72 class kit
   Faces and bodies that tell the classes apart: adult elegant gods, fierce warriors and war gods,
   armoured face masks (mempo), dragon heads, and snarling beast heads with big menacing eyes. */
function faceAdult(R,hr,hy,sp,eyes,hairCol,skin){
  const mode=sp.face, ec=eyes.col||0x6A4A2A, glow=!!eyes.glow, fierce=mode!=='elegant';
  const ew=hr*(mode==='elegant'?0.18:0.2), eh=hr*(mode==='elegant'?0.135:0.115), sx=hr*0.37, ey=hy-hr*0.04;
  const sk=shade(skin,0.82), ink=0x140C10;
  for(const sd of [1,-1]){
    const x=sd*sx, z=hr*0.98*Math.sqrt(Math.max(0,1-(x/hr)**2-((ey-hy)/(1.1*hr))**2)), ry=sd*Math.asin(Math.min(0.9,Math.abs(x)/hr))*0.85;
    const tilt=mode==='elegant'?sd*-0.14:sd*0.2;
    const P=(dx,dy,dz)=>[x+dx*Math.cos(ry)+dz*Math.sin(ry), ey+dy, z-dx*Math.sin(ry)+dz*Math.cos(ry)];
    const at=(dx,dy,dz,o)=>Object.assign({p:P(dx,dy,dz),r:[0,ry,tilt],ol:false},o||{});
    const tube=(pts,r0,r1,col,o)=>R.add('head',G_.tube(pts.map(q=>P(q[0],q[1],q[2])),r0,r1,6,10),col,Object.assign({ol:false},o||{}));
    R.add('head',G_.sph(ew*1.15,eh,ew*0.3,16,10),glow?shade(ec,0.55):0xFFF8F0,at(0,0,-ew*0.1,glow?{glow:true}:{}));
    R.add('head',G_.sph(ew*0.62,eh*0.98,ew*0.28,14,10),glow?ec:shade(ec,0.5),at(-sd*ew*0.05,-eh*0.02,-ew*0.04,{glow,grad:glow?0xFFFFFF:shade(ec,1.5)}));
    if(!glow){ R.add('head',G_.sph(ew*0.26,eh*0.6,ew*0.25,10,8),0x120808,at(-sd*ew*0.05,0,0)); R.add('head',G_.sph(ew*0.14,eh*0.25,ew*0.15,8,6),0xFFFFFF,at(-ew*0.2,eh*0.35,ew*0.06,{glow:true})); }
    else R.add('head',G_.sph(ew*0.12,eh*0.75,ew*0.22,8,6),0xFFFFFF,at(-sd*ew*0.05,0,ew*0.02,{glow:true}));
    if(mode==='elegant'){
      tube([[-sd*ew*1.1,eh*0.25,0],[-sd*ew*0.2,eh*0.95,ew*0.04],[sd*ew*0.8,eh*0.9,ew*0.02],[sd*ew*1.35,eh*0.55,0],[sd*ew*1.75,eh*1.0,-ew*0.1]],ew*0.12,ew*0.03,ink);   /* winged liner */
      tube([[sd*ew*0.2,-eh*1.0,0],[sd*ew*0.9,-eh*0.7,0],[sd*ew*1.3,-eh*0.3,0]],ew*0.04,ew*0.015,0x5A2A30);
      tube([[-sd*ew*0.85,eh*2.3,-ew*0.02],[sd*ew*0.1,eh*2.75,0],[sd*ew*1.2,eh*2.45,-ew*0.1]],ew*0.06,ew*0.02,shade(eyes.browCol||hairCol,0.6));
      if(sp.liner!==false) R.add('head',G_.sph(ew*0.5,eh*0.5,ew*0.1,8,6),sp.liner||0xD86A7A,at(sd*ew*0.9,eh*0.6,-ew*0.12,{grad:skin})); }
    else {
      tube([[-sd*ew*1.15,eh*0.1,0],[-sd*ew*0.3,eh*0.95,ew*0.04],[sd*ew*0.7,eh*1.0,ew*0.02],[sd*ew*1.3,eh*0.55,0]],ew*0.15,ew*0.06,ink);   /* hard upper lid */
      tube([[-sd*ew*1.0,-eh*0.5,0],[sd*ew*0.2,-eh*1.05,0],[sd*ew*1.2,-eh*0.6,0]],ew*0.05,ew*0.02,sk);
      tube([[-sd*ew*1.25,eh*0.9,ew*0.06],[-sd*ew*0.3,eh*1.9,ew*0.05],[sd*ew*0.9,eh*3.0,-ew*0.02],[sd*ew*1.6,eh*3.1,-ew*0.12]],ew*0.3,ew*0.09,shade(eyes.browCol||hairCol,0.45));   /* heavy brow, low at the nose */
      tube([[-sd*ew*1.0,eh*0.9,ew*0.06],[sd*ew*0.2,eh*1.55,ew*0.08],[sd*ew*1.2,eh*1.3,ew*0.02]],ew*0.12,ew*0.04,sk);   /* brow ridge shadow */
      tube([[sd*ew*0.2,-eh*2.0,0],[sd*ew*0.9,-eh*3.6,-ew*0.05]],ew*0.035,ew*0.015,sk); } }   /* cheekbone line */
  const zf=hr*0.95;
  if(mode!=='elegant'){ for(const sd of [1,-1]) R.add('head',G_.tube([[sd*hr*0.06,ey+hr*0.13,zf+0.004],[sd*hr*0.045,ey+hr*0.04,zf+0.008]],hr*0.012,hr*0.008,4,4),sk,{ol:false}); }   /* frown furrows */
  R.add('head',G_.cone(hr*0.07,hr*0.22,4),shade(skin,0.93),{p:[0,hy-hr*0.28,hr*0.98],r:[Math.PI/2+0.35,Math.PI/4,0],ol:false});   /* nose */
  R.add('head',G_.tube([[-hr*0.06,hy-hr*0.37,hr*0.97],[0,hy-hr*0.39,hr*1.0],[hr*0.06,hy-hr*0.37,hr*0.97]],hr*0.014,hr*0.01,4,6),sk,{ol:false});
  if(sp.face==='mempo') faceMempo(R,hr,hy,sp);
  else if(mode==='elegant') R.add('head',G_.tube([[-hr*0.085,hy-hr*0.53,hr*0.86],[0,hy-hr*0.555,hr*0.885],[hr*0.085,hy-hr*0.53,hr*0.86]],hr*0.024,hr*0.016,5,8),eyes.lip||0xB8484E,{ol:false});
  else if(eyes.grin){ R.add('head',G_.box(hr*0.42,hr*0.09,hr*0.05),0xFFFFFF,{p:[0,hy-hr*0.55,hr*0.86],ol:false}); R.add('head',G_.box(hr*0.44,hr*0.012,hr*0.055),0x3A1A1A,{p:[0,hy-hr*0.55,hr*0.865],ol:false});
    for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.05,hr*0.16,5),0xFFFFFF,{p:[sd*hr*0.17,hy-hr*0.47,hr*0.88],ol:false}); }
  else R.add('head',G_.tube([[-hr*0.12,hy-hr*0.55,hr*0.855],[0,hy-hr*0.52,hr*0.88],[hr*0.12,hy-hr*0.55,hr*0.855]],hr*0.022,hr*0.016,5,8),0x5A2020,{ol:false});
  if(sp.mark) R.add('head',G_.star(hr*0.09,hr*0.04,4,0.01),sp.mark,{p:[0,hy+hr*0.42,hr*0.92],r:[-0.4,0,0],glow:true}); }

/* mempo: a lacquered half mask over the lower face with a snarling mouth, moustache and throat guard */
function faceMempo(R,hr,hy,sp){
  const c=sp.mempo||0x8C1E1E, g=sp.mempoTrim||0xF5C542;
  R.add('head',G_.part(hr*1.06,hr*1.12,hr*1.06,Math.PI*0.12,Math.PI*0.76,Math.PI*0.55,Math.PI*0.38),c,{p:[0,hy,0.004],grad:shade(c,0.7)});
  R.add('head',G_.cone(hr*0.13,hr*0.3,4),c,{p:[0,hy-hr*0.27,hr*1.02],r:[Math.PI/2+0.3,Math.PI/4,0]});
  R.add('head',G_.box(hr*0.44,hr*0.1,hr*0.06),0x1A0A0A,{p:[0,hy-hr*0.56,hr*0.93],ol:false});
  for(let k=0;k<6;k++) R.add('head',G_.cone(hr*0.03,hr*0.08,4),0xFFF4E0,{p:[(k-2.5)*hr*0.07,hy-hr*0.525,hr*0.955],r:[Math.PI,0,0],ol:false});
  for(const sd of [1,-1]){ R.add('head',G_.tube([[0,0,0],[sd*hr*0.18,-hr*0.02,hr*0.02],[sd*hr*0.36,-hr*0.14,-hr*0.02],[sd*hr*0.44,-hr*0.32,-hr*0.08]],hr*0.05,hr*0.012,5,10),sp.mempoHair||0xF4F1EA,{p:[sd*hr*0.04,hy-hr*0.43,hr*0.98]});
    R.add('head',G_.tube([[sd*hr*0.3,hy-hr*0.38,hr*0.86],[sd*hr*0.38,hy-hr*0.62,hr*0.72]],hr*0.02,hr*0.02,4,6),g,{ol:false}); }
  for(let i=0;i<3;i++) R.add('head',G_.lathe([[hr*(0.62+i*0.08),0],[hr*(0.72+i*0.09),-hr*0.14]],18,-Math.PI*0.7,Math.PI*1.4),i%2?shade(c,0.8):c,{p:[0,hy-hr*(0.78+i*0.13),hr*0.12],grad:shade(c,0.7)}); }

/* dragon head on any bone: skull, long snout, open jaw with teeth, slit eyes, horns, whiskers, mane */
function dragonHead(R,hb,hr,sp,light){
  const c=sp.headCol||sp.col||0x3F7A3A, c2=sp.col2||shade(c,1.3), bel=sp.belly||0xE8D8A8;
  R.add(hb,G_.sph(hr,hr*0.78,hr*1.1,16,12),c,{p:[0,0,hr*0.1],grad:shade(c,0.8)});
  R.add(hb,G_.sph(hr*0.66,hr*0.42,hr*1.05,14,10),c2,{p:[0,-hr*0.05,hr*0.95],grad:c});
  R.add(hb,G_.sph(hr*0.58,hr*0.22,hr*0.95,12,8),bel,{p:[0,-hr*0.48,hr*0.75],r:[0.22,0,0],grad:shade(bel,0.85)});
  R.add(hb,G_.sph(hr*0.5,hr*0.08,hr*0.8,10,6),0x8C2A2A,{p:[0,-hr*0.32,hr*0.85],r:[0.12,0,0],ol:false});
  for(let k=0;k<(light?3:5);k++) for(const sd of [1,-1]) R.add(hb,G_.cone(hr*0.06,hr*0.2,4),0xFFFFFF,{p:[sd*hr*(0.42-k*0.03),-hr*0.2,hr*(0.6+k*0.2)],r:[Math.PI,0,0],ol:false});
  for(const sd of [1,-1]){ R.add(hb,G_.sph(hr*0.07,hr*0.05,hr*0.04),INK,{p:[sd*hr*0.2,hr*0.12,hr*1.9],ol:false});
    creatureEye(R,hb,sd*hr*0.52,hr*0.32,hr*0.72,hr*0.22,sp.eyeCol||0xFF3A2A,true,sd*0.6,shade(c,0.55));
    if(sp.horns||sp.antlers) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.3,hr*0.5,-hr*0.4],[sd*hr*0.45,hr*1.05,-hr*1.05],[sd*hr*0.35,hr*1.5,-hr*1.5]],hr*0.16,hr*0.035,6,12),sp.horns||sp.antlers,{p:[sd*hr*0.4,hr*0.45,0],grad:shade(sp.horns||sp.antlers,0.75),glow:!!sp.antlerGlow});
    if(sp.antlers) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.3,hr*0.25,hr*0.15],[sd*hr*0.55,hr*0.45,hr*0.1]],hr*0.08,hr*0.03,5,8),sp.antlers,{p:[sd*hr*0.78,hr*1.3,-hr*0.8],glow:!!sp.antlerGlow});
    if(sp.whiskers) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.5,0,hr*0.4],[sd*hr*1.2,-hr*0.3,hr*0.2],[sd*hr*1.8,-hr*0.65,-hr*0.5]],0.032,0.008,5,14),sp.whiskers,{p:[sd*hr*0.3,-hr*0.1,hr*1.7],glow:true});
    R.add(hb,G_.cone(hr*0.18,hr*0.6,5),c2,{p:[sd*hr*0.85,-hr*0.2,-hr*0.2],r:[0,0,sd*-1.6],grad:shade(c2,0.7)}); }
  if(sp.mane) furTufts(R,hb,light?6:9,k=>[(k-4)*hr*0.2,hr*0.5,-hr*0.45],hr*1.2,hr*0.18,sp.mane,sp.maneTip||shade(sp.mane,1.3),k=>[(k-4)*0.15,0.2,-1]); }

/* snarling beast heads: tiger, lion-wolf, monkey; open jaw, big fangs, wrinkled muzzle, heavy brow, huge eyes */
function beastHead(R,hb,hr,sp,kind){
  const hc=sp.headCol||sp.col||0x8C6A3A, mz=sp.muzzle||shade(hc,1.2), dark=sp.col2||0x1A1418, ec=sp.eyeCol||0xFFC531;
  const ml=kind==='monkey'?0.55:kind==='tiger'?0.85:1.0;
  R.add(hb,G_.sph(hr*1.05,hr*0.95,hr*1.0,18,14),hc,{grad:shade(hc,0.8)});
  R.add(hb,G_.sph(hr*0.62,hr*0.42,hr*0.7*ml,14,10),mz,{p:[0,-hr*0.18,hr*0.78],grad:shade(mz,0.9)});
  R.add(hb,G_.sph(hr*0.3,hr*0.18,hr*0.18),0x1A1214,{p:[0,-hr*0.05,hr*(0.82+0.62*ml)],ol:false});   /* nose leather */
  R.add(hb,G_.sph(hr*0.5,hr*0.2,hr*0.55*ml,12,8),shade(mz,0.92),{p:[0,-hr*0.62,hr*0.68],r:[0.35,0,0]});   /* dropped lower jaw */
  R.add(hb,G_.sph(hr*0.46,hr*0.16,hr*0.5*ml,12,8),0x8C1E24,{p:[0,-hr*0.45,hr*0.75],r:[0.18,0,0],ol:false});   /* open mouth */
  R.add(hb,G_.sph(hr*0.22,hr*0.06,hr*0.3*ml),0xD86A78,{p:[0,-hr*0.55,hr*0.82],r:[0.3,0,0],ol:false});
  for(const sd of [1,-1]){ R.add(hb,G_.cone(hr*0.09,hr*0.42,6),0xFFF8EC,{p:[sd*hr*0.28,-hr*0.42,hr*(0.68+0.55*ml)],r:[Math.PI-0.15,0,0],ol:false,grad:0xE8DCC0});
    R.add(hb,G_.cone(hr*0.07,hr*0.28,6),0xFFF8EC,{p:[sd*hr*0.24,-hr*0.6,hr*(0.6+0.5*ml)],r:[0.2,0,0],ol:false});
    for(let k=0;k<3;k++) R.add(hb,G_.cone(hr*0.035,hr*0.1,4),0xFFF8EC,{p:[sd*hr*(0.12-k*0.04)+sd*0.01,-hr*0.38,hr*(0.75+0.5*ml)],r:[Math.PI,0,0],ol:false});
    for(let k=0;k<3;k++) R.add(hb,G_.tube([[sd*hr*0.1,hr*(0.05+k*0.07),hr*(0.95+0.3*ml)],[sd*hr*0.22,hr*(0.1+k*0.07),hr*(0.85+0.2*ml)],[sd*hr*0.32,hr*(0.04+k*0.07),hr*(0.7+0.1*ml)]],hr*0.022,hr*0.01,4,6),shade(mz,0.7),{ol:false});   /* snarl wrinkles */
    creatureEye(R,hb,sd*hr*0.42,hr*0.25,hr*0.82,hr*0.26,ec,sp.eyeGlow!==false,sd*0.5,0x140C0C);
    R.add(hb,G_.sph(hr*0.42,hr*0.14,hr*0.24),shade(hc,0.75),{p:[sd*hr*0.4,hr*0.52,hr*0.72],r:[0,sd*0.4,sd*0.45]});   /* heavy brow */
    if(kind==='monkey'){ R.add(hb,G_.sph(hr*0.3,hr*0.36,hr*0.1),sp.earIn||0xD98A6A,{p:[sd*hr*1.05,hr*0.1,0],r:[0,sd*0.6,0]}); }
    else { R.add(hb,G_.cone(hr*0.34,hr*0.75,6),hc,{p:[sd*hr*0.62,hr*0.9,-hr*0.15],r:[-0.2,0,sd*-0.45],grad:shade(hc,0.7)}); R.add(hb,G_.cone(hr*0.2,hr*0.5,6),sp.earIn||0xF2C8C0,{p:[sd*hr*0.6,hr*0.86,-hr*0.05],r:[-0.2,0,sd*-0.45],ol:false}); } }
  if(kind==='tiger') for(let i=0;i<5;i++){ for(const sd of [1,-1]) R.add(hb,G_.tube([[sd*hr*0.2,hr*(0.85-i*0.15),hr*0.6],[sd*hr*0.65,hr*(0.75-i*0.15),hr*0.55],[sd*hr*0.95,hr*(0.5-i*0.15),hr*0.1]],hr*0.05,hr*0.01,4,8),dark,{ol:false}); }
  const ruff=sp.mane||(kind==='tiger'?0xFFF4E0:hc), n=kind==='lion'?22:14;   /* a ruff/mane framing the face */
  furTufts(R,hb,n,i=>{ const a=(i/n-0.5)*Math.PI*1.9; return [Math.sin(a)*hr*0.95,Math.cos(a)*hr*0.85-hr*0.1,-hr*0.05]; },hr*(kind==='lion'?1.2:0.65),hr*(kind==='lion'?0.24:0.16),ruff,sp.maneTip||shade(ruff,1.25),i=>{ const a=(i/n-0.5)*Math.PI*1.9; return [Math.sin(a)*0.85,Math.cos(a)*0.6-0.2,-0.5]; }); }


/* ornate armour for warlords and war gods: sculpted chest plates, gorget, gilded ridges, a long front apron, agemaki bow */
function armorOrnate(R,o,B,legL,spineH,chestH){
  const pc=o.plate||o.col2||0x2A2A30, tr=o.trim||0xF5C542, lc=o.lace||o.col||0x8C1E1E;
  for(const sd of [1,-1]){ R.add('chest',G_.sph(B.w*0.52,chestH*0.34,B.w*0.26),pc,{p:[sd*B.w*0.36,chestH*0.62,B.w*0.6],grad:shade(pc,0.55)});
    R.add('chest',G_.tube([[sd*B.w*0.05,chestH*0.95,B.w*0.7],[sd*B.w*0.55,chestH*0.85,B.w*0.62],[sd*B.w*0.95,chestH*0.7,B.w*0.35]],0.02,0.02,4,8),tr,{ol:false}); }
  R.add('chest',G_.tube([[0,chestH*0.98,B.w*0.72],[0,chestH*0.55,B.w*0.84],[0,chestH*0.1,B.w*0.8]],0.022,0.016,4,8),tr,{ol:false});
  R.add('neck',G_.tor(B.limb*2.3,B.limb*0.55,6,18),pc,{p:[0,-0.02,0.02],r:[Math.PI/2,0,0],grad:tr});
  R.add('skirt',G_.box(B.w*0.75,legL*0.6,0.035),lc,{p:[0,-legL*0.32,B.w*1.15],r:[0.14,0,0],grad:shade(lc,0.6)});
  for(const sd of [1,-1]) R.add('skirt',G_.box(0.03,legL*0.6,0.04),tr,{p:[sd*B.w*0.38,-legL*0.32,B.w*1.16],r:[0.14,0,0],ol:false});
  R.add('skirt',G_.box(B.w*0.78,0.035,0.045),tr,{p:[0,-legL*0.61,B.w*1.2],r:[0.14,0,0],ol:false});
  if(o.apronMon) R.add('skirt',G_.cyl(B.w*0.18,B.w*0.18,0.012,16),o.apronMon,{p:[0,-legL*0.32,B.w*1.17],r:[Math.PI/2+0.14,0,0],glow:true});
  R.add('back',G_.tor(0.07,0.03,6,12),0xD8342C,{p:[0,-0.3,-0.06],r:[0,0,0.6]}); R.add('back',G_.tor(0.07,0.03,6,12),0xD8342C,{p:[0,-0.3,-0.06],r:[0,0,-0.6]}); }

/* ================================================================ v76 chibi class kit
   Big-head chibi faces that still tell the classes apart:
   'elegant' gods: almond eyes under a heavy lash with a wing, eye shadow, forehead mark, tinted lips, no blush
   'fierce' warriors and oni: narrowed angular eyes cut by a scowling lid, thick slanted brows, small pupils, set jaw
   'mempo': fierce eyes above a lacquered war mask */
function faceChibi(R,hr,hy,sp,eyes,hairCol,skin){
  const mode=sp.face, ec=eyes.col||0x6A4A2A, glow=!!eyes.glow, ink=0x140C10, sk=shade(skin,0.8), browC=shade(eyes.browCol||hairCol,0.5);
  const el=mode==='elegant';
  const ew=hr*(el?0.21:0.22), eh=hr*(el?0.22:0.2), sx=hr*0.37, ey=hy-hr*(el?0.12:0.08);
  for(const sd of [1,-1]){
    const x=sd*sx, z=hr*0.98*Math.sqrt(Math.max(0,1-(x/hr)**2-((ey-hy)/(1.05*hr))**2)), ry=sd*Math.asin(Math.min(0.9,Math.abs(x)/hr))*0.85;
    const P=(dx,dy,dz)=>[x+dx*Math.cos(ry)+dz*Math.sin(ry), ey+dy, z-dx*Math.sin(ry)+dz*Math.cos(ry)];
    const at=(dx,dy,dz,o)=>Object.assign({p:P(dx,dy,dz),r:[0,ry,0],ol:false},o||{});
    const tube=(pts,r0,r1,col,o)=>R.add('head',G_.tube(pts.map(q=>P(q[0],q[1],q[2])),r0,r1,6,12),col,Object.assign({ol:false},o||{}));
    /* eye white, iris, pupil */
    R.add('head',G_.sph(ew*1.08,eh,ew*0.3,18,12),glow?shade(ec,0.5):0xFFFAF4,at(0,0,-ew*0.1,glow?{glow:true}:{}));
    if(glow){ R.add('head',G_.sph(ew*0.8,eh*0.88,ew*0.3,16,10),ec,at(-sd*ew*0.04,-eh*0.04,-ew*0.04,{glow:true,grad:0xFFFFFF}));
      R.add('head',G_.sph(ew*0.14,eh*0.62,ew*0.24,8,8),0xFFFFFF,at(-sd*ew*0.04,0,ew*0.04,{glow:true})); }
    else { R.add('head',G_.sph(ew*(el?0.78:0.66),eh*(el?0.9:0.82),ew*0.28,16,10),shade(ec,0.42),at(-sd*ew*0.05,-eh*0.06,-ew*0.04,{grad:shade(ec,1.55),gax:1.2}));
      R.add('head',G_.sph(ew*(el?0.34:0.2),eh*(el?0.46:0.5),ew*0.25,10,8),0x120808,at(-sd*ew*0.05,-eh*0.04,0));
      R.add('head',G_.sph(ew*0.26,eh*0.22,ew*0.2,10,6),0xFFFFFF,at(-ew*0.24,eh*0.3,ew*0.07,{glow:true}));
      if(el) R.add('head',G_.sph(ew*0.12,eh*0.1,ew*0.15,8,6),0xFFFFFF,at(ew*0.22,-eh*0.38,ew*0.06,{glow:true})); }
    if(el){
      /* half-lidded: a skin lid over the top of the eye, then a heavy lash with a long wing */
      R.add('head',G_.sph(ew*1.15,eh*0.55,ew*0.34,16,8),skin,at(0,eh*0.72,ew*0.02,{grad:shade(sp.liner||0xD86A7A,1.0),gax:2}));
      tube([[-sd*ew*1.1,eh*0.1,ew*0.02],[-sd*ew*0.3,eh*0.36,ew*0.12],[sd*ew*0.6,eh*0.34,ew*0.1],[sd*ew*1.15,eh*0.12,ew*0.02],[sd*ew*1.7,eh*0.45,-ew*0.08]],ew*0.14,ew*0.03,ink);
      for(let k=0;k<3;k++) tube([[sd*ew*(0.7+k*0.25),eh*(0.22+k*0.02),ew*0.04],[sd*ew*(0.95+k*0.3),eh*(0.5+k*0.08),0]],ew*0.05,ew*0.01,ink);
      tube([[sd*ew*0.2,-eh*0.98,0],[sd*ew*0.85,-eh*0.72,0],[sd*ew*1.15,-eh*0.35,0]],ew*0.04,ew*0.015,0x5A2A30);
      tube([[-sd*ew*0.8,eh*1.7,-ew*0.02],[sd*ew*0.1,eh*1.95,0],[sd*ew*1.1,eh*1.75,-ew*0.1]],ew*0.07,ew*0.02,shade(eyes.browCol||hairCol,0.6)); }
    else {
      /* scowl: a skin lid slants down toward the nose and cuts the top of the eye into an angry shape */
      R.add('head',G_.box(ew*2.4,eh*0.9,ew*0.4),skin,at(sd*ew*0.1,eh*0.82,ew*0.08,{r:[0,ry,sd*0.38]}));
      tube([[-sd*ew*1.15,eh*0.08,ew*0.06],[-sd*ew*0.2,eh*0.42,ew*0.12],[sd*ew*0.8,eh*0.8,ew*0.08],[sd*ew*1.25,eh*0.62,0]],ew*0.16,ew*0.06,ink);
      tube([[-sd*ew*1.0,-eh*0.55,0],[sd*ew*0.2,-eh*0.95,0],[sd*ew*1.15,-eh*0.6,0]],ew*0.055,ew*0.02,sk);
      tube([[-sd*ew*1.3,eh*0.95,ew*0.08],[-sd*ew*0.3,eh*1.45,ew*0.08],[sd*ew*0.9,eh*2.1,0],[sd*ew*1.55,eh*2.2,-ew*0.12]],ew*0.3,ew*0.1,browC);   /* thick brow, low at the nose */
      if(sp.scar&&sd===sp.scar) tube([[sd*ew*0.3,eh*2.2,ew*0.05],[sd*ew*0.6,eh*0.2,ew*0.18],[sd*ew*0.9,-eh*1.6,ew*0.02]],ew*0.05,ew*0.03,0xC85A5A); } }
  const zm=hr*0.86;
  if(!el) for(const sd of [1,-1]) R.add('head',G_.tube([[sd*hr*0.07,ey+hr*0.17,hr*0.96],[sd*hr*0.05,ey+hr*0.07,hr*0.975]],hr*0.014,hr*0.01,4,4),sk,{ol:false});   /* frown furrows */
  R.add('head',G_.sph(hr*0.04,hr*0.03,hr*0.025),shade(skin,0.85),{p:[0,hy-hr*0.3,hr*0.98],ol:false});
  if(mode==='mempo'){ faceMempo(R,hr,hy,sp); return; }
  if(el){ R.add('head',G_.tube([[-hr*0.08,hy-hr*0.52,zm],[0,hy-hr*0.55,zm+hr*0.015],[hr*0.08,hy-hr*0.52,zm]],hr*0.026,hr*0.018,5,8),eyes.lip||0xC04858,{ol:false});
    if(sp.mark) R.add('head',G_.star(hr*0.11,hr*0.045,4,0.012),sp.mark,{p:[0,hy+hr*0.4,hr*0.94],r:[-0.35,0,0],glow:true}); return; }
  if(eyes.grin){ R.add('head',G_.box(hr*0.5,hr*0.13,hr*0.06),0x3A1414,{p:[0,hy-hr*0.52,zm],ol:false});
    R.add('head',G_.box(hr*0.46,hr*0.05,hr*0.065),0xFFFFFF,{p:[0,hy-hr*0.47,zm+0.003],ol:false}); R.add('head',G_.box(hr*0.42,hr*0.04,hr*0.065),0xFFFFFF,{p:[0,hy-hr*0.575,zm+0.003],ol:false});
    for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.06,hr*0.22,5),0xFFFFFF,{p:[sd*hr*0.2,hy-hr*0.42,zm+hr*0.04],ol:false}); }
  else { R.add('head',G_.box(hr*0.24,hr*0.035,hr*0.04),0x5A2020,{p:[0,hy-hr*0.52,zm],ol:false});   /* set jaw: a flat grimace */
    for(const sd of [1,-1]) R.add('head',G_.box(hr*0.06,hr*0.03,hr*0.04),0x5A2020,{p:[sd*hr*0.14,hy-hr*0.54,zm-0.003],r:[0,0,sd*0.5],ol:false}); }
  if(sp.mark) R.add('head',G_.star(hr*0.1,hr*0.04,4,0.012),sp.mark,{p:[0,hy+hr*0.42,hr*0.93],r:[-0.35,0,0],glow:true}); }

/* kote: armoured sleeves with plates down the forearm and a gilded hand guard */
function armorKote(R,L,B,o){ const pc=o.plate||o.col2||0x2A2A30, tr=o.trim||0xF5C542;
  for(let k=0;k<3;k++) R.add('elbow'+L,G_.box(B.limb*2.2,B.limb*0.9,B.limb*0.45),pc,{p:[0,-B.limb*(0.9+k*1.15),B.limb*0.75],grad:shade(pc,0.7)});
  R.add('elbow'+L,G_.tor(B.limb*1.12,B.limb*0.16,5,14),tr,{p:[0,-B.limb*0.2,0],r:[Math.PI/2,0,0],ol:false});
  R.add('hand'+L,G_.box(B.limb*1.9,B.limb*0.9,B.limb*0.35),pc,{p:[0,-B.limb*0.55,B.limb*0.95],grad:tr}); }

/* ---------------------------------------------------------------- v76 weapons, crafted like their art */
const WPN={
  blade(R,hand,B,W,L,wd,curve){ const c=W.col||0xE6ECF2, c2=W.col2||0x2A1E1E, gl=!!W.glow, hy=-B.limb*0.7, rot=[Math.PI/2,0,0];
    /* tsuka: wrapped grip with diamond lacing, pommel, tsuba, habaki, then a curved blade with a bright hamon edge */
    R.add(hand,G_.cyl(0.032,0.034,0.3,8),c2,{p:[0,hy,-0.02],r:rot});
    for(let k=0;k<5;k++) R.add(hand,G_.box(0.05,0.022,0.02),W.wrap||0xF4F1EA,{p:[0,hy,-0.14+k*0.06],r:[Math.PI/2,0,k%2?0.6:-0.6],ol:false});
    R.add(hand,G_.cyl(0.038,0.038,0.03,8),0xF5C542,{p:[0,hy,-0.17],r:rot});
    R.add(hand,G_.cyl(0.085,0.085,0.022,14),W.tsuba||0x2A2A30,{p:[0,hy,0.14],r:rot}); R.add(hand,G_.tor(0.085,0.01,4,16),0xF5C542,{p:[0,hy,0.14],ol:false});
    R.add(hand,G_.box(0.045,0.03,0.05),0xF5C542,{p:[0,hy,0.17]});
    const pts=[]; const N=8; for(let i=0;i<=N;i++){ const t=i/N; pts.push([curve*t*t*L,t*L]); }
    const edge=[], back=[]; for(const [x,y] of pts){ const t=y/L, w=wd*(1-t*0.35); edge.push([x+w*0.5,y]); back.push([x-w*0.5,y]); }
    const shapePts=[...back,[pts[N][0]+wd*0.35,L*1.04],...edge.reverse()];
    R.add(hand,G_.shape(shapePts,0.016,0.003),c,{p:[0,hy,0.18],r:rot,glow:gl,grad:shade(c,0.75)});
    const ham=pts.map(([x,y])=>{ const t=y/L, w=wd*(1-t*0.35); return [x+w*0.25,y]; }); const hp=[...ham,...ham.slice().reverse().map(([x,y])=>[x+wd*0.22,y])];
    R.add(hand,G_.shape(hp,0.018,0.002),W.edge||0xFFFFFF,{p:[0,hy,0.18],r:rot,glow:true}); },
  pole(R,hand,B,W,L){ const c2=W.col2||0x2A1E1E, hy=-B.limb*0.7, tilt=0.25;
    R.add(hand,G_.cyl(0.03,0.032,L,8),c2,{p:[0,hy,0.2],r:[tilt,0,0],grad:shade(c2,1.5)});
    for(const f of [-0.42,-0.1,0.38]) R.add(hand,G_.cyl(0.036,0.036,0.05,8),0xF5C542,{p:[0,hy+L*f*Math.cos(tilt),0.2+L*f*Math.sin(tilt)],r:[tilt,0,0]});
    R.add(hand,G_.sph(0.05),0xF5C542,{p:[0,hy-L*0.5*Math.cos(tilt),0.2-L*0.5*Math.sin(tilt)]});
    return {y:hy+L*0.5*Math.cos(tilt), z:0.2+L*0.5*Math.sin(tilt), tilt}; },
  tassel(R,hand,y,z,col){ R.add(hand,G_.sph(0.04),0xF5C542,{p:[0,y,z]}); for(let k=0;k<4;k++){ const a=k/4*TAU; R.add(hand,G_.tube([[0,0,0],[Math.sin(a)*0.03,-0.1,Math.cos(a)*0.03],[Math.sin(a)*0.05,-0.24,Math.cos(a)*0.05]],0.025,0.012,4,6),col||0xD8241A,{p:[0,y-0.03,z]}); } },
};
function buildWeaponV76(R,sp,B,W){
  const hand=W.hand==='L'?'handL':'handR', c=W.col||0xE6ECF2, s=(W.s||1)*(STYLE==='chibi'?1.1:1), gl=!!W.glow, hy=-B.limb*0.7;
  switch(W.kind){
    case 'katana': WPN.blade(R,hand,B,W,0.95*s,0.06,0.07); return true;
    case 'greatsword': WPN.blade(R,hand,B,W,1.35*s,0.1,0.1); return true;
    case 'naginata': { const t=WPN.pole(R,hand,B,W,1.75*s); const bl=[[-0.03,0],[0.03,0],[0.07,0.2],[0.08,0.4],[0.02,0.6],[-0.04,0.48],[-0.02,0.2]];
      R.add(hand,G_.cyl(0.06,0.06,0.02,12),0x2A2A30,{p:[0,t.y,t.z],r:[t.tilt,0,0]});
      R.add(hand,G_.shape(bl.map(p=>[p[0]*s,p[1]*s]),0.018,0.003),c,{p:[0,t.y+0.01,t.z],r:[t.tilt,0,0],glow:gl,grad:shade(c,0.75)});
      WPN.tassel(R,hand,t.y-0.04,t.z-0.02,W.tassel); return true; }
    case 'spear': case 'trident': { const t=WPN.pole(R,hand,B,W,1.75*s);
      R.add(hand,G_.cyl(0.07,0.05,0.06,10),0xF5C542,{p:[0,t.y,t.z],r:[t.tilt,0,0]});
      if(W.kind==='spear'){ const bl=[[0,0],[0.06,0.1],[0.035,0.38],[0,0.48],[-0.035,0.38],[-0.06,0.1]];
        for(const ry of [0,Math.PI/2]) R.add(hand,G_.shape(bl.map(p=>[p[0]*s,p[1]*s]),0.014,0.003),c,{p:[0,t.y+0.03,t.z+0.01],r:[t.tilt,ry,0],glow:gl,grad:shade(c,0.7)});
        for(const sd of [1,-1]) R.add(hand,G_.crescent(0.1*s,0.025,0.012),0xF5C542,{p:[sd*0.03,t.y+0.06,t.z],r:[t.tilt,0,sd*0.6]}); }
      else for(const d of [-1,0,1]) R.add(hand,G_.tube([[0,0,0],[d*0.08,0.12,0],[d*0.09,0.32*(d?0.8:1),0]],0.02,0.006,5,8),c,{p:[0,t.y+0.02,t.z],r:[t.tilt,0,0],glow:gl});
      WPN.tassel(R,hand,t.y-0.06,t.z-0.02,W.tassel); return true; }
    case 'club': { /* kanabo: octagonal iron-shod club with rows of studs and bands */
      const L=1.0*s, r0=0.05*s, r1=0.15*s, z0=-0.08, col=W.col||0x2A2A30;
      R.add(hand,G_.cyl(r1,r0,L,8),col,{p:[0,hy,z0+L*0.5],r:[Math.PI/2,0,0],grad:shade(col,1.4)});
      R.add(hand,G_.cyl(r1*1.02,r1,0.08,8),shade(col,0.8),{p:[0,hy,z0+L+0.03],r:[Math.PI/2,0,0]});
      for(const f of [0.3,0.62,0.95]) R.add(hand,G_.cyl(lerp(r0,r1,f)*1.08,lerp(r0,r1,f)*1.08,0.035,8),0xC8A46E,{p:[0,hy,z0+L*f],r:[Math.PI/2,0,0],ol:false});
      for(let row=0;row<4;row++) for(let k=0;k<8;k++){ const a=k/8*TAU+row*0.4, f=0.4+row*0.15, rr=lerp(r0,r1,f); R.add(hand,G_.cone(0.028*s,0.07*s,5),0xD9DEE6,{p:[Math.sin(a)*rr,hy+Math.cos(a)*rr,z0+L*f],r:[0,0,-a],ol:false}); }
      R.add(hand,G_.tor(0.05,0.015,5,12),0xC8A46E,{p:[0,hy,z0-0.06],r:[0,Math.PI/2,0]}); return true; }
    case 'staff': { const t=WPN.pole(R,hand,B,W,1.7*s);   /* jewelled staff: claws hold a glowing orb */
      R.add(hand,G_.sph(0.1*s),W.orb||0xC58CFF,{p:[0,t.y+0.12,t.z+0.03],glow:true,grad:0xFFFFFF});
      for(let k=0;k<4;k++){ const a=k/4*TAU; R.add(hand,G_.tube([[0,0,0],[Math.sin(a)*0.1,0.08,Math.cos(a)*0.1],[Math.sin(a)*0.06,0.22,Math.cos(a)*0.06]],0.018,0.008,5,8),c,{p:[0,t.y,t.z],r:[t.tilt,0,0]}); }
      R.add(hand,G_.tor(0.14*s,0.012,5,20),c,{p:[0,t.y+0.12,t.z+0.03],r:[t.tilt,0,0]}); return true; }
    case 'bow': { /* yumi: tall asymmetric bow, grip wrapped low, string, arrow nocked */
      const p=[0.06,hy,0.04], col=W.col2||0x3A2418;
      R.add('handL',G_.tube([[-0.02,-0.55,0],[0.1,-0.3,0],[0.15,0,0],[0.13,0.45,0],[0.04,0.85,0],[-0.03,0.98,0]],0.026,0.018,6,24),col,{p,grad:shade(col,1.6)});
      R.add('handL',G_.cyl(0.032,0.032,0.14,8),W.grip||0xD8241A,{p:[p[0]+0.15,p[1]+0.02,p[2]]});
      for(const y of [-0.5,0.92]) R.add('handL',G_.cyl(0.03,0.03,0.04,8),0xF5C542,{p:[p[0]+(y<0?-0.01:0),p[1]+y,p[2]]});
      R.add('handL',G_.cyl(0.004,0.004,1.52,3),0xF4F1EA,{p:[p[0]-0.03,p[1]+0.21,p[2]],ol:false}); return true; }
  }
  return false; }

function buildHuman(sp){
  if(STYLE==='anime'){ const fem=FEMALE.has(sp.key); sp=Object.assign({},sp);
    if(!sp.face&&!YOUTH.has(sp.key)) sp.face=fem?'elegant':(sp.eyes&&sp.eyes.fierce)?'fierce':null;
    if(sp.key==='nurari') sp.prop={head:0.19}; }
  if(STYLE==='chibi'){ sp=Object.assign({},sp); if(!sp.face&&sp.eyes&&sp.eyes.fierce&&!YOUTH.has(sp.key)) sp.face='fierce'; }
  const B=STYLE==='anime'?Object.assign({},BUILDS[animeBuild(sp)],sp.propAnime||{}):Object.assign({},BUILDS[CHIBI_OF[sp.build]||sp.build||'normal'],sp.prop||{}), R=new Rig();
  sp._hk=STYLE==='anime'?clamp(0.3/B.head,1,2.2):1;   /* hair keeps its length when the head is smaller */
  const legL=B.leg, thigh=legL*0.5, shin=legL*0.5-0.05, hipW=B.w*0.42, spineH=B.torso*0.36, chestH=B.torso*0.42, neckH=B.torso*0.12;
  const armSeg=B.arm*0.5, shW=B.w*0.95+B.limb*0.6;
  R.bone('hips','root',[0,legL+0.02,0]);
  R.bone('spine','hips',[0,spineH*0.6,0]); R.bone('chest','spine',[0,spineH,0]); R.bone('neck','chest',[0,chestH,0]); R.bone('head','neck',[0,neckH,0]);
  for(const sd of [1,-1]){ const L=sd>0?'L':'R';
    R.bone('arm'+L,'chest',[sd*shW,chestH*0.82,0]); R.bone('elbow'+L,'arm'+L,[0,-armSeg,0]); R.bone('hand'+L,'elbow'+L,[0,-armSeg*0.92,0]);
    R.bone('thigh'+L,'hips',[sd*hipW,-0.02,0]); R.bone('knee'+L,'thigh'+L,[0,-thigh,0]); R.bone('foot'+L,'knee'+L,[0,-shin,0]); }
  R.bone('skirt','hips',[0,0,0]); R.bone('back','chest',[0,chestH*0.5,-B.w*0.55]); R.bone('tail','hips',[0,0,-B.w*0.6]);
  R.bone('hair','head',[0,B.head*0.9,-B.head*0.4]);
  const skin=sp.skin||0xF6D2B0, o=sp.outfit||{}, kind=o.kind||'none', oc=o.col||0x2F5DB8, oc2=o.col2||shade(oc,0.75), trim=o.trim||0xF5C542;
  const inner=o.inner||oc2, bulk=sp.build==='broad'||sp.build==='giant'||sp.build==='round';
  const robeLike=kind==='robe'||kind==='kimono'||kind==='monk'||kind==='furisode', armor=kind==='armor', bare=kind==='bare', hakama=kind==='hakama', ninja=kind==='ninja';
  const topCol=hakama?(o.top||0xF4F1EA):bare?skin:armor?(o.plate||oc2):oc;
  const G=(c,f)=>({grad:shade(c,f||0.84)});
  /* --- torso */
  R.add('hips',G_.sph(B.w*0.95,B.torso*0.22,B.w*0.7),bare?(o.col2||0x6B4A2A):hakama?oc:oc2,{p:[0,0.02,0]});
  const AN=STYLE==='anime', FEM=FEMALE.has(sp.key);
  R.add('spine',G_.sph(B.w*(AN?(FEM?0.68:0.76):0.9),spineH*0.75,B.w*(AN?0.6:0.66)),topCol,Object.assign({p:[0,spineH*0.45,0]},G(topCol,0.9)));
  R.add('chest',G_.sph(B.w*(bulk?1.12:AN&&!FEM?1.08:1.0),chestH*0.72,B.w*0.72),topCol,Object.assign({p:[0,chestH*0.42,0.01]},G(topCol,0.9)));
  if(AN&&!bare) for(const sd of [1,-1]) R.add('chest',G_.sph(B.w*0.42,chestH*0.36,B.w*0.4),topCol,{p:[sd*B.w*0.62,chestH*0.78,0],grad:shade(topCol,0.88)});   /* shoulders */
  if(bare){ const ms=shade(skin,0.9);   /* muscle definition: pecs, abs, collarbones */
    for(const sd of [1,-1]) R.add('chest',G_.sph(B.w*0.46,chestH*0.33,B.w*0.28),skin,{p:[sd*B.w*0.42,chestH*0.5,B.w*0.5],grad:ms});
    for(let i=0;i<3;i++) for(const sd of [1,-1]) R.add('spine',G_.sph(B.w*0.2,spineH*0.16,0.06),skin,{p:[sd*B.w*0.21,spineH*(0.85-i*0.3),B.w*0.6],grad:ms});
    R.add('spine',G_.box(0.012,spineH*0.9,0.01),shade(skin,0.75),{p:[0,spineH*0.5,B.w*0.66],ol:false});
    for(const sd of [1,-1]) R.add('chest',G_.cap(B.limb*0.3,B.w*0.45),shade(skin,0.95),{p:[sd*B.w*0.35,chestH*0.85,B.w*0.45],r:[0,0,sd*1.35]}); }
  R.add('neck',G_.cyl(B.limb*1.1,B.limb*1.3,neckH*1.6,10),skin,{p:[0,neckH*0.4,0]});
  /* --- arms */
  for(const sd of [1,-1]){ const L=sd>0?'L':'R';
    const sleeve=armor?(o.sleeve||shade(o.lace||oc,0.7)):ninja?oc:hakama?topCol:bare?skin:oc;
    R.add('arm'+L,G_.sph(B.limb*1.35,B.limb*1.3,B.limb*1.3),bare?skin:sleeve,{p:[0,-B.limb*0.35,0]});
    R.add('arm'+L,G_.cap(B.limb*(bulk?1.25:1.05),armSeg*0.75),sleeve,{p:[0,-armSeg*0.5,0]});
    R.add('elbow'+L,G_.cap(B.limb*(bulk?1.12:0.95),armSeg*0.7),armor?(o.gaunt||shade(o.plate||oc2,0.9)):sleeve,{p:[0,-armSeg*0.46,0]});
    R.add('hand'+L,G_.sph(B.limb*1.3,B.limb*1.2,B.limb*1.15),o.glove||skin,{p:[0,-B.limb*0.62,0.01]});
    for(const k of [-1,0,1]) R.add('hand'+L,G_.cap(B.limb*0.28,B.limb*0.5),o.glove||skin,{p:[k*B.limb*0.42,-B.limb*1.35,B.limb*0.25],r:[0.25,0,0]});   /* fingers */
    if(bare){ R.add('arm'+L,G_.sph(B.limb*1.35,armSeg*0.38,B.limb*1.25),skin,{p:[0,-armSeg*0.45,B.limb*0.15],grad:shade(skin,0.88)});
      R.add('elbow'+L,G_.sph(B.limb*1.2,armSeg*0.32,B.limb*1.1),skin,{p:[0,-armSeg*0.3,0],grad:shade(skin,0.9)});
      if(o.bands!==false) R.add('elbow'+L,G_.tor(B.limb*1.15,B.limb*0.22,6,14),o.bandCol||trim,{p:[0,-armSeg*0.72,0],r:[Math.PI/2,0,0]}); }
    if(ninja) for(let k=0;k<3;k++) R.add('elbow'+L,G_.tor(B.limb*1.0,B.limb*0.12,4,12),shade(oc,0.7),{p:[0,-armSeg*(0.25+k*0.2),0],r:[Math.PI/2,0.15*k,0],ol:false});
    if((robeLike&&kind!=='furisode')||hakama){ /* wide hanging sleeves with a coloured lining and a trimmed hem */
      const sk=bulk?0.82:1, sw=(B.limb*2.3+0.07)*sk, sl=armSeg*(hakama?0.95:1.15), sc=hakama?topCol:oc;
      R.add('arm'+L,G_.cyl(B.limb*1.5*sk+0.02,sw*0.85,armSeg*1.0,14,false),sc,{p:[0,-armSeg*0.5,0],grad:shade(sc,0.9)});
      R.add('elbow'+L,G_.lathe([[sw*0.85,armSeg*0.1],[sw,-sl*0.35],[sw*1.02,-sl*0.75],[sw*0.75,-sl],[0.001,-sl*1.02]],16),sc,{p:[sd*0.02,0,-0.01],s:[1,1,0.62],grad:shade(sc,0.82)});
      R.add('elbow'+L,G_.lathe([[sw*0.72,-sl*0.82],[sw*0.82,-sl*0.9],[0.001,-sl*1.035]],12),hakama?(o.lining||oc):inner,{p:[sd*0.02,0,-0.01],s:[1,1,0.64]});
      const hm=[]; for(let k=0;k<=14;k++){ const a=k/14*TAU; hm.push([Math.sin(a)*sw*0.98,-sl*0.82,Math.cos(a)*sw*0.98*0.62]); }
      R.add('elbow'+L,G_.tube(hm,0.016,0.016,5,28),trim,{p:[sd*0.02,0,-0.01],ol:false});
      if(o.pattern) R.add('elbow'+L,o.motif==='star'?G_.star(0.06,0.024,8,0.01):G_.cyl(0.05,0.05,0.01,14),o.pattern,{p:[sd*0.02,-sl*0.45,sw*0.62+0.005],r:o.motif==='star'?[0,0,0]:[Math.PI/2,0,0],ol:false}); }
    if(armor||sp.pauldron) armorSode(R,'arm'+L,sd,B,o,trim);
    if(armor) armorKote(R,L,B,o);
    /* legs */
    const lc=o.legs||(bare?skin:hakama?oc:ninja?oc:oc2);
    R.add('thigh'+L,G_.cap(B.limb*(bulk?1.45:1.25),thigh*0.7),lc,{p:[0,-thigh*0.5,0]});
    R.add('knee'+L,G_.cap(B.limb*(bulk?1.25:1.05),shin*0.72),o.shin||lc,{p:[0,-shin*0.5,0]});
    if(hakama){ /* real hakama: wide pleated trouser legs */
      const top=B.w*0.55, bot=B.w*(bulk?0.95:0.82)+0.04;
      R.add('thigh'+L,G_.lathe([[top,0.06],[top*1.08,-thigh*0.5],[bot*0.92,-legL*0.75],[bot,-legL+0.02],[bot*0.96,-legL+0.01]],16),oc,{p:[sd*0.02,0,0],grad:shade(oc,0.78)});
      for(let k=0;k<4;k++){ const a=(k-1.5)*0.45; R.add('thigh'+L,G_.box(0.014,legL*0.82,0.014),shade(oc,0.62),{p:[sd*0.02+Math.sin(a)*bot*0.82,-legL*0.5,Math.cos(a)*bot*0.82],r:[-0.08,a,0],ol:false}); } }
    if(armor){ R.add('thigh'+L,G_.box(B.limb*2.5,thigh*0.72,B.limb*0.9),o.plate||oc2,{p:[0,-thigh*0.42,B.limb*0.95],r:[0.12,0,0],grad:shade(o.plate||oc2,0.75)});   /* haidate */
      for(let k=0;k<3;k++) R.add('thigh'+L,G_.box(B.limb*2.55,0.012,0.02),o.lace||oc,{p:[0,-thigh*(0.2+k*0.22),B.limb*1.42],r:[0.12,0,0],ol:false});
      R.add('knee'+L,G_.box(B.limb*2.1,shin*0.75,B.limb*0.7),o.shinCol||shade(o.plate||oc2,0.9),{p:[0,-shin*0.45,B.limb*0.75],grad:shade(o.plate||oc2,0.7)});   /* suneate */
      R.add('knee'+L,G_.box(B.limb*2.15,0.03,B.limb*0.75),trim,{p:[0,-shin*0.08,B.limb*0.78],ol:false}); }
    if(ninja) for(let k=0;k<3;k++) R.add('knee'+L,G_.tor(B.limb*1.08,B.limb*0.12,4,12),shade(oc,0.7),{p:[0,-shin*(0.25+k*0.22),0],r:[Math.PI/2,0,0],ol:false});
    const bareFoot=bare&&!o.shoe;
    R.add('foot'+L,G_.sph(B.limb*1.3,B.limb*0.9,B.limb*2.1),bareFoot?skin:(o.shoe||(robeLike||hakama?0xF4F1EA:0x3A2A22)),{p:[0,0.02,B.limb*0.9]});
    if(bareFoot) for(let k=0;k<3;k++) R.add('foot'+L,G_.cone(B.limb*0.28,B.limb*0.6,5),0xF2EAD8,{p:[(k-1)*B.limb*0.6,0.0,B.limb*2.8],r:[Math.PI/2,0,0]});
    if(robeLike||hakama){ R.add('foot'+L,G_.box(B.limb*1.75,0.04,B.limb*3.3),o.sandal||0xC8A060,{p:[0,-0.04,B.limb*0.9]});   /* zori sandals */
      R.add('foot'+L,G_.tube([[-B.limb*0.7,0,B.limb*0.3],[0,B.limb*0.5,B.limb*1.6],[B.limb*0.7,0,B.limb*0.3]],0.012,0.012,4,8),o.strap||0xC8241A,{p:[0,0,0],ol:false}); }
    if(bare&&o.anklets!==false) R.add('knee'+L,G_.tor(B.limb*1.15,B.limb*0.2,6,14),o.bandCol||trim,{p:[0,-shin*0.85,0],r:[Math.PI/2,0,0]}); }
  /* --- outfits */
  if(kind==='furisode') outfitFurisode(R,o,B,legL,spineH,chestH,armSeg,skin);
  else if(robeLike) outfitLayered(R,o,B,legL,spineH,chestH,kind);
  else if(armor) outfitArmor(R,o,B,legL,spineH,chestH);
  else if(hakama){ for(const sd of [1,-1]){ R.add('chest',G_.box(0.075,chestH*1.05,0.03),o.collar||inner,{p:[sd*B.w*0.18,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.48]});
      R.add('chest',G_.box(0.025,chestH*1.05,0.035),trim,{p:[sd*B.w*0.25,chestH*0.42,B.w*0.71],r:[0.12,0,sd*0.48],ol:false}); }
    R.add('spine',G_.cyl(B.w*0.97,B.w*0.99,spineH*0.5,18),o.belt||0xD8342C,{p:[0,spineH*0.12,0],s:[1,1,0.76]});
    R.add('hips',G_.lathe([[B.w*0.98,0.1],[B.w*1.05,-0.05],[B.w*1.1,-0.16]],18),oc,{p:[0,0,0],s:[1,1,0.8]});
    if(o.mon) R.add('chest',G_.cyl(0.05,0.05,0.012,14),o.mon,{p:[B.w*0.42,chestH*0.7,B.w*0.6],r:[Math.PI/2-0.3,0.5,0],ol:false}); }
  else if(ninja){ R.add('spine',G_.cyl(B.w*0.93,B.w*0.96,spineH*0.38,16),o.belt||0x6E4FA0,{p:[0,spineH*0.15,0],s:[1,1,0.75]});
    for(const sd of [1,-1]) R.add('chest',G_.box(0.05,chestH*1.0,0.025),shade(oc,0.75),{p:[sd*B.w*0.16,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.5],ol:false});
    R.add('spine',G_.box(0.1,0.06,0.04),0x8E8A84,{p:[B.w*0.5,spineH*0.15,B.w*0.62],r:[0,0.6,0]}); }
  else if(bare) outfitLoincloth(R,o,B,spineH);
  if(sp.scarf){ R.add('neck',G_.tor(B.limb*1.9,B.limb*0.9,8,16),sp.scarf,{p:[0,-neckH*0.1,0],r:[Math.PI/2,0,0]});
    for(const k of [0,1]) R.add('back',G_.tube([[0,0,0],[0.15+k*0.08,-0.05,-0.3],[0.35+k*0.12,-0.25,-0.6],[0.55+k*0.1,-0.2,-0.85]],0.06,0.03,6,12),sp.scarf,{p:[0.06,0.08,0.06],grad:shade(sp.scarf,0.75)}); }
  if(sp.beads) for(let i=0;i<16;i++){ const a=i/16*TAU; R.add('chest',G_.sph(0.05),sp.beads,{p:[Math.sin(a)*B.w*0.85,chestH*0.85-Math.cos(a)*0.06-(Math.cos(a)>0?0.18:0),Math.cos(a)*B.w*0.75]}); }
  buildHead(R,sp,B); buildWeapon(R,sp,B); buildBack(R,sp,B);
  if(sp.extra) sp.extra(R,B,G_);
  return {rig:R,kind:'human',B};
}

/* o-yoroi shoulder guards: stacked lamellar plates with lacing and a gilded top edge */
function armorSode(R,bone,sd,B,o,trim){   /* o-sode: a tall lamellar panel hanging on the outside of the upper arm, flaring out at the bottom */
  const pc=o.plate||o.col2||0x2A2A30, lc=o.lace||o.col||0x2F5DB8, n=o.sode||(o.ornate?5:4), rowH=B.limb*(o.ornate?1.15:1.0), depth=B.limb*(o.ornate?5.2:4.2), flare=o.ornate?0.42:0.32;
  for(let i=0;i<n;i++){ const y=B.limb*1.3-i*rowH*0.92, out=sd*(B.limb*1.35+i*rowH*0.92*Math.sin(flare)), rz=sd*flare;
    R.add(bone,G_.box(0.045,rowH,depth*(1+i*0.03)),i===0?trim:pc,{p:[out,y,0],r:[0,0,rz],grad:i===0?shade(trim,0.75):shade(pc,0.7)});
    if(i>0){ R.add(bone,G_.box(0.05,0.014,depth*(1+i*0.03)+0.004),lc,{p:[out,y+rowH*0.42,0],r:[0,0,rz],ol:false});
      for(let k=-2;k<=2;k++) R.add(bone,G_.box(0.05,rowH*0.8,0.012),lc,{p:[out+sd*0.003,y,k*depth*0.2],r:[0,0,rz],ol:false}); } }
  const yb=B.limb*1.3-(n-1)*rowH*0.92-rowH*0.55, ob=sd*(B.limb*1.35+(n-1)*rowH*0.92*Math.sin(flare)+rowH*0.5*Math.sin(flare));
  R.add(bone,G_.box(0.055,rowH*0.2,depth*(1+n*0.03)),trim,{p:[ob,yb,0],r:[0,0,sd*flare],ol:false});
  if(o.ornate) R.add(bone,G_.cyl(B.limb*0.5,B.limb*0.5,0.02,14),o.emblem||trim,{p:[sd*(B.limb*1.35+rowH*1.5*Math.sin(flare)+0.03),B.limb*1.3-rowH*1.6,0],r:[0,0,sd*(Math.PI/2+flare)]}); }

/* lamellar cuirass, kusazuri skirt panels, emblem; o.robe adds a robe under the armour */
function outfitArmor(R,o,B,legL,spineH,chestH){
  const pc=o.plate||o.col2||0x2A2A30, lc=o.lace||o.col||0x2F5DB8, trim=o.trim||0xF5C542;
  if(o.robe) R.add('skirt',G_.lathe([[B.w*0.95,0.05],[B.w*1.1,-legL*0.4],[B.w*1.4,-legL*0.95],[B.w*1.36,-legL*0.96]],16),o.robe,{grad:shade(o.robe,0.75)});
  for(let i=0;i<4;i++){ const y=chestH*(0.12+i*0.2), r=B.w*(1.03-Math.abs(i-1.5)*0.03);
    R.add('chest',G_.cyl(r,r*1.02,chestH*0.17,22,true),i%2?lc:pc,{p:[0,y,0.01],s:[1,1,0.78],grad:shade(i%2?lc:pc,0.8)});
    for(let k=-3;k<=3;k++) R.add('chest',G_.sph(0.014),trim,{p:[k*B.w*0.22,y,B.w*0.8-Math.abs(k)*0.02],ol:false}); }
  R.add('chest',G_.tor(B.w*1.0,0.022,5,24),trim,{p:[0,chestH*0.95,0.0],r:[Math.PI/2,0,0],s:[1,0.78,1]});
  R.add('chest',G_.box(B.w*1.15,chestH*0.42,0.03),pc,{p:[0,chestH*0.62,B.w*0.76],r:[-0.1,0,0],grad:shade(pc,0.8)});
  if(o.emblem){ R.add('chest',G_.cyl(0.075,0.075,0.02,16),o.emblem,{p:[0,chestH*0.62,B.w*0.8],r:[Math.PI/2-0.1,0,0]}); R.add('chest',G_.tor(0.08,0.012,4,16),trim,{p:[0,chestH*0.62,B.w*0.81],r:[-0.1,0,0],ol:false}); }
  for(let i=0;i<2;i++) R.add('spine',G_.cyl(B.w*0.97,B.w*0.99,spineH*0.3,20,true),i?pc:lc,{p:[0,spineH*(0.2+i*0.35),0],s:[1,1,0.76]});
  R.add('spine',G_.cyl(B.w*0.98,B.w*1.0,spineH*0.22,20),o.belt||trim,{p:[0,spineH*0.02,0],s:[1,1,0.77]});
  if(o.ornate) armorOrnate(R,o,B,legL,spineH,chestH);
  const np=o.panels||6;   /* kusazuri */
  for(let i=0;i<np;i++){ const a=(i/np)*TAU+TAU/np/2; if(Math.cos(a)<-0.9&&np>5) continue;
    for(let k=0;k<(o.ornate?4:3);k++){ const y=-legL*(0.06+k*0.14), rr=B.w*(0.95+k*0.1);
      R.add('skirt',G_.box(B.w*0.78,legL*0.15,0.04),k%2?lc:pc,{p:[Math.sin(a)*rr,y,Math.cos(a)*rr*0.85],r:[0.2*Math.cos(a)*(1+k*0.3),a,-0.2*Math.sin(a)*(1+k*0.3)],grad:shade(k%2?lc:pc,0.78)}); }
    R.add('skirt',G_.box(B.w*0.8,0.025,0.05),trim,{p:[Math.sin(a)*B.w*1.17,-legL*0.42,Math.cos(a)*B.w*1.0],r:[0.28*Math.cos(a),a,-0.28*Math.sin(a)],ol:false}); } }

/* robes and kimono: an outer layer (open-fronted for robes, wrapped for kimono) over a contrasting inner layer,
   layered collars, a hem trim, motifs, an obi with a front knot; monks add a kesa sash */
function outfitLayered(R,o,B,legL,spineH,chestH,kind){
  /* v83: anime-proportion kimono flare into an A-line (1.4 instead of 1.22) so a slim figure is not a straight tube from above */
  const anime=B.head<0.25, oc=o.col||0x2F5DB8, inner=o.inner||o.col2||shade(oc,0.75), trim=o.trim||0xF5C542, len=legL*(o.short?0.68:0.98), fl=kind==='kimono'?(anime?1.4:1.22):1.5;
  const prof=[[B.w*1.0,0.06],[B.w*1.08,-len*0.25],[B.w*(0.95+fl*0.25),-len*0.7],[B.w*fl,-len],[B.w*fl*0.97,-len*1.01]];
  const rAt=y=>{ for(let i=0;i<prof.length-1;i++){ const a=prof[i],b=prof[i+1]; if(y<=a[1]&&y>=b[1]) return lerp(a[0],b[0],(a[1]-y)/(a[1]-b[1])); } return prof[prof.length-1][0]; };
  R.add('skirt',G_.lathe([[B.w*0.95,0.05],[B.w*1.0,-len*0.3],[B.w*(0.9+fl*0.22),-len*0.75],[B.w*fl*0.92,-len*1.03],[B.w*fl*0.88,-len*1.04]],20),inner,{grad:shade(inner,0.8)});
  const gap=kind==='kimono'?0:0.36;
  if(gap) R.add('skirt',G_.lathe(prof,24,gap,TAU-gap*2),oc,{grad:shade(oc,0.8),gax:1.3});
  else R.add('skirt',G_.lathe(prof,24),oc,{grad:shade(oc,0.8),gax:1.3});
  const edge=phi=>prof.slice(0,4).map(q=>[Math.sin(phi)*(q[0]+0.008),q[1],Math.cos(phi)*(q[0]+0.008)]);
  if(gap) for(const phi of [gap,TAU-gap]) R.add('skirt',G_.tube(edge(phi),0.026,0.026,5,14),trim,{});
  else R.add('skirt',G_.tube([[-B.w*0.25,0.02,B.w*0.98],[-B.w*0.05,-len*0.5,rAt(-len*0.5)+0.01],[B.w*0.35,-len*0.98,rAt(-len*0.98)*0.95]],0.022,0.022,5,14),trim,{});
  const hem=[]; for(let k=0;k<=28;k++){ const phi=gap+(TAU-gap*2)*k/28; hem.push([Math.sin(phi)*prof[3][0]*1.01,-len+0.012,Math.cos(phi)*prof[3][0]*1.01]); }
  R.add('skirt',G_.tube(hem,0.026,0.026,5,56),trim,{ol:false});
  if(o.pattern){ const n=o.motifN||10; for(let k=0;k<n;k++){ const phi=gap+0.3+(TAU-gap*2-0.6)*k/(n-1), y=-len*(0.4+0.4*((k*7)%3)/2), rr=rAt(y)+0.01;
      const g=o.motif==='star'?G_.star(0.065,0.026,8,0.012):o.motif==='wave'?G_.crescent(0.07,0.02,0.012):G_.cyl(0.05,0.05,0.012,14);
      R.add('skirt',g,o.pattern,{p:[Math.sin(phi)*rr,y,Math.cos(phi)*rr],r:o.motif==='star'||o.motif==='wave'?[0,phi,0]:[Math.PI/2,0,-phi],ol:false});
      if(!o.motif) R.add('skirt',G_.tor(0.05,0.008,4,14),shade(o.pattern,0.7),{p:[Math.sin(phi)*(rr+0.004),y,Math.cos(phi)*(rr+0.004)],r:[0,phi,0],ol:false}); } }
  for(const sd of [1,-1]){ R.add('chest',G_.box(0.085,chestH*1.1,0.03),inner,{p:[sd*B.w*0.19,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.48]});
    R.add('chest',G_.box(0.03,chestH*1.1,0.035),trim,{p:[sd*B.w*0.26,chestH*0.42,B.w*0.71],r:[0.12,0,sd*0.48],ol:false});
    R.add('chest',G_.box(0.03,chestH*1.05,0.033),0xF4F1EA,{p:[sd*B.w*0.13,chestH*0.42,B.w*0.715],r:[0.12,0,sd*0.48],ol:false}); }
  R.add('spine',G_.cyl(B.w*0.98,B.w*1.0,spineH*0.55,20),o.belt||trim,{p:[0,spineH*0.17,0],s:[1,1,0.77],grad:shade(o.belt||trim,0.8)});
  R.add('spine',G_.tor(B.w*1.0,0.012,4,24),o.cord||trim,{p:[0,spineH*0.17,0],r:[Math.PI/2,0,0],s:[1,0.77,1],ol:false});
  R.add('spine',G_.sph(0.07,0.05,0.04),o.cord||trim,{p:[0,spineH*0.17,B.w*0.79]});
  if(kind==='kimono'){ /* v83: a big obi bow on the back - the kimono's signature shape from the top-down camera */
    const oy=spineH*0.17, ob=o.belt||trim, bz=-B.w*0.8;
    for(const sd of [1,-1]) R.add('spine',G_.sph(B.w*0.42,B.w*0.3,B.w*0.12),ob,{p:[sd*B.w*0.4,oy+B.w*0.06,bz-0.02],r:[0,0,sd*0.35],grad:shade(ob,0.75)});
    R.add('spine',G_.sph(B.w*0.16,B.w*0.18,B.w*0.12),shade(ob,0.85),{p:[0,oy+B.w*0.04,bz-0.04]});
    for(const sd of [1,-1]) R.add('skirt',G_.box(B.w*0.3,len*0.32,0.025),ob,{p:[sd*B.w*0.12,-len*0.12,bz*1.05-0.02],r:[0.12,0,sd*0.12],grad:shade(ob,0.7)}); }
  if(kind==='monk'){ R.add('chest',G_.box(B.w*0.5,chestH*1.4,0.035),o.kesa||trim,{p:[B.w*0.15,chestH*0.35,B.w*0.62],r:[0.1,0,-0.7],grad:shade(o.kesa||trim,0.8)});
    R.add('chest',G_.box(B.w*0.5,chestH*1.2,0.035),o.kesa||trim,{p:[B.w*0.05,chestH*0.3,-B.w*0.62],r:[-0.1,0,0.7]}); } }

/* oni loincloth: tiger-skin wrap with stripes and a twisted shimenawa rope belt */
function outfitLoincloth(R,o,B,spineH){
  const c=o.col2||0xD9A441;
  R.add('hips',G_.cyl(B.w*0.98,B.w*1.18,B.torso*0.34,16),c,{p:[0,-0.03,0],s:[1,1,0.8],grad:shade(c,0.8)});
  for(const z of [1,-1]) R.add('hips',G_.box(B.w*0.75,B.torso*0.5,0.04),c,{p:[0,-B.torso*0.3,z*B.w*0.86],r:[z*0.08,0,0],grad:shade(c,0.7)});
  if(o.stripes) for(let i=0;i<14;i++){ const a=i/14*TAU; R.add('hips',G_.tube([[0,0,0],[0.02,-B.torso*0.1,0],[-0.01,-B.torso*0.2,0]],0.022,0.006,4,6),0x1A1418,{p:[Math.sin(a)*B.w*1.1,B.torso*0.08-(i%2)*0.04,Math.cos(a)*B.w*0.9],r:[0,a,0.3],ol:false}); }
  R.add('hips',G_.tor(B.w*1.02,0.04,6,26),o.rope||0xF2EAD8,{p:[0,B.torso*0.15,0],r:[Math.PI/2,0,0],s:[1,0.8,1]});
  for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('hips',G_.sph(0.03,0.03,0.045),shade(o.rope||0xF2EAD8,0.82),{p:[Math.sin(a)*B.w*1.02,B.torso*0.15+0.01,Math.cos(a)*B.w*0.82],r:[0,a,0.6],ol:false}); }
  R.add('hips',G_.sph(0.07,0.07,0.05),o.rope||0xF2EAD8,{p:[0,B.torso*0.13,B.w*0.85]}); }

function buildHead(R,sp,B){
  const hd=sp.head||'human', hr=B.head, skin=sp.headCol||sp.skin||0xF6D2B0, hy=hr*0.95;
  const eyes=sp.eyes||{}, ec=eyes.col||0x2A2433, eg=!!eyes.glow;
  const face=(fz,eyeY,spread,ew,eh)=>{ /* anime eyes: iris + highlight, brows, mouth */
    const n=eyes.n||2;
    if(eyes.style==='closed'){ for(const sd of [1,-1]) R.add('head',G_.box(ew*1.6,0.012,0.012),INK,{p:[sd*spread,eyeY,fz],r:[0,0,sd*-0.15],ol:false}); }
    else if(n===2) for(const sd of [1,-1]){
      if(eg){ R.add('head',G_.sph(ew*1.05,eh*0.8,ew*0.4),ec,{p:[sd*spread,eyeY,fz],glow:true,ol:false}); R.add('head',G_.sph(ew*0.5,eh*0.4,ew*0.3),0xFFFFFF,{p:[sd*spread,eyeY,fz+ew*0.12],glow:true}); }
      else { R.add('head',G_.sph(ew*1.15,eh*1.02,ew*0.38),0xFFFFFF,{p:[sd*spread,eyeY,fz-ew*0.05],ol:false});
        R.add('head',G_.sph(ew*0.78,eh*0.86,ew*0.36),ec,{p:[sd*(spread-ew*0.06),eyeY-eh*0.05,fz+ew*0.05],ol:false});
        R.add('head',G_.sph(ew*0.4,eh*0.48,ew*0.3),0x150F1A,{p:[sd*(spread-ew*0.06),eyeY-eh*0.05,fz+ew*0.13],ol:false});
        R.add('head',G_.sph(ew*0.26,eh*0.24,ew*0.2),0xFFFFFF,{p:[sd*(spread-ew*0.06)-ew*0.22,eyeY+eh*0.28,fz+ew*0.22],glow:true});
        R.add('head',G_.box(ew*2.5,eh*0.24,ew*0.3),0x1A1422,{p:[sd*spread,eyeY+eh*0.92,fz+ew*0.08],r:[0,0,sd*(eyes.fierce?0.28:-0.12)],ol:false}); }
      if(eyes.brow!==false) R.add('head',G_.box(ew*2.0,eh*0.18,0.02),eyes.browCol||INK,{p:[sd*spread,eyeY+eh*1.75,fz-0.005],r:[0,0,sd*(eyes.fierce?0.4:-0.1)],ol:false}); }
    else for(let i=0;i<n;i++){ const a=(i/(n-1)-0.5)*1.2, row=i%2; R.add('head',G_.sph(ew*0.8),ec,{p:[Math.sin(a)*hr*0.7,eyeY+row*eh*1.6-eh*0.6,fz-Math.abs(a)*0.06],glow:eg,ol:false}); }
    if(eyes.mouth!==false) R.add('head',G_.box(ew*(eyes.grin?3:1.4),eyes.grin?0.03:0.016,0.015),eyes.grin?0xFFFFFF:0x6B2A2A,{p:[0,eyeY-hr*0.55,fz-0.01],ol:false});
    if(eyes.grin) for(const sd of [1,-1]) R.add('head',G_.cone(0.022,0.06,6),0xFFFFFF,{p:[sd*ew*1.1,eyeY-hr*0.62,fz-0.005],r:[Math.PI,0,0],ol:false}); };
  if(hd==='human'||hd==='oni'||hd==='fox'||hd==='stone'||hd==='old'){
    const adult=!!sp.face&&STYLE==='anime';
    R.add('head',G_.sph(hr,hr*(adult?1.12:1.05),hr*0.98,20,14),skin,{p:[0,hy,0],grad:adult?shade(skin,0.88):null});
    R.add('head',G_.sph(hr*(adult?0.56:0.62),hr*(adult?0.62:0.55),hr*0.7),skin,{p:[0,hy-hr*(adult?0.46:0.38),hr*0.12],grad:adult?shade(skin,0.85):null}); /* jaw */
    for(const sd of [1,-1]) R.add('head',G_.sph(hr*0.14,hr*0.22,hr*0.12),skin,{p:[sd*hr*0.97,hy-hr*0.05,0]}); /* ears */
    if(sp.face&&STYLE==='chibi') faceChibi(R,hr,hy,sp,eyes,(sp.hair&&sp.hair.col)||(sp.beard&&sp.beard.col)||0x3A2418,skin);
    else if(sp.face) faceAdult(R,hr,hy,sp,eyes,(sp.hair&&sp.hair.col)||(sp.beard&&sp.beard.col)||0x3A2418,skin);
    else if(!(eyes.n>2)) faceAnime(R,hr,hy,eyes,(sp.hair&&sp.hair.col)||(sp.beard&&sp.beard.col)||0x3A2418,skin,sp);
    else { face(hr*0.9,hy-hr*0.08,hr*0.36,hr*(sp.build==='chibi'?0.2:0.15),hr*(sp.build==='chibi'?0.25:0.18));
    R.add('head',G_.sph(hr*0.07,hr*0.05,hr*0.05),shade(skin,0.88),{p:[0,hy-hr*0.32,hr*0.98],ol:false}); }
    if(hd==='oni'){ R.add('head',G_.sph(hr*0.18,hr*0.12,hr*0.12),shade(skin,0.85),{p:[0,hy-hr*0.2,hr*0.98]});
      for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.09,hr*0.32,6),0xFFF4E0,{p:[sd*hr*0.32,hy-hr*0.62,hr*0.82],r:[0.15,0,0]}); }
    if(hd==='old'||sp.wrinkles) for(let i=0;i<2;i++) R.add('head',G_.box(hr*0.6,0.012,0.01),shade(skin,0.75),{p:[0,hy+hr*(0.42+i*0.12),hr*0.92],ol:false}); }
  else if(hd==='dragon'){ R.bone('dhead','head',[0,hy*0.9,hr*0.05]);
    dragonHead(R,'dhead',hr*0.92,{headCol:skin,col2:sp.snout||shade(skin,1.25),belly:sp.belly||0xE8DCA8,eyeCol:eyes.col||0xFFE27A,horns:sp.dhorns||0xF5C542,whiskers:sp.whiskers,mane:sp.mane,maneTip:sp.maneTip},true); }
  else if(hd==='skull'){
    R.add('head',G_.sph(hr*1.05,hr*1.08,hr,18,12),0xEDE6D6,{p:[0,hy+hr*0.1,0]});
    R.add('head',G_.box(hr*1.15,hr*0.4,hr*0.8),0xE2D8C2,{p:[0,hy-hr*0.62,hr*0.2]});
    for(let i=0;i<6;i++) R.add('head',G_.box(hr*0.13,hr*0.2,0.03),0xFFFBF0,{p:[(i-2.5)*hr*0.17,hy-hr*0.45,hr*0.62],ol:false});
    for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.3,hr*0.32,hr*0.2),0x150F1E,{p:[sd*hr*0.38,hy+hr*0.08,hr*0.82],ol:false});
      R.add('head',G_.sph(hr*0.14),ec||0xC58CFF,{p:[sd*hr*0.38,hy+hr*0.08,hr*0.9],glow:true}); }
    R.add('head',G_.cone(hr*0.12,hr*0.22,3),0x150F1E,{p:[0,hy-hr*0.2,hr*0.95],r:[Math.PI,0,0],ol:false}); }
  else if(hd==='bird'){ /* tengu, karura: feathered head with a beak */
    R.add('head',G_.sph(hr,hr*1.02,hr*1.02,18,12),skin,{p:[0,hy,0]});
    R.add('head',G_.cone(hr*0.38,hr*1.1,8),sp.beakCol||0xF09A2A,{p:[0,hy-hr*0.2,hr*1.25],r:[Math.PI/2+0.25,0,0]});
    R.add('head',G_.cone(hr*0.3,hr*0.7,8),shade(sp.beakCol||0xF09A2A,0.8),{p:[0,hy-hr*0.45,hr*1.05],r:[Math.PI/2+0.55,0,0]});
    for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.17,hr*0.17,hr*0.1),ec||0xD8342C,{p:[sd*hr*0.45,hy+hr*0.15,hr*0.82],glow:eg,ol:false});
      R.add('head',G_.box(hr*0.5,0.03,0.03),INK,{p:[sd*hr*0.42,hy+hr*0.38,hr*0.82],r:[0,0,sd*0.4],ol:false}); }
    for(let i=0;i<7;i++){ const a=-0.9+i*0.3; R.add('head',G_.cone(hr*0.2,hr*0.8,5),sp.crestCol||skin,{p:[Math.sin(a)*hr*0.6,hy+hr*0.7,-hr*0.3-Math.cos(a)*hr*0.2],r:[-0.7,0,-a*0.6]}); } }
  else if(hd==='beast'||hd==='bull'||hd==='duck'||hd==='wolf'||hd==='monkey'||hd==='snake'||hd==='tiger'){
    R.add('head',G_.sph(hr*1.02,hr,hr*1.0,18,12),skin,{p:[0,hy,0]});
    const snout=hd==='bull'?[hr*0.6,hr*0.45,hr*0.6]:hd==='duck'?[hr*0.55,hr*0.18,hr*0.75]:hd==='monkey'?[hr*0.55,hr*0.42,hr*0.35]:hd==='snake'?[hr*0.55,hr*0.3,hr*0.9]:[hr*0.45,hr*0.38,hr*0.7];
    R.add('head',G_.sph(...snout),sp.muzzleCol||(hd==='duck'?0xE8C24A:shade(skin,hd==='monkey'?1.25:0.92)),{p:[0,hy-hr*0.3,hr*0.75]});
    R.add('head',G_.sph(hr*0.14,hr*0.1,hr*0.08),INK,{p:[0,hy-hr*0.18,hr*(hd==='duck'?1.45:1.38)],ol:false});
    for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.15,hr*(hd==='snake'?0.1:0.16),hr*0.08),ec||0xF5C542,{p:[sd*hr*0.42,hy+hr*0.12,hr*0.85],glow:eg,ol:false});
      if(!eg) R.add('head',G_.sph(hr*0.05),0xFFFFFF,{p:[sd*hr*0.42-hr*0.04,hy+hr*0.17,hr*0.92],glow:true});
      R.add('head',G_.box(hr*0.42,0.028,0.02),INK,{p:[sd*hr*0.4,hy+hr*0.32,hr*0.86],r:[0,0,sd*0.35],ol:false});
      if(hd==='wolf'||hd==='beast'||hd==='tiger') R.add('head',G_.cone(hr*0.28,hr*0.7,6),skin,{p:[sd*hr*0.55,hy+hr*0.95,-hr*0.05],r:[0,0,sd*-0.3]});
      if(hd==='bull') R.add('head',G_.sph(hr*0.2,hr*0.12,hr*0.15),skin,{p:[sd*hr*1.0,hy+hr*0.15,0]}); }
    if(hd==='duck'){ R.add('head',G_.cyl(hr*0.55,hr*0.6,hr*0.12,16),0x9FE6FF,{p:[0,hy+hr*0.98,0]}); R.add('head',G_.cyl(hr*0.45,hr*0.45,hr*0.05,16),0x6FC8FF,{p:[0,hy+hr*1.04,0],glow:true}); }
    if(hd==='tiger') for(let i=0;i<4;i++) R.add('head',G_.box(hr*0.5,0.03,0.03),INK,{p:[0,hy+hr*(0.55-i*0.12),hr*0.88-i*0.04],ol:false});
    if(hd==='snake') for(let i=0;i<5;i++){ const a=(i/4-0.5)*2.2; R.add('head',G_.tube([[0,0,0],[Math.sin(a)*hr*0.6,hr*0.6,-hr*0.2],[Math.sin(a)*hr*1.0,hr*1.25,hr*0.2]],hr*0.16,hr*0.1,6,8),skin,{p:[0,hy+hr*0.3,-hr*0.4]});
      R.add('head',G_.sph(hr*0.22,hr*0.16,hr*0.3),skin,{p:[Math.sin(a)*hr*1.0,hy+hr*1.6,-hr*0.1]}); R.add('head',G_.sph(hr*0.05),0xF5C542,{p:[Math.sin(a)*hr*1.0+0.03,hy+hr*1.65,hr*0.12],glow:true}); } }
  else if(hd==='mask'){ /* noh / hannya / fox masks over a human head */
    R.add('head',G_.sph(hr,hr*1.05,hr*0.98,20,14),sp.skin||0xF6D2B0,{p:[0,hy,0]});
    R.add('head',G_.sph(hr*0.95,hr*1.05,hr*0.4,18,12),sp.maskCol||0xFBF6EE,{p:[0,hy-hr*0.02,hr*0.72]});
    if(sp.mask==='hannya'){ for(const sd of [1,-1]){ R.add('head',G_.tube([[0,0,0],[sd*hr*0.2,hr*0.5,0],[sd*hr*0.5,hr*0.9,-hr*0.2]],hr*0.14,hr*0.03,6,8),0xFFF0D8,{p:[sd*hr*0.45,hy+hr*0.65,hr*0.4]});
        R.add('head',G_.sph(hr*0.17,hr*0.12,hr*0.06),0xD8B020,{p:[sd*hr*0.36,hy+hr*0.12,hr*1.08],glow:true}); }
      R.add('head',G_.box(hr*0.9,hr*0.18,0.04),0xB3261E,{p:[0,hy-hr*0.5,hr*1.08],ol:false});
      for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.07,hr*0.22,5),0xFFFFFF,{p:[sd*hr*0.3,hy-hr*0.45,hr*1.1],r:[Math.PI,0,0],ol:false}); }
    else if(sp.mask==='fox'){ R.add('head',G_.cone(hr*0.38,hr*0.8,8),sp.maskCol||0xF5C542,{p:[0,hy-hr*0.2,hr*1.1],r:[Math.PI/2,0,0]});
      for(const sd of [1,-1]){ R.add('head',G_.box(hr*0.36,0.04,0.03),0xD8342C,{p:[sd*hr*0.36,hy+hr*0.12,hr*1.02],r:[0,0,sd*0.35],ol:false}); R.add('head',G_.box(0.03,hr*0.4,0.03),0xD8342C,{p:[sd*hr*0.25,hy+hr*0.55,hr*0.92],ol:false}); } }
    else { /* okina: smiling old-man mask */
      for(const sd of [1,-1]) R.add('head',G_.box(hr*0.32,0.025,0.02),INK,{p:[sd*hr*0.34,hy+hr*0.08,hr*1.1],r:[0,0,sd*-0.4],ol:false});
      R.add('head',G_.box(hr*0.55,0.025,0.02),INK,{p:[0,hy-hr*0.42,hr*1.08],ol:false});
      for(const sd of [1,-1]) R.add('head',G_.sph(hr*0.15,hr*0.08,hr*0.05),0xE6B0A8,{p:[sd*hr*0.48,hy-hr*0.2,hr*1.02],ol:false}); } }
  /* --- horns */
  const H=sp.horns; if(H){ const hc=H.col||0xF2E6CF, n=H.n||2;
    for(let i=0;i<n;i++){ const sd=n===1?0:(i%2?-1:1), k=Math.floor(i/2);
      if(H.style==='curved'||H.style==='bull') R.add('head',G_.tube([[0,0,0],[sd*hr*0.45,hr*0.25,0],[sd*hr*0.85,hr*0.7,-hr*0.05],[sd*hr*0.75,hr*1.15,hr*0.15]],hr*0.17,hr*0.03,7,12),hc,{p:[sd*hr*0.62,hy+hr*0.45,0]});
      else if(H.style==='antler') R.add('head',G_.tube([[0,0,0],[sd*hr*0.2,hr*0.5,-hr*0.1],[sd*hr*0.55,hr*0.9,-hr*0.3],[sd*hr*0.45,hr*1.4,-hr*0.5]],hr*0.09,hr*0.03,6,12),hc,{p:[sd*hr*0.4,hy+hr*0.8,0],glow:!!H.glow}),
        R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.2,hr*0.1],[sd*hr*0.55,hr*0.35,hr*0.25]],hr*0.06,hr*0.02,5,8),hc,{p:[sd*hr*0.55,hy+hr*1.4,-hr*0.2],glow:!!H.glow});
      else { const L=hr*(H.len||0.75)*1.35, rr=hr*(H.size||0.22)*1.2; R.add('head',G_.tube([[0,0,0],[sd*L*0.12,L*0.45,0],[sd*L*0.32,L*0.85,-L*0.05],[sd*L*0.5,L*1.1,-L*0.15]],rr,rr*0.12,8,12),hc,{p:[sd*hr*(0.42+k*0.2),hy+hr*(0.82-k*0.1),hr*0.15-hr*0.05*k]}); } } }
  if(sp.ears==='fox') for(const sd of [1,-1]){ R.add('head',G_.cone(hr*0.32,hr*0.75,4),sp.earCol||0xFFFFFF,{p:[sd*hr*0.55,hy+hr*1.0,-hr*0.05],r:[0,Math.PI/4,sd*-0.28]});
    R.add('head',G_.cone(hr*0.18,hr*0.5,4),0xF6A6B6,{p:[sd*hr*0.55,hy+hr*0.98,hr*0.06],r:[0,Math.PI/4,sd*-0.28],ol:false}); }
  buildHair(R,sp,B,hr,hy); buildHat(R,sp,B,hr,hy);
  if(sp.beard){ const bc=sp.beard.col||0xF2F2F2, st=sp.beard.style||'long';
    if(st==='mustache') for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,-hr*0.05,0],[sd*hr*0.55,-hr*0.25,-hr*0.05]],hr*0.08,hr*0.02,6,8),bc,{p:[0,hy-hr*0.32,hr*0.95]});
    else { const L=st==='long'?hr*1.6:hr*0.9; R.add('head',G_.lathe([[0.001,0],[hr*0.55,-hr*0.05],[hr*0.6,-L*0.4],[hr*0.35,-L*0.8],[0.01,-L]],10),bc,{p:[0,hy-hr*0.35,hr*0.55],s:[1,1,0.6]});
      for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,-hr*0.05,0],[sd*hr*0.5,-hr*0.2,0]],hr*0.08,hr*0.02,6,8),bc,{p:[0,hy-hr*0.32,hr*0.95]}); } }
}

function buildHair(R,sp,B,hr,hy){
  const H=sp.hair; if(!H||H.style==='bald') return; const c=H.col||0x2A2433, c2=H.col2||shade(c,0.8), tip=H.tip||shade(c,1.25), root=shade(c,0.8);
  const cap=()=>{ R.add('head',G_.part(hr*1.07,hr*1.1,hr*1.07,0,TAU,0,Math.PI*0.42),c,{p:[0,hy+hr*0.06,-hr*0.03],grad:root});
    R.add('head',G_.part(hr*1.08,hr*1.1,hr*1.08,Math.PI*0.92,Math.PI*1.16,0,Math.PI*0.82),c,{p:[0,hy+hr*0.04,-hr*0.04],grad:root}); };
  /* a tapered strand of hair; points are head-space; onHair hangs it from the swaying hair bone */
  const strand=(pts,r0,col,o)=>{ o=o||{}; const P=o.onHair?pts.map(q=>[q[0],q[1]-hr*0.9,q[2]+hr*0.4]):pts;
    R.add(o.onHair?'hair':'head',G_.tube(P,r0,o.r1||hr*0.02,6,o.seg||10),col,{grad:o.tip||tip,gax:o.gax||1.4,glow:!!o.glow}); };
  const bangs=(n,len,spread)=>{ for(let i=0;i<n;i++){ const u=n>1?i/(n-1)-0.5:0, a=u*(spread||2.0)+(u>0?0.12:-0.12), side=Math.abs(u)*2, L=hr*len*(1+0.22*side*side+((i%3)-1)*0.08);
      strand([[Math.sin(a)*hr*0.3,hy+hr*1.02,Math.cos(a)*hr*0.35],[Math.sin(a)*hr*0.78,hy+hr*0.74,Math.cos(a)*hr*1.0],[Math.sin(a)*hr*(0.88+side*0.2)+u*hr*0.25,hy+hr*0.98-L,Math.cos(a)*hr*(0.98-side*0.12)]],hr*0.21,i%2?c:c2); } };
  const locks=(len,k)=>{ for(const sd of [1,-1]) for(let j=0;j<(k||1);j++){ const o=j*hr*0.12;
      strand([[sd*hr*0.82,hy+hr*0.45,hr*0.3+o],[sd*(hr*0.98+o),hy-hr*0.35,hr*0.45],[sd*(hr*0.92+o*1.5),hy-hr*len*0.6,hr*0.5],[sd*(hr*0.98+o*2),hy-hr*len,hr*0.45]],hr*(0.24-j*0.05),j?root:c,{seg:12}); } };
  const back=(n,L,fl,spread)=>{ for(let i=0;i<n;i++){ const u=n>1?i/(n-1)-0.5:0, a=u*(spread||2.3), au=Math.abs(u), w=Math.sin(i*1.7)*hr*0.18;
      strand([[Math.sin(a)*hr*0.85,hy+hr*0.5*Math.cos(u*1.3),-Math.cos(a)*hr*0.62-hr*0.08],[Math.sin(a)*hr*(1.2+au*0.6),hy-hr*0.45,-hr*0.78-Math.cos(a)*hr*0.18],
        [Math.sin(a)*hr*(1.3+fl*au*0.9)+w,hy-L*0.55,-hr*0.62+Math.cos(i)*hr*0.1],[Math.sin(a)*hr*(1.35+fl*au*1.5)-w,hy-L*(0.9+0.08*Math.sin(i*2.3)),-hr*0.4]],hr*(0.36-au*0.08),i%3===1?root:c,{onHair:true,seg:14,gax:0.8,r1:hr*0.04}); } };
  switch(H.style){
    case 'flow': hairFlow(R,H,hr,hy,cap,sp._hk); break;
    case 'long': case 'longflow': { const L=hr*Math.max(2.2,(H.len||3)*1.15)*(sp._hk||1);
      cap(); bangs(H.bangs||6,0.6,2.3); for(const sd of [1,-1]) strand([[sd*hr*0.8,hy+hr*0.5,hr*0.3],[sd*hr*1.02,hy-hr*0.2,hr*0.32],[sd*hr*1.2,hy-hr*0.95,hr*0.1],[sd*hr*1.35,hy-L*0.55,-hr*0.15]],hr*0.22,c,{seg:12});
      R.add('hair',G_.lathe([[hr*0.9,hy+hr*0.55],[hr*1.12,hy-hr*0.4],[hr*1.35,hy-L*0.5],[hr*1.5,hy-L*0.9],[hr*1.3,hy-L*0.97]],20),root,{p:[0,-hr*0.9,hr*0.4-hr*0.78],s:[1,1,0.38],grad:tip,gax:1.2});
      back(Math.max(4,Math.round((H.strands||14)*SEGK)),L,H.flare||0.9);
      if(H.ornament) for(const sd of [1,-1]) R.add('head',G_.star(hr*0.22,hr*0.09,5,0.02),H.ornament,{p:[sd*hr*0.78,hy+hr*0.6,hr*0.35],r:[0,sd*0.6,0]}); break; }
    case 'spiky': cap(); bangs(7,0.62,1.9);
      for(let i=0;i<13;i++){ const a=(i/12-0.5)*Math.PI*1.7, tier=i%2, len=hr*(1.0+tier*0.35+((i*7)%3)*0.12), sx=Math.sin(a), cz=Math.cos(a);
        strand([[sx*hr*0.6,hy+hr*(0.8+0.15*cz),-hr*0.1],[sx*hr*(0.95+0.2*tier),hy+hr*(0.95+0.25*cz),-hr*0.45],[sx*(hr*0.9+len*0.5),hy+hr*(0.75+0.3*cz)+len*0.35*(tier?1:0.4),-hr*0.55-len*0.45]],hr*0.3,tier?c:c2,{seg:8}); }
      for(const sd of [1,-1]) strand([[sd*hr*0.85,hy+hr*0.5,hr*0.3],[sd*hr*0.98,hy-hr*0.1,hr*0.35],[sd*hr*0.9,hy-hr*0.55,hr*0.4]],hr*0.2,c2); break;
    case 'wild': cap(); bangs(6,0.58,2.2);
      for(let i=0;i<24;i++){ const a=(i/23-0.5)*Math.PI*1.85, ring=i%3, len=hr*(1.25+ring*0.45+(i%2)*0.25), sx=Math.sin(a), cz=Math.cos(a);   /* a big mane */
        strand([[sx*hr*0.8,hy+hr*(0.45+0.35*cz),-hr*(0.15+ring*0.12)],[sx*(hr*1.1+len*0.25),hy+hr*(0.4+0.45*cz)-ring*hr*0.1,-hr*(0.45+ring*0.2)],[sx*(hr*1.0+len*0.75),hy+hr*(0.2+0.6*cz)-ring*hr*0.3,-hr*(0.55+ring*0.25)-len*0.2]],hr*(0.36-ring*0.05),i%2?c:c2,{seg:8,r1:hr*0.03}); }
      for(let i=0;i<5;i++) strand([[(i-2)*hr*0.35,hy+hr*0.55,-hr*0.7],[(i-2)*hr*0.45,hy-hr*0.2,-hr*1.05],[(i-2)*hr*0.55,hy-hr*0.9,-hr*1.05]],hr*0.3,c,{onHair:false,seg:8}); break;
    case 'flame': cap(); bangs(5,0.5,1.8);
      for(let i=0;i<14;i++){ const a=(i/13-0.5)*2.6, h2=hr*(1.0+(i%3)*0.4), sx=Math.sin(a);
        strand([[sx*hr*0.55,hy+hr*0.85,-hr*0.15],[sx*hr*0.75+Math.sin(i)*hr*0.15,hy+hr*0.95+h2*0.45,-hr*0.3],[sx*hr*0.6-Math.sin(i)*hr*0.2,hy+hr*0.95+h2,-hr*0.45]],hr*0.3,i%3?c:c2,{tip:0xFFE27A,glow:i%3===0,seg:8}); } break;
    case 'bun': cap(); bangs(7,0.5,1.9); locks(1.6,1);
      R.add('head',G_.sph(hr*0.45,hr*0.4,hr*0.42),c,{p:[0,hy+hr*1.05,-hr*0.35],grad:root}); R.add('head',G_.tor(hr*0.3,hr*0.08,6,16),c2,{p:[0,hy+hr*1.0,-hr*0.35],r:[Math.PI/2,0,0]});
      for(const sd of [1,-1]){ R.add('head',G_.cyl(0.014,0.014,hr*1.6,5),H.pin||0xF5C542,{p:[sd*hr*0.2,hy+hr*1.1,-hr*0.3],r:[0,0,Math.PI/2+sd*0.35]});
        R.add('head',G_.sph(hr*0.09),H.pinGem||0xD8342C,{p:[sd*hr*0.95,hy+hr*1.38,-hr*0.3]});
        for(let k=0;k<3;k++) R.add('head',G_.cyl(0.006,0.006,hr*0.5,3),H.pin||0xF5C542,{p:[sd*hr*(0.95+k*0.05),hy+hr*1.1,-hr*0.3],ol:false}); } break;
    case 'pony': cap(); bangs(7,0.55); locks(1.4,1);
      for(let k=0;k<5;k++){ const dx=(k-2)*hr*0.12; strand([[dx,hy+hr*0.65,-hr*0.75],[dx*1.5,hy+hr*0.2,-hr*1.25],[dx*2,hy-hr*0.9,-hr*1.25],[dx*2.4,hy-hr*(1.9+0.2*(k%2)),-hr*1.0]],hr*0.22,k%2?c:c2,{onHair:true,seg:12}); }
      R.add('head',G_.tor(hr*0.14,hr*0.05,6,12),H.tie||0xD8342C,{p:[0,hy+hr*0.62,-hr*0.82],r:[0.4,0,0]}); break;
    case 'short': cap(); bangs(7,0.55);
      for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.6; strand([[Math.sin(a)*hr*0.75,hy+hr*0.6,-Math.cos(a)*hr*0.5],[Math.sin(a)*hr*1.05,hy+hr*0.15,-Math.cos(a)*hr*0.85],[Math.sin(a)*hr*1.0,hy-hr*0.35,-Math.cos(a)*hr*0.9]],hr*0.25,i%2?c:c2,{seg:8}); } break;
    case 'topknot': cap(); R.add('head',G_.cyl(hr*0.14,hr*0.18,hr*0.5,8),c,{p:[0,hy+hr*1.05,-hr*0.25],r:[-0.6,0,0],grad:root});
      R.add('head',G_.tor(hr*0.15,hr*0.05,5,12),H.tie||0xF4F1EA,{p:[0,hy+hr*0.95,-hr*0.2],r:[0.95,0,0]}); for(const sd of [1,-1]) strand([[sd*hr*0.85,hy+hr*0.4,hr*0.2],[sd*hr*0.97,hy,hr*0.3],[sd*hr*0.92,hy-hr*0.4,hr*0.35]],hr*0.16,c); break;
    case 'hood': R.add('head',G_.part(hr*1.2,hr*1.22,hr*1.18,Math.PI*0.78,Math.PI*1.44,0,Math.PI),c,{p:[0,hy+hr*0.06,-hr*0.05],grad:root}); R.add('head',G_.tor(hr*0.86,hr*0.16,6,18),c2,{p:[0,hy,hr*0.62],s:[1,1.12,1]});
      for(let k=0;k<4;k++) R.add('head',G_.tor(hr*(1.0+k*0.04),hr*0.035,4,18,Math.PI),shade(c,0.75),{p:[0,hy+hr*(0.6-k*0.3),-hr*0.2],r:[0,0,0],ol:false});
      if(H.mask){ R.add('head',G_.sph(hr*0.84,hr*0.44,hr*0.52),H.mask,{p:[0,hy-hr*0.45,hr*0.55],grad:shade(H.mask,0.8)}); R.add('head',G_.box(hr*1.4,0.01,0.01),shade(H.mask,0.6),{p:[0,hy-hr*0.3,hr*1.04],ol:false}); }
      for(const sd of [1,-1]) R.add('hair',G_.tube([[0,0,0],[sd*hr*0.25,-hr*0.3,-hr*0.5],[sd*hr*0.45,-hr*0.5,-hr*1.2]],hr*0.14,hr*0.05,5,10),c2,{p:[sd*hr*0.1,-hr*0.6,-hr*0.2]}); break;
  }
}

function buildHat(R,sp,B,hr,hy){
  const H=sp.hat; if(!H) return; const c=H.col||0x24324A, c2=H.col2||0xF5C542;
  switch(H.kind){
    case 'kabuto': {   /* ribbed bowl, gilded rim, flared three-tier neck guard, turned-back side flaps, peak, crest */
      R.add('head',G_.hemi(hr*1.14,hr*1.02,hr*1.14,20),c,{p:[0,hy+hr*0.18,-hr*0.02],grad:shade(c,0.72)});
      for(let i=0;i<12;i++) R.add('head',G_.tor(hr*1.13,hr*0.018,4,10,Math.PI/2),shade(c,1.3),{p:[0,hy+hr*0.18,-hr*0.02],r:[0,i/12*TAU,0],s:[1,0.9,1],ol:false});
      R.add('head',G_.tor(hr*1.14,hr*0.055,5,26),c2,{p:[0,hy+hr*0.2,-hr*0.02],r:[Math.PI/2,0,0]});
      R.add('head',G_.sph(hr*0.14,hr*0.08,hr*0.14),c2,{p:[0,hy+hr*1.2,-hr*0.02]});
      for(let i=0;i<3;i++){ const y=hy+hr*(0.18-i*0.22), r0=hr*(1.13+i*0.13), r1=hr*(1.28+i*0.15);
        R.add('head',G_.lathe([[r0,0.001],[r1,-hr*0.24]],20,1.05,TAU-2.1),i%2?shade(c,0.82):c,{p:[0,y,-hr*0.02],grad:shade(c,0.68)});
        R.add('head',G_.lathe([[r1-0.004,-hr*0.2],[r1+0.004,-hr*0.24]],20,1.05,TAU-2.1),H.lace||c2,{p:[0,y,-hr*0.02],ol:false}); }
      for(const sd of [1,-1]){ R.add('head',G_.box(hr*0.5,hr*0.42,0.045),c,{p:[sd*hr*1.15,hy+hr*0.05,hr*0.45],r:[0,sd*0.95,sd*0.12],grad:shade(c,0.75)});
        R.add('head',G_.box(hr*0.12,hr*0.12,0.05),c2,{p:[sd*hr*1.22,hy+hr*0.08,hr*0.5],r:[0,sd*0.95,0],ol:false}); }
      R.add('head',G_.lathe([[hr*1.12,0.001],[hr*1.3,-hr*0.1]],14,-0.85,1.7),c,{p:[0,hy+hr*0.22,0]});
      if(H.crest==='crescent'){ R.add('head',G_.crescent(hr*1.25,hr*0.3,0.05),c2,{p:[0,hy+hr*0.55,hr*0.92],r:[-0.25,0,0],glow:!!H.glow,grad:shade(c2,0.8)}); R.add('head',G_.sph(hr*0.12,hr*0.12,hr*0.06),c2,{p:[0,hy+hr*0.5,hr*1.08]}); }
      else if(H.crest==='horns') for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.45,hr*0.35,hr*0.1],[sd*hr*0.85,hr*1.0,0],[sd*hr*0.8,hr*1.6,-hr*0.2]],hr*0.14,hr*0.03,6,12),c2,{p:[sd*hr*0.35,hy+hr*0.9,hr*0.45],grad:shade(c2,0.8)});
      else if(H.crest==='sun'){ R.add('head',G_.sph(hr*0.3,hr*0.3,hr*0.07),c2,{p:[0,hy+hr*1.05,hr*0.78],glow:!!H.glow}); R.add('head',G_.star(hr*0.6,hr*0.32,12,0.03),c2,{p:[0,hy+hr*1.05,hr*0.74],glow:!!H.glow}); }
      else if(H.crest==='kuwagata'){ for(const sd of [1,-1]){ let q=[[0,0],[hr*0.16,0],[hr*0.34,hr*0.75],[hr*0.3,hr*1.5],[hr*0.12,hr*1.62],[hr*0.18,hr*0.8]].map(p=>[sd*p[0],p[1]]); if(sd<0) q=q.reverse(); R.add('head',G_.shape(q,0.035,0.006),c2,{p:[sd*hr*0.12,hy+hr*0.55,hr*0.88],r:[-0.15,0,-sd*0.12],grad:shade(c2,0.75)}); }
        R.add('head',G_.cyl(hr*0.22,hr*0.22,0.03,18),c2,{p:[0,hy+hr*0.6,hr*0.95],r:[Math.PI/2-0.15,0,0]}); if(H.mon) R.add('head',G_.star(hr*0.18,hr*0.08,8,0.02),H.mon,{p:[0,hy+hr*0.6,hr*0.98],r:[-0.15,0,0],glow:true}); }
      else if(H.crest==='snow') R.add('head',G_.star(hr*0.55,hr*0.2,6,0.04),c2,{p:[0,hy+hr*1.05,hr*0.72],glow:true});
      else if(H.crest==='flame') for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.6; R.add('head',G_.tube([[0,0,0],[Math.sin(a)*hr*0.2,hr*0.4,0],[Math.sin(a)*hr*0.5,hr*(0.9+(i%2)*0.4),-hr*0.1]],hr*0.16,hr*0.02,5,8),0xFF5A1F,{p:[Math.sin(a)*hr*0.3,hy+hr*1.0,hr*0.35],glow:true,grad:0xFFE27A}); }
      else if(H.crest==='antler') for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.5,0],[sd*hr*0.7,hr*0.9,-hr*0.1],[sd*hr*0.6,hr*1.4,-hr*0.3]],hr*0.1,hr*0.03,6,10),c2,{p:[sd*hr*0.3,hy+hr*1.0,hr*0.4]});
      break; }
    case 'eboshi': R.add('head',G_.lathe([[hr*0.82,0],[hr*0.86,hr*0.7],[hr*0.6,hr*1.8],[hr*0.2,hr*2.1],[0.01,hr*2.12]],14),c,{p:[0,hy+hr*0.45,-hr*0.12],r:[-0.18,0,0],s:[1,1,0.8]});
      R.add('head',G_.cyl(0.012,0.012,hr*2.2,4),0xC8C0D8,{p:[0,hy-hr*0.2,hr*0.6],r:[0,0,Math.PI/2],ol:false}); break;
    case 'tokin': R.add('head',G_.cyl(hr*0.3,hr*0.38,hr*0.4,6),c,{p:[0,hy+hr*1.05,hr*0.25]}); break;
    case 'kasa': R.add('head',G_.cone(hr*2.4,hr*0.9,20),c,{p:[0,hy+hr*1.15,0]}); R.add('head',G_.tor(hr*2.35,hr*0.05,5,28),c2,{p:[0,hy+hr*0.72,0],r:[Math.PI/2,0,0]});
      for(let i=0;i<8;i++){ const a=i/8*TAU; R.add('head',G_.cyl(0.012,0.012,hr*2.4,4),shade(c,0.7),{p:[Math.sin(a)*hr*1.2,hy+hr*1.15,Math.cos(a)*hr*1.2],r:[Math.cos(a)*1.2,0,-Math.sin(a)*1.2],ol:false}); } break;
    case 'crown': R.add('head',G_.cyl(hr*0.92,hr*0.88,hr*0.35,16,true),c,{p:[0,hy+hr*0.9,-hr*0.05]});
      for(let i=0;i<(H.n||7);i++){ const a=(i/((H.n||7)-1)-0.5)*2.4; R.add('head',G_.cone(hr*0.13,hr*(i===Math.floor((H.n||7)/2)?0.9:0.55),5),c,{p:[Math.sin(a)*hr*0.9,hy+hr*1.25,Math.cos(a)*hr*0.85],r:[Math.cos(a)*-0.15,0,-a*0.2]}); }
      if(H.gem) R.add('head',G_.sph(hr*0.14),H.gem,{p:[0,hy+hr*1.0,hr*0.95],glow:true}); break;
    case 'judge': R.add('head',G_.cyl(hr*0.9,hr*0.95,hr*0.7,16),c,{p:[0,hy+hr*1.1,0]}); R.add('head',G_.box(hr*2.4,hr*0.1,hr*1.4),c,{p:[0,hy+hr*1.5,0]});
      R.add('head',G_.box(hr*0.5,hr*0.36,0.04),c2,{p:[0,hy+hr*1.1,hr*0.92]});
      for(let i=0;i<6;i++) R.add('head',G_.cyl(0.012,0.012,hr*0.7,4),c2,{p:[(i-2.5)*hr*0.36,hy+hr*1.1,hr*0.7],ol:false}); break;
    case 'pagoda': for(let i=0;i<3;i++) R.add('head',G_.cyl(hr*(0.95-i*0.25),hr*(1.05-i*0.25),hr*0.35,8),i%2?c2:c,{p:[0,hy+hr*(1.0+i*0.38),0]});
      R.add('head',G_.cone(hr*0.25,hr*0.6,8),c2,{p:[0,hy+hr*2.3,0]}); break;
    case 'halo': R.add('back',G_.tor(hr*1.6,hr*0.06,6,32),c2,{p:[0,B.torso*0.45+hr*1.7,-0.1],glow:true}); break;
    case 'sun': R.add('head',G_.tor(hr*1.25,hr*0.07,6,28),c2,{p:[0,hy+hr*0.45,-hr*0.4],glow:true});
      for(let i=0;i<12;i++){ const a=i/12*TAU; R.add('head',G_.cone(hr*0.1,hr*0.55,4),c2,{p:[Math.sin(a)*hr*1.55,hy+hr*0.45+Math.cos(a)*hr*1.55,-hr*0.42],r:[0,0,-a],glow:true}); }
      R.add('head',G_.tor(hr*0.95,hr*0.06,5,20),c,{p:[0,hy+hr*0.55,0],r:[Math.PI/2-0.25,0,0]}); break;
    case 'moon': R.add('head',G_.crescent(hr*1.2,hr*0.3,0.05),c2,{p:[0,hy+hr*1.05,-hr*0.1],glow:!!H.glow}); R.add('head',G_.tor(hr*0.95,hr*0.05,5,20),c,{p:[0,hy+hr*0.55,0],r:[Math.PI/2-0.2,0,0]}); break;
    case 'stars': for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.6; R.add('head',G_.star(hr*(i%2?0.22:0.32),hr*0.1,4,0.03),c2,{p:[Math.sin(a)*hr*1.3,hy+hr*0.9+Math.cos(a)*hr*0.8,-hr*0.3],glow:true}); } break;
    case 'leaves': for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.8; R.add('head',G_.leaf(hr*0.25,hr*0.9),i%2?c:c2,{p:[Math.sin(a)*hr*0.9,hy+hr*0.7,Math.cos(a)*hr*0.8-hr*0.15],r:[-0.3,a,0]}); } break;
    case 'hood': R.add('head',G_.part(hr*1.22,hr*1.24,hr*1.2,Math.PI*0.78,Math.PI*1.44,0,Math.PI),c,{p:[0,hy+hr*0.06,-hr*0.06]}); R.add('head',G_.box(hr*1.8,hr*1.2,0.05),c,{p:[0,hy-hr*0.6,-hr*0.6],ol:true}); break;
    case 'veil': R.add('head',G_.cyl(hr*0.4,hr*1.2,hr*2.2,16,true),c,{p:[0,hy-hr*0.2,-hr*0.25],s:[1,1,0.7]}); break;
  }
}

function buildWeapon(R,sp,B){ const W=sp.weapon; if(!W||W.kind==='none') return;
  if(!buildWeaponV76(R,sp,B,W)) buildWeaponBase(R,sp,B);
  if(W.off){ const o=Object.assign({},sp,{weapon:Object.assign({},W.off,{hand:'L'})}); buildWeapon(R,o,B); } }
function buildWeaponBase(R,sp,B){
  const W=sp.weapon; const hand=W.hand==='L'?'handL':'handR', c=W.col||0xE6ECF2, c2=W.col2||0x3A2418, s=W.s||1, gl=!!W.glow;
  const fwd=(len)=>({p:[0,-B.limb*0.7,len*0.5],r:[Math.PI/2,0,0]});
  switch(W.kind){
    case 'katana': case 'greatsword': { const L=(W.kind==='greatsword'?1.25:0.9)*s, wdt=W.kind==='greatsword'?0.09:0.045;
      R.add(hand,G_.cyl(0.03,0.03,0.22,6),c2,{p:[0,-B.limb*0.7,0.02],r:[Math.PI/2,0,0]});
      R.add(hand,G_.cyl(0.07,0.07,0.025,10),0xF5C542,{p:[0,-B.limb*0.7,0.13],r:[Math.PI/2,0,0]});
      R.add(hand,G_.shape([[-wdt/2,0],[wdt/2,0],[wdt/2,L*0.88],[0,L],[-wdt/2,L*0.92]],0.018,0.004),c,{p:[0,-B.limb*0.7,0.14],r:[Math.PI/2,0,0],glow:gl}); break; }
    case 'club': { const L=0.95*s, r0=0.055*s, r1=0.16*s, z0=-0.05; R.add(hand,G_.cyl(r1,r0,L,10),c,{p:[0,-B.limb*0.7,z0+L*0.5],r:[Math.PI/2,0,0]});
      R.add(hand,G_.sph(r1*1.02,r1*1.02,r1*0.6),c,{p:[0,-B.limb*0.7,z0+L]});
      for(let i=0;i<14;i++){ const a=i*2.39996, t=0.4+0.55*((i*0.618)%1), rr=lerp(r0,r1,t); R.add(hand,G_.cone(0.03*s,0.1*s,5),0xD9DEE6,{p:[Math.sin(a)*rr,-B.limb*0.7+Math.cos(a)*rr,z0+L*t],r:[0,0,-a]}); } break; }
    case 'staff': case 'spear': case 'trident': case 'naginata': case 'nagi': { const L=1.7*s; R.add(hand,G_.cyl(0.028,0.028,L,6),c2,{p:[0,-B.limb*0.7,0.2],r:[0.25,0,0]});
      const tipY=L*0.5*Math.cos(0.25), tipZ=0.2+L*0.5*Math.sin(0.25);
      if(W.kind==='spear') R.add(hand,G_.cone(0.06,0.3,4),c,{p:[0,-B.limb*0.7+tipY+0.12,tipZ+0.03],r:[0.25,0,0],glow:gl});
      else if(W.kind==='trident') for(const d of [-1,0,1]) R.add(hand,G_.cone(0.035,0.28,4),c,{p:[d*0.09,-B.limb*0.7+tipY+0.12,tipZ+0.03],r:[0.25,0,-d*0.15],glow:gl});
      else if(W.kind==='naginata') R.add(hand,G_.shape([[0,0],[0.07,0.05],[0.09,0.35],[0,0.5],[-0.02,0.1]],0.02,0.004),c,{p:[0,-B.limb*0.7+tipY,tipZ],r:[0.25,0,0],glow:gl});
      else { R.add(hand,G_.sph(0.1),W.orb||0xC58CFF,{p:[0,-B.limb*0.7+tipY+0.08,tipZ+0.02],glow:true}); R.add(hand,G_.tor(0.12,0.018,5,14),c,{p:[0,-B.limb*0.7+tipY+0.08,tipZ+0.02]}); } break; }
    case 'bow': { R.add('handL',G_.tube([[-0.02,-0.66,0],[0.12,-0.36,0],[0.18,0,0],[0.12,0.36,0],[-0.02,0.66,0]],0.026,0.02,6,18),c2,{p:[0.06,-B.limb*0.7,0.04]});
      R.add('handL',G_.cyl(0.005,0.005,1.32,3),0xF4F1EA,{p:[0.04,-B.limb*0.7,0.04],ol:false}); break; }
    case 'sunbow': weaponSunbow(R,W,B); break;
    case 'fan': R.add(hand,G_.shape((()=>{ const p=[[0,0]]; for(let i=0;i<=10;i++){ const a=Math.PI*(0.2+0.6*i/10); p.push([Math.cos(a)*0.38*s,Math.sin(a)*0.38*s]); } return p; })(),0.015,0.003),c,{p:[0,-B.limb*0.5,0.12],r:[Math.PI/2-0.3,0,0]}); break;
    case 'sickle': R.add(hand,G_.cyl(0.026,0.026,0.6*s,6),c2,{p:[0,-B.limb*0.7,0.2],r:[Math.PI/2,0,0]}); R.add(hand,G_.crescent(0.38*s,0.08,0.02),c,{p:[0,-B.limb*0.7+0.05,0.5*s],r:[0,Math.PI/2,0]}); break;
    case 'orb': R.add(hand,G_.sph(0.14*s),W.col||0x9FE6FF,{p:[0,-B.limb*0.5,0.1],glow:true}); R.add(hand,G_.tor(0.18*s,0.015,5,16),0xFFFFFF,{p:[0,-B.limb*0.5,0.1],glow:true}); break;
    case 'talisman': R.add(hand,G_.box(0.1,0.28,0.01),0xFFF8E0,{p:[0,-B.limb*0.5,0.1],r:[Math.PI/2-0.4,0,0]}); R.add(hand,G_.box(0.03,0.2,0.012),0xD8342C,{p:[0,-B.limb*0.5,0.11],r:[Math.PI/2-0.4,0,0],ol:false}); break;
    case 'lute': R.add('spine',G_.sph(0.17,0.24,0.05),c2,{p:[0.06,0.02,B.w*0.85],r:[0,0,0.7]}); R.add('spine',G_.cyl(0.02,0.02,0.45,5),c2,{p:[-0.16,0.25,B.w*0.85],r:[0,0,0.7]}); break;
    case 'bell': R.add(hand,G_.lathe([[0.02,0.2],[0.12,0.15],[0.16,0],[0.2,-0.12],[0.18,-0.14]],14),c,{p:[0,-B.limb*0.7-0.15,0.15]}); break;
    case 'pipe': R.add(hand,G_.cyl(0.015,0.015,0.5,5),c2,{p:[0,-B.limb*0.5,0.22],r:[Math.PI/2,0,0]}); R.add(hand,G_.cyl(0.04,0.03,0.07,8),0xF5C542,{p:[0,-B.limb*0.5+0.03,0.46]}); break;
    case 'umbrella': R.add(hand,G_.cyl(0.02,0.02,1.4*s,5),c2,{p:[0,-B.limb*0.6+0.45,0.12]}); R.add(hand,G_.cone(0.75*s,0.32*s,16),c,{p:[0,-B.limb*0.6+1.2,0.12]}); break;
    case 'dagger': R.add(hand,G_.cyl(0.025,0.025,0.12,6),c2,{p:[0,-B.limb*0.7,0.02],r:[Math.PI/2,0,0]}); R.add(hand,G_.shape([[-0.03,0],[0.03,0],[0,0.32]],0.015,0.003),c,{p:[0,-B.limb*0.7,0.08],r:[Math.PI/2,0,0],glow:gl}); break;
    case 'mallet': R.add(hand,G_.cyl(0.03,0.03,0.6*s,6),c2,{p:[0,-B.limb*0.7,0.25],r:[Math.PI/2,0,0]}); R.add(hand,G_.cyl(0.14*s,0.14*s,0.3*s,12),c,{p:[0,-B.limb*0.7,0.55*s]}); break;
    case 'bellstaff': R.add(hand,G_.cyl(0.028,0.028,1.6,6),c2,{p:[0,-B.limb*0.7,0.2],r:[0.25,0,0]}); for(let i=0;i<4;i++) R.add(hand,G_.tor(0.06,0.012,4,10),c,{p:[(i-1.5)*0.05,0.62,0.4],r:[0.3,0,0]}); break;
    case 'lantern': R.add(hand,G_.lathe([[0.02,0.2],[0.15,0.14],[0.18,0],[0.15,-0.14],[0.02,-0.2]],12),0xFF6A2A,{p:[0,-B.limb*0.6-0.25,0.12],glow:true}); break;
    case 'gohei': R.add(hand,G_.cyl(0.02,0.02,0.7,5),0xC8A46E,{p:[0,-B.limb*0.6,0.2],r:[Math.PI/2-0.6,0,0]}); for(const sd of [1,-1]) R.add(hand,G_.box(0.06,0.25,0.01),0xFFFFFF,{p:[sd*0.05,-B.limb*0.6+0.3,0.42],r:[0,0,sd*0.3],ol:false}); break;
  }
}

function buildBack(R,sp,B){
  const K=sp.back; if(!K) return; const c=K.col||0x2A2433, c2=K.col2||shade(c,1.25);
  switch(K.kind){
    case 'wings': for(const sd of [1,-1]){ const w=R.bone('wing'+(sd>0?'L':'R'),'back',[sd*0.12,0.05,0]);
      const n=K.n||7, span=(K.span||1.3);
      for(let i=0;i<n;i++){ const t=i/(n-1), len=span*(0.55+0.45*Math.sin(t*Math.PI*0.9)), a=lerp(0.25,1.35,t);
        R.add(w,G_.leaf(0.13+0.06*(1-t),len,0.022),i%2?c:c2,{p:[sd*0.15*t,0.1*t,-0.05],r:[0,sd*0.25,sd*-a],grad:K.tip||shade(c2,1.2),gax:1.6});
        if(i<n-1) R.add(w,G_.leaf(0.1,len*0.6,0.022),shade(c,0.85),{p:[sd*0.12*t,0.1*t+0.05,-0.02],r:[0,sd*0.25,sd*-(a+0.12)],grad:c2}); }
      R.add(w,G_.cap(0.06,span*0.6),c,{p:[sd*span*0.28,span*0.12,-0.02],r:[0,0,sd*-1.2]}); } break;
    case 'tails': { const t=R.byName.tail, n=K.n||9, ts=STYLE==='anime'?0.72:1;
      for(let i=0;i<n;i++){ const a=n>1?(i/(n-1)-0.5)*2.6:0, L=(K.len||1.1)*ts;
        const crv=new T.CatmullRomCurve3([[0,0,0],[Math.sin(a)*L*0.25,0.15,-L*0.3],[Math.sin(a)*L*0.6,0.45+Math.cos(a)*0.2,-L*0.6],[Math.sin(a)*L*0.8,0.85+Math.cos(a)*0.3,-L*0.55]].map(p=>new T.Vector3(...p)));
        for(let k=0;k<11;k++){ const u=k/10, P=crv.getPointAt(u), rr=(0.08+0.15*Math.sin(Math.PI*Math.min(1,u*0.85+0.1)))*(K.fat||1)*ts;
          R.add(t,G_.sph(rr,rr,rr*1.2,10,6),k>=10?(K.tip||0xFFFFFF):(i%2?c:c2),{p:[P.x,P.y,P.z],grad:k===9?(K.tip||0xFFFFFF):null}); } } break; }
    case 'drums': R.add('back',G_.tor(0.75,0.04,6,32),c,{p:[0,0.25,-0.15]});
      for(let i=0;i<8;i++){ const a=i/8*TAU; R.add('back',G_.cyl(0.13,0.13,0.12,12),c2,{p:[Math.sin(a)*0.75,0.25+Math.cos(a)*0.75,-0.15],r:[Math.PI/2,0,0]}); R.add('back',G_.cyl(0.1,0.1,0.13,12),0xF5C542,{p:[Math.sin(a)*0.75,0.25+Math.cos(a)*0.75,-0.13],r:[Math.PI/2,0,0],ol:false}); } break;
    case 'shell': R.add('back',G_.sph(B.w*1.1,B.torso*0.6,B.w*0.6),c,{p:[0,-0.05,-0.05]}); for(let i=0;i<5;i++) R.add('back',G_.sph(0.08,0.08,0.03),c2,{p:[(i-2)*0.12,-0.05+(i%2)*0.1,B.w*0.15],ol:false}); break;
    case 'spiderlegs': for(let i=0;i<6;i++){ const sd=i%2?-1:1, k=Math.floor(i/2), up=0.5-k*0.25;
      R.add('back',G_.tube([[0,0,0],[sd*0.45,up+0.35,-0.25],[sd*0.95,up+0.25,-0.35],[sd*1.15,up-0.55,-0.25]],0.045,0.015,6,12),c,{p:[sd*0.08,0.0-k*0.08,0]}); } break;
    case 'quiver': R.add('back',G_.cyl(0.08,0.07,0.55,10),c,{p:[0.12,-0.05,-0.02],r:[0,0,-0.4]}); for(let i=0;i<4;i++) R.add('back',G_.cyl(0.008,0.008,0.25,3),0xF4F1EA,{p:[0.22+i*0.02,0.25,-0.02],r:[0,0,-0.4],ol:false}); break;
    case 'cape': { const L=K.len||1.45; R.add('back',G_.lathe([[0.3,0.12],[0.42,-0.3],[0.58,-L*0.7],[0.7,-L]],18,Math.PI*0.55,Math.PI*0.9),c,{p:[0,0,0.05],s:[1,1,0.55],grad:shade(c,0.6)});
      const hm=[]; for(let k=0;k<=16;k++){ const a=Math.PI*0.55+Math.PI*0.9*k/16; hm.push([Math.sin(a)*0.71,-L+0.01,Math.cos(a)*0.71*0.55+0.05]); } R.add('back',G_.tube(hm,0.022,0.022,4,32),K.col2||0xF5C542,{ol:false}); break; }
    case 'banners': for(const sd of [1,-1]){ R.add('back',G_.cyl(0.022,0.022,1.5,6),0x2A1E1E,{p:[sd*0.3,0.55,-0.16],r:[0,0,sd*-0.12]}); R.add('back',G_.box(0.32,0.03,0.03),0x2A1E1E,{p:[sd*0.3+sd*0.2,1.25,-0.16]});
      R.add('back',G_.box(0.28,0.7,0.02),c,{p:[sd*0.3+sd*0.2,0.9,-0.16],grad:shade(c,0.7)}); R.add('back',G_.cyl(0.09,0.09,0.012,16),K.col2||0xF5C542,{p:[sd*0.3+sd*0.2,1.0,-0.148],r:[Math.PI/2,0,0],glow:true});
      for(let k=0;k<3;k++) R.add('back',G_.tube([[0,0,0],[0.02,-0.1,0],[0,-0.2,0]],0.018,0.01,4,6),c,{p:[sd*0.3+sd*(0.1+k*0.1),0.55,-0.16]}); } break;
    case 'flames': { const fc=K.col||0xFF6A1F, ft=K.col2||0xFFE27A;
      for(let i=0;i<11;i++){ const u=i/10-0.5, x=u*1.2, L=0.55+0.4*Math.cos(u*2.6)+0.12*((i*7)%3)/2, w=Math.sin(i*2.3)*0.1;
        R.add('back',G_.tube([[x*0.75,-0.05,-0.12],[x*0.9+w,L*0.35,-0.16],[x*0.95-w*1.4,L*0.7,-0.18],[x*1.0+w*0.6-u*0.1,L,-0.2]],0.2,0.01,6,12),fc,{glow:true,grad:ft,gax:0.7}); }
      for(let i=0;i<7;i++){ const u=i/6-0.5, x=u*0.9, L=0.35+0.3*Math.cos(u*2.6), w=Math.cos(i*1.9)*0.07;
        R.add('back',G_.tube([[x*0.7,0,-0.08],[x*0.8-w,L*0.45,-0.1],[x*0.85+w,L,-0.12]],0.12,0.008,5,10),ft,{glow:true,grad:0xFFFFFF,gax:0.8}); } break; }
    case 'talismans': for(let i=0;i<5;i++){ const a=(i/4-0.5)*2.4, r=0.75+0.1*(i%2);
      R.add('back',G_.box(0.16,0.34,0.012),0xF4ECFF,{p:[Math.sin(a)*r,0.35+Math.cos(a)*0.45,-0.1+0.1*Math.cos(a)],r:[0,0,-a*0.3],glow:true,grad:K.col||0xB98CFF});
      R.add('back',G_.box(0.03,0.24,0.014),K.col||0x8E4FD6,{p:[Math.sin(a)*r,0.35+Math.cos(a)*0.45,-0.093+0.1*Math.cos(a)],r:[0,0,-a*0.3],glow:true}); } break;
    case 'sunflame': backSunflame(R,K,B,sp); break;
    case 'halo': { const hc=K.col2||0xFFE27A, hs=STYLE==='anime'?clamp(B.head/0.3,0.62,1):1; R.add('back',G_.tor(0.8*hs,0.04*hs,6,48),hc,{p:[0,0.6*hs,-0.1],glow:true}); R.add('back',G_.tor(0.62*hs,0.018,5,40),0xFFFFFF,{p:[0,0.6*hs,-0.1],glow:true});
      R.add('back',G_.cyl(0.79*hs,0.79*hs,0.012,40),shade(hc,0.9),{p:[0,0.6*hs,-0.13],r:[Math.PI/2,0,0],glow:true,grad:0xFFFFFF});
      for(let i=0;i<24;i++){ const a=i/24*TAU; R.add('back',G_.cone((i%2?0.035:0.05)*hs,(i%2?0.2:0.34)*hs,4),hc,{p:[Math.sin(a)*(0.95+(i%2?0:0.06))*hs,(0.6+Math.cos(a)*(0.95+(i%2?0:0.06)))*hs,-0.1],r:[0,0,-a],glow:true}); }
      for(let i=0;i<8;i++){ const a=i/8*TAU+0.2; R.add('back',G_.sph(0.045*hs),0xFFFFFF,{p:[Math.sin(a)*0.8*hs,(0.6+Math.cos(a)*0.8)*hs,-0.07],glow:true}); } break; }
    case 'planets': { const o=R.bone('orbit','chest',[0,0.4,0]); for(let i=0;i<5;i++){ const a=i/5*TAU; R.add(o,G_.sph(0.08+0.03*(i%3)),[0xF5C542,0x9FE6FF,0xFF8A4A,0xC58CFF,0xFFFFFF][i],{p:[Math.sin(a)*0.9,Math.cos(a*2)*0.15,Math.cos(a)*0.9],glow:true}); } R.add(o,G_.tor(0.9,0.008,3,48),0xFFFFFF,{r:[Math.PI/2,0,0],glow:true}); break; }
    case 'trees': for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.6; R.add('back',G_.cyl(0.02,0.03,0.4,5),0x6B4A2A,{p:[Math.sin(a)*0.35,0.2,-0.1]}); R.add('back',G_.cone(0.16,0.45,6),0x3F7A3A,{p:[Math.sin(a)*0.35,0.55,-0.1]}); } break;
    case 'clouds': for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.8, r=0.2+0.08*(i%2); R.add('back',G_.sph(r,r*0.8,r*0.7),c,{p:[Math.sin(a)*0.8,0.25+Math.cos(a)*0.45,-0.15-0.05*(i%2)],grad:c2});
      R.add('back',G_.tor(r*0.6,0.018,4,14,Math.PI*1.4),c2,{p:[Math.sin(a)*0.8,0.27+Math.cos(a)*0.45,-0.15+r*0.6],ol:false}); } break;
    case 'bag': R.add('back',G_.sph(0.45,0.35,0.3),c,{p:[0,0.35,-0.1]}); R.add('back',G_.tor(0.4,0.06,6,20),c2,{p:[0,0.35,-0.1],r:[0,0,Math.PI/2]}); break;
    case 'mirror': R.add('back',G_.cyl(0.6,0.6,0.05,32),0xC8D8E6,{p:[0,0.45,-0.12],r:[Math.PI/2,0,0],glow:true}); R.add('back',G_.tor(0.62,0.05,6,32),0xF5C542,{p:[0,0.45,-0.12]}); break;
    case 'serpents': for(let i=0;i<6;i++){ const a=(i/5-0.5)*2.4; R.add('back',G_.tube([[0,0,0],[Math.sin(a)*0.25,0.35,-0.1],[Math.sin(a)*0.45,0.7,0.05]],0.06,0.04,6,8),c,{p:[0,0.1,-0.05]}); R.add('back',G_.sph(0.09,0.07,0.12),c,{p:[Math.sin(a)*0.45,0.82,0.1]}); R.add('back',G_.sph(0.02),0xF5C542,{p:[Math.sin(a)*0.45+0.03,0.85,0.2],glow:true}); } break;
  }
}

/* creature eyes: white, coloured iris (glowing for spirits), slit pupil, highlight, heavy brow */
function creatureEye(R,bone,x,y,z,r,col,glow,ry,brow){
  const P=(dx,dy,dz)=>[x+dx*Math.cos(ry)+dz*Math.sin(ry),y+dy,z-dx*Math.sin(ry)+dz*Math.cos(ry)];
  R.add(bone,G_.sph(r*1.15,r*0.9,r*0.4,14,10),glow?shade(col,0.6):0xFFF8E8,{p:P(0,0,-r*0.1),r:[0,ry,0],ol:false,glow:!!glow});
  R.add(bone,G_.sph(r*0.85,r*0.82,r*0.38,14,10),col,{p:P(0,-r*0.03,-r*0.02),r:[0,ry,0],ol:false,glow:!!glow,grad:shade(col,glow?1.6:1.4)});
  R.add(bone,G_.sph(r*0.16,r*0.7,r*0.3,8,8),glow?0xFFFFFF:0x140C0C,{p:P(0,-r*0.03,r*0.06),r:[0,ry,0],ol:false,glow:!!glow});
  R.add(bone,G_.sph(r*0.22,r*0.18,r*0.15,8,6),0xFFFFFF,{p:P(-r*0.35,r*0.35,r*0.16),r:[0,ry,0],ol:false,glow:true});
  if(brow!==false) R.add(bone,G_.tube([P(-r*1.2,r*0.85,-r*0.1),P(0,r*1.25,0),P(r*1.3,r*1.0,-r*0.15)],r*0.22,r*0.08,5,8),brow||0x1A1418,{ol:false}); }
function furTufts(R,bone,n,pts,len,r,col,tip,dir){ for(let i=0;i<n;i++){ const p=pts(i), d=dir(i), L=len*(0.8+0.4*((i*7)%5)/4);
  R.add(bone,G_.tube([p,[p[0]+d[0]*L*0.5,p[1]+d[1]*L*0.5,p[2]+d[2]*L*0.5],[p[0]+d[0]*L,p[1]+d[1]*L-L*0.15,p[2]+d[2]*L]],r,r*0.12,5,6),col,{grad:tip}); } }

/* ================================================================ QUADRUPED (nue, kirin, raiju, baku, shachi) */
function buildQuad(sp){
  const R=new Rig(), L=sp.len||1.6, H=sp.height||0.85, W=sp.w||0.45, c=sp.col||0x8C6A3A, c2=sp.col2||shade(c,0.7), leg=sp.leg||0.11, belly=sp.belly||shade(c,1.25);
  R.bone('body','root',[0,H,0]); R.bone('front','body',[0,0.02,L*0.32]); R.bone('neck','front',[0,0.1,L*0.18]); R.bone('head','neck',[0,0.22,0.14]);
  R.bone('rear','body',[0,0,-L*0.3]);
  for(const [nm,par,z] of [['FL','front',0],['FR','front',0],['BL','rear',0],['BR','rear',0]]){ const sd=nm[1]==='L'?1:-1;
    R.bone('t'+nm,par,[sd*W*0.75,-0.05,z]); R.bone('k'+nm,'t'+nm,[0,-H*0.5,0]); R.bone('f'+nm,'k'+nm,[0,-H*0.45,0]); }
  R.bone('tail0','rear',[0,0.1,-L*0.2]); for(let i=1;i<5;i++) R.bone('tail'+i,'tail'+(i-1),[0,0.02,-0.22*(sp.tailLen||1)]);
  R.add('body',G_.sph(W,W*0.85,L*0.42,20,14),c,{grad:belly,gax:2});
  R.add('front',G_.sph(W*1.04,W*0.97,L*0.23,16,12),c,{p:[0,0.03,0],grad:belly,gax:2}); R.add('rear',G_.sph(W*1.0,W*0.92,L*0.23,16,12),c,{p:[0,0.03,0],grad:belly,gax:2});
  R.add('neck',G_.cap(W*0.48,0.25),c,{p:[0,0.08,0.02],r:[0.6,0,0],grad:belly});
  if(sp.stripes) for(let i=0;i<9;i++){ const z=(i-4)*L*0.085, sw=0.6+0.4*Math.sin(i*1.3);   /* curved tiger stripes over the back and down the flanks */
    for(const sd of [1,-1]) R.add('body',G_.tube([[0,W*0.86,z],[sd*W*0.55,W*0.68,z+0.04],[sd*W*0.9*sw,W*0.15,z-0.02],[sd*W*0.85*sw,-W*0.2,z+0.03]],0.035,0.008,4,10),c2,{ol:false}); }
  if(sp.scales) for(let i=0;i<12;i++) for(const sd of [1,-1]) R.add('body',G_.sph(0.07,0.055,0.03),sp.scales,{p:[sd*W*(0.55+0.15*(i%2)),W*0.55-((i%3)*0.08),(i-5.5)*L*0.065],r:[0,sd*0.9,0],ol:false});
  if(sp.scales) for(let i=0;i<10;i++) R.add('body',G_.cone(0.06,0.18,4),sp.scales,{p:[0,W*0.86,(i-4.5)*L*0.08],r:[-0.4,0,0]});
  /* fur: ruff on the chest, tufts on the shoulders, a ridge down the back */
  const fc=sp.mane||c;
  furTufts(R,'front',7,i=>[(i-3)*W*0.18,-W*0.35+(i%2)*0.06,W*0.7],W*0.32,W*0.12,fc,shade(fc,1.2),i=>[(i-3)*0.08,-0.9,0.35]);
  for(const sd of [1,-1]) furTufts(R,'front',4,i=>[sd*W*0.85,W*0.35-i*0.1,-i*0.05],W*0.45,W*0.12,fc,shade(fc,1.2),i=>[sd*0.7,-0.3,-0.5]);
  if(sp.mane) furTufts(R,'neck',10,i=>[(i%2?1:-1)*W*0.15,0.25-i*0.02,-0.05-i*0.05],W*0.85,W*0.18,sp.mane,sp.maneTip||shade(sp.mane,1.3),i=>[(i%2?1:-1)*0.35,0.35,-0.9]);
  /* legs, paws, claws */
  for(const nm of ['FL','FR','BL','BR']){ R.add('t'+nm,G_.cap(leg*1.35,H*0.42),c,{p:[0,-H*0.25,0],grad:belly}); R.add('k'+nm,G_.cap(leg*1.02,H*0.4),c,{p:[0,-H*0.22,0]});
    R.add('f'+nm,G_.sph(leg*1.35,leg*0.85,leg*1.6),sp.hoof||c,{p:[0,0.02,0.05],grad:shade(sp.hoof||c,0.8)});
    if(!sp.hoof) for(let k=-1;k<=1;k++) R.add('f'+nm,G_.cone(leg*0.18,leg*0.6,4),0xF2EAD8,{p:[k*leg*0.55,-0.02,leg*1.55],r:[Math.PI/2,0,0]});
    if(sp.legFire) for(let k=0;k<3;k++) R.add('k'+nm,G_.tube([[0,0,0],[(k-1)*0.05,-0.12,-0.12],[(k-1)*0.08,0.05,-0.3]],leg*0.9,leg*0.08,5,8),sp.legFire,{p:[0,-H*0.32,-0.02],glow:true,grad:0xFFFFFF}); }
  /* shoulders and haunches */
  for(const sd of [1,-1]){ R.add('front',G_.sph(W*0.42,W*0.6,W*0.48),c,{p:[sd*W*0.62,-0.05,0.02],grad:belly}); R.add('rear',G_.sph(W*0.44,W*0.62,W*0.52),c,{p:[sd*W*0.6,-0.02,-0.02],grad:belly}); }
  /* head */
  const hk0=sp.headKind||'beast';
  if(hk0==='tiger'||hk0==='lion'||hk0==='monkey'||hk0==='beast') beastHead(R,'head',sp.headR||W*0.84,sp,hk0==='beast'?'lion':hk0);
  else if(hk0==='dragon'||hk0==='deer') dragonHead(R,'head',sp.headR||W*0.72,Object.assign({},sp,{headCol:sp.headCol||c,col2:sp.muzzle||shade(sp.headCol||c,1.2)}),false);
  else {
  /* head */
    const hc=sp.headCol||c, hk=sp.headKind||'beast', hr=sp.headR||W*0.66;
    R.add('head',G_.sph(hr,hr*0.95,hr*1.05,18,14),hc,{grad:shade(hc,0.85)});
    const snoutLen=hk==='elephant'?0:hk==='monkey'?0.3:hk==='deer'?1.2:hk==='tiger'?0.7:1.0;
    if(snoutLen){ R.add('head',G_.sph(hr*0.56,hr*0.46,hr*0.62*snoutLen),sp.muzzle||shade(hc,hk==='monkey'?1.3:1.05),{p:[0,-hr*0.25,hr*0.75],grad:sp.muzzle?shade(sp.muzzle,0.9):null});
      R.add('head',G_.sph(hr*0.42,hr*0.2,hr*0.5*snoutLen),shade(sp.muzzle||hc,0.9),{p:[0,-hr*0.52,hr*0.62]}); }
    R.add('head',G_.sph(hr*0.15,hr*0.1,hr*0.09),INK,{p:[0,-hr*0.12,hr*(0.75+0.58*snoutLen)],ol:false});
    for(const sd of [1,-1]){ creatureEye(R,'head',sd*hr*0.44,hr*0.18,hr*0.8,hr*0.19,sp.eyeCol||0xF5C542,!!sp.eyeGlow,sd*0.45,shade(hc,0.55));
      if(hk!=='elephant'){ R.add('head',G_.cone(hr*0.3,hr*0.75,6),hc,{p:[sd*hr*0.56,hr*0.88,-hr*0.1],r:[0,0,sd*-0.35],grad:shade(hc,0.8)});
        R.add('head',G_.cone(hr*0.17,hr*0.5,6),sp.earIn||0xF2B8B0,{p:[sd*hr*0.54,hr*0.84,-hr*0.02],r:[0,0,sd*-0.35],ol:false}); }
      furTufts(R,'head',3,i=>[sd*hr*0.85,-hr*0.05-i*hr*0.18,hr*0.15],hr*0.45,hr*0.12,sp.cheek||hc,shade(sp.cheek||hc,1.25),i=>[sd*0.9,-0.2,-0.3]); }
    if(hk==='elephant'){ R.add('head',G_.tube([[0,0,0],[0,-hr*0.6,hr*0.4],[0,-hr*1.3,hr*0.5],[0,-hr*1.6,hr*0.9]],hr*0.34,hr*0.16,9,16),hc,{p:[0,-hr*0.1,hr*0.8],grad:shade(hc,0.8)});
      for(let k=0;k<6;k++) R.add('head',G_.tor(hr*(0.3-k*0.025),hr*0.02,4,14),shade(hc,0.75),{p:[0,-hr*(0.25+k*0.22),hr*(1.15+k*0.05)],r:[1.2-k*0.1,0,0],ol:false});
      for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.75,hr*0.85,hr*0.12),shade(hc,0.9),{p:[sd*hr*0.98,0,-hr*0.1],r:[0,sd*0.4,0],grad:sp.earIn||0xB98CFF}); R.add('head',G_.cone(hr*0.11,hr*0.7,8),0xFFF4E0,{p:[sd*hr*0.35,-hr*0.62,hr*0.95],r:[2.3,0,sd*0.25]}); } }
    if(hk==='monkey'){ R.add('head',G_.sph(hr*0.72,hr*0.62,hr*0.3),sp.muzzle||0xD98A6A,{p:[0,-hr*0.05,hr*0.82],grad:shade(sp.muzzle||0xD98A6A,0.85)});
      furTufts(R,'head',14,i=>{ const a=i/14*TAU; return [Math.sin(a)*hr*0.95,Math.cos(a)*hr*0.9,-hr*0.15]; },hr*0.8,hr*0.2,sp.mane||c,shade(sp.mane||c,1.3),i=>{ const a=i/14*TAU; return [Math.sin(a)*0.8,Math.cos(a)*0.8,-0.4]; }); }
    if(hk==='tiger') for(let i=0;i<4;i++) R.add('head',G_.tube([[-hr*0.3,hr*(0.75-i*0.12),hr*0.75],[0,hr*(0.6-i*0.12),hr*0.95],[hr*0.3,hr*(0.75-i*0.12),hr*0.75]],0.025,0.01,4,8),c2,{ol:false});
    if(sp.antlers) for(const sd of [1,-1]){ R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.6,-hr*0.2],[sd*hr*0.8,hr*1.2,-hr*0.5],[sd*hr*0.7,hr*1.8,-hr*0.8]],hr*0.11,hr*0.04,6,12),sp.antlers,{p:[sd*hr*0.3,hr*0.75,0],glow:!!sp.antlerGlow,grad:shade(sp.antlers,0.8)});
      R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.25,hr*0.15],[sd*hr*0.6,hr*0.4,hr*0.25]],hr*0.07,hr*0.03,5,8),sp.antlers,{p:[sd*hr*0.65,hr*1.45,-hr*0.35],glow:!!sp.antlerGlow}); }
    if(sp.whiskers) for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.6,-hr*0.1,hr*0.2],[sd*hr*1.3,-hr*0.5,hr*0.1],[sd*hr*1.8,-hr*0.25,-hr*0.35]],0.03,0.008,5,14),sp.whiskers,{p:[sd*hr*0.3,-hr*0.3,hr*1.3],glow:true});
    if(sp.fangs) for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.08,hr*0.32,5),0xFFFFFF,{p:[sd*hr*0.2,-hr*0.6,hr*1.2],r:[Math.PI,0,0],ol:false});
  }
  /* tail */
  const tk=sp.tail||'fluffy', tc=sp.tailCol||c;
  for(let i=0;i<5;i++){ const r=tk==='snake'?0.1*(1-i*0.12):tk==='fluffy'?0.13+0.035*i:tk==='fish'?0.13-0.015*i:0.08*(1-i*0.12);
    R.add('tail'+i,G_.sph(r,r,0.16*(sp.tailLen||1)),tc,{p:[0,0,-0.11*(sp.tailLen||1)],grad:tk==='fluffy'&&i>2?(sp.tailTip||shade(tc,1.35)):null});
    if(tk==='fluffy') furTufts(R,'tail'+i,3,k=>[(k-1)*r*0.6,r*0.5,-0.05],r*1.4,r*0.35,tc,sp.tailTip||shade(tc,1.35),k=>[(k-1)*0.5,0.4,-0.6]);
    if(tk==='lightning'&&i%2) R.add('tail'+i,G_.shape([[0,0],[0.08,0.14],[0.02,0.14],[0.1,0.3],[-0.04,0.1],[0.02,0.1]],0.03,0.004),0xFFF27A,{p:[0,0.12,-0.1],glow:true});
    if(tk==='fish') for(const sd of [1,-1]) R.add('tail'+i,G_.sph(0.05,0.04,0.02),sp.scales||shade(tc,0.8),{p:[sd*r*0.8,0,-0.08],r:[0,sd*1.2,0],ol:false}); }
  if(tk==='snake'){ R.add('tail4',G_.sph(0.13,0.1,0.2),tc,{p:[0,0.02,-0.27]}); for(const sd of [1,-1]) creatureEye(R,'tail4',sd*0.06,0.08,-0.38,0.035,0xF5C542,true,Math.PI+sd*0.4,false);
    R.add('tail4',G_.cone(0.02,0.08,4),0xFFFFFF,{p:[0.04,-0.04,-0.42],r:[Math.PI,0,0],ol:false}); R.add('tail4',G_.cone(0.02,0.08,4),0xFFFFFF,{p:[-0.04,-0.04,-0.42],r:[Math.PI,0,0],ol:false}); }
  if(tk==='fish') R.add('tail4',G_.shape([[0,0],[0.42,0.38],[0.18,0],[0.42,-0.38]],0.03,0.005),sp.finCol||0xF5C542,{p:[0,0,-0.25],r:[0,Math.PI/2,0],grad:shade(sp.finCol||0xF5C542,0.7)});
  if(sp.fins) for(const sd of [1,-1]) R.add('body',G_.shape([[0,0],[0.35,0.15],[0.5,-0.1],[0.2,-0.08]],0.025,0.005),sp.finCol||0xF5C542,{p:[sd*W*0.8,W*0.3,-L*0.05],r:[0,sd*-Math.PI/2,0.3],grad:shade(sp.finCol||0xF5C542,0.7)});
  if(sp.extra) sp.extra(R,{L,H,W,hr:sp.headR||W*0.8},G_);
  return {rig:R,kind:'quad'};
}

/* ================================================================ SERPENT (orochi, kuzuryu, ryujin) — coiled body with N dragon necks */
function buildSerpent(sp){
  const R=new Rig(), n=sp.heads||1, c=sp.col||0x3F7A3A, c2=sp.col2||shade(c,1.3), seg=sp.seg||6, r0=sp.r||0.2, bel=sp.belly||0xE8D8A8;
  R.bone('coil','root',[0,0.3,0]);
  R.add('coil',G_.tor(0.72,0.3,12,32),c,{r:[Math.PI/2,0,0],grad:shade(c,0.75)}); R.add('coil',G_.tor(0.46,0.25,12,28),shade(c,0.95),{p:[0,0.34,0],r:[Math.PI/2,0,0.3],grad:shade(c,0.75)});
  R.add('coil',G_.sph(0.5,0.42,0.5),c,{p:[0,0.47,0]});
  for(let i=0;i<20;i++){ const a=i/20*TAU; R.add('coil',G_.sph(0.16,0.07,0.04),bel,{p:[Math.sin(a)*1.0,0.02,Math.cos(a)*1.0],r:[0,a,0],ol:false});   /* belly plates and dorsal spines on the coil */
    if(sp.spines) R.add('coil',G_.cone(0.05,0.17,4),sp.spines,{p:[Math.sin(a)*0.72,0.3,Math.cos(a)*0.72],r:[0,0,0]}); }
  for(let h=0;h<n;h++){ const a=n===1?0:(h/(n-1)-0.5)*Math.min(2.6,0.45*n), base='n'+h+'_';
    R.bone(base+0,'coil',[Math.sin(a)*0.35,0.6,Math.cos(a)*0.2]);
    for(let i=1;i<seg;i++){ const lift=0.28*(sp.neck||1); R.bone(base+i,base+(i-1),[Math.sin(a)*0.12*(i<3?1:0.3),lift,0.03+0.04*i]); }
    for(let i=0;i<seg;i++){ const r=r0*(1-i/seg*0.35);
      R.add(base+i,G_.sph(r,0.21,r*1.05,14,8),c,{p:[0,0.12,0],grad:shade(c,0.8)});
      R.add(base+i,G_.sph(r*0.72,0.17,r*0.42),bel,{p:[0,0.12,r*0.7],ol:false,grad:shade(bel,0.85)});
      R.add(base+i,G_.tor(r*0.98,0.012,4,16),shade(c,0.65),{p:[0,0.03,0],r:[Math.PI/2,0,0],ol:false});
      if(sp.spines) R.add(base+i,G_.cone(r*0.35,r*1.1,4),sp.spines,{p:[0,0.15,-r*0.85],r:[-0.6,0,0]});
      if(sp.mane&&i>seg-3&&n<=3) furTufts(R,base+i,3,k=>[(k-1)*r*0.5,0.15,-r*0.8],r*2.2,r*0.35,sp.mane,shade(sp.mane,1.25),k=>[(k-1)*0.4,0.1,-0.9]); }
    const hb=R.bone(base+'H',base+(seg-1),[0,0.24,0.05]), hr=r0*1.3;
    /* dragon head: skull, long upper snout, open lower jaw with teeth, nostrils, brow ridges, horns, whiskers, mane */
    R.add(hb,G_.sph(hr,hr*0.78,hr*1.1,16,12),c,{p:[0,0,hr*0.1],grad:shade(c,0.8)});
    R.add(hb,G_.sph(hr*0.66,hr*0.42,hr*1.05,14,10),c2,{p:[0,-hr*0.05,hr*0.95],grad:c});
    R.add(hb,G_.sph(hr*0.58,hr*0.22,hr*0.95,12,8),bel,{p:[0,-hr*0.48,hr*0.75],r:[0.22,0,0],grad:shade(bel,0.85)});
    R.add(hb,G_.sph(hr*0.5,hr*0.08,hr*0.8,10,6),0x8C2A2A,{p:[0,-hr*0.32,hr*0.85],r:[0.12,0,0],ol:false});
    for(let k=0;k<(n>3?3:5);k++) for(const sd of [1,-1]){ R.add(hb,G_.cone(hr*0.06,hr*0.2,4),0xFFFFFF,{p:[sd*hr*(0.42-k*0.03),-hr*0.2,hr*(0.6+k*0.2)],r:[Math.PI,0,0],ol:false}); }
    for(const sd of [1,-1]){ R.add(hb,G_.sph(hr*0.07,hr*0.05,hr*0.04),INK,{p:[sd*hr*0.2,hr*0.12,hr*1.9],ol:false});
      creatureEye(R,hb,sd*hr*0.52,hr*0.32,hr*0.72,hr*0.2,sp.eyeCol||0xFF3A2A,true,sd*0.6,shade(c,0.55));
      if(sp.horns) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.3,hr*0.5,-hr*0.4],[sd*hr*0.45,hr*1.05,-hr*1.05],[sd*hr*0.35,hr*1.5,-hr*1.5]],hr*0.16,hr*0.035,6,12),sp.horns,{p:[sd*hr*0.4,hr*0.45,0],grad:shade(sp.horns,0.75)});
      if(sp.whiskers) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.5,0,hr*0.4],[sd*hr*1.2,-hr*0.3,hr*0.2],[sd*hr*1.8,-hr*0.65,-hr*0.5]],0.032,0.008,5,14),sp.whiskers,{p:[sd*hr*0.3,-hr*0.1,hr*1.7],glow:true});
      R.add(hb,G_.cone(hr*0.18,hr*0.6,5),c2,{p:[sd*hr*0.85,-hr*0.2,-hr*0.2],r:[0,0,sd*-1.6],grad:shade(c2,0.7)}); }
    if(sp.mane) furTufts(R,hb,n>3?5:8,k=>[(k-3.5)*hr*0.22,hr*0.5,-hr*0.45],hr*1.1,hr*0.18,sp.mane,shade(sp.mane,1.3),k=>[(k-3.5)*0.15,0.2,-1]);
    if(sp.crown) R.add(hb,G_.cone(hr*0.3,hr*0.9,6),sp.crown,{p:[0,hr*0.8,0],r:[-0.3,0,0]}); }
  if(sp.orb){ R.bone('orbB','coil',[0,1.3,0.9]); R.add('orbB',G_.sph(0.28),sp.orb,{glow:true,grad:0xFFFFFF}); R.add('orbB',G_.tor(0.34,0.02,5,24),0xFFFFFF,{glow:true}); }
  if(sp.legs) for(const sd of [1,-1]) for(const z of [0.35,-0.35]){ R.add('coil',G_.cap(0.08,0.3),c,{p:[sd*0.78,0.1,z],r:[0,0,sd*0.8]}); for(let k=0;k<3;k++) R.add('coil',G_.cone(0.03,0.13,4),0xF5C542,{p:[sd*0.98,-0.05,z+(k-1)*0.06],r:[Math.PI,0,0]}); }
  if(sp.waves) for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('coil',G_.tube([[0,0,0],[Math.sin(a)*0.2,0.2,Math.cos(a)*0.2],[Math.sin(a)*0.35,0.05,Math.cos(a)*0.35]],0.09,0.02,5,8),sp.waves,{p:[Math.sin(a)*0.95,-0.22,Math.cos(a)*0.95],glow:true,grad:0xFFFFFF}); }
  return {rig:R,kind:'serpent',heads:n,seg};
}

/* ================================================================ SPIDER (tsuchigumo) */
function buildSpider(sp){
  const R=new Rig(), c=sp.col||0x3A2A55, c2=sp.col2||0x6A4E8C, H=0.85;
  R.bone('body','root',[0,H,0]); R.bone('abd','body',[0,0.15,-0.55]); R.bone('head','body',[0,0.05,0.55]);
  R.add('body',G_.sph(0.55,0.42,0.6,18,12),c,{grad:shade(c,0.7)}); R.add('abd',G_.sph(0.88,0.74,0.98,20,14),c,{p:[0,0.15,-0.35],grad:shade(c,0.65)});
  for(let i=0;i<8;i++){ const a=i/8*TAU;   /* a web pattern spread over the abdomen */
    R.add('abd',G_.tube([[0,0.88,-0.35],[Math.sin(a)*0.45,0.75,-0.35+Math.cos(a)*0.5],[Math.sin(a)*0.75,0.35,-0.35+Math.cos(a)*0.82]],0.014,0.008,4,10),c2,{ol:false}); }
  for(let k=1;k<4;k++){ const pts=[]; for(let i=0;i<=24;i++){ const a=i/24*TAU, rr=k*0.22; pts.push([Math.sin(a)*rr*(k<3?1:0.95),0.88-k*k*0.06,-0.35+Math.cos(a)*rr*1.1]); } R.add('abd',G_.tube(pts,0.012,0.012,4,48),c2,{ol:false}); }
  R.add('abd',G_.sph(0.2,0.1,0.25),sp.mark||0xD8342C,{p:[0,0.82,-0.85],r:[-0.8,0,0],glow:true});
  R.add('head',G_.sph(0.44,0.37,0.44),c,{p:[0,0.05,0.15],grad:shade(c,0.7)});
  for(let i=0;i<8;i++){ const row=Math.floor(i/4), col=i%4, r=row?0.06:0.085; R.add('head',G_.sph(r),sp.eyeCol||0xFF2A2A,{p:[(col-1.5)*0.15,0.2+row*0.13-((col===0||col===3)?0.05:0),0.5],glow:true,grad:0xFFFFFF}); }
  for(const sd of [1,-1]){ R.add('head',G_.tube([[0,0,0],[sd*0.04,-0.15,0.1],[-sd*0.02,-0.32,0.05]],0.06,0.015,6,8),0xEDE6D6,{p:[sd*0.13,-0.15,0.5],grad:0xB8A890}); }
  for(let i=0;i<8;i++){ const sd=i%2?-1:1, k=Math.floor(i/2), z=0.35-k*0.25, nm='L'+i;
    R.bone(nm+'a','body',[sd*0.45,0.05,z]); R.bone(nm+'b',nm+'a',[sd*0.6,0.45,0]); R.bone(nm+'c',nm+'b',[sd*0.45,-0.25,0]);
    R.add(nm+'a',G_.tube([[0,0,0],[sd*0.6,0.45,0]],0.08,0.065,6,4),c,{grad:shade(c,0.75)}); R.add(nm+'b',G_.tube([[0,0,0],[sd*0.45,-0.25,0]],0.065,0.05,6,4),c,{});
    R.add(nm+'b',G_.tor(0.065,0.014,4,10),c2,{p:[0,0,0],r:[0,Math.PI/2,0],ol:false});
    R.add(nm+'c',G_.tube([[0,0,0],[sd*0.2,-0.6,0],[sd*0.25,-1.0,0]],0.055,0.012,6,8),c2,{grad:sp.tip||0x14101A});
    for(let s=0;s<3;s++) R.add(nm+'b',G_.cone(0.016,0.12,4),c2,{p:[sd*0.15*(s+1),0.25-s*0.08,0.04],r:[0,0,sd*-1.0],ol:false}); }
  return {rig:R,kind:'spider'};
}

/* ================================================================ BLOB (umibozu) — a towering dark sea spectre */
function buildBlob(sp){
  const R=new Rig(), c=sp.col||0x1A2A4A, c2=sp.col2||0x4E8CC8;
  R.bone('b0','root',[0,0.4,0]); R.bone('b1','b0',[0,0.55,0]); R.bone('b2','b1',[0,0.5,0]); R.bone('b3','b2',[0,0.45,0]);
  R.add('b0',G_.sph(0.98,0.52,0.98,20,12),c,{grad:shade(c,0.7)}); R.add('b1',G_.sph(0.8,0.57,0.77,20,12),c,{grad:shade(c,0.8)}); R.add('b2',G_.sph(0.64,0.52,0.62,18,10),c,{}); R.add('b3',G_.sph(0.56,0.58,0.53,18,12),c,{grad:shade(c,0.8)});
  for(const sd of [1,-1]){ R.add('b3',G_.sph(0.19,0.24,0.08),0xEAF6FF,{p:[sd*0.21,0.06,0.48],glow:true,grad:0x9FE6FF}); R.add('b3',G_.sph(0.08,0.11,0.06),0xFFFFFF,{p:[sd*0.21,0.07,0.54],glow:true});
    R.add('b3',G_.tor(0.24,0.02,4,16),0x9FE6FF,{p:[sd*0.21,0.06,0.46],glow:true}); }
  for(let i=0;i<14;i++){ const a=i/14*TAU, L=0.4+0.25*(i%3);   /* dripping streams running down the body */
    R.add('b1',G_.tube([[Math.sin(a)*0.76,0.15,Math.cos(a)*0.73],[Math.sin(a)*0.84,-0.25,Math.cos(a)*0.8],[Math.sin(a)*0.9,-0.35-L,Math.cos(a)*0.86]],0.07,0.02,5,8),c,{grad:c2});
    R.add('b1',G_.sph(0.035,0.06,0.035),c2,{p:[Math.sin(a)*0.9,-0.4-L,Math.cos(a)*0.86],glow:true}); }
  for(let i=0;i<16;i++){ const a=i/16*TAU; R.add('b0',G_.tube([[0,0,0],[Math.sin(a)*0.25,0.25,Math.cos(a)*0.25],[Math.sin(a)*0.45,0.1,Math.cos(a)*0.45]],0.09,0.02,5,8),0xDCF4FF,{p:[Math.sin(a)*0.95,-0.4,Math.cos(a)*0.95],glow:true,grad:c2}); }
  for(const sd of [1,-1]){ R.bone('arm'+(sd>0?'L':'R'),'b1',[sd*0.7,0.2,0]); R.add('arm'+(sd>0?'L':'R'),G_.tube([[0,0,0],[sd*0.3,-0.3,0.2],[sd*0.45,-0.8,0.3]],0.22,0.08,8,12),c,{grad:c2}); }
  return {rig:R,kind:'blob'};
}

/* ================================================================ FISH (namazu) — giant catfish with a mossy boulder on its back */
function buildTigerFish(sp){   /* shachihoko: a tiger's head on a golden, scaled carp body arching out of the waves */
  const R=new Rig(), c=sp.col||0xF5B820, sc=sp.scales||0xE8A010, fin=sp.finCol||0x1E3A5A, edge=0xF5C542;
  R.bone('f0','root',[0,0.95,0.3]); R.bone('f1','f0',[0,0.08,-0.55]); R.bone('f2','f1',[0,0.25,-0.42]); R.bone('f3','f2',[0,0.32,-0.25]); R.bone('fh','f0',[0,0.15,0.5]);
  const segs=[['f0',0.62],['f1',0.54],['f2',0.42],['f3',0.3]];
  for(const [b,r] of segs){ R.add(b,G_.sph(r,r*0.95,r*1.05,18,12),c,{grad:sp.belly||0xFFF0C8,gax:2.2});
    for(let row=0;row<3;row++) for(let k=0;k<12;k++){ const a=k/12*TAU, y=r*(row-1)*0.45, rr=r*Math.sqrt(1-(y/r)**2)*1.0;
      R.add(b,G_.sph(r*0.2,r*0.16,r*0.05,8,6),sc,{p:[Math.sin(a)*rr,y,Math.cos(a)*rr*1.05],r:[0,a,0],grad:edge,ol:false}); } }
  for(const [b,y,z,L] of [['f1',0.5,0,0.5],['f2',0.4,0,0.4]]) R.add(b,G_.shape([[0,0],[0.1,L],[0.35,L*0.85],[0.5,L*0.3],[0.55,0]],0.025,0.005),fin,{p:[0,y,z+0.25],r:[0,Math.PI/2,0],grad:edge});
  for(const sd of [1,-1]){ R.add('f0',G_.shape([[0,0],[0.25,0.4],[0.6,0.45],[0.75,0.15],[0.4,-0.05]],0.025,0.005),fin,{p:[sd*0.55,-0.2,0.05],r:[0,sd*-1.2,sd*-0.5],grad:edge});
    R.add('f1',G_.shape([[0,0],[0.2,0.25],[0.45,0.2],[0.3,-0.05]],0.02,0.004),fin,{p:[sd*0.45,-0.3,0],r:[0,sd*-1.3,sd*-0.8],grad:edge}); }
  R.add('f3',G_.shape([[0,0],[0.35,0.55],[0.75,0.9],[0.55,0.3],[0.85,0.05],[0.5,-0.15],[0.75,-0.55],[0.3,-0.25]],0.03,0.006),fin,{p:[0,0.05,-0.15],r:[0,Math.PI/2,0.5],grad:edge});
  beastHead(R,'fh',0.52,{headCol:c,muzzle:0xFFF4C8,col2:0x2A1E14,eyeCol:sp.eyeCol||0x6FE36F,mane:0xFFF4E0,earIn:0xF2C8C0},'tiger');
  for(let i=0;i<14;i++){ const a=i/14*TAU; R.add('f0',G_.tube([[0,0,0],[Math.sin(a)*0.2,0.25,Math.cos(a)*0.2],[Math.sin(a)*0.4,0.05,Math.cos(a)*0.4]],0.09,0.02,5,8),0x6FC8F0,{p:[Math.sin(a)*0.75,-0.75,Math.cos(a)*0.75-0.2],glow:true,grad:0xFFFFFF}); }
  return {rig:R,kind:'fish'};
}
function buildFish(sp){ if(sp.tigerHead) return buildTigerFish(sp);
  const R=new Rig(), c=sp.col||0x3E4A5A, c2=sp.col2||0xD8C8A8;
  R.bone('f0','root',[0,0.75,0.4]); R.bone('f1','f0',[0,0,-0.6]); R.bone('f2','f1',[0,0,-0.55]); R.bone('f3','f2',[0,0,-0.5]);
  R.add('f0',G_.sph(0.82,0.64,0.77,20,14),c,{p:[0,0,0.1],grad:c2,gax:2.2}); R.add('f0',G_.sph(0.72,0.36,0.62),c2,{p:[0,-0.35,0.2],ol:false,grad:shade(c2,0.85)});
  R.add('f0',G_.tube([[-0.55,-0.08,0.72],[0,-0.22,0.92],[0.55,-0.08,0.72]],0.06,0.06,6,14),0x2A1E1E,{ol:false}); R.add('f0',G_.tube([[-0.45,-0.12,0.74],[0,-0.24,0.9],[0.45,-0.12,0.74]],0.035,0.035,5,12),0xC86A6A,{ol:false});
  for(const sd of [1,-1]){ creatureEye(R,'f0',sd*0.46,0.24,0.66,0.13,sp.eyeCol||0xF5C542,false,sd*0.55,shade(c,0.5));
    R.add('f0',G_.tube([[0,0,0],[sd*0.35,-0.05,0.25],[sd*0.75,-0.35,0.25],[sd*1.05,-0.6,-0.05],[sd*1.15,-0.5,-0.35]],0.05,0.012,6,18),0xEDE6D6,{p:[sd*0.45,-0.05,0.8],grad:0xB8B0A0});
    R.add('f1',G_.shape([[0,0],[0.55,-0.28],[0.28,0.06]],0.03,0.005),c,{p:[sd*0.66,-0.2,0.1],r:[0,sd*0.3,sd*-0.4],grad:shade(c,0.7)}); }
  for(let i=0;i<16;i++){ const a=i/16*TAU; R.add('f0',G_.sph(0.06,0.04,0.02),shade(c,0.75),{p:[Math.sin(a)*0.6,0.35+Math.cos(a)*0.1,Math.cos(a)*0.5-0.1],r:[0,a,0],ol:false}); }
  R.add('f1',G_.sph(0.72,0.56,0.56),c,{grad:c2,gax:2.2}); R.add('f2',G_.sph(0.56,0.46,0.5),c,{grad:c2,gax:2.2}); R.add('f3',G_.sph(0.4,0.33,0.4),c,{});
  R.add('f3',G_.shape([[0,0],[0.55,0.5],[0.28,0],[0.55,-0.45]],0.04,0.006),c,{p:[0,0,-0.35],r:[0,Math.PI/2,0],grad:shade(c,0.65)});
  if(sp.moss){ const g=G_.sph(0.55,0.42,0.48,9,7), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), k=1+0.15*Math.sin(x*9.1+z*6.7)+0.1*Math.sin(y*11.3); p.setXYZ(i,x*k,y*k,z*k); } g.computeVertexNormals();
    R.add('f1',g,0x8E8A84,{p:[0,0.62,0.05],grad:0x5E5A54}); R.add('f1',G_.sph(0.5,0.18,0.44,10,6),sp.moss,{p:[-0.02,0.95,0.02],grad:shade(sp.moss,0.75)});
    for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('f0',G_.sph(0.2,0.08,0.2),sp.moss,{p:[Math.sin(a)*0.38,0.6,Math.cos(a)*0.3-0.05],grad:shade(sp.moss,0.8)}); }
    R.add('f1',G_.box(0.14,0.22,0.02),0xF4F1EA,{p:[0.1,0.7,0.5],r:[0,0.2,0.1],ol:false}); R.add('f1',G_.box(0.03,0.16,0.022),0xD8342C,{p:[0.1,0.7,0.51],r:[0,0.2,0.1],ol:false});
    R.add('f1',G_.tor(0.5,0.03,6,24),0xF2EAD8,{p:[0,0.62,0.05],r:[Math.PI/2,0,0]}); }
  return {rig:R,kind:'fish'};
}

/* ================================================================ character registry */
const DEFS={};
const def=(k,s)=>{ DEFS[k]=s; s.key=k; };
/* compact design list for all 70 heroes and bosses, drawn from their painted portraits */
const HORN=0xF2DEA0, BLK=0x1C1C22, WHT=0xF4F1EA, GLD=0xF5C542, RED=0xC8342C;
def('hero',    {type:'human',build:'chibi',skin:0xF6D2B0,hair:{style:'spiky',col:0x22305E,col2:0x2E4280,tip:0x4A62B0},hat:{kind:'none'},extra:(R,B)=>{ R.add('head',G_.tor(B.head*1.02,B.head*0.09,6,24),0xD8342C,{p:[0,B.head*1.25,0],r:[Math.PI/2+0.15,0,0]}); for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*0.1,-0.05,-0.12],[sd*0.22,-0.18,-0.32],[sd*0.3,-0.12,-0.5]],0.035,0.02,5,10),0xD8342C,{p:[sd*0.04,B.head*1.2,-B.head*0.95],grad:0xA81E18}); },
  outfit:{kind:'hakama',col:0x22305E,top:0xF4F1EA,collar:0x22305E,trim:0x2E4280,belt:0xD8342C,mon:0x22305E,lining:0x22305E},weapon:{kind:'bow',col2:0x3A2418},back:{kind:'quiver',col:0x6B3A1E},eyes:{col:0x8A5A1A}});
def('samurai', {type:'human',build:'chibi',skin:0xF6D2B0,hair:{style:'short',col:0x1C1C22},hat:{kind:'kabuto',col:0x1E3A3A,col2:GLD,crest:'crescent',lace:0x2D7F8A},outfit:{kind:'armor',col:0x2D7F8A,lace:0x2D8A7A,trim:GLD,plate:0x1E3A3A,sleeve:0x1E2C2C,legs:0x1E2C2C},weapon:{kind:'katana'},eyes:{col:0x6B3A1E,fierce:true}});
def('onmyoji', {type:'human',build:'chibi',skin:0xF8E4D2,hair:{style:'long',col:0xE6E6EE,col2:0xC8C8D6,len:1.9,strands:10},hat:{kind:'eboshi',col:0x1E1E24},outfit:{kind:'robe',col:0xF4F1EA,inner:0x6E3FB0,trim:0x8E4FD6,belt:0x6E3FB0,pattern:0x8E4FD6},weapon:{kind:'talisman'},eyes:{col:0x6E3FB0},back:{kind:'talismans',col:0x8E4FD6}});
def('ninja',   {type:'human',build:'chibi',hair:{style:'hood',col:0x2A2433,col2:0x3A3248,mask:0x2A2433},outfit:{kind:'ninja',col:0x2A2433,col2:0x1E1A26,belt:0x6E4FA0,glove:0x2A2433,shoe:0x1E1A26},scarf:0x8E4FD6,weapon:{kind:'dagger',off:{kind:'dagger'}},eyes:{col:0x3A2A1E}});
def('tengu',   {type:'human',build:'normal',head:'bird',skin:0x1E1E2A,beakCol:0xF09A2A,crestCol:0x2A2A3A,eyes:{col:0xD8342C,glow:true},hat:{kind:'tokin',col:BLK},outfit:{kind:'robe',col:0x5A3A9C,inner:0x2A1E55,trim:GLD,belt:GLD,pattern:GLD},beads:0xF4F1EA,weapon:{kind:'bellstaff',col:GLD,col2:0xC8A040},back:{kind:'wings',col:0x1E1E2A,col2:0x3A3A4E,span:1.5,tip:0x5A5A70}});
def('kitsune', {type:'human',build:'chibi',skin:0xFBE6D6,hair:{style:'long',col:0xF4F4F8,col2:0xE0E0EA,tip:0xFFFFFF,len:3.2},ears:'fox',earCol:0xF4F4F8,outfit:{kind:'kimono',col:0xF8F4EE,inner:0xD8342C,trim:0xD8342C,belt:0xD8342C,pattern:0xD8342C,motif:'wave'},back:{kind:'tails',col:0xF4F4F8,col2:0xEDEFF6,tip:0xFF8A2A,n:9},weapon:{kind:'orb',col:0x4E9CFF,hand:'L'},eyes:{col:0xC8901A}});
def('yuki',    {type:'human',build:'hero',hair:{style:'short',col:0xC8D8E6},hat:{kind:'kabuto',col:0xCFE6F5,col2:0x9FE6FF,crest:'snow',lace:0x4E8CC8},outfit:{kind:'armor',col:0x4E8CC8,lace:0x4E7AB8,trim:0x9FE6FF,plate:0xDCEEF8,sleeve:0x2A4A7A,legs:0x2A4A7A},weapon:{kind:'naginata',col:0xBFF0FF,col2:0x2A4A7A,glow:true},eyes:{col:0x4E8CC8,fierce:true},back:{kind:'cape',col:0x2A4A8C}});
def('shogun',  {type:'human',build:'broad',head:'oni',skin:0x6E4A8C,hat:{kind:'kabuto',col:0x1E1A22,col2:GLD,crest:'horns',lace:0x8C2A2A},outfit:{kind:'armor',col:0x8C2A2A,lace:0x8C2A2A,trim:GLD,plate:0x1E1A22,emblem:GLD,sleeve:0x2A1E26},weapon:{kind:'greatsword',col:0xE0E6EC},eyes:{col:0xFF5A2A,glow:true,fierce:true},back:{kind:'flames'}});
def('kappa',   {type:'human',build:'normal',head:'duck',skin:0x5E9F46,eyes:{col:0xF5C542},hat:{kind:'leaves',col:0x3F7A3A,col2:0x6FB548},outfit:{kind:'bare',col2:0x3F7A3A},weapon:{kind:'trident',col:GLD,col2:0x6B4A2A},back:{kind:'shell',col:0x4E6E3A,col2:0x8CA05A},beads:GLD});
def('gasha',   {type:'human',build:'giant',prop:{head:0.34},head:'skull',eyes:{col:0xC58CFF,glow:true},outfit:{kind:'robe',col:0x4E3A6E,inner:0x2A1E3A,trim:0x8E6FC0,pattern:0xC58CFF},skin:0xEDE6D6,back:{kind:'flames',col:0x8E4FD6,col2:0xE6C8FF},extra:(R,B)=>{ for(let i=0;i<5;i++) R.add('chest',G_.tor(B.w*0.75-i*0.02,0.035,5,16,Math.PI),0xEDE6D6,{p:[0,B.torso*(0.15+i*0.07),0.1],r:[0,0,0]}); }});
def('raijin',  {type:'human',build:'broad',skin:0x3E6EC8,hair:{style:'wild',col:0xF2F2F2,col2:0xDDDDE6},horns:{style:'oni',col:GLD,len:0.6},outfit:{kind:'bare',col2:0xD9A441,stripes:true},eyes:{col:0xFFF27A,glow:true,fierce:true,grin:true},back:{kind:'drums',col:0x8C2A2A,col2:0x5A3A2A},weapon:{kind:'mallet',col:0xD9A441,col2:0x6B4A2A}});
def('nue',     {type:'quad',len:1.8,height:0.85,w:0.5,col:0xD8842A,col2:0x1E1410,belly:0xF2D8A8,stripes:true,headKind:'monkey',headCol:0x8C5A2A,muzzle:0xE07A5A,mane:0x6B4A2A,cheek:0x6B4A2A,tail:'snake',tailCol:0x3F7A3A,tailLen:1.5,fangs:true,eyeCol:0xFFC531,eyeGlow:true,extra:(R,D)=>{ for(let i=0;i<6;i++){ const a=(i/5-0.5)*2.4; R.add('rear',G_.sph(0.3,0.22,0.25),0x6E6E7A,{p:[Math.sin(a)*0.5,0.45+Math.cos(a)*0.15,-0.1],grad:0xB8B8C8}); } }});
def('ryujin',  {type:'serpent',heads:1,seg:8,r:0.25,neck:1.1,col:0x2F9F88,col2:0x6FD8C0,belly:0xF5E2A0,horns:GLD,whiskers:GLD,mane:0xF5C542,spines:GLD,eyeCol:0xFFE27A,orb:0xDCF4FF,legs:true,waves:0x6FC8F0});
def('tsuchi',  {type:'spider',col:0x3A2A55,col2:0x8E72C0,eyeCol:0xFF2A2A,mark:0xD8342C});
def('nurari',  {type:'human',build:'slim',skin:0xE8D2B8,prop:{head:0.27},head:'old',hair:{style:'bald'},eyes:{col:0x3A2A1E},beard:{style:'mustache',col:0xBFB8A8},outfit:{kind:'robe',col:0x9A96A2,inner:0x2A2A3A,trim:0x5A5668,belt:0x2A2A3A,pattern:0xE6E2EC},weapon:{kind:'pipe',col2:0x3A2418},back:{kind:'flames',col:0x8E4FD6,col2:0xE6C8FF},
  extra:(R,B)=>{ R.add('head',G_.sph(B.head*0.75,B.head*1.4,B.head*0.8),0xE8D2B8,{p:[0,B.head*1.9,-B.head*0.25],grad:0xD8BCA0}); }});
def('orochi',  {type:'serpent',heads:8,seg:6,r:0.17,neck:0.95,col:0x2F6A2A,col2:0x6AB048,belly:0xE0D8A0,horns:GLD,eyeCol:0xFF3A2A,spines:0x1E3A1A,mane:0x8CA04A});
def('namazu',  {type:'fish',col:0x4E5A6E,col2:0xE8DCC0,moss:0x6E8A3A,eyeCol:0xE8B030});
def('mao',     {type:'human',build:'broad',head:'mask',mask:'hannya',maskCol:0x8C1E2A,skin:0x3A2A3A,horns:{style:'curved',col:0x1E1A22},hair:{style:'wild',col:0x1E1A22,col2:0x3A2A4A},outfit:{kind:'armor',col:0x8C1E2A,lace:0x8C1E2A,trim:GLD,plate:0x1E1418,emblem:0xC58CFF,sleeve:0x2A1E26},weapon:{kind:'katana',col:0xE0B0FF,glow:true,off:{kind:'katana',col:0xE0B0FF,glow:true}},back:{kind:'flames',col:0x6E2AA8,col2:0xE6B0FF}});
def('akaoni',  {type:'human',build:'giant',head:'oni',skin:0xC8342C,hair:{style:'wild',col:0xF2F2F2,col2:0xDDD8D0},horns:{style:'oni',col:HORN,len:0.9,size:0.25},outfit:{kind:'bare',col2:0xD9A441,stripes:true},weapon:{kind:'club',col:0x3A3A42,s:1.3},eyes:{col:0xF5C542,fierce:true,grin:true}});
def('brute',   {type:'human',build:'giant',head:'oni',skin:0x3E6EC8,hair:{style:'wild',col:0x1E1E2A,col2:0x2A2A3A},horns:{style:'oni',col:HORN,len:0.7},outfit:{kind:'bare',col2:0xD9A441,stripes:true},weapon:{kind:'club',col:0x6B4A2A,s:1.15},eyes:{col:0xF5C542,fierce:true,grin:true}});
def('umibozu', {type:'blob',col:0x14203A,col2:0x4E8CC8});
def('kamaitachi',{type:'human',build:'slim',head:'wolf',skin:0xB8B8C0,muzzleCol:0xF4F4F8,eyes:{col:0xF5C542},outfit:{kind:'ninja',col:0x8E8E96,col2:0x6E6E78,belt:0x3F7A3A,glove:0xB8B8C0},weapon:{kind:'sickle',col:0xE6ECF2,col2:0x3A2418,s:1.3,glow:true,off:{kind:'sickle',col:0xE6ECF2,col2:0x3A2418,s:1.3,glow:true}},back:{kind:'tails',col:0xB8B8C0,col2:0xD8D8DE,n:1,len:1.4,tip:0xF4F4F8,fat:1.3}});
def('daidara', {type:'human',build:'giant',skin:0x6E6A5A,head:'stone',headCol:0x7A7462,hair:{style:'wild',col:0x3F6A2A,col2:0x5A8A3A},beard:{style:'long',col:0x4E7A3A},outfit:{kind:'bare',col2:0x5A5648},eyes:{col:0x9BF57E,glow:true},back:{kind:'trees'}});
def('hannya',  {type:'human',build:'slim',head:'mask',mask:'hannya',maskCol:0xF4EEE6,skin:0xF4E6DA,hair:{style:'long',col:0x14121A,len:3.6},outfit:{kind:'kimono',col:0x8C1E2A,inner:0x1E1418,trim:GLD,belt:0x1E1418,pattern:GLD},back:{kind:'flames',col:0x2A6AFF,col2:0xBFE6FF},weapon:{kind:'fan',col:0xD8342C}});
def('mikaboshi',{type:'human',build:'hero',skin:0x2A3A6E,hair:{style:'longflow',col:0xE6ECF5,len:2.6},hat:{kind:'stars',col:0x2A2A55,col2:0xDCE6FF},outfit:{kind:'robe',col:0x1E2A6E,inner:0x0E1438,trim:0xDCE6FF,pattern:0xDCE6FF,motif:'star'},weapon:{kind:'spear',col:0xDCE6FF,col2:0x1E2A55,glow:true},eyes:{col:0xDCE6FF,glow:true},back:{kind:'halo',col2:0xC8D8FF}});
def('ushioni', {type:'human',build:'giant',head:'bull',skin:0x2A2626,muzzleCol:0x3A3434,horns:{style:'bull',col:0xC8B89A},eyes:{col:0xFF5A2A,glow:true},outfit:{kind:'armor',col:0x8C1E1E,lace:0x8C1E1E,trim:GLD,plate:0x2A2626,sleeve:0x1E1A1A},weapon:{kind:'club',col:0x5A5650,s:1.2},
  extra:(R,B)=>{ for(let i=0;i<8;i++) R.add('chest',G_.tor(0.07,0.022,4,10),0x8E8A84,{p:[-0.3+i*0.085,0.3-i*0.06,B.w*0.85],r:[0,i%2?Math.PI/2:0,0]}); }});
def('shuten',  {type:'human',build:'giant',head:'oni',skin:0xC8342C,hair:{style:'wild',col:0xF2F2F2,col2:0xE6E0D8},horns:{style:'oni',col:GLD,len:1.0},outfit:{kind:'kimono',col:0x8C2A1E,inner:0x1E1414,trim:GLD,belt:0x2A1E1E,short:true,pattern:GLD},weapon:{kind:'club',col:0x3A3A42,s:1.3},eyes:{col:0xF5C542,fierce:true,grin:true},extra:(R,B)=>{ R.add('hips',G_.lathe([[0.001,0.2],[0.1,0.15],[0.06,0.05],[0.14,-0.08],[0.12,-0.2],[0.001,-0.22]],14),0xC8902A,{p:[B.w*1.05,-0.1,0.1],grad:0x8C5A1E}); }});
def('kirin',   {type:'quad',len:1.8,height:1.0,w:0.4,col:0xE8C050,col2:0x2F8F8A,belly:0xFFF0C0,headKind:'deer',headCol:0xF5D060,muzzle:0xFFF0C0,mane:0x6FD8C8,maneTip:0xF4FFFC,scales:0x3EB0A0,antlers:GLD,antlerGlow:true,tail:'fluffy',tailCol:0x6FD8C8,tailTip:0xF4FFFC,legFire:0x4E9CFF,hoof:GLD,eyeCol:0x2AC8FF,eyeGlow:true,whiskers:0xFFE27A,cheek:0x6FD8C8});
def('enma',    {type:'human',build:'broad',skin:0xB3261E,beard:{style:'long',col:0x14121A},hat:{kind:'judge',col:0x1E1A22,col2:GLD},outfit:{kind:'robe',col:0x8C1E2A,inner:0x1E1418,trim:GLD,belt:GLD,pattern:GLD},weapon:{kind:'staff',col:GLD,col2:0x2A1E1E,orb:0xFF6A2A},eyes:{col:0xF5C542,fierce:true}});
def('susanoo', {type:'human',build:'hero',skin:0xE8D2B8,hair:{style:'wild',col:0x1E2A55,col2:0x2A3A6E,tip:0x4E6AB0},outfit:{kind:'armor',col:0x2A4A8C,lace:0x2A4A8C,trim:0xDCE6FF,plate:0x162044,robe:0x1E2A55,sleeve:0x14183A},weapon:{kind:'greatsword',col:0xBFE6FF,glow:true},eyes:{col:0x9FE6FF,fierce:true},back:{kind:'clouds',col:0x3A4A7E,col2:0x6E86C8}});
def('jorogumo',{type:'human',build:'slim',skin:0xF4E6DA,hair:{style:'bun',col:0x14121A,pin:GLD,pinGem:0xD8342C},eyes:{col:0xD8342C},outfit:{kind:'kimono',col:0x1E1418,inner:0xA8241E,trim:0xD8342C,belt:0xA8241E,pattern:GLD},back:{kind:'spiderlegs',col:0x1E1418},weapon:{kind:'fan',col:0xD8342C},extra:(R,B)=>{ R.add('head',G_.sph(B.head*0.07),0xD8342C,{p:[0,B.head*1.35,B.head*0.92],glow:true}); }});
def('karura',  {type:'human',build:'hero',head:'bird',skin:0xF06A1F,beakCol:0xF5C542,crestCol:0xFFB04A,eyes:{col:0xFFE27A,glow:true},outfit:{kind:'armor',col:0xD8541E,lace:0xD8541E,trim:GLD,plate:0xE8A030,sleeve:0xC8401A},back:{kind:'wings',col:0xE8541E,col2:0xFFB04A,span:1.7,tip:0xFFE27A,n:8},weapon:{kind:'spear',col:GLD,col2:0x8C2A2A},hat:{kind:'halo',col2:0xFFC14A}});
def('kuzuryu', {type:'serpent',heads:9,seg:6,r:0.15,neck:0.95,col:0x1E5AA8,col2:0x5A9CE0,belly:0xDCEEFA,horns:0xDCE6FF,eyeCol:0xFFF27A,whiskers:0x9FE6FF,mane:0xDCE6FF,spines:0xDCE6FF,waves:0x6FC8F0});
def('izanami', {type:'human',build:'slim',skin:0xE6E6EA,hair:{style:'long',col:0x14121A,col2:0x2A2830,tip:0x3A3848,len:3.8},eyes:{col:0xB98CFF,glow:true},hat:{kind:'veil',col:0x3A3A42},outfit:{kind:'kimono',col:0x3A3842,inner:0x8E8A96,trim:0xC8C4D0,belt:0x8E8A96,pattern:0xC8C4D0},back:{kind:'halo',col2:0xB98CFF},
  extra:(R,B)=>{ for(const sd of [1,-1]){ R.add('back',G_.lathe([[0.02,0.16],[0.13,0.1],[0.15,0],[0.13,-0.1],[0.02,-0.16]],12),0xB98CFF,{p:[sd*0.75,0.45,-0.1],glow:true}); R.add('back',G_.cyl(0.004,0.004,0.3,3),0x3A3A42,{p:[sd*0.75,0.75,-0.1],ol:false}); } }});
def('tsukuyomi',{type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6ECF5,col2:0xC8D4E6,len:2.8},hat:{kind:'moon',col:0xC8D4E6,col2:0xDCE6FF,glow:true},outfit:{kind:'robe',col:0xC9C2EC,inner:0x4E5A9C,trim:0xDCE6FF,pattern:0xF4F8FF,motif:'star'},weapon:{kind:'sickle',col:0xDCE6FF,col2:0x4E5A9C,s:1.6,glow:true},eyes:{col:0x6E7AB8}});
def('raiju',   {type:'quad',len:1.6,height:0.85,w:0.4,col:0xF4F4FA,col2:0x3E6EC8,belly:0xFFFFFF,stripes:true,headKind:'beast',headCol:0xF4F4FA,muzzle:0xFFFFFF,mane:0x6E9CFF,maneTip:0xFFF27A,cheek:0xDCE6FF,tail:'lightning',tailCol:0x3E6EC8,eyeCol:0x6FE3FF,eyeGlow:true,fangs:true,legFire:0xFFF27A});
def('baku',    {type:'quad',len:1.8,height:0.9,w:0.55,col:0x3E3A8C,col2:0x8C8AD8,stripes:true,headKind:'elephant',headCol:0x4E4AA0,tail:'fluffy',tailCol:0x6E6AC8,eyeCol:0xF5C542,
  extra:(R)=>{ for(let i=0;i<5;i++) R.add('body',G_.sph(0.14),0xB98CFF,{p:[(i-2)*0.4,0.9,(i%2)*0.3],glow:true}); }});
def('onryo',   {type:'human',build:'hero',skin:0x6FA8D8,hat:{kind:'kabuto',col:0x2A4A7A,col2:0x9FE6FF,crest:'crescent',glow:true,lace:0x3E6EA8},outfit:{kind:'armor',col:0x3E6EA8,lace:0x3E6EA8,trim:0x9FE6FF,plate:0x1E3A6A,sleeve:0x14284A},weapon:{kind:'katana',col:0x9FE6FF,glow:true},eyes:{col:0x9FE6FF,glow:true,fierce:true},back:{kind:'flames',col:0x2A8AFF,col2:0xBFF0FF}});
def('shachi',  {type:'fish',tigerHead:true,len:1.7,height:0.85,w:0.46,col:0xF5B820,col2:0x2A1E14,belly:0xFFF0C8,stripes:true,headKind:'tiger',headCol:0xF5B820,muzzle:0xFFF4C8,cheek:0xFFF4C8,tail:'fish',tailCol:0xF5C542,finCol:0x3EA8A0,fins:true,fangs:true,eyeCol:0x6FE36F,eyeGlow:true,scales:0xE8A010,tailLen:1.5});
def('amaterasu',{type:'human',build:'chibi',prop:{head:0.33,leg:0.7,torso:0.54,arm:0.52,w:0.26},skin:0xFFE0C8,hair:{style:'flow',col:0xF7C232,col2:0xFFEDA0,len:4.1,strands:20,flare:1.1,ornament:'sun'},outfit:{kind:'furisode',col:0xFFF6E6,col2:0xD8341E,trim:0xF5C542,belt:0xC8241A},weapon:{kind:'sunbow',col:0xF5C542},eyes:{style:'anime',col:0xD08A18},back:{kind:'sunflame'}});
def('fujin',   {type:'human',build:'broad',skin:0x4E8A3A,hair:{style:'wild',col:0xF2F2F2,col2:0xE0E6E0},horns:{style:'oni',col:GLD,len:0.5},outfit:{kind:'bare',col2:0x2A4A8C},eyes:{col:0xF5C542,fierce:true,grin:true},back:{kind:'bag',col:0xDCE6F5,col2:0x2A4A8C}});
def('yukionna',{type:'human',build:'slim',skin:0xE6F0FA,hair:{style:'long',col:0x1A1E2E,col2:0x2A3048,tip:0x4E5A80,len:3.6,ornament:0xDCE6FF},outfit:{kind:'kimono',col:0xDCEEFA,inner:0x6FA8D8,trim:0x9FC8E6,belt:0x6FA8D8,pattern:0xFFFFFF,motif:'star'},eyes:{col:0x4E8CC8},weapon:{kind:'fan',col:0xDCE6FF}});
def('benkei',  {type:'human',build:'broad',skin:0xD8A878,hat:{kind:'hood',col:WHT},outfit:{kind:'monk',col:0x1E1E24,inner:0x3A3A42,trim:0x8E8A84,belt:WHT,kesa:0x6E5A44},weapon:{kind:'naginata',col:0xE6ECF2,col2:0x2A1E1E},eyes:{col:0x3A2A1E,fierce:true},beads:0x2A1E18,extra:(R,B)=>{ for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.2; R.add('back',G_.cyl(0.02,0.02,1.2,5),i%2?0x6B4A2A:0x8E8A84,{p:[Math.sin(a)*0.3,0.3,-0.2],r:[0,0,a*0.6]}); } }});
def('kagutsuchi',{type:'human',build:'hero',skin:0xE8A878,hair:{style:'flame',col:0xFF6A1F,col2:0xFFB04A},outfit:{kind:'armor',col:0xC8341E,col2:0xF5A042,trim:GLD,plate:0x8C1E14},eyes:{col:0xFFE27A,glow:true,fierce:true},back:{kind:'flames'}});
def('izanagi', {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6E8F2,col2:0xB8BCD6,len:3},outfit:{kind:'robe',col:0xD4DCEE,col2:0x4F74C0,trim:GLD,belt:0x3A5A9E},weapon:{kind:'spear',col:GLD,col2:0xF5E6C8,glow:true},eyes:{col:0xC8901A},back:{kind:'halo',col2:0xFFE27A}});
def('takemika',{type:'human',build:'hero',skin:0xE8D2B8,hat:{kind:'kabuto',col:GLD,col2:0x9FE6FF,crest:'horns'},outfit:{kind:'armor',col:0x2A4A8C,col2:GLD,trim:0x9FE6FF,plate:0xD8B030},weapon:{kind:'greatsword',col:0xDCF4FF,glow:true},eyes:{col:0x9FE6FF,glow:true,fierce:true},back:{kind:'flames',col:0x9FE6FF}});
def('hachiman',{type:'human',build:'hero',skin:0x8C5A3A,hat:{kind:'kabuto',col:0x1E1A1A,col2:GLD,crest:'horns',lace:0xA8281E},outfit:{kind:'armor',col:0xA8281E,lace:0xA8281E,trim:GLD,plate:0x6E1414,sleeve:0x2A1E1E},weapon:{kind:'naginata',col:0xF5C542,col2:0x2A1E1E,glow:true},back:{kind:'quiver',col:0x8C1E1E},eyes:{col:0x3A2A1E,fierce:true}});
def('bishamon',{type:'human',build:'broad',skin:0xE8C8A8,hat:{kind:'pagoda',col:0xE8E4D8,col2:GLD},outfit:{kind:'armor',col:0x2F6A3A,lace:0x2F6A3A,trim:GLD,plate:0xEDE8DA,emblem:0xD8342C,sleeve:0x2A4A30},weapon:{kind:'spear',col:GLD,col2:0x6B3A1E},eyes:{col:0x6B3A1E,fierce:true},back:{kind:'halo',col2:GLD}});
def('inari',   {type:'human',build:'slim',head:'mask',mask:'fox',maskCol:0xF8F4EE,skin:0xF4E6DA,hair:{style:'long',col:0xF4F4F8,len:3},ears:'fox',earCol:0xF4F4F8,outfit:{kind:'kimono',col:0xF8F4EE,inner:0xC8241E,trim:GLD,belt:0xC8241E,pattern:GLD},back:{kind:'tails',col:0xF4F4F8,col2:0xEDEFF6,tip:0xF5C542,n:5},weapon:{kind:'orb',col:0x4E9CFF,hand:'L'}});
def('saruta',  {type:'human',build:'broad',skin:0xC8342C,beard:{style:'long',col:0xF2F2F2},hair:{style:'wild',col:0xF2F2F2},hat:{kind:'leaves',col:0x3F6A2A,col2:0x5A8A3A},outfit:{kind:'robe',col:0x4E6A3A,inner:0x2A3A1E,trim:0xC8A46E,pattern:0x8CA05A},weapon:{kind:'staff',col:GLD,col2:0x6B4A2A,orb:0x9BF57E},eyes:{col:0xF5C542,fierce:true},
  extra:(R,B)=>{ R.add('head',G_.cone(B.head*0.2,B.head*1.1,8),0xC8342C,{p:[0,B.head*0.85,B.head*1.3],r:[Math.PI/2+0.1,0,0]}); }});
def('minaka',  {type:'human',build:'hero',skin:0xF4ECE6,beard:{style:'long',col:0xF4F4F8},hair:{style:'longflow',col:0xF4F4F8,len:2.6},hat:{kind:'crown',col:GLD,gem:0xC58CFF},outfit:{kind:'robe',col:0x3A2A6E,col2:0x2A1E55,trim:GLD,pattern:GLD},weapon:{kind:'staff',col:GLD,col2:0x3A2A6E,orb:0xFFE27A},back:{kind:'planets'},eyes:{col:0xC8901A}});
def('kunitoko',{type:'human',build:'giant',skin:0x6E6A5A,head:'stone',headCol:0x7A7462,beard:{style:'long',col:0x4E7A3A},hair:{style:'wild',col:0x3F6A2A,col2:0x5A8A3A},outfit:{kind:'bare',col2:0x5A5648},eyes:{col:0x9BF57E,glow:true},back:{kind:'trees'}});
def('yatono',  {type:'human',build:'hero',head:'snake',skin:0x3F8A3A,eyes:{col:0xF5C542,glow:true},outfit:{kind:'armor',col:0x2F6A2A,col2:GLD,trim:GLD,plate:0x3F8A3A},back:{kind:'serpents',col:0x3F8A3A},weapon:{kind:'katana',col:0x9BF57E,glow:true}});
def('marishi', {type:'human',build:'slim',skin:0xFBE6D6,hair:{style:'longflow',col:0xF4F4F8,len:3},hat:{kind:'crown',col:GLD,n:9,gem:0xD8342C},outfit:{kind:'kimono',col:0xF6D0A6,col2:0xF5E6C8,trim:GLD,belt:GLD},back:{kind:'halo',col2:GLD},weapon:{kind:'fan',col:GLD},
  extra:(R,B)=>{ for(const sd of [1,-1]){ R.add('head',G_.sph(B.head*0.8),0xFBE6D6,{p:[sd*B.head*1.3,B.head*0.9,-B.head*0.3]}); R.add('head',G_.sph(B.head*0.85,B.head*0.9,B.head*0.8),0xF4F4F8,{p:[sd*B.head*1.32,B.head*1.0,-B.head*0.5]}); } }});
def('mioya',   {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xF4F4F8,len:2.6},hat:{kind:'sun',col:GLD,col2:0xFFE27A},outfit:{kind:'robe',col:0xCFE6F2,col2:0xF5E6C8,trim:GLD},weapon:{kind:'staff',col:GLD,col2:0xF5E6C8,orb:0xFFE27A},eyes:{col:0xC8901A}});
def('wata',    {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0x5AC8D8,col2:0x3EA8C8,len:3},hat:{kind:'crown',col:0xDCF4FF,col2:0x9FE6FF,gem:0x6FE3FF},outfit:{kind:'robe',col:0xA8D8F0,col2:0x9FD8E6,trim:0x3EA8C8},weapon:{kind:'trident',col:0x9FE6FF,col2:0x2A6A8C,glow:true},back:{kind:'halo',col2:0x9FE6FF},eyes:{col:0x2A8CA8}});
def('oyama',   {type:'human',build:'broad',skin:0xE8D2B8,beard:{style:'long',col:0xF4F4F8},hair:{style:'wild',col:0xF4F4F8},hat:{kind:'crown',col:GLD,gem:0x6FE36F},outfit:{kind:'robe',col:0xE8E4D8,inner:0x3F6A2A,trim:GLD,belt:0x3F6A2A,pattern:0x6E9A5A},weapon:{kind:'staff',col:GLD,col2:0x6B4A2A,orb:0x9BF57E},eyes:{col:0x6FB548,fierce:true}});
def('kurao',   {type:'human',build:'hero',skin:0xEAF2F8,hair:{style:'longflow',col:0xF4F8FC,col2:0xDCE6F0,len:3},horns:{style:'antler',col:0x6FD8C8,glow:true},outfit:{kind:'robe',col:0x8CB4E6,inner:0x2A4A8C,trim:0xDCF4FF,belt:0x2A4A8C,pattern:0xDCF4FF,motif:'star'},weapon:{kind:'orb',col:0x9FE6FF},eyes:{col:0x6FD8C8,glow:true}});
def('magatsu', {type:'human',build:'broad',skin:0x3A2626,hair:{style:'flame',col:0xD8341E,col2:0xFF6A1F},horns:{style:'curved',col:0x1E1A1A},outfit:{kind:'armor',col:0x2A1E1E,col2:0x8C1E14,trim:0xFF6A1F,plate:0x1E1414},weapon:{kind:'greatsword',col:0xFF6A1F,glow:true},eyes:{col:0xFFE27A,glow:true,fierce:true},back:{kind:'flames'}});
def('ryugu',   {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6F4EC,col2:0x9FD8B8,len:3},horns:{style:'antler',col:GLD},hat:{kind:'crown',col:GLD,gem:0x6FE3FF},outfit:{kind:'robe',col:0xA8342A,inner:0x2F8F78,trim:GLD,belt:0x2F8F78,pattern:GLD},weapon:{kind:'trident',col:GLD,col2:0x1E6A5A},eyes:{col:0x2F8F78}});
def('chochin', {type:'human',build:'broad',skin:0xA8341E,hair:{style:'flame',col:0xFF6A1F,col2:0xFFB04A},horns:{style:'curved',col:0x2A1E1A},outfit:{kind:'armor',col:0x2A1E1A,col2:0x8C2A1E,trim:GLD,plate:0x1E1414,emblem:0xFF6A2A},weapon:{kind:'lantern'},eyes:{col:0xFFE27A,glow:true,fierce:true},back:{kind:'flames'}});
def('kane',    {type:'human',build:'broad',skin:0xD8A878,beard:{style:'full',col:0x8E8A84},hair:{style:'wild',col:0x5A5648},hat:{kind:'leaves',col:0x4E7A3A,col2:0x6E9A4A},outfit:{kind:'armor',col:0x5A4A3A,col2:0x3A2E24,trim:0xC8A46E,plate:0x6E5A44},weapon:{kind:'bell',col:0xC8A46E},eyes:{col:0xF5C542,fierce:true}});
def('karakasa',{type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xD8DCE6,len:2.4},hat:{kind:'kasa',col:0xC8241E,col2:GLD},outfit:{kind:'kimono',col:0x1E2A44,col2:0x162034,trim:0xC8241E,belt:0xC8241E},weapon:{kind:'katana',col:0x9FE6FF,glow:true},eyes:{col:0x6FE3FF,glow:true}});
def('ungai',   {type:'human',build:'slim',skin:0xFBE6D6,hair:{style:'longflow',col:0x14121A,len:3.4},hat:{kind:'crown',col:GLD,n:5},outfit:{kind:'kimono',col:0xC8241E,col2:0x8C1E1E,trim:GLD,belt:GLD},back:{kind:'mirror'},weapon:{kind:'fan',col:GLD},eyes:{col:0x6B3A1E}});
def('orizuru', {type:'human',build:'slim',skin:0xFBEDE4,hair:{style:'longflow',col:0xF4F4F8,len:3},hat:{kind:'crown',col:0xD8342C,n:5},outfit:{kind:'kimono',col:0xE8DCE6,col2:0xF4E8E8,trim:0xD8342C,belt:0xD8342C},back:{kind:'wings',col:0xFFFFFF,col2:0xF0F0F6,span:1.5,n:8},eyes:{col:0x4E8CC8}});
def('daruma',  {type:'human',build:'round',skin:0xF2D2B0,outfit:{kind:'robe',col:0xC8241E,col2:0x8C1E1E,trim:GLD,short:true},beard:{style:'full',col:0x14121A},eyes:{col:0x14121A,fierce:true},weapon:{kind:'club',col:0x3A2418,s:1.1},
  extra:(R,B)=>{ R.add('head',G_.sph(B.head*1.25,B.head*1.2,B.head*1.1),0xC8241E,{p:[0,B.head*1.0,-B.head*0.15]}); R.add('head',G_.sph(B.head*0.2,B.head*0.12,0.03),0x14121A,{p:[0.3*B.head,B.head*0.95,B.head*0.95],ol:false}); }});
def('biwa',    {type:'human',build:'slim',skin:0xF4E6DA,hair:{style:'longflow',col:0x5A3A8C,col2:0x4A2A7A,len:2.6},outfit:{kind:'robe',col:0x3A2A6E,col2:0x2A1E55,trim:GLD},weapon:{kind:'lute',col2:0xC8A46E},eyes:{style:'closed'},beads:GLD});
def('okina',   {type:'human',build:'slim',head:'mask',skin:0xF4ECE6,hat:{kind:'eboshi',col:0x14121A},beard:{style:'long',col:0xF4F4F8},outfit:{kind:'robe',col:0x2A2A2A,col2:0x1E1E1E,trim:GLD,pattern:GLD},weapon:{kind:'fan',col:GLD}});
def('kotoryu', {type:'human',build:'broad',head:'snake',skin:0x2F8F8A,eyes:{col:0x9FE6FF,glow:true},horns:{style:'antler',col:0xDCF4FF},outfit:{kind:'armor',col:0x2F8F8A,col2:0x9FE6FF,trim:GLD,plate:0x1E6A66},weapon:{kind:'spear',col:0x9FE6FF,col2:0x1E6A66,glow:true},back:{kind:'wings',col:0x6FD8C8,col2:0x9FE6FF,span:1.0,n:5}});
def('tsukumo', {type:'human',build:'broad',skin:0x8C2A1E,beard:{style:'mustache',col:0xF4F4F8},hat:{kind:'kabuto',col:0x1E1414,col2:GLD,crest:'crescent'},outfit:{kind:'armor',col:0x8C1E1E,col2:0x1E1414,trim:GLD,plate:0x6E1414,emblem:0x6FE36F},weapon:{kind:'naginata',col:0xE6ECF2,col2:0x1E1414},eyes:{col:0xFF5A2A,glow:true,fierce:true}});

/* ---------------------------------------------------------------- v72 classes
   heroes (recruits) stay chibi and cute; warriors and warlords get heroic bodies, fierce faces or a mempo,
   ornate armour and a battle stance; serene gods get tall divine bodies, elegant adult faces and a regal stance;
   oni and war gods get fierce adult faces. */
const W_={stance:'warrior',outfit:{ornate:true}}, G2={build:'divine',face:'elegant',stance:'regal'};
const OVR={
  samurai:{stance:'warrior',outfit:{ornate:true}},
  hachiman:Object.assign({},W_,{build:'heroic',face:'mempo',mempo:0x8C1E1E,eyes:{col:0xFFB020,glow:true},hat:{kind:'kabuto',col:0x1E1A1A,col2:GLD,crest:'kuwagata',mon:0xFFE27A,lace:0xA8281E},outfit:{ornate:true,apronMon:0xF5C542},back:{kind:'banners',col:0xA8241E,col2:GLD}}),
  bishamon:Object.assign({},W_,{build:'titan',face:'mempo',mempo:0xD8B030,mempoTrim:0xFFF4C8,mempoHair:0xF4F1EA,skin:0xE8C8A8,eyes:{col:0xFFC531,glow:true},hat:{kind:'kabuto',col:0xF4F1EA,col2:GLD,crest:'sun',glow:true,lace:0x2F6A3A},outfit:{kind:'armor',col:0x2F6A3A,lace:0x3F7A4A,trim:GLD,plate:0xF4F1EA,emblem:0xD8342C,sleeve:0xE8E4D8,ornate:true,apronMon:0xD8342C},
    extra:(R,B)=>{ for(let i=0;i<3;i++) R.add('handL',G_.cyl(0.13-i*0.03,0.15-i*0.03,0.08,8),GLD,{p:[0,0.05+i*0.1,0.12],glow:i===2}); R.add('handL',G_.cone(0.05,0.18,8),GLD,{p:[0,0.38,0.12]}); }}),
  takemika:Object.assign({},W_,{build:'titan',face:'mempo',mempo:0xC89A28,mempoTrim:0x9FE6FF,mempoHair:0xDCE6FF,eyes:{col:0x9FE6FF,glow:true},hat:{kind:'kabuto',col:GLD,col2:0xDCF4FF,crest:'kuwagata',mon:0x9FE6FF,lace:0x2A4A8C},outfit:{ornate:true,apronMon:0x9FE6FF}}),
  susanoo:Object.assign({},W_,{build:'heroic',face:'fierce',eyes:{col:0x9FE6FF,glow:true},outfit:{ornate:true}}),
  kagutsuchi:Object.assign({},W_,{build:'heroic',face:'fierce',eyes:{col:0xFFE27A,glow:true},outfit:{ornate:true,plate:0xC8341E,lace:0x8C1E14},
    extra:(R)=>{ for(const h of ['handL','handR']){ R.add(h,G_.sph(0.16),0xFF6A1F,{p:[0,-0.08,0.02],glow:true,grad:0xFFE27A}); for(let k=0;k<5;k++){ const a=k/5*TAU; R.add(h,G_.tube([[0,0,0],[Math.sin(a)*0.06,0.12,Math.cos(a)*0.06],[Math.sin(a)*0.03,0.26,Math.cos(a)*0.03]],0.07,0.005,5,6),0xFF8A2A,{p:[Math.sin(a)*0.08,-0.05,Math.cos(a)*0.08],glow:true,grad:0xFFF0A0}); } } }}),
  shogun:Object.assign({},W_,{build:'titan',face:'fierce',hat:{crest:'kuwagata',mon:0xFF5A2A},outfit:{ornate:true,apronMon:0xFF5A2A}}),
  mao:Object.assign({},W_,{build:'titan'}),
  onryo:Object.assign({},W_,{build:'heroic',face:'mempo',mempo:0x14284A,mempoTrim:0x9FE6FF,mempoHair:0x9FE6FF,eyes:{col:0x9FE6FF,glow:true},outfit:{ornate:true}}),
  tsukumo:Object.assign({},W_,{build:'heroic',face:'mempo',mempo:0x2A1414,mempoHair:0xF4F1EA,eyes:{col:0xFF5A2A,glow:true},hat:{crest:'kuwagata',mon:0xFF5A2A},outfit:{ornate:true}}),
  magatsu:Object.assign({},W_,{build:'titan',face:'fierce',outfit:{ornate:true}}),
  chochin:Object.assign({},W_,{build:'heroic',face:'fierce',outfit:{ornate:true}}),
  kane:Object.assign({},W_,{build:'titan',face:'fierce',outfit:{ornate:true,col:0x2F6A4A,lace:0x2F6A4A,plate:0x4E5A3A}}),
  ushioni:Object.assign({},W_,{build:'titan',outfit:{ornate:true}}),
  yuki:Object.assign({},W_,{build:'heroic',face:'fierce',outfit:{ornate:true}}),
  benkei:{build:'titan',face:'fierce',stance:'warrior'},
  karura:Object.assign({},W_,{build:'heroic'}),
  kotoryu:Object.assign({},W_,{build:'titan',head:'dragon',dhorns:0xDCF4FF,whiskers:0x9FE6FF,mane:0x6FD8C8,horns:null,outfit:{ornate:true}}),
  yatono:Object.assign({},W_,{build:'heroic',head:'dragon',dhorns:GLD,mane:0x3F8A3A,maneTip:0x9BF57E,outfit:{ornate:true}}),
  izanagi:Object.assign({},G2,{mark:0xF5C542}), izanami:Object.assign({},G2,{mark:0xB98CFF,liner:0x6E4A8C}), tsukuyomi:Object.assign({},G2,{mark:0xDCE6FF,liner:0x8E9AC8}),
  mioya:Object.assign({},G2,{mark:0xF5C542}), marishi:Object.assign({},G2,{mark:0xD8342C}), wata:Object.assign({},G2,{mark:0x6FE3FF,liner:0x3E8CA8}), kurao:Object.assign({},G2,{mark:0x6FD8C8,liner:0x5A8CC8}),
  ryugu:Object.assign({},G2,{mark:0x6FE3FF}), minaka:Object.assign({},G2,{mark:0xC58CFF}), mikaboshi:Object.assign({},G2,{mark:0xDCE6FF}), ungai:Object.assign({},G2,{mark:0xD8342C}),
  orizuru:Object.assign({},G2,{mark:0xD8342C}), yukionna:Object.assign({},G2,{liner:0x6FA8D8}), hannya:{build:'divine',stance:'regal'}, jorogumo:Object.assign({},G2,{liner:0xA8241E}),
  oyama:{build:'titan',face:'fierce',stance:'regal'}, enma:{build:'titan',face:'fierce',stance:'regal'}, saruta:{build:'titan',face:'fierce',stance:'warrior'},
  akaoni:{face:'fierce',stance:'warrior'}, brute:{face:'fierce',stance:'warrior'}, shuten:{face:'fierce',stance:'warrior'}, raijin:{face:'fierce',stance:'warrior'}, fujin:{face:'fierce',stance:'warrior'},
  daidara:{face:'fierce'}, kunitoko:{face:'fierce'}, nurari:{face:'elegant',liner:false},
  nue:{headKind:'monkey',eyeCol:0xFF3A2A,eyeGlow:true,muzzle:0xE0604A,mane:0x5A3A22,maneTip:0x8C6A4A},
  raiju:{headKind:'lion',mane:0x5A8CFF,maneTip:0xFFF27A,eyeCol:0x6FE3FF,eyeGlow:true,muzzle:0xFFFFFF},
  kirin:{headKind:'dragon',headCol:0xC8902A,muzzle:0xF0C860,belly:0xFFF0C8,eyeCol:0x2AC8FF,mane:0x3EC8B8,maneTip:0xF4FFFC,antlers:0xF5D060,antlerGlow:true,whiskers:0xFFE27A},
  shachi:{eyeCol:0x6FE36F,scales:0xE8A010,finCol:0x1E3A5A},
};
for(const k in OVR){ const d=DEFS[k], o=OVR[k]; if(!d) continue;
  for(const p in o){ const v=o[p]; if(v&&typeof v==='object'&&!Array.isArray(v)&&d[p]&&typeof d[p]==='object') d[p]=Object.assign({},d[p],v); else d[p]=v; } }

/* ================================================================ instances, pool and animation */
const BUILT={};   /* key -> {geos, kind, height, meta} shared geometry */
/* v83: the heaviest characters are built at reduced curve detail so every hero stays inside the bible's budget
   (35k triangles for heroes, 50k for multi-headed bosses, outline included) */

/* v88 KAIJU: ten building-sized bosses, each also recruitable as a hero */
def('gokaryu',  {type:'kaiju',v:'saurian',atk:'bite'});
def('heikegani',{type:'kaiju',v:'crab'});
def('genbu',    {type:'quad',len:4.2,height:1.7,w:1.75,leg:0.7,headR:1.7,col:0x2F5A4A,col2:0x1E3A2E,belly:0xCFD8B8,headKind:'dragon',headCol:0x3F7A5A,muzzle:0xB8D8A8,eyeCol:0xFFD04A,tail:'snake',tailLen:2.4,tailCol:0x3F7A5A,mane:0x1E4A3A,hoof:0xC8B890,whiskers:0x9FE6FF,extra:genbuExtra});
def('omukade',  {type:'kaiju',v:'chain'});
def('otori',    {type:'kaiju',v:'roc',atk:'wing'});
def('hitotsume',{type:'kaiju',v:'cyclops',atk:'club'});
def('odokuro',  {type:'kaiju',v:'skeleton',atk:'slam'});
def('wanyudo',  {type:'kaiju',v:'wheel'});
def('okubi',    {type:'kaiju',v:'head'});
def('oshiro',   {type:'kaiju',v:'castle',atk:'slam'});
const SEGK_OF={gokaryu:0.6,heikegani:0.6,genbu:0.6,omukade:0.55,otori:0.55,hitotsume:0.6,odokuro:0.6,wanyudo:0.6,okubi:0.6,oshiro:0.6,kuzuryu:0.42,orochi:0.48,kitsune:0.55,amaterasu:0.55,susanoo:0.75,saruta:0.75,orizuru:0.72,kane:0.75,raijin:0.8,mao:0.8,inari:0.8};
function getBuilt(key){ if(BUILT[key]) return BUILT[key]; const sp=DEFS[key]; if(!sp) return null;
  const pK=SEGK; SEGK=SEGK_OF[key]||1; let b; try{ b=buildByType(sp); } finally{ SEGK=pK; }
  const geos=b.rig.build(); const bb=geos.toon.boundingBox; geos.height=bb.max.y-Math.min(0,bb.min.y);
  if(STYLE==='anime'&&b.kind==='human'){ const hw=b.rig.byName.head.userData.world.y, hr=b.B.head; geos.height=Math.min(geos.height,(hw+hr*2.15)*1.06); }
  let tip=null; try{ const hb=b.rig.byName.handR; let best=0; const v=new T.Vector3(), qq=new T.Quaternion(), ee=new T.Euler(), sc3=new T.Vector3();
    for(const pt of b.rig.parts){ if(pt.bone!==hb||pt.glow) continue; const ps=pt.geo.attributes.position; qq.setFromEuler(ee.set(pt.r[0],pt.r[1],pt.r[2])); sc3.set(pt.s[0],pt.s[1],pt.s[2]);
      for(let i=0;i<ps.count;i+=3){ v.fromBufferAttribute(ps,i).multiply(sc3).applyQuaternion(qq).add(new T.Vector3(pt.p[0],pt.p[1],pt.p[2])); const d=v.lengthSq(); if(d>best){ best=d; tip=v.clone(); } } }
    if(tip&&best<0.09) tip=null; }catch(err){ tip=null; }   /* v86: weapon tip in hand space, for the swing trail */
  return (BUILT[key]={sp,b,geos,height:geos.height,proto:b.rig,tip}); }
function kBuild(sp){ const o=KJV[sp.v](sp); o.rig.minPart=0.1; o.rig.minPartOl=0.35; return o; }
function kQuad(sp){ const o=buildQuad(sp); o.rig.minPart=0.07; o.rig.minPartOl=0.22; return o; }
function buildByType(sp){ return sp.type==='quad'?(sp.key==='genbu'?kQuad(sp):buildQuad(sp)):sp.type==='serpent'?buildSerpent(sp):sp.type==='spider'?buildSpider(sp):sp.type==='blob'?buildBlob(sp):sp.type==='kaiju'?kBuild(sp):sp.type==='fish'?buildFish(sp):buildHuman(sp); }
function cloneRig(proto){ /* fresh bone hierarchy matching the prototype's bind pose */
  const map={}, bones=[];
  for(const b of proto.bones){ const n=new T.Bone(); n.name=b.name; n.position.copy(b.position); n.userData.rest=b.position.clone(); map[b.name]=n; bones.push(n);
    if(b.parent&&b.parent.isBone) map[b.parent.name].add(n); }
  return {bones,map,root:map.root}; }
function makeInstance(key){ if(IMPORTED[key]&&IMPORTED[key].status==='ready'&&_skelClone) return makeImported(key); const B=getBuilt(key); if(!B) return null;
  const grp=new T.Group(), rig=cloneRig(B.proto); grp.add(rig.root); grp.updateMatrixWorld(true);
  const skel=new T.Skeleton(rig.bones);
  const mat=celMat(), body=new T.SkinnedMesh(B.geos.toon,mat); body.bind(skel); body.frustumCulled=false; grp.add(body);
  let ol=null; if(B.geos.ol){ ol=new T.SkinnedMesh(B.geos.ol,OL_MATC); ol.bind(skel); ol.frustumCulled=false; ol.onBeforeRender=olBeforeRender; grp.add(ol); }
  let gl=null, hl=null; if(B.geos.glow){ gl=new T.SkinnedMesh(B.geos.glow,GLOW_MAT); gl.bind(skel); gl.frustumCulled=false; grp.add(gl);
    hl=new T.SkinnedMesh(B.geos.glow,HALO_MAT); hl.bind(skel); hl.frustumCulled=false; hl.renderOrder=3; grp.add(hl); }
  return {key,grp,b:rig.map,body,ol,gl,hl,mat,kind:B.b.kind,B,sp:B.sp,
    st:{phase:Math.random()*TAU,move:0,atk:0,last:null,yaw:0,t:Math.random()*10,hit:0,cast:0,dash:0,lift:0}}; }

/* --- pose helpers */
const R0=(b,x,y,z)=>{ if(b) b.rotation.set(x||0,y||0,z||0); };
const ADD=(b,x,y,z)=>{ if(b){ b.rotation.x+=x||0; b.rotation.y+=y||0; b.rotation.z+=z||0; } };
const OFF=(b,x,y,z)=>{ if(b){ const r=b.userData.rest; b.position.set(r.x+(x||0),r.y+(y||0),r.z+(z||0)); } };

/* attack styles: wind-up (u<0.3), strike (0.3-0.5), follow-through and recover */
const WSTYLE={club:'melee',mallet:'melee',greatsword:'melee',bell:'melee',none:'melee',katana:'blade',dagger:'blade',sickle:'blade',naginata:'blade',
  spear:'thrust',trident:'thrust',staff:'cast',orb:'cast',fan:'wind',talisman:'cast',lute:'cast',lantern:'cast',bellstaff:'cast',gohei:'cast',pipe:'cast',umbrella:'blade',bow:'arrow',sunbow:'arrow'};
const SALIAS={bow:'arrow',fox:'cast',orb:'cast',talisman:'cast',fan:'wind',lute:'cast',lantern:'cast',dagger:'blade',sickle:'blade',ice:'spin',flame:'spin',bolt:'thrust',spear:'thrust',trident:'thrust'};
function styleOf(sp,want){ const w=want||WSTYLE[(sp.weapon&&sp.weapon.kind)||'none']||'melee'; return SALIAS[w]||w; }
/* a = wind-up weight, h = impact weight; they overlap so the body never jumps between poses */
/* v82 anime timing: a readable wind-up (about a third of the swing), a strike that arrives in a couple of frames,
   then the impact pose is HELD before recovering. IMPACT_U is where the blow lands; the body freezes there briefly. */
const IMPACT_U={arrow:0.47,cast:0.42,def:0.38};
function atkWeights(u,st){
  if(st==='arrow') return {a:sm(u/0.22)*(1-sm((u-0.45)/0.05)), h:sm((u-0.43)/0.05)*(1-sm((u-0.7)/0.3))};
  if(st==='cast') return {a:sm(u/0.3)*(1-sm((u-0.38)/0.08)), h:sm((u-0.36)/0.08)*(1-sm((u-0.68)/0.32))};
  return {a:sm(u/0.3)*(1-sm((u-0.33)/0.07)), h:sm((u-0.31)/0.08)*(1-sm((u-0.66)/0.32))}; }
function attackPose(st,b,a,h,mv){ const P=(bn,x,y,z)=>ADD(b[bn],x,y,z), legs=1-mv*0.7;
  switch(st){
    case 'arrow':   /* draw to the cheek, hold, loose: the drawing hand flies back */
      P('armL',-1.5*(a+h),0,-0.05*(a+h)); P('elbowL',0.1*(a+h),0,0); P('armR',-1.45*a-1.3*h,0,0.2*a-0.55*h); P('elbowR',-2.2*a-0.5*h,0,0);
      P('spine',0,-0.55*(a+h),0); P('head',0,0.5*(a+h),0); OFF(b.root,0,0,-0.06*h); break;
    case 'cast':    /* gather energy at the chest, then thrust both palms forward */
      P('armR',-0.9*a-1.6*h,0,-0.5*a-0.1*h); P('elbowR',-1.3*a,0,0); P('armL',-0.9*a-1.6*h,0,0.5*a+0.1*h); P('elbowL',-1.3*a,0,0);
      P('spine',-0.25*a+0.25*h,0,0); P('head',-0.15*a+0.05*h,0,0); OFF(b.root,0,0.03*a,0.15*h);
      P('thighL',-0.35*h*legs,0,0); P('kneeL',0.35*h*legs,0,0); break;
    case 'blade':   /* wide horizontal slash: coil to the right, uncoil across the body with a lunge */
      P('armR',-1.2*a-1.3*h,0,-1.3*a+0.7*h); P('elbowR',-0.5*a-0.1*h,0,0); P('spine',0,0.7*a-0.9*h,0); P('chest',0.05*h,0.2*a-0.3*h,0);
      P('armL',-0.6*a+0.3*h,0,0.5*a+0.3*h); OFF(b.root,0,-0.02*a,-0.08*a+0.3*h);
      P('thighL',-0.5*h*legs,0,0); P('kneeL',0.5*h*legs,0,0); P('thighR',0.2*a*legs+0.3*h*legs,0,0); break;
    case 'thrust':  /* draw the weapon back, then drive it forward with the whole body */
      P('armR',-1.4*a-1.55*h,0,-0.3*a-0.05*h); P('elbowR',-1.6*a,0,0); P('spine',-0.1*a+0.25*h,0.5*a-0.4*h,0);
      P('armL',-1.0*a+0.4*h,0,0.4*h); OFF(b.root,0,0,-0.12*a+0.38*h);
      P('thighL',-0.7*h*legs,0,0); P('kneeL',0.7*h*legs,0,0); P('thighR',0.45*h*legs,0,0); break;
    case 'spin':    /* crouch and coil, then whirl the weapon around */
      P('armR',-1.5*(a+h),0,-1.2*(a+h)); P('armL',-0.5*a-0.6*h,0,0.6*(a+h)); P('spine',0,0.9*a-1.8*h,0);
      OFF(b.root,0,-0.06*a,0.1*h); P('thighL',-0.3*a*legs,0,0); P('thighR',-0.3*a*legs,0,0); P('kneeL',0.4*a*legs,0,0); P('kneeR',0.4*a*legs,0,0); break;
    case 'wind':    /* raise the fan high, then sweep it across in a wide arc */
      P('armR',-2.6*a-1.0*h,0,-0.8*a+0.6*h); P('elbowR',-0.3*a,0,0); P('spine',0,0.6*a-0.7*h,0); P('armL',-0.4*(a+h),0,0.4*(a+h));
      OFF(b.root,0,0,0.2*h); P('thighL',-0.4*h*legs,0,0); P('kneeL',0.4*h*legs,0,0); break;
    default:        /* melee: rear back with the weapon high, then crash it down with a lunge */
      P('armR',-2.9*a-0.5*h,0,-0.2*a); P('armL',-2.6*a-0.4*h,0,0.2*a); P('elbowR',-0.8*a-0.1*h,0,0); P('elbowL',-0.8*a-0.1*h,0,0);
      P('spine',-0.35*a+0.55*h,0,0); P('chest',-0.15*a+0.25*h,0,0); OFF(b.root,0,0.04*a-0.08*h,-0.12*a+0.28*h);
      P('thighL',-0.25*a*legs-0.55*h*legs,0,0); P('kneeL',0.35*a*legs+0.6*h*legs,0,0); P('thighR',0.35*h*legs,0,0); P('kneeR',0.25*h*legs,0,0); } }
function attackCurve(u){ const wind=sm(u/0.3)*(1-sm((u-0.3)/0.15)), strike=sm((u-0.28)/0.14)*(1-sm((u-0.6)/0.4)); return {wind,strike}; }

function poseHuman(I,s,dt){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const sw=Math.sin(ph), cw=Math.cos(ph), run=mv>0.5?1:mv*2;
  /* idle breathing and sway */
  const br=Math.sin(t*2.2), sway=Math.sin(t*0.9);
  ADD(b.chest,br*0.02*(1-mv),0,0); ADD(b.spine,0,sway*0.03*(1-mv),sway*0.015*(1-mv)); ADD(b.head,-0.22-br*0.02,sway*0.06*(1-mv),0); ADD(b.neck,-0.08,0,0);
  ADD(b.armL,0,0,0.12+br*0.02); ADD(b.armR,0,0,-0.12-br*0.02); ADD(b.elbowL,-0.15,0,0); ADD(b.elbowR,-0.15,0,0);
  const sta=I.sp.stance, k0=1-mv;   /* class stances: warriors brace with the weapon ready, gods stand tall */
  if(sta==='warrior'){ ADD(b.thighL,0,0,0.2*k0); ADD(b.thighR,0,0,-0.2*k0); ADD(b.kneeL,0.18*k0,0,0); ADD(b.kneeR,0.18*k0,0,0); OFF(b.hips,0,-0.05*k0,0); ADD(b.footL,0,0,-0.2*k0); ADD(b.footR,0,0,0.2*k0);
    ADD(b.armR,-0.4*k0,0,-0.1*k0); ADD(b.elbowR,-0.6*k0,0,0); ADD(b.armL,-0.15*k0,0,0.16*k0); ADD(b.elbowL,-0.35*k0,0,0); ADD(b.chest,-0.06*k0,0,0); ADD(b.head,0.17,0,0); }
  else if(sta==='regal'){ ADD(b.armL,0,0,0.12*k0); ADD(b.armR,-0.25*k0,0,-0.1*k0); ADD(b.elbowR,-0.4*k0,0,0); ADD(b.head,0.14,0,0); ADD(b.chest,-0.08,0,0); }
  /* walk / run cycle */
  const A=0.62*run+0.28*mv;
  ADD(b.thighL,-sw*A,0,0); ADD(b.thighR,sw*A,0,0);
  ADD(b.kneeL,Math.max(0,-cw)*A*1.4+0.05,0,0); ADD(b.kneeR,Math.max(0,cw)*A*1.4+0.05,0,0);
  ADD(b.footL,-Math.max(0,-cw)*A*0.4,0,0); ADD(b.footR,-Math.max(0,cw)*A*0.4,0,0);
  ADD(b.armL,sw*A*0.9,0,0); ADD(b.armR,-sw*A*0.9,0,0); ADD(b.elbowL,-A*0.4,0,0); ADD(b.elbowR,-A*0.4,0,0);
  ADD(b.spine,0.08*mv,sw*0.12*mv,0); ADD(b.chest,0.04*mv,-sw*0.1*mv,0); ADD(b.hips,0,-sw*0.1*mv,0);
  OFF(b.hips,0,Math.abs(cw)*0.07*mv-0.035*mv,0); ADD(b.head,-0.06*mv-0.04*Math.abs(cw)*mv,-sw*0.06*mv,0);
  ADD(b.skirt,-sw*0.12*mv,0,0); ADD(b.hair,0.25*mv+Math.sin(t*3)*0.04,0,0); ADD(b.tail,0.3*mv+Math.sin(t*2)*0.15,Math.sin(t*1.5)*0.2,0);
  for(const w of ['wingL','wingR']) if(b[w]){ const sd=w==='wingL'?1:-1; ADD(b[w],0,sd*(0.25+Math.sin(t*(mv?8:2.2))*(mv?0.35:0.12)),sd*Math.sin(t*(mv?8:2.2))*0.15); }
  if(b.orbit) b.orbit.rotation.y=t*0.6;
  /* attacks: each style has an anticipation pose and an impact pose; smooth weights carry the body
     from wind-up through the strike into a held follow-through and back to stance */
  const u=S.atkU; if(u>=0&&u<1){ const st=styleOf(I.sp,s.style), W=atkWeights(u,st); attackPose(st,b,W.a,W.h,mv); }
  /* boss casts */
  bossCast(I,s,b,(x,y,z,bn)=>ADD(b[bn],x,y,z));
  /* hit flinch */
  if(S.hit>0){ const k=S.hit; ADD(b.spine,-0.35*k,0,0.1*k); ADD(b.head,-0.3*k,0,0); OFF(b.root,0,0,-0.15*k); }
  if(s.stun) { ADD(b.head,0.3,Math.sin(t*6)*0.3,0); ADD(b.spine,0.2,0,0); }
}
function bossCast(I,s,b,add){ const S=I.st; if(!s.cast) return; const k=s.castKind, u=clamp(s.castU||0,0,1), e=sm(Math.min(1,u*1.4));
  if(I.kind!=='human') return;
  switch(k){
    case 'slam': add(-2.8*e,0,-0.2,'armR'); add(-2.8*e,0,0.2,'armL'); add(-0.3*e,0,0,'spine'); OFF(b.root,0,0.15*e,0); break;
    case 'volley': add(-1.5,0,-0.3+Math.sin(S.t*14)*0.3,'armR'); add(-1.5,0,0.3-Math.sin(S.t*14)*0.3,'armL'); add(0.1,0,0,'spine'); break;
    case 'line': add(-1.6*e,0,-0.1,'armR'); add(0.25*e,0,0,'spine'); add(-0.8*e,0,0,'thighL'); add(0.9*e,0,0,'kneeL'); break;
    case 'donut': add(-1.4*e,0,-1.0*e,'armR'); add(-1.4*e,0,1.0*e,'armL'); S.yaw+=0.4; break;
    case 'summon': add(-2.9*e,0,-0.5,'armR'); add(-2.9*e,0,0.5,'armL'); add(-0.3*e,0,0,'spine'); add(-0.4*e,0,0,'head'); break;
    case 'blink': add(0.5*e,0,0,'spine'); add(-0.6*e,0,0,'thighL'); add(-0.6*e,0,0,'thighR'); add(1.2*e,0,0,'kneeL'); add(1.2*e,0,0,'kneeR'); OFF(b.root,0,-0.25*e,0); break;
    case 'dash': add(0.55,0,0,'spine'); add(1.0,0,0,'armL'); add(1.0,0,0,'armR'); break;
  } }

function poseQuad(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const A=0.5*Math.min(1,mv*1.5), sw=Math.sin(ph);
  ADD(b.tFL,-sw*A,0,0); ADD(b.tBR,-sw*A,0,0); ADD(b.tFR,sw*A,0,0); ADD(b.tBL,sw*A,0,0);
  for(const [n,ph2] of [['FL',ph],['BR',ph],['FR',ph+Math.PI],['BL',ph+Math.PI]]) ADD(b['k'+n],Math.max(0,Math.cos(ph2))*A*1.2*(n[0]==='F'?1:-1),0,0);
  OFF(b.body,0,Math.abs(Math.cos(ph))*0.05*mv+Math.sin(t*2)*0.01,0); ADD(b.body,Math.sin(ph*2)*0.03*mv,0,0);
  ADD(b.neck,-0.1+Math.sin(t*1.7)*0.05,Math.sin(t*0.8)*0.15*(1-mv),0); ADD(b.head,0.1+Math.sin(t*2.3)*0.04,Math.sin(t*1.1)*0.2*(1-mv),0);
  for(let i=0;i<5;i++) ADD(b['tail'+i],(i===0?0.35:-0.08)+Math.sin(t*3-i*0.6)*0.06,Math.sin(t*2.5-i*0.7)*0.25,0);
  const u=S.atkU; if(u>=0&&u<1){ const W=atkWeights(u,'melee'), a=W.a, h=W.h;   /* crouch low, then pounce: claws reach, jaws lunge */
    ADD(b.body,0.15*a-0.2*h,0,0); ADD(b.front,0.25*a-0.3*h,0,0); ADD(b.neck,0.3*a-0.5*h,0,0); ADD(b.head,-0.2*a+0.35*h,0,0);
    ADD(b.tFL,0.4*a-1.1*h,0,0); ADD(b.tFR,0.4*a-1.0*h,0,0); ADD(b.kFL,0.6*a-0.3*h,0,0); ADD(b.kFR,0.6*a-0.3*h,0,0);
    ADD(b.tBL,-0.4*a+0.3*h,0,0); ADD(b.tBR,-0.4*a+0.3*h,0,0); ADD(b.kBL,-0.5*a,0,0); ADD(b.kBR,-0.5*a,0,0);
    OFF(b.root,0,-0.12*a+0.12*h,-0.1*a+0.55*h); for(let i=0;i<5;i++) ADD(b['tail'+i],0.15*a,0,0); }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); ADD(b.body,-0.5*e,0,0); OFF(b.body,0,0.25*e,0); ADD(b.tFL,-1.2*e,0,0); ADD(b.tFR,-1.0*e,0,0); ADD(b.neck,-0.5*e,0,0); ADD(b.head,-0.3*e,0,0); }
  if(S.hit>0) { ADD(b.body,0,0,0.15*S.hit); OFF(b.root,0,0,-0.15*S.hit); } }
function poseSerpent(I,s){ const b=I.b, S=I.st, t=S.t, n=I.B.b.heads, seg=I.B.b.seg;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  ADD(b.coil,0,Math.sin(t*0.6)*0.15,0); OFF(b.coil,0,Math.sin(t*1.5)*0.03,0);
  const u=S.atkU, atk=u>=0&&u<1?attackCurve(u):{wind:0,strike:0}, ce=s.cast?sm(Math.min(1,(s.castU||0)*1.4)):0;
  const k6=6/seg;   /* the same total sway whatever the neck length */
  for(let h=0;h<n;h++){ const off=h*1.7;
    for(let i=0;i<seg;i++){ const bn=b['n'+h+'_'+i]; ADD(bn,(Math.sin(t*1.6+off-i*0.5)*0.08+(i<2?0.06:0)-0.2*atk.wind+0.3*atk.strike*(i>2?1:0)-0.15*ce)*k6,Math.sin(t*1.1+off-i*0.6)*0.14*k6,Math.sin(t*0.9+off+i*0.4)*0.06*k6); }
    ADD(b['n'+h+'_H'],0.25+Math.sin(t*2+off)*0.1+0.4*atk.strike-0.4*ce,0,0); }
  if(b.orbB){ b.orbB.rotation.y=t*1.2; OFF(b.orbB,0,Math.sin(t*2)*0.08,0); }
  if(S.hit>0) ADD(b.coil,0,0,0.1*S.hit); }
function poseSpider(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  for(let i=0;i<8;i++){ const sd=i%2?-1:1, p=ph+(Math.floor(i/2)%2?Math.PI:0)+(i%2?Math.PI:0), lift=Math.max(0,Math.sin(p))*0.35*Math.min(1,mv*1.5);
    ADD(b['L'+i+'a'],0,Math.cos(p)*0.3*Math.min(1,mv*1.5),sd*lift); ADD(b['L'+i+'b'],0,0,sd*Math.sin(t*2+i)*0.03); }
  OFF(b.body,0,Math.sin(t*3)*0.02+Math.abs(Math.sin(ph))*0.04*mv,0); ADD(b.abd,Math.sin(t*1.8)*0.06,Math.sin(t*1.2)*0.08,0); ADD(b.head,Math.sin(t*2.2)*0.04,0,0);
  const u=S.atkU; if(u>=0&&u<1){ const {wind,strike}=attackCurve(u); for(const i of [0,1]){ const sd=i%2?-1:1; ADD(b['L'+i+'a'],-1.2*wind+0.4*strike,0,sd*0.6*wind); } OFF(b.root,0,0.1*wind,0.35*strike); }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); ADD(b.body,-0.4*e,0,0); OFF(b.body,0,0.2*e,0); }
  if(S.hit>0) OFF(b.root,0,0,-0.12*S.hit); }
function poseBlob(I,s){ const b=I.b, S=I.st, t=S.t;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  for(let i=0;i<4;i++) ADD(b['b'+i],Math.sin(t*1.4-i*0.6)*0.06,0,Math.sin(t*1.1-i*0.7)*0.08);
  const sq=1+Math.sin(t*2)*0.04; b.b0.scale.set(1/sq,sq,1/sq);
  const u=S.atkU, e=s.cast?sm(Math.min(1,(s.castU||0)*1.4)):0; let a=0; if(u>=0&&u<1){ const c=attackCurve(u); a=c.wind; ADD(b.b1,0.4*c.strike,0,0); ADD(b.b2,0.4*c.strike,0,0); }
  OFF(b.b3,0,0.25*(a+e),0); ADD(b.armL,-1.8*(a+e),0,0); ADD(b.armR,-1.8*(a+e),0,0);
  ADD(b.armL,0,0,Math.sin(t*1.3)*0.15); ADD(b.armR,0,0,-Math.sin(t*1.3+1)*0.15); }
function poseFish(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const f=t*(2+3*mv); for(let i=1;i<4;i++) ADD(b['f'+i],0,Math.sin(f-i*0.8)*0.18*(0.5+mv),0);
  OFF(b.f0,0,Math.sin(t*1.5)*0.05+Math.abs(Math.sin(f))*0.03*mv,0); ADD(b.f0,Math.sin(t*1.2)*0.03,Math.sin(f)*0.05,0);
  const u=S.atkU; if(u>=0&&u<1){ const c=attackCurve(u); ADD(b.f0,-0.3*c.wind+0.25*c.strike,0,0); OFF(b.root,0,0.2*c.wind,0.4*c.strike); }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); OFF(b.root,0,0.6*e,0); ADD(b.f0,-0.4*e,0,0); } }
/* critically damped spring on every bone: velocity stays continuous, so poses flow into each other instead of popping */
/* v82: hair, sleeves-skirt, tails and wings use a looser spring so they trail behind the body (follow-through);
   during the strike window the body spring stiffens so the blow snaps into its key pose instead of easing in */
const SECONDARY=/^(hair|skirt|tail\d*|wing[LR])$/;
function smoothPose(I,dt,snap){ const wB=24+46*(snap||0), wS=11, P=I.prev||(I.prev={}), h=Math.min(dt,0.07), n2=Math.max(1,Math.ceil(h/0.0084)), sdt=h/n2;
  for(const n in I.b){ const bn=I.b[n]; let pr=P[n]; const w=SECONDARY.test(n)?wS:wB;
    const tr=[bn.rotation.x,bn.rotation.y,bn.rotation.z,bn.position.x,bn.position.y,bn.position.z];
    if(!pr){ P[n]={x:tr.slice(),v:[0,0,0,0,0,0]}; continue; }
    for(let c=0;c<6;c++){ let tgt=tr[c]; if(c<3){ let d=tgt-pr.x[c]; d=Math.atan2(Math.sin(d),Math.cos(d)); tgt=pr.x[c]+d; }
      for(let k=0;k<n2;k++){ const a=w*w*(tgt-pr.x[c])-2*w*pr.v[c]; pr.v[c]+=a*sdt; pr.x[c]+=pr.v[c]*sdt; } }
    bn.rotation.set(pr.x[0],pr.x[1],pr.x[2]); bn.position.set(pr.x[3],pr.x[4],pr.x[5]); } }
/* ================================================================ v88 KAIJU: building-sized colossi (ten bosses, all recruitable as heroes)
   Code-built like every other character: skinned parts on a bone tree, cel-shaded and inked.
   Five stand on two legs (saurian, cyclops, roc, skeleton, castle) and share one biped skeleton; the rest have their own. */
const KJV={};
const kTube=(R,bone,pts,r0,r1,col,o)=>R.add(bone,G_.tube(pts,r0,r1,(o&&o.rs)||7,(o&&o.seg)||10),col,o);
/* a cone leaning to a direction (tip along +Y, tilted by rx about X, rz about Z) */
const kSpike=(R,bone,r,h,col,p,rx,rz,o)=>R.add(bone,G_.cone(r,h,(o&&o.rs)||5),col,Object.assign({p:[p[0],p[1]+h*0.5*Math.cos(rx||0),p[2]+h*0.5*Math.sin(rx||0)],r:[rx||0,0,rz||0]},o||{}));
function kBipedBones(R,o){
  const legH=o.L1+o.L2+(o.ft||0.3);
  R.bone('pelvis','root',[0,legH,-0.2]);
  R.bone('spine','pelvis',[0,o.tH*0.42,0.25]); R.bone('chest','spine',[0,o.tH*0.5,0.15]);
  R.bone('neck','chest',[0,o.tH*0.42,o.neckZ!=null?o.neckZ:0.3]); R.bone('head','neck',[0,o.nk,o.headZ!=null?o.headZ:0.45]);
  R.bone('jaw','head',[0,-o.hr*0.38,o.hr*0.3]);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    R.bone('thigh'+n,'pelvis',[sd*o.hw,-0.15,0.05]); R.bone('shin'+n,'thigh'+n,[0,-o.L1,0.05]); R.bone('foot'+n,'shin'+n,[0,-o.L2,-0.05]);
    if(o.aU){ R.bone('arm'+n,'chest',[sd*o.cw,o.tH*0.32,0.1]); R.bone('fore'+n,'arm'+n,[0,-o.aU,0]); R.bone('hand'+n,'fore'+n,[0,-o.aF,0.05]); } }
  let p='pelvis'; for(let i=0;i<6;i++){ R.bone('tail'+i,p,[0,i?-0.02:0.05,i?-o.tl:-0.45]); p='tail'+i; }
  return legH;
}
function kLegs(R,o){ const c=o.col;
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    R.add('thigh'+n,G_.sph(o.thR*1.2,o.thR*1.1,o.thR*1.2),c,{});
    R.add('thigh'+n,G_.cap(o.thR,Math.max(0.1,o.L1-o.thR*1.6),10),c,{p:[0,-o.L1*0.5,0],grad:o.belly,gax:1.5});
    R.add('shin'+n,G_.sph(o.shR*1.15,o.shR*1.1,o.shR*1.15),c,{});
    R.add('shin'+n,G_.cap(o.shR,Math.max(0.1,o.L2-o.shR*1.6),10),c,{p:[0,-o.L2*0.5,0],grad:o.belly});
    const fl=o.fl||1.1, fr=o.fr||0.5;
    R.add('foot'+n,G_.sph(fr*0.95,fr*0.5,fl*0.62),o.foot||c,{p:[0,-0.12,fl*0.35]});
    for(let k=-1;k<=1;k++) R.add('foot'+n,G_.cone(fr*0.2,fl*0.55,5),o.claw||0xF2EAD8,{p:[k*fr*0.55,-0.14,fl*0.98],r:[Math.PI/2,0,0]}); } }
function kArms(R,o,claws){ const c=o.col, r=o.arR;
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    R.add('arm'+n,G_.sph(r*1.4,r*1.3,r*1.4),c,{});
    R.add('arm'+n,G_.cap(r,Math.max(0.1,o.aU-r*1.6),9),c,{p:[0,-o.aU*0.5,0],grad:o.belly,gax:1.5});
    R.add('fore'+n,G_.sph(r*1.1,r*1.05,r*1.1),c,{});
    R.add('fore'+n,G_.cap(r*0.92,Math.max(0.1,o.aF-r*1.6),9),c,{p:[0,-o.aF*0.5,0]});
    R.add('hand'+n,G_.sph(r*1.25,r*1.1,r*1.15),o.hand||c,{p:[0,-r*0.5,0.05]});
    if(claws!==false) for(let k=-1;k<=1;k++) R.add('hand'+n,G_.cone(r*0.2,r*1.5,5),o.claw||0xF2EAD8,{p:[k*r*0.55,-r*1.45,r*0.5],r:[Math.PI-0.7,0,0]}); } }
function kTail(R,o,c,grad,n0){ for(let i=0;i<6;i++){ const r=o.tr*(1-i*0.15); R.add('tail'+i,G_.sph(r,r*0.95,o.tl*0.62,12,8),c,{p:[0,0,-o.tl*0.5],grad:i>2?grad:null}); } }
function kEyeGlow(R,bone,x,y,z,r,col,tilt){ R.add(bone,G_.sph(r*1.1,r*0.55,r*0.4,10,8),col,{p:[x,y,z],r:[0,0,tilt||0],glow:true,ol:false,grad:0xFFFFFF}); }
function kTeeth(R,bone,n,x0,x1,z0,z1,y,sz,col,up){ for(let i=0;i<n;i++){ const t=n>1?i/(n-1):0.5, z=z0+(z1-z0)*t, x=x0+(x1-x0)*t;
    for(const sd of [1,-1]) R.add(bone,G_.cone(sz*0.5,sz*(1.1-0.4*Math.abs(t-0.4)),4),col,{p:[sd*x,y,z],r:[up?0:Math.PI,0,0],ol:false}); } }
/* sacred rope (shimenawa) with paper streamers: marks a creature as a kami */
function kShime(R,bone,rad,p,col,paper){ R.add(bone,G_.tor(rad,rad*0.1,6,24),col||0xD8C8A0,{p,r:[Math.PI/2,0,0]});
  for(let i=0;i<4;i++){ const a=(i-1.5)*0.5; R.add(bone,G_.shape([[0,0],[0.32,0],[0.32,-0.3],[0.12,-0.42],[0.32,-0.58],[0.12,-0.7],[0.32,-0.85],[0,-0.85]],0.03,0.005),paper||0xFFFFFF,{p:[p[0]+Math.sin(a)*rad,p[1]-0.08,p[2]+Math.cos(a)*rad],r:[0,a,0],ol:false}); } }

/* ---- 1. GOKARYU, the ember saurian: charcoal hide, plates tipped with fire, a straw rope round its neck */
KJV.saurian=function(sp){
  const R=new Rig(), c=sp.col||0x3B3550, c2=sp.col2||0x6A5C80, belly=sp.belly||0xC08A62, em=sp.ember||0xFF6A1F, hot=0xFFD04A;
  const o={L1:2.1,L2:2.0,ft:0.3,tH:3.4,hw:1.15,cw:1.9,nk:1.3,hr:1.85,aU:1.15,aF:1.1,tl:1.2,tr:1.35,thR:1.0,shR:0.7,arR:0.4,col:c,belly,fl:1.6,fr:0.65,foot:c,claw:0xF4E8D0};
  kBipedBones(R,o); kLegs(R,o); kArms(R,o); kTail(R,o,c,c2);
  R.add('pelvis',G_.sph(1.45,1.2,1.65,18,12),c,{grad:belly,gax:2.4});
  R.add('spine',G_.sph(1.6,1.5,1.6,18,12),c,{grad:belly,gax:2.2});
  R.add('chest',G_.sph(2.0,1.75,1.75,18,12),c,{grad:belly,gax:2.2});
  for(let i=0;i<5;i++){ const y=0.95-i*0.5, z=1.7*Math.sqrt(Math.max(0.05,1-(y/1.75)**2))*0.98; R.add('chest',G_.sph(1.0-Math.abs(y)*0.18,0.15,0.3),shade(belly,1.2),{p:[0,y,z],ol:false}); }
  /* dorsal plates tipped with ember */
  const plate=(bone,x,y,z,s)=>{ s*=1.5; R.add(bone,G_.cone(s*0.55,s*1.7,4),c2,{p:[x,y+s*0.8,z],r:[-0.5,0,0],s:[0.42,1,1],grad:shade(c2,0.7)});
    R.add(bone,G_.cone(s*0.3,s*0.55,4),em,{p:[x,y+s*1.55,z-s*0.5],r:[-0.5,0,0],s:[0.5,1,1],glow:true,ol:false,grad:hot}); };
  plate('chest',0,1.2,-1.35,1.0); plate('chest',0,0.2,-1.65,1.25); plate('chest',0,-0.8,-1.6,1.15); plate('spine',0,0.2,-1.4,1.0); plate('pelvis',0,0.5,-1.45,0.9);
  for(let i=0;i<5;i++) plate('tail'+i,0,0.55-i*0.07,-0.3,0.85-i*0.14);
  for(const sd of [1,-1]){ plate('chest',sd*1.25,0.75,-1.05,0.6); plate('spine',sd*1.1,0.2,-1.0,0.55); }
  /* lava seams */
  for(const sd of [1,-1]){ kTube(R,'chest',[[sd*0.9,1.2,1.35],[sd*1.1,0.5,1.45],[sd*0.95,-0.1,1.5],[sd*1.15,-0.8,1.3]],0.07,0.03,em,{glow:true,ol:false,rs:5,seg:8});
    kTube(R,'thigh'+(sd>0?'L':'R'),[[sd*0.2,-0.2,0.85],[sd*0.45,-0.9,0.8],[sd*0.3,-1.6,0.7]],0.06,0.03,em,{glow:true,ol:false,rs:5,seg:8}); }
  /* neck, rope, head */
  R.add('neck',G_.cap(1.05,0.8,10),c,{p:[0,0.45,0.2],r:[0.45,0,0],grad:belly,gax:2});
  kShime(R,'neck',1.22,[0,0.35,0.15],0xD8C8A0,0xFFFFFF);
  const hr=o.hr;
  R.add('head',G_.sph(hr*0.95,hr*0.82,hr*1.15,18,14),c,{p:[0,0.05,0.1],grad:c2,gax:1.5});
  R.add('head',G_.sph(hr*0.72,hr*0.5,hr*1.05,16,12),c,{p:[0,-0.08,hr*1.2]});
  for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.12,hr*0.09,hr*0.1,6,5),0x120E14,{p:[sd*hr*0.26,hr*0.14,hr*2.2],ol:false});
    R.add('head',G_.sph(hr*0.26,hr*0.07,hr*0.34),shade(c,0.6),{p:[sd*hr*0.5,hr*0.58,hr*0.82],r:[0.35,0,sd*-0.45]});
    kEyeGlow(R,'head',sd*hr*0.46,hr*0.34,hr*1.06,hr*0.3,hot,sd*-0.55);
    R.add('head',G_.cone(hr*0.2,hr*1.3,6),0xE8DCC0,{p:[sd*hr*0.55,hr*0.95,-hr*0.45],r:[-1.0,0,sd*-0.35],grad:0xA89878});
    R.add('head',G_.cone(hr*0.1,hr*0.7,5),0xE8DCC0,{p:[sd*hr*0.82,hr*0.35,-hr*0.5],r:[-0.5,0,sd*-1.2],ol:false}); }
  R.add('head',G_.sph(hr*0.52,hr*0.16,hr*1.0),em,{p:[0,-hr*0.5,hr*0.95],glow:true,ol:false,grad:hot});
  kTeeth(R,'head',6,hr*0.55,hr*0.42,hr*0.55,hr*1.95,-hr*0.5,hr*0.34,0xFFFFFF,false);
  R.add('jaw',G_.sph(hr*0.62,hr*0.25,hr*1.3),c,{p:[0,-hr*0.05,hr*0.8],grad:belly,gax:1.5});
  kTeeth(R,'jaw',5,hr*0.48,hr*0.38,hr*0.35,hr*1.5,hr*0.2,hr*0.3,0xFFFFFF,true);
  return {rig:R,kind:'kaiju',var:'biped'};
};

/* ---- 2. HITOTSUME, the one-eyed colossus: blue-skinned ogre with an iron-studded kanabo */
KJV.cyclops=function(sp){
  const R=new Rig(), c=sp.col||0x4C6FA8, belly=sp.belly||0x8FB0D8, ink=0x1B2540, cloth=0xE8B820;
  const o={L1:1.9,L2:1.8,ft:0.3,tH:3.7,hw:1.2,cw:2.15,nk:1.7,hr:1.45,aU:2.1,aF:2.0,tl:0.5,tr:0.5,thR:1.1,shR:0.85,arR:0.78,col:c,belly,fl:1.3,fr:0.8,foot:c,claw:0xE8DCC0,neckZ:0.5,headZ:0.5};
  kBipedBones(R,o); kLegs(R,o); kArms(R,o,false);
  R.add('pelvis',G_.sph(1.75,1.3,1.6,18,12),c,{grad:belly,gax:2});
  R.add('spine',G_.sph(2.0,1.8,1.75,18,12),c,{grad:belly,gax:2});
  R.add('chest',G_.sph(2.5,1.9,1.9,18,12),c,{grad:belly,gax:2});
  for(const sd of [1,-1]){ R.add('chest',G_.sph(0.95,0.8,0.8),c,{p:[sd*0.85,0.5,1.45],grad:belly}); R.add('arm'+(sd>0?'L':'R'),G_.sph(1.3,1.1,1.2),c,{p:[sd*0.2,0.25,0]}); }
  R.add('spine',G_.sph(0.2,0.12,0.1),ink,{p:[0,0.2,1.75],ol:false});
  /* tiger-skin loincloth */
  R.add('pelvis',G_.cyl(1.9,2.3,1.5,14),cloth,{p:[0,-0.55,0],s:[1,1,0.92],grad:shade(cloth,0.85)});
  for(let i=0;i<12;i++){ const a=i/12*TAU; R.add('pelvis',G_.shape([[0,0],[0.5,0.18],[0.9,0],[0.45,-0.12]],0.05,0.01),ink,{p:[Math.sin(a)*2.05,-0.35-(i%3)*0.3,Math.cos(a)*1.9],r:[0,a,0.3*Math.sin(i)],ol:false}); }
  R.add('pelvis',G_.tor(2.05,0.12,5,20),0xF4EFE0,{p:[0,0.2,0],r:[Math.PI/2,0,0]});
  /* prayer-bead necklace */
  for(let i=0;i<11;i++){ const a=-1.1+i*0.22; R.add('chest',G_.sph(0.3,0.3,0.3,8,6),i%3===1?0xD8342C:0xF2E8D0,{p:[Math.sin(a)*2.0,0.9-Math.cos(a*0.9)*0.9,Math.cos(a)*1.55],ol:true}); }
  R.add('neck',G_.cap(1.25,0.6,10),c,{p:[0,0.35,0.2],r:[0.3,0,0]});
  const hr=o.hr;
  R.add('head',G_.sph(hr*1.0,hr*0.95,hr*0.95,18,14),c,{grad:shade(c,1.15),gax:1.5});
  R.add('head',G_.sph(hr*0.95,hr*0.2,hr*0.6),shade(c,0.8),{p:[0,hr*0.5,hr*0.62],r:[0.3,0,0]});
  /* the single eye */
  R.add('head',G_.sph(hr*0.52,hr*0.4,hr*0.2,14,10),0xFFF6D8,{p:[0,hr*0.22,hr*0.82],ol:true});
  R.add('head',G_.sph(hr*0.3,hr*0.3,hr*0.14,12,10),0xFFC02A,{p:[0,hr*0.2,hr*0.95],glow:true,ol:false,grad:0xFFFFFF});
  R.add('head',G_.sph(hr*0.07,hr*0.28,hr*0.1,6,8),0x120C0C,{p:[0,hr*0.2,hr*1.03],ol:false});
  R.add('head',G_.sph(hr*0.16,hr*0.22,hr*0.2),shade(c,0.9),{p:[0,-hr*0.12,hr*0.95]});
  for(const sd of [1,-1]){ R.add('head',G_.cone(hr*0.25,hr*1.1,6),0xEDE6D0,{p:[sd*hr*0.55,hr*1.0,hr*0.05],r:[-0.2,0,sd*-0.4],grad:0xB8A888});
    R.add('head',G_.sph(hr*0.16,hr*0.34,hr*0.1),c,{p:[sd*hr*1.0,hr*0.05,-hr*0.05]}); R.add('head',G_.tor(hr*0.18,hr*0.04,4,12),GLD,{p:[sd*hr*1.05,-hr*0.2,-hr*0.05],r:[0,Math.PI/2,0]}); }
  R.add('head',G_.sph(hr*1.05,hr*0.55,hr*0.75),0x14121A,{p:[0,hr*0.55,-hr*0.35]});
  for(let i=0;i<9;i++){ const a=(i-4)*0.3; kTube(R,'head',[[Math.sin(a)*hr*0.7,hr*0.9,-hr*0.1],[Math.sin(a)*hr*1.0,hr*1.2,-hr*0.5],[Math.sin(a)*hr*1.3,hr*0.9,-hr*1.1]],hr*0.16,hr*0.03,0x14121A,{rs:5,seg:6}); }
  R.add('head',G_.sph(hr*0.7,hr*0.3,hr*0.5),shade(c,0.8),{p:[0,-hr*0.55,hr*0.35]});
  R.add('jaw',G_.sph(hr*0.78,hr*0.34,hr*0.8),c,{p:[0,-hr*0.05,hr*0.5],grad:belly,gax:1.5});
  for(const sd of [1,-1]) R.add('jaw',G_.cone(hr*0.13,hr*0.6,5),0xF4EFE0,{p:[sd*hr*0.5,hr*0.38,hr*0.9],r:[-0.1,0,sd*0.15]});
  /* the club, dragged by the right hand */
  R.add('handR',G_.cyl(0.26,0.32,4.6,10),0x3A2A1E,{p:[0,-2.0,0.2],grad:0x5A4430});
  R.add('handR',G_.cyl(0.95,0.6,2.4,10),0x2E3138,{p:[0,-4.7,0.2],grad:0x4A4E58});
  for(let i=0;i<14;i++){ const a=i/14*TAU, y=-4.2-((i%3)*0.7); R.add('handR',G_.cone(0.16,0.55,5),0x9AA0AA,{p:[Math.sin(a)*0.9,y,0.2+Math.cos(a)*0.9],r:[Math.PI/2*Math.cos(a)*1.0,0,-Math.PI/2*Math.sin(a)],ol:true}); }
  R.add('handR',G_.sph(0.62,0.3,0.62),0x2E3138,{p:[0,-5.9,0.2]});
  /* tail stub: a bundle of rope */
  for(let i=0;i<3;i++) R.add('pelvis',G_.sph(0.3,0.3,0.5),cloth,{p:[(i-1)*0.4,-0.8,-1.8]});
  return {rig:R,kind:'kaiju',var:'biped'};
};

/* ---- 3. OTORI, the storm roc: indigo plumage, golden flight feathers, thunder crest */
KJV.roc=function(sp){
  const R=new Rig(), c=sp.col||0x233470, c2=sp.col2||0x3E58B0, gold=0xF5C542, white=0xF4F8FF, bolt=0xFFF27A;
  const o={L1:1.7,L2:2.7,ft:0.2,tH:3.1,hw:0.95,cw:1.6,nk:1.0,hr:0.95,aU:0,aF:0,tl:0.9,tr:0.8,thR:0.95,shR:0.5,col:c,belly:white,fl:1.5,fr:0.34,foot:gold,claw:0x2A2A32,neckZ:0.55,headZ:0.55};
  kBipedBones(R,o); kLegs(R,o);
  R.add('pelvis',G_.sph(1.3,1.1,1.5,18,12),c,{grad:white,gax:2});
  R.add('spine',G_.sph(1.5,1.45,1.5,18,12),c,{grad:white,gax:2});
  R.add('chest',G_.sph(1.85,1.7,1.7,18,12),c,{grad:white,gax:2});
  /* breast feathers */
  for(let r=0;r<4;r++) for(let k=0;k<7;k++){ const a=(k-3)*0.34+(r%2)*0.17, y=1.0-r*0.55; R.add('chest',G_.leaf(0.3,0.75,0.02),r<2?white:shade(white,0.92),{p:[Math.sin(a)*1.55,y,1.2+Math.cos(a)*0.4],r:[Math.PI-0.5,a,0],ol:false}); }
  R.add('neck',G_.cap(0.85,0.9,10),c,{p:[0,0.55,0.3],r:[0.55,0,0],grad:white});
  for(let k=0;k<9;k++){ const a=k/9*TAU; R.add('neck',G_.leaf(0.28,0.95,0.02),k%2?c2:white,{p:[Math.sin(a)*0.85,0.4,Math.cos(a)*0.85+0.2],r:[Math.PI-0.8,a,0],ol:false}); }
  const hr=o.hr;
  R.add('head',G_.sph(hr*0.85,hr*0.82,hr*1.0,16,12),c,{grad:c2,gax:1.5});
  R.add('head',G_.cone(hr*0.55,hr*1.5,6),gold,{p:[0,-hr*0.1,hr*1.35],r:[Math.PI/2+0.25,0,0],s:[0.9,1,1.15],grad:0xB88810});
  R.add('head',G_.cone(hr*0.18,hr*0.65,5),gold,{p:[0,-hr*0.5,hr*2.0],r:[Math.PI-0.2,0,0],ol:false});
  for(const sd of [1,-1]){ kEyeGlow(R,'head',sd*hr*0.55,hr*0.3,hr*0.62,hr*0.26,0x6FE3FF,sd*-0.35);
    R.add('head',G_.sph(hr*0.3,hr*0.1,hr*0.4),0x14183A,{p:[sd*hr*0.55,hr*0.58,hr*0.5],r:[0.2,0,sd*-0.35]}); }
  /* crest of lightning-yellow plumes */
  for(let k=0;k<6;k++){ const a=(k-2.5)*0.3; R.add('head',G_.leaf(0.2,1.6+0.2*Math.cos(k),0.02),k%2?bolt:gold,{p:[Math.sin(a)*hr*0.4,hr*0.7,-hr*0.2],r:[-0.5-0.12*k,0,-a],ol:true}); }
  R.add('jaw',G_.cone(hr*0.4,hr*1.1,6),gold,{p:[0,-hr*0.02,hr*0.9],r:[Math.PI/2-0.05,0,0],s:[0.9,1,0.6],grad:0xB88810});
  /* wings: shoulder -> wrist; long flight feathers fan off the wrist, shorter ones off the arm */
  for(const sd of [1,-1]){ const n=sd>0?'L':'R', W1=3.4, W2=3.6;
    R.bone('wing'+n,'chest',[sd*1.45,0.95,-0.15]); R.bone('wing2'+n,'wing'+n,[sd*W1,0,-0.1]);
    R.add('wing'+n,G_.tube([[0,0,0],[sd*1.2,0.15,-0.05],[sd*W1,0,-0.1]],0.5,0.36,8,8),c,{});
    R.add('wing2'+n,G_.tube([[0,0,0],[sd*1.6,-0.05,-0.05],[sd*W2,-0.25,-0.1]],0.36,0.18,7,8),c,{});
    R.add('wing'+n,G_.sph(0.62,0.58,0.62),c,{});
    for(let k=0;k<8;k++){ const t=k/7, x=sd*(0.5+t*(W1-0.5)); R.add('wing'+n,G_.leaf(0.42,2.9-0.5*t,0.02),k%2?c2:c,{p:[x,0.02,-0.3],r:[-Math.PI/2,0,-sd*(0.05+0.3*t)],grad:white,gax:1.4,ol:false}); }
    for(let k=0;k<10;k++){ const t=k/9; R.add('wing2'+n,G_.leaf(0.44,4.3-1.5*t,0.02),k%2?gold:c2,{p:[sd*(0.1+t*W2*0.9),-0.04,-0.2],r:[-Math.PI/2,0,-sd*(0.2+0.85*t)],grad:k%2?white:gold,gax:1.2,ol:false}); }
    kSpike(R,'wing2'+n,0.14,0.8,gold,[sd*W2,-0.25,-0.1],0,sd*-1.57); }
  /* tail fan */
  for(let k=0;k<7;k++){ const a=(k-3)*0.2; R.add('tail1',G_.leaf(0.34,3.0-Math.abs(k-3)*0.35,0.02),k%2?gold:c2,{p:[0,0.1,-0.2],r:[-Math.PI/2-0.2,0,-a],grad:white,gax:1.4,ol:false}); }
  for(let i=0;i<3;i++) R.add('tail'+i,G_.sph(0.7-i*0.12,0.45,o.tl*0.62),c,{p:[0,0,-o.tl*0.5]});
  /* thighs wrapped in feathered trousers */
  for(const sd of [1,-1]) for(let k=0;k<6;k++){ const y=-0.2-k*0.28; R.add('thigh'+(sd>0?'L':'R'),G_.leaf(0.28,0.9,0.02),k%2?c2:white,{p:[sd*0.1+Math.sin(k)*0.2,y,-0.7],r:[Math.PI+0.3,0,sd*0.2],ol:false}); }
  return {rig:R,kind:'kaiju',var:'roc'};
};

/* ---- 4. ODOKURO, the famine skeleton: gaunt, bone-white, with a violet soul-fire burning in its ribs */
KJV.skeleton=function(sp){
  const R=new Rig(), bone=sp.col||0xE9E2CF, dk=0x2A2234, fire=0xB070FF, hotf=0xE8C8FF;
  const o={L1:2.6,L2:2.6,ft:0.3,tH:3.6,hw:0.95,cw:1.55,nk:0.9,hr:1.5,aU:2.4,aF:2.3,tl:0.6,tr:0.2,thR:0.5,shR:0.4,arR:0.4,col:bone,belly:shade(bone,0.82),fl:1.3,fr:0.34,foot:bone,claw:0xCFC6AE,hand:bone,neckZ:0.4,headZ:0.4};
  kBipedBones(R,o); kLegs(R,o); kArms(R,o,false);
  /* pelvis: two iliac wings and a sacrum */
  for(const sd of [1,-1]) R.add('pelvis',G_.sph(0.8,0.7,0.35),bone,{p:[sd*0.75,0.25,0.1],r:[0.3,sd*0.5,sd*0.5],grad:shade(bone,0.8)});
  R.add('pelvis',G_.sph(0.5,0.6,0.35),bone,{p:[0,0.0,-0.35]});
  /* spine: stacked vertebrae with spikes */
  for(let i=0;i<9;i++){ const t=i/8, b=t<0.4?'spine':'chest', y=t<0.4?-0.2+t*2.3:-0.9+(t-0.4)*3.2; R.add(b,G_.sph(0.34,0.28,0.34,8,6),bone,{p:[0,y,-0.9],grad:shade(bone,0.85)});
    kSpike(R,b,0.1,0.55,bone,[0,y+0.1,-1.15],-0.9,0,{ol:false}); }
  /* ribs: curved bars that wrap round the soul-fire */
  for(let i=0;i<6;i++){ const y=1.15-i*0.5, rr=1.25-Math.abs(i-1.4)*0.1; R.add('chest',G_.tor(rr,0.085,5,18,Math.PI*1.7),bone,{p:[0,y,0.05],r:[Math.PI/2,0,-0.35*Math.PI],s:[1,0.82,1],ol:true}); }
  R.add('chest',G_.sph(0.9,1.3,0.7,12,10),fire,{p:[0,0.2,0.1],glow:true,ol:false,grad:hotf});
  R.add('chest',G_.cap(0.14,2.0,6),bone,{p:[0,0.1,1.2],ol:true});
  for(const sd of [1,-1]){ R.add('chest',G_.sph(0.28,0.28,1.0),bone,{p:[sd*1.5,1.7,-0.1],r:[0,0,sd*0.0],grad:shade(bone,0.85)}); R.add('arm'+(sd>0?'L':'R'),G_.sph(0.65,0.5,0.55),bone,{p:[sd*0.25,0.25,-0.1]});
    R.add('arm'+(sd>0?'L':'R'),G_.cone(0.2,0.9,5),bone,{p:[sd*0.5,0.9,-0.1],r:[0,0,sd*-0.7]}); }
  /* long fingers */
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; for(let k=0;k<4;k++){ const x=(k-1.5)*0.2; kTube(R,'hand'+n,[[x,-0.1,0.0],[x*1.3,-0.9,0.25],[x*1.5,-1.7,0.6]],0.07,0.03,bone,{rs:5,seg:5}); }
    kTube(R,'hand'+n,[[sd*0.2,-0.1,0.1],[sd*0.55,-0.6,0.4],[sd*0.6,-1.1,0.8]],0.07,0.03,bone,{rs:5,seg:5}); }
  /* neck vertebrae and skull */
  for(let i=0;i<4;i++) R.add('neck',G_.sph(0.3-i*0.0,0.24,0.3,8,6),bone,{p:[0,0.1+i*0.28,0.18+i*0.1]});
  const hr=o.hr;
  R.add('head',G_.sph(hr*0.95,hr*0.9,hr*1.05,16,12),bone,{p:[0,0.15,0],grad:shade(bone,0.78),gax:1.4});
  R.add('head',G_.sph(hr*0.7,hr*0.55,hr*0.7),bone,{p:[0,-hr*0.35,hr*0.55]});
  for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.36,hr*0.34,hr*0.3),dk,{p:[sd*hr*0.42,hr*0.15,hr*0.78],ol:false});
    R.add('head',G_.sph(hr*0.17,hr*0.17,hr*0.14),fire,{p:[sd*hr*0.42,hr*0.15,hr*0.95],glow:true,ol:false,grad:hotf});
    R.add('head',G_.sph(hr*0.25,hr*0.2,hr*0.3),bone,{p:[sd*hr*0.78,-hr*0.2,hr*0.55],grad:shade(bone,0.85)});
    R.add('head',G_.cone(hr*0.25,hr*1.5,6),bone,{p:[sd*hr*0.6,hr*0.95,-hr*0.15],r:[-0.3,0,sd*-0.55],grad:shade(bone,0.7)}); }
  R.add('head',G_.cone(hr*0.16,hr*0.34,3),dk,{p:[0,-hr*0.08,hr*1.12],r:[Math.PI,0,0],ol:false});
  for(let i=0;i<8;i++){ R.add('head',G_.box(hr*0.13,hr*0.22,hr*0.1),0xF8F2E0,{p:[(i-3.5)*hr*0.17,-hr*0.55,hr*0.78+Math.abs(i-3.5)*-hr*0.03],ol:false}); }
  R.add('jaw',G_.sph(hr*0.6,hr*0.2,hr*0.9),bone,{p:[0,-hr*0.02,hr*0.55],grad:shade(bone,0.8)});
  for(let i=0;i<7;i++) R.add('jaw',G_.box(hr*0.13,hr*0.2,hr*0.1),0xF8F2E0,{p:[(i-3)*hr*0.16,hr*0.18,hr*0.95-Math.abs(i-3)*hr*0.06],ol:false});
  /* soul-fire halo and tattered monk's cloth */
  for(let i=0;i<7;i++){ const a=i/7*TAU; R.add('head',G_.sph(hr*0.22,hr*0.34,hr*0.2,8,6),fire,{p:[Math.sin(a)*hr*1.8,hr*1.7+Math.cos(a)*hr*1.0-hr*0.6,-hr*1.1],glow:true,ol:false,grad:hotf}); }
  for(let i=0;i<5;i++){ const x=(i-2)*0.55; kTube(R,'chest',[[x,1.9,0.2],[x*1.15,0.9,0.7+Math.cos(i)*0.1],[x*1.3,-0.4,0.55],[x*1.4,-1.5,0.4]],0.22,0.06,0x3A2A55,{rs:5,seg:8,grad:0x6A4E8C}); }
  for(let i=0;i<3;i++) R.add('tail'+i,G_.sph(0.12,0.12,0.2),bone,{p:[0,0,-0.35]});
  return {rig:R,kind:'kaiju',var:'biped'};
};

/* ---- 5. OSHIRO, the walking castle: a stone-wall base, white plaster tiers, tiled roofs and an oni at the gate */
KJV.castle=function(sp){
  const R=new Rig(), stone=0x8C9098, stone2=0x5E626C, plaster=0xF2EEE2, tile=0x2F3C4E, red=0xC8241E, gold=0xF5C542, iron=0x2C2E36, glowc=0xFFB03A;
  const o={L1:1.9,L2:1.9,ft:0.3,tH:3.0,hw:1.55,cw:3.0,nk:-0.9,hr:1.6,aU:2.6,aF:2.4,tl:0.5,tr:0.5,thR:0.85,shR:0.8,arR:0.8,col:stone,belly:stone2,fl:1.6,fr:0.95,foot:stone2,claw:gold,hand:iron,neckZ:1.55,headZ:0.5};
  kBipedBones(R,o);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    R.add('thigh'+n,G_.cyl(0.95,1.05,2.1,10),stone,{p:[0,-1.0,0],grad:stone2}); R.add('thigh'+n,G_.tor(1.0,0.1,5,16),gold,{p:[0,-0.2,0],r:[Math.PI/2,0,0]});
    R.add('shin'+n,G_.cyl(0.95,0.8,2.0,10),stone,{p:[0,-0.95,0],grad:stone2}); R.add('shin'+n,G_.sph(1.0,0.7,1.0),stone2,{p:[0,0.05,0]});
    R.add('foot'+n,G_.box(1.9,0.6,2.8),stone2,{p:[0,-0.15,0.6]}); R.add('foot'+n,G_.box(2.0,0.14,2.9),gold,{p:[0,-0.42,0.6],ol:false});
    for(let k=0;k<3;k++) R.add('foot'+n,G_.cone(0.2,0.7,4),gold,{p:[(k-1)*0.6,-0.15,2.2],r:[Math.PI/2,0,0]}); }
  /* base: sloped stone wall */
  R.add('pelvis',G_.box(5.6,1.2,3.8),stone2,{p:[0,0,0]});
  R.add('spine',G_.cyl(2.9,3.7,2.8,4),stone,{p:[0,0.2,0],r:[0,Math.PI/4,0],s:[1,1,0.74],grad:stone2,gax:1.4});
  for(let i=0;i<6;i++){ const y=-0.9+i*0.45; for(const sd of [1,-1]) R.add('spine',G_.box(0.05,0.03,2.4),0x4A4E58,{p:[sd*(3.3-i*0.1),y,0],ol:false}); }
  /* tier 2 */
  R.add('chest',G_.box(5.2,2.2,3.6),plaster,{p:[0,0.2,0],grad:0xDAD4C2,gax:1.6});
  for(let i=0;i<4;i++) R.add('chest',G_.box(0.18,2.2,3.7),0x3A2A22,{p:[(i-1.5)*1.5,0.2,0],ol:false});
  R.add('chest',G_.box(5.4,0.22,3.8),0x3A2A22,{p:[0,-0.9,0],ol:false});
  const roof=(bone,w,d,y)=>{ R.add(bone,G_.cyl(w*0.45,w*1.0,0.9,4),tile,{p:[0,y,0],r:[0,Math.PI/4,0],s:[1,1,d/w],grad:shade(tile,1.6),gax:1.4});
    for(const sd of [1,-1]){ kSpike(R,bone,0.16,0.9,tile,[sd*w*0.74,y-0.2,0],0,sd*-1.0,{ol:false}); R.add(bone,G_.cone(0.2,0.7,5),gold,{p:[sd*w*0.42,y+0.75,0],r:[0.0,0,sd*-0.2]}); } };
  roof('chest',3.5,2.45,1.75);
  /* tier 3 and 4 climb the back, one on top of the other */
  R.add('chest',G_.box(3.6,1.8,2.6),plaster,{p:[0,2.55,-0.1],grad:0xDAD4C2});
  roof('chest',2.7,1.95,3.85);
  R.add('chest',G_.box(2.2,1.5,1.7),plaster,{p:[0,4.6,-0.1],grad:0xDAD4C2});
  roof('chest',1.9,1.5,5.75);
  /* shachihoko crown */
  for(const sd of [1,-1]){ R.add('chest',G_.sph(0.2,0.5,0.2),gold,{p:[sd*0.65,6.7,-0.1],r:[0,0,sd*-0.35]}); kSpike(R,'chest',0.16,0.55,gold,[sd*0.55,7.0,-0.1],0,sd*0.5); }
  /* windows burn from inside */
  for(const [y,w,z] of [[0.35,1.0,1.82],[2.55,0.8,1.22],[4.6,0.62,0.78]]) for(const sx of [-1,1]) R.add('chest',G_.box(w*0.5,0.5,0.1),glowc,{p:[sx*w*1.1,y,z],glow:true,ol:false,grad:0xFFE79A});
  /* banners on the back */
  for(const sd of [1,-1]){ R.add('chest',G_.cyl(0.07,0.07,5.2,5),0x3A2A22,{p:[sd*2.5,2.6,-1.9],ol:false}); R.add('chest',G_.shape([[0,0],[0.9,0.1],[0.95,-2.4],[0,-2.3]],0.03,0.005),red,{p:[sd*2.5+sd*0.5,4.7,-1.9],ol:true});
    R.add('chest',G_.tor(0.28,0.05,4,12),gold,{p:[sd*3.0,3.9,-1.85],ol:false}); }
  /* the gate is a mouth: an oni mask in red lacquer over the first tier */
  const hr=o.hr;
  R.add('head',G_.sph(hr*1.3,hr*1.1,hr*0.7,18,14),red,{p:[0,0,0],grad:shade(red,0.7),gax:1.4});
  R.add('head',G_.sph(hr*1.0,hr*0.15,hr*0.5),shade(red,0.6),{p:[0,hr*0.55,hr*0.35],r:[0.3,0,0]});
  for(const sd of [1,-1]){ kEyeGlow(R,'head',sd*hr*0.5,hr*0.3,hr*0.6,hr*0.28,0xFFE27A,sd*-0.4);
    R.add('head',G_.cone(hr*0.24,hr*1.3,6),gold,{p:[sd*hr*0.85,hr*0.9,hr*0.0],r:[-0.1,0,sd*-0.4],grad:0xB88810});
    R.add('head',G_.cone(hr*0.12,hr*0.5,5),0xFFFFFF,{p:[sd*hr*0.5,-hr*0.2,hr*0.7],r:[Math.PI,0,0],ol:false}); }
  R.add('head',G_.sph(hr*0.2,hr*0.28,hr*0.2),shade(red,0.85),{p:[0,hr*0.0,hr*0.7]});
  R.add('head',G_.sph(hr*0.9,hr*0.28,hr*0.4),0x1A0A0A,{p:[0,-hr*0.5,hr*0.45],ol:false});
  R.add('jaw',G_.sph(hr*1.0,hr*0.3,hr*0.5),red,{p:[0,-hr*0.05,hr*0.35],grad:shade(red,0.7)});
  kTeeth(R,'jaw',5,hr*0.6,hr*0.1,hr*0.3,hr*0.55,hr*0.25,hr*0.26,0xFFFFFF,true);
  /* iron fists */
  kArms(R,Object.assign({},o,{col:iron,belly:0x4A4E58,hand:iron,claw:gold}),false);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; R.add('arm'+n,G_.sph(1.5,1.3,1.4),iron,{p:[sd*0.5,0.25,0]});
    for(let k=0;k<5;k++){ const a=k/5*TAU; R.add('hand'+n,G_.cone(0.18,0.7,5),gold,{p:[Math.sin(a)*0.85,-0.6,Math.cos(a)*0.85+0.1],r:[Math.cos(a)*1.0+0.0,0,-Math.sin(a)*1.2]}); }
    R.add('hand'+n,G_.sph(1.0,0.95,1.0),iron,{p:[0,-0.7,0.1]}); }
  return {rig:R,kind:'kaiju',var:'biped'};
};


/* ---- 6. HEIKE-GANI, the crab of the drowned fleet: the pattern on its shell is a samurai's furious face */
KJV.crab=function(sp){
  const R=new Rig(), shell=sp.col||0xB5341E, ridge=0xE8C8A0, belly=0xF2DCC0, leg=0xA02A1A, claw=0xD04020, ghost=0x7FB8FF, gold=0xF5C542, ink=0x2A1410;
  R.bone('body','root',[0,2.0,0]);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    R.bone('eye'+n,'body',[sd*0.95,1.15,2.1]);
    R.bone('arm'+n,'body',[sd*2.7,0.0,1.1]); R.bone('fore'+n,'arm'+n,[sd*1.1,0.2,2.3]); R.bone('hand'+n,'fore'+n,[-sd*0.5,0.0,2.1]); R.bone('pin'+n,'hand'+n,[sd*0.45,0.0,0.9]);
    for(let i=0;i<3;i++){ const q='c'+n+i; R.bone(q+'a','body',[sd*2.3,-0.3,0.9-i*1.15]); R.bone(q+'b',q+'a',[sd*1.6,0.9,-0.2]); R.bone(q+'c',q+'b',[sd*1.5,-0.5,-0.15]); R.bone(q+'d',q+'c',[sd*0.3,-2.1,0]); } }
  /* carapace */
  R.add('body',G_.sph(3.3,1.65,2.85,22,14),shell,{p:[0,0.15,-0.1],grad:shade(shell,0.55),gax:1.3});
  R.add('body',G_.sph(2.8,0.7,2.4,16,10),belly,{p:[0,-0.8,0.1]});
  const top=(x,z)=>1.8*Math.sqrt(Math.max(0.04,1-(x/3.3)**2-((z+0.1)/2.85)**2))+0.15-0.02;
  /* the samurai face: heavy brows, glaring eyes, nose ridge, a drooping moustache and a stern mouth */
  for(const sd of [1,-1]){ R.add('body',G_.sph(0.95,0.13,0.28),ridge,{p:[sd*1.15,top(sd*1.15,1.0)+0.0,1.0],r:[0.45,sd*0.0,sd*-0.4],ol:true});
    R.add('body',G_.sph(0.5,0.1,0.18),ink,{p:[sd*1.05,top(sd*1.05,0.55)+0.02,0.55],r:[0.55,0,sd*-0.2],ol:false});
    R.add('body',G_.sph(0.2,0.06,0.07),ghost,{p:[sd*1.05,top(sd*1.05,0.55)+0.07,0.55],r:[0.55,0,sd*-0.2],glow:true,ol:false});
    kTube(R,'body',[[sd*0.35,top(sd*0.35,-0.3)+0.02,-0.4],[sd*1.3,top(sd*1.3,-0.7)+0.04,-0.8],[sd*2.0,top(sd*2.0,-0.3)+0.02,-0.3]],0.1,0.04,ridge,{rs:5,seg:8,ol:false});
    R.add('body',G_.sph(0.9,0.22,0.5),ridge,{p:[sd*1.5,top(sd*1.5,-0.9)+0.0,-0.9],r:[0.5,0,sd*-0.5]}); }
  R.add('body',G_.sph(0.2,0.2,0.9),ridge,{p:[0,top(0,0.2)+0.02,0.3],r:[0.35,0,0]});
  kTube(R,'body',[[-1.3,top(-1.3,-1.4),-1.4],[-0.4,top(-0.4,-1.1)-0.0,-1.1],[0.4,top(0.4,-1.1)-0.0,-1.1],[1.3,top(1.3,-1.4),-1.4]],0.1,0.1,ink,{rs:5,seg:10,ol:false});
  /* kabuto crest */
  for(const sd of [1,-1]) R.add('body',G_.shape([[0,0],[0.18,0],[0.95*sd*sd,1.5],[0.45,0.5]].map(p=>[p[0]*sd,p[1]]),0.05,0.01),gold,{p:[sd*0.45,top(0,1.9)-0.05,2.0],r:[0.9,0,0]});
  for(let i=0;i<14;i++){ const a=i/14*TAU+0.1, rx=Math.sin(a)*3.25, rz=Math.cos(a)*2.8; kSpike(R,'body',0.17,0.8+0.35*(i%2),ridge,[rx,0.15+0.35,rz-0.1],Math.cos(a)*-0.8,Math.sin(a)*-0.8,{ol:true}); }
  for(let i=0;i<9;i++) R.add('body',G_.sph(0.18,0.1,0.18,6,5),0xF4EFE0,{p:[Math.sin(i*2.4)*2.0,top(Math.sin(i*2.4)*2.0,Math.cos(i*2.4)*1.5)-0.02,Math.cos(i*2.4)*1.5-0.4],ol:false});
  /* the drowned fleet: banners and ghost-fire on the shell */
  for(const sd of [1,-1]){ R.add('body',G_.cyl(0.07,0.07,4.6,5),0x3A2A22,{p:[sd*1.4,top(sd*1.4,-1.6)+2.1,-1.7],ol:false});
    R.add('body',G_.shape([[0,0],[1.1,0.1],[0.9,-0.8],[1.15,-1.5],[0.6,-2.1],[0,-2.0]],0.03,0.005),0xC8241E,{p:[sd*1.4+(sd>0?0.05:-1.15),top(sd*1.4,-1.6)+4.2,-1.7],ol:true});
    R.add('body',G_.sph(0.2,0.2,0.2,6,5),gold,{p:[sd*1.4+(sd>0?0.5:-0.5),top(sd*1.4,-1.6)+3.7,-1.69],glow:true,ol:false}); }
  for(let i=0;i<8;i++){ const a=i/8*TAU; R.add('body',G_.cone(0.32,1.1+0.4*(i%3),5),ghost,{p:[Math.sin(a)*2.2,top(Math.sin(a)*2.2,Math.cos(a)*1.9)+0.45,Math.cos(a)*1.9-0.4],glow:true,ol:false,grad:0xE8F4FF}); }
  /* eyes on stalks */
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; kTube(R,'eye'+n,[[0,-0.3,-0.2],[sd*0.1,0.3,0.1],[sd*0.2,0.9,0.3]],0.17,0.12,shell,{rs:6,seg:5});
    R.add('eye'+n,G_.sph(0.34,0.34,0.34,10,8),0xFFF4D8,{p:[sd*0.2,1.05,0.3]}); R.add('eye'+n,G_.sph(0.18,0.2,0.1,8,6),0xD8342C,{p:[sd*0.22,1.05,0.58],glow:true,ol:false}); }
  /* claws and walking legs */
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    kTube(R,'arm'+n,[[0,0,0],[sd*0.55,0.15,1.2],[sd*1.1,0.2,2.3]],0.62,0.5,leg,{rs:8,seg:6,grad:belly});
    R.add('arm'+n,G_.sph(0.78,0.7,0.78),leg,{});
    kTube(R,'fore'+n,[[0,0,0],[-sd*0.25,0,1.0],[-sd*0.5,0,2.1]],0.55,0.62,claw,{rs:8,seg:6});
    R.add('fore'+n,G_.sph(0.7,0.65,0.7),leg,{});
    R.add('hand'+n,G_.sph(1.15,0.85,1.35),claw,{p:[sd*0.1,0,0.35],grad:belly,gax:2});
    kTube(R,'hand'+n,[[-sd*0.15,0,0.5],[-sd*0.35,0,1.4],[sd*0.05,0,2.2],[sd*0.55,0,2.5]],0.4,0.04,claw,{rs:6,seg:8});
    kTube(R,'pin'+n,[[0,0,0],[sd*0.4,0,0.9],[sd*0.05,0,1.7],[-sd*0.5,0,1.9]],0.4,0.04,claw,{rs:6,seg:8});
    for(let k=0;k<4;k++){ R.add('hand'+n,G_.cone(0.1,0.34,4),ridge,{p:[-sd*0.15+(k*0.1)*sd,0.18,0.9+k*0.35],r:[0,0,0],ol:false}); }
    for(let i=0;i<3;i++){ const q='c'+n+i;
      kTube(R,q+'a',[[0,0,0],[sd*0.8,0.45,-0.1],[sd*1.6,0.9,-0.2]],0.34,0.28,leg,{rs:6,seg:5});
      kTube(R,q+'b',[[0,0,0],[sd*0.8,0.0,-0.1],[sd*1.5,-0.5,-0.15]],0.28,0.23,leg,{rs:6,seg:5});
      R.add(q+'a',G_.sph(0.36,0.34,0.36,8,6),leg,{});
      kTube(R,q+'c',[[0,0,0],[sd*0.1,-1.0,0],[sd*0.3,-2.1,0]],0.23,0.07,shade(leg,1.25),{rs:6,seg:5}); }
  }
  return {rig:R,kind:'kaiju',var:'crab'};
};

/* ---- 7. OMUKADE, the centipede of Mount Mikami: twelve armoured segments rearing up out of a trench */
KJV.chain=function(sp){
  const R=new Rig(), car=sp.col||0x5A1E1A, plate=0xA03C1E, gold=0xE8B83A, legc=0xD8A040, under=0xE8C080, venom=0x9BF542, eye=0xFF3A2A;
  const n=12, P=[];
  for(let i=0;i<n;i++){ const u=i/(n-1), k=Math.max(0,(u-0.18)/0.82), y=1.0+6.6*Math.pow(Math.sin(Math.min(1,k)*Math.PI/2),1.35), z=-7.6+9.2*Math.pow(u,0.95)-1.4*Math.sin(k*Math.PI); P.push([Math.sin(u*TAU*1.0)*0.0,y,z]); }
  const ang=[]; for(let i=0;i<n;i++){ const a=P[Math.max(0,i-1)], b=P[Math.min(n-1,i+1)]; ang.push(Math.atan2(b[1]-a[1],b[2]-a[2])); }
  let prev=null;
  for(let i=0;i<n;i++){ const off=prev?[P[i][0]-prev[0],P[i][1]-prev[1],P[i][2]-prev[2]]:P[i]; R.bone('seg'+i,i?'seg'+(i-1):'root',off); prev=P[i]; }
  for(let i=0;i<n;i++){ const u=i/(n-1), w=1.15+0.5*Math.sin(u*Math.PI)*(1-u*0.35), lenz=i===n-1?1.0:0.95, a=-ang[i];
    const nm='seg'+i;
    R.add(nm,G_.sph(w,0.78,lenz,14,10),i%2?car:shade(car,1.15),{r:[a,0,0],grad:under,gax:2.2});
    R.add(nm,G_.sph(w*1.0,0.34,lenz*0.82,12,8),plate,{p:[0,0.52*Math.cos(a),0.52*Math.sin(-a)*-1],r:[a,0,0],grad:gold,gax:1.5});
    R.add(nm,G_.tor(w*0.82,0.07,4,14,Math.PI),gold,{p:[0,0.1,lenz*0.55*0],r:[a+Math.PI/2*0+0,0,0],ol:false,s:[1,0.9,1]});
    kSpike(R,nm,0.2,0.7,gold,[0,0.82*Math.cos(a),-0.82*Math.sin(a)],a-0.0,0,{ol:true});
    for(const sd of [1,-1]){ const q=sd>0?'L':'R', c=Math.cos(a), s=Math.sin(a);
      R.bone('lg'+q+i,nm,[sd*w*0.8,-0.25,0]);
      kTube(R,'lg'+q+i,[[0,0,0],[sd*0.9,-0.4,0.15],[sd*1.6,-1.0,0.35],[sd*1.9,-1.9,0.45]],0.15,0.05,legc,{rs:5,seg:5}); } }
  /* head */
  const h='seg'+(n-1);
  R.bone('jawL',h,[0.5,-0.45,0.95]); R.bone('jawR',h,[-0.5,-0.45,0.95]); R.bone('tail50',h,[0.4,0.5,0.7]); R.bone('tail51',h,[-0.4,0.5,0.7]);
  R.add(h,G_.sph(1.3,0.85,1.2,16,12),car,{p:[0,0.0,0.7],grad:plate,gax:1.4});
  R.add(h,G_.sph(1.1,0.3,0.9),plate,{p:[0,0.62,0.7]});
  for(const sd of [1,-1]){ R.add(h,G_.sph(0.2,0.26,0.16,8,6),eye,{p:[sd*0.55,0.3,1.55],glow:true,ol:false,grad:0xFFE0B0}); R.add(h,G_.sph(0.12,0.16,0.1,8,6),eye,{p:[sd*0.95,0.2,1.3],glow:true,ol:false});
    kTube(R,'jaw'+(sd>0?'L':'R'),[[0,0,0],[-sd*0.2,-0.2,0.9],[-sd*0.75,-0.15,1.8],[-sd*0.95,-0.1,2.5]],0.34,0.05,legc,{rs:6,seg:8,grad:0x6A2A10});
    for(let k=0;k<3;k++) R.add('jaw'+(sd>0?'L':'R'),G_.cone(0.07,0.3,4),0xF4EFE0,{p:[-sd*(0.4+k*0.18),0.05,1.1+k*0.4],r:[0,0,sd*0.3],ol:false});
    R.add('jaw'+(sd>0?'L':'R'),G_.sph(0.12,0.12,0.14,6,5),venom,{p:[-sd*0.95,-0.15,2.4],glow:true,ol:false});
    const an='tail'+(sd>0?50:51); kTube(R,an,[[0,0,0],[sd*0.6,0.9,0.9],[sd*1.4,1.6,2.1],[sd*2.3,1.4,3.4]],0.1,0.03,legc,{rs:5,seg:9}); R.add(an,G_.sph(0.1,0.1,0.1,6,5),venom,{p:[sd*2.3,1.4,3.4],glow:true,ol:false}); }
  /* tail pincers */
  for(const sd of [1,-1]) kTube(R,'seg0',[[sd*0.3,0,-0.7],[sd*0.9,0.1,-1.5],[sd*0.5,0.2,-2.3]],0.22,0.04,legc,{rs:5,seg:6});
  return {rig:R,kind:'kaiju',var:'chain'};
};

/* ---- 8. WANYUDO, the burning wheel: a hovering cart-wheel of fire with a furious face for a hub */
KJV.wheel=function(sp){
  const R=new Rig(), wood=0x5A3A22, iron=0x2E2A32, fireA=0xFF6A1F, fireB=0xFFC94A, blue=0x6FB0FF, skin=sp.col||0xB4C0D4, red=0xC8241E;
  R.bone('hub','root',[0,4.7,0]); R.bone('wheel','hub',[0,0,-0.3]); R.bone('face','hub',[0,0,0.7]); R.bone('jaw','face',[0,-1.1,1.0]);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; R.bone('hand'+n,'hub',[sd*4.9,-1.4,0.8]); }
  for(let i=0;i<8;i++) R.bone('tail'+(10+i),'face',[Math.sin(i/8*TAU)*1.5,1.5+Math.cos(i/8*TAU)*0.6,-0.5]);
  /* wheel */
  R.add('wheel',G_.tor(3.9,0.46,8,36),iron,{grad:wood});
  R.add('wheel',G_.tor(3.55,0.24,6,30),wood,{p:[0,0,0.05]});
  for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('wheel',G_.box(0.4,3.4,0.34),wood,{p:[Math.sin(a)*2.3,Math.cos(a)*2.3,0],r:[0,0,-a],grad:iron,gax:2});
    R.add('wheel',G_.sph(0.2,0.2,0.2,6,5),0xF5C542,{p:[Math.sin(a+0.15)*3.9,Math.cos(a+0.15)*3.9,0.42],ol:false}); }
  R.add('wheel',G_.tor(1.75,0.34,6,24),iron,{});
  for(let i=0;i<18;i++){ const a=i/18*TAU+0.08, L=1.5+1.1*((i*5)%4)/3, rr=4.15+L*0.5;
    R.add('wheel',G_.cone(0.46,L,5),i%3===0?blue:fireA,{p:[Math.sin(a)*rr,Math.cos(a)*rr,0.1],r:[0,0,-a],glow:true,ol:false,grad:i%3===0?0xE8F4FF:fireB});
    R.add('wheel',G_.cone(0.26,L*0.62,5),fireB,{p:[Math.sin(a)*(4.15+L*0.3),Math.cos(a)*(4.15+L*0.3),0.3],r:[0,0,-a],glow:true,ol:false,grad:0xFFFFFF}); }
  /* face: an old demon's, ash-pale with red war-paint, flame hair streaming up and back */
  R.add('face',G_.sph(2.2,2.4,1.5,20,14),skin,{grad:shade(skin,0.72),gax:1.3});
  R.add('face',G_.sph(2.0,0.34,0.8),red,{p:[0,1.35,1.1],r:[0.3,0,0]});
  for(const sd of [1,-1]){ R.add('face',G_.sph(0.74,0.2,0.3),0xFFF4D8,{p:[sd*0.95,0.5,1.2],r:[0,0,sd*-0.4]}); R.add('face',G_.sph(0.24,0.2,0.14),red,{p:[sd*0.95,0.52,1.42],glow:true,ol:false,grad:0xFFE27A});
    R.add('face',G_.sph(1.15,0.26,0.36),0x14121A,{p:[sd*1.05,1.0,1.3],r:[0,0,sd*-0.55]});
    R.add('face',G_.sph(0.5,0.9,0.4),shade(skin,0.85),{p:[sd*1.35,-0.5,0.95]});
    R.add('face',G_.cone(0.25,1.0,5),0xEDE6D0,{p:[sd*1.4,2.0,0.6],r:[-0.3,0,sd*-0.5],grad:0xA89878}); }
  R.add('face',G_.sph(0.34,0.7,0.5),shade(skin,0.88),{p:[0,0.0,1.45],r:[0.3,0,0]});
  R.add('face',G_.sph(0.9,0.14,0.3),0x14121A,{p:[0,-0.55,1.3]});
  R.add('face',G_.sph(1.3,0.2,0.8),0x0A0606,{p:[0,-1.05,1.15],ol:false});
  kTeeth(R,'face',5,1.0,0.2,1.3,1.55,-0.95,0.85,0xFFFFFF,false);
  R.add('jaw',G_.sph(1.1,0.4,0.9),skin,{p:[0,-0.1,0.35],grad:shade(skin,0.75)});
  kTeeth(R,'jaw',4,0.85,0.2,0.2,0.65,0.3,0.7,0xFFFFFF,true);
  R.add('jaw',G_.sph(0.55,0.12,0.7),red,{p:[0,0.12,0.45],ol:false});
  for(let i=0;i<8;i++){ const a=i/8*TAU, nm='tail'+(10+i); kTube(R,nm,[[0,0,0],[Math.sin(a)*0.5,1.2,-0.5],[Math.sin(a)*1.0,2.4,-1.2]],0.5,0.05,i%2?fireA:fireB,{rs:5,seg:6,glow:true,ol:false,grad:0xFFFFFF}); }
  /* clutching hands */
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; R.add('hand'+n,G_.sph(0.9,1.0,0.7),skin,{});
    for(let k=0;k<4;k++){ const x=(k-1.5)*0.4; kTube(R,'hand'+n,[[x*0.8,-0.5,0.0],[x*1.2,-1.4,0.35],[x*1.4,-2.0,0.9]],0.16,0.05,skin,{rs:5,seg:5}); } }
  return {rig:R,kind:'kaiju',var:'wheel'};
};

/* ---- 9. OKUBI, the floating head: a pale face the size of a house, black-toothed grin, hair that moves like a tide */
KJV.head=function(sp){
  const R=new Rig(), skin=sp.col||0xF4EBE4, hair=0x15101E, hair2=0x3A3056, lip=0xC8242E, gold=0xF5C542, blush=0xF0A0A8, ghost=0x9FB4FF;
  R.bone('okubi','root',[0,4.6,0]); R.bone('jaw','okubi',[0,-1.4,1.1]);
  for(const sd of [1,-1]) R.bone('hand'+(sd>0?'L':'R'),'okubi',[sd*5.6,-0.3,1.4]);
  const NS=9, NB=4; for(let s=0;s<NS;s++){ const a=(s/(NS-1)-0.5)*2.5; let par='okubi'; for(let i=0;i<NB;i++){ const nm='tail'+(10+s*NB+i); R.bone(nm,par,i?[Math.sin(a)*0.25,-0.9,-0.55]:[Math.sin(a)*3.3,0.6+Math.cos(a)*0.2,-1.8]); par=nm; } }
  R.add('okubi',G_.sph(3.1,3.5,2.8,22,16),skin,{grad:shade(skin,0.78),gax:1.7});
  R.add('okubi',G_.sph(3.35,2.7,3.0,20,14),hair,{p:[0,1.0,-0.7],grad:hair2,gax:1.5});
  for(let k=0;k<9;k++){ const a=(k-4)*0.28; R.add('okubi',G_.leaf(0.55,2.2,0.04),hair,{p:[Math.sin(a)*2.5,2.5-Math.abs(a)*0.7,1.65+Math.cos(a)*0.2],r:[Math.PI-0.15,0,a*0.9],ol:true}); }
  for(const sd of [1,-1]){
    R.add('okubi',G_.sph(0.95,0.5,0.36),0xFFFFFF,{p:[sd*1.25,0.4,2.35],r:[0,0,sd*-0.12]}); R.add('okubi',G_.sph(0.42,0.42,0.18),0xE8A020,{p:[sd*1.2,0.4,2.55],glow:true,ol:false,grad:0xFFE79A}); R.add('okubi',G_.sph(0.09,0.4,0.1),0x120C0C,{p:[sd*1.2,0.4,2.66],ol:false});
    R.add('okubi',G_.sph(0.9,0.14,0.24),hair,{p:[sd*1.25,1.45,2.3],r:[0.1,0,sd*0.25],ol:false});
    R.add('okubi',G_.sph(0.7,0.4,0.2),blush,{p:[sd*1.9,-0.6,2.2],ol:false});
    R.add('okubi',G_.sph(0.38,0.7,0.3),shade(skin,0.9),{p:[sd*3.0,-0.3,0.5]});
    R.add('okubi',G_.shape([[0,0],[0.7,0.15],[1.2,1.0],[0.55,1.0],[0.35,1.7],[0,1.0]],0.07,0.01),gold,{p:[sd*1.5,3.55,0.2],r:[0.3,0,sd*-0.35]}); R.add('okubi',G_.sph(0.2,0.2,0.2,8,6),lip,{p:[sd*2.0,4.6,0.5],ol:false}); }
  R.add('okubi',G_.sph(0.3,0.55,0.4),shade(skin,0.9),{p:[0,-0.2,2.7],r:[0.25,0,0]});
  R.add('okubi',G_.sph(0.3,0.3,0.1),0xD8342C,{p:[0,2.0,2.5],ol:false});
  R.add('okubi',G_.sph(1.5,0.55,0.55),0x0A0508,{p:[0,-1.35,2.1],ol:false}); R.add('okubi',G_.sph(1.8,0.18,0.3),lip,{p:[0,-0.95,2.45],ol:false});
  for(let i=0;i<9;i++) R.add('okubi',G_.box(0.3,0.38,0.14),0x0E0A10,{p:[(i-4)*0.28,-1.25,2.5-Math.abs(i-4)*0.05],ol:false});
  R.add('jaw',G_.sph(1.8,0.65,1.0),skin,{p:[0,-0.5,0.3],grad:shade(skin,0.8)}); R.add('jaw',G_.sph(1.5,0.24,0.5),lip,{p:[0,0.15,1.0],ol:false});
  for(let i=0;i<8;i++) R.add('jaw',G_.box(0.3,0.34,0.14),0x0E0A10,{p:[(i-3.5)*0.28,0.2,1.2-Math.abs(i-3.5)*0.05],ol:false});
  for(let s=0;s<NS;s++) for(let i=0;i<NB;i++){ const nm='tail'+(10+s*NB+i), r=0.78-i*0.16; R.add(nm,G_.sph(r,0.62,0.62,10,8),hair,{p:[0,-0.35,0],grad:s%3===0?0x6A4E9A:hair2,gax:1.5}); }
  for(let s=0;s<NS;s+=2){ R.add('tail'+(10+s*NB+2),G_.sph(0.22,0.22,0.22,6,5),ghost,{p:[0,-0.3,0.5],glow:true,ol:false}); }
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; R.add('hand'+n,G_.sph(1.3,0.5,1.4),skin,{p:[0,0,0],grad:shade(skin,0.8)}); R.add('hand'+n,G_.sph(0.8,0.5,0.7),skin,{p:[sd*-0.9,0.0,0.3]});
    for(let k=0;k<4;k++){ const z=(k-1.5)*0.55; kTube(R,'hand'+n,[[sd*0.9,0.1,z],[sd*1.9,0.2,z*1.1],[sd*2.9,0.0,z*1.3+0.3]],0.22,0.1,skin,{rs:6,seg:5}); R.add('hand'+n,G_.cone(0.1,0.5,4),lip,{p:[sd*3.1,0.0,z*1.3+0.5],r:[Math.PI/2,0,0],ol:false}); }
    kTube(R,'hand'+n,[[-sd*0.5,0.1,0.8],[sd*0.0,0.5,1.8],[sd*0.5,0.5,2.4]],0.24,0.1,skin,{rs:6,seg:5}); }
  return {rig:R,kind:'kaiju',var:'head'};
};

/* ---- 10. GENBU, the mountain tortoise: a quadruped carrying a whole shrine mountain on its shell */
function genbuExtra(R,d,G){ const W=d.W, L=d.L, shell=0x2F5A4A, rock=0x7C8290, snow=0xF4F8FF, pine=0x2E6A3A, red=0xC8241E, gold=0xF5C542, wood=0x5A3A22;
  R.add('body',G.sph(W*1.6,W*1.15,L*0.68,24,16),shell,{p:[0,W*0.5,-L*0.03],grad:shade(shell,0.55),gax:1.6});
  for(let i=0;i<8;i++){ const a=i/8*TAU, rr=W*1.5; R.add('body',G.sph(W*0.45,W*0.2,W*0.45,8,6),shade(shell,1.3),{p:[Math.sin(a)*rr*0.95,W*0.5+Math.cos(a*1.0)*0.0+W*0.35,Math.cos(a)*L*0.62*0.95-L*0.03],r:[0,a,0],ol:false}); }
  R.add('body',G.tor(W*1.5,W*0.1,5,28),0xC8B890,{p:[0,W*0.55,-L*0.03],r:[Math.PI/2,0,0],s:[1,L*0.64/W/1.5*1.0,1]});
  R.add('body',G.cone(W*1.15,W*2.5,7),rock,{p:[0,W*2.35,-L*0.03],grad:0x4A4E58,gax:1.5});
  R.add('body',G.cone(W*0.55,W*1.0,7),snow,{p:[0,W*3.55,-L*0.03],ol:true});
  for(const [x,z,s] of [[-0.9,0.5,1.0],[0.8,0.7,0.85],[-0.5,-0.9,0.9],[0.7,-0.7,1.0],[0.0,1.2,0.7]]){ for(let k=0;k<3;k++) R.add('body',G.cone(W*0.3*s*(1-k*0.25),W*0.55*s,6),pine,{p:[x*W*0.95,W*(1.35+0.0)+W*0.42*k*s-0.05*W,z*W*0.95-L*0.03],ol:true}); }
  /* a small shrine halfway up */
  R.add('body',G.box(W*0.7,W*0.38,W*0.55),0xF2EEE2,{p:[W*0.15,W*2.2,W*0.75-L*0.03]}); R.add('body',G.cyl(W*0.28,W*0.62,W*0.3,4),0x2F3C4E,{p:[W*0.15,W*2.5,W*0.75-L*0.03],r:[0,Math.PI/4,0]});
  R.add('body',G.tor(W*0.22,W*0.04,4,12),red,{p:[W*0.15,W*2.2,W*1.04-L*0.03],ol:false});
  /* a waterfall running down the mountain onto the shell */
  kTube(R,'body',[[-W*0.3,W*3.2,W*0.3-L*0.03],[-W*0.35,W*2.4,W*0.9-L*0.03],[-W*0.4,W*1.5,W*1.4-L*0.03],[-W*0.4,W*0.9,W*1.6-L*0.03]],W*0.1,W*0.2,0x9FE6FF,{glow:true,ol:false,rs:5,seg:10});
}

/* ================================================================ poses */
function poseBiped(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase, V=I.sp.v, atk=I.sp.atk;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const sw=Math.sin(ph), cw=Math.cos(ph), A=0.5*Math.min(1,mv*1.5)*(V==='castle'?0.7:1);
  ADD(b.thighL,-sw*A,0,0); ADD(b.thighR,sw*A,0,0);
  ADD(b.shinL,Math.max(0,sw)*A*1.25+0.05,0,0); ADD(b.shinR,Math.max(0,-sw)*A*1.25+0.05,0,0);
  ADD(b.footL,-Math.max(0,sw)*A*0.55,0,0); ADD(b.footR,-Math.max(0,-sw)*A*0.55,0,0);
  OFF(b.pelvis,0,-Math.abs(sw)*0.22*mv+Math.sin(t*1.3)*0.04,0); ADD(b.pelvis,0,sw*0.1*mv,Math.sin(ph)*0.035*mv);
  ADD(b.spine,0.06+Math.sin(t*1.2)*0.02,-sw*0.09*mv,0); ADD(b.chest,0.02,-sw*0.07*mv,Math.sin(t*0.9)*0.01);
  if(b.chest) b.chest.scale.setScalar(1+Math.sin(t*1.7)*0.012);
  ADD(b.neck,-0.08+Math.sin(t*1.5)*0.03,Math.sin(t*0.7)*0.12*(1-mv),0); ADD(b.head,Math.sin(t*2.1)*0.03,Math.sin(t*0.9)*0.15*(1-mv),0);
  if(b.armL){ ADD(b.armL,sw*A*0.75+Math.sin(t*1.3)*0.04,0,0.08); ADD(b.armR,-sw*A*0.75-Math.sin(t*1.3+1)*0.04,0,-0.08); ADD(b.foreL,-0.25,0,0); ADD(b.foreR,-0.25,0,0); }
  if(atk==='bite'||V==='skeleton') ADD(b.jaw,0.17+Math.sin(t*1.9)*0.04,0,0);
  if(b.wingL){ const fl=mv>0.2?Math.sin(ph*2)*0.55*mv:Math.sin(t*1.4)*0.08; ADD(b.wingL,0,0.45,-0.5+fl); ADD(b.wingR,0,-0.45,0.5-fl); ADD(b.wing2L,0,0.25,-0.6-fl*0.5); ADD(b.wing2R,0,-0.25,0.6+fl*0.5); }
  for(let i=0;i<6;i++) ADD(b['tail'+i],(i===0?0.2:-0.05)+Math.sin(t*2.1-i*0.55)*0.04,Math.sin(t*1.8-i*0.7)*(0.14+0.06*i)-sw*0.1*mv,0);
  const u=S.atkU;
  if(u>=0&&u<1){ const c=attackCurve(u), a=c.wind, h=c.strike;
    if(atk==='bite'){ ADD(b.spine,-0.22*a+0.4*h,0,0); ADD(b.neck,-0.4*a+0.65*h,0,0); ADD(b.head,-0.25*a+0.2*h,0,0); ADD(b.jaw,0.75*a-0.1*h+0.35*h*(1-h),0,0);
      ADD(b.armL,-0.5*a+0.3*h,0,0.2*a); ADD(b.armR,-0.5*a+0.3*h,0,-0.2*a); ADD(b.thighL,-0.3*h,0,0); OFF(b.root,0,0,1.0*h-0.4*a); OFF(b.pelvis,0,-0.3*h,0); }
    else if(atk==='club'){ ADD(b.armR,-2.75*a-0.75*h,0,-0.15*a); ADD(b.foreR,-0.5*a-0.1*h,0,0); ADD(b.armL,-0.9*a+0.2*h,0,0.3*a); ADD(b.spine,-0.28*a+0.45*h,0,0); ADD(b.chest,0,-0.4*a+0.5*h,0); ADD(b.head,-0.1*a+0.15*h,0,0); ADD(b.jaw,0.5*a,0,0);
      OFF(b.pelvis,0,-0.5*h,0); OFF(b.root,0,0,0.9*h-0.35*a); ADD(b.thighL,-0.5*h,0,0); ADD(b.shinL,0.5*h,0,0); }
    else if(atk==='wing'){ ADD(b.wingL,0,-0.45*a,1.7*a-1.1*h); ADD(b.wingR,0,0.45*a,-1.7*a+1.1*h); ADD(b.wing2L,0,-0.2*a,0.9*a-0.3*h); ADD(b.wing2R,0,0.2*a,-0.9*a+0.3*h); ADD(b.spine,-0.2*a+0.5*h,0,0); ADD(b.neck,-0.3*a+0.55*h,0,0); ADD(b.head,0.0,0,0);
      ADD(b.thighL,-1.0*h,0,0); ADD(b.thighR,-1.0*h,0,0); ADD(b.shinL,0.7*h,0,0); ADD(b.shinR,0.7*h,0,0); ADD(b.jaw,0.5*a+0.3*h,0,0); OFF(b.root,0,0.9*a-0.3*h,1.4*h-0.4*a); }
    else { /* slam: both fists up, then down through the ground */
      ADD(b.armL,-2.5*a-0.85*h,0,0.12*a); ADD(b.armR,-2.5*a-0.85*h,0,-0.12*a); ADD(b.foreL,-0.4*a,0,0); ADD(b.foreR,-0.4*a,0,0); ADD(b.spine,-0.25*a+0.4*h,0,0); ADD(b.head,-0.15*a+0.2*h,0,0); ADD(b.jaw,0.5*a,0,0);
      OFF(b.pelvis,0,-0.45*h+0.1*a,0); OFF(b.root,0,0,0.7*h-0.3*a); ADD(b.thighL,-0.4*h,0,0); ADD(b.thighR,-0.4*h,0,0); ADD(b.shinL,0.5*h,0,0); ADD(b.shinR,0.5*h,0,0); } }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); ADD(b.spine,-0.26*e,0,0); ADD(b.neck,-0.38*e,0,0); ADD(b.head,-0.42*e,0,0); ADD(b.jaw,0.75*e,0,0);
    if(b.armL){ ADD(b.armL,-0.4*e,0,1.05*e); ADD(b.armR,-0.4*e,0,-1.05*e); ADD(b.foreL,-0.5*e,0,0); ADD(b.foreR,-0.5*e,0,0); }
    if(b.wingL){ ADD(b.wingL,0,-0.45*e,0.55*e+Math.sin(t*9)*0.08*e); ADD(b.wingR,0,0.45*e,-0.55*e-Math.sin(t*9)*0.08*e); ADD(b.wing2L,0,-0.2*e,0.6*e); ADD(b.wing2R,0,0.2*e,-0.6*e); }
    if(b.chest) b.chest.scale.setScalar(1+0.07*e); OFF(b.pelvis,0,0.15*e,0); }
  if(S.hit>0){ ADD(b.spine,0.22*S.hit,0,0); ADD(b.head,0.25*S.hit,0,0); ADD(b.neck,0.2*S.hit,0,0); OFF(b.root,0,0,-0.25*S.hit); } }

function poseCrab(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const A=0.34*Math.min(1,mv*1.5);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R';
    for(let i=0;i<3;i++){ const off=((i+(sd>0?0:1))%2)*Math.PI, q='c'+n+i, sg=Math.sin(ph+off), lift=Math.max(0,Math.cos(ph+off));
      ADD(b[q+'a'],0,sg*A*0.9,-lift*A*0.6*sd); ADD(b[q+'b'],0,0,-lift*A*0.9*sd); ADD(b[q+'c'],0,0,lift*A*0.5*sd); }
    ADD(b['arm'+n],Math.sin(t*1.4+(sd>0?0:1.7))*0.05,sd*-0.12+Math.sin(ph)*0.06*mv*sd,0); ADD(b['fore'+n],0,sd*0.15,0);
    ADD(b['pin'+n],0,sd*(0.12+Math.sin(t*2.1+sd)*0.1),0); ADD(b['eye'+n],Math.sin(t*1.9+sd)*0.2,Math.sin(t*1.1)*0.2,0); }
  OFF(b.body,0,Math.abs(Math.sin(ph*2))*0.1*mv+Math.sin(t*1.5)*0.04,0); ADD(b.body,0,Math.sin(ph)*0.05*mv,Math.sin(ph*2)*0.03*mv);
  const u=S.atkU; if(u>=0&&u<1){ const c=attackCurve(u), a=c.wind, h=c.strike;
    for(const sd of [1,-1]){ const n=sd>0?'L':'R'; ADD(b['arm'+n],-1.0*a+0.7*h,sd*0.3*a,0); ADD(b['fore'+n],-0.7*a+0.3*h,0,0); ADD(b['hand'+n],-0.3*a+0.2*h,0,0); ADD(b['pin'+n],0,sd*(0.9*a-0.6*h),0); }
    ADD(b.body,-0.2*a+0.3*h,0,0); OFF(b.root,0,0,1.0*h-0.4*a); }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); for(const sd of [1,-1]){ const n=sd>0?'L':'R'; ADD(b['arm'+n],-1.1*e,sd*0.5*e,0); ADD(b['fore'+n],-0.5*e,0,0); ADD(b['pin'+n],0,sd*(0.7+Math.sin(t*10)*0.25)*e,0); } ADD(b.body,-0.25*e,0,0); OFF(b.body,0,0.5*e,0); }
  if(S.hit>0){ ADD(b.body,0.15*S.hit,0,0.1*S.hit); OFF(b.root,0,0,-0.25*S.hit); } }

function poseChain(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase, n=12;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  for(let i=0;i<n;i++){ const w=Math.sin(t*1.6-i*0.55)*0.06+Math.sin(ph*1-i*0.9)*0.1*mv; ADD(b['seg'+i],w,Math.sin(t*1.1-i*0.5)*0.05+Math.sin(ph-i*0.8)*0.08*mv,0);
    for(const sd of [1,-1]){ const q=sd>0?'L':'R', pp=ph*2-i*0.7+(sd>0?0:Math.PI), lg=b['lg'+q+i]; ADD(lg,Math.sin(pp)*0.4*(0.35+mv),0,sd*(Math.cos(pp)*0.2*(0.35+mv)+0.05*Math.sin(t*2+i))); } }
  ADD(b.jawL,0,0.08+Math.sin(t*3)*0.05,0); ADD(b.jawR,0,-0.08-Math.sin(t*3)*0.05,0);
  ADD(b.tail50,Math.sin(t*2.2)*0.2,Math.sin(t*1.7)*0.3,0); ADD(b.tail51,Math.sin(t*2.2+1)*0.2,Math.sin(t*1.7+1)*0.3,0);
  const u=S.atkU; if(u>=0&&u<1){ const c=attackCurve(u), a=c.wind, h=c.strike;
    for(let i=n-5;i<n;i++) ADD(b['seg'+i],-0.2*a+0.34*h,0,0); ADD(b.jawL,0,0.9*a-0.55*h,0); ADD(b.jawR,0,-0.9*a+0.55*h,0); OFF(b.root,0,0,0.9*h-0.4*a); }
  if(s.cast){ const e=sm(Math.min(1,(s.castU||0)*1.4)); for(let i=n-6;i<n;i++) ADD(b['seg'+i],-0.2*e,0,0); ADD(b.jawL,0,0.8*e,0); ADD(b.jawR,0,-0.8*e,0); }
  if(S.hit>0){ for(let i=n-4;i<n;i++) ADD(b['seg'+i],0.2*S.hit,0,0); OFF(b.root,0,0,-0.3*S.hit); } }

function poseWheel(I,s,dt){ const b=I.b, S=I.st, t=S.t, mv=S.move;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const e=s.cast?sm(Math.min(1,(s.castU||0)*1.4)):0, u=S.atkU, c=(u>=0&&u<1)?attackCurve(u):{wind:0,strike:0};
  S.spin=(S.spin||0)+(1.1+2.4*mv+4*e+5*c.strike)*(dt||0.016); b.wheel.rotation.z=-S.spin;
  OFF(b.hub,0,Math.sin(t*1.8)*0.25+Math.abs(Math.sin(S.phase*2))*0.1*mv+0.5*e,0); ADD(b.hub,0,Math.sin(t*0.8)*0.08,Math.sin(t*1.2)*0.04);
  ADD(b.face,Math.sin(t*1.6)*0.04-0.1*e,Math.sin(t*0.9)*0.12,0); ADD(b.jaw,0.2+Math.sin(t*2.2)*0.05+0.7*e+0.7*c.wind,0,0);
  for(let i=0;i<8;i++) ADD(b['tail'+(10+i)],Math.sin(t*5-i)*0.18-0.2*e,Math.sin(t*4+i)*0.12,0);
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; ADD(b['hand'+n],Math.sin(t*1.7+sd)*0.15+c.wind*-0.6+c.strike*0.8,0,sd*(0.1+0.7*e)); }
  OFF(b.root,0,0,1.4*c.strike-0.6*c.wind); ADD(b.hub,-0.15*c.wind+0.28*c.strike,0,0);
  if(S.hit>0){ ADD(b.hub,0.2*S.hit,0,0); OFF(b.root,0,0,-0.3*S.hit); } }

function poseHeadK(I,s){ const b=I.b, S=I.st, t=S.t, mv=S.move, NS=9, NB=4;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const e=s.cast?sm(Math.min(1,(s.castU||0)*1.4)):0, u=S.atkU, c=(u>=0&&u<1)?attackCurve(u):{wind:0,strike:0};
  OFF(b.okubi,0,Math.sin(t*1.5)*0.3+0.4*e+0.2*c.wind,0); ADD(b.okubi,-0.12*e+0.2*mv-0.15*c.wind+0.4*c.strike,Math.sin(t*0.7)*0.1,Math.sin(t*1.1)*0.06);
  ADD(b.jaw,0.14+Math.sin(t*2.3)*0.04+0.95*e+0.9*c.wind-0.5*c.strike,0,0);
  for(let sI=0;sI<NS;sI++) for(let i=0;i<NB;i++){ const k='tail'+(10+sI*NB+i); ADD(b[k],Math.sin(t*1.9-i*0.9-sI*0.5)*0.22+0.12*mv-0.35*e*(1+i*0.3)+0.5*c.strike,Math.sin(t*1.5-i*0.7+sI)*0.2,Math.sin(t*1.3-i*0.8+sI*0.7)*0.15); }
  for(const sd of [1,-1]){ const n=sd>0?'L':'R'; OFF(b['hand'+n],0,Math.sin(t*1.6+sd)*0.35+0.6*e,0.6*c.strike-0.4*c.wind); ADD(b['hand'+n],Math.sin(t*1.3+sd)*0.1,0,sd*(-0.2-0.5*e+0.4*c.wind)); }
  if(S.hit>0){ ADD(b.okubi,0.25*S.hit,0,0); OFF(b.root,0,0,-0.3*S.hit); } }

function poseKaiju(I,s,dt){ const v=I.B.b.var; if(v==='crab') return poseCrab(I,s); if(v==='chain') return poseChain(I,s); if(v==='wheel') return poseWheel(I,s,dt); if(v==='head') return poseHeadK(I,s); return poseBiped(I,s); }

const POSE={human:poseHuman,quad:poseQuad,serpent:poseSerpent,spider:poseSpider,blob:poseBlob,fish:poseFish,kaiju:poseKaiju};

/* ================================================================ v82 shared skeleton and imported models
   Every humanoid hero and boss is posed on one canonical 22-bone skeleton (GK_BONES), and every animation
   (idle, walk/run, seven attack styles, hits, boss casts) is written once against it. An imported rigged
   model (a sculpted hero from Tripo, a Mixamo rig, an artist's GLB) borrows that whole animation library:
   a hidden copy of the canonical rig is posed each beat, and each pose is retargeted onto the model's own
   bones by matching bone directions, so T-pose and A-pose rigs both work and no per-model animation is needed.
   Usage: C.registerModel('ronin', {url:'assets/models/ronin.glb'}) -> Promise. Until it loads (or if it
   fails) the code-built character keeps drawing, so a missing file never breaks the game. */
const GK_BONES=['root','hips','spine','chest','neck','head','armL','elbowL','handL','armR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR','skirt','back','tail','hair'];
const GK_CHILD={hips:'spine',spine:'chest',chest:'neck',neck:'head',armL:'elbowL',elbowL:'handL',armR:'elbowR',elbowR:'handR',thighL:'kneeL',kneeL:'footL',thighR:'kneeR',kneeR:'footR'};
/* name patterns for common rigs (Mixamo "mixamorig:LeftForeArm", Tripo/Blender "upperarm.L", Unity "Left_UpperArm") */
const BONE_PATTERNS={hips:/^(hips|pelvis|root_?hips)$/, spine:/^(spine|spine0|spine_?01|abdomen)$/, chest:/^(spine2|spine_?03|upperchest|chest|spine1|spine_?02)$/,
  neck:/^(neck|neck1|neck_?01)$/, head:/^head$/,
  arm:/^(upperarm|arm|uparm|shoulder_?arm)$/, elbow:/^(forearm|lowerarm|elbow|loarm)$/, hand:/^(hand|wrist)$/,
  thigh:/^(upleg|upperleg|thigh|hip)$/, knee:/^(leg|lowerleg|calf|shin|knee)$/, foot:/^(foot|ankle)$/};
function sideOf(n){ return /(^|[^a-z])l$|^l[^a-z]|left|\.l$|_l$/.test(n)?'L':/(^|[^a-z])r$|^r[^a-z]|right|\.r$|_r$/.test(n)?'R':''; }
function coreName(n){ return n.toLowerCase().replace(/^.*:/,'').replace(/mixamorig\d*/,'').replace(/^(def|bip\d*|bone|cc_base|j)[_\-. ]/,'').replace(/(left|right)/,'').replace(/([._\- ]+[lr])$|^([lr][._\- ]+)/,'').replace(/[._\- ]/g,''); }
function autoBoneMap(bones){ const map={}, prio={chest:['spine2','upperchest','chest','spine03','spine1','spine02']};
  for(const b of bones){ const c=coreName(b.name), sd=sideOf(b.name.toLowerCase());
    for(const k in BONE_PATTERNS){ if(!BONE_PATTERNS[k].test(c)) continue;
      const gk=['arm','elbow','hand','thigh','knee','foot'].includes(k)?k+sd:k; if(gk.length===k.length&&['arm','elbow','hand','thigh','knee','foot'].includes(k)) continue;
      if(gk==='chest'&&map.chest){ const pr=prio.chest; if(pr.indexOf(c)<0||pr.indexOf(c)>=pr.indexOf(coreName(map.chest.name))) continue; }
      if(!map[gk]||gk==='chest') map[gk]=b; } }
  if(map.chest&&map.spine&&map.chest===map.spine) delete map.chest;
  return map; }
const IMPORTED={};   /* key -> {status, gltf, proto info} */
let _skelClone=null;
const _q1=new T.Quaternion(), _q2=new T.Quaternion(), _q3=new T.Quaternion(), _v1=new T.Vector3(), _v2=new T.Vector3(), _mI=new T.Matrix4();
function modelQ(o,stop,out){ out.identity(); const chain=[]; for(let n=o;n&&n!==stop;n=n.parent) chain.push(n); for(let i=chain.length-1;i>=0;i--) out.multiply(chain[i].quaternion); return out; }
function modelP(o,stop,out){ o.updateWorldMatrix(true,false); stop.updateWorldMatrix(true,false); _mI.copy(stop.matrixWorld).invert(); return out.setFromMatrixPosition(o.matrixWorld).applyMatrix4(_mI); }
function celMatFor(src){ const m=celMat(); m.vertexColors=!!(src&&src.vertexColors); if(src&&src.map){ m.map=src.map; } if(src&&src.color) m.color.copy(src.color); m.userData.base=m.color.clone(); return m; }
function prepImported(key,gltf,o){ const root=gltf.scene; root.updateMatrixWorld(true);
  let skinned=null, bones=[]; root.traverse(n=>{ if(n.isSkinnedMesh&&!skinned) skinned=n; if(n.isBone) bones.push(n); });
  if(!skinned) throw new Error('no skinned mesh in '+o.url);
  const map=o.boneMap&&typeof o.boneMap==='object'?Object.fromEntries(Object.entries(o.boneMap).map(([k,v])=>[k,bones.find(b=>b.name===v)]).filter(e=>e[1])):autoBoneMap(bones);
  const need=['hips','spine','head','armL','elbowL','armR','elbowR','thighL','kneeL','thighR','kneeR']; const miss=need.filter(k=>!map[k]);
  if(miss.length) throw new Error('rig is missing '+miss.join(', ')+' in '+o.url);
  const bb=new T.Box3().setFromObject(root,true), height=Math.max(0.01,bb.max.y-Math.min(0,bb.min.y));
  const xl=modelP(map.thighL,root,new T.Vector3()).x, xr=modelP(map.thighR,root,new T.Vector3()).x, flip=xl<xr;   /* left leg on -X: the model faces -Z */
  return {root,flip,map:Object.fromEntries(Object.entries(map).map(([k,b])=>[k,b.name])),height,o}; }
function makeImported(key){ const R=IMPORTED[key], B=getBuilt(R&&R.o.template||key); if(!R||!B) return null;
  const P=R.proto, grp=new T.Group(), inner=new T.Group(); grp.add(inner);
  /* align turns the model to face +Z like the canonical rig (auto-detected from which side its left leg is on);
     all retarget maths runs in the inner frame F so both rigs share left, right and forward */
  const model=_skelClone(P.root), align=new T.Group(); align.add(model); inner.add(align); inner.scale.setScalar(1/P.height); align.rotation.y=(P.o.yaw||0)+(P.flip?Math.PI:0);
  const F=inner; F.updateMatrixWorld(true);
  const mats=[]; const extra=[];
  model.traverse(n=>{ if(!n.isMesh) return; n.frustumCulled=false; n.castShadow=false;
    if(P.o.cel!==false){ const src=Array.isArray(n.material)?n.material[0]:n.material; n.material=celMatFor(src); mats.push(n.material); }
    if(n.isSkinnedMesh&&P.o.outline!==false){ const ol=new T.SkinnedMesh(n.geometry,OL_MAT); ol.position.copy(n.position); ol.quaternion.copy(n.quaternion); ol.scale.copy(n.scale); ol.bind(n.skeleton,n.bindMatrix); ol.frustumCulled=false; ol.onBeforeRender=olBeforeRender; extra.push([n.parent,ol]); } });
  for(const [par,ol] of extra) par.add(ol);
  /* the hidden driver: a bones-only copy of the canonical rig, posed by the shared animation library */
  const drv=cloneRig(B.proto), dg=new T.Group(); dg.add(drv.root); dg.updateMatrixWorld(true);
  const tb={}; model.traverse(n=>{ if(n.isBone) tb[n.name]=n; });
  const pairs=[]; for(const k in P.map){ const t=tb[P.map[k]], d=drv.map[k]; if(!t||!d) continue; pairs.push({k,t,d}); }
  /* bind-time correction: rotate the canonical bone direction onto the model's bone direction */
  model.updateMatrixWorld(true);
  for(const pr of pairs){ pr.rest=modelQ(pr.t,F,new T.Quaternion()); pr.local=pr.t.quaternion.clone(); pr.rc=new T.Quaternion();
    const ck=GK_CHILD[pr.k], cp=ck&&pairs.find(x=>x.k===ck);
    if(cp){ const d0=modelP(cp.d,dg,new T.Vector3()).sub(modelP(pr.d,dg,new T.Vector3())).normalize(), t0=modelP(cp.t,F,new T.Vector3()).sub(modelP(pr.t,F,new T.Vector3())).normalize();
      if(d0.lengthSq()>0.5&&t0.lengthSq()>0.5) pr.rc.setFromUnitVectors(d0,t0); } }
  /* end bones (hands, feet, head) have no child to aim at: they inherit their parent's correction so a T-pose
     hand turns down with its forearm instead of staying pointed sideways */
  const PARENT_OF={handL:'elbowL',handR:'elbowR',footL:'kneeL',footR:'kneeR',head:'neck'};
  for(const pr of pairs){ const pk=PARENT_OF[pr.k], pp=pk&&pairs.find(x=>x.k===pk); if(pp&&!GK_CHILD[pr.k]) pr.rc.copy(pp.rc); }
  const order=[]; model.traverse(n=>{ if(n.isBone) order.push(n); });
  const byT=new Map(pairs.map(p=>[p.t,p])), restLocal=new Map(order.map(b=>[b,b.quaternion.clone()])), mq=new Map();
  /* the rig may sit under non-bone nodes with their own rotation (e.g. an 'Armature' turned 90 degrees and scaled 0.01) */
  const baseQ=new Map(order.filter(b=>!(b.parent&&b.parent.isBone)).map(b=>[b,modelQ(b.parent,F,new T.Quaternion())]));
  const hipsP=pairs.find(p=>p.k==='hips'), hipRestT=hipsP&&hipsP.t.position.clone(), hipRestD=modelP(drv.map.hips,dg,new T.Vector3()), hipHT=hipsP?modelP(hipsP.t,F,new T.Vector3()).y:1;
  const hipRatio=hipHT/Math.max(1e-3,hipRestD.y), hipRestM=hipsP?modelP(hipsP.t,F,new T.Vector3()):null;
  function retarget(){ dg.updateMatrixWorld(true); mq.clear();
    for(const b of order){ const pq=mq.get(b.parent)||baseQ.get(b)||_q3.identity(); const pr=byT.get(b);
      if(pr){ modelQ(pr.d,dg,_q1);   /* posed canonical rotation; its rest is identity */
        _q2.copy(pr.rc).invert(); _q1.multiply(_q2).multiply(pr.rest);   /* Qd * Rc^-1 * rest */
        b.quaternion.copy(pq).invert().multiply(_q1); mq.set(b,_q1.clone()); }
      else { b.quaternion.copy(restLocal.get(b)); mq.set(b,pq.clone().multiply(b.quaternion)); } }
    if(hipsP){ /* lunges, crouches and the walk bob move the hips, scaled to the model's leg length */
      modelP(drv.map.hips,dg,_v1).sub(hipRestD).multiplyScalar(hipRatio); _v2.copy(hipRestM).add(_v1);
      F.updateWorldMatrix(true,false); _v2.applyMatrix4(F.matrixWorld); const par=hipsP.t.parent; par.updateWorldMatrix(true,false); hipsP.t.position.copy(par.worldToLocal(_v2)); } }
  const mat=mats[0]||celMat();
  return {key,grp,b:drv.map,body:model,ol:null,gl:null,mat,mats,kind:'human',B:{height:1,b:{kind:'human'}},sp:B.sp,imported:true,retarget,
    st:{phase:Math.random()*TAU,move:0,atk:0,last:null,yaw:0,t:Math.random()*10,hit:0,cast:0,dash:0,lift:0}}; }
function registerModel(key,o){ o=o||{}; if(!DEFS[key]){ const tk=o.template||'hero'; DEFS[key]=Object.assign({},DEFS[tk],{key}); o.template=tk; }   /* a new key draws as its template until the model loads */
  const R=IMPORTED[key]={status:'loading',o};
  const load=opt.loadModel||(url=>import('three/addons/loaders/GLTFLoader.js').then(m=>new m.GLTFLoader().loadAsync(url)));
  return Promise.all([load(o.url), _skelClone?null:import('three/addons/utils/SkeletonUtils.js').then(m=>{ _skelClone=m.clone; })])
    .then(([gltf])=>{ R.proto=prepImported(key,gltf,o); R.status='ready';
      for(const [ent,I] of [...live]) if(I.key===key) release(ent,I); delete pool[key];   /* swap live copies on their next frame */
      return {key,height:R.proto.height,bones:R.proto.map}; })
    .catch(err=>{ R.status='failed'; R.error=String(err&&err.message||err); console.warn('3D model kept as code-built:',key,R.error); throw err; }); }

/* ================================================================ v82 motion and level-of-detail settings
   MOTION.step: 'auto' poses anime-style characters at stepHz and chibi ones every frame; 'stepped' or 'smooth' force it.
   ?motion=smooth or ?motion=stepped in the address overrides it on this device. */
const MOTION={step:(()=>{ try{ const q=new URLSearchParams(location.search).get('motion'); if(q==='smooth'||q==='stepped'||q==='auto'){ localStorage.setItem('gk-motion',q); return q; } return localStorage.getItem('gk-motion')||'auto'; }catch(e){ return 'auto'; } })(),
  stepHz:15, impactFreeze:0.06, farPx:34, farHz:10};
const stepHz=()=>MOTION.step==='smooth'?0:MOTION.step==='stepped'?MOTION.stepHz:(STYLE==='anime'?MOTION.stepHz:0);
const CAM={c:opt.camera||null,ok:false}, _pm=new T.Matrix4(), _fr=new T.Frustum(), _sp=new T.Sphere(), LODN={off:0,posed:0,held:0,frozen:0};
const _vis={in:true,px:999};
function onScreen(x,y,z,r){ _vis.in=true; _vis.px=999; if(!CAM.ok) return _vis;
  _sp.center.set(x,y,z); _sp.radius=r; if(!_fr.intersectsSphere(_sp)){ _vis.in=false; return _vis; }
  const c=CAM.c; if(c.isPerspectiveCamera){ const d=Math.max(0.1,c.position.distanceTo(_sp.center)); _vis.px=r*(4/3)*c.projectionMatrix.elements[5]*0.5*OL_U.uRes.value.y/d; }   /* about the character's height in drawn pixels */
  return _vis; }

/* ================================================================ v83 TROOPS: the squad in 3D, one draw per troop type
   Each troop type is built once at a fraction of hero detail (SEGK) in the anime style, then drawn for every soldier
   of that type in a single instanced draw (plus one outline draw). Each soldier still has its own skeleton, posed by
   the same animation library as the heroes (run, seven attack styles, hits) on the 15 Hz anime beat; the poses are
   written to a float texture that the GPU reads per instance. Troops without a design keep their painted sprite. */
const TROOP_SEGK=0.22, TROOP_CAP=64, TROOP_MINPART=0.06, TROOP_MINPART_OL=0.11;   /* parts smaller than this (model units) vanish at troop size */
const TROOP_SPECS={
  archer:  {base:'hero',abuild:'a_youth',o:{hair:{style:'short',col:0x3A2418,col2:0x4A2E1E},outfit:{col:0x2A2E3A,top:0x2F5DB8,collar:0x1E3A7A,trim:0x1E3A7A,lining:0x1E3A7A,mon:0x2F5DB8}}},
  samurai: {base:'samurai',abuild:'a_male'},
  onmyoji: {base:'onmyoji',abuild:'a_male'},
  ninja:   {base:'ninja',abuild:'a_male'},
  oniw:    {base:'brute',abuild:'a_hero',o:{build:'broad',skin:0x9B7FD6,hair:{col:0xF2F2F2,col2:0xDDD8E6}}},
  yari:    {base:'samurai',abuild:'a_male',o:{hat:{kind:'kasa',col:0x3A3A30,col2:0x2A2A22},outfit:{col:0x5E7A3A,plate:0x3F5A2A,lace:0x8C6A3A,trim:0x8C6A3A,sleeve:0x4A3A2A,legs:0x4A3A2A},weapon:{kind:'spear',col:0xD8DEE6,col2:0x6B4A2A}}},
  teppo:   {base:'hero',abuild:'a_male',o:{hat:{kind:'kasa',col:0xC8A060,col2:0xA88040},hair:{style:'short',col:0x3A2418},outfit:{col:0x2A2A30,top:0x8C2A2A,collar:0x5A1E1E,trim:0xC8A060,belt:0x2A2A30,lining:0x5A1E1E},weapon:{kind:'staff',col:0x5A3A22,col2:0x2A2A30},back:{kind:'bag',col:0x6B4A2A},extra:null}},
  sohei:   {base:'benkei',abuild:'a_male',o:{build:'normal',outfit:{col:0x2A2A30,kesa:0xC8902A,inner:0x3A3A42},extra:null}},
  miko:    {base:'onmyoji',abuild:'a_female',o:{hat:{kind:'none'},hair:{style:'long',col:0x1C1C22,col2:0x2A2A30,len:2.2},outfit:{kind:'hakama',col:0xC8342C,top:0xF4F1EA,collar:0xF4F1EA,trim:0xC8342C,belt:0xC8342C,lining:0xC8342C},weapon:{kind:'bellstaff',col:0xF5C542},back:null}},
  tanuki:  {base:'hero',abuild:'a_round',o:{build:'round',skin:0x8C5A2E,hair:{style:'bald'},ears:'fox',earCol:0x6B4220,outfit:{kind:'bare',col2:0xD8C0A0},weapon:{kind:'orb',col:0x2A2A30},back:{kind:'bag',col:0xF4F1EA},hat:{kind:'leaves',col:0x6FB548,col2:0x3F7A3A},extra:null}},
  sumo:    {base:'hero',abuild:'a_round',o:{build:'round',skin:0xF2C8A0,hair:{style:'topknot',col:0x1C1C22},outfit:{kind:'bare',col2:0xF4F1EA},weapon:{kind:'none'},back:null,extra:null}},
  kabuki:  {base:'kitsune',abuild:'a_female',o:{ears:null,hair:{style:'bun',col:0x1C1C22,col2:0x2A2A30,tip:0x2A2A30},outfit:{kind:'kimono',col:0x1E1A22,inner:0xC8342C,trim:0xF5C542,belt:0xF5C542,pattern:0xF5C542},weapon:{kind:'fan',col:0xF5C542},back:null}},
  falcon:  {base:'hero',abuild:'a_male',o:{hair:{style:'short',col:0x6B4A2A},outfit:{col:0x6E4A2A,top:0x8C6A3A,collar:0x3F6A2A,trim:0x3F6A2A,lining:0x3F6A2A,belt:0x3A2418},back:{kind:'cape',col:0x3F6A2A},extra:null}},
  kusari:  {base:'ninja',abuild:'a_male',o:{hair:{style:'pony',col:0x22305E,col2:0x2E4280},outfit:{col:0x22305E,col2:0x1A2448,belt:0x8C8CA0},weapon:{kind:'sickle',col:0xE6ECF2,col2:0x3A2418}}},
  komainu: {base:'raiju',o:{col:0xB8B8B0,col2:0x8C8C86,belly:0xD8D8D0,stripes:false,headKind:'lion',headCol:0xB8B8B0,mane:0x9A9A92,maneTip:0xD8D8D0,muzzle:0xD8D8D0,cheek:0xD8D8D0,tail:'fluffy',tailCol:0x9A9A92,eyeCol:0xF5C542,eyeGlow:false,legFire:null}},
  shugen:  {base:'onmyoji',abuild:'a_youth',o:{hat:{kind:'tokin',col:0x1C1C22},hair:{style:'pony',col:0x6B4A2A},outfit:{kind:'robe',col:0xE8902A,inner:0xF4F1EA,trim:0xF4F1EA,belt:0xF4F1EA,pattern:0xF4F1EA},weapon:{kind:'bellstaff',col:0xF5C542},back:null}},
  kunoichi:{base:'ninja',abuild:'a_female',o:{hair:{style:'pony',col:0xBFD8F0,col2:0x9FC0E0},outfit:{col:0x3E6EC8,col2:0x2A3A6E,belt:0x9FE6FF},scarf:0x9FE6FF,weapon:{kind:'dagger',col:0x9FE6FF,glow:true}}},
  taiko:   {base:'hero',abuild:'a_youth',o:{hair:{style:'spiky',col:0x1C1C22,col2:0x2A2A30,tip:0x3A3A42},outfit:{col:0xF4F1EA,top:0x6E3FB0,collar:0xF5C542,trim:0xF5C542,lining:0x6E3FB0,belt:0xF5C542},weapon:{kind:'mallet',col:0xC8A060,s:0.6},back:null}},
  naginata:{base:'kitsune',abuild:'a_female',o:{ears:null,hair:{style:'long',col:0x1C1C22,col2:0x2A2A30,tip:0x2A2A30,len:2.0},outfit:{kind:'kimono',col:0xF2A8C0,inner:0xC8342C,trim:0xC8342C,belt:0xC8342C,pattern:0xFFFFFF},weapon:{kind:'naginata',col:0xE6ECF2,col2:0x6B2A1E},back:null}},
  tate:    {base:'samurai',abuild:'a_hero',o:{outfit:{col:0x2A3A6E,plate:0x1E2848,lace:0x3E5A9A,trim:0xF5C542,sleeve:0x1E2848,legs:0x1E2848},hat:{col:0x1E2848,col2:0xF5C542},weapon:{kind:'spear',col:0xD8DEE6,col2:0x3A2418},
             extra:(R,B)=>{ R.add('elbowL',G_.box(0.5,0.72,0.08),0x6B4A2A,{p:[0.04,-0.22,0.16]}); R.add('elbowL',G_.cyl(0.12,0.12,0.03,10),0xF5C542,{p:[0.04,-0.2,0.21],r:[Math.PI/2,0,0]}); }}},
  foxmage: {base:'kitsune',abuild:'a_female'}};
function troopSpec(cls){ const t=TROOP_SPECS[cls], b=t&&DEFS[t.base]; if(!b) return null;
  const sp=Object.assign({},b); for(const k in (t.o||{})){ const v=t.o[k]; sp[k]=(v&&typeof v==='object'&&!Array.isArray(v)&&b[k]&&typeof b[k]==='object')?Object.assign({},b[k],v):v; }
  sp.key='tr_'+cls; if(t.abuild) sp.abuild=t.abuild; return sp; }
const TROOP={};   /* cls -> {sp,b,proto,NB,height,tex,data,body,ol,n,bind} or null */
function getTroop(cls){ if(cls in TROOP) return TROOP[cls]; const sp=troopSpec(cls); if(!sp) return (TROOP[cls]=null);
  const pS=STYLE, pK=SEGK; let b; STYLE='anime'; SEGK=TROOP_SEGK; try{ b=buildByType(sp); } catch(err){ console.warn('troop build failed',cls,err&&err.message); } finally{ STYLE=pS; SEGK=pK; }
  if(!b) return (TROOP[cls]=null);
  b.rig.minPart=TROOP_MINPART; b.rig.minPartOl=TROOP_MINPART_OL; const g=b.rig.build(), parts=[g.toon,g.glow].filter(Boolean), geo=mergeRaw(parts);
  /* colour and bone index per vertex; every part of a code-built character follows exactly one bone */
  let n=0; for(const q of parts) n+=q.attributes.position.count; const Cc=new Float32Array(n*3), Bi=new Float32Array(n); let o=0;
  for(const q of parts){ Cc.set(q.attributes.color.array,o*3); const si=q.attributes.skinIndex; for(let i=0;i<si.count;i++) Bi[o+i]=si.getX(i); o+=si.count; }
  geo.setAttribute('color',new T.BufferAttribute(Cc,3)); geo.setAttribute('aBone',new T.BufferAttribute(Bi,1)); geo.computeBoundingSphere();
  /* v86: the ink line only needs the big shapes (body, head, hair, weapon); it skips the small parts and the face, which halves its triangles */
  let olGeo=geo; if(g.ol){ olGeo=mergeRaw([g.ol]); const m=g.ol.attributes.position.count, C2=new Float32Array(m*3), B2=new Float32Array(m); C2.set(g.ol.attributes.color.array); const si=g.ol.attributes.skinIndex; for(let i=0;i<m;i++) B2[i]=si.getX(i); olGeo.setAttribute('color',new T.BufferAttribute(C2,3)); olGeo.setAttribute('aBone',new T.BufferAttribute(B2,1)); olGeo.computeBoundingSphere(); }
  const bb=g.toon.boundingBox; let height=bb.max.y-Math.min(0,bb.min.y);
  if(b.kind==='human'){ const hw=b.rig.byName.head.userData.world.y, hr=b.B.head; height=Math.min(height,(hw+hr*2.15)*1.06); }
  const NB=b.rig.bones.length, data=new Float32Array(NB*3*TROOP_CAP*4), tex=new T.DataTexture(data,NB*3,TROOP_CAP,T.RGBAFormat,T.FloatType);
  tex.minFilter=tex.magFilter=T.NearestFilter; tex.generateMipmaps=false; tex.needsUpdate=true;
  const body=new T.InstancedMesh(geo,celMat({bones:tex}),TROOP_CAP), ol=new T.InstancedMesh(olGeo,olBonesMat(tex),TROOP_CAP);
  for(const m of [body,ol]){ m.frustumCulled=false; m.count=0; m.visible=false; if(opt.scene) opt.scene.add(m); }
  for(let i=0;i<TROOP_CAP;i++) body.setColorAt(i,WHITE);
  ol.onBeforeRender=olBeforeRender;
  const bind=b.rig.bones.map(bn=>bn.userData.world.clone());
  return (TROOP[cls]={cls,sp,b,proto:b.rig,NB,height,tex,data,body,ol,slots:[],bind,tris:Math.round(geo.attributes.position.count/3)}); }
const tLive=new Map(), tPool={};
const _tm=new T.Matrix4(), _tw=new T.Matrix4(), _tq=new T.Quaternion(), _tv=new T.Vector3(), _ts=new T.Vector3(), _tc=new T.Color(), _ty=new T.Vector3(0,1,0), _t0=new T.Matrix4().makeScale(0,0,0);
/* every live soldier owns a fixed row (slot) in its type's pose texture; rows stay packed at the front so one draw covers them */
function tFree(I){ const K=I.K, last=K.slots.pop(); if(last!==I){ const from=last.slot; K.slots[I.slot]=last; last.slot=I.slot; last.dirty=true;
    for(const m of [K.body,K.ol]){ m.getMatrixAt(from,_tw); m.setMatrixAt(last.slot,_tw); } K.body.getColorAt(from,_tc); K.body.setColorAt(last.slot,_tc); } I.slot=-1; tLive.delete(I.ent); (tPool[I.cls]=tPool[I.cls]||[]).push(I); }
function tAcquire(ent,cls){ let I=tLive.get(ent); if(I&&I.cls===cls){ I.tag=frameTag; return I; } if(I) tFree(I);
  const K=getTroop(cls); if(!K||K.slots.length>=TROOP_CAP) return null; const p=tPool[cls];
  if(p&&p.length) I=p.pop(); else { const rig=cloneRig(K.proto), dg=new T.Group(); dg.add(rig.root); I={cls,K,b:rig.map,bones:rig.bones,dg,kind:K.b.kind,B:{height:K.height,b:K.b},sp:K.sp,mats:new Float32Array(K.NB*16)}; }
  I.st={phase:Math.random()*TAU,move:0,atk:0,last:null,yaw:0,t:Math.random()*10,hit:0,cast:0,dash:0,lift:0,atkU:-1}; I.prev=null; I.rot=null; I.tag=frameTag; I.ent=ent;
  I.slot=K.slots.length; K.slots.push(I); I.dirty=true; tLive.set(ent,I); return I; }
/* pose -> per-bone skin matrices (posed bone times inverse bind), in the troop's own space */
function tBake(I){ I.dg.updateMatrixWorld(true); const K=I.K;
  for(let i=0;i<K.NB;i++){ const bn=I.bones[i], w=K.bind[i]; _tm.makeTranslation(-w.x,-w.y,-w.z); _tw.multiplyMatrices(bn.matrixWorld,_tm); _tw.toArray(I.mats,i*16); } I.dirty=true; }
const TROOPS={
  has:cls=>!!getTroop(cls),
  keys:()=>Object.keys(TROOP_SPECS),
  begin(){},
  /* p: {x,y,z,rot,H,dt,moving,atk,style,flash,atkDur,tint} */
  drive(ent,cls,p){ const I=tAcquire(ent,cls); if(!I) return false; const K=I.K, S=I.st, dt=Math.min(0.05,p.dt||0.016);
    S.t+=dt; let spd=0; if(S.last){ spd=Math.hypot(p.x-S.last.x,p.z-S.last.z)/Math.max(dt,1e-4); } S.last={x:p.x,z:p.z};
    const want=p.moving?clamp(spd/(p.H*2.2+0.01),0.35,1):0; S.move=lerp(S.move,want,1-Math.exp(-dt*10));
    S.phase+=dt*(1.5+spd/Math.max(0.3,p.H*0.38))*(S.move>0.05?1:0.3);
    const a=p.atk||0; if(a>(S.prevAtk||0)+0.2) S.atkU=0.18; S.prevAtk=a; if(S.atkU>=0){ S.atkU+=dt/(p.atkDur||0.4); if(S.atkU>=1) S.atkU=-1; }
    S.hitT=Math.max((S.hitT||0)-dt*5,p.flash>0.5?1:0); S.hit+=(S.hitT-S.hit)*(1-Math.exp(-dt*(S.hitT>S.hit?30:9)));
    const sc=(p.H||2)/K.height, vis=onScreen(p.x,(p.y||0)+(p.H||2)*0.5,p.z,(p.H||2)*0.75);
    if(!vis.in){ LODN.off++; S.stepAcc=0; K.body.setMatrixAt(I.slot,_t0); K.ol.setMatrixAt(I.slot,_t0); I.shown=false; return true; }
    const st=I.kind==='human'?styleOf(I.sp,p.style):'def', iu=IMPACT_U[st]||IMPACT_U.def;
    if(S.atkU>=0&&S.prevU!=null&&S.prevU<iu&&S.atkU>=iu&&!S.frz){ S.frz=MOTION.impactFreeze; S.atkU=iu; }
    S.prevU=S.atkU; if(S.frz>0){ S.frz-=dt; if(S.frz<=0) S.frz=0; else { if(S.atkU>=0) S.atkU=iu; S.t-=dt; } }
    const hz=vis.px<MOTION.farPx?MOTION.farHz:MOTION.stepHz; S.stepAcc=(S.stepAcc||0)+dt;
    const snap=S.atkU>=0&&S.atkU>iu-0.1&&S.atkU<iu+0.08?1:0;
    if(!S.frz&&(S.stepAcc>=1/hz||!I.prev)){ const pdt=S.stepAcc; S.stepAcc=S.stepAcc%(1/hz);
      POSE[I.kind](I,{style:p.style},pdt); smoothPose(I,pdt,snap); tBake(I); LODN.posed++; } else LODN.held++;
    /* facing eases toward the travel direction; placement is updated every frame so movement stays smooth */
    if(I.rot==null) I.rot=p.rot; let d=p.rot-I.rot; d=Math.atan2(Math.sin(d),Math.cos(d)); I.rot+=d*(1-Math.exp(-dt*14));
    _tq.setFromAxisAngle(_ty,I.rot); _tv.set(p.x,p.y||0,p.z); _ts.setScalar(sc); _tw.compose(_tv,_tq,_ts);
    K.body.setMatrixAt(I.slot,_tw); K.ol.setMatrixAt(I.slot,_tw); I.shown=true;
    _tc.setRGB(1,1,1); if(p.tint!=null) _tc.set(p.tint).lerp(WHITE,0.55);
    if(S.hit>0.02) _tc.setRGB(1+S.hit*0.9,1-S.hit*0.25,1-S.hit*0.3);
    K.body.setColorAt(I.slot,_tc); return true; },
  end(){ for(const I of [...tLive.values()]) if(I.tag!==frameTag) tFree(I);
    for(const k in TROOP){ const K=TROOP[k]; if(!K) continue; const n=K.slots.length; K.body.count=K.ol.count=n; K.body.visible=K.ol.visible=n>0; if(!n) continue;
      const D=K.data, RW=K.NB*12; let up=0;
      for(const I of K.slots){ if(!I.dirty) continue; I.dirty=false; const row=I.slot*RW, M=I.mats;
        for(let i=0;i<K.NB;i++){ const s0=i*16, o=row+i*12;   /* three rows of each affine bone matrix */
          D[o]=M[s0]; D[o+1]=M[s0+4]; D[o+2]=M[s0+8]; D[o+3]=M[s0+12]; D[o+4]=M[s0+1]; D[o+5]=M[s0+5]; D[o+6]=M[s0+9]; D[o+7]=M[s0+13]; D[o+8]=M[s0+2]; D[o+9]=M[s0+6]; D[o+10]=M[s0+10]; D[o+11]=M[s0+14]; }
        K.tex.addUpdateRange(row,RW); up++; }
      if(up) K.tex.needsUpdate=true;
      for(const m of [K.body,K.ol]){ m.instanceMatrix.clearUpdateRanges(); m.instanceMatrix.addUpdateRange(0,n*16); m.instanceMatrix.needsUpdate=true; }
      K.body.instanceColor.clearUpdateRanges(); K.body.instanceColor.addUpdateRange(0,n*3); K.body.instanceColor.needsUpdate=true; } },
  clear(){ for(const I of [...tLive.values()]) tFree(I); for(const k in TROOP){ const K=TROOP[k]; if(K){ K.body.visible=K.ol.visible=false; K.body.count=K.ol.count=0; } } },
  stats:()=>({live:tLive.size,types:Object.keys(TROOP).filter(k=>TROOP[k]).map(k=>k+':'+TROOP[k].tris+'t/'+TROOP[k].NB+'b')}),
  setOutline(on){ for(const k in TROOP) if(TROOP[k]) TROOP[k].ol.material.visible=!!on; } };

/* ================================================================ public driver */
const live=new Map(), pool={}; let frameTag=0;
/* v86 weapon trail: while a heroic character swings, a ribbon between the hand and the weapon tip follows the arc and fades in
   about 0.18 s (one extra additive draw, only for the one or two characters mid-swing) */
const TRAIL_N=9, TRAIL_LIFE=0.24, TRAIL_MAT=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,fog:false,toneMapped:false});
const TRAIL_STYLES={blade:0xDDF0FF,melee:0xFFDDA8,thrust:0xE8F6FF,spin:0xFFC8A0};
const _th=new T.Vector3(), _te=new T.Vector3(), _tt=new T.Vector3();
function trailOf(I){ if(I.trail) return I.trail;
  const g=new T.BufferGeometry(), P=new Float32Array(TRAIL_N*6), C=new Float32Array(TRAIL_N*8), idx=[];
  g.setAttribute('position',new T.BufferAttribute(P,3).setUsage(T.DynamicDrawUsage)); g.setAttribute('color',new T.BufferAttribute(C,4).setUsage(T.DynamicDrawUsage));
  for(let i=0;i<TRAIL_N-1;i++){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } g.setIndex(idx);
  const m=new T.Mesh(g,TRAIL_MAT); m.frustumCulled=false; m.renderOrder=4; m.visible=false; if(opt.scene) opt.scene.add(m);
  return (I.trail={m,P,C,g,pts:[]}); }
function trailTick(I,active,dt,sc,col){ let TR=I.trail; if(!TR&&!active) return; if(active&&!TR) TR=trailOf(I);
  if(active&&I.b&&I.b.handR&&I.b.elbowR){ I.grp.updateMatrixWorld(true); I.b.handR.getWorldPosition(_th); I.b.elbowR.getWorldPosition(_te);
    if(I.B&&I.B.tip) I.b.handR.localToWorld(_tt.copy(I.B.tip)); else _tt.copy(_th).sub(_te).normalize().multiplyScalar(1.0*sc).add(_th); TR.pts.unshift({h:_th.clone(),t:_tt.clone(),age:0}); if(TR.pts.length>TRAIL_N) TR.pts.pop(); }
  for(const q of TR.pts) q.age+=dt; while(TR.pts.length&&TR.pts[TR.pts.length-1].age>TRAIL_LIFE) TR.pts.pop();
  if(TR.pts.length<2){ TR.m.visible=false; return; }
  _tint.set(col); const L=TR.pts.length;
  for(let i=0;i<TRAIL_N;i++){ const q=TR.pts[Math.min(i,L-1)], f=(i<L?Math.pow(Math.max(0,1-q.age/TRAIL_LIFE),1.4)*(1-i/TRAIL_N*0.5):0)*1.2;
    TR.P[i*6]=q.h.x; TR.P[i*6+1]=q.h.y; TR.P[i*6+2]=q.h.z; TR.P[i*6+3]=q.t.x; TR.P[i*6+4]=q.t.y; TR.P[i*6+5]=q.t.z;
    TR.C[i*8]=_tint.r; TR.C[i*8+1]=_tint.g; TR.C[i*8+2]=_tint.b; TR.C[i*8+3]=Math.min(1,f*0.4); TR.C[i*8+4]=_tint.r; TR.C[i*8+5]=_tint.g; TR.C[i*8+6]=_tint.b; TR.C[i*8+7]=Math.min(1,f); }
  TR.g.attributes.position.needsUpdate=true; TR.g.attributes.color.needsUpdate=true; TR.m.visible=true; }
const _tint=new T.Color(), WHITE=new T.Color(1,1,1);
function acquire(ent,key){ let I=live.get(ent); if(I&&I.key===key){ I.tag=frameTag; return I; }
  if(I) release(ent,I);
  const p=pool[key]; I=(p&&p.length)?p.pop():makeInstance(key); if(!I) return null;
  I.st.last=null; I.st.atkU=-1; I.st.hit=0; I.st.hitT=0; I.prev=null; I.tag=frameTag; I.grp.visible=true; live.set(ent,I); if(opt.scene&&!I.grp.parent) opt.scene.add(I.grp); return I; }
function release(ent,I){ live.delete(ent); I.grp.visible=false; if(I.trail){ I.trail.m.visible=false; I.trail.pts.length=0; } (pool[I.key]=pool[I.key]||[]).push(I); }
const API={
  has:key=>!!DEFS[key],
  troops:TROOPS,
  registerModel, models:()=>Object.fromEntries(Object.entries(IMPORTED).map(([k,v])=>[k,{status:v.status,error:v.error,bones:v.proto&&v.proto.map,height:v.proto&&v.proto.height}])), bones:GK_BONES, autoBoneMap,
  keys:()=>Object.keys(DEFS),
  prebuild:keys=>{ for(const k of keys) getBuilt(k); },
  style:()=>STYLE,
  /* switch anime/chibi live: drop every built model and instance; characters rebuild on their next frame */
  setStyle(st){ if(st!=='anime'&&st!=='chibi'||st===STYLE) return STYLE; STYLE=st; try{ localStorage.setItem('gk-style2',st); }catch(e){}
    for(const [ent,I] of [...live]) release(ent,I);
    for(const k in pool){ for(const I of pool[k]) if(I.grp.parent) I.grp.parent.remove(I.grp); delete pool[k]; }
    for(const k in BUILT){ const g=BUILT[k].geos; for(const n of ['toon','ol','glow']) if(g[n]) g[n].dispose(); delete BUILT[k]; }
    return STYLE; },
  begin(){ frameTag++; GK_T.value=(performance.now()%100000)/1000; LODN.off=LODN.posed=LODN.held=LODN.frozen=0; if(CAM.c){ const c=CAM.c; c.updateMatrixWorld(); _pm.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); CAM.ok=true; } },
  setCamera(c){ CAM.c=c||null; CAM.ok=false; },
  motion:MOTION, cel:CEL, outline:OUTLINE, lod:()=>Object.assign({},LODN),
  /* p: {x,y,z,rot,H,dt,moving,atk,style,flash,frozen,burn,cast,castKind,castU,stun,scale,tint} */
  drive(ent,key,p){ const I=acquire(ent,key); if(!I) return false; const S=I.st, dt=Math.min(0.05,p.dt||0.016);
    S.t+=dt;
    /* speed from movement, so feet keep pace with the ground */
    let spd=0; if(S.last){ spd=Math.hypot(p.x-S.last.x,p.z-S.last.z)/Math.max(dt,1e-4); } S.last={x:p.x,z:p.z};
    const want=p.moving?clamp(spd/(p.H*2.2+0.01),0.35,1):0; S.move=lerp(S.move,want,1-Math.exp(-dt*10));
    S.phase+=dt*(1.5+spd/Math.max(0.3,p.H*0.38))*(S.move>0.05?1:0.3);
    /* attack progress: the game sets atk to ~0.9 on each strike and lets it decay */
    const a=p.atk||0; if(a>(S.prevAtk||0)+0.2) S.atkU=p.atkStart!=null?p.atkStart:0.18; S.prevAtk=a;   /* start just into the wind-up so the impact lands as the hit happens */
    if(S.atkU>=0){ S.atkU+=dt/(p.atkDur||0.42); if(S.atkU>=1) S.atkU=-1; }
    S.hitT=Math.max((S.hitT||0)-dt*5,p.flash>0.5?1:0); S.hit+=(S.hitT-S.hit)*(1-Math.exp(-dt*(S.hitT>S.hit?30:9)));
    const sc=(p.H||2)/I.B.height*(p.scale||1)*(STYLE==='anime'&&I.kind==='human'?ANIME_PRESENCE:1);
    /* v82 performance: skip characters outside the camera view entirely (no posing, no skinning, no draw),
       and pose small, distant ones less often */
    const vis=onScreen(p.x,(p.y||0)+(p.H||2)*0.5,p.z,(p.H||2)*0.75*(p.scale||1));
    I.grp.visible=vis.in; if(!vis.in){ if(I.trail) I.trail.m.visible=false; LODN.off++; S.stepAcc=0; I.grp.position.set(p.x,p.y||0,p.z); return true; }
    /* v82 anime motion: the impact pose freezes for a moment when the blow lands (local hit-stop), and in the
       anime style the body is posed on a 15 Hz beat ("on twos", like TV animation) while movement stays smooth */
    const st=I.kind==='human'?styleOf(I.sp,p.style):'def', iu=IMPACT_U[st]||IMPACT_U.def;
    if(S.atkU>=0&&S.prevU!=null&&S.prevU<iu&&S.atkU>=iu&&!S.frz){ S.frz=MOTION.impactFreeze; S.atkU=iu; }
    S.prevU=S.atkU; if(S.frz>0){ S.frz-=dt; if(S.frz<=0) S.frz=0; else { if(S.atkU>=0) S.atkU=iu; S.t-=dt; } }
    const hz=vis.px<MOTION.farPx?MOTION.farHz:(stepHz()||0);
    S.stepAcc=(S.stepAcc||0)+dt; const snap=S.atkU>=0&&S.atkU>iu-0.1&&S.atkU<iu+0.08?1:0;
    if(S.frz>0) LODN.frozen++;
    else if(!hz||S.stepAcc>=1/hz||!I.prev){ const pdt=S.stepAcc; S.stepAcc=hz?S.stepAcc%(1/hz):0;
      POSE[I.kind](I,{style:p.style,cast:!!p.cast,castKind:p.castKind,castU:p.castU,stun:p.stun},pdt);
      smoothPose(I,pdt,snap); if(I.retarget) I.retarget(); LODN.posed++; }
    else LODN.held++;
    /* place, face and scale */
    I.grp.position.set(p.x,p.y||0,p.z); I.grp.scale.setScalar(sc);
    const targetYaw=p.rot+(S.yaw||0); let d=targetYaw-I.grp.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); I.grp.rotation.y+=d*(1-Math.exp(-dt*14));
    if(OL_MAT.userData.sh) OL_MAT.userData.sh.uniforms.uOut.value=1;
    if(I.kind==='human'&&!I.imported&&STYLE==='anime'){ const swing=S.atkU>=0.1&&S.atkU<iu+0.2&&(TRAIL_STYLES[st]!=null)&&!(p.cast); trailTick(I,swing,dt,sc,TRAIL_STYLES[st]||0xFFFFFF); }
    /* status tints and hit flash */
    _tint.copy(WHITE); if(p.tint!=null) _tint.set(p.tint).lerp(WHITE,0.55); if(p.frozen) _tint.setRGB(0.65,0.9,1.0); if(p.burn) _tint.setRGB(1,0.82,0.7);
    for(const m of (I.mats||[I.mat])){ m.color.copy(m.userData.base||WHITE).multiply(_tint); m.emissive.setRGB(S.hit*0.55,S.hit*0.12,S.hit*0.1); }
    /* v85 death dissolve (p.dissolve 0..1): body, ink line and glow all burn away together */
    const dis=p.dissolve||0;
    if(dis>0||I.dis){ I.dis=dis; for(const m of (I.mats||[I.mat])) if(m.userData.dis) m.userData.dis.value=dis;
      if(I.ol){ if(dis>0){ if(!I.olD){ I.olU={value:0}; I.olD=olMake(true,I.olU); } I.olU.value=dis; I.ol.material=I.olD; } else I.ol.material=OL_MATC; }
      if(I.gl) I.gl.visible=dis<0.02; if(I.hl) I.hl.visible=dis<0.02; }
    return true; },
  end(){ for(const [ent,I] of [...live]) if(I.tag!==frameTag) release(ent,I); },
  clear(){ for(const [ent,I] of [...live]) release(ent,I); },
  stats:()=>({live:live.size,built:Object.keys(BUILT).length,pooled:Object.values(pool).reduce((a,p)=>a+p.length,0),lod:Object.assign({},LODN),style:STYLE,motion:MOTION.step,stepHz:stepHz()}),
  instance:ent=>live.get(ent),
  DEFS, BUILDS, kit:{G_,Rig,toonMat,shade,mergeRaw} };
return API; };
})();
