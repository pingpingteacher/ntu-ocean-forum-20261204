'use strict';

{
  const forms = {
    massive: {
      title: ['團塊狀珊瑚', 'Massive coral'],
      description: ['我們緊密地長在一起，慢慢在礁上隆起一座圓丘。靠近一點，可以看到表面是一個個小珊瑚蟲的家。', 'We grow close together, gradually building a dome on the reef. Look closer and you can see where each small polyp lives.'],
      alt: ['金黃色團塊狀珊瑚的水彩畫，圓丘表面布滿小孔', 'Watercolour illustration of a golden massive coral, with tiny pores across its rounded surface'],
    },
    branching: {
      title: ['枝狀珊瑚', 'Branching coral'],
      description: ['我們沿著骨骼向上、向外延伸，一枝一枝地分岔。枝條之間留下小魚可以穿梭的空間。', 'We grow upward and outward along our skeleton, dividing into new branches with spaces for small fish to swim through.'],
      alt: ['淡紫色枝狀珊瑚的水彩畫，細枝像鹿角向上分岔', 'Watercolour illustration of pale lavender branching coral, with slender antler-like branches'],
    },
    plate: {
      title: ['片狀珊瑚', 'Plate coral'],
      description: ['我們沿著邊緣向外生長，把群體鋪成薄薄的片，在礁上像一層層展開的架子。', 'We grow outward along the edges, widening into thin plates that spread like shelves across the reef.'],
      alt: ['綠色片狀珊瑚的水彩畫，薄片像多層架子向外伸展', 'Watercolour illustration of green plate coral, with thin plates stretching out like shelves'],
    },
    soft: {
      title: ['軟珊瑚', 'Soft coral'],
      description: ['我們用柔軟的組織連成一個群體，表面有波浪般的褶皺。靠近一點，可以看見褶皺間細小的金褐色珊瑚蟲。', 'Soft tissue connects our colony and forms wavy folds. Look closer and you can see tiny golden-brown polyps across the folds.'],
      alt: ['軟珊瑚的水彩畫，柔軟的波浪褶皺間分布細小的金褐色珊瑚蟲', 'Watercolour illustration of soft coral, with tiny golden-brown polyps along its wavy folds'],
    },
  };
  const earlyStages = [
    {
      title: ['我在礁上定著了', 'I settled on the reef'],
      description: ['我原本是隨水漂流的幼生。找到合適的地方後，我定著下來，長成一隻珊瑚蟲。', 'I began as a drifting larva. When I found a suitable place, I settled and became a polyp.'],
      next: ['看看出芽', 'See it bud'],
    },
    {
      title: ['我們成了一個小群體', 'We’re a small colony'],
      description: ['我出芽長出新的珊瑚蟲。新成員留在我身邊，一起擴大我們的群體。', 'New polyps bud from me and stay connected. Together we extend the colony.'],
      next: ['看群體成形', 'Reveal the colony'],
    },
  ];

  const growth = document.getElementById('grow');
  const choices = [...growth.querySelectorAll('.growth-choices button')];
  const panel = growth.querySelector('.growth-panel');
  const title = panel.querySelector('h3');
  const narration = panel.querySelector('.growth-narration');
  const steps = [...panel.querySelectorAll('.growth-steps li')];
  const next = panel.querySelector('[data-growth-next]');
  const topicsLink = panel.querySelector('[data-growth-topics]');
  const notebook = panel.querySelector('[data-growth-notebook]');
  const reset = panel.querySelector('[data-growth-reset]');
  const settlement = panel.querySelector('.growth-settlement');
  const caption = panel.querySelector('figcaption');
  const coralPlaceholder = document.getElementById('notebook-coral-placeholder');
  const coralCard = document.getElementById('notebook-coral-card');
  const coralImage = document.getElementById('notebook-coral-image');
  const coralCaption = document.getElementById('notebook-coral-caption');
  const artwork = new Image();
  artwork.decoding = 'async';
  artwork.hidden = true;
  panel.querySelector('.growth-scene').append(artwork);

  let selected;
  let stage = 0;

  function writePair(element, [zh, en]) {
    element.querySelector('[lang="zh-Hant"]').textContent = zh;
    element.querySelector('[lang="en"]').textContent = en;
  }

  function describeArtwork(element, form) {
    element.setAttribute('data-zh-alt', form.alt[0]);
    element.setAttribute('data-en-alt', form.alt[1]);
    setLocalizedAttribute(element, 'alt');
  }

  function artworkPath(form) {
    return `assets/coral-${form}.webp`;
  }

  function renderNotebookCoral() {
    if (!Object.hasOwn(forms, state.coral)) return;
    const form = forms[state.coral];
    describeArtwork(coralImage, form);
    coralImage.src = artworkPath(state.coral);
    writePair(coralCaption, form.title);
    coralPlaceholder.hidden = true;
    coralCard.hidden = false;
    updateCardAvailability();
  }

  function showStage() {
    const key = selected.dataset.form;
    const form = forms[key];
    const adult = stage === earlyStages.length;
    const content = adult ? form : earlyStages[stage];
    panel.dataset.form = key;
    panel.dataset.stage = String(stage + 1);
    panel.hidden = false;
    writePair(title, content.title);
    writePair(narration, content.description);
    if (!adult) writePair(next, content.next);
    steps.forEach((step, index) => {
      if (index === stage) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    artwork.hidden = !adult;
    caption.hidden = !adult;
    settlement.hidden = adult;
    next.hidden = adult;
    topicsLink.hidden = !adult;
    notebook.hidden = !adult;
    if (adult) {
      describeArtwork(artwork, form);
      artwork.src = artworkPath(key);
      state.coral = key;
      save();
      renderNotebookCoral();
    }
  }

  function focusStage() {
    title.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'start' });
  }

  for (const choice of choices) {
    choice.addEventListener('click', () => {
      selected = choice;
      stage = 0;
      choices.forEach(option => option.setAttribute('aria-pressed', String(option === selected)));
      showStage();
      focusStage();
    });
  }

  next.addEventListener('click', () => {
    if (!selected || stage >= earlyStages.length) return;
    stage += 1;
    showStage();
    if (stage === earlyStages.length) focusStage();
  });

  reset.addEventListener('click', () => {
    if (!selected) return;
    selected.setAttribute('aria-pressed', 'false');
    selected.focus();
    selected = null;
    panel.hidden = true;
  });

  renderNotebookCoral();
}
