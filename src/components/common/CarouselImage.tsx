
interface CarouselImageProps {
  text: string;
  image: string;
}

export function CarouselImage({ text, image }: CarouselImageProps) {
  return (
    <div
      className="carousel-image"
      style={{ backgroundImage: `url("${image}")` }}
    >
      <div className="carousel-overlay">
        <h2>{text}</h2>
      </div>
    </div>
  );
}
