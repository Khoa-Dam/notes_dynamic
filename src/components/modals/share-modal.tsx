"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  getUserByEmail,
} from "@/lib/db/queries/collaborator";
import { useOrigin } from "@/hooks/use-origin";

interface ShareModalProps {
  workspaceId: string;
  fileId: string;
  ownerId?: string;
}

type CollaboratorWithUser = {
  id: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function ShareModal({ workspaceId, fileId, ownerId }: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorWithUser[]>(
    []
  );
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();

  const shareUrl = `${origin}/dashboard/${workspaceId}/${fileId}`;

  useEffect(() => {
    if (open) {
      loadCollaborators();
    }
  }, [open, workspaceId]);

  const loadCollaborators = async () => {
    const result = await getCollaborators(workspaceId);
    setCollaborators(result as CollaboratorWithUser[]);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email
      const user = await getUserByEmail(email.trim());

      if (!user) {
        toast.error("User not found. They need to sign up first.");
        return;
      }

      if (user.id === ownerId) {
        toast.error("Cannot add workspace owner as collaborator");
        return;
      }

      const result = await addCollaborator(workspaceId, user.id);

      if (result.success) {
        toast.success("Collaborator added successfully");
        setEmail("");
        loadCollaborators();
      } else {
        toast.error(result.error || "Failed to add collaborator");
      }
    } catch (error) {
      toast.error("Failed to invite collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const result = await removeCollaborator(workspaceId, userId);

      if (result.success) {
        toast.success("Collaborator removed");
        loadCollaborators();
      } else {
        toast.error(result.error || "Failed to remove collaborator");
      }
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this document</DialogTitle>
          <DialogDescription>
            Invite collaborators to edit this document together in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="flex-1 text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator />

          {/* Invite by Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite by email</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                disabled={isLoading}
              />
              <Button onClick={handleInvite} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Collaborators List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Collaborators ({collaborators.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No collaborators yet. Invite someone to start collaborating!
                </p>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collab.user.image || undefined} />
                        <AvatarFallback>
                          {collab.user.name?.charAt(0) ||
                            collab.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {collab.user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {collab.user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(collab.userId)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
