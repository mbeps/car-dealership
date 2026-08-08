/**
 * FAQ entry shown on the public homepage.
 * FAQs are ordered by the `order` field and managed through the admin settings form.
 */
export interface FAQ {
  /** FAQ row identifier. */
  id: string;
  /** FAQ question text. */
  question: string;
  /** FAQ answer text. */
  answer: string;
  /** Display order used to render FAQ entries. */
  order: number;
  /** Row creation timestamp. */
  createdAt: string;
  /** Row last-updated timestamp. */
  updatedAt: string;
}
