import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./index.css"; // <-- styles moved here

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  "Silence",
  "Meditation",
  "Intuition",
  "Authenticity",
  "Presence",
  "Listening",
  "Curiosity",
  "Patience",
  "Surrender",
  "Simplicity"
];

const CATEGORIES = [
  "Reduction",
  "Essence",
  "Space",
  "Resonance",
  "Truth",
  "Feeling",
  "Clarity",
  "Emptiness",
  "Awareness",
  "Minimalism"
];

const BACKGROUNDS = [
  "https://assets.codepen.io/7558/flame-glow-blur-001.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-002.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-003.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-004.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-005.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-006.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-007.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-008.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-009.jpg",
  "https://assets.codepen.io/7558/flame-glow-blur-010.jpg"
];

// Lightweight SoundManager used in the original
class SoundManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = false;
  }

  load(name, url, volume = 0.3) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = volume;
    this.sounds[name] = audio;
  }

  enable() {
    this.isEnabled = true;
  }

  play(name, delay = 0) {
    if (!this.isEnabled) return;
    const s = this.sounds[name];
    if (!s) return;
    if (delay > 0) return setTimeout(() => this.play(name, 0), delay);
    s.currentTime = 0;
    s.play().catch(() => {});
  }
}

export default function App() {
  const containerRef = useRef(null);
  const fixedContainerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);
  const lenisRef = useRef(null);
  const sectionPositionsRef = useRef([]);
  const isSnappingRef = useRef(false);
  const soundRef = useRef(null);

  // prepare sound manager
  useEffect(() => {
    soundRef.current = new SoundManager();
    soundRef.current.load("hover", "https://assets.codepen.io/7558/click-reverb-001.mp3", 0.15);
    soundRef.current.load("click", "https://assets.codepen.io/7558/shutter-fx-001.mp3", 0.3);
    soundRef.current.load("textChange", "https://assets.codepen.io/7558/whoosh-fx-001.mp3", 0.3);
  }, []);

  useEffect(() => {
    let lenis;
    let rafUpdate;

    const init = async () => {
      // dynamic import of Lenis to avoid SSR errors
      const { default: Lenis } = await import("@studio-freight/lenis");

      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2
      });
      lenisRef.current = lenis;

      rafUpdate = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(rafUpdate);

      // Wait a tick so layout is stable
      setTimeout(setupScroll, 50);

      function setupScroll() {
        const fixedSectionEl = containerRef.current.querySelector(".fixed-section");
        const fixedSectionTop = fixedSectionEl.offsetTop;
        const fixedSectionHeight = fixedSectionEl.offsetHeight;
        const sectionPositions = [];
        for (let i = 0; i < 10; i++) {
          sectionPositions.push(fixedSectionTop + (fixedSectionHeight * i) / 10);
        }
        sectionPositionsRef.current = sectionPositions;

        // Main scroll trigger
        ScrollTrigger.create({
          trigger: ".fixed-section",
          start: "top top",
          end: "bottom bottom",
          pin: ".fixed-container",
          pinSpacing: true,
          onUpdate: (self) => {
            if (isSnappingRef.current) return;
            const progress = self.progress;
            const targetSection = Math.min(9, Math.floor(progress * 10));
            if (targetSection !== current) {
              // snap one step
              const nextSection = current + (targetSection > current ? 1 : -1);
              snapTo(nextSection);
            }
          }
        });

        // end-section trigger (blur & unpin)
        ScrollTrigger.create({
          trigger: ".end-section",
          start: "top center",
          end: "bottom bottom",
          onUpdate: (self) => {
            const footer = containerRef.current.querySelector("#footer");
            const leftColumn = containerRef.current.querySelector("#left-column");
            const rightColumn = containerRef.current.querySelector("#right-column");
            const featured = containerRef.current.querySelector("#featured");
            if (self.progress > 0.1) {
              footer.classList.add("blur");
              leftColumn.classList.add("blur");
              rightColumn.classList.add("blur");
              featured.classList.add("blur");
            } else {
              footer.classList.remove("blur");
              leftColumn.classList.remove("blur");
              rightColumn.classList.remove("blur");
              featured.classList.remove("blur");
            }
          }
        });
      }

      const snapTo = (index) => {
        if (index < 0 || index > 9 || index === current) return;
        isSnappingRef.current = true;
        changeSection(index);
        const target = sectionPositionsRef.current[index];
        lenis.scrollTo(target, { duration: 0.6, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, onComplete: () => {
          isSnappingRef.current = false;
        }});
      };

      const changeSection = (newIdx) => {
        const prev = current;
        setCurrent(newIdx);
        // progress fill
        const progressFill = containerRef.current.querySelector("#progress-fill");
        if (progressFill) progressFill.style.width = `${(newIdx / 9) * 100}%`;

        // animate backgrounds
        const bgEls = containerRef.current.querySelectorAll(".background-image");
        bgEls.forEach((bg, i) => {
          bg.classList.remove("active", "previous");
          if (i === newIdx) {
            bg.classList.add("active");
            gsap.to(bg, { opacity: 1, duration: 0.6 });
          } else if (i === prev) {
            bg.classList.add("previous");
            gsap.to(bg, { opacity: 0, duration: 0.6 });
          } else {
            gsap.set(bg, { opacity: 0 });
          }
        });

        // artists & categories
        const artists = containerRef.current.querySelectorAll(".artist");
        const categories = containerRef.current.querySelectorAll(".category");
        artists.forEach((a, i) => {
          if (i === newIdx) a.classList.add("active"); else a.classList.remove("active");
        });
        categories.forEach((c, i) => {
          if (i === newIdx) c.classList.add("active"); else c.classList.remove("active");
        });

        // featured text simple word-animate
        const featuredContents = containerRef.current.querySelectorAll(".featured-content");
        featuredContents.forEach((fc, i) => {
          if (i === newIdx) {
            fc.classList.add("active");
            gsap.fromTo(fc.querySelectorAll(".word"), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.6 });
          } else {
            fc.classList.remove("active");
            gsap.set(fc.querySelectorAll(".word"), { yPercent: 100, opacity: 0 });
          }
        });

        // play sound
        if (soundRef.current) {
          soundRef.current.play("textChange", 150);
        }
      };

      // Expose small API
      window.__creative = { snapTo: (i) => { if (lenis) lenis.scrollTo(sectionPositionsRef.current[i]); } };

      // click handlers for items
      const artistEls = containerRef.current.querySelectorAll(".artist");
      artistEls.forEach((el, idx) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          if (soundRef.current) {
            soundRef.current.enable();
            soundRef.current.play("click");
          }
          snapTo(idx);
        });
        el.addEventListener("mouseenter", () => {
          if (soundRef.current) {
            soundRef.current.enable();
            soundRef.current.play("hover");
          }
        });
      });

      const categoryEls = containerRef.current.querySelectorAll(".category");
      categoryEls.forEach((el, idx) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          if (soundRef.current) {
            soundRef.current.enable();
            soundRef.current.play("click");
          }
          snapTo(idx);
        });
        el.addEventListener("mouseenter", () => {
          if (soundRef.current) {
            soundRef.current.enable();
            soundRef.current.play("hover");
          }
        });
      });

      // small staggered reveal for left/right
      const artistItems = containerRef.current.querySelectorAll(".artist");
      artistItems.forEach((it, i) => setTimeout(() => it.classList.add("loaded"), i * 60));
      const categoryItems = containerRef.current.querySelectorAll(".category");
      categoryItems.forEach((it, i) => setTimeout(() => it.classList.add("loaded"), i * 60 + 200));

      setLoaded(true);
    };

    init();

    return () => {
      try {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      } catch (e) {
        console.error(e);
      }
      if (lenisRef.current && lenisRef.current.destroy) lenisRef.current.destroy();
      if (rafUpdate) gsap.ticker.remove(rafUpdate);
      gsap.killTweensOf("*");
    };
  }, [current]);

  // helper to split words in featured headings
  const splitWords = (text) => text.split(" ").map((w, i) => (
    <span key={i} className="inline-block word overflow-hidden align-middle"><span className="inline-block">{w}&nbsp;</span></span>
  ));

  return (
    <div ref={containerRef} className="w-full relative scroll-container bg-white">
      {/* Loading overlay */}
      {!loaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white loading-overlay">
          <div className="text-black uppercase font-medium">Loading <span className="loading-counter">[00]</span></div>
        </div>
      )}

      <div className="fixed-section" style={{ height: "1100vh" }}>
        <div ref={fixedContainerRef} className="fixed-container sticky top-0 left-0 w-full h-screen overflow-hidden bg-white">
          {/* Backgrounds */}
          <div className="absolute inset-0 z-0 background-container bg-black">
            {BACKGROUNDS.map((src, i) => (
              <img key={i} src={src} alt={`bg-${i}`} className={`absolute top-[-10%] left-0 w-full h-[120%] object-cover background-image ${i === 0 ? "active" : ""}`} style={{ opacity: i === 0 ? 1 : 0 }} />
            ))}
          </div>

          <div className="grid grid-cols-12 gap-4 px-8 h-full relative z-10">
            <header className="col-span-12 pt-[5vh] text-center text-[10vw] leading-[0.8] text-white font-semibold header">The Creative<br/>Process</header>

            <main className="col-span-12 absolute left-0 top-1/2 transform -translate-y-1/2 w-full px-8 content flex justify-between items-center">
              <div id="left-column" className="w-2/5 flex flex-col gap-1 text-left">
                {ITEMS.map((t, i) => (
                  <div key={i} data-index={i} className={`artist text-white uppercase cursor-pointer py-1 ${i === 0 ? "active" : ""}`}>{t}</div>
                ))}
              </div>

              <div id="featured" className="w-1/5 flex items-center justify-center text-center feature">
                {ITEMS.map((_, i) => (
                  <div key={i} className={`featured-content h-[10vh] w-full absolute top-0 left-0 flex items-center justify-center ${i === 0 ? "active" : "hidden"}`}>
                    <h3 className="uppercase text-white text-[1.5vw] tracking-tight">
                      {splitWords(["Creative","Elements","Inner","Stillness","Deep","Knowing","True","Expression","Now","Moment"][i] || "")}
                    </h3>
                  </div>
                ))}
              </div>

              <div id="right-column" className="w-2/5 flex flex-col gap-1 text-right">
                {CATEGORIES.map((t, i) => (
                  <div key={i} data-index={i} className={`category text-white uppercase cursor-pointer py-1 ${i === 0 ? "active" : ""}`}>{t}</div>
                ))}
              </div>
            </main>

            <footer id="footer" className="col-span-12 self-end pb-[5vh] text-center text-[10vw] leading-[0.8] text-white footer font-semibold">Beyond<br/>Thinking
              <div className="mx-auto mt-4 w-[160px] progress-indicator relative">
                <div id="progress-fill" className="absolute top-0 left-0 h-full w-0 bg-white transition-all" />
                <div className="progress-numbers absolute top-0 left-0 right-0 flex justify-between text-xs -translate-y-1/2">
                  <span id="current-section">01</span>
                  <span id="total-sections">10</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <section className="end-section h-screen flex items-center justify-center bg-white">
        <p className="fin transform rotate-90 text-black">fin</p>
      </section>
    </div>
  );
}
