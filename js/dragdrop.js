function attachDragDrop(zoneId, inputId, nameId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const name = document.getElementById(nameId);
  if (!zone || !input) return;

  zone.onclick = () => {
    if (!zone.classList.contains("disabled")) {
      input.click();
    }
  };

  input.onchange = () => {
    if (name && input.files[0]) {
      name.textContent = input.files[0].name;
    }
  };

  zone.ondragover = (e) => {
    if (zone.classList.contains("disabled")) return;
    e.preventDefault();
    zone.classList.add("dragover");
  };

  zone.ondragleave = () => {
    zone.classList.remove("dragover");
  };

  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");

    if (zone.classList.contains("disabled")) return;

    const dt = new DataTransfer();
    for (const file of e.dataTransfer.files) {
      dt.items.add(file);
    }

    input.files = dt.files;
    input.dispatchEvent(new Event("change"));
  };
}
