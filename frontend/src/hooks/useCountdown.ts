import { useState, useEffect } from 'react';

export interface CountdownResult {
  formatted: string;
  isExpired: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(targetDateIso?: string | null): CountdownResult {
  const calculate = (): CountdownResult => {
    if (!targetDateIso) {
      return {
        formatted: '--',
        isExpired: false,
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const target = new Date(targetDateIso).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return {
        formatted: 'Tempo expirado',
        isExpired: true,
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
    } else {
      formatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }

    return {
      formatted,
      isExpired: false,
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
    };
  };

  const [countdown, setCountdown] = useState<CountdownResult>(calculate);

  useEffect(() => {
    setCountdown(calculate());
    const interval = setInterval(() => {
      setCountdown(calculate());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateIso]);

  return countdown;
}
