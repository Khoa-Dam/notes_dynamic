"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react";
import "@blocknote/mantine/style.css";

interface CollaborativeEditorProps {
  initialContentString?: string;
  onChange: (content: string) => void;
  editable: boolean;
  theme: "light" | "dark";
  userName: string;
  userColor: string;
}

export default function CollaborativeEditor({
  initialContentString,
  onChange,
  editable,
  theme,
  userName,
  userColor,
}: CollaborativeEditorProps) {
  const room = useRoom();
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<LiveblocksYjsProvider | null>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Create Yjs doc and provider once
    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new LiveblocksYjsProvider(room, doc);
    providerRef.current = provider;

    // Create editor immediately with collaboration
    const newEditor = BlockNoteEditor.create({
      collaboration: {
        provider,
        fragment: doc.getXmlFragment("document"),
        user: {
          name: userName,
          color: userColor,
        },
      },
    });
    
    setEditor(newEditor);

    // Wait for sync then initialize content if needed
    const handleSync = (synced: boolean) => {
      if (!synced || !mountedRef.current) return;
      
      const fragment = doc.getXmlFragment("document");
      
      // Only initialize if document is empty and we have initial content
      if (fragment.length === 0 && initialContentString) {
        try {
          const parsed = JSON.parse(initialContentString);
          if (Array.isArray(parsed) && parsed.length > 0) {
            newEditor.replaceBlocks(newEditor.document, parsed as PartialBlock[]);
          }
        } catch {
          // ignore parse errors
        }
      }
    };

    provider.on("sync", handleSync);
    
    // Check if already synced
    if (provider.synced) {
      handleSync(true);
    }

    return () => {
      mountedRef.current = false;
      provider.off("sync", handleSync);
      provider.destroy();
      doc.destroy();
    };
  }, [room, userName, userColor]); // Only depend on room, not on userName/userColor/initialContentString

  // Handle content changes
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      onChange(JSON.stringify(editor.document));
    };

    editor.onChange(handleChange);
  }, [editor, onChange]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <BlockNoteView editor={editor} theme={theme} editable={editable} />
    </div>
  );
}
