import { HTMLAttributes } from "react";

export type CardVariant = "dashboard" | "metric" | "glass" | "insight";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverEffect?: boolean;
}
