/**
 * Logo VistorIA — Proposta 1: Wordmark com ícone de prancheta + raio IA
 *
 * Conceito: "Engenharia + IA" — prancheta técnica com raio (lightning)
 * representando a velocidade/inteligência artificial.
 * Tipografia: Inter Bold com "IA" em destaque dourado.
 */

import type { SVGProps } from 'react';

interface LogoProps extends SVGProps<SVGSVGElement> {
  /** Cor primária do texto (default: currentColor) */
  textColor?: string;
  /** Cor do acento dourado (default: #DAA520) */
  accentColor?: string;
  /** Mostrar tagline */
  showTagline?: boolean;
}

export function LogoVistorIA1({
  textColor = 'currentColor',
  accentColor = '#DAA520',
  showTagline = false,
  ...props
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 240 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VistorIA"
      {...props}
    >
      {/* Ícone: Prancheta + raio */}
      <g transform="translate(4, 8)">
        {/* Prancheta */}
        <rect
          x="2" y="2" width="36" height="44"
          rx="4"
          fill="none"
          stroke={textColor}
          strokeWidth="2.5"
        />
        {/* Clipe topo */}
        <rect
          x="13" y="0" width="14" height="6"
          rx="1.5"
          fill={textColor}
        />
        {/* Linhas técnicas */}
        <line x1="8" y1="14" x2="22" y2="14" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="8" y1="20" x2="32" y2="20" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* Raio IA dourado */}
        <path
          d="M 22 24 L 14 36 L 20 36 L 16 44 L 30 30 L 22 30 Z"
          fill={accentColor}
          stroke={accentColor}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Wordmark "Vistor" + "IA" */}
      <text
        x="52"
        y={showTagline ? '32' : '40'}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-0.04em"
        fill={textColor}
      >
        Vistor
        <tspan fill={accentColor}>IA</tspan>
      </text>

      {showTagline && (
        <text
          x="52"
          y="48"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="9"
          fontWeight="500"
          letterSpacing="0.06em"
          fill={textColor}
          opacity="0.7"
        >
          ENGENHARIA · PRECISÃO · IA
        </text>
      )}
    </svg>
  );
}
