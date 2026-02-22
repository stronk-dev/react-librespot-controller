import React from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaUndo, FaRedo } from "react-icons/fa";
import { seek } from "../../util/api.js";
import "./MediaButtons.css";

const MediaButtons = ({
  isPlaying,
  handlePlayPause,
  handleNextTrack,
  handlePreviousTrack,
  shuffleContext,
  toggleShuffle,
  isStopped,
  isConnected,
  isPodcast,
  apiBaseUrl,
}) => {
  const disabled = isStopped || !isConnected;

  const handleSkipBack = () => {
    if (disabled) return;
    seek(apiBaseUrl, -15000, true);
  };

  const handleSkipForward = () => {
    if (disabled) return;
    seek(apiBaseUrl, 30000, true);
  };

  return (
    <div className="spotify-player-playback-controls">
      {isPodcast && (
        <button onClick={handleSkipBack} className="spotify-player-control-button spotify-player-control-small" disabled={disabled} title="-15s">
          <FaUndo />
        </button>
      )}
      <button onClick={handlePreviousTrack} className="spotify-player-control-button" disabled={disabled}>
        <FaStepBackward />
      </button>
      <button onClick={handlePlayPause} className="spotify-player-control-button" disabled={disabled}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button onClick={handleNextTrack} className="spotify-player-control-button" disabled={disabled}>
        <FaStepForward />
      </button>
      {isPodcast && (
        <button onClick={handleSkipForward} className="spotify-player-control-button spotify-player-control-small" disabled={disabled} title="+30s">
          <FaRedo />
        </button>
      )}

      {!isPodcast && (
        (isStopped || !isConnected) ? (
          <div className="spotify-player-toggle-container disabled">
            <div className="spotify-player-toggle-track-text">N/A</div>
            <div className="spotify-player-toggle-thumb disabled">
              <FaRandom className="spotify-player-toggle-thumb-icon" />
            </div>
          </div>
        ) : shuffleContext ? (
          <div className="spotify-player-toggle-container on" onClick={toggleShuffle}>
            <div className="spotify-player-toggle-track-text">ON</div>
            <div className="spotify-player-toggle-thumb">
              <FaRandom className="spotify-player-toggle-thumb-icon" />
            </div>
          </div>
        ) : (
          <div className="spotify-player-toggle-container off" onClick={toggleShuffle}>
            <div className="spotify-player-toggle-thumb">
              <FaRandom className="spotify-player-toggle-thumb-icon" />
            </div>
            <div className="spotify-player-toggle-track-text">OFF</div>
          </div>
        )
      )}
    </div>
  );
};

export default MediaButtons;
