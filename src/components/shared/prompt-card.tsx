import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Prompt } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import React from "react"

interface PromptCardProps {
  prompt: Prompt
  actions: React.ReactNode
  isCommunity?: boolean
}

export function PromptCard({ prompt, actions, isCommunity = false }: PromptCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline">{prompt.name}</CardTitle>
        <CardDescription>
          {isCommunity ? "Community Prompt" : `Created ${formatDistanceToNow(new Date(prompt.createdAt), {
            addSuffix: true,
          })}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {prompt.text}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">{actions}</CardFooter>
    </Card>
  )
}
