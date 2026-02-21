import grSkyline from "@/assets/covers/gr-skyline-1.jpg";
import grAerialFall from "@/assets/covers/gr-aerial-fall.jpg";
import grRiverfront from "@/assets/covers/gr-riverfront.jpg";
import interiorLiving from "@/assets/covers/interior-living-1.jpg";
import interiorKitchen from "@/assets/covers/interior-kitchen-1.jpg";
import interiorBedroom from "@/assets/covers/interior-bedroom-1.jpg";
import homeExterior from "@/assets/covers/home-exterior-1.jpg";
import interiorDining from "@/assets/covers/interior-dining-1.jpg";

export const COVER_IMAGES = [
  grSkyline,
  grAerialFall,
  grRiverfront,
  interiorLiving,
  interiorKitchen,
  interiorBedroom,
  homeExterior,
  interiorDining,
];

/**
 * Deterministically pick a cover image based on a string (slug, title, etc.)
 * so it stays consistent per page but rotates across pages.
 */
export function getCoverImage(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return COVER_IMAGES[Math.abs(hash) % COVER_IMAGES.length];
}
