import WorldLoader from "@/components/canvas/WorldLoader";
import Chapter from "@/components/chapters/Chapter";
import Intro from "@/components/chapters/Intro";
import Journey from "@/components/chapters/Journey";
import ScrollHint from "@/components/chapters/ScrollHint";
import CompassNav from "@/components/ui/CompassNav";
import CornerMenu from "@/components/ui/CornerMenu";
import Loader from "@/components/ui/Loader";
import { chapters } from "@/content/chapters";

// The whole journey: one fixed canvas behind, chapters in order on top,
// fixed overlays (intro name mark + flash), corner UI, and the loader over everything.
export default function Home() {
  return (
    <>
      <WorldLoader />
      <Journey>
        <main>
          {chapters.map((chapter) =>
            chapter.id === "intro" ? (
              <Chapter key={chapter.id} chapter={chapter} header={false}>
                <ScrollHint />
              </Chapter>
            ) : (
              <Chapter key={chapter.id} chapter={chapter} />
            ),
          )}
        </main>
      </Journey>
      <Intro />
      <CornerMenu />
      <CompassNav />
      <Loader />
    </>
  );
}
