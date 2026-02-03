let THOUGHT_INTERVAL = null;

const THOUGHTS = [
 const THOUGHTS = [
  "श्रुत का संरक्षण सावधानीपूर्वक किया जा रहा है…",
  "मूल शब्दों की शुद्धता बनाए रखी जा रही है…",
  "पाठ को बिना परिवर्तन सुरक्षित रूप में निकाला जा रहा है…",
  "भाषा एवं भाव की शुद्धता की जाँच हो रही है…",
  "जिनवाणी को यथावत् रूप में प्रस्तुत किया जा रहा है…",

  "उच्चारण एवं शब्द-विन्यास पर विशेष ध्यान रखा जा रहा है…",
  "प्राचीन ग्रंथों की गरिमा को सुरक्षित रखा जा रहा है…",
  "मूल पाठ में किसी प्रकार का परिवर्तन नहीं किया जा रहा है…",
  "श्रुत की परंपरा के अनुरूप पाठ तैयार किया जा रहा है…",
  "अर्थ एवं भाव में शुद्धता बनाए रखी जा रही है…",

  "पाठ को संदर्भ सहित सावधानी से संसाधित किया जा रहा है…",
  "भाषायी विकृति से बचाव सुनिश्चित किया जा रहा है…",
  "जिनवाणी की मर्यादा का पूर्ण ध्यान रखा जा रहा है…",
  "श्रुत को यथासंभव मूल रूप में संरक्षित किया जा रहा है…",
  "प्रस्तुत पाठ में श्रद्धा एवं संयम बनाए रखा जा रहा है…",

  "ग्रंथ की पंक्तियों को क्रमबद्ध रूप में संजोया जा रहा है…",
  "मूल भाव की रक्षा करते हुए पाठ तैयार किया जा रहा है…",
  "श्रुत-संरक्षण की प्रक्रिया धैर्यपूर्वक आगे बढ़ रही है…",
  "पाठ को अध्याय एवं प्रवाह के अनुसार संयोजित किया जा रहा है…",
  "जिनवाणी की शुद्ध परंपरा को ध्यान में रखा जा रहा है…"
];
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
