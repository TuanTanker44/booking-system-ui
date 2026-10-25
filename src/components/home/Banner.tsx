import { Carousel } from "../common/Carousel";

export function Banner() {
  const slides = [
    {
      text: "Khám phá thế giới",
      image: "/images/travel-1.jpg",
    },
    {
      text: "Chạm đến thiên nhiên",
      image: "/images/travel-2.jpg",
    },
    {
      text: "Hành trình của bạn",
      image: "/images/travel-3.jpg",
    },
  ];

  return (
    <section className="banner">
      <Carousel slides={slides} />
    </section>
  );
}
