// Renders a 5-star average based on real Review rows (never a fabricated
// number) - if a product has no reviews yet, callers should simply not
// render this component, so we never show an empty/fake rating.

export function averageRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export default function RatingStars({
  reviews,
  size = "sm",
  showCount = true,
}: {
  reviews: { rating: number }[];
  size?: "sm" | "md";
  showCount?: boolean;
}) {
  if (!reviews.length) return null;
  const avg = averageRating(reviews);
  const rounded = Math.round(avg * 2) / 2; // nearest half star

  return (
    <div className={`rating-stars rating-stars--${size}`}>
      <span className="rating-stars__icons" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? "star star--full" : n - 0.5 === rounded ? "star star--half" : "star star--empty"}>
            ★
          </span>
        ))}
      </span>
      {showCount && (
        <span className="rating-stars__text">
          {avg.toFixed(1)} ({reviews.length})
        </span>
      )}
    </div>
  );
}
