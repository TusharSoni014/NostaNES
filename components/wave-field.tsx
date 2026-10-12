"use client"

import { useEffect, useRef } from "react"

const VERTEX_SHADER = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_motion;
uniform float u_shift;

float dither(vec2 px) {
  return fract(52.9829189 * fract(dot(px, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = u_time * u_motion;
  p += u_pointer * 0.04;

  vec2 q = p;
  q.x += sin(p.y * 1.2 + t * 0.14) * 0.12;
  q.y += sin(p.x * 0.65 + t * 0.08) * 0.04;

  vec3 col = vec3(0.008, 0.018, 0.05);

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float freq = 0.62 + fi * 0.14;
    float y = sin(q.x * freq + t * (0.1 + fi * 0.025) + fi * 1.7) * 0.16;
    y += sin(q.x * 0.28 - t * 0.06 + fi) * 0.05;
    y += (fi - 1.5) * 0.3;
    float d = q.y - y;
    float sigma = 0.115 + fi * 0.012;
    float glow = exp(-(d * d) / (sigma * sigma));
    float core = exp(-(d * d) / (sigma * sigma * 0.22));
    vec3 body = mix(vec3(0.0, 0.22, 0.62), vec3(0.12, 0.5, 0.95), fi / 3.0);
    vec3 hot = mix(vec3(0.45, 0.78, 1.0), vec3(0.82, 0.94, 1.0), fi / 3.0);
    body = mix(body, vec3(0.08, 0.4, 0.9), u_shift * 0.4);
    col += body * glow * 0.72;
    col += hot * core * 0.22;
  }

  float vig = smoothstep(1.22, 0.22, length(p * vec2(0.62, 0.9)));
  col *= mix(0.78, 1.0, vig);
  col = clamp(col, 0.0, 1.0);
  col += (dither(frag) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`

type WaveFieldProps = {
  shift: number
}

export function WaveField({ shift }: WaveFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const shiftRef = useRef(shift)

  useEffect(() => {
    shiftRef.current = shift
  }, [shift])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let stopped = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await import("three")
      if (stopped || !hostRef.current) return

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches

      const uniforms = {
        u_time: { value: reduce ? 6.5 : 0 },
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_pointer: { value: new THREE.Vector2() },
        u_motion: { value: reduce ? 0 : 1 },
        u_shift: { value: shiftRef.current },
      }

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
      renderer.toneMapping = THREE.NoToneMapping
      renderer.setClearColor(0x071422, 1)
      renderer.domElement.style.width = "100%"
      renderer.domElement.style.height = "100%"
      renderer.domElement.style.display = "block"
      host.replaceChildren(renderer.domElement)

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
      mesh.frustumCulled = false
      const scene = new THREE.Scene()
      scene.add(mesh)
      const camera = new THREE.Camera()

      const pointer = new THREE.Vector2()
      const resize = () => {
        const width = host.clientWidth || window.innerWidth
        const height = host.clientHeight || window.innerHeight
        renderer.setSize(width, height, false)
        uniforms.u_resolution.value.set(
          width * renderer.getPixelRatio(),
          height * renderer.getPixelRatio(),
        )
      }
      resize()

      const onPointer = (event: PointerEvent) => {
        pointer.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          -((event.clientY / window.innerHeight) * 2 - 1),
        )
      }
      window.addEventListener("pointermove", onPointer)
      const observer = new ResizeObserver(resize)
      observer.observe(host)

      let elapsed = uniforms.u_time.value
      let last = performance.now()
      renderer.setAnimationLoop(() => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        if (document.hidden) return
        if (!reduce) elapsed += dt
        uniforms.u_time.value = elapsed
        uniforms.u_pointer.value.lerp(pointer, 1 - Math.exp(-3.5 * dt))
        uniforms.u_shift.value +=
          (shiftRef.current - uniforms.u_shift.value) *
          (1 - Math.exp(-2.5 * dt))
        renderer.render(scene, camera)
      })

      cleanup = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener("pointermove", onPointer)
        observer.disconnect()
        material.dispose()
        mesh.geometry.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        renderer.domElement.remove()
      }
    })()

    return () => {
      stopped = true
      cleanup()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  )
}
