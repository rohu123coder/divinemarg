export type TrackingParams = Record<string, unknown>;

type FbqFn = (
  command: "track",
  eventName: string,
  params?: TrackingParams
) => void;

type GtagFn = (
  command: "event",
  eventName: string,
  params?: TrackingParams
) => void;

declare global {
  interface Window {
    fbq?: FbqFn & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    gtag?: GtagFn;
  }
}

export const trackMetaEvent = (eventName: string, params?: TrackingParams): void => {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, params ?? {});
  }
};

export const trackGAEvent = (eventName: string, params?: TrackingParams): void => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
  }
};
