async function includeHTML() {
  const elements = document.querySelectorAll("[data-include]");
  for (const el of elements) {
    const file = el.getAttribute("data-include");
    try {
      const resp = await fetch(file);
      el.innerHTML = await resp.text();
    } catch (e) {
      console.error("Failed to load", file, e);
    }
  }
}
