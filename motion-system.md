# Dupla Motion System

**Version:** 1.0  
**Filosofía:** Settled Warmth — suave, decisivo, funcional primero.

---

## Por qué existe este sistema

Dupla es una app financiera para parejas. El dinero genera ansiedad. La app debe transmitir calma y claridad, no espectáculo. Cada animación debe resolver un problema de UX antes de poder existir.

**Regla de existencia:** Si no podés responder "¿qué problema de UX resuelve esto?", la animación no se implementa.

---

## Estructura de archivos

```
src/motion/
├── index.js                    ← API pública — importar siempre desde aquí
├── tokens.js                   ← Duraciones, easings, escalas, distancias
├── hooks/
│   └── useMotion.js            ← Hook principal (reduced motion reactivo)
├── primitives/
│   ├── index.js                ← Barrel de primitivos
│   ├── ExpandContainer.jsx     ← Accordion (grid-template-rows)
│   ├── FadeLayer.jsx           ← Presencia por opacidad
│   ├── SlideLayer.jsx          ← Translate + opacidad
│   ├── FloatingLayer.jsx       ← Dropdowns y paneles flotantes
│   ├── MotionPressable.jsx     ← Feedback de press (scale)
│   └── TransitionSwitch.jsx    ← Cambio de tab/vista
└── utils/
    └── motionProps.js          ← Helpers puros (sin hooks) para strings CSS
```

**Keyframes CSS:** `src/index.css` (sección "Motion System v1 keyframes")

---

## Tokens

### Duraciones (`DURATIONS`)

| Key | ms | Cuándo usarlo |
|---|---|---|
| `micro` | 80 | Press feedback, focus rings, hover color |
| `fast` | 140 | Salidas — things leaving should clear quickly |
| `standard` | 200 | Accordions, dropdowns, chips, toasts |
| `slow` | 280 | Tab switches, cambio de mes |
| `expressive` | 400 | Charts, números hero, delight moments |

**Regla:** Nunca usar un valor fuera de esta tabla. Nunca hardcodear `200ms` en un componente.

### Easings (`EASINGS`)

| Key | Curva | Cuándo usarlo |
|---|---|---|
| `entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` | Todo lo que APARECE |
| `exit` | `cubic-bezier(0.4, 0, 1, 1)` | Todo lo que DESAPARECE |
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Transiciones de estado (color, borde, escala) |

**Por qué solo tres:** La consistencia de easing es más importante que la variedad. El usuario no nota los nombres de las curvas — nota si todo "suena" igual.

### Escalas (`SCALES`)

| Key | Valor | Cuándo usarlo |
|---|---|---|
| `press` | 0.97 | CTAs primarios, botón Guardar |
| `pressLight` | 0.98 | Botones secundarios, filas de lista |
| `rise` | 1.02 | Hover lift — solo desktop, no implementado en mobile |

### Distancias (`DISTANCES`)

| Key | Valor | Cuándo usarlo |
|---|---|---|
| `micro` | 4px | Micro-desplazamientos |
| `small` | 8px | SlideLayer, tab enter |
| `standard` | 12px | Paneles, drawers |
| `large` | 20px | Elementos prominentes |

---

## useMotion() — El hook central

```js
import { useMotion } from '../motion/index.js';

function MyComponent() {
  const { reduced, transition, transitions, animation, dur, ease, scales, distances, keyframes } = useMotion();

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: transition('opacity', 'standard', 'entrance'),
      }}
    />
  );
}
```

### API

| Método | Descripción | Ejemplo |
|---|---|---|
| `reduced` | `boolean` — ¿pide reduced motion? | `if (reduced) return null` |
| `transition(prop, dur, ease)` | String CSS para `transition` | `transition('opacity', 'fast', 'exit')` |
| `transitions(pairs)` | Múltiples transitions | `transitions([['opacity'], ['transform', 'standard', 'entrance']])` |
| `animation(name, dur, ease)` | String CSS para `animation`. Retorna `'none'` si `reduced` | `animation(KEYFRAMES.tabEnter, 'slow')` |
| `dur(key)` | Duración resuelta en ms | `dur('standard')` → 200 (o 80 si reduced) |
| `ease(key)` | String de easing | `ease('entrance')` |
| `scales` | Objeto SCALES | `scales.press` → 0.97 |
| `distances` | Objeto DISTANCES | `distances.small` → '8px' |
| `keyframes` | Objeto KEYFRAMES | `keyframes.tabEnter` → 'dupla-tab-enter' |

### Reduced motion

Cuando el OS tiene `prefers-reduced-motion: reduce`:
- `transition()` retorna strings con duración ≤80ms (estado cambia, sin kinética exagerada)
- `animation()` retorna `'none'` — keyframe animations completamente deshabilitadas
- `scales` sigue siendo el mismo objeto — `MotionPressable` usa `scale(1)` cuando `reduced`
- `SlideLayer` suprime el translate — solo fade

**No significa "sin feedback"** — significa "menos movimiento espacial". El usuario sigue viendo cambios de color, opacidad y borde. El feedback existe, el movimiento no.

---

## Primitivos

### ExpandContainer

Accordion animado con `grid-template-rows`.

```jsx
<ExpandContainer expanded={isEditing} duration="standard">
  <InlineEditorContent />
</ExpandContainer>
```

**Importante:** El contenido se renderiza SIEMPRE (no condicionalmente). Si renderizás con `{isEditing && <Content />}`, la animación no tiene nada que colapsar.

```jsx
// ✅ Correcto
<ExpandContainer expanded={isEditing}>
  <EditorContent />
</ExpandContainer>

// ❌ Incorrecto — el collapse no anima
{isEditing && (
  <ExpandContainer expanded={true}>
    <EditorContent />
  </ExpandContainer>
)}
```

### FadeLayer

Presencia por opacidad sin mounting/unmounting.

```jsx
<FadeLayer visible={amountNum > 0}>
  <HelperText>Tocá para escribir el monto</HelperText>
</FadeLayer>
```

### SlideLayer

Translate + opacidad. Usar para contenido con dirección espacial implícita.

```jsx
<SlideLayer visible={tab === 'home'} direction="up" distance="small">
  <TabContent />
</SlideLayer>
```

Cuando `reduced === true`, el translate se suprime. Solo la opacidad transiciona.

### FloatingLayer

Wrapper para dropdowns y paneles posicionados. Aplica `dupla-float-in` al montar.

```jsx
{showDropdown && (
  <FloatingLayer style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0 }}>
    <DropdownContent />
  </FloatingLayer>
)}
```

### MotionPressable

Press scale feedback para elementos interactivos.

```jsx
<MotionPressable as="button" scaleVariant="press" onClick={handleSubmit} style={Sx.btn}>
  Guardar gasto
</MotionPressable>
```

**Importante:** `as="button"` preserva semántica nativa. No anidar elementos interactivos dentro.

### TransitionSwitch

Anima la entrada del contenido cada vez que cambia el tab.

```jsx
<TransitionSwitch watchKey={tab}>
  {tab === 'home' && <HomeTab />}
  {tab === 'movements' && <MovimientosTab />}
</TransitionSwitch>
```

---

## Ownership — Quién puede animar qué

### Propiedades permitidas para animar

| Propiedad | ¿Compositor? | Uso |
|---|---|---|
| `transform: translateX/Y` | ✅ Sí | Slides, press, float-in |
| `transform: scale` | ✅ Sí | Press feedback |
| `opacity` | ✅ Sí | Fade, presence |
| `grid-template-rows` | ❌ Layout | Accordion (aceptado — no hay alternativa CSS pura) |
| `clip-path` | ✅ Sí | Alternativa futura a grid-template-rows |

### Propiedades PROHIBIDAS para animar

```
❌ width / height
❌ padding / margin
❌ top / left / right / bottom (usar transform en su lugar)
❌ border-width
❌ font-size
❌ background-color (en loops — una transición por interacción es OK)
```

Estas propiedades causan layout thrashing en cada frame. En mobile producen jank visible.

### Reglas parent/child

- Un componente anima solo SUS propias propiedades CSS.
- Un padre NO anima propiedades de sus hijos directamente.
- Los primitivos de motion (`ExpandContainer`, etc.) son la excepción — son wrappers cuyo único propósito es animar.

### Reglas de simultaneidad

- Máximo **2 elementos animándose** al mismo tiempo en cualquier pantalla.
- Si un accordion se está expandiendo, no lanzar el tab-enter simultáneamente.
- Los toasts entran cuando ya terminó la animación del submit button.
- Los charts se construyen solos — sin competencia perceptual con el resto.

### Zonas de densidad

| Zona | Tabs | Regla |
|---|---|---|
| **Quiet** | MasPanel, CardsTab | Sin motion. Solo transiciones de color/borde en interacción directa |
| **Active** | HomeTab, MovimientosTab, BudgetTab, SavingsTab | Micro feedback + accordions. Máximo 1 animación simultánea |
| **Expressive** | ChartsTab | Build-in animations permitidas. Máximo 2 simultáneas |

---

## Jerarquía temporal (qué tiene prioridad)

```
1. Feedback de press       (80ms)  → nunca se pospone, nunca se cancela
2. Aparición de toast      (200ms) → espera que el submit button termine su press (80ms)
3. Expand/collapse          (200ms) → puede interrumpirse con otro click
4. Tab switch              (280ms) → completa antes de renderizar nuevo contenido
5. Cambio de mes           (280ms) → completa antes de actualizar números
6. Chart build-in          (400ms) → solo si el chart está en viewport
7. Delight moments         (400ms) → solo en estado idle, nunca en capture path
```

---

## CSS Keyframes — Referencia

Definidos en `src/index.css`. Los nombres viven en `KEYFRAMES` (tokens.js).

| Constante | Nombre CSS | Shape |
|---|---|---|
| `KEYFRAMES.rise` | `dupla-rise` | opacity+translateY, legacy |
| `KEYFRAMES.pulse` | `dupla-pulse` | opacity+scale, infinite |
| `KEYFRAMES.spin` | `dupla-spin` | rotate 360°, infinite |
| `KEYFRAMES.expandIn` | `dp-expand-in` | opacity+translateY, legado |
| `KEYFRAMES.toastIn` | `dp-toast-in` | opacity+translateX+Y |
| `KEYFRAMES.tabEnter` | `dupla-tab-enter` | opacity+translateY 8px |
| `KEYFRAMES.floatIn` | `dupla-float-in` | opacity+scale(0.97)+translateY 6px |
| `KEYFRAMES.collapseOut` | `dupla-collapse-out` | opacity+scale+translateY (reverse) |

---

## Cómo agregar una nueva animación

1. **Definí el keyframe** en `src/index.css` con nombre `dupla-{nombre}`.
2. **Registrá el nombre** en `KEYFRAMES` dentro de `src/motion/tokens.js`.
3. **Usá la constante** en el componente: `animation(KEYFRAMES.tuNombre, 'standard', 'entrance')`.
4. **No hardcodees** el string del nombre en el componente.

---

## Anti-patterns

```jsx
// ❌ Duración hardcodeada
style={{ transition: 'opacity 200ms ease' }}

// ✅ Desde tokens
style={{ transition: transition('opacity', 'standard', 'entrance') }}

// ❌ Keyframe hardcodeado
style={{ animation: 'dupla-tab-enter 280ms cubic-bezier(0.16,1,0.3,1) forwards' }}

// ✅ Desde hook
style={{ animation: animation(KEYFRAMES.tabEnter, 'slow', 'entrance') }}

// ❌ Ignorar reduced motion
style={{ animation: `${KEYFRAMES.tabEnter} 280ms ...` }} // siempre anima

// ✅ Hook maneja reduced automáticamente
style={{ animation: animation(KEYFRAMES.tabEnter, 'slow') }} // 'none' si reduced

// ❌ Animar height directamente
style={{ height: isOpen ? 'auto' : 0, transition: 'height 200ms ease' }}

// ✅ ExpandContainer
<ExpandContainer expanded={isOpen}>{content}</ExpandContainer>

// ❌ Stagger masivo en listas
{items.map((item, i) => (
  <div style={{ animationDelay: `${i * 50}ms` }}>...</div>
))}

// ✅ Sin stagger — animar solo el contenedor
<FadeLayer visible={loaded}>
  {items.map(item => <div>{...}</div>)}
</FadeLayer>

// ❌ Animar en el critical path de submit
// (el usuario registra gastos 5+ veces por día — no agregar latencia aquí)
const handleSubmit = async () => {
  await animateButtonLoading(); // ← bloquea el flujo
  await save();
};

// ✅ Optimistic update + micro feedback post-facto
const handleSubmit = () => {
  save(); // fire and forget
  triggerToast(); // feedback inmediato
};
```

---

## Performance constraints

### Mobile-first

- La app tiene un target principal de teléfonos Android/iOS mid-range.
- Todas las animaciones DEBEN testearse en un dispositivo físico real antes de mergear.
- Chrome DevTools Performance tab: verificar que las animaciones corren en el compositor thread (verde) y no en el main thread (amarillo/rojo).

### fontScale + zoom

- El contenido usa `zoom: fontScale` (1 o 1.2). 
- Los valores `px` en transforms se escalan con zoom en la mayoría de browsers.
- Usar `%` o valores pequeños (≤20px) para minimizar el impacto visual del zoom en animaciones.
- Testear siempre con fontScale = 1.2 activo.

### SVG animations

- Los charts SVG son costosos de animar simultáneamente.
- Nunca animar más de un chart a la vez.
- Usar `IntersectionObserver` para activar animaciones solo cuando el chart es visible.
- Respetar `prefers-reduced-motion` estrictamente — los charts son 100% decorativos.

---

## Accesibilidad — checklist

- [ ] Todas las animaciones responden a `prefers-reduced-motion: reduce`
- [ ] `useMotion()` está en todos los componentes que animan
- [ ] `animation()` retorna `'none'` cuando `reduced === true`
- [ ] No usar `animationDelay > 400ms` (perceptualmente abandona al usuario)
- [ ] Toasts tienen `role="status" aria-live="polite"` (ya implementado en Fase 0)
- [ ] No usar color como único indicador de estado en animaciones

---

## Roadmap

Esta es la Fase 1 — fundaciones. No hay animaciones en producción todavía.

**Fase 2 (próxima):** Implementar animaciones reales por prioridad:
1. `ExpandContainer` en los 4 tabs con accordion
2. `TransitionSwitch` en el tab content switch
3. `FloatingLayer` en el UserDropdown y PaidBySelector
4. `MotionPressable` en el SubmitButton
5. Toast exit animation

**Fase 3:** Charts build-in, HeroNumber morph, BudgetBar pulse

**Fase 4:** Optimización, profiling, A/B testing de intensidad
