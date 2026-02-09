import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Fundo gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600 rounded-2xl shadow-lg transform rotate-3"></div>
        
        {/* Símbolo do logo */}
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="relative">
            {/* Círculo externo */}
            <div className="w-8 h-8 border-2 border-white rounded-full"></div>
            
            {/* Elemento central */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            
            {/* Raios de sol */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-3 bg-white rounded-full"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-12px)`,
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Brilho */}
        <div className="absolute top-1 left-1 w-4 h-4 bg-white/30 rounded-full blur-sm"></div>
      </div>

      {/* Texto do Logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent`}>
            Boleias
          </span>
          <span className="text-xs text-gray-600 font-medium tracking-wider">
            CONNECT • TRAVEL • ENJOY
          </span>
        </div>
      )}
    </div>
  );
};

// Versão simplificada para header
export const LogoCompact: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {/* Fundo gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-md"></div>
      
      {/* Símbolo simplificado */}
      <div className="absolute inset-1 flex items-center justify-center">
        <div className="w-4 h-4 bg-white rounded-full relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// Versão com texto completo
export const LogoFull: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className="h-10 w-10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600 rounded-xl shadow-lg"></div>
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Texto completo */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`${textSizes[size]} font-bold text-gray-900`}>Boleias</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
            MOZ
          </span>
        </div>
        <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
          Sua plataforma de viagens
        </span>
      </div>
    </div>
  );
};

export default Logo;