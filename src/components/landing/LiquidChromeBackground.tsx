import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed liquid-metal WebGL background (OGL). Domain-warped FBM shaded like
 * brushed chrome with chromatic-aberration fringing and a cursor-reactive bend.
 * Falls back to a static chrome poster on reduced-motion or no WebGL, and pauses
 * the render loop when offscreen / tab hidden.
 */

const VERT = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
float field(vec2 p){
  float t = uTime * 0.06;
  vec2 q = vec2(fbm(p + vec2(0.0,t)), fbm(p + vec2(5.2,1.3 - t)));
  vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7,9.2) + t), fbm(p + 4.0*q + vec2(8.3,2.8) - t));
  return fbm(p + 4.0*r);
}
vec3 chromeEnv(float n){
  float y = clamp(n, 0.0, 1.0);
  vec3 dark = vec3(0.40,0.40,0.46);
  vec3 light = vec3(1.0);
  vec3 mid = vec3(0.80);
  vec3 col = mix(dark, light, smoothstep(0.0,0.5,y));
  col = mix(col, mid, smoothstep(0.5,1.0,y));
  return col;
}
void main(){
  vec2 p = (gl_FragCoord.xy*2.0 - uResolution.xy) / uResolution.y;
  vec2 m = (uMouse*2.0 - 1.0);
  m.x *= uResolution.x / uResolution.y;
  p += 0.14 * m * exp(-2.0 * length(p - m));

  float sc = 1.5;
  float e = 0.004;
  float h  = field(p*sc);
  float hx = field((p + vec2(e,0.0))*sc);
  float hy = field((p + vec2(0.0,e))*sc);
  vec3 nrm = normalize(vec3(h - hx, h - hy, 0.05));

  float fres = pow(1.0 - max(nrm.z, 0.0), 3.0);
  // gentle chromatic aberration — silver first, color only at the very edges
  float off = 0.015 + 0.09 * fres;
  vec3 col;
  col.r = chromeEnv(nrm.y + off).r;
  col.g = chromeEnv(nrm.y).g;
  col.b = chromeEnv(nrm.y - off).b;

  // iridescent oil-slick, confined to the sharpest specular fringe only
  float fringe = smoothstep(0.6, 1.0, fres);
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0,0.33,0.67) + nrm.y + fres*1.4));
  col = mix(col, col*0.7 + irid*0.6, fringe * 0.35);

  float spec = pow(max(nrm.y, 0.0), 8.0);
  col += spec * 0.35;

  float vig = smoothstep(1.6, 0.15, length(p));
  col *= mix(0.10, 1.0, vig);
  col *= (0.45 + 0.55 * h);

  gl_FragColor = vec4(col, 1.0);
}
`;

function ChromePoster() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-bg">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 25%, rgba(205,205,214,0.45), transparent 55%), radial-gradient(90% 80% at 80% 100%, rgba(108,108,120,0.4), transparent 55%), var(--chrome-ramp)',
        }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="grain absolute inset-0 opacity-40" />
    </div>
  );
}

export default function LiquidChromeBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced || !ref.current) return;
    const host = ref.current;
    let raf = 0;
    let running = true;
    let disposed = false;
    let cleanupExtra: (() => void) | undefined;

    (async () => {
      try {
        const { Renderer, Program, Mesh, Triangle, Vec2 } = await import('ogl');
        if (disposed) return;
        const isSmall = window.innerWidth < 640;
        const renderer = new Renderer({
          dpr: Math.min(isSmall ? 1 : 1.5, window.devicePixelRatio || 1),
          alpha: false,
          powerPreference: 'high-performance',
        });
        const gl = renderer.gl;
        gl.canvas.style.cssText = 'width:100%;height:100%;display:block;';
        host.appendChild(gl.canvas);

        const program = new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new Vec2(1, 1) },
            uMouse: { value: new Vec2(0.5, 0.5) },
          },
        });
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

        const resize = () => {
          const w = host.clientWidth || window.innerWidth;
          const h = host.clientHeight || window.innerHeight;
          renderer.setSize(w, h);
          program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
        };
        resize();
        let resizeT = 0;
        const onResize = () => {
          window.clearTimeout(resizeT);
          resizeT = window.setTimeout(resize, 150);
        };
        window.addEventListener('resize', onResize);

        // mouse with lerp; gentle auto-drift on touch
        const target = { x: 0.5, y: 0.5 };
        const cur = { x: 0.5, y: 0.5 };
        const onMove = (e: PointerEvent) => {
          const r = host.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width;
          target.y = 1 - (e.clientY - r.top) / r.height;
        };
        window.addEventListener('pointermove', onMove, { passive: true });

        const io = new IntersectionObserver(([en]) => (running = en.isIntersecting), { threshold: 0 });
        io.observe(host);
        const onVis = () => (running = !document.hidden);
        document.addEventListener('visibilitychange', onVis);

        const start = performance.now();
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!running) return;
          cur.x += (target.x - cur.x) * 0.05;
          cur.y += (target.y - cur.y) * 0.05;
          program.uniforms.uMouse.value.set(cur.x, cur.y);
          program.uniforms.uTime.value = (performance.now() - start) / 1000;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);

        cleanupExtra = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('resize', onResize);
          window.removeEventListener('pointermove', onMove);
          document.removeEventListener('visibilitychange', onVis);
          io.disconnect();
          gl.canvas.remove();
          const ext = gl.getExtension('WEBGL_lose_context');
          ext?.loseContext();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanupExtra?.();
    };
  }, [reduced]);

  // Poster shows for reduced-motion / WebGL failure; canvas mounts above it.
  return (
    <>
      <ChromePoster />
      {!reduced && !failed && <div ref={ref} className="absolute inset-0 -z-10" aria-hidden />}
    </>
  );
}
