// Minimal, dependency-free typing wrapper for `agora-rtc-sdk-ng`.
// We intentionally keep this narrow (no `any`) so ESLint can pass.

export type AgoraAudioTrack = {
  play?: () => void;
  setEnabled?: (enabled: boolean) => void;
  setVolume?: (volume: number) => void;
  close?: () => Promise<void>;
};

export type AgoraVideoTrack = {
  play?: (container: HTMLDivElement) => void;
  setEnabled?: (enabled: boolean) => void;
  close?: () => Promise<void>;
};

export type AgoraClient = {
  join: (
    appId: string,
    channelName: string,
    token: string,
    uid: number
  ) => Promise<void>;
  leave: () => Promise<void>;
  publish: (tracks: unknown[]) => Promise<void>;
  subscribe: (user: unknown, mediaType: unknown) => Promise<void>;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
};

export type AgoraRTCType = {
  createClient: (opts: { mode: string; codec: string }) => AgoraClient;
  createMicrophoneAudioTrack: () => Promise<AgoraAudioTrack>;
  createMicrophoneAndCameraTracks: () => Promise<
    [AgoraAudioTrack, AgoraVideoTrack]
  >;
};

