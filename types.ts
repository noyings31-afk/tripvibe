export interface Restaurant {
  name: string;
  description: string;
  category: string;
  priceRange: '₩' | '₩₩' | '₩₩₩' | '₩₩₩₩';
  signatureDish: string;
  latitude: number;
  longitude: number;
}

export interface Attraction {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface Accommodation {
  name:string;
  description: string;
  priceTier: 'Budget' | 'Mid-range' | 'Luxury';
  rating: number;
  latitude: number;
  longitude: number;
}

export interface PhotoSpot {
  name: string;
  tip: string;
  latitude: number;
  longitude: number;
}

export interface PopularPlace {
  name: string;
  reason: string;
  latitude: number;
  longitude: number;
}

export interface TravelGuide {
  restaurants: Restaurant[];
  attractions: Attraction[];
  accommodations: Accommodation[];
  photoSpots: PhotoSpot[];
  popularPlaces: PopularPlace[];
}

export interface ItineraryItem {
  placeName: string;
  activity: string;
}

export interface Itinerary {
  title: string;
  summary: string;
  morning: ItineraryItem[];
  afternoon: ItineraryItem[];
  evening: ItineraryItem[];
}

export interface BlogPost {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSource {
  uri: string;
  title: string;
}