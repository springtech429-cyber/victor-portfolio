// Custom GLSL used by the 3D scene. Everything here is hand-written, no shader libraries.

/** Ashima 3D simplex noise, shared by several shaders. */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** Full-screen "signal field": slow neon-blue flow lines on black that bend around the pointer. */
export const FIELD_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;

export const FIELD_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uAspect; uniform float uVel;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);
  float d = distance(p, m);
  // The pointer pushes the field away like a finger in water.
  p += normalize(p - m + 1e-4) * 0.12 * exp(-d * 5.0);
  float t = uTime * 0.07;
  float n = snoise(vec3(p * 1.6, t + uScroll * 0.6));
  float n2 = snoise(vec3(p * 3.4 + 7.0, t * 1.4 - uScroll));
  // Thin bright contour lines of the noise: that is the "flow line" look.
  float lines = smoothstep(0.468, 0.5, abs(fract((n + n2 * 0.4) * 6.0) - 0.5));
  float glow = smoothstep(0.9, 0.0, d) * 0.25 + uVel * 0.08;
  vec3 blue = vec3(0.0, 0.62, 1.0); vec3 cyan = vec3(0.0, 0.92, 1.0);
  vec3 col = mix(blue, cyan, n * 0.5 + 0.5) * (lines * (0.22 + glow * 1.4) + glow * 0.06);
  float vig = smoothstep(1.25, 0.2, length(p));
  gl_FragColor = vec4(col * vig, 1.0);
}`;

/** The hero orb: noisy displaced sphere with a hot fresnel rim and drifting scan lines. */
export const ORB_VERT = /* glsl */ `
uniform float uTime; uniform float uVel; uniform float uAmp;
varying vec3 vNormal; varying vec3 vView; varying float vNoise; varying vec3 vPos;
${NOISE}
void main(){
  float n = snoise(position * 1.25 + vec3(uTime * 0.35));
  float amp = uAmp + uVel * 0.25;
  vec3 displaced = position + normal * n * amp;
  vNoise = n; vPos = displaced;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const ORB_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vNoise; varying vec3 vPos;
void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
  float scan = smoothstep(0.45, 0.5, abs(fract(vPos.y * 7.0 - uTime * 0.6) - 0.5));
  vec3 deep = vec3(0.0, 0.03, 0.12);
  vec3 neon = vec3(0.0, 0.85, 1.0) * 2.4;
  vec3 col = deep + neon * fres + vec3(0.0, 0.25, 0.9) * (vNoise * 0.5 + 0.5) * 0.35;
  col += neon * scan * 0.12 * (0.4 + fres);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Particles drift on a noise field and are shoved away from the pointer. */
export const PARTICLE_VERT = /* glsl */ `
uniform float uTime; uniform vec3 uMouse; uniform float uSize; uniform float uPixelRatio; uniform float uVel;
attribute float aSeed;
varying float vAlpha; varying float vSeed;
${NOISE}
void main(){
  vec3 p = position;
  float t = uTime * 0.12 + aSeed * 10.0;
  p += vec3(snoise(p * 0.12 + t), snoise(p * 0.12 + t + 31.4), snoise(p * 0.12 + t + 71.9)) * (1.4 + uVel * 0.08);
  vec3 away = p - uMouse; float d = length(away);
  p += normalize(away + 1e-4) * smoothstep(3.0, 0.0, d) * 1.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (1.0 + aSeed) * (14.0 / -mv.z);
  vAlpha = smoothstep(40.0, 4.0, -mv.z) * (0.35 + 0.65 * aSeed);
  vSeed = aSeed;
}`;

export const PARTICLE_FRAG = /* glsl */ `
varying float vAlpha; varying float vSeed;
void main(){
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  float a = smoothstep(0.5, 0.0, r) * vAlpha;
  vec3 col = mix(vec3(0.0, 0.55, 1.0), vec3(0.5, 0.95, 1.0), vSeed) * 1.8;
  gl_FragColor = vec4(col, a);
}`;

/** Shapes in the physics playground: translucent glass with a bright edge. */
export const SHAPE_VERT = /* glsl */ `
varying vec3 vNormal; varying vec3 vView;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

export const SHAPE_FRAG = /* glsl */ `
uniform float uHot; uniform float uTime;
varying vec3 vNormal; varying vec3 vView;
void main(){
  float f = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 1.8);
  vec3 base = vec3(0.0, 0.05, 0.16);
  vec3 neon = mix(vec3(0.0, 0.55, 1.0), vec3(0.2, 1.0, 1.0), uHot) * 2.2;
  gl_FragColor = vec4(base + neon * f, 1.0);
}`;
