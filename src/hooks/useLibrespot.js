// Hook to handle the connection and state for a go-librespot client.
import { useState, useEffect, useRef, useCallback } from "react";
import useWebSocket from "./useWebSocket.js";
import {
  getStatus,
  resume,
  pause,
  seek,
  play,
  previousTrack,
  nextTrack,
  setVolume,
  toggleShuffleContext,
  getRootlist,
  getQueue,
} from "../util/api.js";

const PLAYLIST_PAGE_SIZE = 50;

const useLibrespot = (websocketUrl, apiBaseUrl) => {
  const [status, setStatus] = useState(null);
  const [trackInfo, setTrack] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [queue, setQueue] = useState(null);
  const [contextUri, _setContextUri] = useState(() => {
    try { return sessionStorage.getItem("spotify_context_uri") || null; } catch { return null; }
  });
  const setContextUri = useCallback((uri) => {
    _setContextUri(uri);
    try { if (uri) sessionStorage.setItem("spotify_context_uri", uri); } catch {}
  }, []);
  const [remotePosition, setRemotePosition] = useState(0);
  const [remoteVolume, setRemoteVolume] = useState(0);
  const [maxVolume, setMaxVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [shuffleContext, setShuffleContext] = useState(false);
  const [sleepTimerEnd, setSleepTimerEnd] = useState(null);
  const sleepTimerRef = useRef(null);
  const playerRef = useRef(null);
  const playlistsRef = useRef([]);
  const playlistsTotalRef = useRef(null);
  const playlistsLoadingRef = useRef(false);

  const refetchQueue = useCallback(() => {
    getQueue(apiBaseUrl).then(data => { if (data) setQueue(data); });
  }, [apiBaseUrl]);

  const eventHandler = useCallback((event) => {
    switch (event.type) {
      case "metadata":
        setTrack(event.data);
        setRemotePosition(event.data.position || 0);
        refetchQueue();
        break;
      case "playing":
        setIsPlaying(true);
        setIsStopped(false);
        if (event.data?.context_uri) setContextUri(event.data.context_uri);
        refetchQueue();
        break;
      case "paused":
        setIsPlaying(false);
        setIsStopped(false);
        break;
      case "stopped":
      case "inactive":
        setIsStopped(true);
        setIsPlaying(false);
        break;
      case "seek":
        setRemotePosition(event.data.position);
        break;
      case "volume":
        setRemoteVolume(event.data.value);
        break;
      case "shuffle_context":
        setShuffleContext(event.data.value);
        break;
      case "queue":
        setQueue(event.data);
        break;
      case "context":
        if (event.data?.context_uri) setContextUri(event.data.context_uri);
        break;
      default:
        break;
    }
  }, [refetchQueue]);

  const { isConnected, error } = useWebSocket(websocketUrl, eventHandler);

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await getStatus(apiBaseUrl);
      if (!data) return;
      const stopped = data.stopped || !data.play_origin?.length || data.track == null;
      setStatus(data);
      setTrack(data.track);
      setRemoteVolume(data.volume);
      setMaxVolume(data.volume_steps);
      setIsPlaying(!data.paused && !stopped);
      setIsStopped(stopped);
      setShuffleContext(data.shuffle_context);
      setRemotePosition(data.track?.position || 0);
    };
    const fetchPlaylists = async () => {
      playlistsLoadingRef.current = true;
      const data = await getRootlist(apiBaseUrl, PLAYLIST_PAGE_SIZE, 0);
      playlistsLoadingRef.current = false;
      if (!data) return;
      const items = data.playlists || [];
      playlistsRef.current = items;
      playlistsTotalRef.current = data.total ?? null;
      setPlaylists(items);
    };
    const fetchQueue = async () => {
      const data = await getQueue(apiBaseUrl);
      if (data) setQueue(data);
    };
    if (isConnected) {
      fetchStatus();
      fetchPlaylists();
      fetchQueue();
    }
  }, [apiBaseUrl, isConnected]);

  const handlePlayPause = () => {
    if (!isConnected || isStopped) return;
    isPlaying ? pause(apiBaseUrl) : resume(apiBaseUrl);
  };

  const handlePrevTrack = () => {
    if (!isPlaying || isStopped) return;
    previousTrack(apiBaseUrl);
  };

  const handleNextTrack = () => {
    if (!trackInfo || isStopped) return;
    nextTrack(apiBaseUrl);
  };

  const handlePlay = (uri) => {
    play(apiBaseUrl, { uri, paused: false });
  };

  const handlePlayFromContext = (contextUriArg, skipToUri) => {
    play(apiBaseUrl, { uri: contextUriArg, skip_to_uri: skipToUri, paused: false });
  };

  const handleSeek = (event) => {
    if (!trackInfo || isStopped) return;
    const seekTo = (event.target.value / 100) * trackInfo.duration;
    seek(apiBaseUrl, Math.floor(seekTo));
  };

  const handleVolumeChange = (event) => {
    if (!isPlaying || isStopped) return;
    const newVolume = (event.target.value / 100) * maxVolume;
    setVolume(apiBaseUrl, Math.round(newVolume));
  };

  const toggleShuffle = () => {
    if (!isPlaying || isStopped) return;
    toggleShuffleContext(apiBaseUrl, !shuffleContext);
  };

  const loadMorePlaylists = useCallback(async () => {
    if (playlistsLoadingRef.current) return;
    if (playlistsTotalRef.current == null) return;
    if (playlistsRef.current.length >= playlistsTotalRef.current) return;

    playlistsLoadingRef.current = true;
    const data = await getRootlist(apiBaseUrl, PLAYLIST_PAGE_SIZE, playlistsRef.current.length);
    playlistsLoadingRef.current = false;
    if (!data || !data.playlists?.length) return;

    const merged = [...playlistsRef.current, ...data.playlists];
    playlistsRef.current = merged;
    if (data.total != null) playlistsTotalRef.current = data.total;
    setPlaylists(merged);
  }, [apiBaseUrl]);

  // Sleep timer
  const setSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (!minutes || minutes <= 0) {
      setSleepTimerEnd(null);
      return;
    }
    const end = Date.now() + minutes * 60 * 1000;
    setSleepTimerEnd(end);
    sleepTimerRef.current = setTimeout(() => {
      pause(apiBaseUrl);
      setSleepTimerEnd(null);
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
  }, [apiBaseUrl]);

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  return {
    playerRef,
    status,
    trackInfo,
    remotePosition,
    remoteVolume,
    maxVolume,
    isPlaying,
    isStopped,
    shuffleContext,
    handlePlay,
    handlePlayPause,
    handlePlayFromContext,
    handlePrevTrack,
    handleNextTrack,
    handleSeek,
    handleVolumeChange,
    toggleShuffle,
    isConnected,
    error,
    playlists,
    queue,
    contextUri,
    sleepTimerEnd,
    setSleepTimer,
    loadMorePlaylists,
    apiBaseUrl,
  };
};

export default useLibrespot;
