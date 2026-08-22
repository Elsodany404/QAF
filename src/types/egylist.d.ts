declare module "egylist" {
  export interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
  }

  export interface City {
    id: number;
    name_en: string;
    name_ar: string;
  }

  export function getAllGovernorates(): Governorate[];
  export function getCitiesByGovernorateId(governorateId: number): City[];
}
