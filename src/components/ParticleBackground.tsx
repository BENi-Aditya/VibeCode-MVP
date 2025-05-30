import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  color: string;
  alpha: number;
  pulse: number;
  pulseDirection: number;
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    const particleCount = window.innerWidth < 768 ? 40 : 80;
    const connectionDistance = window.innerWidth < 768 ? 150 : 200;
    const mousePosition = { x: 0, y: 0 };
    const mouseRadius = 150;
    let isMouseMoving = false;
    let mouseTimer: NodeJS.Timeout;
    
    // Create particles with additional properties
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      color: `hsla(${260 + Math.random() * 60}, 80%, 70%, 0.2)`,
      alpha: 0.2 + Math.random() * 0.3,
      pulse: 0,
      pulseDirection: Math.random() > 0.5 ? 1 : -1
    }));

    // Handle window resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.x = e.clientX;
      mousePosition.y = e.clientY;
      
      isMouseMoving = true;
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        isMouseMoving = false;
      }, 2000);
    };
    
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize();

    // Draw connection lines between nearby particles
    function drawConnections(p1: Particle, index: number) {
      for (let j = index + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const distance = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
        );
        
        if (distance < connectionDistance) {
          const opacity = 1 - distance / connectionDistance;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(138, 43, 226, ${opacity * 0.15})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      
      // Connect to mouse if it's moving
      if (isMouseMoving) {
        const distance = Math.sqrt(
          Math.pow(p1.x - mousePosition.x, 2) + Math.pow(p1.y - mousePosition.y, 2)
        );
        
        if (distance < mouseRadius) {
          const opacity = 1 - distance / mouseRadius;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mousePosition.x, mousePosition.y);
          ctx.stroke();
          
          // Push particles away from mouse slightly
          const angle = Math.atan2(p1.y - mousePosition.y, p1.x - mousePosition.x);
          const force = (mouseRadius - distance) / mouseRadius * 0.2;
          p1.dx += Math.cos(angle) * force;
          p1.dy += Math.sin(angle) * force;
          
          // Limit max speed
          const speed = Math.sqrt(p1.dx * p1.dx + p1.dy * p1.dy);
          if (speed > 2) {
            p1.dx = (p1.dx / speed) * 2;
            p1.dy = (p1.dy / speed) * 2;
          }
        }
      }
    }

    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach((p, index) => {
        // Update position
        p.x += p.dx;
        p.y += p.dy;
        
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        
        // Ensure particles stay within bounds
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));
        
        // Add subtle pulsing effect
        p.pulse += 0.01 * p.pulseDirection;
        if (p.pulse > 1 || p.pulse < 0) {
          p.pulseDirection *= -1;
        }
        
        const radius = p.r * (1 + p.pulse * 0.3);
        const glowSize = radius * 2;
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0, 
          p.x, p.y, glowSize
        );
        gradient.addColorStop(0, p.color.replace('0.2', `${p.alpha}`));
        gradient.addColorStop(1, p.color.replace('0.2', '0'));
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('0.2', `${p.alpha}`);
        ctx.fill();
        
        // Draw connections
        drawConnections(p, index);
      });
      
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(mouseTimer);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "linear-gradient(125deg, #090512 0%, #12101f 50%, #161625 100%)"
      }} 
    />
  );
};

export default ParticleBackground;
