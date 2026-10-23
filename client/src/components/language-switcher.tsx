import { useTranslation } from '../contexts/language-context';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white p-1"
      role="group"
      aria-label={t('Language')}
    >
      {(['ru', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            language === option
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
