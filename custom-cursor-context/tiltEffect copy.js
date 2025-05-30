// 3D tilt effect for cards
export function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-card');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
  });

  function handleTilt(e) {
    const card = this;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    // Calculate mouse position relative to card center (in %)
    const mouseX = e.clientX - cardRect.left;
    const mouseY = e.clientY - cardRect.top;
    
    // Convert to -1 to 1 range (center is 0,0)
    const tiltX = ((mouseY / cardHeight) * 2 - 1) * -10; // Inverted for natural tilt
    const tiltY = ((mouseX / cardWidth) * 2 - 1) * 10;
    
    // Apply tilt
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;
    
    // Create shine effect
    const glare = card.querySelector('.card-glare');
    if (glare) {
      const percentX = (mouseX / cardWidth) * 100;
      const percentY = (mouseY / cardHeight) * 100;
      glare.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 80%)`;
    }
  }

  function resetTilt() {
    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    const glare = this.querySelector('.card-glare');
    if (glare) {
      glare.style.background = 'none';
    }
  }
}

// Custom cursor effect
export function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  
  const cursorInner = document.createElement('div');
  cursorInner.classList.add('custom-cursor-inner');
  
  document.body.appendChild(cursor);
  document.body.appendChild(cursorInner);
  
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    
    cursorInner.style.left = `${e.clientX}px`;
    cursorInner.style.top = `${e.clientY}px`;
  });
  
  // Interactive elements effect
  const interactiveElements = document.querySelectorAll('a, button, .tilt-card, input, textarea, [role="button"]');
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '40px';
      cursor.style.height = '40px';
      cursorInner.style.width = '4px';
      cursorInner.style.height = '4px';
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursorInner.style.width = '6px';
      cursorInner.style.height = '6px';
    });
  });
  
  // Hide system cursor
  document.body.style.cursor = 'none';
  interactiveElements.forEach(el => {
    el.style.cursor = 'none';
  });
}

// Floating particles background
export function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = '0.3';
  
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });
  
  const particles = [];
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      color: `rgba(138, 43, 226, ${Math.random() * 0.2 + 0.1})`,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3
    });
  }
  
  function drawParticles() {
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Wrap around screen
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    });
    
    requestAnimationFrame(drawParticles);
  }
  
  drawParticles();
}

// Terminal tilt effect - special effect for the terminal content
export function initTerminalTilt() {
  const terminals = document.querySelectorAll('.terminal-content');
  
  terminals.forEach(terminal => {
    const container = terminal.closest('.terminal-container');
    if (!container) return;
    
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate position relative to center (in -1 to 1 range)
      const xPos = (mouseX / rect.width - 0.5) * 2;
      const yPos = (mouseY / rect.height - 0.5) * 2;
      
      // Apply subtle movement to the terminal content
      terminal.style.transform = `translate3d(${xPos * 5}px, ${yPos * 5}px, 0)`;
      
      // Add subtle shadow effect that follows the mouse
      terminal.style.boxShadow = `${-xPos * 5}px ${-yPos * 5}px 15px rgba(0, 0, 0, 0.1) inset`;
    });
    
    container.addEventListener('mouseleave', () => {
      // Reset position when mouse leaves
      terminal.style.transform = 'translate3d(0, 0, 0)';
      terminal.style.boxShadow = 'none';
    });
  });
}
