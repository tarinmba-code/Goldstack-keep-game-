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
const TAU=Math.PI*2;

/* ================================================================ geometry kit
   Every helper returns a non-indexed BufferGeometry with position + normal only, so parts merge freely. */
function ni(g){ let n=g.index?g.toNonIndexed():g; for(const k of Object.keys(n.attributes)) if(k!=='position'&&k!=='normal') n.deleteAttribute(k); if(!n.attributes.normal) n.computeVertexNormals(); return n; }
const G_={
  sph:(rx,ry,rz,ws=16,hs=12)=>{ const g=new T.SphereGeometry(1,ws,hs); g.scale(rx,ry==null?rx:ry,rz==null?rx:rz); return ni(g); },
  part:(rx,ry,rz,ps,pl,ts,tl,ws=18,hs=12)=>{ const g=new T.SphereGeometry(1,ws,hs,ps,pl,ts,tl); g.scale(rx,ry,rz); return ni(g); },
  hemi:(rx,ry,rz,ws=16)=>{ const g=new T.SphereGeometry(1,ws,8,0,TAU,0,Math.PI/2); g.scale(rx,ry,rz); return ni(g); },
  cap:(r,len,rs=10)=>ni(new T.CapsuleGeometry(r,Math.max(0.001,len),4,rs)),
  cyl:(rt,rb,h,rs=12,open=false)=>ni(new T.CylinderGeometry(rt,rb,h,rs,1,open)),
  cone:(r,h,rs=10)=>ni(new T.ConeGeometry(r,h,rs)),
  box:(w,h,d)=>ni(new T.BoxGeometry(w,h,d)),
  tor:(R,r,rs=8,ts=24,arc=TAU)=>ni(new T.TorusGeometry(R,r,rs,ts,arc)),
  lathe:(pts,seg=16)=>{ const q=pts[0][1]>pts[pts.length-1][1]?pts.slice().reverse():pts;   /* profile must run bottom-up so faces point outward */
    return ni(new T.LatheGeometry(q.map(p=>new T.Vector2(Math.max(0.0005,p[0]),p[1])),seg)); },
  /* tapered tube along a smooth curve: radius goes r0 -> r1 */
  tube:(pts,r0,r1,rs=7,seg=14)=>{ const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])));
    const g=new T.TubeGeometry(curve,seg,1,rs,false), pos=g.attributes.position, nrm=g.attributes.normal, P=new T.Vector3();
    for(let i=0;i<=seg;i++){ const t=i/seg, r=lerp(r0,r1,t), c=curve.getPointAt(t);
      for(let j=0;j<=rs;j++){ const k=i*(rs+1)+j; P.fromBufferAttribute(pos,k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k,P.x,P.y,P.z); } }
    g.computeVertexNormals(); const out=ni(g);
    const tip=G_.sph(Math.max(r1,0.004),Math.max(r1,0.004),Math.max(r1,0.004),6,4); tip.translate(pts[pts.length-1][0],pts[pts.length-1][1],pts[pts.length-1][2]);
    const cap0=G_.sph(r0,r0,r0,8,6); cap0.translate(pts[0][0],pts[0][1],pts[0][2]);
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
  add(bone,geo,col,o){ o=o||{}; this.parts.push({bone:typeof bone==='string'?this.byName[bone]:bone,geo,col,p:o.p||[0,0,0],r:o.r||[0,0,0],s:o.s||[1,1,1],glow:!!o.glow,ol:o.ol!==false&&!o.glow}); return this; }
  build(){
    const groups={toon:[],ol:[],glow:[]};
    for(const pt of this.parts){
      const b=pt.bone, w=b.userData.world;
      _q.setFromEuler(_e.set(pt.r[0],pt.r[1],pt.r[2])); _s.set(pt.s[0],pt.s[1],pt.s[2]); _v.set(pt.p[0]+w.x,pt.p[1]+w.y,pt.p[2]+w.z);
      _m.compose(_v,_q,_s); _nm.getNormalMatrix(_m);
      const src=pt.geo, n=src.attributes.position.count, P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3), SI=new Uint16Array(n*4), SW=new Float32Array(n*4);
      _c.set(pt.col);
      for(let i=0;i<n;i++){ _v.fromBufferAttribute(src.attributes.position,i).applyMatrix4(_m); P[i*3]=_v.x; P[i*3+1]=_v.y; P[i*3+2]=_v.z;
        _v.fromBufferAttribute(src.attributes.normal,i).applyMatrix3(_nm).normalize(); N[i*3]=_v.x; N[i*3+1]=_v.y; N[i*3+2]=_v.z;
        C[i*3]=_c.r; C[i*3+1]=_c.g; C[i*3+2]=_c.b; SI[i*4]=b.userData.idx; SW[i*4]=1; }
      const rec={P,N,C,SI,SW,n};
      if(pt.glow) groups.glow.push(rec); else { groups.toon.push(rec); if(pt.ol) groups.ol.push(rec); } }
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
const OL_MAT=new T.MeshBasicMaterial({color:0x1A1422,side:T.BackSide,fog:false});
OL_MAT.onBeforeCompile=sh=>{ sh.uniforms.uOut={value:1}; OL_MAT.userData.sh=sh;
  sh.vertexShader='uniform float uOut;\n'+sh.vertexShader.replace('#include <skinning_vertex>','#include <skinning_vertex>\n#ifdef USE_SKINNING\n  transformed += normalize(objectNormal) * 0.022 * uOut;\n#endif'); };
OL_MAT.customProgramCacheKey=()=>'gk3d-outline';
const GLOW_MAT=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false});
/* heroes and bosses must read as clearly as the painted troops: no fog, and half of their colour is unlit so night
   and dusk lighting never wash them out; a touch of extra saturation keeps them vivid next to the sprites */
function toonMat(o){ o=Object.assign({flat:0.32,sat:1.2,fog:false,wcap:0.84},o||{}); const m=new T.MeshToonMaterial({vertexColors:true,gradientMap:gradTex,color:0xFFFFFF,emissive:0x000000,fog:o.fog});
  m.onBeforeCompile=sh=>{ if(o.wcap<1) sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n  { float L0=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114)); if(L0>'+o.wcap.toFixed(2)+') diffuseColor.rgb*='+o.wcap.toFixed(2)+'/L0; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
    '{ vec3 lit=outgoingLight; outgoingLight=mix(lit,diffuseColor.rgb*vec3(1.04),'+o.flat.toFixed(2)+'); float lum=dot(outgoingLight,vec3(0.299,0.587,0.114)); outgoingLight=clamp(mix(vec3(lum),outgoingLight,'+o.sat.toFixed(2)+'),0.0,1.0); float rim=1.0-max(dot(normalize(normal),normalize(vViewPosition)),0.0); outgoingLight+=diffuseColor.rgb*smoothstep(0.55,1.0,rim)*0.32+vec3(0.06)*smoothstep(0.75,1.0,rim); }\n#include <opaque_fragment>'); };
  m.customProgramCacheKey=()=>'gk3d-toon-rim3-'+o.flat+'-'+o.sat+'-'+o.fog+'-'+o.wcap; return m; }

/* ================================================================ palette helpers */
const shade=(c,f)=>{ _c.set(c); const r=Math.min(255,Math.round(_c.r*255*f)), g=Math.min(255,Math.round(_c.g*255*f)), b=Math.min(255,Math.round(_c.b*255*f)); return (r<<16)|(g<<8)|b; };
const INK=0x1A1422;

/* ================================================================ HUMANOID
   Model units: feet at y=0, about 2 units tall. Faces +Z. */
const BUILDS={
  chibi:  {head:0.36,leg:0.62,torso:0.5, w:0.28,limb:0.088,arm:0.5},
  hero:   {head:0.29,leg:0.82,torso:0.6, w:0.27,limb:0.072,arm:0.62},
  slim:   {head:0.26,leg:0.9, torso:0.62,w:0.25,limb:0.065,arm:0.64},
  normal: {head:0.25,leg:0.88,torso:0.64,w:0.3, limb:0.08, arm:0.66},
  broad:  {head:0.24,leg:0.82,torso:0.68,w:0.4, limb:0.11, arm:0.7},
  giant:  {head:0.26,leg:0.78,torso:0.72,w:0.48,limb:0.14, arm:0.78},
  round:  {head:0.3, leg:0.5, torso:0.6, w:0.48,limb:0.1,  arm:0.55}};
function buildHuman(sp){
  const B=Object.assign({},BUILDS[sp.build||'normal'],sp.prop||{}), R=new Rig();
  const legL=B.leg, thigh=legL*0.5, shin=legL*0.5-0.05, hipW=B.w*0.42, spineH=B.torso*0.36, chestH=B.torso*0.42, neckH=B.torso*0.12;
  const armSeg=B.arm*0.5, shW=B.w*0.95+B.limb*0.6;
  R.bone('hips','root',[0,legL+0.02,0]);
  R.bone('spine','hips',[0,spineH*0.6,0]); R.bone('chest','spine',[0,spineH,0]); R.bone('neck','chest',[0,chestH,0]); R.bone('head','neck',[0,neckH,0]);
  for(const sd of [1,-1]){ const L=sd>0?'L':'R';
    R.bone('arm'+L,'chest',[sd*shW,chestH*0.82,0]); R.bone('elbow'+L,'arm'+L,[0,-armSeg,0]); R.bone('hand'+L,'elbow'+L,[0,-armSeg*0.92,0]);
    R.bone('thigh'+L,'hips',[sd*hipW,-0.02,0]); R.bone('knee'+L,'thigh'+L,[0,-thigh,0]); R.bone('foot'+L,'knee'+L,[0,-shin,0]); }
  R.bone('skirt','hips',[0,0,0]); R.bone('back','chest',[0,chestH*0.5,-B.w*0.55]); R.bone('tail','hips',[0,0,-B.w*0.6]);
  R.bone('hair','head',[0,B.head*0.9,-B.head*0.4]);
  const skin=sp.skin||0xF6D2B0, o=sp.outfit||{}, oc=o.col||0x2F5DB8, oc2=o.col2||shade(oc,0.75), trim=o.trim||0xF5C542;
  const bulk=sp.build==='broad'||sp.build==='giant';
  /* --- body under clothes */
  const bodyCol=o.kind==='bare'?skin:oc;
  R.add('hips',G_.sph(B.w*0.95,B.torso*0.22,B.w*0.7),o.kind==='bare'?(o.col2||0x6B4A2A):oc2,{p:[0,0.02,0]});
  R.add('spine',G_.sph(B.w*0.9,spineH*0.75,B.w*0.66),bodyCol,{p:[0,spineH*0.45,0]});
  R.add('chest',G_.sph(B.w*(bulk?1.12:1.0),chestH*0.72,B.w*0.72),bodyCol,{p:[0,chestH*0.42,0.01]});
  if(o.kind==='bare'){ /* muscle definition */
    for(const sd of [1,-1]) R.add('chest',G_.sph(B.w*0.42,chestH*0.3,B.w*0.25),shade(skin,0.92),{p:[sd*B.w*0.42,chestH*0.5,B.w*0.55]});
    for(let i=0;i<3;i++) for(const sd of [1,-1]) R.add('spine',G_.sph(B.w*0.18,spineH*0.14,0.05),shade(skin,0.9),{p:[sd*B.w*0.2,spineH*(0.75-i*0.28),B.w*0.6]}); }
  R.add('neck',G_.cyl(B.limb*1.1,B.limb*1.3,neckH*1.6,10),skin,{p:[0,neckH*0.4,0]});
  /* arms */
  for(const sd of [1,-1]){ const L=sd>0?'L':'R';
    const upper=o.kind==='bare'||o.kind==='armor'||o.kind==='ninja'?skin:oc;
    R.add('arm'+L,G_.sph(B.limb*1.35,B.limb*1.3,B.limb*1.3),o.kind==='bare'?skin:oc,{p:[0,-B.limb*0.35,0]});
    R.add('arm'+L,G_.cap(B.limb*(bulk?1.25:1.05),armSeg*0.75),o.kind==='ninja'?oc:upper,{p:[0,-armSeg*0.5,0]});
    R.add('elbow'+L,G_.cap(B.limb*(bulk?1.12:0.95),armSeg*0.7),o.kind==='ninja'?oc:(o.kind==='armor'?(o.gaunt||oc2):upper),{p:[0,-armSeg*0.46,0]});
    R.add('hand'+L,G_.sph(B.limb*1.25,B.limb*1.15,B.limb*1.1),o.glove||skin,{p:[0,-B.limb*0.6,0.01]});
    if(o.kind==='robe'||o.kind==='kimono'||o.kind==='monk'||o.kind==='hakama'){ /* wide sleeves */
      const slv=o.kind==='hakama'?(o.top||0xF4F1EA):oc, sk=bulk?0.75:1; R.add('arm'+L,G_.cyl(B.limb*1.45*sk+0.02,B.limb*1.85*sk+0.03,armSeg*1.05,12,false),slv,{p:[0,-armSeg*0.52,0]});
      R.add('elbow'+L,G_.cyl(B.limb*1.85*sk+0.03,B.limb*2.2*sk+0.04,armSeg*0.82,12,false),slv,{p:[0,-armSeg*0.38,0]});
      R.add('elbow'+L,G_.tor(B.limb*2.15*sk+0.04,B.limb*0.3,6,18),trim,{p:[0,-armSeg*0.78,0],r:[Math.PI/2,0,0]}); }
    if(o.kind==='armor'||sp.pauldron){ /* layered shoulder plates */
      const pc=o.plate||oc2;
      for(let i=0;i<3;i++) R.add('arm'+L,G_.hemi(B.limb*(2.6-i*0.2),B.limb*1.3,B.limb*2.2),i%2?trim:pc,{p:[sd*B.limb*0.5,B.limb*(0.6-i*0.9),0],r:[0,0,sd*-0.35]}); }
    /* legs */
    const lc=o.legs||(o.kind==='bare'?skin:oc2);
    R.add('thigh'+L,G_.cap(B.limb*(bulk?1.45:1.25),thigh*0.7),lc,{p:[0,-thigh*0.5,0]});
    R.add('knee'+L,G_.cap(B.limb*(bulk?1.25:1.05),shin*0.72),o.shin||lc,{p:[0,-shin*0.5,0]});
    const bareFoot=o.kind==='bare'&&!o.shoe; R.add('foot'+L,G_.sph(B.limb*1.3,B.limb*0.9,B.limb*2.1),bareFoot?skin:(o.shoe||0x3A2A22),{p:[0,0.02,B.limb*0.9]});
    if(bareFoot) for(let k=0;k<3;k++) R.add('foot'+L,G_.cone(B.limb*0.28,B.limb*0.6,5),0xF2EAD8,{p:[(k-1)*B.limb*0.6,0.0,B.limb*2.8],r:[Math.PI/2,0,0]});
    if(o.kind==='hakama'||o.kind==='robe'||o.kind==='kimono') R.add('foot'+L,G_.box(B.limb*1.6,0.03,B.limb*3.2),0xF4F1EA,{p:[0,-0.04,B.limb*0.9]}); }
  /* --- outfits */
  const skirt=(top,bot,len,rs,col,flare=1)=>R.add('skirt',G_.lathe([[top,0.05],[top*1.05,-len*0.25],[lerp(top,bot,0.7)*flare,-len*0.7],[bot*flare,-len],[bot*flare*0.96,-len*1.01]],rs),col,{p:[0,0,0]});
  if(o.kind==='robe'||o.kind==='kimono'||o.kind==='monk'){
    skirt(B.w*0.98,B.w*(o.kind==='kimono'?1.15:1.45),legL*(o.short?0.7:0.97),18,oc);
    /* crossed collar */
    for(const sd of [1,-1]) R.add('chest',G_.box(0.06,chestH*1.05,0.03),trim,{p:[sd*B.w*0.16,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.5]});
    R.add('spine',G_.cyl(B.w*0.95,B.w*0.97,spineH*0.5,18),o.belt||trim,{p:[0,spineH*0.15,0],s:[1,1,0.75]});
    if(o.kind==='monk') for(let i=0;i<9;i++){ const a=-0.6+i*0.15; R.add('chest',G_.sph(0.05),0x2A1E18,{p:[Math.sin(a)*B.w*0.75,chestH*(0.82-Math.cos(a*1.3)*0.55),B.w*0.62+Math.cos(a)*0.05]}); }
    if(o.pattern) for(let i=0;i<6;i++){ const a=i/6*TAU; R.add('skirt',G_.sph(0.07,0.07,0.02),o.pattern,{p:[Math.sin(a)*B.w*1.25,-legL*0.6,Math.cos(a)*B.w*1.25],r:[0,a,0]}); } }
  else if(o.kind==='armor'){
    R.add('chest',G_.sph(B.w*1.1,chestH*0.66,B.w*0.8,12,8),o.plate||oc2,{p:[0,chestH*0.45,0.03]});
    for(let i=0;i<3;i++) R.add('chest',G_.tor(B.w*1.02,0.022,5,20),trim,{p:[0,chestH*(0.25+i*0.18),0.02],r:[Math.PI/2,0,0],s:[1,0.78,1]});
    if(o.emblem) R.add('chest',G_.sph(0.08,0.08,0.03),o.emblem,{p:[0,chestH*0.55,B.w*0.8]});
    R.add('spine',G_.cyl(B.w*0.95,B.w*0.97,spineH*0.4,18),o.belt||trim,{p:[0,spineH*0.1,0],s:[1,1,0.78]});
    /* kusazuri: plated skirt in segments */
    for(let i=0;i<7;i++){ const a=(i/7)*TAU+0.2; R.add('skirt',G_.box(B.w*0.62,legL*0.42,0.05),i%2?oc:oc2,{p:[Math.sin(a)*B.w*0.9,-legL*0.2,Math.cos(a)*B.w*0.8],r:[0.18*Math.cos(a),a,-0.18*Math.sin(a)]}); }
    if(o.robe) skirt(B.w*0.95,B.w*1.35,legL*0.95,16,o.robe); }
  else if(o.kind==='hakama'){ skirt(B.w*0.95,B.w*1.45,legL*0.95,14,oc2);
    for(let i=0;i<5;i++){ const a=(i-2)*0.35; R.add('skirt',G_.box(0.018,legL*0.75,0.02),shade(oc2,0.6),{p:[Math.sin(a)*B.w*1.18,-legL*0.5,Math.cos(a)*B.w*1.18],r:[-0.12,a,0],ol:false}); }
    for(const sd of [1,-1]) R.add('chest',G_.box(0.055,chestH,0.03),trim,{p:[sd*B.w*0.16,chestH*0.42,B.w*0.7],r:[0.12,0,sd*0.5]});
    R.add('spine',G_.cyl(B.w*0.95,B.w*0.97,spineH*0.4,18),o.belt||0xD8342C,{p:[0,spineH*0.15,0],s:[1,1,0.75]}); }
  else if(o.kind==='ninja'){ R.add('spine',G_.cyl(B.w*0.92,B.w*0.95,spineH*0.35,16),o.belt||0x6E4FA0,{p:[0,spineH*0.15,0],s:[1,1,0.75]}); }
  else if(o.kind==='bare'){ R.add('hips',G_.cyl(B.w*0.98,B.w*1.15,B.torso*0.32,14),o.col2||0xD9A441,{p:[0,-0.02,0],s:[1,1,0.8]});
    if(o.stripes) for(let i=0;i<12;i++){ const a=i/12*TAU; R.add('hips',G_.box(B.w*0.07,B.torso*0.22,0.02),INK,{p:[Math.sin(a)*B.w*1.08,-0.02-(i%2)*0.04,Math.cos(a)*B.w*0.88],r:[0,a,0.25],ol:false}); }
    R.add('hips',G_.tor(B.w*1.0,0.03,5,24),0xF2EAD8,{p:[0,B.torso*0.14,0],r:[Math.PI/2,0,0],s:[1,0.82,1]}); }
  if(sp.scarf) { R.add('neck',G_.tor(B.limb*1.9,B.limb*0.9,8,16),sp.scarf,{p:[0,-neckH*0.1,0],r:[Math.PI/2,0,0]}); R.add('back',G_.box(0.12,0.4,0.03),sp.scarf,{p:[0.08,-0.05,0.02],r:[0.2,0,0.2]}); }
  if(sp.beads) for(let i=0;i<14;i++){ const a=i/14*TAU; R.add('chest',G_.sph(0.055),sp.beads,{p:[Math.sin(a)*B.w*0.85,chestH*0.85-Math.cos(a)*0.06-(Math.cos(a)>0?0.18:0),Math.cos(a)*B.w*0.75]}); }
  buildHead(R,sp,B); buildWeapon(R,sp,B); buildBack(R,sp,B);
  if(sp.extra) sp.extra(R,B,G_);
  return {rig:R,kind:'human',B};
}

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
    R.add('head',G_.sph(hr,hr*1.05,hr*0.98,20,14),skin,{p:[0,hy,0]});
    R.add('head',G_.sph(hr*0.62,hr*0.55,hr*0.7),skin,{p:[0,hy-hr*0.38,hr*0.12]}); /* jaw */
    for(const sd of [1,-1]) R.add('head',G_.sph(hr*0.14,hr*0.22,hr*0.12),skin,{p:[sd*hr*0.97,hy-hr*0.05,0]}); /* ears */
    face(hr*0.9,hy-hr*0.08,hr*0.36,hr*(sp.build==='chibi'?0.2:0.15),hr*(sp.build==='chibi'?0.25:0.18));
    R.add('head',G_.sph(hr*0.07,hr*0.05,hr*0.05),shade(skin,0.88),{p:[0,hy-hr*0.32,hr*0.98],ol:false});
    if(hd==='oni'){ R.add('head',G_.sph(hr*0.18,hr*0.12,hr*0.12),shade(skin,0.85),{p:[0,hy-hr*0.2,hr*0.98]});
      for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.09,hr*0.32,6),0xFFF4E0,{p:[sd*hr*0.32,hy-hr*0.62,hr*0.82],r:[0.15,0,0]}); }
    if(hd==='old'||sp.wrinkles) for(let i=0;i<2;i++) R.add('head',G_.box(hr*0.6,0.012,0.01),shade(skin,0.75),{p:[0,hy+hr*(0.42+i*0.12),hr*0.92],ol:false}); }
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
  const H=sp.hair; if(!H||H.style==='bald') return; const c=H.col||0x2A2433, c2=H.col2||shade(c,0.8);
  const cap=()=>{ R.add('head',G_.part(hr*1.07,hr*1.1,hr*1.07,0,TAU,0,Math.PI*0.42),c,{p:[0,hy+hr*0.06,-hr*0.03]});
    R.add('head',G_.part(hr*1.08,hr*1.1,hr*1.08,Math.PI*0.92,Math.PI*1.16,0,Math.PI*0.82),c,{p:[0,hy+hr*0.04,-hr*0.04]}); };
  const bangs=(n,len)=>{ for(let i=0;i<n;i++){ const a=(i/(n-1)-0.5)*1.8; R.add('head',G_.cone(hr*0.26,hr*len*1.15,5),i%2?c:c2,{p:[Math.sin(a)*hr*0.7,hy+hr*0.58,Math.cos(a)*hr*0.76],r:[2.4,0,-a*0.4]}); } };
  switch(H.style){
    case 'spiky': cap();
      for(let i=0;i<7;i++){ const a=(i/6-0.5)*1.9; R.add('head',G_.cone(hr*0.27,hr*(0.75+(i%2)*0.2),5),i%2?c:c2,{p:[Math.sin(a)*hr*0.72,hy+hr*0.58,Math.cos(a)*hr*0.74],r:[2.35,0,-a*0.45]}); }   /* bangs */
      for(let i=0;i<14;i++){ const a=(i/13-0.5)*Math.PI*1.8, tier=i%2, len=hr*(1.0+tier*0.35+((i*7)%3)*0.12);   /* crown spikes sweeping up and back */
        R.add('head',G_.cone(hr*0.32,len,5),tier?c:c2,{p:[Math.sin(a)*hr*0.82,hy+hr*(0.72+0.2*Math.cos(a)),-hr*0.15-Math.abs(Math.sin(a))*hr*0.1],r:[-0.75-tier*0.45,0,-a*0.75]}); }
      for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.22,hr*0.9,5),c2,{p:[sd*hr*0.9,hy+hr*0.05,hr*0.25],r:[Math.PI-0.15,0,sd*-0.2]}); break;
    case 'wild': cap(); bangs(5,0.55);
      for(let i=0;i<26;i++){ const a=(i/25-0.5)*Math.PI*1.85, ring=i%3, len=hr*(1.35+ring*0.45+(i%2)*0.25);   /* a big mane fanning out from the crown and sides */
        R.add('head',G_.cone(hr*(0.42-ring*0.05),len,6),i%2?c:c2,{p:[Math.sin(a)*hr*0.9,hy+hr*(0.5+0.35*Math.cos(a))-ring*hr*0.12,-hr*(0.15+ring*0.15)],r:[-0.45-ring*0.4,0,-a*0.9]}); }
      for(const sd of [1,-1]) for(let i=0;i<3;i++) R.add('head',G_.cone(hr*0.3,hr*(1.1+i*0.2),6),i%2?c:c2,{p:[sd*hr*1.0,hy-hr*(0.1+i*0.25),-hr*0.1],r:[0,0,sd*(1.9+i*0.25)]});
      for(let i=0;i<4;i++) R.add('head',G_.cone(hr*0.3,hr*1.2,5),c,{p:[(i-1.5)*hr*0.4,hy+hr*0.6,-hr*0.7],r:[-1.7,0,(i-1.5)*0.3]}); break;
    case 'flame': cap(); for(let i=0;i<12;i++){ const a=(i/11-0.5)*2.6; R.add('hair',G_.cone(hr*0.3,hr*(1.0+(i%3)*0.35),5),i%3?c:c2,{p:[Math.sin(a)*hr*0.6,hr*0.1,-hr*0.1-Math.cos(a)*0.05],r:[-0.4,0,-a*0.45]}); }
      for(let i=0;i<5;i++){ const a=(i/4-0.5)*2; R.add('hair',G_.cone(hr*0.12,hr*0.5,5),0xFFE27A,{p:[Math.sin(a)*hr*0.6,hr*1.0,-hr*0.2],r:[-0.4,0,-a*0.45],glow:true}); } break;
    case 'long': case 'longflow': cap(); bangs(H.bangs||6,0.55);
      R.add('hair',G_.lathe([[hr*0.85,0],[hr*1.0,-hr*0.6],[hr*0.95,-hr*(H.len||3.2)*0.6],[hr*0.7,-hr*(H.len||3.2)]],12),c,{p:[0,0,-hr*0.05],s:[1,1,0.55]});
      for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.1,-hr*0.6,hr*0.1],[sd*hr*0.15,-hr*1.4,hr*0.05]],hr*0.16,hr*0.06,6,10),c2,{p:[sd*hr*0.86,hy,hr*0.3]});
      if(H.ornament) for(const sd of [1,-1]) R.add('head',G_.star(hr*0.22,hr*0.09,5,0.02),H.ornament,{p:[sd*hr*0.7,hy+hr*0.55,hr*0.3],r:[0,sd*0.6,0]}); break;
    case 'bun': cap(); bangs(5,0.45); R.add('head',G_.sph(hr*0.42),c,{p:[0,hy+hr*1.0,-hr*0.35]}); R.add('head',G_.cyl(0.015,0.015,hr*1.4,5),H.pin||0xF5C542,{p:[0,hy+hr*1.05,-hr*0.35],r:[0,0,Math.PI/2]}); break;
    case 'pony': cap(); bangs(5,0.5); R.add('hair',G_.tube([[0,0,0],[0,-hr*0.4,-hr*0.5],[0,-hr*1.4,-hr*0.6]],hr*0.3,hr*0.08,7,10),c,{p:[0,0,0]}); break;
    case 'short': cap(); bangs(7,0.5); for(let i=0;i<7;i++){ const a=(i/6-0.5)*2.4; R.add('head',G_.cone(hr*0.28,hr*0.6,5),i%2?c:c2,{p:[Math.sin(a)*hr*0.85,hy+hr*0.45,-Math.cos(a)*hr*0.55],r:[-1.3,0,-a*0.6]}); } break;
    case 'topknot': R.add('head',G_.part(hr*1.06,hr*1.0,hr*1.06,0,TAU,0,Math.PI*0.42),c,{p:[0,hy+hr*0.04,-hr*0.04]}); R.add('head',G_.cyl(hr*0.14,hr*0.18,hr*0.5,8),c,{p:[0,hy+hr*1.05,-hr*0.25],r:[-0.6,0,0]}); break;
    case 'hood': R.add('head',G_.part(hr*1.2,hr*1.22,hr*1.18,Math.PI*0.78,Math.PI*1.44,0,Math.PI),c,{p:[0,hy+hr*0.06,-hr*0.05]}); R.add('head',G_.tor(hr*0.86,hr*0.16,6,18),c2,{p:[0,hy,hr*0.62],s:[1,1.12,1]});
      if(H.mask) R.add('head',G_.sph(hr*0.82,hr*0.42,hr*0.5),H.mask,{p:[0,hy-hr*0.45,hr*0.55]}); break;
  }
}

function buildHat(R,sp,B,hr,hy){
  const H=sp.hat; if(!H) return; const c=H.col||0x24324A, c2=H.col2||0xF5C542;
  switch(H.kind){
    case 'kabuto':
      R.add('head',G_.hemi(hr*1.12,hr*1.0,hr*1.12,18),c,{p:[0,hy+hr*0.18,-hr*0.02]});
      R.add('head',G_.lathe([[hr*1.05,0],[hr*1.25,-hr*0.25],[hr*1.42,-hr*0.55]],16),c,{p:[0,hy+hr*0.2,-hr*0.05],s:[1,1,0.95]});
      R.add('head',G_.tor(hr*1.1,hr*0.05,5,20),c2,{p:[0,hy+hr*0.2,0],r:[Math.PI/2,0,0]});
      for(const sd of [1,-1]) R.add('head',G_.box(hr*0.4,hr*0.32,0.04),c,{p:[sd*hr*1.1,hy+hr*0.05,hr*0.35],r:[0,sd*0.8,sd*0.2]});
      if(H.crest==='crescent') R.add('head',G_.crescent(hr*1.1,hr*0.28,0.05),c2,{p:[0,hy+hr*0.95,hr*0.72],s:[1,1,1]});
      else if(H.crest==='horns') for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.4,hr*0.3,hr*0.1],[sd*hr*0.8,hr*0.9,0],[sd*hr*0.7,hr*1.4,-hr*0.2]],hr*0.12,hr*0.03,6,10),c2,{p:[sd*hr*0.4,hy+hr*0.9,hr*0.4]});
      else if(H.crest==='sun'){ R.add('head',G_.sph(hr*0.28,hr*0.28,hr*0.07),c2,{p:[0,hy+hr*1.0,hr*0.75],glow:!!H.glow}); for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('head',G_.cone(hr*0.07,hr*0.35,4),c2,{p:[Math.sin(a)*hr*0.42,hy+hr*1.0+Math.cos(a)*hr*0.42,hr*0.74],r:[0,0,-a]}); } }
      else if(H.crest==='snow') R.add('head',G_.star(hr*0.45,hr*0.18,6,0.04),c2,{p:[0,hy+hr*1.0,hr*0.72],glow:true});
      else if(H.crest==='flame') for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.6; R.add('head',G_.cone(hr*0.16,hr*(0.8+(i%2)*0.4),5),i%2?0xFFB04A:0xFF5A1F,{p:[Math.sin(a)*hr*0.5,hy+hr*1.15,hr*0.3],r:[-0.2,0,-a*0.5],glow:true}); }
      break;
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

function buildWeapon(R,sp,B){
  const W=sp.weapon; if(!W||W.kind==='none') return; const hand=W.hand==='L'?'handL':'handR', c=W.col||0xE6ECF2, c2=W.col2||0x3A2418, s=W.s||1, gl=!!W.glow;
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
  if(W.off){ const o=Object.assign({},sp,{weapon:Object.assign({},W.off,{hand:'L'})}); buildWeapon(R,o,B); }
}

function buildBack(R,sp,B){
  const K=sp.back; if(!K) return; const c=K.col||0x2A2433, c2=K.col2||shade(c,1.25);
  switch(K.kind){
    case 'wings': for(const sd of [1,-1]){ const w=R.bone('wing'+(sd>0?'L':'R'),'back',[sd*0.12,0.05,0]);
      const n=K.n||7, span=(K.span||1.3);
      for(let i=0;i<n;i++){ const t=i/(n-1), len=span*(0.55+0.45*Math.sin(t*Math.PI*0.9)), a=lerp(0.25,1.35,t);
        R.add(w,G_.leaf(0.12+0.05*(1-t),len,0.02),i%2?c:c2,{p:[sd*0.15*t,0.1*t,-0.05],r:[0,sd*0.25,sd*-a]}); }
      R.add(w,G_.cap(0.06,span*0.6),c,{p:[sd*span*0.28,span*0.12,-0.02],r:[0,0,sd*-1.2]}); } break;
    case 'tails': { const t=R.byName.tail, n=K.n||9;
      for(let i=0;i<n;i++){ const a=n>1?(i/(n-1)-0.5)*2.6:0, L=K.len||1.1;
        const crv=new T.CatmullRomCurve3([[0,0,0],[Math.sin(a)*L*0.25,0.15,-L*0.3],[Math.sin(a)*L*0.6,0.45+Math.cos(a)*0.2,-L*0.6],[Math.sin(a)*L*0.8,0.85+Math.cos(a)*0.3,-L*0.55]].map(p=>new T.Vector3(...p)));
        for(let k=0;k<11;k++){ const u=k/10, P=crv.getPointAt(u), rr=(0.08+0.15*Math.sin(Math.PI*Math.min(1,u*0.85+0.1)))*(K.fat||1);
          R.add(t,G_.sph(rr,rr,rr*1.2,12,8),k>=8?(K.tip||0xFFFFFF):(i%2?c:c2),{p:[P.x,P.y,P.z]}); } } break; }
    case 'drums': R.add('back',G_.tor(0.75,0.04,6,32),c,{p:[0,0.25,-0.15]});
      for(let i=0;i<8;i++){ const a=i/8*TAU; R.add('back',G_.cyl(0.13,0.13,0.12,12),c2,{p:[Math.sin(a)*0.75,0.25+Math.cos(a)*0.75,-0.15],r:[Math.PI/2,0,0]}); R.add('back',G_.cyl(0.1,0.1,0.13,12),0xF5C542,{p:[Math.sin(a)*0.75,0.25+Math.cos(a)*0.75,-0.13],r:[Math.PI/2,0,0],ol:false}); } break;
    case 'shell': R.add('back',G_.sph(B.w*1.1,B.torso*0.6,B.w*0.6),c,{p:[0,-0.05,-0.05]}); for(let i=0;i<5;i++) R.add('back',G_.sph(0.08,0.08,0.03),c2,{p:[(i-2)*0.12,-0.05+(i%2)*0.1,B.w*0.15],ol:false}); break;
    case 'spiderlegs': for(let i=0;i<6;i++){ const sd=i%2?-1:1, k=Math.floor(i/2), up=0.5-k*0.25;
      R.add('back',G_.tube([[0,0,0],[sd*0.45,up+0.35,-0.25],[sd*0.95,up+0.25,-0.35],[sd*1.15,up-0.55,-0.25]],0.045,0.015,6,12),c,{p:[sd*0.08,0.0-k*0.08,0]}); } break;
    case 'quiver': R.add('back',G_.cyl(0.08,0.07,0.55,10),c,{p:[0.12,-0.05,-0.02],r:[0,0,-0.4]}); for(let i=0;i<4;i++) R.add('back',G_.cyl(0.008,0.008,0.25,3),0xF4F1EA,{p:[0.22+i*0.02,0.25,-0.02],r:[0,0,-0.4],ol:false}); break;
    case 'cape': R.add('back',G_.lathe([[0.25,0.1],[0.35,-0.3],[0.45,-1.0],[0.5,-1.35]],10).rotateY(0),c,{p:[0,0,-0.05],s:[1,1,0.35]}); break;
    case 'flames': for(let i=0;i<9;i++){ const a=(i/8-0.5)*2.4; R.add('back',G_.cone(0.15,0.7+(i%3)*0.25,5),i%2?0xFF7A2A:0xFFC14A,{p:[Math.sin(a)*0.6,0.1+Math.cos(a)*0.5,-0.1],r:[0,0,-a],glow:true}); } break;
    case 'halo': R.add('back',G_.tor(0.75,0.035,6,40),c2,{p:[0,0.55,-0.08],glow:true}); for(let i=0;i<16;i++){ const a=i/16*TAU; R.add('back',G_.cone(0.04,0.22,4),c2,{p:[Math.sin(a)*0.92,0.55+Math.cos(a)*0.92,-0.08],r:[0,0,-a],glow:true}); } break;
    case 'planets': { const o=R.bone('orbit','chest',[0,0.4,0]); for(let i=0;i<5;i++){ const a=i/5*TAU; R.add(o,G_.sph(0.08+0.03*(i%3)),[0xF5C542,0x9FE6FF,0xFF8A4A,0xC58CFF,0xFFFFFF][i],{p:[Math.sin(a)*0.9,Math.cos(a*2)*0.15,Math.cos(a)*0.9],glow:true}); } R.add(o,G_.tor(0.9,0.008,3,48),0xFFFFFF,{r:[Math.PI/2,0,0],glow:true}); break; }
    case 'trees': for(let i=0;i<5;i++){ const a=(i/4-0.5)*1.6; R.add('back',G_.cyl(0.02,0.03,0.4,5),0x6B4A2A,{p:[Math.sin(a)*0.35,0.2,-0.1]}); R.add('back',G_.cone(0.16,0.45,6),0x3F7A3A,{p:[Math.sin(a)*0.35,0.55,-0.1]}); } break;
    case 'clouds': for(let i=0;i<6;i++){ const a=(i/5-0.5)*2.6; R.add('back',G_.sph(0.25,0.2,0.15),c,{p:[Math.sin(a)*0.75,0.2+Math.cos(a)*0.4,-0.15]}); } break;
    case 'bag': R.add('back',G_.sph(0.45,0.35,0.3),c,{p:[0,0.35,-0.1]}); R.add('back',G_.tor(0.4,0.06,6,20),c2,{p:[0,0.35,-0.1],r:[0,0,Math.PI/2]}); break;
    case 'mirror': R.add('back',G_.cyl(0.6,0.6,0.05,32),0xC8D8E6,{p:[0,0.45,-0.12],r:[Math.PI/2,0,0],glow:true}); R.add('back',G_.tor(0.62,0.05,6,32),0xF5C542,{p:[0,0.45,-0.12]}); break;
    case 'serpents': for(let i=0;i<6;i++){ const a=(i/5-0.5)*2.4; R.add('back',G_.tube([[0,0,0],[Math.sin(a)*0.25,0.35,-0.1],[Math.sin(a)*0.45,0.7,0.05]],0.06,0.04,6,8),c,{p:[0,0.1,-0.05]}); R.add('back',G_.sph(0.09,0.07,0.12),c,{p:[Math.sin(a)*0.45,0.82,0.1]}); R.add('back',G_.sph(0.02),0xF5C542,{p:[Math.sin(a)*0.45+0.03,0.85,0.2],glow:true}); } break;
  }
}

/* ================================================================ QUADRUPED (nue, kirin, raiju, baku, shachi) */
function buildQuad(sp){
  const R=new Rig(), L=sp.len||1.6, H=sp.height||0.85, W=sp.w||0.45, c=sp.col||0x8C6A3A, c2=sp.col2||shade(c,0.7), leg=sp.leg||0.11;
  R.bone('body','root',[0,H,0]); R.bone('front','body',[0,0.02,L*0.32]); R.bone('neck','front',[0,0.1,L*0.18]); R.bone('head','neck',[0,0.22,0.14]);
  R.bone('rear','body',[0,0,-L*0.3]);
  for(const [nm,par,z] of [['FL','front',0],['FR','front',0],['BL','rear',0],['BR','rear',0]]){ const sd=nm[1]==='L'?1:-1;
    R.bone('t'+nm,par,[sd*W*0.75,-0.05,z]); R.bone('k'+nm,'t'+nm,[0,-H*0.5,0]); R.bone('f'+nm,'k'+nm,[0,-H*0.45,0]); }
  R.bone('tail0','rear',[0,0.1,-L*0.2]); for(let i=1;i<5;i++) R.bone('tail'+i,'tail'+(i-1),[0,0.02,-0.22*(sp.tailLen||1)]);
  R.add('body',G_.sph(W,W*0.85,L*0.42,18,12),c,{p:[0,0,0]});
  R.add('front',G_.sph(W*1.02,W*0.95,L*0.22),c,{p:[0,0.02,0]}); R.add('rear',G_.sph(W*0.98,W*0.9,L*0.22),c,{p:[0,0.02,0]});
  R.add('neck',G_.cap(W*0.45,0.25),c,{p:[0,0.08,0.02],r:[0.6,0,0]});
  if(sp.stripes) for(let i=0;i<7;i++) R.add('body',G_.tor(W*0.93,0.03,5,18,Math.PI),c2,{p:[0,0,(i-3)*L*0.11],r:[0,Math.PI/2,Math.PI/2],ol:false});
  if(sp.belly) R.add('body',G_.sph(W*0.75,W*0.5,L*0.36),sp.belly,{p:[0,-W*0.4,0]});
  if(sp.scales) for(let i=0;i<10;i++) R.add('body',G_.cone(0.06,0.18,4),sp.scales,{p:[0,W*0.85,(i-4.5)*L*0.08],r:[-0.4,0,0]});
  if(sp.mane){ for(let i=0;i<12;i++){ const a=(i/11-0.5)*2.6; R.add('neck',G_.cone(W*0.2,W*(0.7+(i%3)*0.2),5),i%2?sp.mane:shade(sp.mane,0.85),{p:[Math.sin(a)*W*0.4,0.2,-0.05],r:[-0.9,0,-a*0.5]}); } }
  for(const nm of ['FL','FR','BL','BR']){ R.add('t'+nm,G_.cap(leg*1.3,H*0.42),c,{p:[0,-H*0.25,0]}); R.add('k'+nm,G_.cap(leg,H*0.4),c,{p:[0,-H*0.22,0]}); R.add('f'+nm,G_.sph(leg*1.25,leg*0.8,leg*1.6),sp.hoof||c2,{p:[0,0.02,0.05]});
    if(sp.legFire) R.add('k'+nm,G_.cone(leg*1.4,0.3,5),sp.legFire,{p:[0,-H*0.3,-0.05],r:[0.6,0,0],glow:true}); }
  /* head by kind */
  const hc=sp.headCol||c, hk=sp.headKind||'beast', hr=sp.headR||W*0.62;
  R.add('head',G_.sph(hr,hr*0.95,hr*1.05,16,12),hc,{p:[0,0,0]});
  const snoutLen=hk==='elephant'?0:hk==='monkey'?0.3:hk==='deer'?1.2:hk==='tiger'?0.65:1.0;
  if(snoutLen) R.add('head',G_.sph(hr*0.55,hr*0.48,hr*0.6*snoutLen),sp.muzzle||shade(hc,hk==='monkey'?1.3:0.95),{p:[0,-hr*0.25,hr*0.75]});
  R.add('head',G_.sph(hr*0.14,hr*0.1,hr*0.08),INK,{p:[0,-hr*0.12,hr*(0.75+0.55*snoutLen)],ol:false});
  for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.16,hr*0.16,hr*0.09),sp.eyeCol||0xF5C542,{p:[sd*hr*0.45,hr*0.2,hr*0.8],glow:!!sp.eyeGlow,ol:false});
    if(!sp.eyeGlow) R.add('head',G_.sph(hr*0.07,hr*0.11,hr*0.05),INK,{p:[sd*hr*0.45,hr*0.2,hr*0.88],ol:false});
    R.add('head',G_.box(hr*0.45,0.03,0.02),INK,{p:[sd*hr*0.42,hr*0.42,hr*0.82],r:[0,0,sd*0.35],ol:false});
    if(hk!=='elephant') R.add('head',G_.cone(hr*0.28,hr*0.7,5),hc,{p:[sd*hr*0.55,hr*0.85,-hr*0.1],r:[0,0,sd*-0.35]}); }
  if(hk==='elephant'){ R.add('head',G_.tube([[0,0,0],[0,-hr*0.6,hr*0.4],[0,-hr*1.3,hr*0.5],[0,-hr*1.6,hr*0.9]],hr*0.32,hr*0.16,8,14),hc,{p:[0,-hr*0.1,hr*0.8]});
    for(const sd of [1,-1]){ R.add('head',G_.sph(hr*0.7,hr*0.8,hr*0.12),shade(hc,0.9),{p:[sd*hr*0.95,0,-hr*0.1],r:[0,sd*0.4,0]}); R.add('head',G_.cone(hr*0.1,hr*0.6,6),0xFFF4E0,{p:[sd*hr*0.35,-hr*0.6,hr*0.9],r:[2.4,0,sd*0.2]}); } }
  if(hk==='monkey'){ R.add('head',G_.sph(hr*0.7,hr*0.6,hr*0.3),sp.muzzle||0xD98A6A,{p:[0,-hr*0.05,hr*0.8]}); for(let i=0;i<10;i++){ const a=i/10*TAU; R.add('head',G_.cone(hr*0.25,hr*0.7,5),sp.mane||c,{p:[Math.sin(a)*hr*0.95,Math.cos(a)*hr*0.9,-hr*0.2],r:[-0.4,0,-a]}); } }
  if(sp.antlers) for(const sd of [1,-1]){ R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.6,-hr*0.2],[sd*hr*0.8,hr*1.2,-hr*0.5],[sd*hr*0.7,hr*1.8,-hr*0.8]],hr*0.1,hr*0.04,6,12),sp.antlers,{p:[sd*hr*0.3,hr*0.75,0],glow:!!sp.antlerGlow});
    R.add('head',G_.tube([[0,0,0],[sd*hr*0.3,hr*0.25,hr*0.15],[sd*hr*0.6,hr*0.4,hr*0.25]],hr*0.07,hr*0.03,5,8),sp.antlers,{p:[sd*hr*0.65,hr*1.45,-hr*0.35],glow:!!sp.antlerGlow}); }
  if(sp.whiskers) for(const sd of [1,-1]) R.add('head',G_.tube([[0,0,0],[sd*hr*0.6,-hr*0.1,hr*0.2],[sd*hr*1.3,-hr*0.5,hr*0.1],[sd*hr*1.7,-hr*0.3,-hr*0.3]],0.025,0.01,5,12),sp.whiskers,{p:[sd*hr*0.3,-hr*0.3,hr*1.3],glow:true});
  if(sp.fangs) for(const sd of [1,-1]) R.add('head',G_.cone(hr*0.07,hr*0.3,5),0xFFFFFF,{p:[sd*hr*0.18,-hr*0.55,hr*1.2],r:[Math.PI,0,0],ol:false});
  /* tail */
  const tk=sp.tail||'fluffy', tc=sp.tailCol||c;
  for(let i=0;i<5;i++){ const r=tk==='snake'?0.09*(1-i*0.12):tk==='fluffy'?0.12+0.03*i:tk==='fish'?0.12-0.015*i:0.07*(1-i*0.12);
    R.add('tail'+i,G_.sph(r,r,0.15*(sp.tailLen||1)),tc,{p:[0,0,-0.11*(sp.tailLen||1)]});
    if(tk==='lightning'&&i%2) R.add('tail'+i,G_.cone(0.05,0.25,4),0xFFF27A,{p:[0,0.12,-0.1],glow:true}); }
  if(tk==='snake'){ R.add('tail4',G_.sph(0.12,0.09,0.17),tc,{p:[0,0.02,-0.25]}); R.add('tail4',G_.sph(0.02),0xF5C542,{p:[0.05,0.06,-0.37],glow:true}); R.add('tail4',G_.sph(0.02),0xF5C542,{p:[-0.05,0.06,-0.37],glow:true}); }
  if(tk==='fish') R.add('tail4',G_.shape([[0,0],[0.35,0.3],[0.15,0],[0.35,-0.3]],0.03,0.005),sp.finCol||0xF5C542,{p:[0,0,-0.25],r:[0,Math.PI/2,0]});
  if(sp.extra) sp.extra(R,{L,H,W,hr},G_);
  return {rig:R,kind:'quad'};
}

/* ================================================================ SERPENT (orochi, kuzuryu, ryujin) — coiled body with N necks */
function buildSerpent(sp){
  const R=new Rig(), n=sp.heads||1, c=sp.col||0x3F7A3A, c2=sp.col2||shade(c,1.3), seg=sp.seg||6, r0=sp.r||0.2;
  R.bone('coil','root',[0,0.3,0]);
  R.add('coil',G_.tor(0.7,0.28,10,28),c,{p:[0,0,0],r:[Math.PI/2,0,0]}); R.add('coil',G_.tor(0.45,0.24,10,24),shade(c,0.92),{p:[0,0.32,0],r:[Math.PI/2,0,0.3]});
  R.add('coil',G_.sph(0.5,0.4,0.5),c,{p:[0,0.45,0]});
  for(let h=0;h<n;h++){ const a=n===1?0:(h/(n-1)-0.5)*Math.min(2.6,0.45*n), base='n'+h+'_';
    R.bone(base+0,'coil',[Math.sin(a)*0.35,0.6,Math.cos(a)*0.2]);
    for(let i=1;i<seg;i++){ const lift=0.28*(sp.neck||1); R.bone(base+i,base+(i-1),[Math.sin(a)*0.12*(i<3?1:0.3),lift,0.03+0.04*i]); }
    for(let i=0;i<seg;i++){ const r=r0*(1-i/seg*0.35); R.add(base+i,G_.sph(r,0.2,r*1.05,12,8),c,{p:[0,0.12,0]}); R.add(base+i,G_.sph(r*0.7,0.16,r*0.4),sp.belly||0xE8D8A8,{p:[0,0.12,r*0.7],ol:false});
      if(sp.spines) R.add(base+i,G_.cone(r*0.35,r*1.1,4),sp.spines,{p:[0,0.15,-r*0.85],r:[-0.6,0,0]}); }
    const hb=R.bone(base+'H',base+(seg-1),[0,0.24,0.05]), hr=r0*1.25;
    R.add(hb,G_.sph(hr,hr*0.75,hr*1.3,14,10),c,{p:[0,0,hr*0.3]}); R.add(hb,G_.sph(hr*0.75,hr*0.45,hr*1.1),c2,{p:[0,-hr*0.3,hr*0.75]});
    for(const sd of [1,-1]){ R.add(hb,G_.sph(hr*0.18,hr*0.14,hr*0.1),sp.eyeCol||0xFF3A2A,{p:[sd*hr*0.5,hr*0.25,hr*0.95],glow:true});
      if(sp.horns) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.3,hr*0.5,-hr*0.4],[sd*hr*0.4,hr*1.0,-hr*1.0]],hr*0.15,hr*0.04,6,10),sp.horns,{p:[sd*hr*0.4,hr*0.4,0]});
      if(sp.whiskers) R.add(hb,G_.tube([[0,0,0],[sd*hr*0.5,0,hr*0.4],[sd*hr*1.2,-hr*0.3,hr*0.2],[sd*hr*1.6,-hr*0.6,-hr*0.4]],0.03,0.01,5,10),sp.whiskers,{p:[sd*hr*0.3,-hr*0.2,hr*1.5],glow:true});
      R.add(hb,G_.cone(hr*0.08,hr*0.35,5),0xFFFFFF,{p:[sd*hr*0.35,-hr*0.5,hr*1.3],r:[Math.PI,0,0],ol:false}); }
    if(sp.mane) for(let i=0;i<6;i++) R.add(hb,G_.cone(hr*0.25,hr*(0.9+(i%2)*0.3),5),sp.mane,{p:[(i-2.5)*hr*0.25,hr*0.5,-hr*0.4],r:[-1.0,0,(i-2.5)*0.25]});
    if(sp.crown) R.add(hb,G_.cone(hr*0.3,hr*0.9,6),sp.crown,{p:[0,hr*0.8,0],r:[-0.3,0,0]}); }
  if(sp.orb) { R.bone('orbB','coil',[0,1.3,0.9]); R.add('orbB',G_.sph(0.28),sp.orb,{glow:true}); R.add('orbB',G_.tor(0.34,0.02,5,24),0xFFFFFF,{glow:true}); }
  if(sp.legs) for(const sd of [1,-1]) for(const z of [0.35,-0.35]){ R.add('coil',G_.cap(0.07,0.3),c,{p:[sd*0.75,0.1,z],r:[0,0,sd*0.8]}); for(let k=0;k<3;k++) R.add('coil',G_.cone(0.03,0.12,4),0xF5C542,{p:[sd*0.95,-0.05,z+(k-1)*0.06],r:[Math.PI,0,0]}); }
  return {rig:R,kind:'serpent',heads:n,seg};
}

/* ================================================================ SPIDER (tsuchigumo) */
function buildSpider(sp){
  const R=new Rig(), c=sp.col||0x3A2A55, c2=sp.col2||0x6A4E8C, H=0.85;
  R.bone('body','root',[0,H,0]); R.bone('abd','body',[0,0.15,-0.55]); R.bone('head','body',[0,0.05,0.55]);
  R.add('body',G_.sph(0.55,0.42,0.6,16,12),c,{}); R.add('abd',G_.sph(0.85,0.72,0.95,18,12),c,{p:[0,0.15,-0.35]});
  for(let i=0;i<5;i++) R.add('abd',G_.tor(0.35-i*0.05,0.02,4,20),c2,{p:[0,0.75,-0.35-i*0.1],r:[Math.PI/2+0.3,0,0],ol:false});
  R.add('head',G_.sph(0.42,0.36,0.42),c,{p:[0,0.05,0.15]});
  for(let i=0;i<8;i++){ const row=Math.floor(i/4), col=i%4; R.add('head',G_.sph(0.07),sp.eyeCol||0xFF2A2A,{p:[(col-1.5)*0.15,0.18+row*0.13-((col===0||col===3)?0.05:0),0.5],glow:true}); }
  for(const sd of [1,-1]) R.add('head',G_.cone(0.06,0.3,5),0xEDE6D6,{p:[sd*0.12,-0.22,0.5],r:[Math.PI-0.3,0,0]});
  for(let i=0;i<8;i++){ const sd=i%2?-1:1, k=Math.floor(i/2), z=0.35-k*0.25, nm='L'+i;
    R.bone(nm+'a','body',[sd*0.45,0.05,z]); R.bone(nm+'b',nm+'a',[sd*0.6,0.45,0]); R.bone(nm+'c',nm+'b',[sd*0.45,-0.25,0]);
    R.add(nm+'a',G_.tube([[0,0,0],[sd*0.6,0.45,0]],0.075,0.06,6,4),c,{}); R.add(nm+'b',G_.tube([[0,0,0],[sd*0.45,-0.25,0]],0.06,0.05,6,4),c,{});
    R.add(nm+'c',G_.tube([[0,0,0],[sd*0.2,-0.6,0],[sd*0.25,-1.0,0]],0.05,0.015,6,8),c2,{}); }
  return {rig:R,kind:'spider'};
}

/* ================================================================ BLOB (umibozu) — a towering dark sea spectre */
function buildBlob(sp){
  const R=new Rig(), c=sp.col||0x1A2A4A;
  R.bone('b0','root',[0,0.4,0]); R.bone('b1','b0',[0,0.55,0]); R.bone('b2','b1',[0,0.5,0]); R.bone('b3','b2',[0,0.45,0]);
  R.add('b0',G_.sph(0.95,0.5,0.95,18,10),c,{}); R.add('b1',G_.sph(0.78,0.55,0.75,18,10),c,{}); R.add('b2',G_.sph(0.62,0.5,0.6,18,10),c,{}); R.add('b3',G_.sph(0.55,0.55,0.52,18,12),c,{});
  for(const sd of [1,-1]){ R.add('b3',G_.sph(0.16,0.2,0.08),0xEAF6FF,{p:[sd*0.2,0.05,0.48],glow:true}); R.add('b3',G_.sph(0.08,0.1,0.06),0x9FE6FF,{p:[sd*0.2,0.05,0.53],glow:true}); }
  for(let i=0;i<12;i++){ const a=i/12*TAU; R.add('b1',G_.sph(0.06,0.14,0.06),0x4E8CC8,{p:[Math.sin(a)*0.78,-0.1-(i%3)*0.12,Math.cos(a)*0.75],glow:true}); }
  for(const sd of [1,-1]){ R.bone('arm'+(sd>0?'L':'R'),'b1',[sd*0.7,0.2,0]); R.add('arm'+(sd>0?'L':'R'),G_.tube([[0,0,0],[sd*0.3,-0.3,0.2],[sd*0.45,-0.8,0.3]],0.2,0.1,8,10),c,{}); }
  return {rig:R,kind:'blob'};
}

/* ================================================================ FISH (namazu) — giant catfish */
function buildFish(sp){
  const R=new Rig(), c=sp.col||0x3E4A5A, c2=sp.col2||0xD8C8A8;
  R.bone('f0','root',[0,0.75,0.4]); R.bone('f1','f0',[0,0,-0.6]); R.bone('f2','f1',[0,0,-0.55]); R.bone('f3','f2',[0,0,-0.5]);
  R.add('f0',G_.sph(0.8,0.62,0.75,18,12),c,{p:[0,0,0.1]}); R.add('f0',G_.sph(0.7,0.35,0.6),c2,{p:[0,-0.35,0.2],ol:false});
  R.add('f0',G_.box(1.0,0.07,0.1),0x2A1E1E,{p:[0,-0.1,0.82],ol:false}); R.add('f0',G_.box(0.9,0.05,0.04),0xC86A6A,{p:[0,-0.15,0.8],ol:false});
  for(const sd of [1,-1]){ R.add('f0',G_.sph(0.12,0.12,0.08),0xF5C542,{p:[sd*0.45,0.25,0.68],glow:true}); R.add('f0',G_.sph(0.05,0.08,0.04),INK,{p:[sd*0.45,0.25,0.74],ol:false});
    R.add('f0',G_.tube([[0,0,0],[sd*0.35,-0.05,0.2],[sd*0.7,-0.3,0.15],[sd*0.95,-0.5,-0.1]],0.05,0.015,6,14),0xEDE6D6,{p:[sd*0.45,-0.05,0.8]});
    R.add('f1',G_.shape([[0,0],[0.5,-0.25],[0.25,0.05]],0.03,0.005),c,{p:[sd*0.65,-0.2,0.1],r:[0,sd*0.3,sd*-0.4]}); }
  R.add('f1',G_.sph(0.7,0.55,0.55),c,{}); R.add('f2',G_.sph(0.55,0.45,0.5),c,{}); R.add('f3',G_.sph(0.38,0.32,0.4),c,{});
  R.add('f3',G_.shape([[0,0],[0.5,0.45],[0.25,0],[0.5,-0.4]],0.04,0.006),c,{p:[0,0,-0.35],r:[0,Math.PI/2,0]});
  if(sp.moss){ for(let i=0;i<8;i++){ const a=i/8*TAU; R.add('f0',G_.sph(0.2,0.08,0.2),sp.moss,{p:[Math.sin(a)*0.35,0.58,Math.cos(a)*0.3-0.05]}); }
    R.add('f1',G_.box(0.3,0.5,0.1),0x8E8A84,{p:[0,0.65,0],r:[0,0,0.1]}); R.add('f1',G_.box(0.12,0.2,0.02),0x5A5650,{p:[0,0.68,0.06],ol:false}); }
  return {rig:R,kind:'fish'};
}

/* ================================================================ character registry */
const DEFS={};
const def=(k,s)=>{ DEFS[k]=s; };
/* compact design list for all 70 heroes and bosses, drawn from their painted portraits */
const HORN=0xF2DEA0, BLK=0x1C1C22, WHT=0xF4F1EA, GLD=0xF5C542, RED=0xC8342C;
def('hero',    {type:'human',build:'chibi',skin:0xF6D2B0,hair:{style:'spiky',col:0x22305E,col2:0x2E4280},hat:{kind:'none'},extra:(R,B)=>{ R.add('head',G_.tor(B.head*1.02,B.head*0.09,6,24),0xD8342C,{p:[0,B.head*1.25,0],r:[Math.PI/2+0.15,0,0]}); for(const sd of [1,-1]) R.add('head',G_.box(0.06,0.42,0.02),0xD8342C,{p:[sd*0.08,B.head*0.85,-B.head*1.05],r:[0.5,0,sd*0.45]}); },
  outfit:{kind:'hakama',col:WHT,top:WHT,col2:0x22305E,trim:0x22305E,belt:0xD8342C},weapon:{kind:'bow',col2:0x3A2418},back:{kind:'quiver',col:0x6B3A1E},eyes:{col:0x8A5A1A}});
def('samurai', {type:'human',build:'chibi',skin:0xF6D2B0,hair:{style:'short',col:0x1C1C22},hat:{kind:'kabuto',col:0x22305E,col2:GLD,crest:'crescent'},outfit:{kind:'armor',col:0x22305E,col2:0x2D4A7A,trim:GLD,plate:0x1E2C50,legs:0x1E2C50},weapon:{kind:'katana'},eyes:{col:0x6B3A1E}});
def('onmyoji', {type:'human',build:'chibi',hair:{style:'long',col:0x1C1C22,len:1.6},hat:{kind:'eboshi',col:0x1E1E24},outfit:{kind:'robe',col:WHT,col2:0xE6E0F0,trim:0x8E4FD6},weapon:{kind:'talisman'},eyes:{col:0x3A2A55}});
def('ninja',   {type:'human',build:'chibi',hair:{style:'hood',col:0x2A2433,col2:0x3A3248,mask:0x2A2433},outfit:{kind:'ninja',col:0x2A2433,col2:0x1E1A26,belt:0x6E4FA0,glove:0x2A2433,shoe:0x1E1A26},scarf:0x8E4FD6,weapon:{kind:'dagger',off:{kind:'dagger'}},eyes:{col:0x3A2A1E}});
def('tengu',   {type:'human',build:'normal',head:'bird',skin:0x1E1E2A,beakCol:0xF09A2A,crestCol:0x2A2A3A,eyes:{col:0xD8342C,glow:true},hat:{kind:'tokin',col:BLK},outfit:{kind:'robe',col:0x4E3A8C,col2:0x3A2A6E,trim:GLD},beads:GLD,weapon:{kind:'fan',col:0x2A2A3A},back:{kind:'wings',col:0x1E1E2A,col2:0x2A2A3A,span:1.4}});
def('kitsune', {type:'human',build:'slim',skin:0xFBE6D6,hair:{style:'long',col:0xF4F4F8,col2:0xE0E0EA,len:3.4},ears:'fox',earCol:0xF4F4F8,outfit:{kind:'kimono',col:0xF3D9C4,col2:0xE8E0D8,trim:0xD8342C,belt:0xD8342C},back:{kind:'tails',col:0xF4F4F8,col2:0xE8EEF6,tip:0x9FE6FF,n:9},weapon:{kind:'orb',col:0x6FE3FF,hand:'L'},eyes:{col:0xC8A040}});
def('yuki',    {type:'human',build:'hero',hair:{style:'short',col:0xC8D8E6},hat:{kind:'kabuto',col:0xCFE6F5,col2:0x9FE6FF,crest:'snow'},outfit:{kind:'armor',col:0xB8D4EA,col2:0x6FA8D8,trim:0x9FE6FF,plate:0xE6F2FA,legs:0x4E7AA8},weapon:{kind:'katana',col:0xBFF0FF,glow:true},eyes:{col:0x4E8CC8}});
def('shogun',  {type:'human',build:'broad',head:'oni',skin:0x6E4A8C,hat:{kind:'kabuto',col:0x1E1A22,col2:GLD,crest:'horns'},outfit:{kind:'armor',col:0x2A1E26,col2:0x8C2A2A,trim:GLD,plate:0x1E1A22,emblem:GLD},weapon:{kind:'greatsword',col:0xE0E6EC},eyes:{col:0xFF5A2A,glow:true,fierce:true},back:{kind:'flames'}});
def('kappa',   {type:'human',build:'normal',head:'duck',skin:0x5E9F46,eyes:{col:0xF5C542},hat:{kind:'leaves',col:0x3F7A3A,col2:0x6FB548},outfit:{kind:'bare',col2:0x3F7A3A},weapon:{kind:'trident',col:GLD,col2:0x6B4A2A},back:{kind:'shell',col:0x4E6E3A,col2:0x8CA05A},beads:GLD});
def('gasha',   {type:'human',build:'giant',prop:{head:0.34},head:'skull',eyes:{col:0xC58CFF},outfit:{kind:'robe',col:0x4E3A6E,col2:0x3A2A55,trim:GLD,pattern:GLD},skin:0xEDE6D6,extra:(R,B)=>{ for(let i=0;i<5;i++) R.add('chest',G_.tor(B.w*0.75-i*0.02,0.035,5,16,Math.PI),0xEDE6D6,{p:[0,B.torso*(0.15+i*0.07),0.1],r:[0,0,0]}); }});
def('raijin',  {type:'human',build:'broad',skin:0x3E6EC8,hair:{style:'wild',col:0xF2F2F2,col2:0xDDDDE6},horns:{style:'oni',col:GLD,len:0.6},outfit:{kind:'bare',col2:0xD9A441,stripes:true},eyes:{col:0xFFF27A,glow:true,fierce:true,grin:true},back:{kind:'drums',col:0x8C2A2A,col2:0x5A3A2A},weapon:{kind:'mallet',col:0xD9A441,col2:0x6B4A2A}});
def('nue',     {type:'quad',len:1.8,height:0.85,w:0.48,col:0xC88A3A,col2:0x2A1E14,stripes:true,headKind:'monkey',headCol:0x8C5A2A,muzzle:0xD98A6A,mane:0x6B4A2A,tail:'snake',tailCol:0x3F7A3A,tailLen:1.4,fangs:true,eyeCol:0xF5C542});
def('ryujin',  {type:'serpent',heads:1,seg:8,r:0.24,neck:1.1,col:0x2F8F78,col2:0x6FD8B8,belly:0xF5D68A,horns:GLD,whiskers:GLD,mane:0xF5C542,spines:GLD,eyeCol:0xFFE27A,orb:0x9FE6FF,legs:true});
def('tsuchi',  {type:'spider',col:0x3A2A55,col2:0x6A4E8C,eyeCol:0xFF2A2A});
def('nurari',  {type:'human',build:'slim',skin:0xE8D2B8,prop:{head:0.24},head:'old',hair:{style:'bald'},eyes:{col:0x3A2A1E},beard:{style:'mustache',col:0xBFB8A8},outfit:{kind:'robe',col:0x2A2A55,col2:0x1E1E3A,trim:0x8E8AB0},weapon:{kind:'pipe',col2:0x3A2418},
  extra:(R,B)=>{ R.add('head',G_.sph(B.head*0.75,B.head*1.4,B.head*0.8),0xE8D2B8,{p:[0,B.head*1.9,-B.head*0.25]}); for(let i=0;i<3;i++) R.add('back',G_.sph(0.12),0xB98CFF,{p:[(i-1)*0.5,0.6+(i%2)*0.2,-0.2],glow:true}); }});
def('orochi',  {type:'serpent',heads:8,seg:6,r:0.17,neck:0.95,col:0x2F6A2A,col2:0x5AA048,belly:0xC8D88A,horns:GLD,eyeCol:0xFF3A2A,spines:0x1E3A1A});
def('namazu',  {type:'fish',col:0x3E4A5A,col2:0xD8C8A8,moss:0x5E7A3A});
def('mao',     {type:'human',build:'broad',head:'mask',mask:'hannya',maskCol:0x8C1E2A,skin:0x3A2A3A,horns:{style:'curved',col:0x1E1A22},hair:{style:'wild',col:0x1E1A22,col2:0x3A2A4A},outfit:{kind:'armor',col:0x1E1A26,col2:0x5A2A6E,trim:0xC58CFF,plate:0x2A1E30,emblem:0xC58CFF},weapon:{kind:'greatsword',col:0x6E4FA0,glow:true},back:{kind:'cape',col:0x2A1E30}});
def('akaoni',  {type:'human',build:'giant',head:'oni',skin:0xC8342C,hair:{style:'wild',col:0xF2F2F2,col2:0xDDD8D0},horns:{style:'oni',col:HORN,len:0.9,size:0.25},outfit:{kind:'bare',col2:0xD9A441,stripes:true},weapon:{kind:'club',col:0x3A3A42,s:1.3},eyes:{col:0xF5C542,fierce:true,grin:true}});
def('brute',   {type:'human',build:'giant',head:'oni',skin:0x3E6EC8,hair:{style:'wild',col:0x1E1E2A,col2:0x2A2A3A},horns:{style:'oni',col:HORN,len:0.7},outfit:{kind:'bare',col2:0xD9A441,stripes:true},weapon:{kind:'club',col:0x6B4A2A,s:1.15},eyes:{col:0xF5C542,fierce:true,grin:true}});
def('umibozu', {type:'blob',col:0x1A2A4A});
def('kamaitachi',{type:'human',build:'slim',head:'wolf',skin:0x8E8E96,muzzleCol:0xD8D8DE,eyes:{col:0xF5C542},outfit:{kind:'ninja',col:0x6E6E78,col2:0x4E4E58,belt:0x3F7A3A,glove:0x8E8E96},weapon:{kind:'sickle',col:0xE6ECF2,col2:0x3A2418,s:1.3},back:{kind:'tails',col:0x8E8E96,col2:0xA8A8B0,n:1,len:1.3,tip:0xD8D8DE}});
def('daidara', {type:'human',build:'giant',skin:0x6E6A5A,head:'stone',headCol:0x7A7462,hair:{style:'wild',col:0x3F6A2A,col2:0x5A8A3A},beard:{style:'long',col:0x4E7A3A},outfit:{kind:'bare',col2:0x5A5648},eyes:{col:0x9BF57E,glow:true},back:{kind:'trees'}});
def('hannya',  {type:'human',build:'slim',head:'mask',mask:'hannya',maskCol:0xF4EEE6,skin:0xF4E6DA,hair:{style:'long',col:0x14121A,len:3.6},outfit:{kind:'kimono',col:0x8C1E2A,col2:0x5A1218,trim:GLD,belt:GLD},back:{kind:'flames',col:0x6FB8FF},weapon:{kind:'fan',col:0xD8342C}});
def('mikaboshi',{type:'human',build:'hero',skin:0x2A3A6E,hair:{style:'longflow',col:0xE6ECF5,len:2.6},hat:{kind:'stars',col:0x2A2A55,col2:0xDCE6FF},outfit:{kind:'robe',col:0x1E2A55,col2:0x2A3A6E,trim:0xDCE6FF,pattern:0xDCE6FF},eyes:{col:0xDCE6FF,glow:true},back:{kind:'halo',col2:0xC8D8FF}});
def('ushioni', {type:'human',build:'giant',head:'bull',skin:0x2A2626,muzzleCol:0x3A3434,horns:{style:'bull',col:0xC8B89A},eyes:{col:0xFF5A2A,glow:true},outfit:{kind:'armor',col:0x3A3434,col2:0x2A2626,trim:0x8E8A84,plate:0x2A2626},weapon:{kind:'club',col:0x5A5650,s:1.2},
  extra:(R,B)=>{ for(let i=0;i<8;i++) R.add('chest',G_.tor(0.07,0.022,4,10),0x8E8A84,{p:[-0.3+i*0.085,0.3-i*0.06,B.w*0.85],r:[0,i%2?Math.PI/2:0,0]}); }});
def('shuten',  {type:'human',build:'giant',head:'oni',skin:0xC8342C,hair:{style:'wild',col:0xF2F2F2,col2:0xE6E0D8},horns:{style:'oni',col:GLD,len:1.0},outfit:{kind:'kimono',col:0x2A1E1E,col2:0x8C2A2A,trim:GLD,short:true},weapon:{kind:'club',col:0x3A3A42,s:1.3},eyes:{col:0xF5C542,fierce:true,grin:true},back:{kind:'flames'}});
def('kirin',   {type:'quad',len:1.8,height:1.0,w:0.4,col:0x2F8F8A,col2:0x1E6A66,headKind:'deer',headCol:0xF5C542,muzzle:0xFFE27A,mane:0x6FD8C8,scales:GLD,antlers:GLD,antlerGlow:true,tail:'fluffy',tailCol:0x6FD8C8,legFire:0xFFF27A,hoof:GLD,eyeCol:0xFFF27A,eyeGlow:true,whiskers:0xFFE27A});
def('enma',    {type:'human',build:'broad',skin:0xB3261E,beard:{style:'long',col:0x14121A},hat:{kind:'judge',col:0x1E1A22,col2:GLD},outfit:{kind:'robe',col:0x8C1E2A,col2:0x5A1218,trim:GLD},weapon:{kind:'staff',col:GLD,col2:0x2A1E1E,orb:0x6FE36F},eyes:{col:0xF5C542,fierce:true},back:{kind:'flames',col:0x6FE36F}});
def('susanoo', {type:'human',build:'hero',skin:0xE8D2B8,hair:{style:'wild',col:0x1E2A55,col2:0x2A3A6E},outfit:{kind:'armor',col:0x1E2A55,col2:0x2A3A6E,trim:0xDCE6FF,plate:0x162044,robe:0x1E2A55},weapon:{kind:'greatsword',col:0xDCE6FF,glow:true},eyes:{col:0x9FE6FF,fierce:true},back:{kind:'clouds',col:0x3A4A6E}});
def('jorogumo',{type:'human',build:'slim',skin:0xF4E6DA,hair:{style:'bun',col:0x14121A,pin:GLD},eyes:{col:0xD8342C,n:6,glow:true},outfit:{kind:'kimono',col:0x14121A,col2:0x2A1E1E,trim:0xD8342C,belt:0xD8342C},back:{kind:'spiderlegs',col:0x2A1E26},weapon:{kind:'fan',col:0xD8342C}});
def('karura',  {type:'human',build:'hero',head:'bird',skin:0xF06A1F,beakCol:0xF5C542,crestCol:0xFFB04A,eyes:{col:0xFFE27A,glow:true},outfit:{kind:'armor',col:0xD8541E,col2:0xF5A042,trim:GLD,plate:0xC8401A},back:{kind:'wings',col:0xF06A1F,col2:0xFFB04A,span:1.6},weapon:{kind:'spear',col:GLD,col2:0x8C2A2A}});
def('kuzuryu', {type:'serpent',heads:9,seg:6,r:0.15,neck:0.95,col:0x1E4A8C,col2:0x4E8CC8,belly:0xC8E0F5,horns:0xDCE6FF,eyeCol:0xFFF27A,whiskers:0x9FE6FF,mane:0xDCE6FF});
def('izanami', {type:'human',build:'slim',skin:0xE6E6EA,hair:{style:'long',col:0x14121A,len:3.8},eyes:{col:0xB98CFF,glow:true},hat:{kind:'veil',col:0x3A3A42},outfit:{kind:'kimono',col:0x8E8A96,col2:0x6E6A76,trim:0x3A3A42,belt:0x3A3A42},back:{kind:'halo',col2:0xB98CFF},
  extra:(R,B)=>{ R.add('head',G_.box(0.012,B.head*0.8,0.01),0x3A3A42,{p:[0.08,B.head*0.9,B.head*0.95],r:[0,0,0.3],ol:false}); }});
def('tsukuyomi',{type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6ECF5,col2:0xC8D4E6,len:2.6},hat:{kind:'moon',col:0xC8D4E6,col2:0xDCE6FF,glow:true},outfit:{kind:'robe',col:0xC9C2EC,col2:0xC8D4E6,trim:0x8E9AB8},weapon:{kind:'katana',col:0xDCE6FF,glow:true},eyes:{col:0x8E9AB8}});
def('raiju',   {type:'quad',len:1.6,height:0.85,w:0.38,col:0xF5D23A,col2:0x2A5AC8,stripes:true,headKind:'beast',headCol:0xF5D23A,muzzle:0xFFF4C8,mane:0x3E6EC8,tail:'lightning',tailCol:0x3E6EC8,eyeCol:0xFFF27A,eyeGlow:true,fangs:true,legFire:0x9FE6FF});
def('baku',    {type:'quad',len:1.8,height:0.9,w:0.55,col:0x3E3A8C,col2:0x8C8AD8,stripes:true,headKind:'elephant',headCol:0x4E4AA0,tail:'fluffy',tailCol:0x6E6AC8,eyeCol:0xF5C542,
  extra:(R)=>{ for(let i=0;i<5;i++) R.add('body',G_.sph(0.14),0xB98CFF,{p:[(i-2)*0.4,0.9,(i%2)*0.3],glow:true}); }});
def('onryo',   {type:'human',build:'hero',skin:0x6FA8D8,hat:{kind:'kabuto',col:0x2A4A7A,col2:0x9FE6FF,crest:'crescent'},outfit:{kind:'armor',col:0x2A4A7A,col2:0x3E6EA8,trim:0x9FE6FF,plate:0x1E3A6A},weapon:{kind:'katana',col:0x9FE6FF,glow:true},eyes:{col:0x9FE6FF,glow:true,fierce:true},back:{kind:'flames',col:0x6FB8FF}});
def('shachi',  {type:'quad',len:1.7,height:0.85,w:0.45,col:0xF5B820,col2:0x2A1E14,stripes:true,headKind:'tiger',headCol:0xF5B820,muzzle:0xFFF4C8,tail:'fish',tailCol:0xF5C542,finCol:0x3EA8A0,fangs:true,eyeCol:0x6FE36F,scales:0x3EA8A0,tailLen:1.4});
def('amaterasu',{type:'human',build:'slim',skin:0xFBE6D6,hair:{style:'longflow',col:0xF5C542,col2:0xE8B030,len:3.2},hat:{kind:'sun',col:GLD,col2:0xFFE27A},outfit:{kind:'kimono',col:0xF6DA9A,col2:0xE2562E,trim:GLD,belt:0xC8341E},weapon:{kind:'orb',col:0xFFE27A},eyes:{col:0xC8901A},back:{kind:'halo',col2:0xFFE27A}});
def('fujin',   {type:'human',build:'broad',skin:0x4E8A3A,hair:{style:'wild',col:0xF2F2F2,col2:0xE0E6E0},horns:{style:'oni',col:GLD,len:0.5},outfit:{kind:'bare',col2:0x2A4A8C},eyes:{col:0xF5C542,fierce:true,grin:true},back:{kind:'bag',col:0xDCE6F5,col2:0x2A4A8C}});
def('yukionna',{type:'human',build:'slim',skin:0xE6F0FA,hair:{style:'long',col:0x14121A,len:3.6,ornament:0xDCE6FF},outfit:{kind:'kimono',col:0xC4E2F4,col2:0xDCE6F5,trim:0x9FC8E6,belt:0x9FC8E6},eyes:{col:0x6FA8D8},weapon:{kind:'fan',col:0xDCE6FF}});
def('benkei',  {type:'human',build:'broad',skin:0xD8A878,hat:{kind:'hood',col:WHT},outfit:{kind:'monk',col:0x1E1E24,col2:0x14141A,trim:0x3A3A42,belt:WHT},weapon:{kind:'naginata',col:0xE6ECF2,col2:0x2A1E1E},eyes:{col:0x3A2A1E,fierce:true},beads:0x2A1E18});
def('kagutsuchi',{type:'human',build:'hero',skin:0xE8A878,hair:{style:'flame',col:0xFF6A1F,col2:0xFFB04A},outfit:{kind:'armor',col:0xC8341E,col2:0xF5A042,trim:GLD,plate:0x8C1E14},eyes:{col:0xFFE27A,glow:true,fierce:true},back:{kind:'flames'}});
def('izanagi', {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6E8F2,col2:0xB8BCD6,len:3},outfit:{kind:'robe',col:0xD4DCEE,col2:0x4F74C0,trim:GLD,belt:0x3A5A9E},weapon:{kind:'spear',col:GLD,col2:0xF5E6C8,glow:true},eyes:{col:0xC8901A},back:{kind:'halo',col2:0xFFE27A}});
def('takemika',{type:'human',build:'hero',skin:0xE8D2B8,hat:{kind:'kabuto',col:GLD,col2:0x9FE6FF,crest:'horns'},outfit:{kind:'armor',col:0x2A4A8C,col2:GLD,trim:0x9FE6FF,plate:0xD8B030},weapon:{kind:'greatsword',col:0xDCF4FF,glow:true},eyes:{col:0x9FE6FF,glow:true,fierce:true},back:{kind:'flames',col:0x9FE6FF}});
def('hachiman',{type:'human',build:'hero',skin:0x8C5A3A,hat:{kind:'kabuto',col:0x1E1A1A,col2:GLD,crest:'sun',glow:true},outfit:{kind:'armor',col:0x8C1E1E,col2:0x1E1A1A,trim:GLD,plate:0xA8281E},weapon:{kind:'bow',col2:0x2A1E1E},back:{kind:'quiver',col:0x8C1E1E},eyes:{col:0x3A2A1E,fierce:true}});
def('bishamon',{type:'human',build:'broad',skin:0x4E8A5A,hat:{kind:'pagoda',col:0x2F6A3A,col2:GLD},outfit:{kind:'armor',col:0x2F6A3A,col2:GLD,trim:GLD,plate:0x3F8A4A,emblem:0xD8342C},weapon:{kind:'spear',col:GLD,col2:0x6B3A1E},eyes:{col:0xF5C542,fierce:true},back:{kind:'halo',col2:GLD}});
def('inari',   {type:'human',build:'slim',head:'mask',mask:'fox',maskCol:GLD,skin:0xF4E6DA,hair:{style:'long',col:0xF4F4F8,len:3},ears:'fox',earCol:0xF4F4F8,outfit:{kind:'kimono',col:0xF2D2B8,col2:0xE8E0D8,trim:0xD8342C,belt:0xD8342C},back:{kind:'tails',col:0xF4F4F8,col2:0xE8EEF6,tip:0x6FB8FF,n:5},weapon:{kind:'orb',col:0x6FB8FF,hand:'L'}});
def('saruta',  {type:'human',build:'broad',skin:0xC8342C,beard:{style:'long',col:0xF2F2F2},hair:{style:'wild',col:0xF2F2F2},hat:{kind:'leaves',col:0x3F6A2A,col2:0x5A8A3A},outfit:{kind:'robe',col:0x3F6A2A,col2:0x2F5A2A,trim:GLD},weapon:{kind:'staff',col:GLD,col2:0x6B4A2A,orb:0x9BF57E},eyes:{col:0xF5C542,fierce:true},
  extra:(R,B)=>{ R.add('head',G_.cone(B.head*0.2,B.head*1.1,8),0xC8342C,{p:[0,B.head*0.85,B.head*1.3],r:[Math.PI/2+0.1,0,0]}); }});
def('minaka',  {type:'human',build:'hero',skin:0xF4ECE6,beard:{style:'long',col:0xF4F4F8},hair:{style:'longflow',col:0xF4F4F8,len:2.6},hat:{kind:'crown',col:GLD,gem:0xC58CFF},outfit:{kind:'robe',col:0x3A2A6E,col2:0x2A1E55,trim:GLD,pattern:GLD},weapon:{kind:'staff',col:GLD,col2:0x3A2A6E,orb:0xFFE27A},back:{kind:'planets'},eyes:{col:0xC8901A}});
def('kunitoko',{type:'human',build:'giant',skin:0x6E6A5A,head:'stone',headCol:0x7A7462,beard:{style:'long',col:0x4E7A3A},hair:{style:'wild',col:0x3F6A2A,col2:0x5A8A3A},outfit:{kind:'bare',col2:0x5A5648},eyes:{col:0x9BF57E,glow:true},back:{kind:'trees'}});
def('yatono',  {type:'human',build:'hero',head:'snake',skin:0x3F8A3A,eyes:{col:0xF5C542,glow:true},outfit:{kind:'armor',col:0x2F6A2A,col2:GLD,trim:GLD,plate:0x3F8A3A},back:{kind:'serpents',col:0x3F8A3A},weapon:{kind:'katana',col:0x9BF57E,glow:true}});
def('marishi', {type:'human',build:'slim',skin:0xFBE6D6,hair:{style:'longflow',col:0xF4F4F8,len:3},hat:{kind:'crown',col:GLD,n:9,gem:0xD8342C},outfit:{kind:'kimono',col:0xF6D0A6,col2:0xF5E6C8,trim:GLD,belt:GLD},back:{kind:'halo',col2:GLD},weapon:{kind:'fan',col:GLD},
  extra:(R,B)=>{ for(const sd of [1,-1]){ R.add('head',G_.sph(B.head*0.8),0xFBE6D6,{p:[sd*B.head*1.3,B.head*0.9,-B.head*0.3]}); R.add('head',G_.sph(B.head*0.85,B.head*0.9,B.head*0.8),0xF4F4F8,{p:[sd*B.head*1.32,B.head*1.0,-B.head*0.5]}); } }});
def('mioya',   {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xF4F4F8,len:2.6},hat:{kind:'sun',col:GLD,col2:0xFFE27A},outfit:{kind:'robe',col:0xCFE6F2,col2:0xF5E6C8,trim:GLD},weapon:{kind:'staff',col:GLD,col2:0xF5E6C8,orb:0xFFE27A},eyes:{col:0xC8901A}});
def('wata',    {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0x5AC8D8,col2:0x3EA8C8,len:3},hat:{kind:'crown',col:0xDCF4FF,col2:0x9FE6FF,gem:0x6FE3FF},outfit:{kind:'robe',col:0xA8D8F0,col2:0x9FD8E6,trim:0x3EA8C8},weapon:{kind:'trident',col:0x9FE6FF,col2:0x2A6A8C,glow:true},back:{kind:'halo',col2:0x9FE6FF},eyes:{col:0x2A8CA8}});
def('oyama',   {type:'human',build:'broad',skin:0xE8D2B8,beard:{style:'long',col:0xF4F4F8},hair:{style:'wild',col:0xF4F4F8},hat:{kind:'crown',col:GLD,gem:0x6FE36F},outfit:{kind:'robe',col:0x3F6A2A,col2:0x2F5A2A,trim:GLD},weapon:{kind:'staff',col:GLD,col2:0x6B4A2A,orb:0x9BF57E},eyes:{col:0x6FB548,fierce:true}});
def('kurao',   {type:'human',build:'hero',skin:0xEAF2F8,hair:{style:'longflow',col:0xF4F8FC,col2:0xDCE6F0,len:3},horns:{style:'antler',col:0x6FD8C8,glow:true},outfit:{kind:'robe',col:0xC8D2EE,col2:0xDCE6F0,trim:0x6FD8C8},weapon:{kind:'orb',col:0x9FE6FF},eyes:{col:0x6FD8C8,glow:true}});
def('magatsu', {type:'human',build:'broad',skin:0x3A2626,hair:{style:'flame',col:0xD8341E,col2:0xFF6A1F},horns:{style:'curved',col:0x1E1A1A},outfit:{kind:'armor',col:0x2A1E1E,col2:0x8C1E14,trim:0xFF6A1F,plate:0x1E1414},weapon:{kind:'greatsword',col:0xFF6A1F,glow:true},eyes:{col:0xFFE27A,glow:true,fierce:true},back:{kind:'flames'}});
def('ryugu',   {type:'human',build:'hero',skin:0xF4ECE6,hair:{style:'longflow',col:0xE6F4EC,col2:0x9FD8B8,len:3},horns:{style:'antler',col:GLD},hat:{kind:'crown',col:GLD,gem:0x6FE3FF},outfit:{kind:'robe',col:0x2F8F78,col2:0x1E6A5A,trim:GLD},weapon:{kind:'trident',col:GLD,col2:0x1E6A5A},eyes:{col:0x2F8F78}});
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

/* ================================================================ instances, pool and animation */
const BUILT={};   /* key -> {geos, kind, height, meta} shared geometry */
function getBuilt(key){ if(BUILT[key]) return BUILT[key]; const sp=DEFS[key]; if(!sp) return null;
  const b=sp.type==='quad'?buildQuad(sp):sp.type==='serpent'?buildSerpent(sp):sp.type==='spider'?buildSpider(sp):sp.type==='blob'?buildBlob(sp):sp.type==='fish'?buildFish(sp):buildHuman(sp);
  const geos=b.rig.build(); const bb=geos.toon.boundingBox; geos.height=bb.max.y-Math.min(0,bb.min.y);
  return (BUILT[key]={sp,b,geos,height:geos.height,proto:b.rig}); }
function cloneRig(proto){ /* fresh bone hierarchy matching the prototype's bind pose */
  const map={}, bones=[];
  for(const b of proto.bones){ const n=new T.Bone(); n.name=b.name; n.position.copy(b.position); n.userData.rest=b.position.clone(); map[b.name]=n; bones.push(n);
    if(b.parent&&b.parent.isBone) map[b.parent.name].add(n); }
  return {bones,map,root:map.root}; }
function makeInstance(key){ const B=getBuilt(key); if(!B) return null;
  const grp=new T.Group(), rig=cloneRig(B.proto); grp.add(rig.root); grp.updateMatrixWorld(true);
  const skel=new T.Skeleton(rig.bones);
  const mat=toonMat(), body=new T.SkinnedMesh(B.geos.toon,mat); body.bind(skel); body.frustumCulled=false; grp.add(body);
  let ol=null; if(B.geos.ol){ ol=new T.SkinnedMesh(B.geos.ol,OL_MAT); ol.bind(skel); ol.frustumCulled=false; grp.add(ol); }
  let gl=null; if(B.geos.glow){ gl=new T.SkinnedMesh(B.geos.glow,GLOW_MAT); gl.bind(skel); gl.frustumCulled=false; grp.add(gl); }
  return {key,grp,b:rig.map,body,ol,gl,mat,kind:B.b.kind,B,sp:B.sp,
    st:{phase:Math.random()*TAU,move:0,atk:0,last:null,yaw:0,t:Math.random()*10,hit:0,cast:0,dash:0,lift:0}}; }

/* --- pose helpers */
const R0=(b,x,y,z)=>{ if(b) b.rotation.set(x||0,y||0,z||0); };
const ADD=(b,x,y,z)=>{ if(b){ b.rotation.x+=x||0; b.rotation.y+=y||0; b.rotation.z+=z||0; } };
const OFF=(b,x,y,z)=>{ if(b){ const r=b.userData.rest; b.position.set(r.x+(x||0),r.y+(y||0),r.z+(z||0)); } };

/* attack styles: wind-up (u<0.3), strike (0.3-0.5), follow-through and recover */
function attackCurve(u){ const wind=sm(u/0.3)*(1-sm((u-0.3)/0.15)), strike=sm((u-0.28)/0.14)*(1-sm((u-0.6)/0.4)); return {wind,strike}; }

function poseHuman(I,s,dt){ const b=I.b, S=I.st, t=S.t, mv=S.move, ph=S.phase;
  for(const k in b){ R0(b[k]); OFF(b[k]); }
  const sw=Math.sin(ph), cw=Math.cos(ph), run=mv>0.5?1:mv*2;
  /* idle breathing and sway */
  const br=Math.sin(t*2.2), sway=Math.sin(t*0.9);
  ADD(b.chest,br*0.02*(1-mv),0,0); ADD(b.spine,0,sway*0.03*(1-mv),sway*0.015*(1-mv)); ADD(b.head,-0.22-br*0.02,sway*0.06*(1-mv),0); ADD(b.neck,-0.08,0,0);
  ADD(b.armL,0,0,0.12+br*0.02); ADD(b.armR,0,0,-0.12-br*0.02); ADD(b.elbowL,-0.15,0,0); ADD(b.elbowR,-0.15,0,0);
  /* walk / run cycle */
  const A=0.55*run+0.25*mv;
  ADD(b.thighL,-sw*A,0,0); ADD(b.thighR,sw*A,0,0);
  ADD(b.kneeL,Math.max(0,-cw)*A*1.4+0.05,0,0); ADD(b.kneeR,Math.max(0,cw)*A*1.4+0.05,0,0);
  ADD(b.footL,-Math.max(0,-cw)*A*0.4,0,0); ADD(b.footR,-Math.max(0,cw)*A*0.4,0,0);
  ADD(b.armL,sw*A*0.9,0,0); ADD(b.armR,-sw*A*0.9,0,0); ADD(b.elbowL,-A*0.4,0,0); ADD(b.elbowR,-A*0.4,0,0);
  ADD(b.spine,0.08*mv,sw*0.12*mv,0); ADD(b.chest,0.04*mv,-sw*0.1*mv,0); ADD(b.hips,0,-sw*0.1*mv,0);
  OFF(b.hips,0,Math.abs(cw)*0.06*mv-0.03*mv,0);
  ADD(b.skirt,-sw*0.12*mv,0,0); ADD(b.hair,0.25*mv+Math.sin(t*3)*0.04,0,0); ADD(b.tail,0.3*mv+Math.sin(t*2)*0.15,Math.sin(t*1.5)*0.2,0);
  for(const w of ['wingL','wingR']) if(b[w]){ const sd=w==='wingL'?1:-1; ADD(b[w],0,sd*(0.25+Math.sin(t*(mv?8:2.2))*(mv?0.35:0.12)),sd*Math.sin(t*(mv?8:2.2))*0.15); }
  if(b.orbit) b.orbit.rotation.y=t*0.6;
  /* attacks */
  const st=I.sp.weapon?I.sp.weapon.kind:'none', style=s.style||st, u=S.atkU, active=u>=0&&u<1;
  if(active){ const {wind,strike}=attackCurve(u);
    if(style==='arrow'||style==='bow'){ /* aim and loose */
      const aim=Math.min(1,u*5)*(1-sm((u-0.75)/0.25));
      ADD(b.armL,-1.45*aim,0,-0.1*aim); ADD(b.elbowL,0.15*aim,0,0);
      ADD(b.armR,-1.35*aim,0,0.25*aim); ADD(b.elbowR,-2.1*aim*(1-strike*0.8),0,0); ADD(b.spine,0,-0.5*aim,0); ADD(b.head,0,0.45*aim,0); }
    else if(style==='orb'||style==='fox'||style==='cast'||style==='talisman'||style==='fan'||style==='lute'||style==='lantern'){ /* gather and release */
      ADD(b.armR,-0.6*wind-1.5*strike,0,-0.3*wind); ADD(b.armL,-0.3*wind-1.2*strike,0,0.3*wind); ADD(b.elbowR,-1.2*wind+0.5*strike,0,0); ADD(b.elbowL,-1.0*wind+0.5*strike,0,0);
      ADD(b.spine,-0.15*wind+0.18*strike,0,0); ADD(b.head,-0.1*wind,0,0); }
    else if(style==='blade'||style==='dagger'||style==='sickle'){ /* fast cross slash */
      ADD(b.armR,-0.8*wind-1.3*strike,0,-0.9*wind+0.6*strike); ADD(b.elbowR,-0.6*wind,0,0); ADD(b.spine,0,0.6*wind-0.9*strike,0); ADD(b.chest,0.1*strike,0,0);
      ADD(b.armL,-0.4*strike,0,0.4*strike); OFF(b.root,0,0,0.25*strike); }
    else if(style==='ice'||style==='flame'||style==='spin'){ /* sweeping spin */
      ADD(b.armR,-1.3*(wind+strike),0,-0.5); ADD(b.spine,0,0.9*wind-1.6*strike,0); ADD(b.armL,-0.6*strike,0,0.6*strike); }
    else if(style==='bolt'||style==='spear'||style==='trident'||style==='thrust'){ /* raise, then thrust */
      ADD(b.armR,-2.6*wind-1.4*strike,0,-0.2); ADD(b.elbowR,-0.4*wind,0,0); ADD(b.spine,-0.12*wind+0.2*strike,0,0); OFF(b.root,0,0,0.2*strike); }
    else if(style==='wind'){ ADD(b.armR,-2.2*wind-0.8*strike,0,-0.6*wind+0.4*strike); ADD(b.spine,0,0.5*wind-0.8*strike,0); }
    else { /* melee: heavy overhead swing */
      ADD(b.armR,-2.7*wind-0.9*strike,0,-0.15); ADD(b.armL,-2.2*wind-0.7*strike,0,0.15); ADD(b.elbowR,-0.5*wind,0,0); ADD(b.elbowL,-0.5*wind,0,0);
      ADD(b.spine,-0.25*wind+0.45*strike,0,0); ADD(b.chest,-0.1*wind+0.2*strike,0,0); OFF(b.root,0,0.06*wind,0.15*strike); ADD(b.thighL,-0.3*strike,0,0); ADD(b.kneeL,0.4*strike,0,0); } }
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
  const u=S.atkU; if(u>=0&&u<1){ const {wind,strike}=attackCurve(u); ADD(b.front,-0.4*wind,0,0); ADD(b.neck,-0.4*wind+0.6*strike,0,0); ADD(b.head,0.4*strike,0,0); ADD(b.tFL,-0.8*wind+0.6*strike,0,0); ADD(b.tFR,-0.8*wind+0.6*strike,0,0); OFF(b.root,0,0.1*wind,0.4*strike); }
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
const POSE={human:poseHuman,quad:poseQuad,serpent:poseSerpent,spider:poseSpider,blob:poseBlob,fish:poseFish};

/* ================================================================ public driver */
const live=new Map(), pool={}; let frameTag=0;
const _tint=new T.Color(), WHITE=new T.Color(1,1,1);
function acquire(ent,key){ let I=live.get(ent); if(I&&I.key===key){ I.tag=frameTag; return I; }
  if(I) release(ent,I);
  const p=pool[key]; I=(p&&p.length)?p.pop():makeInstance(key); if(!I) return null;
  I.st.last=null; I.st.atkU=-1; I.st.hit=0; I.tag=frameTag; I.grp.visible=true; live.set(ent,I); if(opt.scene&&!I.grp.parent) opt.scene.add(I.grp); return I; }
function release(ent,I){ live.delete(ent); I.grp.visible=false; (pool[I.key]=pool[I.key]||[]).push(I); }
const API={
  has:key=>!!DEFS[key],
  keys:()=>Object.keys(DEFS),
  prebuild:keys=>{ for(const k of keys) getBuilt(k); },
  begin(){ frameTag++; },
  /* p: {x,y,z,rot,H,dt,moving,atk,style,flash,frozen,burn,cast,castKind,castU,stun,scale,tint} */
  drive(ent,key,p){ const I=acquire(ent,key); if(!I) return false; const S=I.st, dt=Math.min(0.05,p.dt||0.016);
    S.t+=dt;
    /* speed from movement, so feet keep pace with the ground */
    let spd=0; if(S.last){ spd=Math.hypot(p.x-S.last.x,p.z-S.last.z)/Math.max(dt,1e-4); } S.last={x:p.x,z:p.z};
    const want=p.moving?clamp(spd/(p.H*2.2+0.01),0.35,1):0; S.move=lerp(S.move,want,1-Math.exp(-dt*10));
    S.phase+=dt*(1.5+spd/Math.max(0.3,p.H*0.38))*(S.move>0.05?1:0.3);
    /* attack progress: the game sets atk to ~0.9 on each strike and lets it decay */
    const a=p.atk||0; if(a>(S.prevAtk||0)+0.2) S.atkU=0; S.prevAtk=a;
    if(S.atkU>=0){ S.atkU+=dt/(p.atkDur||0.42); if(S.atkU>=1) S.atkU=-1; }
    S.hit=Math.max(S.hit-dt*5,p.flash>0.5?1:0);
    POSE[I.kind](I,{style:p.style,cast:!!p.cast,castKind:p.castKind,castU:p.castU,stun:p.stun},dt);
    /* place, face and scale */
    const sc=(p.H||2)/I.B.height*(p.scale||1);
    I.grp.position.set(p.x,p.y||0,p.z); I.grp.scale.setScalar(sc);
    const targetYaw=p.rot+(S.yaw||0); let d=targetYaw-I.grp.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); I.grp.rotation.y+=d*(1-Math.exp(-dt*14));
    if(OL_MAT.userData.sh) OL_MAT.userData.sh.uniforms.uOut.value=1;
    /* status tints and hit flash */
    _tint.copy(WHITE); if(p.tint!=null) _tint.set(p.tint).lerp(WHITE,0.55); if(p.frozen) _tint.setRGB(0.65,0.9,1.0); if(p.burn) _tint.setRGB(1,0.82,0.7);
    I.mat.color.copy(_tint); I.mat.emissive.setRGB(S.hit*0.55,S.hit*0.12,S.hit*0.1);
    return true; },
  end(){ for(const [ent,I] of [...live]) if(I.tag!==frameTag) release(ent,I); },
  clear(){ for(const [ent,I] of [...live]) release(ent,I); },
  stats:()=>({live:live.size,built:Object.keys(BUILT).length,pooled:Object.values(pool).reduce((a,p)=>a+p.length,0)}),
  instance:ent=>live.get(ent),
  DEFS, BUILDS, kit:{G_,Rig,toonMat,shade,mergeRaw} };
return API; };
})();
