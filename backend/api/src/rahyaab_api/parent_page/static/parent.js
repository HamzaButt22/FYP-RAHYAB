// Family report (P-01, P-01b). The page is complete without this script; it adds:
// - Listen: reads the report aloud with the phone's own voice (Web Speech API). Nothing is sent anywhere.
// - My children (FR-105): the parent may save this report link on this phone (off unless they choose it).
//   The list lives only in this browser's localStorage. No request ever carries another child's link, and the
//   server never learns that two children share a parent.
(function () {
  'use strict';
  var KEY = 'rahyaab.children';

  function load() {
    try {
      var list = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list.filter(function (c) { return c && typeof c.url === 'string'; }) : [];
    } catch (e) {
      return [];
    }
  }

  function store(list) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false; // private mode or storage blocked: nothing is saved, the page still works
    }
  }

  function here() {
    return window.location.pathname;
  }

  // ------------------------------------------------------------------------------------------ Listen
  function setUpListen() {
    var button = document.getElementById('listen');
    if (!button || !('speechSynthesis' in window)) return;
    button.hidden = false;
    button.addEventListener('click', function () {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        button.setAttribute('aria-pressed', 'false');
        button.textContent = 'Listen';
        return;
      }
      var main = document.querySelector('main');
      var speech = new window.SpeechSynthesisUtterance(main ? main.innerText : '');
      speech.lang = 'en';
      speech.onend = speech.onerror = function () {
        button.setAttribute('aria-pressed', 'false');
        button.textContent = 'Listen';
      };
      window.speechSynthesis.speak(speech);
      button.setAttribute('aria-pressed', 'true');
      button.textContent = 'Stop';
    });
  }

  // ------------------------------------------------------------------------------------- My children
  function render() {
    var list = load();
    var section = document.getElementById('children');
    var ul = document.getElementById('children-list');
    if (!section || !ul) return;
    ul.textContent = '';
    section.hidden = list.length === 0;
    list.forEach(function (child) {
      var li = document.createElement('li');
      if (child.url === here()) {
        var b = document.createElement('b');
        b.textContent = child.nickname + ' (this report)';
        li.appendChild(b);
      } else {
        var a = document.createElement('a');
        a.href = child.url;
        a.textContent = child.nickname;
        li.appendChild(a);
      }
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + child.nickname + ' from this phone');
      remove.addEventListener('click', function () {
        store(load().filter(function (c) { return c.url !== child.url; }));
        render();
        setUpSave();
      });
      li.appendChild(remove);
      ul.appendChild(li);
    });
  }

  function setUpSave() {
    var report = document.getElementById('report');
    var save = document.getElementById('save');
    var button = document.getElementById('save-button');
    if (!report || !save || !button) return; // the "link no longer active" page has nothing to save
    var saved = load().some(function (c) { return c.url === here(); });
    save.hidden = saved;
    button.onclick = function () {
      var list = load().filter(function (c) { return c.url !== here(); });
      list.push({ nickname: report.getAttribute('data-child') || 'Child', url: here() });
      if (store(list)) {
        save.hidden = true;
        render();
      }
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    setUpListen();
    render();
    setUpSave();
  });
})();
