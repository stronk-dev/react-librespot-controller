import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa";
import { extractIdFromUri, getTrackDetails, getAlbumDetails, normalizeImageUrl } from "../../util/api.js";
import "./Browse.css";

const MAX_CONCURRENT = 4;

const formatDuration = (ms) => {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const BrowseArtist = ({ data, onPlayTrack, onNavigate, apiBaseUrl }) => {
  const [trackDetails, setTrackDetails] = useState({});
  const [albumDetails, setAlbumDetails] = useState({});
  const fetchingRef = useRef(new Set());
  const activeCountRef = useRef(0);
  const queueRef = useRef([]);
  const trackDetailsRef = useRef({});
  const albumDetailsRef = useRef({});
  const tracklistRef = useRef(null);
  const observerRef = useRef(null);

  const processQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const { uri, type } = queueRef.current.shift();
      const id = extractIdFromUri(uri);
      if (!id || fetchingRef.current.has(id)) continue;
      fetchingRef.current.add(id);
      activeCountRef.current++;

      const fetchFn = type === "album" ? getAlbumDetails : getTrackDetails;
      const setFn = type === "album" ? setAlbumDetails : setTrackDetails;
      const refObj = type === "album" ? albumDetailsRef : trackDetailsRef;

      fetchFn(apiBaseUrl, id).then(result => {
        if (result) {
          setFn(prev => {
            const next = { ...prev, [id]: result };
            refObj.current = next;
            return next;
          });
        }
        fetchingRef.current.delete(id);
        activeCountRef.current--;
        processQueue();
      });
    }
  }, [apiBaseUrl]);

  const enqueueFetch = useCallback((uri, type = "track") => {
    const id = extractIdFromUri(uri);
    const ref = type === "album" ? albumDetailsRef : trackDetailsRef;
    if (!id || fetchingRef.current.has(id) || ref.current[id]) return;
    queueRef.current.push({ uri, type });
    processQueue();
  }, [processQueue]);

  // Lazy-load empty top track names
  useEffect(() => {
    if (!tracklistRef.current) return;
    const needsEnrichment = data?.top_tracks?.some(t => !t.name);
    if (!needsEnrichment) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const uri = entry.target.dataset.uri;
        if (uri) enqueueFetch(uri, "track");
      });
    }, { rootMargin: "100px", threshold: 0 });

    const items = tracklistRef.current.querySelectorAll("[data-uri]");
    items.forEach(item => observerRef.current.observe(item));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [data?.top_tracks, enqueueFetch]);

  // Eagerly fetch empty album/single names (they're chips, all visible)
  useEffect(() => {
    const allAlbums = [...(data?.albums || []), ...(data?.singles || [])];
    allAlbums.forEach(album => {
      if (!album.name) enqueueFetch(album.uri, "album");
    });
  }, [data?.albums, data?.singles, enqueueFetch]);

  if (!data) return null;

  const portraitUrl = normalizeImageUrl(data.portrait_url, apiBaseUrl);

  const getAlbumName = (album) => {
    if (album.name) return album.name;
    const id = extractIdFromUri(album.uri);
    return albumDetails[id]?.name || null;
  };

  return (
    <div className="spotify-player-track-details">
      <div className="spotify-player-browse-header">
        <div className="spotify-player-browse-header-text">
          {portraitUrl && (
            <img
              src={portraitUrl}
              alt={data.name}
              className="spotify-player-browse-artist-portrait"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <h4>{data.name}</h4>
          {data.biography && (
            <div className="spotify-player-browse-subtitle">
              {data.biography.length > 150 ? data.biography.slice(0, 150) + "..." : data.biography}
            </div>
          )}
        </div>
        <button className="spotify-player-browse-play-button" onClick={() => onPlayTrack(data.uri)} title="Play">
          <FaPlay />
        </button>
      </div>

      {data.top_tracks?.length > 0 && (
        <>
          <div className="spotify-player-browse-section-title">Top Tracks</div>
          <div className="spotify-player-browse-tracklist" ref={tracklistRef}>
            {data.top_tracks.slice(0, 5).map((track, i) => {
              const trackId = extractIdFromUri(track.uri);
              const enriched = trackDetails[trackId];
              const name = track.name || enriched?.name;
              const duration = track.duration || enriched?.duration;

              return (
                <div
                  key={track.uri}
                  data-uri={!track.name ? track.uri : undefined}
                  className="spotify-player-browse-track-row"
                  onClick={() => onPlayTrack(data.uri, track.uri)}
                >
                  <span className="spotify-player-browse-track-number">{i + 1}</span>
                  <span className="spotify-player-browse-track-name">
                    {name || <span className="spotify-player-browse-track-loading">&hellip;</span>}
                  </span>
                  <span className="spotify-player-browse-track-duration">{formatDuration(duration)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {data.albums?.length > 0 && (
        <>
          <div className="spotify-player-browse-section-title">Albums</div>
          <div className="spotify-player-browse-refs-scroll">
            {data.albums.map((album) => {
              const name = getAlbumName(album);
              return name ? (
                <span
                  key={album.uri}
                  className="spotify-player-browse-ref-chip"
                  onClick={() => onNavigate({ type: "album", uri: album.uri, title: name })}
                >
                  {name}
                </span>
              ) : null;
            })}
          </div>
        </>
      )}

      {data.singles?.length > 0 && (
        <>
          <div className="spotify-player-browse-section-title">Singles</div>
          <div className="spotify-player-browse-refs-scroll">
            {data.singles.map((single) => {
              const name = getAlbumName(single);
              return name ? (
                <span
                  key={single.uri}
                  className="spotify-player-browse-ref-chip"
                  onClick={() => onNavigate({ type: "album", uri: single.uri, title: name })}
                >
                  {name}
                </span>
              ) : null;
            })}
          </div>
        </>
      )}

      {data.related?.length > 0 && (
        <>
          <div className="spotify-player-browse-section-title">Related</div>
          <div className="spotify-player-browse-refs-scroll">
            {data.related.map((artist) => (
              <span
                key={artist.uri}
                className="spotify-player-browse-ref-chip"
                onClick={() => onNavigate({ type: "artist", uri: artist.uri, title: artist.name })}
              >
                {artist.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseArtist;
