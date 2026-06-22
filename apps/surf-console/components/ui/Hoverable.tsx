"use client";

/**
 * Hoverable.tsx — polymorphic wrapper that applies a hover style via JS.
 * Prefer CSS hover utility classes from globals.css where they already exist.
 * Use this only when no matching utility class covers the case.
 */

import React, { useState } from "react";

type HoverableProps<T extends React.ElementType> = {
  as?: T;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "style" | "hoverStyle" | "children">;

export default function Hoverable<T extends React.ElementType = "div">({
  as,
  style,
  hoverStyle,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: HoverableProps<T>) {
  const [hovered, setHovered] = useState(false);
  const Tag = (as ?? "div") as React.ElementType;

  return (
    <Tag
      style={{ ...style, ...(hovered && hoverStyle ? hoverStyle : {}) }}
      onMouseEnter={(e: React.MouseEvent) => {
        setHovered(true);
        if (typeof onMouseEnter === "function") onMouseEnter(e);
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        setHovered(false);
        if (typeof onMouseLeave === "function") onMouseLeave(e);
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
