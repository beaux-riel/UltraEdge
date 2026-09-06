import React, { useState, useRef } from 'react';
import { View, TextInput, Alert, Keyboard } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Event } from '../lib/database.types';
import { useEvents } from '../context/EventContext';
import { EventGearAllocation } from '../lib/eventGear';
import { GearItem } from '../context/GearContext';
import { requirementStatus, GearRequirement } from '../lib/mandatoryGear';
import { Button, H3, Body, BodySmall, Card, CardContent } from './ui';
import { useTheme } from '../theme';
export default function MandatoryGearPanel({
  event,
  gear,
  allocations,
}: {
  event: Event;
  gear: GearItem[];
  allocations: EventGearAllocation[];
}) {
  const { updateEvent } = useEvents();
  const {
    theme: { colors },
  } = useTheme();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const requirements = event.mandatoryGear ?? [];
  const save = async (next: GearRequirement[]) => {
    if (lock.current) {
      return;
    }
    Keyboard.dismiss();
    lock.current = true;
    setBusy(true);
    try {
      if (!(await updateEvent(event.id, { mandatoryGear: next }))) {
        throw new Error('Race no longer exists.');
      }
      return true;
    } catch (e) {
      Alert.alert(
        'Requirements not saved',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const inputStyle = {
    color: colors.bark,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    minHeight: 48,
  };
  return (
    <Card style={{ marginVertical: 12 }}>
      <CardContent>
        <H3>Mandatory race gear</H3>
        <BodySmall style={{ marginVertical: 8 }}>
          Add the requirements from your event’s official guide, then match
          items from this race’s packing list. Required quantities count gear
          worn or carried with you.
        </BodySmall>
        {requirements.map((r) => {
          const status = requirementStatus(
            r,
            allocations,
            gear.filter((g) => !g.retired && g.isActive).map((g) => g.id),
          );
          return (
            <View
              key={r.id}
              style={{
                gap: 8,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Body>
                {r.name} ×{r.quantity}
              </Body>
              <BodySmall>
                {status.ready
                  ? '✓ Packed requirement'
                  : `${status.missing} still to pack`}{' '}
                • {status.assigned} assigned / {status.packed} packed
              </BodySmall>
              <Button
                disabled={busy}
                variant="tertiary"
                onPress={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                Match gear / edit requirement
              </Button>
              {expanded === r.id && (
                <>
                  <BodySmall>Required quantity</BodySmall>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Button
                      disabled={busy || r.quantity <= 1}
                      onPress={() =>
                        save(
                          requirements.map((row) =>
                            row.id === r.id
                              ? { ...row, quantity: row.quantity - 1 }
                              : row,
                          ),
                        )
                      }
                    >
                      −
                    </Button>
                    <Body>{r.quantity}</Body>
                    <Button
                      disabled={busy}
                      onPress={() =>
                        save(
                          requirements.map((row) =>
                            row.id === r.id
                              ? { ...row, quantity: row.quantity + 1 }
                              : row,
                          ),
                        )
                      }
                    >
                      +
                    </Button>
                  </View>
                  {gear
                    .filter((g) =>
                      allocations.some((a) => a.gearItemId === g.id),
                    )
                    .map((g) => (
                      <Button
                        key={g.id}
                        disabled={busy}
                        variant="secondary"
                        onPress={() =>
                          save(
                            requirements.map((row) =>
                              row.id === r.id
                                ? {
                                    ...row,
                                    gearIds: row.gearIds.includes(g.id)
                                      ? row.gearIds.filter((id) => id !== g.id)
                                      : [...row.gearIds, g.id],
                                  }
                                : row,
                            ),
                          )
                        }
                      >
                        {r.gearIds.includes(g.id) ? '✓ ' : ''}
                        {g.name}
                      </Button>
                    ))}
                  <BodySmall>
                    Add missing items to this race’s gear list below. Removing
                    an item leaves this requirement incomplete.
                  </BodySmall>
                  <Button
                    disabled={busy}
                    variant="tertiary"
                    onPress={() =>
                      Alert.alert('Remove requirement?', r.name, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          onPress: () =>
                            save(requirements.filter((row) => row.id !== r.id)),
                        },
                      ])
                    }
                  >
                    Remove requirement
                  </Button>
                </>
              )}
            </View>
          );
        })}
        <View style={{ gap: 8, marginTop: 12 }}>
          <TextInput
            accessibilityLabel="Mandatory gear requirement"
            placeholder="e.g., Light sources"
            placeholderTextColor={colors.stone}
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
          <BodySmall>Required quantity</BodySmall>
          <TextInput
            accessibilityLabel="Required quantity"
            value={quantity}
            onChangeText={(v) =>
              setQuantity(v.replace(/[^0-9]/g, '').slice(0, 3))
            }
            keyboardType="number-pad"
            style={inputStyle}
          />
          <Button
            disabled={
              busy ||
              !name.trim() ||
              !Number.isInteger(Number(quantity)) ||
              Number(quantity) < 1
            }
            onPress={async () => {
              const saved = await save([
                ...requirements,
                {
                  id: Crypto.randomUUID(),
                  name: name.trim(),
                  quantity: Number(quantity),
                  gearIds: [],
                },
              ]);
              if (saved) { setName(''); setQuantity('1'); }
            }}
          >
            Add requirement
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
