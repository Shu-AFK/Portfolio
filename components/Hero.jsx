'use client'
import { useEffect, useRef } from 'react'

export default function Hero(){
  const canvasRef = useRef(null)
  useEffect(()=>{
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl')
    if(!gl){ canvas.style.display='none'; return }

    gl.getExtension('OES_standard_derivatives')

    const vert = `
      attribute vec2 position;
      varying vec2 vUv;
      void main(){
        vUv = (position + 1.0) * 0.5;
        gl_Position = vec4(position,0.,1.);
      }`;

    const frag = `
      precision highp float;
      #extension GL_OES_standard_derivatives : enable
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p);
        vec2 f=fract(p);
        float a=hash(i);
        float b=hash(i+vec2(1.,0.));
        float c=hash(i+vec2(0.,1.));
        float d=hash(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
      }
      float fbm(vec2 p){
        float a = 0.0, w = 0.5;
        for(int i=0;i<5;i++){ a += w*noise(p); p = p*2.0 + vec2(37.0,11.0); w *= 0.5; }
        return a;
      }

      vec3 palette(float t){
        vec3 c1 = vec3(0.06, 0.00, 0.17);
        vec3 c2 = vec3(0.14, 0.00, 0.27);
        vec3 c3 = vec3(0.23, 0.03, 0.42);
        vec3 c4 = vec3(0.35, 0.09, 0.60);
        vec3 c5 = vec3(0.48, 0.17, 0.62);
        vec3 c6 = vec3(0.62, 0.30, 0.86);
        vec3 c7 = vec3(0.78, 0.49, 1.00);
        vec3 c8 = vec3(0.88, 0.66, 1.00);
        t = clamp(t, 0.0, 1.0);
        if(t < 0.125) return mix(c1, c2, smoothstep(0.0,0.125,t));
        else if(t < 0.25) return mix(c2, c3, smoothstep(0.125,0.25,t));
        else if(t < 0.375) return mix(c3, c4, smoothstep(0.25,0.375,t));
        else if(t < 0.5) return mix(c4, c5, smoothstep(0.375,0.5,t));
        else if(t < 0.625) return mix(c5, c6, smoothstep(0.5,0.625,t));
        else if(t < 0.75) return mix(c6, c7, smoothstep(0.625,0.75,t));
        else return mix(c7, c8, smoothstep(0.75,1.0,t));
      }

      void main(){
        vec2 aspect = vec2(u_resolution.x/u_resolution.y, 1.0);
        vec2 uv = (vUv - 0.5) * aspect;
        float t = u_time * 0.15;

        vec2 m = (u_mouse/u_resolution - 0.5) * aspect;
        float dist = length(uv - m);
        float influence = exp(-dist*3.0);

        vec2 p = uv * (1.0 + 0.1*influence) + vec2(t*0.05, t*0.03);

        float h = fbm(p*1.2);
        h += influence*0.1;

        float lineDensity = 30.0;
        float ff = fract(h * lineDensity);
        float wid = fwidth(h * lineDensity);
        float contour = smoothstep(0.0, wid*1.5, min(ff, 1.0 - ff));

        vec3 base = palette(h);
        vec3 lineColor = vec3(1.0);
        vec3 col = mix(lineColor, base, contour);

        gl_FragColor = vec4(col, 1.0);
      }`;

    function compile(type, src){
      const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); return null }
      return s;
    }

    const vs=compile(gl.VERTEX_SHADER, vert);
    const fs=compile(gl.FRAGMENT_SHADER, frag);
    const prog=gl.createProgram(); gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog);

    const posLoc = gl.getAttribLocation(prog,'position');
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    gl.useProgram(prog);
    gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0)

    const uTime = gl.getUniformLocation(prog,'u_time');
    const uRes = gl.getUniformLocation(prog,'u_resolution');
    const uMouse = gl.getUniformLocation(prog,'u_mouse');

    function resize(){
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize); resize();

    let mouse = [0,0];
    function onMove(e){
      const rect = canvas.getBoundingClientRect();
      mouse = [ (e.clientX - rect.left) * (canvas.width/rect.width), (rect.bottom - e.clientY) * (canvas.height/rect.height) ];
    }
    window.addEventListener('mousemove', onMove);

    let start = performance.now();
    function draw(){
      let now = performance.now();
      gl.uniform1f(uTime, (now-start)/1000.0);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      requestAnimationFrame(draw);
    }
    draw();

    return ()=>{
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    }
  },[])

  return (
    <section className="relative h-[90vh] md:h-screen flex items-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold">Floyd Göttsch</h1>
        <p className="mt-4 text-lg opacity-90">C++ & Go. Making things that work.</p>
        <div className="mt-6 flex gap-4">
          <a href="#projects" className="px-6 py-2 rounded-2xl font-semibold bg-gradient-to-br from-[#3C096C] via-[#7B2CBF] to-[#C77DFF]">Projects</a>
          <a href="#contact" className="px-6 py-2 rounded-2xl font-medium border-2 border-transparent">Contact</a>
        </div>
      </div>
    </section>
  )
}
