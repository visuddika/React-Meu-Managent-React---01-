import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Nav.css";

// Import menu images
import menu1 from "../Img/Menu2.jpg";
import menu2 from "../Img/Menu1.jpg";
import menu3 from "../Img/Menu3.jpg";
import menu4 from "../Img/Menu..4.jpg";
import menu5 from "../Img/Menu..5.jpg";
import menu6 from "../Img/Menu..6.jpg";
import menu7 from "../Img/Menu.7.jpg";

const images = [menu1, menu2, menu3, menu4, menu5, menu6, menu7];

function Nav() {
  const [bgImage, setBgImage] = useState(images[0]);
  const [loadedImages, setLoadedImages] = useState([]);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fullText = "Menu Management System";

  useEffect(() => {
    const loadImages = async () => {
      const loaded = await Promise.all(
        images.map((image) =>
          new Promise((resolve) => {
            const img = new Image();
            img.src = image;
            img.onload = () => resolve(image);
            img.onerror = () => resolve(null);
          })
        )
      );
      setLoadedImages(loaded.filter(Boolean));
    };
    loadImages();
  }, []);

  useEffect(() => {
    if (!loadedImages.length) return;
    const interval = setInterval(() => {
      setBgImage((prev) => {
        const current = loadedImages.indexOf(prev);
        const next = (current + 1) % loadedImages.length;
        return loadedImages[next];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [loadedImages]);

  // Typing animation effect
  useEffect(() => {
    const startTyping = setTimeout(() => {
      setIsTyping(true);
      let index = 0;
      
      const typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 150); // Speed of typing (150ms per character)

      return () => clearInterval(typeInterval);
    }, 800); // Delay before starting to type

    return () => clearTimeout(startTyping);
  }, []);

  return (
    <div className="nav-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="nav-overlay">
        <div className="sidebar-nav">
          <div className="logo">
            <h1>Restaurant</h1>
          </div>
          <div className="vertical-nav-buttons">
            <Link to="/foods" className="nav-button">Foods</Link>
            <Link to="/menu" className="nav-button">Menu</Link>
            <Link to="/menudetails" className="nav-button">Menu Details</Link>
          </div>
        </div>
        <div className="content-area">
          <div className="typing-title-container">
            <h1 className="typing-title">
              {displayedText}
              {isTyping && <span className="cursor">|</span>}
            </h1>
            <div className={`title-underline ${!isTyping && displayedText.length === fullText.length ? 'show' : ''}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Nav;