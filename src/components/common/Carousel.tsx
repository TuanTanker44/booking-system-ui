
import { useState } from "react";
import { CarouselImage } from "./CarouselImage";
import "./Carousel.css";

interface Slide {
  text: string;
  image: string;
}

interface CarouselProps {
  slides: Slide[];
}

export function Carousel({ slides }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="carousel">
      <CarouselImage
        text={currentSlide.text}
        image={currentSlide.image}
      />

      <button
        className="carousel-btn carousel-btn-prev"
        onClick={() =>
          setCurrentIndex(
            (index) => (index - 1 + slides.length) % slides.length
          )
        }
        aria-label="Ảnh trước"
      >
        &#8592;
      </button>

      <button
        className="carousel-btn carousel-btn-next"
        onClick={() =>
          setCurrentIndex((index) => (index + 1) % slides.length)
        }
        aria-label="Ảnh tiếp theo"
      >
        &#8594;
      </button>

      <div className="carousel-indicators">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            className={`carousel-dot ${
              index === currentIndex ? "active" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Chuyển đến ảnh ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          />
        ))}
      </div>

      <div className="carousel-counter">
        {String(currentIndex + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>
    </div>
  );
}
