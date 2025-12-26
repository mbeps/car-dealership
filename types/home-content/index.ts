export interface HomePageContent {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  ctaTitle: string;
  ctaSubtitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
