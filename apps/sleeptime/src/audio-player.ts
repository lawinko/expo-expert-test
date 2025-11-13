import TrackPlayer, {
  Capability,
  TrackType,
  AppKilledPlaybackBehavior,
  RepeatMode,
  State,
  Track,
  Event,
} from "react-native-track-player";

import Constants from "expo-constants";

// MUST MATCH: native-player.js in app
const NATIVE_PLAYER_EVENTS = {
  SET_SOURCE: "set-source",
  PLAY: "play",
  PAUSE: "pause",
  SEEK: "seek",
  REWIND: "rewind",
  FORWARD: "forward",
  READY: "ready",
  SET_LOOP: "set-loop",
  SET_MUTED: "set-muted",
  SET_PLAYBACK_SPEED: "set-playback-speed",

  STATE_UPDATE: "state-update",
  PROGRESS_UPDATE: "progress-update",
  DESTROY: "destroy",
} as const;

// MUST MATCH: native-player.js in app
const PLAYER_STATUS = {
  PLAYING: "playing",
  PAUSED: "paused",
  ENDED: "ended",
  STOPPED: "stopped",
  BUFFERING: "buffering",
  LOADING: "loading",
  READY: "ready",
};

type NativePlayerEvent =
  (typeof NATIVE_PLAYER_EVENTS)[keyof typeof NATIVE_PLAYER_EVENTS];

const MAX_RETRIES = 20;

// MUST MATCH: app/src/lib/audio/types.js
interface Audio {
  id: string;
  duration: number;
  url: string;
  title: string;
  thumbnail: string;
}

interface AudioSource {
  audio: Audio;
  loop: boolean;
  autoplay: boolean;
  page: {
    path: string;
    title: string;
  };
}

export default class AudioPlayer {
  isInitialized: boolean;
  currentSource: AudioSource | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retryCount: number;

  postMessage: (data: { event: NativePlayerEvent; payload: {} }) => void;

  constructor({
    postMessageToWebview,
  }: {
    postMessageToWebview: (type: string, data?: {}) => void;
  }) {
    this.isInitialized = false;
    this.currentSource = null;
    this.retryCount = 0;
    this.retryTimer = null;

    this.postMessage = (data) =>
      postMessageToWebview("native-player-has-updated", data);
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await TrackPlayer.getActiveTrack();
    } catch (e) {
      // e.code === "player_not_initialized"
      TrackPlayer.registerPlaybackService(() => require("./service"));

      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },

        progressUpdateEventInterval: 0.5, // seconds

        capabilities: [
          Capability.Play,
          Capability.Pause,
          // Capability.SkipToNext,
          // Capability.SkipToPrevious,
        ],
      });
    }

    this._setupEventListeners();

    this.postMessage({
      event: NATIVE_PLAYER_EVENTS.READY,
      payload: {},
    });

    this.isInitialized = true;
  }

  resetRetry() {
    this.retryCount = 0;

    clearTimeout(this.retryTimer as ReturnType<typeof setTimeout>);
    this.retryTimer = null;
  }

  async reset() {
    await TrackPlayer.reset();

    this.isInitialized = false;
    this.currentSource = null;
    this.resetRetry();
  }

  async handleMessage({
    event,
    payload,
  }: {
    event: NativePlayerEvent;
    payload: any;
  }) {
    if (!event) return;

    switch (event) {
      case NATIVE_PLAYER_EVENTS.SET_SOURCE:
        const source: AudioSource = payload;

        const track: Track = {
          id: source.audio.id,
          url: source.audio.url,
          title: source.audio.title,
          duration: source.audio.duration,
          artist: Constants.expoConfig?.name,
          type: TrackType.HLS,
        };

        if (source.audio.thumbnail) {
          track.artwork = source.audio.thumbnail;
        }

        await TrackPlayer.setQueue([]);
        await TrackPlayer.load(track);

        this.currentSource = source;

        break;

      case NATIVE_PLAYER_EVENTS.PLAY:
        await TrackPlayer.play();

        break;

      case NATIVE_PLAYER_EVENTS.PAUSE:
        await TrackPlayer.pause();

        break;

      case NATIVE_PLAYER_EVENTS.SEEK:
        await TrackPlayer.seekTo(payload.time || 0);

        break;

      case NATIVE_PLAYER_EVENTS.SET_LOOP:
        await TrackPlayer.setRepeatMode(
          payload.loop ? RepeatMode.Track : RepeatMode.Off
        );

        break;

      case NATIVE_PLAYER_EVENTS.SET_PLAYBACK_SPEED:
        await TrackPlayer.setRate(payload.speed);

        break;

      case NATIVE_PLAYER_EVENTS.SET_MUTED:
        await TrackPlayer.setVolume(payload.muted ? 0 : 1);

        break;

      case NATIVE_PLAYER_EVENTS.DESTROY:
        await this.reset();

        break;
      default:
        console.log("Unhandled event", event, payload);

        break;
    }
  }

  _setupEventListeners() {
    TrackPlayer.addEventListener(Event.PlaybackState, async (state) => {
      const track = await TrackPlayer.getActiveTrack();

      if (!track) return;

      if ([PLAYER_STATUS.READY, PLAYER_STATUS.PLAYING].includes(state.state)) {
        this.resetRetry();
      }

      this.postMessage({
        event: NATIVE_PLAYER_EVENTS.STATE_UPDATE,
        payload: {
          state:
            // Be explicit about what we are sending
            state.state === State.Playing
              ? PLAYER_STATUS.PLAYING
              : state.state === State.Paused
              ? PLAYER_STATUS.PAUSED
              : state.state === State.Stopped
              ? PLAYER_STATUS.STOPPED
              : state.state === State.Buffering
              ? PLAYER_STATUS.BUFFERING
              : state.state === State.Loading
              ? PLAYER_STATUS.LOADING
              : state.state === State.Ended
              ? PLAYER_STATUS.ENDED
              : state.state === State.Ready
              ? PLAYER_STATUS.READY
              : state.state,
        },
      });

      if (state.state === PLAYER_STATUS.READY) {
        // not playing video goes to ready state after loading/buffering
        const progress = await TrackPlayer.getProgress();

        this.postMessage({
          event: NATIVE_PLAYER_EVENTS.PROGRESS_UPDATE,
          payload: {
            buffered: progress.buffered / progress.duration,
            currentTime: progress.position,
            muted: (await TrackPlayer.getVolume()) === 0,
            source: this.currentSource,
          },
        });
      }
    });

    TrackPlayer.addEventListener(
      Event.PlaybackProgressUpdated,
      async ({ buffered, position }) => {
        const track = await TrackPlayer.getActiveTrack();

        if (!track) return;

        this.postMessage({
          event: NATIVE_PLAYER_EVENTS.PROGRESS_UPDATE,
          payload: {
            buffered: buffered / (track?.duration || 1),
            currentTime: position,
            muted: (await TrackPlayer.getVolume()) === 0,
            source: this.currentSource,
          },
        });
      }
    );

    TrackPlayer.addEventListener(Event.PlaybackError, async (error) => {
      // android-io-network-connection-failed
      if (error?.code?.includes("connection-failed")) {
        const playOnReady = await TrackPlayer.getPlayWhenReady();

        if (playOnReady && this.retryCount < MAX_RETRIES) {
          this.retryTimer = setTimeout(() => {
            TrackPlayer.play();

            this.retryCount++;
          }, 1000 + Math.floor(this.retryCount / 10) * 2000); // every second, then every 3seconds
        }
      }
    });
  }
}
