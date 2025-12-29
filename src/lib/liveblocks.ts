"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    name: string;
    avatar: string;
    color: string;
  };
};

type RoomEvent = {
  type: "TITLE_UPDATE" | "ICON_UPDATE";
  value: string;
};

export const {
  RoomProvider,
  useOthers,
  useMyPresence,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, never, never, RoomEvent>(client);
