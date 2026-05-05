// ============================================
// DUPLA · Logo component  (brand manual v1)
//
// Isotipo: anillo donut — segmento coral superior-derecha (~1/3)
//          resto del anillo en verde, hueco transparente en el centro.
//
// Uso:
//   <DuplaLogo />                         → isotipo solo, 32px
//   <DuplaLogo size={48} />               → isotipo, custom size
//   <DuplaLogo variant="full" />          → isotipo + wordmark
//   <DuplaLogo variant="full" mono />     → versión monocromo
//   <DuplaLogo variant="full" inverted /> → para fondos oscuros
// ============================================

import React from "react";

const COLORS = {
  green:    "#0F7B5C",
  coral:    "#FF6B5B",
  charcoal: "#1A1A1A",
  white:    "#FFFFFF",
};

// ── Paths del isotipo ────────────────────────────────────────────────────────
// ViewBox 64×64, centro (32,32), outer R=28, inner R=18
// Segmento coral: 0° → 120° en sentido horario (12h → 4h), upper-right
//   12h outer: (32,4)      12h inner: (32,14)
//    4h outer: (56.25,46)   4h inner: (47.59,41)

const DONUT_GREEN =
  "M 4,32 A 28,28 0 1 1 60,32 A 28,28 0 1 1 4,32 Z " +
  "M 14,32 A 18,18 0 1 1 50,32 A 18,18 0 1 1 14,32 Z";

const DONUT_CORAL =
  "M 32,4 A 28,28 0 0 1 56.25,46 L 47.59,41 A 18,18 0 0 0 32,14 Z";

// ── Componente ───────────────────────────────────────────────────────────────
export function DuplaLogo({
  size      = 32,
  variant   = "icon",   // "icon" | "full"
  mono      = false,
  inverted  = false,
  className = "",
}) {
  const fillGreen = mono
    ? (inverted ? COLORS.white : COLORS.charcoal)
    : COLORS.green;

  const fillCoral = mono
    ? (inverted ? COLORS.white : COLORS.charcoal)
    : COLORS.coral;

  const textColor = mono
    ? (inverted ? COLORS.white : COLORS.charcoal)
    : (inverted ? COLORS.white : COLORS.green);

  // ── Isotipo solo ────────────────────────────────────────────────────────
  if (variant === "icon") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Dupla"
        className={className}
      >
        <title>Dupla</title>
        <path fillRule="evenodd" d={DONUT_GREEN} fill={fillGreen} />
        <path d={DONUT_CORAL} fill={fillCoral} />
      </svg>
    );
  }

  // ── Logo completo (isotipo + "dupla") ────────────────────────────────────
  return (
    <svg
      width={size * 3.5}
      height={size}
      viewBox="0 0 224 64"
      role="img"
      aria-label="Dupla"
      className={className}
    >
      <title>Dupla</title>
      <path fillRule="evenodd" d={DONUT_GREEN} fill={fillGreen} />
      <path d={DONUT_CORAL} fill={fillCoral} />
      <text
        x="76"
        y="44"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="36"
        fontWeight="500"
        letterSpacing="-1"
        fill={textColor}
      >
        dupla
      </text>
    </svg>
  );
}

export default DuplaLogo;
