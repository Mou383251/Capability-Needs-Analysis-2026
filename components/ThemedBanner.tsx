import React from 'react';

export const ThemedBanner: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#1A1A40]">
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <defs>
                    <filter id="fabric-texture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="turbulence"/>
                        <feDiffuseLighting in="turbulence" lightingColor="#fff" surfaceScale="1" result="diffuse">
                            <feDistantLight azimuth="45" elevation="60" />
                        </feDiffuseLighting>
                        <feComposite in="diffuse" in2="SourceAlpha" operator="in" />
                        <feBlend in="SourceGraphic" in2="SourceGraphic" mode="multiply" />
                    </filter>
                    <radialGradient id="navy-background" cx="50%" cy="50%" r="80%">
                        <stop offset="0%" stopColor="#25255a" /> 
                        <stop offset="100%" stopColor="#1A1A40" /> 
                    </radialGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#navy-background)" />
                <rect x="0" y="0" width="100%" height="100%" filter="url(#fabric-texture)" opacity="0.03" />
            </svg>
             <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A40] via-transparent to-transparent opacity-40"></div>
        </div>
    );
};