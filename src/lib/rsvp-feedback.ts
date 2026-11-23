export type FoodFeedback = { hasRestrictions: "yes" | "no"; details: string } | { options: string[]; details: string };
export type MusicFeedback = { song: string };
export type FlightFeedback = { arrival: string; departure?: string; notes: string };

export function describeFoodFeedback(food: FoodFeedback) {
  if ("hasRestrictions" in food) return { answer: food.hasRestrictions === "yes" ? "Sí" : "No", details: food.details };
  return { answer: "Sí", details: [food.options.join(", "), food.details].filter(Boolean).join("\n") };
}
