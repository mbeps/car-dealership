"use client";

import { Car } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface CarGalleryProps {
  images: string[];
  carName: string;
}

/**
 * Image carousel for car detail pages.
 * Displays the selected car images with primary and thumbnail navigation.
 * Uses Embla carousel via the Shadcn component.
 *
 * @param images - Array of image URLs.
 * @param carName - Car name used for image alt text.
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
      <div className="mb-4">
        <AspectRatio
          ratio={4 / 3}
          className="relative overflow-hidden rounded-lg"
        >
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <Car className="h-24 w-24 text-gray-400" />
          </div>
        </AspectRatio>
      </div>
    );
  }

  return (
    <div>
      {/* Main Carousel */}
      <Carousel setApi={setApi} className="mb-4 w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <AspectRatio
                ratio={4 / 3}
                className="relative overflow-hidden rounded-lg bg-secondary"
              >
                <Image
                  src={image}
                  alt={`${carName} - view ${index + 1}`}
                  fill
                  className="object-contain"
                  priority={index === 0}
                />
              </AspectRatio>
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
              className={`relative h-20 w-24 shrink-0 cursor-pointer rounded-md transition ${
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
                className="rounded-md object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
