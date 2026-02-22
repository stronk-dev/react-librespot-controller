import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import useComponentSize from "../hooks/useComponentSize.js";
import useLibrespot from "../hooks/useLibrespot.js";
import { extractIdFromUri, getAlbumDetails, getArtistDetails, getShowDetails, getPlaylistDetails, normalizeImageUrl } from "../util/api.js";
import { applyTheme, getSavedTheme } from "../util/ThemeManager.js";
import AlbumCard from "./Album/AlbumCard.js";
import Header from "./Info/Header.js";
import TextInfo from "./Info/TextInfo.js";
import Playlists from "./Info/Playlists.js";
import Queue from "./Info/Queue.js";
import Settings from "./Info/Settings.js";
import BrowseAlbum from "./Info/BrowseAlbum.js";
import BrowseArtist from "./Info/BrowseArtist.js";
import BrowseShow from "./Info/BrowseShow.js";
import BrowsePlaylist from "./Info/BrowsePlaylist.js";
import SeekControls from "./Controls/SeekControls.js";
import MediaButtons from "./Controls/MediaButtons.js";
import VolumeControls from "./Controls/VolumeControls.js";
import "./MediaPlayer.css";

// Layout constraints: width breakpoints and default aspect ratios per layout.
const layouts = {
  widescreen: { minWidth: 700, aspectRatio: 2.25 },
  default: { minWidth: 450, aspectRatio: 1.45 },
  portrait: { minWidth: 0, aspectRatio: 0.72 },
};
const layoutHysteresis = 24;

const resolveAutoLayout = (currentLayout, measuredWidth, mobileWidthCutoff) => {
  if (measuredWidth <= 0) return currentLayout || "default";

  const enterMobilePortraitAt = mobileWidthCutoff - layoutHysteresis;
  const leaveMobilePortraitAt = mobileWidthCutoff + layoutHysteresis;
  const shouldForcePortrait = measuredWidth <= enterMobilePortraitAt;
  if (shouldForcePortrait) return "portrait";
  if (currentLayout === "portrait" && measuredWidth < leaveMobilePortraitAt) {
    return "portrait";
  }

  if (currentLayout === "widescreen") {
    if (measuredWidth < layouts.widescreen.minWidth - layoutHysteresis) {
      return measuredWidth >= layouts.default.minWidth ? "default" : "portrait";
    }
    return "widescreen";
  }

  if (currentLayout === "portrait") {
    if (measuredWidth >= layouts.widescreen.minWidth + layoutHysteresis) {
      return "widescreen";
    }
    if (measuredWidth >= layouts.default.minWidth + layoutHysteresis) {
      return "default";
    }
    return "portrait";
  }

  if (measuredWidth >= layouts.widescreen.minWidth + layoutHysteresis) {
    return "widescreen";
  }
  if (measuredWidth < layouts.default.minWidth - layoutHysteresis) {
    return "portrait";
  }
  return "default";
};

const defaultWebsocketUrl = process.env.REACT_APP_WS_URL || "ws://localhost:3678/events";
const defaultApiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:3678";
const defaultKioskMode = (process.env.REACT_APP_KIOSK_MODE || "").toLowerCase() === "true";
const defaultHideOnDisconnect = (process.env.REACT_APP_HIDE_ON_DISCONNECT || "").toLowerCase() === "true";
const defaultLayout = process.env.REACT_APP_LAYOUT || "auto";
const defaultMaxHeight = process.env.REACT_APP_MAX_HEIGHT || "100vh";
const defaultPanelMaxHeight = process.env.REACT_APP_PANEL_MAX_HEIGHT || "60vh";
const defaultMobileBreakpoint = Number(process.env.REACT_APP_MOBILE_BREAKPOINT) || 768;

const MediaPlayer = ({
  websocketUrl = defaultWebsocketUrl,
  apiBaseUrl = defaultApiBaseUrl,
  kioskMode = defaultKioskMode || false,
  hideOnDisconnect = defaultHideOnDisconnect || false,
  layout = defaultLayout,
  maxHeight = defaultMaxHeight,
  panelMaxHeight = defaultPanelMaxHeight,
  mobileBreakpoint = defaultMobileBreakpoint,
  theme: themeProp,
}) => {
  const {
    playerRef,
    status,
    trackInfo,
    remotePosition,
    remoteVolume,
    maxVolume,
    isPlaying,
    isStopped,
    shuffleContext,
    handlePlayPause,
    handlePlay,
    handlePlayFromContext,
    handlePrevTrack,
    handleNextTrack,
    handleSeek,
    handleVolumeChange,
    toggleShuffle,
    isConnected,
    error,
    playlists,
    loadMorePlaylists,
    queue,
    contextUri,
    sleepTimerEnd,
    setSleepTimer,
  } = useLibrespot(websocketUrl, apiBaseUrl);

  const { width, height } = useComponentSize(playerRef);
  const [activeTab, setActiveTab] = useState("Info");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [navStack, setNavStack] = useState([]);
  const [browseData, setBrowseData] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(themeProp || getSavedTheme());
  const [autoLayout, setAutoLayout] = useState(() => {
    if (typeof window === "undefined") return "default";
    const w = window.innerWidth;
    if (w <= defaultMobileBreakpoint) return "portrait";
    if (w >= layouts.widescreen.minWidth) return "widescreen";
    return "default";
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Sync external theme prop
  useEffect(() => {
    if (themeProp) setCurrentTheme(themeProp);
  }, [themeProp]);

  // Navigation stack
  const pushNav = useCallback((entry) => {
    setNavStack(prev => [...prev, entry]);
  }, []);

  const popNav = useCallback(() => {
    setNavStack(prev => prev.slice(0, -1));
    setBrowseData(null);
  }, []);

  const currentNav = navStack[navStack.length - 1] || null;

  // Fetch browse data when nav changes
  useEffect(() => {
    if (!currentNav) {
      setBrowseData(null);
      return;
    }
    const id = extractIdFromUri(currentNav.uri);
    if (!id) return;
    setBrowseLoading(true);
    setBrowseData(null);

    let cancelled = false;
    const fetchData = async () => {
      let data = null;
      switch (currentNav.type) {
        case "album":
          data = await getAlbumDetails(apiBaseUrl, id);
          break;
        case "artist":
          data = await getArtistDetails(apiBaseUrl, id);
          break;
        case "show":
          data = await getShowDetails(apiBaseUrl, id);
          break;
        case "playlist":
          data = await getPlaylistDetails(apiBaseUrl, id);
          break;
        default:
          break;
      }
      if (!cancelled) {
        setBrowseData(data);
        setBrowseLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [currentNav, apiBaseUrl]);

  useEffect(() => {
    if (!isConnected) {
      setSelectedPlaylist(null);
      setActiveTab("Info");
      setNavStack([]);
    } else if (isStopped) {
      setActiveTab("Playlists");
    }
  }, [isConnected, isStopped]);

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    pushNav({ type: "playlist", uri: playlist.uri, title: playlist.name });
  };

  const handlePlayPlaylist = (uri) => {
    handlePlay(uri);
  };

  const handleTabSwitch = (newVal) => {
    if (newVal !== "Playlists") {
      setSelectedPlaylist(null);
    }
    setNavStack([]);
    setActiveTab(newVal);
  };

  const handleAlbumCardClick = useCallback(() => {
    if (currentNav) return; // already browsing
    if (!trackInfo) return;
    const isPod = trackInfo.uri?.startsWith("spotify:episode:");
    if (isPod && trackInfo.show?.uri) {
      pushNav({ type: "show", uri: trackInfo.show.uri, title: trackInfo.show.name });
    } else if (trackInfo.album_uri || trackInfo.album?.uri) {
      pushNav({
        type: "album",
        uri: trackInfo.album_uri || trackInfo.album.uri,
        title: trackInfo.album_name || trackInfo.album?.name,
      });
    }
  }, [currentNav, trackInfo, pushNav]);

  // Fetch full context details when contextUri changes
  useEffect(() => {
    if (!contextUri) {
      setContextData(null);
      return;
    }
    const parts = contextUri.split(":");
    const type = parts.length >= 2 ? parts[1] : null;
    const id = extractIdFromUri(contextUri);
    if (!id || !type) return;

    let cancelled = false;
    const fetchContext = async () => {
      let data = null;
      switch (type) {
        case "playlist":
          data = await getPlaylistDetails(apiBaseUrl, id, 1, 0);
          break;
        case "album":
          data = await getAlbumDetails(apiBaseUrl, id);
          break;
        case "artist":
          data = await getArtistDetails(apiBaseUrl, id);
          break;
        case "show":
          data = await getShowDetails(apiBaseUrl, id);
          break;
        default:
          break;
      }
      if (!cancelled && data) {
        setContextData({ ...data, type, uri: contextUri });
      }
    };
    fetchContext();
    return () => { cancelled = true; };
  }, [contextUri, apiBaseUrl]);

  if (hideOnDisconnect && !isConnected) {
    return null;
  }

  // Determine album card image: browse view > selected playlist > current track
  let albumTitle, albumSubtitle, albumImage;
  if (currentNav && browseData) {
    albumTitle = browseData.name || currentNav.title;
    albumSubtitle = currentNav.type;
    albumImage = normalizeImageUrl(browseData.cover_url || browseData.portrait_url || browseData.album_cover_url || browseData.image_url || null, apiBaseUrl);
  } else if (selectedPlaylist && activeTab === "Playlists") {
    albumTitle = selectedPlaylist.name;
    albumSubtitle = selectedPlaylist.owner_display_name || selectedPlaylist.owner_username || "";
    albumImage = normalizeImageUrl(selectedPlaylist.image_url || null, apiBaseUrl);
  } else {
    albumTitle = trackInfo?.name || null;
    albumSubtitle = trackInfo?.artist_names?.join(", ") || null;
    albumImage = normalizeImageUrl(trackInfo?.album_cover_url || null, apiBaseUrl);
  }

  // Auto-detect kiosk: if the parent container fills the viewport, behave as kiosk.
  // Uses parent height (not self) to avoid circular dependency with computed inline height.
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : width;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : height;
  const parentHeight = playerRef.current?.parentElement?.clientHeight || 0;

  const widthCheck = width >= viewportWidth * 0.9;
  const heightCheck = parentHeight >= viewportHeight * 0.85;
  const isKiosk = kioskMode || (
    playerRef.current &&
    viewportWidth > 0 &&
    viewportHeight > 0 &&
    widthCheck &&
    heightCheck
  );


  const mobileWidthCutoff = Number.isFinite(mobileBreakpoint) ? mobileBreakpoint : 768;
  const isValidLayout = layout === "auto" || Object.prototype.hasOwnProperty.call(layouts, layout);
  let effectiveLayout = isValidLayout ? layout : "auto";

  // In kiosk mode, pick layout by viewport aspect ratio instead of width breakpoints.
  // This avoids the mobileBreakpoint/widescreen overlap that makes "default" unreachable.
  const kioskLayout = (() => {
    if (!isKiosk || viewportWidth <= 0 || viewportHeight <= 0) return null;
    const ratio = viewportWidth / viewportHeight;
    if (ratio >= 1.8) return "widescreen";
    if (ratio < 0.85) return "portrait";
    return "default";
  })();

  useEffect(() => {
    if (effectiveLayout !== "auto") return;
    if (kioskLayout) return;
    const nextAutoLayout = resolveAutoLayout(autoLayout, width, mobileWidthCutoff);
    if (nextAutoLayout !== autoLayout) {
      setAutoLayout(nextAutoLayout);
    }
  }, [effectiveLayout, autoLayout, width, mobileWidthCutoff, kioskLayout]);

  let playerClass = "spotify-player-spotify-card";
  if (effectiveLayout === "auto") {
    effectiveLayout = kioskLayout || resolveAutoLayout(autoLayout, width, mobileWidthCutoff);
  }
  if (effectiveLayout === "default") {
    playerClass += " spotify-player-default-layout";
  } else if (effectiveLayout === "widescreen") {
    playerClass += " spotify-player-widescreen-layout";
  } else if (effectiveLayout === "portrait") {
    playerClass += " spotify-player-portrait-layout";
  }
  if (isKiosk) {
    playerClass += " kiosk";
  }
  const layoutAspectRatio = layouts[effectiveLayout]?.aspectRatio || layouts.default.aspectRatio;

  const isPodcast = trackInfo?.uri?.startsWith("spotify:episode:");

  const renderContent = () => {
    if (currentNav) {
      if (browseLoading) {
        return (
          <div className="spotify-player-track-details spotify-player-message">
            Loading...
          </div>
        );
      }
      if (!browseData) {
        return (
          <div className="spotify-player-track-details spotify-player-message">
            Failed to load content.
          </div>
        );
      }
      switch (currentNav.type) {
        case "album":
          return <BrowseAlbum data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        case "artist":
          return <BrowseArtist data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        case "show":
          return <BrowseShow data={browseData} onPlayEpisode={handlePlay} onNavigate={pushNav} />;
        case "playlist":
          return <BrowsePlaylist data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        default:
          return null;
      }
    }

    switch (activeTab) {
      case "Info":
        return (
          <TextInfo
            track={trackInfo}
            isStopped={isStopped}
            isConnected={isConnected}
            error={error}
            onNavigate={pushNav}
            isPodcast={isPodcast}
            contextData={contextData}
          />
        );
      case "Playlists":
        return (
          <Playlists
            playlists={playlists}
            onSelect={handleSelectPlaylist}
            onPlay={handlePlayPlaylist}
            onLoadMore={loadMorePlaylists}
            apiBaseUrl={apiBaseUrl}
          />
        );
      case "Queue":
        return (
          <Queue
            queue={queue}
            trackInfo={trackInfo}
            apiBaseUrl={apiBaseUrl}
            contextData={contextData}
            onSkipTo={handlePlayFromContext}
            onNavigate={pushNav}
          />
        );
      case "Settings":
        return (
          <Settings
            sleepTimerEnd={sleepTimerEnd}
            setSleepTimer={setSleepTimer}
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
        );
      default:
        return null;
    }
  };

  // Master column: always shows tab content, ignores navigation
  const renderMasterContent = () => {
    switch (activeTab) {
      case "Info":
        return (
          <TextInfo
            track={trackInfo}
            isStopped={isStopped}
            isConnected={isConnected}
            error={error}
            onNavigate={pushNav}
            isPodcast={isPodcast}
            contextData={contextData}
          />
        );
      case "Playlists":
        return (
          <Playlists
            playlists={playlists}
            onSelect={handleSelectPlaylist}
            onPlay={handlePlayPlaylist}
            onLoadMore={loadMorePlaylists}
            apiBaseUrl={apiBaseUrl}
          />
        );
      case "Queue":
        return (
          <Queue
            queue={queue}
            trackInfo={trackInfo}
            apiBaseUrl={apiBaseUrl}
            contextData={contextData}
            onSkipTo={handlePlayFromContext}
            onNavigate={pushNav}
          />
        );
      case "Settings":
        return (
          <Settings
            sleepTimerEnd={sleepTimerEnd}
            setSleepTimer={setSleepTimer}
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
        );
      default:
        return null;
    }
  };

  // Detail column: browse views when navigating, AlbumCard otherwise
  const renderDetailContent = () => {
    if (currentNav) {
      if (browseLoading) {
        return (
          <div className="spotify-player-track-details spotify-player-message">
            Loading...
          </div>
        );
      }
      if (!browseData) {
        return (
          <div className="spotify-player-track-details spotify-player-message">
            Failed to load content.
          </div>
        );
      }
      switch (currentNav.type) {
        case "album":
          return <BrowseAlbum data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        case "artist":
          return <BrowseArtist data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        case "show":
          return <BrowseShow data={browseData} onPlayEpisode={handlePlay} onNavigate={pushNav} />;
        case "playlist":
          return <BrowsePlaylist data={browseData} onPlayTrack={handlePlayFromContext} onNavigate={pushNav} apiBaseUrl={apiBaseUrl} />;
        default:
          return null;
      }
    }
    return <AlbumCard {...albumCardProps} />;
  };

  const headerProps = {
    isConnected,
    deviceName: status?.device_name,
    deviceType: status?.device_type,
    isPlaying,
    isStopped,
    activeTab,
    setActiveTab: handleTabSwitch,
    navStack,
    onBack: popNav,
    sleepTimerEnd,
  };

  const seekProps = {
    duration: trackInfo?.duration || 100,
    remotePosition: remotePosition || 100,
    handleSeek,
    isStopped,
    isConnected,
    isPlaying,
  };

  const mediaProps = {
    isPlaying,
    handlePlayPause,
    handleNextTrack,
    handlePreviousTrack: handlePrevTrack,
    shuffleContext,
    toggleShuffle,
    isStopped,
    isConnected,
    isPodcast,
    apiBaseUrl,
  };

  const volumeProps = {
    remoteVolume,
    maxVolume,
    handleVolumeChange,
    isStopped,
    isConnected,
  };

  const albumCardProps = {
    title: albumTitle,
    subtitle: albumSubtitle,
    image: albumImage,
    isStopped: isStopped || !albumImage || !albumImage?.length,
    isConnected,
    onClick: (!isStopped && isConnected) ? handleAlbumCardClick : undefined,
  };

  const computedHeight = width > 0 && !isKiosk
    ? `${Math.round(width / layoutAspectRatio)}px`
    : isKiosk
      ? "100%"
      : undefined;

  const playerStyle = {
    "--spotify-player-max-height": isKiosk ? undefined : maxHeight,
    "--spotify-player-aspect-ratio": isKiosk ? "auto" : String(layoutAspectRatio),
    "--spotify-player-panel-max-height": panelMaxHeight,
    height: computedHeight,
  };

  return (
    <div ref={playerRef} className={playerClass} style={playerStyle}>
      {effectiveLayout === "portrait" ? (
        <>
          <Header {...headerProps} />
          <div className="spotify-player-info-container">
            <div className="spotify-player-portrait-main">
              {activeTab === "Info" && !currentNav && !isStopped && isConnected && (
                <div className="spotify-player-portrait-album">
                  <AlbumCard {...albumCardProps} />
                </div>
              )}
              {renderContent()}
            </div>
            <SeekControls {...seekProps} />
            <MediaButtons {...mediaProps} />
            <VolumeControls {...volumeProps} />
          </div>
        </>
      ) : effectiveLayout === "widescreen" ? (
        <div className="spotify-player-info-container">
          <div className="spotify-player-middle">
            <Header {...headerProps} />
            {renderMasterContent()}
          </div>
          <div className="spotify-player-left">
            {renderDetailContent()}
          </div>
          <div className="spotify-player-right">
            <MediaButtons {...mediaProps} />
            <SeekControls {...seekProps} />
            <VolumeControls {...volumeProps} />
          </div>
        </div>
      ) : (
        <>
          <Header {...headerProps} />
          <div className="spotify-player-info-container">
            <div className="spotify-player-left">
              {renderMasterContent()}
            </div>
            <div className="spotify-player-right">
              {renderDetailContent()}
            </div>
          </div>
          <div className="spotify-player-footer">
            <SeekControls {...seekProps} />
            <MediaButtons {...mediaProps} />
            <VolumeControls {...volumeProps} />
          </div>
        </>
      )}
    </div>
  );
};

MediaPlayer.propTypes = {
  websocketUrl: PropTypes.string,
  apiBaseUrl: PropTypes.string,
  kioskMode: PropTypes.bool,
  hideOnDisconnect: PropTypes.bool,
  layout: PropTypes.oneOf(["auto", "default", "widescreen", "portrait"]),
  maxHeight: PropTypes.string,
  panelMaxHeight: PropTypes.string,
  mobileBreakpoint: PropTypes.number,
  theme: PropTypes.string,
};

export default MediaPlayer;
