"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type DevtoolsComponent = ComponentType;

export const Devtools: DevtoolsComponent =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (m) => m.ReactQueryDevtools
          ),
        { ssr: false }
      )
    : () => null;