
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      const gap = 8; // Space between element and tooltip

      switch (position) {
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + gap;
          break;
        case 'top':
          top = rect.top - gap;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - gap;
          break;
      }
      setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updateCoords();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Hide tooltip on scroll or resize to prevent detachment
  useEffect(() => {
    const handleScrollOrResize = () => {
        if(isVisible) setIsVisible(false);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible]);

  return (
    <>
      <div 
        ref={triggerRef}
        className={className} 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && content && createPortal(
        <div 
            className="fixed z-[10000] px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-fade-in"
            style={{ 
                top: coords.top, 
                left: coords.left,
                transform: position === 'right' ? 'translate(0, -50%)' : 
                           position === 'left' ? 'translate(-100%, -50%)' :
                           position === 'top' ? 'translate(-50%, -100%)' :
                           'translate(-50%, 0)'
            }}
        >
            {content}
            {/* Arrow */}
            <div 
                className="absolute w-2 h-2 bg-gray-900 rotate-45"
                style={{
                    top: position === 'right' ? '50%' : position === 'left' ? '50%' : position === 'top' ? '100%' : '0',
                    left: position === 'top' ? '50%' : position === 'bottom' ? '50%' : position === 'right' ? '0' : '100%',
                    transform: 'translate(-50%, -50%)',
                    marginTop: position === 'top' ? '-4px' : position === 'bottom' ? '-1px' : '0',
                    marginLeft: position === 'right' ? '-4px' : position === 'left' ? '1px' : '0',
                }}
            />
        </div>,
        document.body
      )}
      <style>{`
        @keyframes fadeInTooltip {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeInTooltip 0.15s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Tooltip;
