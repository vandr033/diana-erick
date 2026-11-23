export const foodOptions = ["Vegetariana", "Vegana", "Sin gluten", "Sin lactosa", "Halal", "Kosher", "Alergia alimentaria", "Otra"] as const;
export const musicStyles = ["DJ / electrónica", "Cena / formal", "Pista de baile", "Otra"] as const;

export type FoodFeedback = { options: (typeof foodOptions)[number][]; details: string };
export type MusicFeedback = { song: string; style?: (typeof musicStyles)[number] };
export type FlightFeedback = { arrival: string; departure?: string; notes: string };
