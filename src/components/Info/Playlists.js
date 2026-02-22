import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaMusic } from "react-icons/fa";
import { extractIdFromUri, getPlaylistDetails, normalizeImageUrl } from "../../util/api.js";
import "./Playlists.css";

const MAX_CONCURRENT = 4;
const MAX_RETRIES = 2;

const PlaylistItem = ({ playlist, isActive, onSelect, onPlay, details, apiBaseUrl }) => {
  const name = details?.name || details?.description || null;
  const image = normalizeImageUrl(details?.image_url, apiBaseUrl);
  const description = details?.description && details.description !== (details?.name || "") ? details.description : null;
  const owner = details?.owner_display_name || details?.owner_username || null;
  const trackCount = details?.total_tracks;

  return (
    <div
      className={`spotify-player-playlist-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect({ ...playlist, ...details })}
    >
      {image ? (
        <img
          src={image}
          alt={`${name} cover`}
          className="spotify-player-playlist-image"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="spotify-player-playlist-image spotify-player-playlist-placeholder">
          <FaMusic />
        </div>
      )}
      <div className="spotify-player-playlist-info">
        <h4>{name || <span className="spotify-player-playlist-loading">&hellip;</span>}</h4>
        {description && <p className="spotify-player-playlist-description">{description}</p>}
        <p className="spotify-player-playlist-meta">
          {owner && <span>{owner}</span>}
          {owner && trackCount != null && <span className="spotify-player-playlist-dot"> · </span>}
          {trackCount != null && <span>{trackCount} tracks</span>}
          {details?.collaborative && <span className="spotify-player-playlist-dot"> · collab</span>}
        </p>
      </div>
      {isActive && (
        <button
          className="spotify-player-play-button"
          onClick={(e) => { e.stopPropagation(); onPlay(playlist.uri); }}
        >
          ▶
        </button>
      )}
    </div>
  );
};

const Playlists = ({ playlists, onSelect, onPlay, onLoadMore, apiBaseUrl }) => {
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const containerRef = useRef(null);
  const fetchingRef = useRef(new Set());
  const retryCountRef = useRef({});
  const queueRef = useRef([]);
  const activeCountRef = useRef(0);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const detailsCacheRef = useRef({});

  const handleSelect = (playlist) => {
    const id = extractIdFromUri(playlist.uri);
    setActivePlaylist(id);
    onSelect(playlist);
  };

  const processQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const uri = queueRef.current.shift();
      const id = extractIdFromUri(uri);
      if (!id || fetchingRef.current.has(id)) continue;

      fetchingRef.current.add(id);
      activeCountRef.current++;

      getPlaylistDetails(apiBaseUrl, id).then(data => {
        if (data) {
          setDetailsCache(prev => {
            const next = { ...prev, [id]: data };
            detailsCacheRef.current = next;
            return next;
          });
        } else {
          retryCountRef.current[id] = (retryCountRef.current[id] || 0) + 1;
        }
        fetchingRef.current.delete(id);
        activeCountRef.current--;
        processQueue();
      });
    }
  }, [apiBaseUrl]);

  const enqueueFetch = useCallback((uri) => {
    const id = extractIdFromUri(uri);
    if (!id || fetchingRef.current.has(id)) return;
    if ((retryCountRef.current[id] || 0) >= MAX_RETRIES) return;
    queueRef.current.push(uri);
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        if (entry.target === sentinelRef.current) {
          if (onLoadMore) onLoadMore();
          return;
        }

        const uri = entry.target.dataset.uri;
        if (uri) {
          const id = extractIdFromUri(uri);
          if (!detailsCacheRef.current[id] && !fetchingRef.current.has(id)) {
            enqueueFetch(uri);
          }
        }
      });
    }, {
      root: containerRef.current,
      rootMargin: "200px",
      threshold: 0,
    });

    const items = containerRef.current.querySelectorAll("[data-uri]");
    items.forEach(item => observerRef.current.observe(item));

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [playlists, enqueueFetch, onLoadMore]);

  return (
    <div ref={containerRef} className="spotify-player-playlists-wrapper">
      {playlists?.map((playlist) => {
        const id = extractIdFromUri(playlist.uri);
        return (
          <div key={id} data-uri={playlist.uri}>
            <PlaylistItem
              playlist={playlist}
              isActive={activePlaylist === id}
              onSelect={handleSelect}
              onPlay={onPlay}
              details={detailsCache[id]}
              apiBaseUrl={apiBaseUrl}
            />
          </div>
        );
      })}
      {onLoadMore && (
        <div
          ref={sentinelRef}
          className="spotify-player-playlist-sentinel"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Playlists;
