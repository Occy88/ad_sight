const AD_PATTERNS = {
  PARAM_KEYS: /^(utm_|gad|gclid|fbclid|msclkid|trk_|adid|dclid)|ad/,
  COOKIE_KEYS: /(_|^)(ga|utm|gclid|fbclid|msclkid|trk|adid|targeting)/,
  REFERRER_KEYWORDS: /(\b|_)(ads?|track|analytics|marketing|doubleclick|affiliate|promo)/,
  VALUE_KEYWORDS: /(source=|medium=|campaign=|term=|content=|affiliate=|promo)/i
};

let isDiagnosticsOpen = false;
let collapseTimeout;

function isAdRelated(key, value, context = 'param') {
  switch(context) {
    case 'param':
      return AD_PATTERNS.PARAM_KEYS.test(key) ||
          AD_PATTERNS.VALUE_KEYWORDS.test(value);
    case 'cookie':
      return AD_PATTERNS.COOKIE_KEYS.test(key);
    case 'referrer':
      return AD_PATTERNS.REFERRER_KEYWORDS.test(value);
    default:
      return false;
  }
}

function checkAdInfluence() {
  const sources = [];

  // URL Parameters
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params) {
    if (isAdRelated(key, value, 'param')) {
      sources.push({
        type: 'url',
        key,
        value,
        name: `url-${key}`
      });
    }
  }

  // Cookies
  document.cookie.split(';').forEach(cookie => {
    const [key, val] = cookie.trim().split('=');
    if (key && isAdRelated(key, val, 'cookie')) {
      sources.push({
        type: 'cookie',
        key,
        value: val,
        name: `cookie-${key}`
      });
    }
  });

  // Referrer Analysis
  if (document.referrer && isAdRelated('referrer', document.referrer, 'referrer')) {
    sources.push({
      type: 'referrer',
      value: document.referrer,
      name: 'url-referrer'
    });
  }

  return { isAdInfluenced: sources.length > 0, beneficiaries: sources };
}

injectStyles();
const container = createContainer();
document.body.appendChild(container);

const {isAdInfluenced, beneficiaries} = checkAdInfluence();
updateAppearance(isAdInfluenced);
renderPanelContent(beneficiaries);
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
#adInfluenceContainer {
    position: fixed;
    background: rgba(200, 200, 200, 0.3);
    backdrop-filter:blur(4px);
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    transition: width 0.3s ease;
    overflow: visible;
    z-index: 999999;
    border-radius: 15px; /* Matches button radius */
}

#adInfluenceContainer:hover {
    width: auto; 
    height: auto;
    min-width: 30px; 
    min-height: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2); /* Optional shadow */
}

#adInfluenceButton {
    position: absolute;
    right: 0;
    top: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #333;
    z-index: 1; /* Ensure button stays above panel */
    background: transparent;
}

#adInfluencePanel {
    position: relative;
    left: 0;
    top: 0;
    width: 100% /* Account for button width */
    height: 100%;
    padding: 15px 20px 15px 15px;
    display: none;
    background: transparent;
}

#adInfluenceContainer:hover #adInfluencePanel {
    display: block;
}

/* Example content styling - adjust as needed */
#adInfluencePanel p {
    margin: 0;
    color: #333;
    font-size: 12px;
    line-height: 1.4;
    background: transparent; /* Important for the illusion */
}
    
    .pannelHeader {
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      padding: 4px;
      text-align: center;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a1a1a;
      font-size: 16px;
      line-height: 1.3;
    }
    
    .beneficiary {
      margin: 8px 0;
      background: rgba(255,255,255,0.5);
      border-radius: 6px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: transform 0.2s ease;
    }
    
    .beneficiary:hover {
      transform: translateY(-1px);
    }
    
    .beneficiary div {
      flex-grow: 1;
      margin-right: 15px;
    }
    
    .beneficiary strong {
      display: block;
      font-size: 14px;
      margin-bottom: 4px;
      color: #333;
    }
    
    .beneficiary span {
      display: block;
      font-size: 13px;
      color: #666;
      word-break: break-word;
    }
    
    .beneficiary button {
      background: #ff4444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 500;
    }
    
    .beneficiary button:hover {
      background: #cc0000;
    }
    
    .diagnostics-btn {
      display: block;
      width: 100%;
      margin-top: 12px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 13px;
      padding: 8px 0;
      text-align: left;
      text-decoration: underline;
      transition: color 0.2s;
    }
    
    .diagnostics-btn:hover {
      color: #333;
    }
    
    .diagnostics-content {
      margin-top: 12px;
      padding: 12px;
      background: rgba(255,255,255,0.8);
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      border: 1px solid rgba(0,0,0,0.05);
    }
    
    .diagnostics-content pre {
      margin: 8px 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Monaco, Consolas, monospace;
    }
  `;
  document.head.appendChild(style);
}

function createContainer() {
  const container = document.createElement('div');
  container.id = 'adInfluenceContainer';

  const button = document.createElement('div');
  button.id = 'adInfluenceButton';
  button.textContent = '?';

  const panel = document.createElement('div');
  panel.id = 'adInfluencePanel';

  container.appendChild(button);
  container.appendChild(panel);

  button.addEventListener('mouseenter', () => {
    clearTimeout(collapseTimeout);
    container.classList.add('expanded');
  });

  button.addEventListener('mouseleave', () => {
    collapseTimeout = setTimeout(() => container.classList.remove('expanded'), 200);
  });

  setupDiagnosticsButton(panel);
  return container;
}

function updateAppearance(isAdInfluenced) {
  const button = document.getElementById('adInfluenceContainer');
  const bg = isAdInfluenced ? 'rgba(255, 70, 70, 0.3)' : 'rgba(200, 200, 200, 0.3)';
  button.style.background = bg;
  button.style.color = isAdInfluenced ? 'white' : '#333';
}

function renderPanelContent(beneficiaries) {
  const panel = document.getElementById('adInfluencePanel');
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'pannelHeader';
  header.textContent = beneficiaries.length ? 'Ad Tracking Detected' : 'No Ad Tracking Found';
  panel.appendChild(header);

  if (beneficiaries.length) {
    beneficiaries.forEach(b => {
      const entry = document.createElement('div');
      entry.className = 'beneficiary';
      entry.innerHTML = `
                <div>
                    <strong>${b.name}</strong>
                    <span>${b.value}</span>
                </div>
                ${b.type !== 'referrer' ? `<button data-type="${b.type}" data-key="${b.key}">Remove</button>` : ''}
            `;
      if (b.type !== 'referrer') {
        entry.querySelector('button').addEventListener('click', handleRemoveBeneficiary);
      }
      panel.appendChild(entry);
    });
  }
}

function handleRemoveBeneficiary(event) {
  const { key, type } = event.target.dataset;

  if (type === 'url') {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}${window.location.hash}`);
  }
  else if (type === 'cookie') {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
  }

  const {isAdInfluenced, beneficiaries} = checkAdInfluence();
  updateAppearance(isAdInfluenced);
  renderPanelContent(beneficiaries);
}

function setupDiagnosticsButton(panel) {
  const diagnosticsBtn = document.createElement('button');
  diagnosticsBtn.className = 'diagnostics-btn';
  diagnosticsBtn.textContent = 'Show Diagnostics';
  diagnosticsBtn.addEventListener('click', () => {
    isDiagnosticsOpen = !isDiagnosticsOpen;
    const existing = panel.querySelector('.diagnostics-content');
    if (existing) existing.remove();
    if (isDiagnosticsOpen) {
      const info = document.createElement('div');
      info.className = 'diagnostics-content';
      info.innerHTML = generateDiagnosticsContent();
      panel.appendChild(info);
    }
  });
  panel.appendChild(diagnosticsBtn);
}

function generateDiagnosticsContent() {
  const detected = {
    params: Array.from(new URLSearchParams(window.location.search).entries())
        .filter(([k, v]) => isAdRelated(k, v, 'param')),
    cookies: document.cookie.split(';')
        .map(c => c.trim().split('='))
        .filter(([k, v]) => k && isAdRelated(k, v, 'cookie')),
    referrer: document.referrer
  };

  return `
        <strong>Diagnostics</strong>
        <pre>
Detected parameters:
${detected.params.map(([k, v]) => `${k}: ${v}`).join('\n') || 'None'}

Detected cookies:
${detected.cookies.map(([k, v]) => `${k}: ${v}`).join('\n') || 'None'}

Referrer: ${detected.referrer || 'None'}

User agent:
${navigator.userAgent}
        </pre>
    `;
}