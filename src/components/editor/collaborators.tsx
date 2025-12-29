"use client";

import { useEffect, useState } from "react";
import { useOthers } from "@/lib/liveblocks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
];

function getColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

type OtherUser = {
  connectionId: number;
  presence: {
    user?: {
      name?: string;
      avatar?: string;
      color?: string;
    };
  };
};

export function Collaborators() {
  const others = useOthers();
  const [users, setUsers] = useState<OtherUser[]>([]);

  useEffect(() => {
    const userArray = Array.isArray(others) ? others : [...others];
    setUsers(userArray as OtherUser[]);
  }, [others]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map(({ connectionId, presence }) => (
          <Tooltip key={connectionId}>
            <TooltipTrigger asChild>
              <Avatar
                className="h-7 w-7 border-2"
                style={{ borderColor: presence.user?.color || getColorFromId(String(connectionId)) }}
              >
                <AvatarImage src={presence.user?.avatar} />
                <AvatarFallback
                  className="text-xs text-white"
                  style={{ backgroundColor: presence.user?.color || getColorFromId(String(connectionId)) }}
                >
                  {presence.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{presence.user?.name || "Anonymous"}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {users.length > 5 && (
          <Avatar className="h-7 w-7 border-2 border-muted">
            <AvatarFallback className="text-xs bg-muted">
              +{users.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        {users.length} online
      </span>
    </div>
  );
}
