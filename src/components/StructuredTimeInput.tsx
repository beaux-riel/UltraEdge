import React, { useState } from 'react';
import { View, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BodySmall, Button } from './ui';
import { useTheme } from '../theme';
import { formatDateOnly } from '../lib/dateOnly';

/** Numeric hours and minutes keep durations >24 hours distinct from clock times. */
export function DurationInput({
  label,
  value,
  onChange,
  clock = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clock?: boolean;
}) {
  const {
    theme: { colors },
  } = useTheme();
  const parts = value.split(':');
  const update = (index: number, text: string) => {
    const next = [parts[0] || '', parts[1] || ''];
    next[index] = text
      .replace(/[^0-9]/g, '')
      .slice(0, index === 0 && !clock ? 3 : 2);
    onChange(next.every((v) => !v) ? '' : next.join(':'));
  };
  const invalid =
    !!value &&
    !new RegExp(
      clock ? '^([01]?\\d|2[0-3]):[0-5]\\d$' : '^\\d{1,3}:[0-5]\\d$',
    ).test(value);
  return (
    <View style={{ gap: 6 }}>
      <BodySmall>{label}</BodySmall>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['Hours', 'Minutes'].map((part, i) => (
          <View key={part} style={{ flex: 1 }}>
            <TextInput
              accessibilityLabel={`${label} ${part.toLowerCase()}`}
              value={parts[i] || ''}
              onChangeText={(v) => update(i, v)}
              keyboardType="number-pad"
              placeholder={i ? '00' : '0'}
              placeholderTextColor={colors.stone}
              style={{
                color: colors.bark,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                minHeight: 48,
              }}
            />
            <BodySmall>
              {part}
              {clock && !i ? ' (24-hour)' : ''}
            </BodySmall>
          </View>
        ))}
      </View>
      {invalid && (
        <BodySmall accessibilityRole="alert">
          {clock
            ? 'Hours must be 0–23; minutes 00–59.'
            : 'Enter hours and two-digit minutes (00–59).'}
        </BodySmall>
      )}
      {!!value && (
        <Button variant="tertiary" onPress={() => onChange('')}>
          Clear {label.toLowerCase()}
        </Button>
      )}
    </View>
  );
}

/** Explicit local date + clock pickers; serializes local time for existing validation. */
export function DateTimeInput({
  label,
  value,
  onChange,
  nowLabel = 'Choose date and time',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  nowLabel?: string;
}) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const parsed = value ? new Date(value) : new Date();
  const valid = Number.isFinite(parsed.getTime());
  const date = valid ? parsed : new Date();
  const serialize = (d: Date) =>
    `${formatDateOnly(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return (
    <View style={{ gap: 8 }}>
      <BodySmall>{label}</BodySmall>
      <BodySmall>
        {value
          ? valid
            ? date.toLocaleString()
            : `Previously saved: ${value}. Choose a valid date and time.`
          : nowLabel}
      </BodySmall>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button
          variant="secondary"
          onPress={() => {
            if (!value || !valid) {
              onChange(serialize(date));
            }
            setMode('date');
          }}
        >
          Select date
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            if (!value || !valid) {
              onChange(serialize(date));
            }
            setMode('time');
          }}
        >
          Select time
        </Button>
      </View>
      {mode && (
        <>
          <DateTimePicker
            value={date}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              if (Platform.OS !== 'ios') {
                setMode(null);
              }
              if (event.type !== 'dismissed' && selected) {
                onChange(serialize(selected));
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <Button variant="tertiary" onPress={() => setMode(null)}>
              Done choosing
            </Button>
          )}
        </>
      )}
      {!!value && (
        <Button
          variant="tertiary"
          onPress={() => {
            onChange('');
            setMode(null);
          }}
        >
          Clear {label.toLowerCase()}
        </Button>
      )}
    </View>
  );
}
