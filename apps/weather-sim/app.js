'use strict';

(function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const weatherButtons = document.querySelectorAll('[data-weather]');
  const windSpeedSlider = document.getElementById('windSpeed');
  const intensitySlider = document.getElementById('intensity');
  const windValueEl = document.getElementById('windValue');
  const intensityValueEl = document.getElementById('intensityValue');

  let width, height;
  let particles = [];
  let currentWeather = 'sunny';
  let windSpeed = 5;
  let intensity = 50;
  let animationId;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = -10;
      this.speed = 2 + Math.random() * 3;
      this.size = 2 + Math.random() * 3;
      this.opacity = 0.5 + Math.random() * 0.5;
    }

    update() {
      if (currentWeather === 'rainy') {
        this.y += this.speed * 2;
        this.x += windSpeed * 0.5;
      } else if (currentWeather === 'snowy') {
        this.y += this.speed * 0.5;
        this.x += Math.sin(this.y * 0.05) * 2 + windSpeed * 0.3;
      } else if (currentWeather === 'stormy') {
        this.y += this.speed * 3;
        this.x += windSpeed + Math.random() * 10 - 5;
      }

      if (this.y > height || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.globalAlpha = this.opacity;
      
      if (currentWeather === 'rainy' || currentWeather === 'stormy') {
        ctx.strokeStyle = currentWeather === 'stormy' ? '#4a5568' : '#4299e1';
        ctx.lineWidth = this.size;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + windSpeed * 0.5, this.y + 10);
        ctx.stroke();
      } else if (currentWeather === 'snowy') {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }
  }

  function createParticles() {
    particles = [];
    const count = Math.floor(intensity * 2);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawBackground() {
    let gradient;
    
    switch (currentWeather) {
      case 'sunny':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f6ff');
        break;
      case 'rainy':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(1, '#718096');
        break;
      case 'snowy':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#cbd5e0');
        gradient.addColorStop(1, '#e2e8f0');
        break;
      case 'stormy':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a202c');
        gradient.addColorStop(1, '#2d3748');
        break;
      case 'cloudy':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#a0aec0');
        gradient.addColorStop(1, '#cbd5e0');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawSun() {
    if (currentWeather === 'sunny') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(width - 100, 100, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = width - 100 + Math.cos(angle) * 60;
        const y1 = 100 + Math.sin(angle) * 60;
        const x2 = width - 100 + Math.cos(angle) * 80;
        const y2 = 100 + Math.sin(angle) * 80;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }

  function drawLightning() {
    if (currentWeather === 'stormy' && Math.random() < 0.02) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const startX = Math.random() * width;
      let x = startX;
      let y = 0;
      ctx.moveTo(x, y);
      
      while (y < height) {
        x += (Math.random() - 0.5) * 50;
        y += 50 + Math.random() * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function animate() {
    drawBackground();
    drawSun();
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    drawLightning();
    
    animationId = requestAnimationFrame(animate);
  }

  weatherButtons.forEach(button => {
    button.addEventListener('click', () => {
      weatherButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentWeather = button.dataset.weather;
      createParticles();
    });
  });

  windSpeedSlider.addEventListener('input', (e) => {
    windSpeed = parseFloat(e.target.value);
    windValueEl.textContent = windSpeed;
  });

  intensitySlider.addEventListener('input', (e) => {
    intensity = parseFloat(e.target.value);
    intensityValueEl.textContent = intensity;
    createParticles();
  });

  window.addEventListener('resize', resize);
  function cleanup() { if (animationId) cancelAnimationFrame(animationId); }
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  resize();
  createParticles();
  weatherButtons[0].classList.add('active');
  animate();
})();
