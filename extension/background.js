// background.js — Service worker minimal
// Initialise le stockage et écoute les mises à jour de langue

'use strict';

// Initialise la langue par défaut lors de l'installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('langue', ({ langue }) => {
    if (!langue) {
      chrome.storage.sync.set({ langue: 'en' });
    }
  });
});

// Relaye les changements de langue aux content scripts actifs
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.langue) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'LANGUE_CHANGED',
          langue: changes.langue.newValue,
        }).catch(() => {
          // Tab ne supporte pas les messages (ex: chrome://)
        });
      });
    });
  }
});
