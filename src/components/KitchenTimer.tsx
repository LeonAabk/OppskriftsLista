import React, { useState, useEffect, useRef } from 'react';
import { playKitchenChime } from '../utils/sound';

interface KitchenTimerProps {
  onClose?: () => void;
  isOpen: boolean;
}

export const KitchenTimer: React.FC<KitchenTimerProps> = ({ isOpen, onClose }) => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            playKitchenChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, remainingSeconds]);

  const setTimerDuration = (minutes: number) => {
    const sec = minutes * 60;
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
    setIsFinished(false);
  };

  const togglePlayPause = () => {
    if (remainingSeconds === 0 && customMinutes > 0) {
      setTimerDuration(customMinutes);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setIsFinished(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="kitchen-timer-modal" role="dialog" aria-label="Kjøkkentimer">
      <div className="kitchen-timer-card">
        <div className="timer-header">
          <div className="timer-title-group">
            <span className="timer-icon">⏱</span>
            <h3>Kjøkkentimer</h3>
          </div>
          {onClose && (
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              aria-label="Lukk timer"
            >
              ✕
            </button>
          )}
        </div>

        <div className={`timer-display ${isFinished ? 'timer-alert' : ''}`}>
          <span className="timer-digits tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          {isFinished && (
            <p className="timer-finished-msg">Tiden er ute! 🔔</p>
          )}
        </div>

        <div className="timer-presets">
          <span className="preset-label">Hurtigvalg:</span>
          <div className="preset-buttons">
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(1)}
            >
              1 min
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(3)}
            >
              3 min
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(5)}
            >
              5 min
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(10)}
            >
              10 min
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(15)}
            >
              15 min
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setTimerDuration(30)}
            >
              30 min
            </button>
          </div>
        </div>

        <div className="custom-timer-row">
          <label htmlFor="custom-timer-input">Valgfri tid (min):</label>
          <input
            id="custom-timer-input"
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button
            type="button"
            className="btn-outline small"
            onClick={() => setTimerDuration(customMinutes)}
          >
            Start {customMinutes}m
          </button>
        </div>

        <div className="timer-actions">
          {remainingSeconds > 0 && (
            <button
              type="button"
              className={`btn-primary ${isRunning ? 'active' : ''}`}
              onClick={togglePlayPause}
            >
              {isRunning ? 'Pause' : 'Fortsett'}
            </button>
          )}
          {remainingSeconds > 0 && (
            <button
              type="button"
              className="btn-outline"
              onClick={resetTimer}
            >
              Nullstill
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
