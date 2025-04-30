// Renders a text box with info - like a table with playback info or an error message.
import React, { useEffect, useRef, useState } from "react";
import "./Playlists.css";

// TODO: add more comments, IE for props
const Playlists = ({ playlists, onSelect, onPlay }) => {
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [arrowVisible, setArrowVisible] = useState(true);
  const [arrowOffset, setArrowOffset] = useState(0);
  const wrapperRef = useRef(null);
  const scrollState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    animationFrame: null
  });

  const handleSelect = (playlist) => {
    setActivePlaylist(playlist.id);
    onSelect(playlist);
  };

  const handleScroll = () => {
    if (!wrapperRef.current) return;
    const { scrollLeft } = wrapperRef.current;
    // Hide arrow if scrolled near the end
    setArrowVisible(scrollLeft < 1);
    setArrowOffset(scrollLeft);
  };

  const animateScroll = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Apply friction
    scrollState.current.velocity *= 0.95;

    // Stop if velocity is very small
    if (Math.abs(scrollState.current.velocity) < 0.1) {
      scrollState.current.velocity = 0;
      return;
    }

    // Update scroll position
    wrapper.scrollLeft -= scrollState.current.velocity;

    // Bounce at boundaries
    if (wrapper.scrollLeft <= 0) {
      wrapper.scrollLeft = 0;
      scrollState.current.velocity = 0;
    } else if (wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth) {
      wrapper.scrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
      scrollState.current.velocity = 0;
    }

    scrollState.current.animationFrame = requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleMouseDown = (e) => {
      scrollState.current.isDown = true;
      scrollState.current.startX = e.pageX - wrapper.offsetLeft;
      scrollState.current.scrollLeft = wrapper.scrollLeft;
      scrollState.current.lastX = e.pageX;
      scrollState.current.lastTime = performance.now();
      scrollState.current.velocity = 0;
      
      if (scrollState.current.animationFrame) {
        cancelAnimationFrame(scrollState.current.animationFrame);
      }
      
      wrapper.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
      scrollState.current.isDown = false;
      wrapper.style.cursor = 'grab';
      animateScroll();
    };

    const handleMouseUp = () => {
      scrollState.current.isDown = false;
      wrapper.style.cursor = 'grab';
      animateScroll();
    };

    const handleMouseMove = (e) => {
      if (!scrollState.current.isDown) return;
      e.preventDefault();
      
      const now = performance.now();
      const deltaTime = now - scrollState.current.lastTime;
      const deltaX = e.pageX - scrollState.current.lastX;
      
      // Calculate velocity (pixels per frame)
      scrollState.current.velocity = deltaX;
      
      const x = e.pageX - wrapper.offsetLeft;
      const walkX = x - scrollState.current.startX;
      wrapper.scrollLeft = scrollState.current.scrollLeft - walkX;
      
      scrollState.current.lastX = e.pageX;
      scrollState.current.lastTime = now;
    };

    wrapper.addEventListener('mousedown', handleMouseDown);
    wrapper.addEventListener('mouseleave', handleMouseLeave);
    wrapper.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener("scroll", handleScroll);

    wrapper.style.cursor = 'grab';
    handleScroll(); // Initialize visibility on mount

    return () => {
      wrapper.removeEventListener('mousedown', handleMouseDown);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
      wrapper.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener("scroll", handleScroll);
      if (scrollState.current.animationFrame) {
        cancelAnimationFrame(scrollState.current.animationFrame);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={"spotify-player-playlists-wrapper"}
    >
      <div
        className={`spotify-player-arrow  ${arrowVisible ? "arrow-visible" : "arrow-hidden"}`}
        style={{ transform: `translate(${arrowOffset}px, -50%)` }}
      >
        →
      </div>
      <div className="spotify-player-playlist-container">
        {playlists?.map((playlist) => (
          <div
            key={playlist.id}
            className={`spotify-player-playlist-item ${activePlaylist === playlist.id ? "active" : ""
              }`}
            onClick={() => handleSelect(playlist)}
          >
            <img
              src={playlist.images[0]?.url}
              alt={`${playlist.name} cover`}
              className="spotify-player-playlist-image"
            />
            <div className="spotify-player-playlist-info">
              <h4>{playlist.name}</h4>
              <p>{playlist.owner.display_name}</p>
            </div>
            {activePlaylist === playlist.id && (
              <button
                className="spotify-player-play-button"
                onClick={() => onPlay(playlist.uri)}
              >
                ▶
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlists;
