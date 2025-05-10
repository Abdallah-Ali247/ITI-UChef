import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check if theme preference exists in localStorage, otherwise use system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme class to document body
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Create falling stars animation
  const createFallingStars = () => {
    // Clean up any existing stars
    const existingStars = document.querySelectorAll('.animation-star');
    existingStars.forEach(star => star.remove());
    
    // Create stars on both sides
    const starCount = 15; // Number of stars on each side
    const sides = ['left', 'right'];
    
    sides.forEach(side => {
      for (let i = 0; i < starCount; i++) {
        // Create a star element
        const star = document.createElement('div');
        star.classList.add('animation-star', `animation-star-${side}`);
        
        // Add variety with random classes
        const size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
        const speed = `speed-${Math.floor(Math.random() * 4) + 1}`;
        const trail = `trail-${Math.floor(Math.random() * 3) + 1}`;
        
        // Make all stars golden
        star.classList.add(size, speed, trail, 'golden');
        
        // Set random vertical position
        const randomY = Math.random() * 30; // First 30% of the screen
        star.style.top = `${randomY}vh`;
        
        // Set random horizontal position based on side
        const randomX = 5 + Math.random() * 40; // 5-45%
        if (side === 'left') {
          star.style.left = `${randomX}%`;
        } else {
          star.style.right = `${randomX}%`;
        }
        
        // Add to DOM
        document.body.appendChild(star);
        
        // Remove after animation completes
        const delay = parseFloat(getComputedStyle(star).animationDuration) * 1000;
        setTimeout(() => {
          if (star.parentNode) {
            star.remove();
          }
        }, delay + 100); // Add a small buffer
      }
    });
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    // Add theme-changing class to body for animations
    document.body.classList.add('theme-changing');
    
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Create falling stars when switching to dark mode
      if (newTheme === 'dark') {
        createFallingStars();
      }
      
      return newTheme;
    });
    
    // Remove theme-changing class after animation completes
    setTimeout(() => {
      document.body.classList.remove('theme-changing');
    }, 600); // Match the animation duration
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
