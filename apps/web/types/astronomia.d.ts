declare module "astronomia/solar" {
  export function apparentLongitude(T: number): number;
}

declare module "astronomia/moonposition" {
  export function position(jde: number): {
    lon: number;
    lat: number;
    range: number;
  };
}

declare module "astronomia/base" {
  export function J2000Century(jde: number): number;
}

declare module "astronomia/planetposition" {}

declare module "astronomia/sidereal" {}

declare module "astronomia/coord" {}

declare module "astronomia/deltat" {}
