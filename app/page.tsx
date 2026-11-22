import WorldLoader from "@/components/canvas/WorldLoader";
import Chapter from "@/components/chapters/Chapter";
import Journey from "@/components/chapters/Journey";
import NameMark from "@/components/chapters/NameMark";
import CompassNav from "@/components/ui/CompassNav";
import CornerMenu from "@/components/ui/CornerMenu";
import { chapters } from "@/content/chapters";

// The whole journey: one fixed canvas behind, chapters in order on top.
export default function Home() {
  return (
    <>
      <WorldLoader />
      <Journey>
        <main>
          {chapters.map((chapter) => (
            <Chapter key={chapter.id} chapter={chapter}>
              {chapter.id === "intro" && <NameMark />}
            </Chapter>
          ))}
        </main>
      </Journey>
      <CornerMenu />
      <CompassNav />
    </>
  );
}
