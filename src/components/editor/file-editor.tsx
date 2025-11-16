"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockNoteEditor } from "@/components/editor/block-note-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/emoji-picker";
import { updateFile, deleteFile } from "@/lib/db/queries";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useAppState } from "@/hooks/use-app-state";
import type { File } from "@/types/db";

interface FileEditorProps {
  file: File;
  workspaceId: string;
}

export function FileEditor({ file, workspaceId }: FileEditorProps) {
  const router = useRouter();
  const {
    deleteFile: removeFileFromState,
    updateFile: updateFileInState,
    files,
  } = useAppState();

  // Get the latest file from state, fallback to prop
  const currentFile = files.find((f) => f.id === file.id) || file;

  const [title, setTitle] = useState(currentFile.title);
  const [content, setContent] = useState(currentFile.data || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Prevent format changes for icon and header blocks - preserve existing format
  const preserveFormatForIconAndHeader = useCallback((contentString: string): string => {
    try {
      if (!contentString) return contentString;

      const blocks = JSON.parse(contentString);
      if (!Array.isArray(blocks) || blocks.length === 0) return contentString;

      // Preserve format for first block (icon) - only allow text changes, keep existing format
      if (blocks[0]?.type === "paragraph" && blocks[0]?.content) {
        // Extract text only (remove any new formatting)
        const iconText = blocks[0].content
          .map((item: any) => item.text || "")
          .join("")
          .trim();

        // Keep existing props but ensure default formatting
        blocks[0] = {
          ...blocks[0],
          props: {
            ...blocks[0].props,
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: iconText
            ? [
              {
                type: "text",
                text: iconText,
                styles: {}, // No formatting allowed
              },
            ]
            : [],
        };
      }

      // Preserve format for second block (header) - only allow text changes, keep existing format
      if (blocks[1]?.type === "heading" && blocks[1]?.content) {
        // Extract text only (remove any new formatting)
        const headerText = blocks[1].content
          .map((item: any) => item.text || "")
          .join("")
          .trim();

        // Keep existing props but ensure default formatting
        blocks[1] = {
          ...blocks[1],
          props: {
            ...blocks[1].props,
            level: blocks[1].props?.level || 1,
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: headerText
            ? [
              {
                type: "text",
                text: headerText,
                styles: {}, // No formatting allowed
              },
            ]
            : [],
        };
      } else if (blocks[0]?.type === "heading" && blocks[0]?.content) {
        // If first block is heading, preserve its format
        const headerText = blocks[0].content
          .map((item: any) => item.text || "")
          .join("")
          .trim();

        blocks[0] = {
          ...blocks[0],
          props: {
            ...blocks[0].props,
            level: blocks[0].props?.level || 1,
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: headerText
            ? [
              {
                type: "text",
                text: headerText,
                styles: {}, // No formatting allowed
              },
            ]
            : [],
        };
      }

      return JSON.stringify(blocks);
    } catch {
      return contentString;
    }
  }, []);

  // Helper function to extract icon and header from content
  const extractIconAndHeader = useCallback((contentString: string): { icon: string; header: string } => {
    try {
      if (!contentString) return { icon: "📄", header: "New page" };

      const blocks = JSON.parse(contentString);
      if (!Array.isArray(blocks) || blocks.length === 0) {
        return { icon: "📄", header: "New page" };
      }

      // Extract icon from first block (paragraph) if it's a single emoji
      let icon = "📄";
      if (blocks[0]?.type === "paragraph" && blocks[0]?.content?.[0]?.text) {
        const firstText = blocks[0].content[0].text.trim();
        // Check if it's a single emoji (rough check - emojis are usually 1-2 characters in JS)
        if (firstText.length <= 4 && /[\p{Emoji}]/u.test(firstText)) {
          icon = firstText;
        }
      }

      // Extract header from second block (heading) if it exists
      let header = "New page";
      if (blocks[1]?.type === "heading" && blocks[1]?.content?.[0]?.text) {
        header = blocks[1].content[0].text.trim() || "New page";
      } else if (blocks[0]?.type === "heading" && blocks[0]?.content?.[0]?.text) {
        // If first block is heading, use it
        header = blocks[0].content[0].text.trim() || "New page";
      }

      return { icon, header };
    } catch {
      return { icon: "📄", header: "New page" };
    }
  }, []);

  // Update local state when file changes in AppState
  useEffect(() => {
    setTitle(currentFile.title);
    setContent(currentFile.data || "");
  }, [currentFile.title, currentFile.data]);

  const debouncedContent = useDebounce(content, 1000);
  const debouncedTitle = useDebounce(title, 1000);

  // Extract icon and header from content and update title/iconId
  useEffect(() => {
    if (!debouncedContent) return;

    const { icon, header } = extractIconAndHeader(debouncedContent);

    // Only update if icon or header changed
    if (icon !== currentFile.iconId || header !== currentFile.title) {
      setTitle(header);
    }
  }, [debouncedContent, extractIconAndHeader, currentFile.iconId, currentFile.title]);

  // Get current icon from content
  const currentIcon = extractIconAndHeader(content).icon;

  // Handle icon change
  const handleIconChange = useCallback((newIcon: string) => {
    try {
      if (!content) {
        // If no content, create initial content with new icon
        const initialBlocks = [
          {
            id: crypto.randomUUID(),
            type: "paragraph" as const,
            props: {
              textColor: "default",
              backgroundColor: "default",
              textAlignment: "left",
            },
            content: [
              {
                type: "text",
                text: newIcon,
                styles: {},
              },
            ],
            children: [],
          },
          {
            id: crypto.randomUUID(),
            type: "heading" as const,
            props: {
              level: 1,
              textColor: "default",
              backgroundColor: "default",
              textAlignment: "left",
            },
            content: [
              {
                type: "text",
                text: title || "New page",
                styles: {},
              },
            ],
            children: [],
          },
        ];
        setContent(JSON.stringify(initialBlocks));
        return;
      }

      const blocks = JSON.parse(content);
      if (!Array.isArray(blocks) || blocks.length === 0) return;

      // Update first block (icon block)
      if (blocks[0]?.type === "paragraph") {
        blocks[0] = {
          ...blocks[0],
          content: [
            {
              type: "text",
              text: newIcon,
              styles: {},
            },
          ],
        };
      } else {
        // If first block is not paragraph, insert new paragraph at the beginning
        blocks.unshift({
          id: crypto.randomUUID(),
          type: "paragraph" as const,
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: [
            {
              type: "text",
              text: newIcon,
              styles: {},
            },
          ],
          children: [],
        });
      }

      setContent(JSON.stringify(blocks));
    } catch (error) {
      console.error("Failed to update icon:", error);
    }
  }, [content, title]);

  const handleSave = useCallback(
    async (newTitle: string, newContent: string) => {
      // Extract icon and header from content
      const { icon, header } = extractIconAndHeader(newContent);

      // Use extracted header if content changed, otherwise use newTitle
      const finalTitle = newContent !== (currentFile.data || "") ? header : newTitle;
      const finalIcon = newContent !== (currentFile.data || "") ? icon : currentFile.iconId;

      if (finalTitle === currentFile.title && finalIcon === currentFile.iconId && newContent === (currentFile.data || ""))
        return;

      setIsSaving(true);
      try {
        const updatedFile = {
          ...currentFile,
          title: finalTitle,
          iconId: finalIcon,
          data: newContent,
        };
        const savedFile = await updateFile(updatedFile);
        // Update store with server data (includes any server-side updates)
        updateFileInState(savedFile);
        setLastSaved(new Date());
      } catch (error) {
        toast.error("Failed to save file");
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    },
    [currentFile, updateFileInState, extractIconAndHeader]
  );

  useEffect(() => {
    if (
      debouncedTitle !== currentFile.title ||
      debouncedContent !== currentFile.data
    ) {
      handleSave(debouncedTitle, debouncedContent);
    }
  }, [
    debouncedTitle,
    debouncedContent,
    currentFile.title,
    currentFile.data,
    handleSave,
  ]);

  const handleDelete = async () => {
    try {
      await deleteFile(file.id!);
      removeFileFromState(file.id!);
      toast.success("File deleted successfully");
      router.push(`/dashboard/${workspaceId}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete file");
      console.error(error);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${workspaceId}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-md border-none text-lg font-semibold focus-visible:ring-0"
            placeholder="Untitled"
          />
        </div>

        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-sm text-muted-foreground">Saving...</span>
          ) : lastSaved ? (
            <span className="text-sm text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-2">
            <EmojiPicker
              getValue={handleIconChange}
              side="bottom"
              align="start"
            >
              <Button
                variant="outline"
                size="lg"
                className="h-16 w-16 border-none text-4xl hover:bg-accent"
              >
                {currentIcon}
              </Button>
            </EmojiPicker>

          </div>
          <BlockNoteEditor
            initialContent={content}
            onChange={(newContent) => {
              // Preserve format for icon and header blocks - remove any formatting changes
              const normalized = preserveFormatForIconAndHeader(newContent);
              setContent(normalized);
            }}
            editable={true}
          />
        </div>
      </div>
    </div>
  );
}
