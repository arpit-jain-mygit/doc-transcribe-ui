async function includeHTML() {
  const nodes = document.querySelectorAll("[data-include]");
  const tasks = [];

  for (const el of nodes) {
    const file = el.getAttribute("data-include");
    tasks.push(
      fetch(file)
        .then(res => res.text())
        .then(html => {
          el.innerHTML = html;
        })
    );
  }

  await Promise.all(tasks);
}
