/** Details extracted for one product from the Amazon.in search results. */
export interface ProductDetails {
  /** Product title as shown in the search results. */
  title: string;
  /** Star rating, e.g. 4.3. 0 when no rating is shown. */
  rating: number;
  /** Number of reviews, e.g. 12345. 0 when not shown. */
  reviewCount: number;
  /** Price as shown, e.g. "₹1,299". Empty when not shown. */
  priceText: string;
  /** Price as a number, e.g. 1299. 0 when not shown. */
  priceValue: number;
  /** True when the Prime badge is shown on the result. */
  prime: boolean;
  /** True when the result is a paid (sponsored) listing. */
  sponsored: boolean;
  /** Absolute URL of the product detail page. */
  url: string;
  /** 1-based position in the search results. */
  position: number;
}

export interface SelectionCriteria {
  minRating: number;
  minReviews: number;
}
