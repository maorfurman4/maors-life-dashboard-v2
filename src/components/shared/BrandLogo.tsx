interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 48, className = "" }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Smart Helix logo"
    >
      <defs>
        <radialGradient id="blBg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0e1628"/>
          <stop offset="100%" stopColor="#060911"/>
        </radialGradient>
        <radialGradient id="blBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#060911" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="blCore" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#dbeafe"/>
          <stop offset="28%" stopColor="#2563eb"/>
          <stop offset="75%" stopColor="#1e3a8a"/>
          <stop offset="100%" stopColor="#0d1b4b"/>
        </radialGradient>
        <filter id="blFGreen">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="blFCoreGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18"/>
        </filter>
        <filter id="blFNode">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="400" height="400" rx="80" fill="url(#blBg)"/>
      <circle cx="195" cy="205" r="200" fill="url(#blBgGlow)"/>

      {/* Blue strand */}
      <path d="M 95,305 C 175,375 355,255 305,95" fill="none" stroke="#1d4ed8" strokeWidth="2.5" opacity="0.45"/>

      {/* Blue nodes */}
      <circle cx="95" cy="305" r="5" fill="#1d4ed8" filter="url(#blFNode)"/>
      <circle cx="122" cy="320" r="4.5" fill="#2563eb" opacity="0.8"/>
      <circle cx="152" cy="325" r="6" fill="#3b82f6" filter="url(#blFNode)"/>
      <circle cx="218" cy="307" r="6.5" fill="#60a5fa" filter="url(#blFNode)"/>
      <circle cx="249" cy="286" r="5.5" fill="#3b82f6"/>
      <circle cx="276" cy="258" r="5" fill="#2563eb" opacity="0.85"/>
      <circle cx="310" cy="185" r="6" fill="#60a5fa" filter="url(#blFNode)"/>
      <circle cx="313" cy="142" r="4.5" fill="#2563eb" opacity="0.8"/>
      <circle cx="305" cy="95" r="5" fill="#1d4ed8" filter="url(#blFNode)"/>

      {/* Gold crossbars */}
      <line x1="78" y1="232" x2="152" y2="325" stroke="#fcd34d" strokeWidth="2" opacity="0.7"/>
      <line x1="97" y1="163" x2="218" y2="307" stroke="#fcd34d" strokeWidth="2" opacity="0.7"/>
      <line x1="145" y1="111" x2="276" y2="258" stroke="#fbbf24" strokeWidth="2" opacity="0.65"/>
      <line x1="216" y1="84" x2="310" y2="185" stroke="#fcd34d" strokeWidth="2" opacity="0.7"/>

      {/* Green strand glow + main */}
      <path d="M 95,305 C 35,185 145,40 305,95" fill="none" stroke="#10b981" strokeWidth="11" opacity="0.15" strokeLinecap="round"/>
      <path d="M 95,305 C 35,185 145,40 305,95" fill="none" stroke="#22c55e" strokeWidth="4.5" strokeLinecap="round" filter="url(#blFGreen)"/>

      {/* Core glow */}
      <circle cx="195" cy="205" r="75" fill="#2563eb" opacity="0.22" filter="url(#blFCoreGlow)"/>

      {/* Cage */}
      <g stroke="#93c5fd" strokeWidth="1.2" fill="none" opacity="0.5">
        <polygon points="195,158 235,181 235,229 195,250 155,229 155,181"/>
        <line x1="195" y1="158" x2="235" y2="229"/>
        <line x1="195" y1="158" x2="155" y2="229"/>
        <line x1="235" y1="181" x2="155" y2="229"/>
        <line x1="155" y1="181" x2="235" y2="229"/>
        <line x1="195" y1="158" x2="195" y2="250"/>
        <line x1="155" y1="181" x2="235" y2="181" opacity="0.4"/>
        <line x1="155" y1="229" x2="235" y2="229" opacity="0.4"/>
      </g>

      {/* Core sphere */}
      <circle cx="195" cy="205" r="38" fill="url(#blCore)"/>
      <circle cx="182" cy="192" r="11" fill="white" opacity="0.14"/>
      <circle cx="185" cy="195" r="5.5" fill="white" opacity="0.22"/>
    </svg>
  );
}
