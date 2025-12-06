'use client';

import { useLocalStorage } from "@/hooks/use-local-storage";
import { AppSettings } from "@/lib/types";
import { Key, Cpu } from "lucide-react";
import { ClientOnly } from "./client-only";

function StatusBarContent() {
    const [settings] = useLocalStorage<AppSettings>('prompt-forge-settings', {
        apiKeys: [],
        activeApiKeyIndex: 0,
        models: {
          analysis: 'gemini-2.5-flash',
          metrics: 'gemini-2.5-flash',
          recommendations: 'gemini-2.5-flash',
          refine: 'gemini-1.5-flash-latest'
        },
      });

    const activeKey = settings.apiKeys?.[settings.activeApiKeyIndex];
    const analysisModel = settings.models.analysis;

    return (
        <div className="flex items-center gap-x-4 gap-y-2 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5" title={`Analysis Model: ${analysisModel}`}>
                <Cpu className="size-3.5" />
                <span>{analysisModel}</span>
            </div>
            <div className="flex items-center gap-1.5" title={`API Key: ${activeKey?.name ?? 'None'}`}>
                <Key className="size-3.5" />
                <span>{activeKey?.name ?? 'No active key'}</span>
            </div>
        </div>
    )
}


export function PromptStatusBar() {
    return (
        <ClientOnly>
            <StatusBarContent />
        </ClientOnly>
    )
}
