// Magic UI Interactive Effects

// Add ripple effect on button clicks
function addRippleEffect(e) {
  const button = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  ripple.classList.add('ripple');
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// Add magnetic effect to buttons
function addMagneticEffect(button) {
  let boundingRect = button.getBoundingClientRect();
  
  button.addEventListener('mousemove', (e) => {
    const x = e.clientX - boundingRect.left - boundingRect.width / 2;
    const y = e.clientY - boundingRect.top - boundingRect.height / 2;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = Math.max(boundingRect.width, boundingRect.height);
    
    if (distance < maxDistance) {
      const translateX = (x / maxDistance) * 10;
      const translateY = (y / maxDistance) * 10;
      button.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.05)`;
    }
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
  });
  
  // Update bounding rect on window resize
  window.addEventListener('resize', () => {
    boundingRect = button.getBoundingClientRect();
  });
}

// Add parallax effect to backgrounds
function addParallaxEffect() {
  const backgrounds = document.querySelectorAll('body::before, body::after');
  
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    
    document.body.style.setProperty('--mouse-x', x + 'px');
    document.body.style.setProperty('--mouse-y', y + 'px');
  });
}

// Add glow effect on hover
function addGlowEffect(element) {
  element.addEventListener('mouseenter', () => {
    element.style.filter = 'drop-shadow(0 0 20px rgba(137, 180, 250, 0.5))';
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.filter = '';
  });
}

// Animate numbers
function animateNumber(element, target, duration = 1000) {
  const start = parseInt(element.textContent) || 0;
  const increment = (target - start) / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, 16);
}

// Initialize Magic UI effects
document.addEventListener('DOMContentLoaded', () => {
  // Add ripple effect to all buttons
  document.querySelectorAll('button, .icon-btn, sl-button').forEach(button => {
    button.addEventListener('click', addRippleEffect);
  });
  
  // Add magnetic effect to icon buttons
  document.querySelectorAll('.icon-btn, .mode-btn, .planner-option').forEach(button => {
    addMagneticEffect(button);
  });
  
  // Add parallax effect
  addParallaxEffect();
  
  // Add glow effect to important elements
  document.querySelectorAll('.app-title, .status-indicator, .active-count, .history-count').forEach(element => {
    addGlowEffect(element);
  });
  
  // Animate status numbers on load
  setTimeout(() => {
    const activeCount = document.getElementById('active-dialogs');
    const historyCount = document.getElementById('history-count');
    
    if (activeCount) {
      const targetActive = parseInt(activeCount.textContent);
      activeCount.textContent = '0';
      animateNumber(activeCount, targetActive, 500);
    }
    
    if (historyCount) {
      const targetHistory = parseInt(historyCount.textContent);
      historyCount.textContent = '0';
      animateNumber(historyCount, targetHistory, 800);
    }
  }, 500);
  
  // Add smooth scroll behavior
  document.querySelectorAll('.history-list, .dialog-container').forEach(container => {
    container.style.scrollBehavior = 'smooth';
  });
  
  // Add hover sound effect (optional)
  const hoverSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLaiTYIGWi77OaaURUITKXh7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+2XUxEHTKPg8L1qIwUxhdDz0H4wBiFvw/Tjk08HG2G57OmeW');
  
  // Mouse trail effect
  let mouseTrail = [];
  const trailLength = 10;
  
  document.addEventListener('mousemove', (e) => {
    mouseTrail.push({ x: e.clientX, y: e.clientY });
    if (mouseTrail.length > trailLength) {
      mouseTrail.shift();
    }
    
    // Update CSS variables for glass card blur effect
    document.querySelectorAll('.glass-card, .component-wrapper').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });
  
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe history items for fade-in
  document.querySelectorAll('.history-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'all 0.5s ease';
    observer.observe(item);
  });
  
  // Dynamic theme color based on time
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    // Morning - warmer tones
    document.documentElement.style.setProperty('--magic-primary', '#fab387');
  } else if (hour >= 12 && hour < 18) {
    // Afternoon - balanced
    document.documentElement.style.setProperty('--magic-primary', '#89b4fa');
  } else {
    // Evening/Night - cooler tones
    document.documentElement.style.setProperty('--magic-primary', '#cba6f7');
  }
});

// Export functions for use in other scripts
window.MagicUI = {
  addRippleEffect,
  addMagneticEffect,
  addGlowEffect,
  animateNumber
};