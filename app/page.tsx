import { getFeaturedCars } from "@/actions/home";
import { getHomePageContent, getFAQs } from "@/actions/home-content";
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
import { ROUTES, createCarSearchUrl } from "@/constants/routes";
import { SignedOut } from "@/lib/auth-context";
import { Calendar, Car, ChevronRight, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
      <section className="relative py-16 md:py-28 dotted-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-8xl mb-4 gradient-title">
              {heroTitle}
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Cars</h2>
            <Button variant="ghost" className="flex items-center" asChild>
              <Link href={ROUTES.CARS}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Make */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Browse by Make</h2>
            <Button variant="ghost" className="flex items-center" asChild>
              <Link href={ROUTES.CARS}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {carMakes.map((make) => (
              <Link
                key={make.slug}
                href={createCarSearchUrl({ make: make.slug })}
                className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition cursor-pointer"
              >
                <div className="h-16 w-auto mx-auto mb-2 relative">
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
          <h2 className="text-2xl font-bold text-center mb-12">
            Why Choose Our Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature1Title}</h3>
              <p className="text-gray-600">{feature1Description}</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature2Title}</h3>
              <p className="text-gray-600">{feature2Description}</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature3Title}</h3>
              <p className="text-gray-600">{feature3Description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Body Type */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Browse by Body Type</h2>
            <Button variant="ghost" className="flex items-center" asChild>
              <Link href={ROUTES.CARS}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {bodyTypes.map((type) => (
              <Link
                key={type.name}
                href={createCarSearchUrl({ bodyType: type.name })}
                className="relative group cursor-pointer"
              >
                <div className="overflow-hidden rounded-lg flex justify-end h-36 mb-4 relative">
                  <Image
                    src={type.image || `/body/${type.name.toLowerCase()}.webp`}
                    alt={type.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300 p-2"
                  />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent rounded-lg flex items-end">
                  <h3 className="text-white text-xl font-bold pl-4 pb-2 ">
                    {type.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with Accordion */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
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
      <section className="py-16 dotted-background text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{ctaTitle}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href={ROUTES.CARS}>View All Cars</Link>
            </Button>
            <SignedOut>
              <Button size="lg" asChild>
                <Link href={ROUTES.SIGN_UP}>Sign Up Now</Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </section>
    </div>
  );
}
