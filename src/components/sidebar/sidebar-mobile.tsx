import React from "react";
import { LayoutGrid, Menu, Trash2, User2 } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { useAppState } from "@/hooks/use-app-state";
import { Logo } from "../icons";
import { SignOut } from "../sign-out";
import { Trash } from "../trash";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ThemeToggleGroup } from "../site-footer/theme-toggle-group";
import { Workspaces } from "../workspaces";
import { Folders } from "./folders";
import { NavDialog } from "./nav-dialog";

type NavItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  content: React.FC;
};

const navItems: NavItem[] = [
  {
    title: "My Workspaces",
    description: "Manage your workspaces",
    icon: LayoutGrid,
    content: Workspaces,
  },
  {
    title: "Trash",
    description: "Manage your trash",
    icon: Trash2,
    content: Trash,
  },
];

export function SidebarMobile() {
  const { user } = useAppState();

  return (
    <Sheet>
      <SheetTrigger className="lg:hidden">
        <Menu className="mr-2 size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Mobile navigation sidebar</SheetDescription>
        </SheetHeader>
        <div className="flex h-full flex-col gap-2">
          {/* Header */}
          <div className="flex items-center gap-2 border-b p-4">
            <Logo size={32} className="shrink-0" />
            <span className="font-handwriting text-xl font-medium lowercase">
              {siteConfig.name}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 px-4">
            {navItems.map(({ title, description, icon, content: Content }) => (
              <NavDialog
                key={title}
                title={title}
                icon={icon}
                description={description}
              >
                <Content />
              </NavDialog>
            ))}
          </nav>

          <Separator />

          {/* Folders */}
          <div className="flex-1 overflow-auto">
            <Folders />
          </div>

          <Separator />

          {/* User Info & Actions */}
          <div className="border-t p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback>
                  <User2 className="size-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-medium">
                  {user?.name ?? "Update your profile"}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggleGroup />
            </div>

            <div className="mt-4">
              <SignOut
                variant="outline"
                className="w-full"
              >
                Sign Out
              </SignOut>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
