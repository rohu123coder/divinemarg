declare module "node-geocoder" {
  interface GeocoderEntry {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    formattedAddress?: string;
    administrativeLevels?: { level2long?: string };
  }

  interface Geocoder {
    geocode(query: string): Promise<GeocoderEntry[]>;
  }

  function NodeGeocoder(options: {
    provider: string;
    fetch?: typeof fetch;
  }): Geocoder;
  export default NodeGeocoder;
}
