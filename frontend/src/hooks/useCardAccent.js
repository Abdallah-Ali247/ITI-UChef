import { useState, useEffect } from 'react';

/**
 * A hook that returns a random accent class for cards
 * This helps to create visually diverse cards with different accent colors
 * @param {number} index - Optional index to ensure consistent colors for the same item
 * @returns {string} CSS class for card accent
 */
const useCardAccent = (index) => {
  const [accentClass, setAccentClass] = useState('');
  
  useEffect(() => {
    const accentClasses = [
      'card-accent-1',
      'card-accent-2',
      'card-accent-3',
      'card-accent-4',
      'card-accent-5'
    ];
    
    // If index is provided, use it to determine the accent class (for consistent colors)
    if (index !== undefined) {
      setAccentClass(accentClasses[index % accentClasses.length]);
    } else {
      // Otherwise pick a random accent
      const randomIndex = Math.floor(Math.random() * accentClasses.length);
      setAccentClass(accentClasses[randomIndex]);
    }
  }, [index]);
  
  return accentClass;
};

export default useCardAccent;
