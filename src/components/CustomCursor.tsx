import React, { useEffect, useState } from "react";
import "./CustomCursor.css";

const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Removed inline z-index assignments
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    
    const cursorInner = document.createElement('div'); 
    cursorInner.classList.add('custom-cursor-inner');
    cursorInner.style.opacity = '1';
    cursorInner.style.zIndex = '100001';

    document.body.appendChild(cursor);
    document.body.appendChild(cursorInner);

    // Set initial position to center
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);
      cursor.style.opacity = '1';
      cursorInner.style.opacity = '1';
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
      cursor.style.opacity = '1';
      cursorInner.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      cursor.style.opacity = '0';
      cursorInner.style.opacity = '0';
    };

    const handleMouseDown = () => {
      setIsClicking(true);
      cursor.classList.add('clicking');
      cursorInner.classList.add('clicking');
    };

    const handleMouseUp = () => {
      setIsClicking(false);
      cursor.classList.remove('clicking');
      cursorInner.classList.remove('clicking');
    };

    const animateCursor = () => {
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
      cursorInner.style.left = `${mouseX}px`;
      cursorInner.style.top = `${mouseY}px`;
      requestAnimationFrame(animateCursor);
    };

    const animationId = requestAnimationFrame(animateCursor);

    const interactiveElements = document.querySelectorAll(
      'button, a, .tilt-card, .feature-card, .terminal-demo, .card, [data-interactive], input, textarea, [role=\"button\"], .glass-card, .glass-panel, [data-glass], [data-glow], .glow-purple, .glow-blue'
    );

    const addHoverEffect = () => {
      setIsHovering(true);
      cursor.classList.add('hovering');
      cursorInner.classList.add('hovering');
    };

    const removeHoverEffect = () => {
      setIsHovering(false);
      cursor.classList.remove('hovering');
      cursorInner.classList.remove('hovering');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', addHoverEffect);
      el.addEventListener('mouseleave', removeHoverEffect);
    });

    // Hide system cursor
    document.body.style.cursor = 'none';
    interactiveElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.cursor = 'none';
      }
    });

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);

      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', addHoverEffect);
        el.removeEventListener('mouseleave', removeHoverEffect);
      });

      if (document.body.contains(cursor)) document.body.removeChild(cursor);
      if (document.body.contains(cursorInner)) document.body.removeChild(cursorInner);

      // Restore system cursor
      document.body.style.cursor = 'auto';
      interactiveElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.cursor = 'auto';
        }
      });
    };
  }, []);

  return null;
};

export default CustomCursor;
