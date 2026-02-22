import React from "react";
import { extractIdFromUri } from "../../util/api.js";
import "./TextInfo.css";
import "./Browse.css";

const formatDuration = (ms) => {
  if (!ms) return "N/A";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const TextInfo = ({ track, isStopped, isConnected, error, onNavigate, isPodcast, contextData }) => {
  if (isStopped || !isConnected) {
    return (
      <div className="spotify-player-track-details spotify-player-message">
        {isConnected ? "The device is currently stopped. Please load a playlist or album." : "Waiting for API connection..."}
      </div>
    );
  }

  const formatReleaseDate = (releaseDate) => {
    if (!releaseDate || !releaseDate.length) return "Unknown";
    const match = releaseDate.match(/year:\s*(\d+)?\s*month:\s*(\d+)?\s*day:\s*(\d+)?/);
    if (match) {
      const year = match[1] || "";
      const month = match[2] ? match[2].padStart(2, "0") : "";
      const day = match[3] ? match[3].padStart(2, "0") : "";
      let result = year;
      if (month) result += `-${month}`;
      if (day) result += `-${day}`;
      return result || "Unknown";
    }
    return releaseDate;
  };

  const renderArtists = () => {
    if (track?.artists?.length > 0 && onNavigate) {
      return track.artists.map((artist, i) => (
        <span key={artist.uri || i}>
          {i > 0 && ", "}
          <span
            className="spotify-player-browse-link"
            onClick={() => onNavigate({
              type: "artist",
              uri: artist.uri,
              title: artist.name,
            })}
          >
            {artist.name}
          </span>
        </span>
      ));
    }
    return track?.artist_names?.join(", ") || "N/A";
  };

  const renderAlbum = () => {
    const albumName = track?.album_name || track?.album?.name;
    const albumUri = track?.album_uri || track?.album?.uri;
    if (albumUri && onNavigate) {
      return (
        <span
          className="spotify-player-browse-link"
          onClick={() => onNavigate({
            type: "album",
            uri: albumUri,
            title: albumName,
          })}
        >
          {albumName || "N/A"}
        </span>
      );
    }
    return albumName || "N/A";
  };

  const renderShow = () => {
    const showName = track?.show?.name;
    const showUri = track?.show?.uri;
    if (showUri && onNavigate) {
      return (
        <span
          className="spotify-player-browse-link"
          onClick={() => onNavigate({
            type: "show",
            uri: showUri,
            title: showName,
          })}
        >
          {showName || "N/A"}
        </span>
      );
    }
    return showName || "N/A";
  };

  const position = isPodcast
    ? null
    : [track?.disc_number > 1 && `Disc ${track.disc_number}`, track?.track_number && `Track ${track.track_number}`]
        .filter(Boolean).join(", ") || null;

  // Context section helpers
  const renderContextSection = () => {
    if (!contextData) return null;
    const { type, uri, name, description, owner_display_name, owner_username,
            total_tracks, collaborative, num_tracks, num_discs,
            artist_names, genres } = contextData;

    const contextName = name || null;
    const owner = owner_display_name || owner_username || null;
    const trackCount = total_tracks ?? num_tracks ?? null;
    const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : null;
    const navigable = onNavigate && ["playlist", "album", "artist", "show"].includes(type);

    return (
      <div className="spotify-player-context-section">
        <div className="spotify-player-context-header">
          {label && <span className="spotify-player-context-type">{label}</span>}
          {contextName && (
            <span
              className={navigable ? "spotify-player-browse-link" : undefined}
              onClick={navigable ? () => onNavigate({ type, uri, title: contextName }) : undefined}
            >
              {contextName}
            </span>
          )}
        </div>
        <table className="spotify-player-track-details-table">
          <tbody>
            {owner && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-key-cell">By</td>
                <td className="spotify-player-track-details-cell spotify-player-value-cell">{owner}</td>
              </tr>
            )}
            {trackCount != null && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-key-cell">Tracks</td>
                <td className="spotify-player-track-details-cell spotify-player-value-cell">
                  {trackCount}{num_discs > 1 ? ` across ${num_discs} discs` : ""}
                </td>
              </tr>
            )}
            {collaborative && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-key-cell">Type</td>
                <td className="spotify-player-track-details-cell spotify-player-value-cell">Collaborative</td>
              </tr>
            )}
            {artist_names?.length > 0 && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-key-cell">
                  {artist_names.length > 1 ? "Artists" : "Artist"}
                </td>
                <td className="spotify-player-track-details-cell spotify-player-value-cell">
                  {artist_names.join(", ")}
                </td>
              </tr>
            )}
            {genres?.length > 0 && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-key-cell">Genre</td>
                <td className="spotify-player-track-details-cell spotify-player-value-cell">{genres.join(", ")}</td>
              </tr>
            )}
            {description && (
              <tr className="spotify-player-track-details-row">
                <td className="spotify-player-track-details-cell spotify-player-value-cell spotify-player-context-description" colSpan={2}>
                  {description}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="spotify-player-track-details">
      <h4>
        {track?.name || "N/A"}
        {track?.explicit && <span className="spotify-player-textinfo-explicit">E</span>}
      </h4>
      <table className="spotify-player-track-details-table">
        <tbody>
          <tr className="spotify-player-track-details-row">
            <td className="spotify-player-track-details-cell spotify-player-key-cell">
              {isPodcast ? "Show" : "Album"}
            </td>
            <td className="spotify-player-track-details-cell spotify-player-value-cell">
              {isPodcast ? renderShow() : renderAlbum()}
            </td>
          </tr>
          <tr className="spotify-player-track-details-row">
            <td className="spotify-player-track-details-cell spotify-player-key-cell">Artist</td>
            <td className="spotify-player-track-details-cell spotify-player-value-cell">{renderArtists()}</td>
          </tr>
          <tr className="spotify-player-track-details-row">
            <td className="spotify-player-track-details-cell spotify-player-key-cell">Duration</td>
            <td className="spotify-player-track-details-cell spotify-player-value-cell">{formatDuration(track?.duration)}</td>
          </tr>
          {position && (
            <tr className="spotify-player-track-details-row">
              <td className="spotify-player-track-details-cell spotify-player-key-cell">Position</td>
              <td className="spotify-player-track-details-cell spotify-player-value-cell">{position}</td>
            </tr>
          )}
          <tr className="spotify-player-track-details-row">
            <td className="spotify-player-track-details-cell spotify-player-key-cell">
              {isPodcast ? "Published" : "Released"}
            </td>
            <td className="spotify-player-track-details-cell spotify-player-value-cell">
              {track?.release_date ? formatReleaseDate(track.release_date) : (track?.publish_date || "N/A")}
            </td>
          </tr>
        </tbody>
      </table>
      {renderContextSection()}
    </div>
  );
};

export default TextInfo;
