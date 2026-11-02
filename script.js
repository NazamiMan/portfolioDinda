const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Buka menu" : "Tutup menu");
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Buka menu");
      siteNav.classList.remove("is-open");
    }
  });
}

const revealElements = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const progressBar = document.querySelector(".scroll-progress span");

document.querySelectorAll("[data-experience-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");

  if (!(track instanceof HTMLElement) || !(previousButton instanceof HTMLButtonElement) || !(nextButton instanceof HTMLButtonElement)) {
    return;
  }

  const updateControls = () => {
    previousButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };

  const scrollToAdjacentCard = (direction) => {
    const card = track.querySelector(".experience-slide");
    if (!card) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  previousButton.addEventListener("click", () => scrollToAdjacentCard(-1));
  nextButton.addEventListener("click", () => scrollToAdjacentCard(1));
  track.addEventListener("scroll", updateControls, { passive: true });
  window.addEventListener("resize", updateControls);
  updateControls();
});

document.querySelectorAll("[data-certificate-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-certificate-track]");
  const previousButton = carousel.querySelector("[data-certificate-prev]");
  const nextButton = carousel.querySelector("[data-certificate-next]");
  const toggleButton = carousel.querySelector("[data-certificate-toggle]");

  if (
    !(track instanceof HTMLElement) ||
    !(previousButton instanceof HTMLButtonElement) ||
    !(nextButton instanceof HTMLButtonElement) ||
    !(toggleButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const cards = [...track.querySelectorAll(".certificate-card")];
  if (cards.length < 2) return;

  const createCardCopies = () => {
    const copies = [];
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      if (!(clone instanceof HTMLElement)) return;
      clone.setAttribute("aria-hidden", "true");
      copies.push(clone);
    });
    return copies;
  };

  const leadingCopies = createCardCopies();
  const trailingCopies = createCardCopies();
  track.prepend(...leadingCopies);
  track.append(...trailingCopies);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isPaused = prefersReducedMotion;
  let isPointerOver = false;
  let isFocusPaused = false;
  let previousFrameTime = 0;
  let groupWidth = 0;

  const updateControls = () => {
    toggleButton.setAttribute("aria-pressed", String(isPaused));
    toggleButton.setAttribute("aria-label", isPaused ? "Lanjutkan auto slide" : "Jeda auto slide");
    toggleButton.textContent = isPaused ? "▶" : "Ⅱ";
  };

  const updateGroupWidth = () => {
    groupWidth = cards[0].offsetLeft - leadingCopies[0].offsetLeft;
  };

  const scrollToAdjacentCard = (direction) => {
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (cards[0].getBoundingClientRect().width + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const normalizeLoopPosition = () => {
    if (!groupWidth) return;
    if (track.scrollLeft < groupWidth) {
      track.scrollLeft += groupWidth;
    } else if (track.scrollLeft >= groupWidth * 2) {
      track.scrollLeft -= groupWidth;
    }
  };

  previousButton.addEventListener("click", () => {
    scrollToAdjacentCard(-1);
  });
  nextButton.addEventListener("click", () => {
    scrollToAdjacentCard(1);
  });
  toggleButton.addEventListener("click", () => {
    isPaused = !isPaused;
    updateControls();
  });
  carousel.addEventListener("pointerenter", () => { isPointerOver = true; });
  carousel.addEventListener("pointerleave", () => { isPointerOver = false; });
  carousel.addEventListener("focusin", () => { isFocusPaused = true; });
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) isFocusPaused = false;
  });
  track.addEventListener("scroll", normalizeLoopPosition, { passive: true });
  window.addEventListener("resize", () => {
    updateGroupWidth();
    track.scrollLeft = groupWidth;
  });
  toggleButton.hidden = prefersReducedMotion;
  updateGroupWidth();
  track.scrollLeft = groupWidth;
  updateControls();

  if (!prefersReducedMotion) {
    const animate = (time) => {
      const canMove = !isPaused && !isPointerOver && !isFocusPaused && !document.hidden;
      const carouselBounds = carousel.getBoundingClientRect();
      const isVisible = carouselBounds.bottom > 0 && carouselBounds.top < window.innerHeight;

      if (canMove && isVisible && previousFrameTime) {
        track.scrollLeft += Math.min(time - previousFrameTime, 50) * 0.035;
        normalizeLoopPosition();
      }

      previousFrameTime = canMove && isVisible ? time : 0;
      window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
  }
});

if (progressBar) {
  let progressFrame = 0;
  const updateScrollProgress = () => {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(() => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
      progressFrame = 0;
    });
  };

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();
}

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => {
    if (element.getBoundingClientRect().top < window.innerHeight) {
      element.classList.add("is-visible");
    } else {
      revealObserver.observe(element);
    }
  });
}
