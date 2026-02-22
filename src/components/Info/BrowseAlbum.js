import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { extractIdFromUri, getTrackDetails } from "../../util/api.js";
import "./Browse.css";

const MAX_CONCURRENT = 4;

const formatDuration = (ms) => {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const BrowseAlbum = ({ data, onPlayTrack, onNavigate, apiBaseUrl }) => {
  const [trackDetails, setTrackDetails] = useState({});
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const fetchingRef = useRef(new Set());
  const activeCountRef = useRef(0);
  const queueRef = useRef([]);
  const trackDetailsRef = useRef({});

  // Check if tracks need enrichment (backend returned empty names)
  const needsEnrichment = data?.tracks?.some(t => !t.name);

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
    if (!needsEnrichment || !containerRef.current) return;

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
  }, [data?.tracks, enqueueFetch, needsEnrichment]);

  if (!data) return null;

  return (
    <div className="spotify-player-track-details">
      <div className="spotify-player-browse-header">
        <div className="spotify-player-browse-header-text">
          <h4>{data.name}</h4>
          <div className="spotify-player-browse-subtitle">
            {data.artists?.map((artist, i) => (
              <span key={artist.uri}>
                {i > 0 && ", "}
                <span
                  className="spotify-player-browse-link"
                  onClick={() => onNavigate({ type: "artist", uri: artist.uri, title: artist.name })}
                >
                  {artist.name}
                </span>
              </span>
            ))}
            {data.release_date && <> &middot; {data.release_date}</>}
            {data.label && <> &middot; {data.label}</>}
          </div>
        </div>
        <button className="spotify-player-browse-play-button" onClick={() => onPlayTrack(data.uri)} title="Play">
          <FaPlay />
        </button>
      </div>
      <div className="spotify-player-browse-tracklist" ref={containerRef}>
        {data.tracks?.map((track, i) => {
          const trackId = extractIdFromUri(track.uri);
          const enriched = trackDetails[trackId];
          const name = track.name || enriched?.name;
          const duration = track.duration || enriched?.duration;
          const explicit = track.explicit || enriched?.explicit;
          const trackNumber = track.track_number || enriched?.track_number || i + 1;

          return (
            <div
              key={track.uri}
              data-uri={!track.name ? track.uri : undefined}
              className="spotify-player-browse-track-row"
              onClick={() => onPlayTrack(data.uri, track.uri)}
            >
              <span className="spotify-player-browse-track-number">{trackNumber}</span>
              <span className="spotify-player-browse-track-name">
                {name ? (
                  <>
                    {name}
                    {explicit && <span className="spotify-player-browse-explicit">E</span>}
                  </>
                ) : (
                  <span className="spotify-player-browse-track-loading">&hellip;</span>
                )}
              </span>
              <span className="spotify-player-browse-track-duration">{formatDuration(duration)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseAlbum;
