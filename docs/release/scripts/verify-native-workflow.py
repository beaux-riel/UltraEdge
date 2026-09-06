"""Read-only assertions for the fictional Maestro workflow on an explicit simulator."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

udid = sys.argv[1]
container = Path(subprocess.check_output(['xcrun', 'simctl', 'get_app_container', udid, 'com.beaux.ultraedge', 'data'], text=True).strip())
root = container / 'Library/Application Support/com.beaux.ultraedge/RCTAsyncLocalStorage_V1'
manifest = json.loads((root / 'manifest.json').read_text())
def read(key):
    value = manifest[key]
    if value is None:
        value = (root / hashlib.md5(key.encode()).hexdigest()).read_text()
    return json.loads(value)

races = {r['name']: r['id'] for r in read('@ultraedge/events')}
a, b = races['QA Alpine 100'], races['QA Forest 50']
gear = read('@ultraedge/gear-items')
flask = next(g['id'] for g in gear if g['name'] == 'QA Soft Flask')
allocations = read('@ultraedge/event-gear')
first = next(g for g in allocations if g['eventId'] == a and g['gearItemId'] == flask)
second = next(g for g in allocations if g['eventId'] == b and g['gearItemId'] == flask)
assert first['quantity'] == 2 and first['isPacked'] and first['isCarried'], first
assert second['quantity'] == 1 and not second.get('isPacked') and second['isCarried'], second
members = read('@ultraedge/crew')
alex = next(m['id'] for m in members if m['name'] == 'QA Alex')
assignments = read('@ultraedge/event-crew')
assert next(c for c in assignments if c['eventId'] == a and c['crewMemberId'] == alex)['roles'] == ['pacer']
assert next(c for c in assignments if c['eventId'] == b and c['crewMemberId'] == alex)['roles'] == ['driver']
bags = [bag for bag in read('@ultraedge/dropbags') if bag['name'] == 'QA Night Bag']
assert len(bags) == 2 and {bag['eventId'] for bag in bags} == {a, b}
template = next(t for t in read('@ultraedge/dropbag-templates') if t['name'] == 'QA Night Bag')
assert 'eventId' not in template and 'checkpointId' not in template
checkpoint = next(c for c in read('ultraedge_checkpoints')[a] if c['name'] == 'QA Summit Aid')
assert checkpoint['checkpoint_type'] == 'drop_bag' or checkpoint['has_drop_bag']
assert next(bag for bag in bags if bag['eventId'] == a)['checkpointId'] == checkpoint['id']
for bag in bags:
    assert (bag['checkpointId'] is None) == (bag['eventId'] == b)
    assert bag['items'][0]['refId'] == flask and bag['items'][0]['quantity'] == 1
assert len({bag['items'][0]['id'] for bag in bags} | {template['items'][0]['id']}) == 3
morgan = next(m['id'] for m in members if m['name'] == 'QA Morgan')
assert any(c['eventId'] == b and c['crewMemberId'] == morgan for c in assignments)
lamp = next(g['id'] for g in gear if g['name'] == 'QA Headlamp')
assert any(g['eventId'] == b and g['gearItemId'] == lamp for g in allocations)
print('PASS: two UI-created races; shared gear with isolated quantity/packing; shared crew with independent pacer/driver roles; durable template and independent bag item IDs.')
