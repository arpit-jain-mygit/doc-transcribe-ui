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
    const picked = input.files && input.files[0];
    if (name && picked) {
      name.textContent = picked.name;
    }

    const autoType = input.dataset.autoUploadType;
    if (!picked || !autoType) return;

    // Avoid duplicate auto-submit for identical file token on repeated change dispatches.
    const token = `${picked.name}|${picked.size}|${picked.lastModified}`;
    if (input.dataset.lastAutoUploadToken === token) return;
    input.dataset.lastAutoUploadToken = token;

    if (typeof uploadFrom === "function") {
      uploadFrom(autoType, inputId);
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
