import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

/**
 * Realtime của API .NET (thay Supabase Realtime từ 01/11/2026): hub SignalR `/api/realtime`, cùng giao thức web
 * `realtimeShim.ts` — gọi `Join(ref, topic, { private, self })` / `Leave(ref)` / `Broadcast(ref, event, payload)`,
 * nhận `broadcast(topic, isPrivate, event, payload)`.
 * App khách chỉ nghe kênh công khai `chatv:*` → luôn xác thực bằng anon key.
 * Chỉ dùng WebSocket, bỏ bước negotiate (không đi qua `expo/fetch` của SDK 57).
 */

interface Listener {
  onBroadcast: (event: string, payload: unknown) => void;
  onStatus: (live: boolean) => void;
}

interface Topic {
  name: string;
  isPrivate: boolean;
  /** `ref` của lần Join trên kết nối hiện tại; `null` khi chưa vào kênh. */
  ref: string | null;
  listeners: Set<Listener>;
}

export interface HubChannel {
  send: (event: string, payload: unknown) => void;
  close: () => void;
}

const keyOf = (name: string, isPrivate: boolean) => `${isPrivate ? 'p' : 'c'}:${name}`;

/** Mỗi topic chỉ Join một lần trên server, nhiều nơi nghe dùng chung (đếm tham chiếu). */
const topics = new Map<string, Topic>();
let conn: HubConnection | null = null;
let starting: Promise<void> | null = null;
let refSeq = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function setLive(t: Topic, live: boolean) {
  if (!live) t.ref = null;
  t.listeners.forEach((l) => l.onStatus(live));
}

async function join(c: HubConnection, t: Topic) {
  const ref = `r${++refSeq}`;
  try {
    const res: unknown = await c.invoke('Join', ref, t.name, { private: t.isPrivate, self: false });
    const ok = typeof res === 'object' && res !== null && (res as { ok?: unknown }).ok === true;
    // Đã đóng / kết nối đã đổi trong lúc chờ → rời kênh vừa vào.
    if (topics.get(keyOf(t.name, t.isPrivate)) !== t || conn !== c) {
      if (ok) void c.invoke('Leave', ref).catch(() => undefined);
      return;
    }
    if (!ok && __DEV__) console.log(`[realtime] Join ${t.name}`, (res as { error?: unknown } | null)?.error);
    if (ok) t.ref = ref;
    setLive(t, ok);
  } catch {
    setLive(t, false);
  }
}

function scheduleRetry() {
  if (retryTimer || !topics.size) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void connect();
  }, 5000);
}

function connect(): Promise<void> {
  if (starting) return starting;
  const c = new HubConnectionBuilder()
    .withUrl(`${SUPABASE_URL}/api/realtime`, {
      accessTokenFactory: () => SUPABASE_ANON_KEY,
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: (r) => Math.min(30_000, 1000 * 2 ** r.previousRetryCount) })
    .configureLogging(LogLevel.None)
    .build();
  c.on('broadcast', (topic: string, isPrivate: boolean, event: string, payload: unknown) => {
    topics.get(keyOf(topic, isPrivate))?.listeners.forEach((l) => l.onBroadcast(event, payload));
  });
  c.onreconnecting(() => topics.forEach((t) => setLive(t, false)));
  c.onreconnected(() => topics.forEach((t) => void join(c, t)));
  // Server đóng hẳn (không tự nối lại được) → nối lại từ đầu nếu còn kênh đang nghe.
  c.onclose(() => {
    if (conn !== c) return;
    conn = null;
    starting = null;
    topics.forEach((t) => setLive(t, false));
    scheduleRetry();
  });
  conn = c;
  starting = c.start().then(
    () => {
      if (conn === c) topics.forEach((t) => void join(c, t));
    },
    () => {
      if (conn !== c) return;
      conn = null;
      starting = null;
      scheduleRetry();
    },
  );
  return starting;
}

/**
 * Nghe một kênh. `onStatus(true)` khi đã vào kênh (false khi rớt / bị từ chối); tự vào lại sau khi nối lại.
 * `send` chỉ gửi khi đã vào kênh.
 */
export function joinChannel(
  name: string,
  opts: { private?: boolean },
  onBroadcast: Listener['onBroadcast'],
  onStatus: Listener['onStatus'] = () => undefined,
): HubChannel {
  const isPrivate = !!opts.private;
  const key = keyOf(name, isPrivate);
  const listener: Listener = { onBroadcast, onStatus };
  let t = topics.get(key);
  if (!t) {
    t = { name, isPrivate, ref: null, listeners: new Set() };
    topics.set(key, t);
    t.listeners.add(listener);
    if (conn?.state === HubConnectionState.Connected) void join(conn, t);
    else void connect();
  } else {
    t.listeners.add(listener);
    if (t.ref) onStatus(true);
  }
  const topic = t;
  let open = true;
  return {
    send: (event, payload) => {
      if (open && topic.ref && conn?.state === HubConnectionState.Connected) {
        void conn.invoke('Broadcast', topic.ref, event, payload).catch(() => undefined);
      }
    },
    close: () => {
      if (!open) return;
      open = false;
      topic.listeners.delete(listener);
      if (topic.listeners.size) return;
      topics.delete(key);
      if (topic.ref && conn?.state === HubConnectionState.Connected) void conn.invoke('Leave', topic.ref).catch(() => undefined);
      topic.ref = null;
      // Không còn kênh nào → đóng kết nối (đỡ pin khi rời màn chat).
      if (!topics.size && conn) {
        const c = conn;
        conn = null;
        starting = null;
        void c.stop();
      }
    },
  };
}
