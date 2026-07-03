import { useState, useRef, useEffect, ReactNode } from 'react';
import './Tooltip.css';

interface TooltipProps {
    children: ReactNode;
    content: string | ReactNode;
}

export const Tooltip = ({ children, content }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // ESCキーで閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsVisible(false);
        };
        if (isVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]);

    return (
        <span 
            className="tooltip-container"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            {children}
            {isVisible && (
                <div className="tooltip-popup" ref={tooltipRef}>
                    <div className="tooltip-arrow"></div>
                    <div className="tooltip-inner">{content}</div>
                </div>
            )}
        </span>
    );
};
