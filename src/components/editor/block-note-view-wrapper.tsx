"use client";

import React, { useCallback, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css";

interface BlockNoteViewWrapperProps {
  initialContentString?: string;
  onChange: (content: string) => void;
  editable: boolean;
  theme: "light" | "dark";
  onContentChange?: (content: string) => void;
}

export default function BlockNoteViewWrapper({
  initialContentString,
  onChange,
  editable,
  theme,
}: BlockNoteViewWrapperProps) {
  const parseInitialContent = (): PartialBlock[] | undefined => {
    if (!initialContentString || initialContentString === "") return undefined;
    try {
      const parsed = JSON.parse(initialContentString);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  const editor = useCreateBlockNote({
    initialContent: parseInitialContent(),
  });

  const handleChange = useCallback(() => {
    if (!editor) return;
    const blocks = editor.document;
    onChange(JSON.stringify(blocks));
  }, [editor, onChange]);

  useEffect(() => {
    if (editor) {
      editor.onChange(handleChange);
    }
  }, [editor, handleChange]);

  return (
    <div className="h-full w-full">
      <BlockNoteView editor={editor} theme={theme} editable={editable} />
    </div>
  );
}
