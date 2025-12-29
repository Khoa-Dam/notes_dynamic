
"use client";

import { QuickCreateModal } from "@/components/modals/quick-create-modal";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function QuickCreateProvider() {
    const isMounted = useIsMounted();

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <QuickCreateModal />
        </>
    );
}
