import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaPlay, FaInfoCircle } from "react-icons/fa";
import { extractIdFromUri, getTrackDetails } from "../../util/api.js";
import "./Queue.css";

const MAX_CONCURRENT = 4;

const Queue = ({ queue, trackInfo, apiBaseUrl, contextUri, onSkipTo, onNavigate }) => {
  const [enriched, setEnriched] = useState({});
  const fetchingRef = useRef(new Set());
  const activeCountRef = useRef(0);
  const fetchQueueRef = useRef([]);
  const enrichedRef = useRef({});

  const processQueue = useCallback(() => {
    while (activeCountRef.current < MAX_CONCURRENT && fetchQueueRef.current.length > 0) {
      const uri = fetchQueueRef.current.shift();
      const id = extractIdFromUri(uri);
      if (!id || fetchingRef.current.has(id)) continue;
      fetchingRef.current.add(id);
      activeCountRef.current++;
      getTrackDetails(apiBaseUrl, id).then(data => {
        if (data) {
          setEnriched(prev => {
            const next = { ...prev, [id]: data };
            enrichedRef.current = next;
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
    if (!id || fetchingRef.current.has(id) || enrichedRef.current[id]) return;
    fetchQueueRef.current.push(uri);
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (!queue) return;
    const allTracks = [...(queue.prev_tracks || []), ...(queue.next_tracks || [])];
    allTracks.forEach(track => {
      if (track.uri) enqueueFetch(track.uri);
    });
  }, [queue, enqueueFetch]);

  const getInfo = (track) => {
    const id = extractIdFromUri(track.uri);
    const details = enriched[id];
    return {
      name: track.name || details?.name || track.uri,
      albumUri: details?.album_uri || details?.album?.uri,
      albumName: details?.album_name || details?.album?.name,
      artistUri: details?.artists?.[0]?.uri,
      artistName: details?.artists?.[0]?.name || details?.artist_names?.[0],
    };
  };

  const handleSkip = (trackUri) => {
    if (onSkipTo && contextUri) {
      onSkipTo(contextUri, trackUri);
    }
  };

  const handleBrowse = (e, info) => {
    e.stopPropagation();
    if (info.albumUri && onNavigate) {
      onNavigate({ type: "album", uri: info.albumUri, title: info.albumName });
    }
  };

  if (!queue) {
    return (
      <div className="spotify-player-track-details spotify-player-message">
        No queue data available.
      </div>
    );
  }

  const { prev_tracks, next_tracks } = queue;

  return (
    <div className="spotify-player-track-details spotify-player-queue">
      <h4>Queue</h4>
      <div className="spotify-player-queue-list">
        {prev_tracks?.length > 0 && prev_tracks.map((track, i) => {
          const info = getInfo(track);
          return (
            <div
              key={`prev-${i}`}
              className="spotify-player-queue-row spotify-player-queue-prev spotify-player-queue-clickable"
              onClick={() => handleSkip(track.uri)}
            >
              <span className="spotify-player-queue-index">{i + 1 - prev_tracks.length}</span>
              <span className="spotify-player-queue-name">
                {info.name}
                {info.artistName && (
                  <span className="spotify-player-queue-artist"> - {info.artistName}</span>
                )}
              </span>
              {track.provider === "queue" && (
                <span className="spotify-player-queue-badge">queued</span>
              )}
              {info.albumUri && (
                <button
                  className="spotify-player-queue-browse"
                  onClick={(e) => handleBrowse(e, info)}
                  title={`Browse ${info.albumName || "album"}`}
                >
                  <FaInfoCircle />
                </button>
              )}
            </div>
          );
        })}

        {trackInfo && (() => {
          const currentInfo = getInfo({ uri: trackInfo.uri, name: trackInfo.name });
          return (
            <div className="spotify-player-queue-row spotify-player-queue-current">
              <span className="spotify-player-queue-index"><FaPlay /></span>
              <span className="spotify-player-queue-name">
                {trackInfo.name || trackInfo.uri}
                {currentInfo.artistName && (
                  <span className="spotify-player-queue-artist"> - {currentInfo.artistName}</span>
                )}
              </span>
              {currentInfo.albumUri && (
                <button
                  className="spotify-player-queue-browse"
                  onClick={(e) => handleBrowse(e, currentInfo)}
                  title={`Browse ${currentInfo.albumName || "album"}`}
                >
                  <FaInfoCircle />
                </button>
              )}
            </div>
          );
        })()}

        {next_tracks?.map((track, i) => {
          const info = getInfo(track);
          return (
            <div
              key={`next-${i}`}
              className="spotify-player-queue-row spotify-player-queue-clickable"
              onClick={() => handleSkip(track.uri)}
            >
              <span className="spotify-player-queue-index">{i + 1}</span>
              <span className="spotify-player-queue-name">
                {info.name}
                {info.artistName && (
                  <span className="spotify-player-queue-artist"> - {info.artistName}</span>
                )}
              </span>
              {track.provider === "queue" && (
                <span className="spotify-player-queue-badge">queued</span>
              )}
              {info.albumUri && (
                <button
                  className="spotify-player-queue-browse"
                  onClick={(e) => handleBrowse(e, info)}
                  title={`Browse ${info.albumName || "album"}`}
                >
                  <FaInfoCircle />
                </button>
              )}
            </div>
          );
        })}

        {(!next_tracks || next_tracks.length === 0) && (
          <div className="spotify-player-queue-row spotify-player-queue-empty">
            <span className="spotify-player-queue-name">No upcoming tracks</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
