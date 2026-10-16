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

// Triangular dither to eliminate color banding in deep 8-bit darks
float dither(vec2 px) {
  return fract(52.9829189 * fract(dot(px, vec2(0.06711056, 0.00583715))));
}

// Dynamic undulating silk wave with traveling current
float silkWave(float x, float t, float layer) {
  // Horizontal drift gives ribbons continuous, noticeable flowing motion
  float flowX = x * (0.55 + layer * 0.12) + t * (0.38 + layer * 0.14);
  float w = sin(flowX + layer * 1.45) * (0.24 - layer * 0.03);
  w += sin(x * 1.15 - t * 0.28 + layer * 2.2) * 0.11;
  w += cos(x * 0.38 + t * 0.18 + layer * 0.8) * 0.15;
  // Dynamic response when user navigates through shelf
  w += sin(x * 1.6 + u_shift * 3.14159) * 0.045 * u_motion;
  return w;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = u_time * u_motion;

  // Fluid pointer parallax
  p += u_pointer * 0.035;

  // Diagonal flow matrix (~14 deg tilt for organic drape)
  float angle = -0.22;
  mat2 rot = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  vec2 pr = rot * p;

  // Add subtle space warp for natural liquid fluid dynamics
  pr.x += sin(pr.y * 1.4 + t * 0.22) * 0.08;
  pr.y += cos(pr.x * 0.8 + t * 0.16) * 0.05;

  // Deep obsidian base canvas (#030716)
  vec3 col = vec3(0.006, 0.014, 0.034);

  // Flowing atmospheric backlight that pulses and drifts slowly
  vec2 lightPos = vec2(-0.25 * aspect + sin(t * 0.15) * 0.08, 0.15 + cos(t * 0.12) * 0.06);
  float dLight = length(p - lightPos);
  vec3 ambientGlow = vec3(0.022, 0.075, 0.18) * exp(-dLight * 1.45);
  col += ambientGlow;

  // 4 deep, luxurious translucent silk folds with parallax speeds
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float depth = fi / 3.0; // 0.0 (deep background) to 1.0 (foreground)

    // Noticeable traveling speed per layer
    float tLayer = t * (0.42 + depth * 0.18) + u_shift * 0.45;
    float crestY = silkWave(pr.x, tLayer, fi) + (fi - 1.5) * 0.22;
    float dy = pr.y - crestY;

    // Smooth Gaussian light envelopes with silky falloff
    float broadBand = exp(-(dy * dy) / (0.05 + depth * 0.035));
    float softCore = exp(-(dy * dy) / (0.008 + depth * 0.006));
    float rimShine = exp(-abs(dy) * 22.0) * (0.35 + depth * 0.2);

    // Deep, flowing PlayStation-inspired sapphire & navy palette
    vec3 bandCol = mix(vec3(0.012, 0.055, 0.15), vec3(0.028, 0.12, 0.32), depth);
    vec3 coreCol = mix(vec3(0.035, 0.14, 0.34), vec3(0.07, 0.26, 0.62), depth);
    vec3 rimCol = mix(vec3(0.12, 0.38, 0.82), vec3(0.24, 0.62, 0.98), depth);

    // Dynamic carousel browsing accent
    bandCol = mix(bandCol, vec3(0.04, 0.18, 0.44), u_shift * 0.35);

    col += bandCol * broadBand * 0.55;
    col += coreCol * softCore * 0.32;
    col += rimCol * rimShine * 0.18;
  }

  // Text legibility mask: gently deepen the center zone where big title and tags sit
  float centerDist = length(p * vec2(0.85, 1.3));
  float textClearZone = smoothstep(0.15, 0.85, centerDist);
  col = mix(col * 0.78, col, textClearZone);

  // Soft vignette around edges for cinematic console frame
  float vig = smoothstep(1.4, 0.36, length(p * vec2(0.62, 0.88)));
  col *= mix(0.72, 1.0, vig);

  // Strict clamp to maintain calm, non-glaring deep background
  col = clamp(col, 0.0, 1.0);
  col += (dither(frag) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`

type WaveFieldProps = {
  shift: number
  paused?: boolean
  onReady?: () => void
}

export function WaveField({ shift, paused = false, onReady }: WaveFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const shiftRef = useRef(shift)
  const pausedRef = useRef(Boolean(paused))
  const onReadyRef = useRef(onReady)
  const loopControllerRef = useRef<((isPaused: boolean) => void) | null>(null)

  useEffect(() => {
    shiftRef.current = shift
  }, [shift])

  useEffect(() => {
    pausedRef.current = Boolean(paused)
    loopControllerRef.current?.(Boolean(paused))
  }, [paused])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let stopped = false
    let cleanup = () => {}
    let notified = false
    const notifyReady = () => {
      if (notified || stopped) return
      notified = true
      onReadyRef.current?.()
    }

    const frame = requestAnimationFrame(() => {
      if (stopped) return
      void (async () => {
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

      const mobileGpu = () =>
        window.matchMedia("(pointer: coarse), (max-width: 768px)").matches

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: mobileGpu() ? "low-power" : "high-performance",
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileGpu() ? 1 : 1.5))
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
      renderer.toneMapping = THREE.NoToneMapping
      renderer.setClearColor(0x020712, 1)
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
        // A layout change while a game is running must not grow this buffer back.
        if (pausedRef.current) return
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
      const attachPointer = () => {
        window.removeEventListener("pointermove", onPointer)
        window.addEventListener("pointermove", onPointer)
      }
      const detachPointer = () => {
        window.removeEventListener("pointermove", onPointer)
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)

      let elapsed = uniforms.u_time.value
      let last = performance.now()
      let wasPaused = false
      const render = () => {
        if (pausedRef.current) return
        const now = performance.now()
        if (wasPaused) {
          last = now
          wasPaused = false
        }
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
      }

      const updateLoopState = (isPaused: boolean) => {
        if (stopped) return
        if (isPaused) {
          wasPaused = true
          renderer.setAnimationLoop(null)
          detachPointer()
          renderer.domElement.style.display = "none"
          // Release the full-screen framebuffer while the emulator owns the GPU.
          renderer.setPixelRatio(1)
          renderer.setSize(1, 1, false)
        } else {
          last = performance.now()
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileGpu() ? 1 : 1.5))
          resize()
          renderer.domElement.style.display = "block"
          attachPointer()
          renderer.setAnimationLoop(render)
        }
      }

      loopControllerRef.current = updateLoopState

      renderer.render(scene, camera)
      notifyReady()

      if (!pausedRef.current) {
        attachPointer()
        renderer.setAnimationLoop(render)
      } else {
        updateLoopState(true)
      }

      cleanup = () => {
        loopControllerRef.current = null
        renderer.setAnimationLoop(null)
        detachPointer()
        observer.disconnect()
        material.dispose()
        mesh.geometry.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        renderer.domElement.remove()
      }
      })().catch(() => {
        notifyReady()
      })
    })

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
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
