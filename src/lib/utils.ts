import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// shadcn-svelte Svelte 5 helper types
export type WithElementRef<T> = T & {
	ref?: HTMLElement | null;
};

export type WithoutChildren<T> = Omit<T, "children">;

export type WithoutChild<T> = Omit<T, "child">;

export type WithoutChildrenOrChild<T> = Omit<T, "children" | "child">;

export function generateIdempotencyKey(prefix: string = 'idemp'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
