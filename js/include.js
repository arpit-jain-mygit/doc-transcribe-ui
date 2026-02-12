async function includeHTML() {
  const nodes = document.querySelectorAll("[data-include]");

  for (const el of nodes) {
    const file = el.getAttribute("data-include");
    console.log("Loading partial:", file);

    try {
      const res = await fetch(file, { cache: "no-store" });
      console.log(file, "→", res.status);

      el.innerHTML = await res.text();
    } catch (e) {
      console.error("Failed loading", file, e);
    }
  }
}
