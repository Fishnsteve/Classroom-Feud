// Since confetti is loaded from a CDN, we access it from the window object.
// We declare it as `any` to avoid TypeScript errors without needing to install types.
const confetti = (window as any).confetti;

/**
 * Shoots a burst of star-shaped particles from a specified origin point.
 * @param origin - The {x, y} coordinates for the particle burst, where 0,0 is top-left and 1,1 is bottom-right.
 */
const shoot = (origin: { x: number; y: number }) => {
    if (!confetti) {
        console.warn('Confetti library not loaded.');
        return;
    }
    confetti({
        particleCount: 70,
        spread: 80,
        origin,
        angle: 90,
        startVelocity: 40,
        decay: 0.9,
        gravity: 1.2,
        ticks: 200,
        shapes: ['star'],
        colors: ['#FFD700', '#FFCC00', '#FFFF00', '#FFFFFF', '#F0F8FF']
    });
}

/**
 * Calculates the center of an HTML element and triggers a star particle burst from that location.
 * @param element - The HTML element to use as the origin for the particles.
 */
export const shootStarsFromElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    shoot(origin);
};

/**
 * Creates a full-screen confetti rain effect for celebration.
 */
export const rainConfetti = () => {
  if (!confetti) {
      console.warn('Confetti library not loaded.');
      return;
  }
  const duration = 3 * 1000; // 3 seconds
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // Since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};