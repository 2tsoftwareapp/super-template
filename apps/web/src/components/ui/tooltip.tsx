"use client";

import {
  TooltipContent,
  TooltipProvider,
  Tooltip as TooltipRoot,
  TooltipTrigger,
} from "@repo/web-core/components/tooltip";
import * as React from "react";

interface TooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

function Tooltip({ children, content, side = "top" }: TooltipProps) {
  if (content === undefined) {
    return <TooltipRoot>{children}</TooltipRoot>;
  }

  const trigger = React.isValidElement(children) ? (
    children
  ) : (
    <span>{children}</span>
  );

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger render={trigger} />
        <TooltipContent side={side}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
