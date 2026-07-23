import { useEffect, useState } from "react";

export function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!value || value <= 0) {
      setDisplayValue(value || 0);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Clean ease-out quad curve
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.floor(startValue + (endValue - startValue) * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const handle = requestAnimationFrame(step);
    return () => cancelAnimationFrame(handle);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}
