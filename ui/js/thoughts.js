let THOUGHT_INTERVAL = null;

const THOUGHTS = [
  "Analyzing file structure…",
  "Extracting text…",
  "Cleaning transcription…",
  "Verifying language accuracy…",
  "Finalizing output…"
];

function startThoughts() {
  const box = document.getElementById("thoughtBox");
  const text = document.getElementById("thoughtText");

  if (!box || !text) return;

  let index = 0;
  box.style.display = "block";

  clearInterval(THOUGHT_INTERVAL);
  THOUGHT_INTERVAL = setInterval(() => {
    text.textContent = THOUGHTS[index % THOUGHTS.length];
    index++;
  }, 2500);
}

function stopThoughts() {
  clearInterval(THOUGHT_INTERVAL);
  THOUGHT_INTERVAL = null;

  const box = document.getElementById("thoughtBox");
  if (box) box.style.display = "none";
}
