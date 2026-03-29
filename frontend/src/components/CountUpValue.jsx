import { useEffect, useState } from "react";

function formatNumber(value, decimals) {
  return Number(value).toFixed(decimals);
}

export default function CountUpValue({ value, decimals = 0, prefix = "", suffix = "" }) {
  const numericValue = Number(value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      return undefined;
    }

    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(numericValue * progress);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [numericValue]);

  if (!Number.isFinite(numericValue)) {
    return `${prefix}${value}${suffix}`;
  }

  return `${prefix}${formatNumber(displayValue, decimals)}${suffix}`;
}
