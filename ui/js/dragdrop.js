function attachDragDrop(zoneId, inputId, nameId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const name = document.getElementById(nameId);
  if (!zone || !input) return;

  zone.onclick = () => !zone.classList.contains("disabled") && input.click();
  input.onchange = () => name && (name.textContent = input.files[0]?.name || "");

  zone.ondragover = e => {
    if (zone.classList.contains("disabled")) return;
    e.preventDefault();
    zone.classList.add("dragover");
  };

  zone.ondragleave = () => zone.classList.remove("dragover");

  zone.ondrop = e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    input.files = e.dataTransfer.files;
    input.dispatchEvent(new Event("change"));
  };
}