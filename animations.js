// animations.js - Safe GSAP Animation Orchestration (Zero Warnings)

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  // Pulse animation for the live sync indicator
  const pulse = document.querySelector(".pulse-ring");
  if (pulse) {
    gsap.to(pulse, {
      scale: 1.8,
      opacity: 0,
      duration: 1.5,
      repeat: -1,
      ease: "power2.out"
    });
  }

  // Stagger KPI cards on initial load only if present
  const kpiCards = document.querySelectorAll(".kpi-card");
  if (kpiCards.length > 0) {
    gsap.fromTo(kpiCards, 
      { y: 25, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out", clearProps: "transform,opacity" }
    );
  }
});

// Interactive hover effects for data table rows
function setupTableRowHover() {
  if (typeof gsap === "undefined") return;
  
  const rows = document.querySelectorAll(".data-table tbody tr");
  if (rows.length === 0) return;
  rows.forEach(row => {
    row.addEventListener("mouseenter", () => {
      gsap.to(row, { backgroundColor: "rgba(59, 130, 246, 0.04)", duration: 0.2 });
    });
    row.addEventListener("mouseleave", () => {
      gsap.to(row, { backgroundColor: "transparent", duration: 0.2 });
    });
  });
}
