import { LandingArchitecture } from "../ui/landing-architecture";
import { LandingCapabilities } from "../ui/landing-capabilities";
import { LandingFooter } from "../ui/landing-footer";
import { LandingHero } from "../ui/landing-hero";
import { LandingNav } from "../ui/landing-nav";
import { LandingProof } from "../ui/landing-proof";
import { LandingStack } from "../ui/landing-stack";
import { LandingStart } from "../ui/landing-start";
import { LandingSurfaces } from "../ui/landing-surfaces";
import { ScrollToTop } from "../ui/scroll-to-top";

export function LandingView() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />
      <LandingHero />
      <LandingProof />
      <LandingSurfaces />
      <LandingCapabilities />
      <LandingArchitecture />
      <LandingStack />
      <LandingStart />
      <ScrollToTop />
      <LandingFooter />
    </div>
  );
}
