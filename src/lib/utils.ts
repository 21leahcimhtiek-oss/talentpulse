import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OKRStatus } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function getOKRStatusColor(status: OKRStatus): string {
  const colors: Record<OKRStatus, string> = {
    on_track: "text-green-700 bg-green-100",
    at_risk: "text-yellow-700 bg-yellow-100",
    missed: "text-red-700 bg-red-100",
    achieved: "text-blue-700 bg-blue-100",
  };
  return colors[status];
}

export function getOKRProgressPercent(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getSentimentLabel(score: number): string {
  if (score > 0.3) return "Positive";
  if (score < -0.3) return "Negative";
  return "Neutral";
}

export function getSentimentColor(score: number): string {
  if (score > 0.3) return "text-green-600";
  if (score < -0.3) return "text-red-600";
  return "text-gray-600";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateTenure(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const months = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  if (months < 1) return "Less than a month";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${remainingMonths}m`;
}