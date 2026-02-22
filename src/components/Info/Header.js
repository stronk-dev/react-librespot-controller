import React from "react";
import {
  GiCompactDisc,
  GiSpeaker,
  GiSmartphone,
  GiLaptop,
  GiGamepad,
  GiTv,
  GiRadioTower,
  GiNightSleep,
} from "react-icons/gi";
import {
  FaTabletAlt,
  FaCar,
  FaMusic,
  FaQuestionCircle,
  FaChromecast,
  FaExclamationCircle,
  FaInfoCircle,
  FaListOl,
  FaArrowLeft,
  FaCog,
} from "react-icons/fa";
import { MdWatch } from "react-icons/md";
import "./Header.css";

const deviceIcons = {
  computer: GiLaptop,
  tablet: FaTabletAlt,
  smartphone: GiSmartphone,
  speaker: GiSpeaker,
  tv: GiTv,
  avr: GiRadioTower,
  stb: FaMusic,
  audio_dongle: GiCompactDisc,
  game_console: GiGamepad,
  cast_video: FaChromecast,
  cast_audio: GiCompactDisc,
  automobile: FaCar,
  smartwatch: MdWatch,
  chromebook: GiLaptop,
  car_thing: FaCar,
  observer: FaQuestionCircle,
  home_thing: GiRadioTower,
};

const Header = ({
  isConnected,
  deviceName,
  isPlaying,
  deviceType,
  isStopped,
  activeTab,
  setActiveTab,
  navStack,
  onBack,
  sleepTimerEnd,
}) => {
  const Icon = isStopped
    ? GiNightSleep
    : deviceIcons[deviceType?.toLowerCase()] || FaQuestionCircle;

  const hasNav = navStack && navStack.length > 0;
  const hasSleepTimer = sleepTimerEnd && sleepTimerEnd > Date.now();

  return (
    <div className="spotify-player-header">
      <button
        className={`spotify-player-back-button ${hasNav ? "spotify-player-back-visible" : "spotify-player-back-hidden"}`}
        onClick={onBack}
        title="Back"
        tabIndex={hasNav ? 0 : -1}
      >
        <FaArrowLeft />
      </button>
      <div className="spotify-player-device-title">
        {isConnected ? (
          <Icon
            className={
              isPlaying
                ? "spotify-player-connected-icon spotify-player-rotating"
                : "spotify-player-connected-icon"
            }
          />
        ) : (
          <FaExclamationCircle className="spotify-player-connected-icon spotify-player-disconnected" />
        )}
        <h4>{isConnected ? deviceName : "Disconnected"}</h4>
      </div>
      <div className="spotify-player-tabs">
        <button
          className={`spotify-player-tab ${activeTab === "Info" ? "spotify-player-tab-active" : ""}`}
          onClick={() => setActiveTab("Info")}
        >
          <FaInfoCircle />
        </button>
        <button
          className={`spotify-player-tab ${activeTab === "Playlists" ? "spotify-player-tab-active" : ""}`}
          onClick={() => setActiveTab("Playlists")}
          disabled={!isConnected}
        >
          <FaMusic />
        </button>
        <button
          className={`spotify-player-tab ${activeTab === "Queue" ? "spotify-player-tab-active" : ""}`}
          onClick={() => setActiveTab("Queue")}
          disabled={!isConnected || isStopped}
        >
          <FaListOl />
        </button>
        <button
          className={`spotify-player-tab ${activeTab === "Settings" ? "spotify-player-tab-active" : ""} ${hasSleepTimer ? "spotify-player-tab-badge" : ""}`}
          onClick={() => setActiveTab("Settings")}
        >
          <FaCog />
        </button>
      </div>
    </div>
  );
};

export default Header;
