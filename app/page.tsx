import WorldLoader from "@/components/canvas/WorldLoader";
import Chapter from "@/components/chapters/Chapter";
import About from "@/components/chapters/About";
import Constellation from "@/components/chapters/Constellation";
import Contact from "@/components/chapters/Contact";
import Descent from "@/components/chapters/Descent";
import Ending from "@/components/chapters/Ending";
import Education from "@/components/chapters/Education";
import Intro from "@/components/chapters/Intro";
import Journey from "@/components/chapters/Journey";
import Projects from "@/components/chapters/Projects";
import VoidVeil from "@/components/chapters/VoidVeil";
import ScrollHint from "@/components/chapters/ScrollHint";
import BlueprintHud from "@/components/ui/BlueprintHud";
import CompassNav from "@/components/ui/CompassNav";
import CornerMenu from "@/components/ui/CornerMenu";
import GameControls from "@/components/ui/GameControls";
import Loader from "@/components/ui/Loader";
import { chapters } from "@/content/chapters";

// The whole journey: one fixed canvas behind, chapter overlays that sit under the scroll
// content (blueprint HUD), the chapters in order, fixed overlays on top (intro name mark +
// flash), corner UI, and the loader over everything.
export default function Home() {
  return (
    <>
      <WorldLoader />
      <BlueprintHud />
      <Journey>
        <main>
          {chapters.map((chapter) => {
            if (chapter.id === "intro") {
              return (
                <Chapter key={chapter.id} chapter={chapter} header={false}>
                  <ScrollHint />
                </Chapter>
              );
            }
            if (chapter.id === "projects") {
              return (
                <Chapter key={chapter.id} chapter={chapter} header={false}>
                  <Projects chapter={chapter} />
                </Chapter>
              );
            }
            if (chapter.id === "education") {
              return (
                <Chapter key={chapter.id} chapter={chapter} header={false}>
                  <Education chapter={chapter} />
                </Chapter>
              );
            }
            if (chapter.id === "about") {
              return (
                <Chapter key={chapter.id} chapter={chapter} header={false}>
                  <About chapter={chapter} />
                </Chapter>
              );
            }
            if (chapter.id === "contact") {
              return (
                <Chapter key={chapter.id} chapter={chapter} header={false}>
                  <Contact chapter={chapter} />
                </Chapter>
              );
            }
            return <Chapter key={chapter.id} chapter={chapter} />;
          })}
        </main>
      </Journey>
      <VoidVeil />
      <Intro />
      <Constellation />
      <Descent />
      <Ending />
      <CornerMenu />
      <CompassNav />
      <GameControls />
      <Loader />
    </>
  );
}
