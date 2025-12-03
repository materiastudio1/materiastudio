import React from 'react';

// iOS-style blurry glass button
export const GlassButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  className?: string;
  disabled?: boolean;
}> = ({ onClick, icon, label, className = "", disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center gap-1 
      transition-all active:scale-90 disabled:opacity-50
      ${className}
    `}
  >
    <div className="bg-glass backdrop-blur-md rounded-full p-3 text-white shadow-lg border border-white/10">
      {icon}
    </div>
    {label && <span className="text-xs font-medium text-white/90 drop-shadow-md">{label}</span>}
  </button>
);

export const ActionButton: React.FC<{
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary';
}> = ({ onClick, label, icon, variant = 'secondary' }) => {
  const bgColors = {
    primary: 'bg-white text-black',
    danger: 'bg-red-500/80 text-white',
    secondary: 'bg-glass text-white border border-white/10'
  };

  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-full 
        font-semibold backdrop-blur-md shadow-xl transition-transform active:scale-95
        w-full max-w-[200px]
        ${bgColors[variant]}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
