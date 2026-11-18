(() => {
  const trigger = document.querySelector('.site-search-toggle');
  const panel = document.getElementById('siteSearchPanel');
  const form = document.getElementById('siteSearchForm');
  const input = document.getElementById('siteSearchInput');
  const results = document.getElementById('siteSearchResults');
  if (!trigger || !panel || !form || !input || !results) return;

  const root = new URL('./', document.currentScript.src);
  const pages = window.munprizmaSearchIndex || [];
  const contentSelector = 'main h1, main h2, main h3, main h4, main p, main li, main blockquote, main label, main a, main button';
  const storageKey = 'munprizma-news-v1';

  function showMessage(message) {
    results.replaceChildren();
    const note = document.createElement('p');
    note.className = 'site-search-message';
    note.textContent = message;
    results.append(note);
  }

  function resultLink(page, title, text, query, matchedText, newsId) {
    const link = document.createElement('a');
    link.className = 'site-search-result';
    const url = new URL(page, root);
    url.searchParams.set('siteSearch', query);
    if (newsId) url.searchParams.set('newsId', newsId);
    else url.searchParams.set('siteSearchText', matchedText.slice(0, 100));
    const heading = document.createElement('span');
    heading.className = 'site-search-result-title';
    heading.textContent = title;
    const excerpt = document.createElement('span');
    excerpt.className = 'site-search-result-text';
    excerpt.textContent = text;
    link.href = url.href;
    link.append(heading, excerpt);
    return link;
  }

  function loadIndex() {
    return pages;
  }

  function addNewsResults(matches, query) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      saved.forEach(item => {
        const text = [item.title, item.category, item.excerpt, item.content].join(' ').replace(/\s+/g, ' ').trim();
        if (text.toLocaleLowerCase('ru-RU').includes(query)) {
          matches.push({ page: 'news/News.html', title: 'Новости — munprizma', text, matchedText: text, newsId: item.id });
        }
      });
    } catch (error) {
      return;
    }
  }

  function search(query) {
    results.replaceChildren();
    showMessage('Ищем совпадения...');
    try {
      const index = loadIndex();
      const matches = [];
      index.forEach(page => page.items.forEach(item => {
        if (item.toLocaleLowerCase('ru-RU').includes(query)) {
          matches.push({ page: page.page, title: page.title, text: item, matchedText: item });
        }
      }));
      addNewsResults(matches, query);
      results.replaceChildren();
      if (!matches.length) return showMessage('Совпадений не найдено. Попробуйте другое слово.');
      matches.slice(0, 30).forEach(match => {
        results.append(resultLink(match.page, match.title, match.text, query, match.matchedText, match.newsId));
      });
      const count = document.createElement('p');
      count.className = 'site-search-message';
      count.textContent = `Найдено совпадений: ${matches.length}`;
      results.prepend(count);
    } catch (error) {
      showMessage('Не удалось загрузить поисковый индекс сайта.');
    }
  }

  trigger.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    trigger.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) input.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim().toLocaleLowerCase('ru-RU');
    if (query.length < 2) return showMessage('Введите не менее двух символов.');
    search(query);
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  const params = new URLSearchParams(location.search);
  const query = params.get('siteSearch');
  const newsId = params.get('newsId');
  if (query && newsId) {
    const timer = window.setInterval(() => {
      const card = document.querySelector(`[data-news-id="${CSS.escape(newsId)}"]`);
      if (!card) return;
      window.clearInterval(timer);
      const fullText = card.querySelector('.news-card-full-text');
      if (fullText) fullText.hidden = false;
      card.classList.add('site-search-highlight');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    window.setTimeout(() => window.clearInterval(timer), 5000);
  } else if (query) {
    const matchedText = params.get('siteSearchText') || '';
    const candidates = [...document.querySelectorAll(contentSelector)];
    const target = candidates.find(node => (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().startsWith(matchedText))
      || candidates.find(node => (node.innerText || node.textContent || '').toLocaleLowerCase('ru-RU').includes(query));
    if (target) {
      target.classList.add('site-search-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();
