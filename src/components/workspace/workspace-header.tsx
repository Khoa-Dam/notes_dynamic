"use client";

import React from "react";

import type { Workspace } from "@/types/db";

import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
    workspace: Workspace;
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {

    return (
        <div
            className={cn(
                "relative w-full overflow-hidden border-b-2",
                workspace.bannerUrl && "min-h-[200px]"
            )}
        >
            {/* Background Image */}
            {workspace.bannerUrl && (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url(${workspace.bannerUrl})`,
                    }}
                >
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}

            {/* Header Content */}
            <div
                className={cn(
                    "relative flex items-center gap-4 p-6",
                    workspace.bannerUrl && "min-h-[200px]"
                )}
            >
                {/* Workspace Info */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">
                        Workspace {workspace.title}
                    </h1>
                </div>
            </div>
        </div>
    );
}

