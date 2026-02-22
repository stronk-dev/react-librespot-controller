import React, { useState, useEffect } from "react";
import { GiNightSleep } from "react-icons/gi";
import THEMES, { THEME_NAMES } from "../../themes/presets.js";
import "./Settings.css";

const SLEEP_PRESETS = [15, 30, 45, 60, 90];
const SWATCH_KEYS = ["--blue", "--red", "--green", "--yellow", "--magenta"];

const formatCountdown = (ms) => {
  if (!ms || ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

const Settings = ({ sleepTimerEnd, setSleepTimer, currentTheme, onThemeChange }) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!sleepTimerEnd) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const left = Math.max(0, sleepTimerEnd - Date.now());
      setRemaining(left > 0 ? left : null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  return (
    <div className="spotify-player-track-details spotify-player-settings">
      {/* Sleep Timer */}
      <div className="spotify-player-settings-section">
        <div className="spotify-player-settings-section-title">
          <GiNightSleep /> Sleep Timer
        </div>
        {remaining ? (
          <div className="spotify-player-settings-timer-active">
            <span className="spotify-player-settings-countdown">{formatCountdown(remaining)}</span>
            <button
              className="spotify-player-settings-timer-cancel"
              onClick={() => setSleepTimer(0)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="spotify-player-settings-timer-presets">
            {SLEEP_PRESETS.map((min) => (
              <button
                key={min}
                className="spotify-player-settings-timer-btn"
                onClick={() => setSleepTimer(min)}
              >
                {min}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Picker */}
      <div className="spotify-player-settings-section">
        <div className="spotify-player-settings-section-title">Theme</div>
        <div className="spotify-player-settings-theme-list">
          {THEME_NAMES.map((name) => (
            <div
              key={name}
              className={`spotify-player-settings-theme-item ${name === currentTheme ? "active" : ""}`}
              onClick={() => onThemeChange(name)}
            >
              <div className="spotify-player-settings-theme-swatches">
                {SWATCH_KEYS.map((key) => (
                  <span
                    key={key}
                    className="spotify-player-settings-theme-swatch"
                    style={{ backgroundColor: THEMES[name]?.[key] || "#888" }}
                  />
                ))}
              </div>
              <span className="spotify-player-settings-theme-name">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
