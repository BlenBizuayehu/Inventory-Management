import { useEffect, useState } from "react";
import "./Hero.css";

function Hero() {
  const images = [
    { url: "/total2.jpg", overlay: "rgba(0, 0, 0, 0.3)" },
    { url: "/total3.jpg", overlay: "rgba(30, 73, 102, 0.2)" },
    { url: "/home5.jpg", overlay: "rgba(0, 0, 0, 0.4)" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(true);

      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousIndex(null);
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, images.length]);

  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero-section">
  <div
    className="parallax-background"
    style={{
      backgroundImage: `url(${images[currentIndex].url})`
    }}
  ></div>

  <div className="hero-slider-container">
    {/* Slide transition effects */}
    {previousIndex !== null && (
      <div
        className="hero-image slide-out"
        style={{
          backgroundImage: `linear-gradient(${images[previousIndex].overlay}, ${images[previousIndex].overlay}), url(${images[previousIndex].url})`
        }}
      ></div>
    )}
    <div
      className={`hero-image ${isTransitioning ? "slide-in" : "current"}`}
      style={{
        backgroundImage: `linear-gradient(${images[currentIndex].overlay}, ${images[currentIndex].overlay}), url(${images[currentIndex].url})`
      }}
    ></div>
  </div>
</div>


      {/* Now the heading is placed below hero section */}
      <div className="below-hero-text">
        <h1>Welcome to TotalEnergies Lubricants</h1>
        <p>Explore our high-performance motor oils and industrial solutions.</p>
      </div>


      {/* <div className="footer-parallax"></div> */}
    </div>
  );
}

export default Hero;
