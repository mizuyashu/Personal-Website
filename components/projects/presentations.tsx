import type { ReactNode } from "react";
import WebsiteProject, { WebsiteEmblem } from "@/components/projects/website/WebsiteProject";
import SummerBuild, { SummerBuildEmblem } from "@/components/projects/summer-build/SummerBuild";

// Each project owns its presentation (components/projects/<id>/): used on the journey (the
// project panels, the deck) and on the project's own page (app/projects/[id]).
export const presentations: Record<string, { body: ReactNode; emblem: ReactNode }> = {
  website: { body: <WebsiteProject />, emblem: <WebsiteEmblem /> },
  "summer-build": { body: <SummerBuild />, emblem: <SummerBuildEmblem /> },
};
