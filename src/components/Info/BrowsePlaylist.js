import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { extractIdFromUri, getTrackDetails, normalizeImageUrl } from "../../util/api.js";
import "./Browse.css";

const MAX_CONCURRENT = 4;

const formatDuration = (ms) => {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const BrowsePlaylist = ({ data, onPlayTrack, onNavigate, apiBaseUrl }) => {
  const [trackDetails, setTrackDetails] = useState({});
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const fetchingRef = useRef(new Set());
  const activeCountRef = useRef(0);
  const queueRef = useRef([]);
  const trackDetailsRef = useRef({});

  const processQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const uri = queueRef.current.shift();
      const id = extractIdFromUri(uri);
      if (!id || fetchingRef.current.has(id)) continue;

      fetchingRef.current.add(id);
      activeCountRef.current++;

      getTrackDetails(apiBaseUrl, id).then(trackData => {
        if (trackData) {
          setTrackDetails(prev => {
            const next = { ...prev, [id]: trackData };
            trackDetailsRef.current = next;
            return next;
          });
        }
        fetchingRef.current.delete(id);
        activeCountRef.current--;
        processQueue();
      });
    }
  }, [apiBaseUrl]);

  const enqueueFetch = useCallback((uri) => {
    const id = extractIdFromUri(uri);
    if (!id || fetchingRef.current.has(id) || trackDetailsRef.current[id]) return;
    queueRef.current.push(uri);
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const uri = entry.target.dataset.uri;
        if (uri) enqueueFetch(uri);
      });
    }, { rootMargin: "100px", threshold: 0 });

    const items = containerRef.current.querySelectorAll("[data-uri]");
    items.forEach(item => observerRef.current.observe(item));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [data?.items, enqueueFetch]);

  if (!data) return null;

  return (
    <div className="spotify-player-track-details">
      <div className="spotify-player-browse-header">
        <div className="spotify-player-browse-header-text">
          <h4>{data.name}</h4>
          <div className="spotify-player-browse-subtitle">
            {data.owner_display_name || data.owner_username}
            {data.total_tracks != null && <> &middot; {data.total_tracks} tracks</>}
            {data.collaborative && <> &middot; <span className="spotify-player-browse-collab-badge">collab</span></>}
          </div>
          {data.description && (
            <div className="spotify-player-browse-subtitle" style={{ marginTop: "0.3em" }}>
              {data.description.length > 200 ? data.description.slice(0, 200) + "..." : data.description}
            </div>
          )}
        </div>
        <button className="spotify-player-browse-play-button" onClick={() => onPlayTrack(data.uri)} title="Play">
          <FaPlay />
        </button>
      </div>
      <div className="spotify-player-browse-tracklist" ref={containerRef}>
        {data.items?.map((item, i) => {
          const trackId = extractIdFromUri(item.uri);
          const track = trackDetails[trackId];
          return (
            <div
              key={item.uri}
              data-uri={item.uri}
              className="spotify-player-browse-track-row"
              onClick={() => onPlayTrack(data.uri, item.uri)}
            >
              <span className="spotify-player-browse-track-number">{i + 1}</span>
              <span className="spotify-player-browse-track-name">
                {track ? (
                  <>
                    {track.name}
                    {track.explicit && <span className="spotify-player-browse-explicit">E</span>}
                    {track.artists?.length > 0 && (
                      <span className="spotify-player-browse-track-artists">
                        {" — "}
                        {track.artists.map((artist, j) => (
                          <span key={artist.uri || j}>
                            {j > 0 && ", "}
                            <span
                              className="spotify-player-browse-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate({ type: "artist", uri: artist.uri, title: artist.name });
                              }}
                            >
                              {artist.name}
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="spotify-player-browse-track-loading">&hellip;</span>
                )}
              </span>
              <span className="spotify-player-browse-track-duration">
                {track ? formatDuration(track.duration) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowsePlaylist;
