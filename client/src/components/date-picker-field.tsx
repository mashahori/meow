import { format, isValid, parseISO } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../contexts/language-context';
import { formatDate } from '../lib/date-format';
import { Calendar } from './ui/calendar';
import { Field } from './ui/field';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type DatePickerFieldProps = {
  id: string;
  label: string;
  // ISO date (YYYY-MM-DD), as stored in the form and sent to the API.
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
};

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  error,
  min,
  max,
}: DatePickerFieldProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selected = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const disabledDays = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <Field label={label} htmlFor={id} error={error}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          className="flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-transparent px-4 text-left text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-[#d1242f] aria-invalid:bg-[#ffebe9]"
        >
          <CalendarDays className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          {selected ? (
            formatDate(value)
          ) : (
            <span className="text-muted-foreground">{t('Select a date')}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={language === 'ru' ? ru : enUS}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? minDate}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={disabledDays}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, 'yyyy-MM-dd'));
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
