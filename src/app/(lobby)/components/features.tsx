"use client";

import { CheckCircle2, Layers, Lock, Moon, Palette, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Nested Organization",
    description: "Create folders within folders. Organize your notes exactly how your mind works.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with Next.js for instant page loads and smooth interactions.",
  },
  {
    icon: Palette,
    title: "Customizable",
    description: "Personalize your workspace with custom icons, headers, and themes.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is encrypted and stored securely. Privacy is our priority.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Beautiful dark mode that's easy on your eyes, day or night.",
  },
  {
    icon: CheckCircle2,
    title: "Always Free",
    description: "No subscriptions, no limits. All features available forever.",
  },
];

export function Features() {
  return (
    <section id="features" className="space-y-12 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Powerful features, simple interface
        </h2>
        <p className="max-w-[85%] text-lg text-muted-foreground">
          Everything you need to take notes, organize ideas, and stay productive
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <Card
              key={i}
              className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
