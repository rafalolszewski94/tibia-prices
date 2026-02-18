import { useState, useEffect } from 'react';

const STORAGE_KEY_PRICE_PER_250_PLN = 'tibiaPrices:pricePer250TcPln';
const STORAGE_KEY_PRICE_PER_250_EUR = 'tibiaPrices:pricePer250TcEur';
const STORAGE_KEY_LEGACY_PLN = 'tibiaPrices:pricePer250Tc';
const DEFAULT_PRICE_PLN = 40;
const DEFAULT_PRICE_EUR = 0;
const MIN_PRICE = 0;
const MAX_PRICE = 9999;

type Prices = { pln: number; eur: number };

const loadPrices = (): Promise<Prices> =>
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
        typeof rawEur === 'number' && Number.isFinite(rawEur)
          ? rawEur
          : DEFAULT_PRICE_EUR;
      const needMigration =
        typeof rawPln !== 'number' || !Number.isFinite(rawPln);
      if (needMigration) {
        void browser.storage.local.set({
          [STORAGE_KEY_PRICE_PER_250_PLN]: pln,
          [STORAGE_KEY_PRICE_PER_250_EUR]: eur,
        });
        void browser.storage.local.remove(STORAGE_KEY_LEGACY_PLN);
      }
      return { pln, eur };
    });

const savePrices = (prices: Prices): Promise<void> =>
  browser.storage.local.set({
    [STORAGE_KEY_PRICE_PER_250_PLN]: prices.pln,
    [STORAGE_KEY_PRICE_PER_250_EUR]: prices.eur,
  });

const PriceRow = ({
  label,
  suffix,
  value,
  inputValue,
  onInputChange,
  onBlur,
  onKeyDown,
  placeholder,
  ariaLabel,
}: {
  label: string;
  suffix: string;
  value: number;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  ariaLabel: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
      {label}
    </label>
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-shadow">
      <input
        type="number"
        inputMode="decimal"
        min={MIN_PRICE}
        max={MAX_PRICE}
        step={0.01}
        value={inputValue}
        onChange={onInputChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-3 py-2.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
      />
      <span className="pr-3 text-sm font-medium text-zinc-400">{suffix}</span>
    </div>
  </div>
);

function App() {
  const [pricePln, setPricePln] = useState<number>(DEFAULT_PRICE_PLN);
  const [inputPln, setInputPln] = useState<string>(String(DEFAULT_PRICE_PLN));
  const [priceEur, setPriceEur] = useState<number>(DEFAULT_PRICE_EUR);
  const [inputEur, setInputEur] = useState<string>(String(DEFAULT_PRICE_EUR));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPrices().then(({ pln, eur }) => {
      setPricePln(pln);
      setInputPln(String(pln));
      setPriceEur(eur);
      setInputEur(eur === 0 ? '' : String(eur));
    });
  }, []);

  const handlePlnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPln(e.target.value);
    setSaved(false);
  };

  const handlePlnBlur = () => {
    const parsed = Number.parseFloat(inputPln.replace(/,/g, '.'));
    if (!Number.isFinite(parsed)) {
      setInputPln(String(pricePln));
      return;
    }
    const clamped = Math.max(MIN_PRICE, Math.min(MAX_PRICE, parsed));
    setPricePln(clamped);
    setInputPln(String(clamped));
    savePrices({ pln: clamped, eur: priceEur }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  const handleEurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputEur(e.target.value);
    setSaved(false);
  };

  const handleEurBlur = () => {
    const raw = inputEur.trim();
    if (raw === '') {
      setPriceEur(0);
      setInputEur('');
      savePrices({ pln: pricePln, eur: 0 }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      });
      return;
    }
    const parsed = Number.parseFloat(raw.replace(/,/g, '.'));
    if (!Number.isFinite(parsed)) {
      setInputEur(priceEur === 0 ? '' : String(priceEur));
      return;
    }
    const clamped = Math.max(MIN_PRICE, Math.min(MAX_PRICE, parsed));
    setPriceEur(clamped);
    setInputEur(String(clamped));
    savePrices({ pln: pricePln, eur: clamped }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  };

  return (
    <div className="min-w-[300px] h-[320px] flex flex-col">
      <div className="bg-zinc-900/90 shadow-lg shadow-black/20 p-4 flex flex-col flex-1 min-h-0">
        <header className="space-y-1 pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Tibia TC → PLN / EUR
            </h1>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              250 TC
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Price per 250 Tibia Coins
          </p>
        </header>

        <div className="space-y-4 shrink-0 mt-2">
          <PriceRow
            label="PLN"
            suffix="PLN"
            value={pricePln}
            inputValue={inputPln}
            onInputChange={handlePlnChange}
            onBlur={handlePlnBlur}
            onKeyDown={handleKeyDown}
            ariaLabel="Price per 250 Tibia Coins in PLN"
          />
          <PriceRow
            label="EUR (optional)"
            suffix="EUR"
            value={priceEur}
            inputValue={inputEur}
            onInputChange={handleEurChange}
            onBlur={handleEurBlur}
            onKeyDown={handleKeyDown}
            placeholder="Optional"
            ariaLabel="Price per 250 Tibia Coins in EUR (optional)"
          />
        </div>

        <div
          className="min-h-6 flex items-center shrink-0"
          aria-live="polite"
          aria-atomic="true"
        >
          {saved && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
              Saved
            </p>
          )}
        </div>

        <p className="text-xs text-zinc-500 pt-1 mb-0 shrink-0">
          Changes apply on the character trade page immediately.
        </p>
      </div>
    </div>
  );
}

export default App;
