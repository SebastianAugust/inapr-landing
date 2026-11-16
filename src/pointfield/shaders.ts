/**
 * Shader titik. Semua gerak per titik dihitung di GPU; CPU hanya mengubah uniform.
 *
 * Bintang (revolusi galaksi):
 *   rn    = |position| / uFieldRadius                       (0 di pusat, 1 di tepi)
 *   speed = uRevSpeed * (1 + uRevCore * (1 - rn)) * (1 + uRevVar * aSpin)
 *   p     = rotasiY(uTime * speed) * position + gerak halus (sinus per titik, fase aPhase)
 *   star  = uRevTilt * p                                     (kemiringan bidang putar)
 *
 * Titik bentuk (aSelect < uShapeShare) berpindah ke bentuk:
 *   target = uShapeCenter + uShapeRot * (aTarget * uShapeScale)
 *   w      = smoothstep(0, 1, clamp(uMorph * uMorphSpeed - aDelay * uDelaySpread, 0, 1))
 *   posisi = mix(star, target, w)
 * Karena `star` terus berputar, bentuk yang dilepas kembali ke bintang yang sedang bergerak.
 *
 * Interaksi pointer (stateless, fungsi jarak di ruang layar; satuan NDC, tinggi layar = 2,
 * x dikoreksi rasio aspek):
 *   dorong = arah menjauh dari kursor * uPushStrength * (1 - smoothstep(0, uPushRadius, d))² * uPointerActive
 *   riak i = arah menjauh dari pusat riak * uRippleStrength * amp * e^(-umur*uRippleDamping)
 *            * e^(-((d - umur*uRippleSpeed) / uRippleWidth)²)
 *   Titik bentuk memakai pengali uPushShape. Perpindahan NDC dikonversi ke ruang kamera
 *   (dikali kedalaman), jadi besarnya di layar sama untuk titik dekat maupun jauh.
 *
 * Ukuran titik meniru PointsMaterial (sizeAttenuation): size * pixelRatio * (scale / -z),
 * dibatasi uSizeMax (bintang yang sangat dekat kamera tidak membesar tanpa batas).
 */
export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uFieldRadius;
uniform float uRevSpeed;
uniform float uRevCore;
uniform float uRevVar;
uniform mat3 uRevTilt;
uniform float uWobble;
uniform float uWobbleSpeed;
uniform float uShapeShare;
uniform vec3 uShapeCenter;
uniform mat3 uShapeRot;
uniform float uShapeScale;
uniform float uMorph;
uniform float uMorphSpeed;
uniform float uDelaySpread;
uniform float uSize;
uniform float uSizeMax;
uniform float uScale;
uniform float uAspect;
uniform float uTanHalfFov;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uPushRadius;
uniform float uPushStrength;
uniform float uPushShape;
uniform vec4 uRipples[3];
uniform float uRippleSpeed;
uniform float uRippleStrength;
uniform float uRippleWidth;
uniform float uRippleDamping;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

attribute vec3 aTarget;
attribute float aDelay;
attribute float aPalette;
attribute float aSelect;
attribute float aSpin;
attribute float aPhase;

varying vec3 vColor;

void main() {
  float rn = clamp(length(position) / uFieldRadius, 0.0, 1.0);
  float speed = uRevSpeed * (1.0 + uRevCore * (1.0 - rn)) * (1.0 + uRevVar * aSpin);
  float a = uTime * speed;
  float c = cos(a);
  float s = sin(a);
  vec3 p = vec3(c * position.x + s * position.z, position.y, -s * position.x + c * position.z);
  float t = uTime * uWobbleSpeed;
  p += uWobble * vec3(sin(t + aPhase), sin(t * 0.83 + aPhase * 1.7), cos(t * 0.91 + aPhase * 2.3));
  vec3 star = uRevTilt * p;

  float isShape = step(aSelect, uShapeShare - 0.000001);
  float w = isShape * smoothstep(0.0, 1.0, clamp(uMorph * uMorphSpeed - aDelay * uDelaySpread, 0.0, 1.0));
  vec3 target = uShapeCenter + uShapeRot * (aTarget * uShapeScale);
  vec3 pos = mix(star, target, w);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mv;

  if (clip.w > 0.0) {
    vec2 ndc = clip.xy / clip.w;
    vec2 aspect = vec2(uAspect, 1.0);
    vec2 offset = vec2(0.0);

    vec2 diff = (ndc - uPointer) * aspect;
    float d = length(diff);
    float near = 1.0 - smoothstep(0.0, uPushRadius, d);
    offset += diff / max(d, 0.0001) * (near * near) * uPushStrength * uPointerActive;

    for (int i = 0; i < 3; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (r.w > 0.0 && age >= 0.0) {
        vec2 rd = (ndc - r.xy) * aspect;
        float dist = length(rd);
        float x = (dist - age * uRippleSpeed) / uRippleWidth;
        offset += rd / max(dist, 0.0001) * exp(-x * x) * r.w * exp(-age * uRippleDamping) * uRippleStrength;
      }
    }

    offset *= mix(1.0, uPushShape, w);
    // NDC (dikoreksi aspek) → ruang kamera: Δ = offset * kedalaman * tan(fov/2).
    mv.xy += offset * (-mv.z) * uTanHalfFov;
    clip = projectionMatrix * mv;
  }

  gl_Position = clip;
  gl_PointSize = min(uSize * (uScale / max(-mv.z, 0.001)), uSizeMax);
  vColor = aPalette < 0.5 ? uColor1 : (aPalette < 1.5 ? uColor2 : uColor3);
}
`

export const fragmentShader = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, uOpacity);
  #include <colorspace_fragment>
}
`
