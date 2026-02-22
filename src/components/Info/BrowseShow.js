import React from "react";
import { FaPlay } from "react-icons/fa";
import "./Browse.css";

const formatDuration = (ms) => {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const BrowseShow = ({ data, onPlayEpisode }) => {
  if (!data) return null;

  return (
    <div className="spotify-player-track-details">
      <div className="spotify-player-browse-header">
        <div className="spotify-player-browse-header-text">
          <h4>{data.name}</h4>
          {data.publisher && (
            <div className="spotify-player-browse-subtitle">{data.publisher}</div>
          )}
          {data.description && (
            <div className="spotify-player-browse-subtitle" style={{ marginTop: "0.3em" }}>
              {data.description.length > 200 ? data.description.slice(0, 200) + "..." : data.description}
            </div>
          )}
        </div>
        <button className="spotify-player-browse-play-button" onClick={() => onPlayEpisode(data.uri)} title="Play">
          <FaPlay />
        </button>
      </div>

      {data.episodes?.length > 0 && (
        <>
          <div className="spotify-player-browse-section-title">Episodes</div>
          <div className="spotify-player-browse-tracklist">
            {data.episodes.map((episode, i) => (
              <div
                key={episode.uri}
                className="spotify-player-browse-track-row"
                onClick={() => onPlayEpisode(episode.uri)}
              >
                <span className="spotify-player-browse-track-number">{i + 1}</span>
                <span className="spotify-player-browse-track-name">
                  {episode.name}
                  {episode.publish_date && (
                    <span className="spotify-player-browse-episode-date"> &middot; {episode.publish_date}</span>
                  )}
                </span>
                <span className="spotify-player-browse-track-duration">{formatDuration(episode.duration)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseShow;
