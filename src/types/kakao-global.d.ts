declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new () => {
          extend: (latlng: unknown) => void;
        };
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          setBounds: (bounds: unknown, padding?: number) => void;
          relayout: () => void;
          setCenter: (latlng: unknown) => void;
        };
        Marker: new (options: { map: unknown; position: unknown; title?: string }) => unknown;
        Circle: new (options: {
          map: unknown;
          center: unknown;
          radius: number;
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          fillColor?: string;
          fillOpacity?: number;
        }) => unknown;
        InfoWindow: new (options: { content: string }) => {
          open: (map: unknown, marker: unknown) => void;
        };
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

export {};
