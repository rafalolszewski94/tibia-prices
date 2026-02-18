const STORAGE_KEY_PRICE_PER_250_PLN = 'tibiaPrices:pricePer250TcPln';
const STORAGE_KEY_PRICE_PER_250_EUR = 'tibiaPrices:pricePer250TcEur';
const STORAGE_KEY_LEGACY_PLN = 'tibiaPrices:pricePer250Tc';
const DEFAULT_PRICE_PLN = 40;
const DEFAULT_PRICE_EUR = 0;

/** XPath for TC on auction list (overview) – all rows (tr[2], tr[3], …). */
const XPATH_TC_AUCTION_LIST =
  '//*[@id="currentcharactertrades"]/div[5]/div/div/div[4]/table/tbody/tr/td/div[2]/table/tbody/tr[position()>=2]/td/div/table/tbody/tr/td/div/div[2]/div[3]/div[6]/div[2]/b';

/** XPath for TC on specific character auction (details). */
const XPATH_TC_AUCTION_DETAILS =
  '//*[@id="currentcharactertrades"]/div[5]/div/div/div[3]/table/tbody/tr/td/div[2]/table/tbody/tr/td/div/table/tbody/tr/td/div/div[2]/div[3]/div[6]/div[2]/b';

type PricesPer250 = { pln: number; eur: number };

const getPricesPer250 = (): Promise<PricesPer250> =>
  browser.storage.local
    .get([
      STORAGE_KEY_PRICE_PER_250_PLN,
      STORAGE_KEY_PRICE_PER_250_EUR,
      STORAGE_KEY_LEGACY_PLN,
    ])
    .then((v) => {
      const rawPln = v[STORAGE_KEY_PRICE_PER_250_PLN];
      const rawEur = v[STORAGE_KEY_PRICE_PER_250_EUR];
      const legacy = v[STORAGE_KEY_LEGACY_PLN];
      const pln: number =
        typeof rawPln === 'number' && Number.isFinite(rawPln)
          ? rawPln
          : typeof legacy === 'number' && Number.isFinite(legacy)
            ? legacy
            : DEFAULT_PRICE_PLN;
      const eur: number =
        typeof rawEur === 'number' && Number.isFinite(rawEur) && rawEur > 0
          ? rawEur
          : DEFAULT_PRICE_EUR;
      return { pln, eur };
    });

const parseTcFromText = (text: string): number | null => {
  const cleaned = text.replace(/\s/g, '').replace(/,/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

const tcToAmount = (tc: number, pricePer250: number): number =>
  (tc / 250) * pricePer250;

const evaluateXPath = (doc: Document, xpath: string): Node[] => {
  const result = doc.evaluate(
    xpath,
    doc,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const nodes: Node[] = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i);
    if (node) nodes.push(node);
  }
  return nodes;
};

const injectPriceHint = (
  tcElement: Element,
  pln: number,
  eur: number
): void => {
  const existing = tcElement.nextElementSibling;
  if (existing?.classList?.contains('tibia-prices-pln-hint')) {
    existing.remove();
  }
  const span = document.createElement('span');
  span.className = 'tibia-prices-pln-hint';
  span.style.cssText =
    'color:#8b6914;margin-left:0.25em;font-size:0.75em;font-weight:600;white-space:nowrap;';
  span.textContent =
    eur > 0
      ? `(${pln.toFixed(2)} PLN / ${eur.toFixed(2)} EUR)`
      : `(${pln.toFixed(2)} PLN)`;
  tcElement.parentNode?.insertBefore(span, tcElement.nextSibling);
};

const runConversion = (prices: PricesPer250): void => {
  const isDetails = document.URL.includes('page=details');
  const xpath = isDetails ? XPATH_TC_AUCTION_DETAILS : XPATH_TC_AUCTION_LIST;
  const nodes = evaluateXPath(document, xpath);

  for (const node of nodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    const tc = parseTcFromText(el.textContent ?? '');
    if (tc === null || tc <= 0) continue;
    const pln = tcToAmount(tc, prices.pln);
    const eur = prices.eur > 0 ? tcToAmount(tc, prices.eur) : 0;
    injectPriceHint(el, pln, eur);
  }
};

const runWhenReady = (): void => {
  getPricesPer250().then((prices) => {
    runConversion(prices);
  });
};

const debounce = (fn: () => void, ms: number): (() => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn();
    }, ms);
  };
};

export default defineContentScript({
  matches: ['*://www.tibia.com/charactertrade/*'],
  main() {
    const run = (): void => {
      const root = document.getElementById('currentcharactertrades');
      if (!root) {
        setTimeout(run, 300);
        return;
      }
      runWhenReady();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }

    const debouncedRunWhenReady = debounce(() => {
      if (document.getElementById('currentcharactertrades')) {
        runWhenReady();
      }
    }, 150);

    const observer = new MutationObserver(() => {
      debouncedRunWhenReady();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      if (
        STORAGE_KEY_PRICE_PER_250_PLN in changes ||
        STORAGE_KEY_PRICE_PER_250_EUR in changes
      ) {
        runWhenReady();
      }
    });
  },
});
