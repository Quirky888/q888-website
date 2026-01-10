import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface CenterRevealOptions {
  trigger: Element;
  targets: Element[] | NodeListOf<Element>;
  minOpacity?: number;
  maxOpacity?: number;
  maxBlur?: number;
}

export function createCenterReveal({
  trigger,
  targets,
  minOpacity = 0.05,
  maxOpacity = 1,
  maxBlur = 2
}: CenterRevealOptions) {
  gsap.set(targets, { opacity: minOpacity, filter: `blur(${maxBlur}px)` });

  ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const dist = Math.abs(self.progress - 0.5) / 0.5;
      const t = 1 - Math.min(1, dist);
      const opacity = minOpacity + t * (maxOpacity - minOpacity);
      const blur = maxBlur - t * maxBlur;
      gsap.set(targets, { opacity, filter: `blur(${blur}px)` });
    }
  });
}
