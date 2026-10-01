import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  showSlogan?: boolean;
  layout?: 'horizontal' | 'vertical';
  variant?: 'light' | 'dark' | 'white';
  className?: string;
}

export const FarmaLinkLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSlogan = false,
  layout = 'horizontal',
  variant = 'light',
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 24, text: 'text-sm', tete: 'text-sm', slogan: 'text-[9px]', gap: 'gap-1.5' },
    sm: { icon: 32, text: 'text-base', tete: 'text-base', slogan: 'text-[10px]', gap: 'gap-2' },
    md: { icon: 42, text: 'text-xl', tete: 'text-xl', slogan: 'text-xs', gap: 'gap-2.5' },
    lg: { icon: 56, text: 'text-2xl', tete: 'text-2xl', slogan: 'text-sm', gap: 'gap-3' },
    xl: { icon: 72, text: 'text-3xl sm:text-4xl', tete: 'text-3xl sm:text-4xl', slogan: 'text-sm sm:text-base', gap: 'gap-3.5' },
    '2xl': { icon: 96, text: 'text-4xl sm:text-5xl', tete: 'text-4xl sm:text-5xl', slogan: 'text-base', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  // Color dynamics based on variant
  const farmaLinkColor =
    variant === 'dark' || variant === 'white'
      ? 'text-white'
      : 'text-[#0F2942]'; // Azul-escuro profissional
  const teteColor = 'text-[#059669]'; // Verde saúde/farmácia
  const sloganColor = variant === 'dark' || variant === 'white' ? 'text-slate-300' : 'text-slate-500';

  return (
    <div
      id="farmalink-logo-official"
      className={`inline-flex ${
        layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'
      } ${currentSize.gap} select-none ${className}`}
    >
      {/* 
        ========================================================================
        OFICIAL FARMALINK TETE LOGO ICON (VETOR SVG DE ALTA PRECISÃO)
        Conceitos:
        1. Pin de Localização GPS (Geolocalização em tempo real de farmácias)
        2. Círculo Verde com Cruz Médica (+) Branca no Centro (Saúde & Farmácia)
        3. Cápsula/Comprimido Inclinado Inferior Direito (Azul-Escuro e Branco)
        ========================================================================
      */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-200 hover:scale-105"
        aria-label="Logotipo Oficial FarmaLink Tete"
      >
        <defs>
          {/* Gradiente do Pin GPS - Verde Oficial Saúde & Farmácia FarmaLink Tete */}
          <linearGradient id="gpsPinGrad" x1="25" y1="12" x2="105" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Gradiente do Círculo Interno de Saúde */}
          <linearGradient id="greenCircleGrad" x1="36" y1="22" x2="94" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Gradiente da Cápsula Azul-Escuro */}
          <linearGradient id="capsuleNavyGrad" x1="72" y1="65" x2="125" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B192C" />
          </linearGradient>

          {/* Sombra Suave da Cápsula */}
          <filter id="capsuleShadow" x="65" y="60" width="70" height="70" filterUnits="userSpaceOnUse">
            <feDropShadow dx="1" dy="3" stdDeviation="3.5" floodColor="#0F2942" floodOpacity="0.35" />
          </filter>

          {/* Sombra Suave do Pin */}
          <filter id="pinShadow" x="10" y="5" width="115" height="130" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#047857" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Símbolo Principal: Pin de Localização GPS em Verde */}
        <g filter="url(#pinShadow)">
          <path
            d="M65 125 C69 120 108 81 108 51 C108 27.25 88.75 8 65 8 C41.25 8 22 27.25 22 51 C22 81 61 120 65 125 Z"
            fill="url(#gpsPinGrad)"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Iluminação suave na borda superior */}
          <path
            d="M65 12 C86.5 12 104 29.5 104 51 C104 63.5 95 85 79 104 C69 95 61 95 51 104 C35 85 26 63.5 26 51 C26 29.5 43.5 12 65 12 Z"
            fill="white"
            fillOpacity="0.12"
          />
        </g>

        {/* 2. Círculo de Saúde / Farmácia Central com Borda Branca Grossa Bem Definida */}
        <circle
          cx="65"
          cy="51"
          r="27"
          fill="url(#greenCircleGrad)"
          stroke="#FFFFFF"
          strokeWidth="6"
        />

        {/* 3. Cruz Médica (+) Branca no Centro do Círculo Verde */}
        {/* Barra Vertical da Cruz */}
        <rect
          x="59"
          y="35"
          width="12"
          height="32"
          rx="3.5"
          fill="#FFFFFF"
        />
        {/* Barra Horizontal da Cruz */}
        <rect
          x="49"
          y="45"
          width="32"
          height="12"
          rx="3.5"
          fill="#FFFFFF"
        />

        {/* 4. Cápsula / Comprimido Inclinado na Parte Inferior Direita */}
        <g transform="rotate(-38 98 94)" filter="url(#capsuleShadow)">
          {/* Base Completa da Cápsula com bordas arredondadas perfeitas */}
          <rect
            x="76"
            y="83"
            width="44"
            height="22"
            rx="11"
            fill="#FFFFFF"
            stroke="#0F2942"
            strokeWidth="2"
          />

          {/* Metade Esquerda da Cápsula: Azul-Escuro Tecnológico */}
          <path
            d="M 87 83 A 11 11 0 0 0 87 105 L 98 105 L 98 83 Z"
            fill="url(#capsuleNavyGrad)"
          />

          {/* Metade Direita da Cápsula: Branco Limpo / Saúde */}
          <path
            d="M 98 83 L 98 105 L 109 105 A 11 11 0 0 0 109 83 Z"
            fill="#FFFFFF"
          />

          {/* Divisória Central da Cápsula */}
          <line
            x1="98"
            y1="83"
            x2="98"
            y2="105"
            stroke="#0F2942"
            strokeWidth="2"
          />

          {/* Brilho / Reflexo Elegante de Luz Superior na Cápsula */}
          <rect
            x="82"
            y="85.5"
            width="32"
            height="3"
            rx="1.5"
            fill="#FFFFFF"
            fillOpacity="0.65"
          />
        </g>
      </svg>

      {/* Tipografia Oficial da Marca: FarmaLink em Azul-Escuro e Tete em Verde */}
      {showText && (
        <div className={`flex flex-col leading-tight ${layout === 'vertical' ? 'items-center' : 'items-start'}`}>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-black tracking-tight font-sans ${currentSize.text} ${farmaLinkColor}`}>
              FarmaLink
            </span>
            <span className={`font-black tracking-tight font-sans ${currentSize.tete} ${teteColor}`}>
              Tete
            </span>
          </div>

          {showSlogan && (
            <span className={`font-semibold ${sloganColor} ${currentSize.slogan} tracking-normal mt-0.5`}>
              Tecnologia & Saúde Conectadas
            </span>
          )}
        </div>
      )}
    </div>
  );
};
