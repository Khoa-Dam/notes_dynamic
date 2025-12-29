'use client'

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable'
import { useAppState } from '@/hooks/use-app-state'
import { Panel } from './panel'
import { cn } from '@/lib/utils'

export function SplitLayout() {
  const {
    isSplitView,
    leftPanelFileId,
    rightPanelFileId,
    focusedPanel,
    setFocusedPanel
  } = useAppState()

  if (isSplitView) {
    return (
      <ResizablePanelGroup
        direction='horizontal'
        className='h-full max-h-full w-full'
      >
        <ResizablePanel
          defaultSize={50}
          minSize={20}
          onClick={() => setFocusedPanel('left')}
        >
          <Panel
            fileId={leftPanelFileId}
            isFocused={focusedPanel === 'left'}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={50}
          minSize={20}
          onClick={() => setFocusedPanel('right')}
        >
          <Panel
            fileId={rightPanelFileId}
            isFocused={focusedPanel === 'right'}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // If not in split view, show only the left panel's file (or right, if left is empty)
  const fileId = leftPanelFileId || rightPanelFileId
  return (
    <div
      className={cn(
        'h-full w-full',
        // The single panel is always considered focused
        'ring-2 ring-primary/50 rounded-lg'
      )}
    >
      <Panel fileId={fileId} isFocused={true} />
    </div>
  )
}
