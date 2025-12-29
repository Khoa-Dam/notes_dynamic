"use client";

import React from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { RoomProvider } from "@/lib/liveblocks";

const CollaborativeEditor = dynamic(
  () => import("./collaborative-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    ),
  }
);

const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface CollaborativeFileEditorProps {
  fileId: string;
  content: string | null;
  onContentChange: (content: string) => void;
  editable?: boolean;
  userName?: string;
  userAvatar?: string;
}

export function CollaborativeFileEditor({
  fileId,
  content,
  onContentChange,
  editable = true,
  userName = "Anonymous",
  userAvatar,
}: CollaborativeFileEditorProps) {
  const userColor = React.useMemo(() => getRandomColor(), []);
  const roomId = `file-${fileId}`;
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        user: { name: userName, avatar: userAvatar || "", color: userColor },
      }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex-1 overflow-auto">
          <CollaborativeEditor
            initialContentString={content || ""}
            onChange={onContentChange}
            editable={editable}
            theme={theme}
            userName={userName}
            userColor={userColor}
          />
        </div>
      </div>
    </RoomProvider>
  );
}

export { Collaborators } from "./collaborators";
