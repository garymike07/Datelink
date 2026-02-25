import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'icon';
}

export const Logo = ({ className = '', variant = 'full' }: LogoProps) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src="/logo.png"
                alt="DateLink"
                className="h-8 w-auto object-contain"
            />
            {variant === 'full' && (
                <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                    DateLink
                </span>
            )}
        </div>
    );
};
