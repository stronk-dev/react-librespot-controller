// Collection of go-librespot API calls

/**
 * Generic API call function with error handling.
 * Returns null for 204 (no active session).
 */
const callApi = async (url, options = {}, defaultReturnValue = null) => {
  try {
    const response = await fetch(url, options);
    if (response.status === 204) return null;
    if (!response.ok) {
      console.error(`API call failed: ${response.status} ${response.statusText}`);
      return defaultReturnValue;
    }
    return response;
  } catch (error) {
    console.error("Error in API call:", error);
    return defaultReturnValue;
  }
};

const jsonOrNull = async (responsePromise) => {
  const response = await responsePromise;
  if (!response || !response.json) return null;
  return response.json();
};

export const extractIdFromUri = (uri) => uri?.split(':').pop();

/** Rewrite broken Spotify CDN URLs to publicly-resolvable i.scdn.co.
 *  Also resolves relative paths (e.g. /metadata/playlist/.../image) against baseUrl. */
export const normalizeImageUrl = (url, baseUrl) => {
  if (!url) return null;
  // Relative path from backend (e.g. /metadata/playlist/{id}/image?size=300)
  if (url.startsWith("/") && baseUrl) return `${baseUrl}${url}`;
  // u.scdn.co (internal, doesn't resolve externally) → i.scdn.co (public)
  const uScdn = url.match(/u\.scdn\.co\/images\/.*?\/([a-fA-F0-9]{40})$/);
  if (uScdn) return `https://i.scdn.co/image/${uScdn[1].toLowerCase()}`;
  // spotify:image:{hex} URI → https URL
  const imageUri = url.match(/^spotify:image:([a-fA-F0-9]{40})$/i);
  if (imageUri) return `https://i.scdn.co/image/${imageUri[1].toLowerCase()}`;
  // Bare 40-char hex ID
  if (/^[a-fA-F0-9]{40}$/.test(url)) return `https://i.scdn.co/image/${url.toLowerCase()}`;
  return url;
};

// Health check
export const checkAPI = async (baseUrl) =>
  jsonOrNull(callApi(`${baseUrl}/`));

// Gets the entire status JSON blob
export const getStatus = async (baseUrl) =>
  jsonOrNull(callApi(`${baseUrl}/status`));

/**
 * Player Controls
 */

export const play = async (baseUrl, payload) =>
  await callApi(`${baseUrl}/player/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const resume = async (baseUrl) =>
  await callApi(`${baseUrl}/player/resume`, { method: "POST" });

export const pause = async (baseUrl) =>
  await callApi(`${baseUrl}/player/pause`, { method: "POST" });

export const togglePlayPause = async (baseUrl) =>
  await callApi(`${baseUrl}/player/playpause`, { method: "POST" });

export const nextTrack = async (baseUrl) =>
  await callApi(`${baseUrl}/player/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

export const previousTrack = async (baseUrl) =>
  await callApi(`${baseUrl}/player/prev`, { method: "POST" });

/**
 * Seek Controls
 */

export const seek = async (baseUrl, position, relative = false) =>
  await callApi(`${baseUrl}/player/seek`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position, relative }),
  });

/**
 * Volume Controls
 */

export const getVolume = async (baseUrl) =>
  jsonOrNull(callApi(`${baseUrl}/player/volume`));

export const setVolume = async (baseUrl, volume, relative = false) =>
  await callApi(`${baseUrl}/player/volume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ volume, relative }),
  });

/**
 * Repeat and Shuffle
 */

export const toggleRepeatContext = async (baseUrl, repeat_context) =>
  await callApi(`${baseUrl}/player/repeat_context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repeat_context }),
  });

export const toggleRepeatTrack = async (baseUrl, repeat_track) =>
  await callApi(`${baseUrl}/player/repeat_track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repeat_track }),
  });

export const toggleShuffleContext = async (baseUrl, shuffle_context) =>
  await callApi(`${baseUrl}/player/shuffle_context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shuffle_context }),
  });

/**
 * Queue Management
 */

export const addToQueue = async (baseUrl, uri) =>
  await callApi(`${baseUrl}/player/add_to_queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uri }),
  });

export const getQueue = async (baseUrl) =>
  jsonOrNull(callApi(`${baseUrl}/player/queue`));

/**
 * Radio
 */

export const startRadio = async (baseUrl, seedUri) =>
  await callApi(`${baseUrl}/player/radio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed_uri: seedUri }),
  });

/**
 * Native Metadata API (no web API rate limits)
 */

export const getRootlist = async (baseUrl, limit, offset) => {
  let url = `${baseUrl}/metadata/rootlist`;
  if (limit != null) url += `?limit=${limit}&offset=${offset || 0}`;
  return jsonOrNull(callApi(url));
};

export const getPlaylistDetails = async (baseUrl, id, limit = 50, offset = 0) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/playlist/${id}?limit=${limit}&offset=${offset}`));

export const getTrackDetails = async (baseUrl, id) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/track/${id}`));

export const getAlbumDetails = async (baseUrl, id) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/album/${id}`));

export const getArtistDetails = async (baseUrl, id) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/artist/${id}`));

export const getShowDetails = async (baseUrl, id) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/show/${id}`));

export const getEpisodeDetails = async (baseUrl, id) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/episode/${id}`));

export const getCollection = async (baseUrl) =>
  jsonOrNull(callApi(`${baseUrl}/metadata/collection`));

export const getContext = async (baseUrl, uri) =>
  jsonOrNull(callApi(`${baseUrl}/context/${encodeURIComponent(uri)}`));

const exports = {
  checkAPI,
  getStatus,
  play,
  resume,
  pause,
  togglePlayPause,
  nextTrack,
  previousTrack,
  seek,
  getVolume,
  setVolume,
  toggleRepeatContext,
  toggleRepeatTrack,
  toggleShuffleContext,
  addToQueue,
  getQueue,
  startRadio,
  getRootlist,
  getPlaylistDetails,
  getTrackDetails,
  getAlbumDetails,
  getArtistDetails,
  getShowDetails,
  getEpisodeDetails,
  getCollection,
  getContext,
  extractIdFromUri,
  normalizeImageUrl,
};
export default exports;
