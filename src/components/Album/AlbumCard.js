import React, { useEffect, useState, useRef } from 'react';
import PlaceholderAlbum from "./PlaceHolderAlbum";
import './AlbumCard.css';

const AlbumCard = ({ title, subtitle, image, isStopped }) => {
  const [loaded, setLoaded] = useState(false);
  const [gradient, setGradient] = useState('');
  const canvasRef = useRef();
  const [rotationDegree, setRotationDegree] = useState(() => {
    const currentTime = new Date().getTime();
    return (currentTime / 200) % 360;
  });

  // Extract dominant colors using Canvas API
  const extractColorsFromImage = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Resize canvas to match image dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorCounts = {};
    const colorThreshold = 50; // Reduce granularity for performance

    // Process pixels to count colors
    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.round(pixels[i] / colorThreshold) * colorThreshold;
      const g = Math.round(pixels[i + 1] / colorThreshold) * colorThreshold;
      const b = Math.round(pixels[i + 2] / colorThreshold) * colorThreshold;
      const color = `rgb(${r},${g},${b})`;

      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }

    // Sort colors by frequency
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    const dominantColors = sortedColors.slice(0, 3).map((entry) => entry[0]);

    // Generate gradient
    return dominantColors.length > 1
      ? `linear-gradient(to right, ${dominantColors.join(', ')})`
      : `linear-gradient(to right, ${dominantColors[0]}, ${dominantColors[0]})`;
  };

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.crossOrigin = 'Anonymous'
      img.src = image;

      img.onload = () => {
        const generatedGradient = extractColorsFromImage(img);
        setGradient(generatedGradient);
        setLoaded(true);
      };

      img.onerror = () => {
        console.error('Failed to load album art.');
        setGradient('linear-gradient(to right, #000, #333)'); // Default fallback
        setLoaded(true);
      };
    }
  }, [image]);

  // Effect to rotate the gradient continuously at a slower pace
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      setRotationDegree((currentTime / 200) % 360);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const rotatingGradient = `${gradient.replace('to right', `${rotationDegree}deg`)}`;

  return (
    <div
      className={"spotify-player-album-card-wrapper"}
      style={{ '--gradient-border': rotatingGradient, opacity: loaded || isStopped ? 1 : 0 }}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      {
        isStopped ? (<div className="spotify-player-album-card-image"><PlaceholderAlbum /></div>) : (
          <div className="spotify-player-album-card-container">
            <div className="spotify-player-album-card-container-border"></div>
            <div className="spotify-player-album-card-image-container">
              <img
                className="spotify-player-album-card-image"
                alt={`${title} - ${subtitle}`}
                src={image}
              />
            </div>
            {/* <div className="spotify-player-album-card-title-container">
              <div className="spotify-player-album-card-title">{title}</div>
            </div> */}
            <div className="spotify-player-album-card-subtitle">{subtitle}</div>
          </div>
        )
      }
    </div>
  );
};

export default AlbumCard;