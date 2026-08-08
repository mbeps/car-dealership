/**
 * CMS content for the public home page marketing sections.
 * Stored as a singleton row and consumed by the home page and admin editor.
 */
export interface HomePageContent {
  /** Singleton content identifier. */
  id: string;
  /** Primary hero heading shown above the homepage search. */
  heroTitle: string;
  /** Primary hero subheading shown under the homepage title. */
  heroSubtitle: string;
  /** First homepage feature headline. */
  feature1Title: string;
  /** First homepage feature description. */
  feature1Description: string;
  /** Second homepage feature headline. */
  feature2Title: string;
  /** Second homepage feature description. */
  feature2Description: string;
  /** Third homepage feature headline. */
  feature3Title: string;
  /** Third homepage feature description. */
  feature3Description: string;
  /** Call-to-action heading for the homepage marketing section. */
  ctaTitle: string;
  /** Call-to-action description for the homepage marketing section. */
  ctaSubtitle: string;
  /** Row creation timestamp. */
  createdAt: string;
  /** Row last-updated timestamp. */
  updatedAt: string;
}
