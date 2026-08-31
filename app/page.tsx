import { Calendar, Car, ChevronRight, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFAQs } from "@/actions/home/get-faqs";
import { getFeaturedCars } from "@/actions/home/get-featured-cars";
import { getHomePageContent } from "@/actions/home/get-home-page-content";
import { SignedOut } from "@/components/auth-helpers";
import { CarCard } from "@/components/car-card";
import { HomeSearch } from "@/components/home-search";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { bodyTypes } from "@/constants/body-types";
import { carMakes } from "@/constants/car-makes";
import { ROUTES } from "@/constants/routes";
import { createCarSearchUrl } from "@/lib/route/createCarSearchUrl";

/**
 * Renders the public home page.
 *
 * Loads featured cars, homepage content, and FAQs from server actions, then composes the marketing sections, search entry points, and call-to-action links.
 *
 * @returns The rendered home page.
 */
export default async function Home() {
  const featuredCars = await getFeaturedCars();
  const homeContent = await getHomePageContent();
  const faqs = await getFAQs();

  const heroTitle = homeContent?.heroTitle || "Find your ideal car today.";
  const heroSubtitle =
    homeContent?.heroSubtitle ||
    "Advanced Car Search and test drive from thousands of vehicles.";
  const feature1Title = homeContent?.feature1Title || "Wide Selection";
  const feature1Description =
    homeContent?.feature1Description ||
    "Thousands of verified vehicles from trusted dealerships and private sellers.";
  const feature2Title = homeContent?.feature2Title || "Easy Test Drive";
  const feature2Description =
    homeContent?.feature2Description ||
    "Book a test drive online in minutes, with flexible scheduling options.";
  const feature3Title = homeContent?.feature3Title || "Secure Process";
  const feature3Description =
    homeContent?.feature3Description ||
    "Verified listings and secure booking process for peace of mind.";
  const ctaTitle = homeContent?.ctaTitle || "Ready to Find Your Dream Car?";
  const ctaSubtitle =
    homeContent?.ctaSubtitle ||
    "Join thousands of satisfied customers who found their perfect vehicle through our platform.";

  return (
    <div className="flex flex-col pt-20">
      {/* Hero Section with Gradient Title */}
      <section className="dotted-background relative py-16 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <h1 className="gradient-title mb-4 text-5xl md:text-8xl">
              {heroTitle}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-gray-500 text-xl">
              {heroSubtitle}
            </p>
          </div>

          {/* Search Component (Client) */}
          <HomeSearch />
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-bold text-2xl">Featured Cars</h2>
            <Button
              variant="ghost"
              className="flex items-center"
              render={<Link href={ROUTES.HOME.CARS} />}
            >
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Make */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-bold text-2xl">Browse by Make</h2>
            <Button
              variant="ghost"
              className="flex items-center"
              render={<Link href={ROUTES.HOME.CARS} />}
            >
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {carMakes.map((make) => (
              <Link
                key={make.slug}
                href={createCarSearchUrl({ make: make.slug })}
                className="cursor-pointer rounded-lg bg-white p-4 text-center shadow transition hover:shadow-md"
              >
                <div className="relative mx-auto mb-2 h-16 w-auto">
                  <Image
                    src={make.image || `/make/${make.slug}.webp`}
                    alt={make.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <h3 className="font-medium">{make.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-bold text-2xl">
            Why Choose Our Platform
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="mb-2 font-bold text-xl">{feature1Title}</h3>
              <p className="text-gray-600">{feature1Description}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="mb-2 font-bold text-xl">{feature2Title}</h3>
              <p className="text-gray-600">{feature2Description}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="mb-2 font-bold text-xl">{feature3Title}</h3>
              <p className="text-gray-600">{feature3Description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Body Type */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-bold text-2xl">Browse by Body Type</h2>
            <Button
              variant="ghost"
              className="flex items-center"
              render={<Link href={ROUTES.HOME.CARS} />}
            >
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {bodyTypes.map((type) => (
              <Link
                key={type.name}
                href={createCarSearchUrl({ bodyType: type.name })}
                className="group relative cursor-pointer"
              >
                <div className="relative mb-4 flex h-36 justify-end overflow-hidden rounded-lg">
                  <Image
                    src={type.image || `/body/${type.name.toLowerCase()}.webp`}
                    alt={type.name}
                    fill
                    className="object-cover p-2 transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 flex items-end rounded-lg bg-linear-to-t from-black/70 to-transparent">
                  <h3 className="pb-2 pl-4 font-bold text-white text-xl">
                    {type.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with Accordion */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-bold text-2xl">
            Frequently Asked Questions
          </h2>
          <Accordion className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.id} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="dotted-background py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-bold text-3xl">{ctaTitle}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-blue-100 text-xl">
            {ctaSubtitle}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              render={<Link href={ROUTES.HOME.CARS} />}
            >
              View All Cars
            </Button>
            <SignedOut>
              <Button size="lg" render={<Link href={ROUTES.AUTH.SIGN_UP} />}>
                Sign Up Now
              </Button>
            </SignedOut>
          </div>
        </div>
      </section>
    </div>
  );
}
