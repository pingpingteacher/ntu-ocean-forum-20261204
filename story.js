'use strict';

const page = document.documentElement;
const languageButtons = document.querySelectorAll('header [data-talk-language]');
const chapterTitles = {
  polyp: ['珊瑚蟲', 'Coral polyp'],
  current: ['黑潮', 'Kuroshio'],
  coast: ['海岸', 'Coast'],
  brick: ['復育磚', 'Restoration blocks'],
  future: ['青年接力', 'Youth action'],
  agenda3: ['《黑潮震盪》作者講座', 'Author talk · Kuroshio Odyssey'],
  agenda4: ['作者 Q&A 交流', 'Author Q&A'],
  agenda6: ['用草根精神，投入海洋保育實踐', 'Grassroots ocean conservation in practice'],
  agenda7: ['企業主題講座｜守護珊瑚，永續海洋', 'Corporate keynote · Protecting Corals for a Sustainable Ocean'],
  agenda9: ['臺帛青年永續座談（英語）', 'Taiwan–Palau Youth Sustainability Panel (in English)'],
  agenda10: ['總結與回饋', 'Closing and feedback'],
};

// 填入 assets 中的相對路徑與畫面描述即可更換截圖。
const frames = {
  polyp: { src: '', alt: '' },
  current: { src: '', alt: '' },
  coast: { src: '', alt: '' },
  brick: { src: '', alt: '' },
  future: { src: '', alt: '' },
};

for (const [id, frame] of Object.entries(frames)) {
  if (!frame.src) continue;
  const image = new Image();
  image.alt = frame.alt;
  image.loading = 'lazy';
  image.addEventListener('error', () => image.remove(), { once: true });
  image.src = frame.src;
  document.querySelector(`[data-frame="${id}"] .frame`).append(image);
}

const storageKey = 'ntu-tide-notebook-v1';
const status = document.getElementById('storage-status');
const state = { notes: {}, color: '', agendaLanguage: 'zh-Hant', coral: '' };
function setLocalizedText(element, zh, en) {
  if (!element.firstElementChild) {
    for (const language of ['zh-Hant', 'en']) {
      const part = document.createElement('span');
      part.lang = language;
      element.append(part);
    }
  }
  element.querySelector('[lang="zh-Hant"]').textContent = zh;
  element.querySelector('[lang="en"]').textContent = en;
}

function setLocalizedAttribute(element, attribute) {
  const language = state.agendaLanguage === 'en' ? 'en' : 'zh';
  element.setAttribute(attribute, element.getAttribute(`data-${language}-${attribute}`));
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  for (const id of Object.keys(chapterTitles)) {
    const note = saved?.notes?.[id];
    if (typeof note === 'string') state.notes[id] = note.slice(0, 500);
  }
  if (typeof saved?.color === 'string') state.color = saved.color;
  if (typeof saved?.coral === 'string') state.coral = saved.coral;
  if (saved?.agendaLanguage === 'en') state.agendaLanguage = 'en';
} catch {
  setLocalizedText(status, "無法讀取先前的手記。你仍可以寫下並下載這次的手記。", "Your previous notes could not be loaded. You can still write and download notes from this visit.");
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    setLocalizedText(status, "手記與長成的珊瑚已儲存於目前的瀏覽器。", "Your notes and coral colony have been saved in this browser.");
  } catch {
    setLocalizedText(status, "此瀏覽器無法儲存手記。關閉網頁前可以先下載。", "This browser cannot save your notes. Download your card before closing the page.");
  }
}

function choose(button, group) {
  group.querySelectorAll('button').forEach(option => {
    option.setAttribute('aria-pressed', String(option === button));
  });
  const target = group.dataset.reveal;
  setLocalizedText(document.getElementById(target), button.dataset.copy, button.dataset.copyEn);
  if (target === 'polyp-answer') {
    document.getElementById('polyp-scene').classList.toggle('pale', button !== group.firstElementChild);
  }
  if (target === 'color-answer') {
    document.getElementById('color-panel').style.setProperty('--chosen', button.dataset.color);
  }
}

for (const group of document.querySelectorAll('[data-reveal]')) {
  for (const button of group.querySelectorAll('button')) {
    if (button.dataset.color && [button.dataset.color, button.querySelector('[lang="zh-Hant"]').textContent].includes(state.color)) {
      choose(button, group);
    }
    button.addEventListener('click', () => {
      choose(button, group);
      if (button.dataset.color) {
        state.color = button.dataset.color;
        save();
        renderNotebook();
      }
    });
  }
}

function setTalkLanguage() {
  page.lang = state.agendaLanguage;
  document.title = page.lang === 'en' ? page.dataset.enTitle : page.dataset.zhTitle;
  languageButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.talkLanguage === state.agendaLanguage));
  });
  for (const attribute of ['aria-label', 'alt', 'title', 'content']) {
    document.querySelectorAll(`[data-en-${attribute}]`).forEach(element => setLocalizedAttribute(element, attribute));
  }
}

setTalkLanguage();
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    state.agendaLanguage = button.dataset.talkLanguage;
    setTalkLanguage();
    save();
    renderNotebook();
  });
}

const noteList = document.getElementById('note-list');
const notebookWriting = document.getElementById('notebook-writing');
const writingPlaceholder = document.getElementById('notebook-writing-placeholder');
const notebookArt = document.getElementById('notebook-coral-card');
const downloadCard = document.getElementById('download-card');
const cardStatus = document.getElementById('card-download-status');
let cardBusy = false;

function entries() {
  return Object.entries(chapterTitles)
    .filter(([id]) => state.notes[id]?.trim())
    .map(([id, titles]) => [titles[state.agendaLanguage === 'en' ? 1 : 0], state.notes[id].trim()]);
}

function updateCardAvailability() {
  downloadCard.disabled = cardBusy || notebookArt.hidden || entries().length === 0;
}

function renderNotebook() {
  const notes = entries();
  noteList.replaceChildren();
  notebookWriting.hidden = notes.length === 0;
  writingPlaceholder.hidden = notes.length > 0;
  updateCardAvailability();
  for (const [title, note] of notes) {
    const entry = document.createElement('div');
    entry.className = 'entry';
    const heading = document.createElement('strong');
    heading.textContent = title;
    entry.append(heading, document.createTextNode(note));
    noteList.append(entry);
  }
}

for (const field of document.querySelectorAll('[data-note]')) {
  const id = field.dataset.note;
  field.value = state.notes[id] || '';
  field.addEventListener('input', () => {
    state.notes[id] = field.value;
    save();
    renderNotebook();
  });
}

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

downloadCard.addEventListener('click', async () => {
  const notes = entries();
  if (cardBusy || notebookArt.hidden || !notes.length) return;
  const language = state.agendaLanguage;
  const coralName = document.querySelector(`#notebook-coral-caption [lang="${language}"]`).textContent;
  const cardTitle = language === 'en' ? 'My Ocean Notebook' : '我的海洋手記';
  const image = `assets/coral-${state.coral}.png`;
  cardBusy = true;
  updateCardAvailability();
  setLocalizedText(cardStatus, "正在製作水彩小卡…", "Creating your watercolour card…");
  try {
    const png = await renderOceanCard({ image, coralName, entries: notes, language });
    downloadFile(png, `${cardTitle}－${coralName}.png`);
    cardStatus.textContent = '';
  } catch {
    setLocalizedText(cardStatus, "小卡暫時無法下載，請再試一次。", "The card could not be downloaded. Please try again.");
  } finally {
    cardBusy = false;
    updateCardAvailability();
  }
});
renderNotebook();
