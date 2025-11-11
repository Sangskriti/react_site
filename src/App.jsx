import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomEase from "gsap/CustomEase";
import Lenis from "lenis";
import SoundManager from "./utils/SoundManager";
import "./index.css";

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("customEase", "M0,0 C0.86,0 0.07,1 1,1");

// ---------- Constants ----------
const IMAGES = Array.from({ length: 10 }, (_, i) =>
  `https://assets.codepen.io/7558/flame-glow-blur-${String(i + 1).padStart(3, "0")}.jpg`
);
const ARTISTS = [
  "Silence",
  "Meditation",
  "Intuition",
  "Authenticity",
  "Presence",
  "Listening",
  "Curiosity",
  "Patience",
  "Surrender",
  "Simplicity",
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
  "Minimalism",
];
const FEATURED = [
  "Creative Elements",
  "Inner Stillness",
  "Deep Knowing",
  "True Expression",
  "Now Moment",
  "Deep Attention",
  "Open Exploration",
  "Calm Waiting",
  "Let Go Control",
  "Pure Essence",
];

// ---------- Component ----------
export default function App() {
  const soundManager = useRef(new SoundManager()).current;
  const lenisRef = useRef(null);

  // ---- Unlock sound on first interaction ----
  useEffect(() => {
    const unlock = async () => {
      await soundManager.enableAudio();
      const btn = document.querySelector(".sound-toggle");
      btn?.classList.remove("disabled");
      btn?.classList.add("active");
    };

    ["click", "touchstart", "keydown"].forEach((evt) =>
      document.addEventListener(evt, unlock, { once: true })
    );

    return () => {
      ["click", "touchstart", "keydown"].forEach((evt) =>
        document.removeEventListener(evt, unlock)
      );
    };
  }, [soundManager]);

  // ---- Main GSAP / Scroll logic ----
  useEffect(() => {
    // ✅ Initialize Lenis (mobile safe)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: true,
      touchMultiplier: 1.3,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenisRef.current = lenis;

    // ---- Loading animation ----
    const overlay = document.getElementById("loading-overlay");
    const counterEl = document.getElementById("loading-counter");
    let count = 0;
    const interval = setInterval(() => {
      count += Math.random() * 3 + 1;
      if (count >= 100) {
        count = 100;
        clearInterval(interval);
        gsap.to(overlay, {
          y: "-100%",
          duration: 1.2,
          ease: "power3.inOut",
          delay: 0.3,
          onComplete: () => {
            overlay.style.display = "none";
            gsap.utils.toArray(".artist").forEach((el, i) =>
              gsap.to(el, {
                opacity: 0.3,
                y: 0,
                delay: i * 0.06,
                duration: 0.5,
              })
            );
            gsap.utils.toArray(".category").forEach((el, i) =>
              gsap.to(el, {
                opacity: 0.3,
                y: 0,
                delay: 0.3 + i * 0.06,
                duration: 0.5,
              })
            );
          },
        });
      }
      counterEl.textContent = `[${Math.floor(count)
        .toString()
        .padStart(2, "0")}]`;
    }, 30);

    // ---- Scroll logic variables ----
    const backgrounds = document.querySelectorAll(".background-image");
    const featuredContents = document.querySelectorAll(".featured-content");
    const artists = document.querySelectorAll(".artist");
    const categories = document.querySelectorAll(".category");
    const currentSectionDisplay = document.getElementById("current-section");
    const progressFill = document.getElementById("progress-fill");

    let currentSection = 0;
    let isAnimating = false;
    let isSnapping = false;

    const fixedSectionEl = document.querySelector(".fixed-section");
    const secTop = fixedSectionEl.offsetTop;
    const secHeight = fixedSectionEl.offsetHeight;
    const sectionPositions = Array.from({ length: 10 }, (_, i) =>
      secTop + (secHeight * i) / 10
    );

    const updateProgress = () => {
      currentSectionDisplay.textContent = String(currentSection + 1).padStart(
        2,
        "0"
      );
      progressFill.style.width = `${(currentSection / 9) * 100}%`;
    };

    const changeSection = (newSection) => {
      if (newSection === currentSection || isAnimating) return;
      isAnimating = true;
      const prev = currentSection;
      currentSection = newSection;
      updateProgress();
      featuredContents[prev]?.classList.remove("active");
      featuredContents[newSection]?.classList.add("active");
      soundManager.play("textChange", 250);

      backgrounds.forEach((bg, i) => {
        bg.classList.remove("previous", "active");
        if (i === newSection) {
          bg.classList.add("active");
          gsap.fromTo(
            bg,
            { clipPath: "inset(100% 0 0 0)" },
            { clipPath: "inset(0 0 0 0)", duration: 0.64, ease: "customEase" }
          );
        } else if (i === prev) {
          bg.classList.add("previous");
          gsap.to(bg, {
            opacity: 0,
            duration: 0.32,
            ease: "customEase",
            onComplete: () => (isAnimating = false),
          });
        }
      });

      artists.forEach((el, i) =>
        gsap.to(el, { opacity: i === newSection ? 1 : 0.3, duration: 0.3 })
      );
      categories.forEach((el, i) =>
        gsap.to(el, { opacity: i === newSection ? 1 : 0.3, duration: 0.3 })
      );
    };

    const snapToSection = (idx) => {
      if (idx < 0 || idx > 9 || idx === currentSection || isAnimating) return;
      isSnapping = true;
      changeSection(idx);
      lenis.scrollTo(sectionPositions[idx], {
        duration: 0.8,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
        onComplete: () => (isSnapping = false),
      });
    };

    // ---- Hover / click sounds + nav click movement ----
    const handleNavClick = (index) => {
      soundManager.play("click");
      snapToSection(index);
    };

    artists.forEach((el, i) => {
      el.addEventListener("pointerenter", () => soundManager.play("hover"));
      el.addEventListener("pointerup", () => handleNavClick(i));
    });

    categories.forEach((el, i) => {
      el.addEventListener("pointerenter", () => soundManager.play("hover"));
      el.addEventListener("pointerup", () => handleNavClick(i));
    });

    // ---- ScrollTrigger setup ----
    ScrollTrigger.create({
      trigger: ".fixed-section",
      start: "top top",
      end: "bottom bottom",
      pin: ".fixed-container",
      pinSpacing: true,
      onUpdate: (self) => {
        if (isSnapping) return;
        const prog = self.progress;
        const target = Math.min(9, Math.floor(prog * 10));
        if (target !== currentSection && !isAnimating) {
          const nextIdx = currentSection + (target > currentSection ? 1 : -1);
          snapToSection(nextIdx);
        }
      },
    });

    ScrollTrigger.refresh();
    window.addEventListener("resize", () => ScrollTrigger.refresh());

    // ✅ Make sure scrolling is possible
    document.body.style.overflow = "auto";
    document.body.style.touchAction = "pan-y pinch-zoom";

    // ---- Cleanup ----
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.destroy();
      clearInterval(interval);
    };
  }, [soundManager]);

  return (
    <div className="scroll-container">
      <div id="loading-overlay" className="loading-overlay">
        Loading{" "}
        <span id="loading-counter" className="loading-counter">
          [00]
        </span>
      </div>

      <div className="fixed-section" id="fixed-section">
        <div className="fixed-container" id="fixed-container">
          <div className="background-container" id="background-container">
            {IMAGES.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Background ${i + 1}`}
                className={`background-image${i === 0 ? " active" : ""}`}
              />
            ))}
          </div>

          <div className="grid-container">
            <div className="header">
              <div className="header-row">The Creative</div>
              <div className="header-row">Process</div>
            </div>

            <div className="content">
              <div className="left-column" id="left-column">
                {ARTISTS.map((a, i) => (
                  <div key={i} className={`artist${i === 0 ? " active" : ""}`}>
                    {a}
                  </div>
                ))}
              </div>

              <div className="featured" id="featured">
                {FEATURED.map((f, i) => (
                  <div
                    key={i}
                    className={`featured-content${i === 0 ? " active" : ""}`}
                  >
                    <h3>{f}</h3>
                  </div>
                ))}
              </div>

              <div className="right-column" id="right-column">
                {CATEGORIES.map((c, i) => (
                  <div key={i} className={`category${i === 0 ? " active" : ""}`}>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div className="footer" id="footer">
              <div className="header-row">Beyond</div>
              <div className="header-row">Thinking</div>
              <div className="progress-indicator">
                <div className="progress-numbers">
                  <span id="current-section">01</span>
                  <span id="total-sections">10</span>
                </div>
                <div id="progress-fill" className="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="end-section">
        <p className="fin">fin</p>
      </div>

      {/* ---- Sound Toggle ---- */}
      <button
        id="sound-toggle"
        className="sound-toggle disabled"
        aria-label="Toggle sound"
        onClick={async () => {
          const btn = document.getElementById("sound-toggle");
          if (!soundManager.isEnabled) {
            await soundManager.enableAudio();
            btn.classList.remove("disabled");
            btn.classList.add("active");
          } else {
            soundManager.isEnabled = false;
            btn.classList.add("disabled");
            btn.classList.remove("active");
            console.log("🔇 Audio disabled");
          }
        }}
      >
        <div className="sound-dots">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="sound-dot"></div>
          ))}
        </div>
      </button>
    </div>
  );
}
