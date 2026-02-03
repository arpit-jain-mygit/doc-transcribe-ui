const THOUGHTS = [
  "🪔 शब्दों की शुद्धता ही ज्ञान की रक्षा है।",
  "📜 हर अक्षर श्रद्धा से संजोया जा रहा है।",
  "🧘‍♂️ यह प्रक्रिया साधना के समान है।",
  "🔍 मूल भाव बदले बिना लिप्यंतरण किया जा रहा है।",
  "⏳ महान ग्रंथ समय लेकर ही प्रकट होते हैं।",
  "🌸 आपका कार्य सुरक्षित रूप से संसाधित हो रहा है।"
];

let THOUGHT_TIMER = null;
let THOUGHT_INDEX = 0;

function startThoughtSlider() {
  const box = document.getElementById("thoughtBox");
  const text = document.getElementById("thoughtText");
  if (!box || !text || THOUGHT_TIMER) return;

  box.style.display = "block";
  text.textContent = THOUGHTS[0];
  THOUGHT_INDEX = 1;

  THOUGHT_TIMER = setInterval(() => {
    const idx = THOUGHT_INDEX % THOUGHTS.length;
    text.textContent = THOUGHTS[idx];
    THOUGHT_INDEX++;
  }, 4500);
}

function stopThoughtSlider() {
  if (THOUGHT_TIMER) clearInterval(THOUGHT_TIMER);
  THOUGHT_TIMER = null;
  const box = document.getElementById("thoughtBox");
  if (box) box.style.display = "none";
}
