"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Car } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CarGalleryProps {
  images: string[];
  carName: string;
}

/**
 * Image carousel for car detail page.
 * Main carousel with thumbnail navigation.
 * Uses Embla carousel via Shadcn component.
 * Highlights active thumbnail.
 *
 * @param images - Array of image URLs
 * @param carName - Car name for alt text
 * @see https://www.embla-carousel.com/
 */
export function CarGallery({ images, carName }: CarGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleThumbnailClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden relative mb-4">
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Car className="h-24 w-24 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Carousel */}
      <Carousel setApi={setApi} className="w-full mb-4">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="aspect-video rounded-lg overflow-hidden relative">
                <Image
                  src={image}
                  alt={`${carName} - view ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative cursor-pointer rounded-md h-20 w-24 shrink-0 transition ${
                index === currentImageIndex
                  ? "border-2 border-blue-600"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                src={image}
                alt={`${carName} - thumbnail ${index + 1}`}
                fill
                className="object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
