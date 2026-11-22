"use client";

// The one place GSAP plugins are registered. Import gsap and plugins from here.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, useGSAP);

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
