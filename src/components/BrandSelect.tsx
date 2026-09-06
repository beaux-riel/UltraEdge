import React, { useState } from 'react';
import { View, Modal, ScrollView, TextInput } from 'react-native';
import { Button, BodySmall, H2 } from './ui';
import { useTheme } from '../theme';
import { useGear } from '../context/GearContext';
export const GEAR_BRANDS = [
  'Altra',
  'Arc’teryx',
  'ASICS',
  'Black Diamond',
  'Brooks',
  'CamelBak',
  'COROS',
  'Garmin',
  'HOKA',
  'HydraPak',
  'Injinji',
  'La Sportiva',
  'LEKI',
  'NNormal',
  'Nathan',
  'New Balance',
  'Nike',
  'Osprey',
  'Patagonia',
  'Petzl',
  'Salomon',
  'Saucony',
  'Silva',
  'Suunto',
  'The North Face',
  'Topo Athletic',
  'Ultimate Direction',
];
export default function BrandSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const {
    theme: { colors },
  } = useTheme();
  const { gearItems } = useGear();
  const [open, setOpen] = useState(false);
  const [other, setOther] = useState(false);
  const [query, setQuery] = useState('');
  const brands = [
    ...new Set([
      ...GEAR_BRANDS,
      ...gearItems.map((g) => g.brand?.trim()).filter((b): b is string => !!b),
    ]),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <View style={{ gap: 8 }}>
      <Button variant="secondary" onPress={() => setOpen(true)}>
        {value || 'Select brand'} ▾
      </Button>
      {(other || (!!value && !brands.includes(value))) && (
        <TextInput
          accessibilityLabel="Other brand"
          value={value}
          onChangeText={onChange}
          placeholder="Brand name"
          placeholderTextColor={colors.stone}
          style={{
            color: colors.bark,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
          }}
        />
      )}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            padding: 24,
            paddingTop: 32,
            gap: 12,
          }}
        >
          <H2>Select brand</H2>
          <Button variant="tertiary" onPress={() => setOpen(false)}>
            Done
          </Button>
          <TextInput
            accessibilityLabel="Search brands"
            value={query}
            onChangeText={setQuery}
            placeholder="Search brands"
            placeholderTextColor={colors.stone}
            style={{
              color: colors.bark,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
            }}
          />
          <ScrollView keyboardShouldPersistTaps="handled">
            {brands
              .filter((b) => b.toLowerCase().includes(query.toLowerCase()))
              .map((b) => (
                <Button
                  key={b}
                  variant="tertiary"
                  onPress={() => {
                    onChange(b);
                    setOther(false);
                    setOpen(false);
                  }}
                >
                  {b}
                </Button>
              ))}
            <Button
              variant="secondary"
              onPress={() => {
                onChange('');
                setOther(true);
                setOpen(false);
              }}
            >
              Other
            </Button>
            <Button
              variant="tertiary"
              onPress={() => {
                onChange('');
                setOther(false);
                setOpen(false);
              }}
            >
              No brand
            </Button>
            <BodySmall>
              Custom brands from your saved gear appear here next time.
            </BodySmall>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
