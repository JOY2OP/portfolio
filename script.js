const sections = document.querySelectorAll(".section-block, .intro-grid");

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);

for (const section of sections) {
  section.classList.add("reveal");
  revealObserver.observe(section);
}

document.querySelectorAll(".blog-card details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) return;

    document.querySelectorAll(".blog-card details").forEach((other) => {
      if (other !== details) {
        other.removeAttribute("open");
      }
    });
  });
});
