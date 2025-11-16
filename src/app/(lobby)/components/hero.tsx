"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden text-center"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-background via-background to-muted/20" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="container mx-auto flex max-w-5xl flex-col items-center gap-8">
        <div className="group relative inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm backdrop-blur-sm transition-all hover:scale-105">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">New: Rich Text Editor with BlockNote</span>
        </div>

        <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Your notes,
          <br />
          organized beautifully
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          A modern note-taking app that helps you capture ideas, organize thoughts, and
          collaborate seamlessly. Built for speed, designed for simplicity.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group gap-2 text-lg shadow-lg transition-all hover:scale-105"
            )}
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "text-lg transition-all hover:scale-105"
            )}
          >
            Create Account
          </Link>
        </div>

        <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span>Unlimited pages</span>
          </div>
        </div>
      </div>
    </section>
  );
}
