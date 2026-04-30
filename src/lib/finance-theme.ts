// Earthy Luxury design tokens — extracted from reference images
export const FT = {
  bg:          "#161311",
  // Semi-transparent for glassmorphism against the cinematic background
  card:        "rgba(43,34,28,0.60)",
  cardHover:   "rgba(61,46,30,0.68)",
  cardLight:   "rgba(52,40,25,0.62)",

  gold:        "#f4e28c",
  goldDim:     "rgba(244,226,140,0.12)",
  goldMid:     "rgba(244,226,140,0.22)",
  goldBorder:  "rgba(244,226,140,0.18)",
  goldGlow:    "rgba(244,226,140,0.32)",

  brown:       "#8c7555",
  brownDim:    "rgba(140,117,85,0.12)",
  brownMid:    "rgba(140,117,85,0.22)",
  brownBorder: "rgba(140,117,85,0.25)",

  danger:      "#d96b6b",
  dangerDim:   "rgba(217,107,107,0.15)",
  success:     "#7cbf8e",
  successDim:  "rgba(124,191,142,0.15)",

  textPrimary: "#ffffff",
  textSub:     "rgba(244,226,140,0.75)",
  textMuted:   "rgba(255,255,255,0.38)",
  textFaint:   "rgba(255,255,255,0.18)",
} as const;
