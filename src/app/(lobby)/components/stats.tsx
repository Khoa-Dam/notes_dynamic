"use client";

import { FileText, Folder, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
    {
        icon: FileText,
        value: "Unlimited",
        label: "Pages",
        description: "Create as many pages as you need",
    },
    {
        icon: Folder,
        value: "∞",
        label: "Folders",
        description: "Organize with unlimited nesting",
    },
    {
        icon: Zap,
        value: "Real-time",
        label: "Sync",
        description: "Instant updates across devices",
    },
    {
        icon: Users,
        value: "100%",
        label: "Free",
        description: "No hidden costs, ever",
    },
];

export function Stats() {
    return (
        <section id="stats" className="border-y bg-muted/50 py-12">
            <div className="container mx-auto">
                <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={i} className="border-0 bg-background/50 backdrop-blur-sm">
                                <CardContent className="flex flex-col items-center space-y-2 p-6 text-center">
                                    <div className="rounded-full bg-primary/10 p-3">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                    <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
                                    <div className="text-xs text-muted-foreground">{stat.description}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

