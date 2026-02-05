async function includeHTML() {
  const nodes = Array.from(document.querySelectorAll("[data-include]"));

  for (const el of nodes) {
    const file = el.getAttribute("data-include");
    if (!file) continue;

    try {
      const res = await fetch(file);
      if (!res.ok) {
        console.error("Failed to load partial:", file);
        continue;
      }
      el.innerHTML = await res.text();
    } catch (e) {
      console.error("Error loading partial:", file, e);
    }
  }
}
