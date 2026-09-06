#!/usr/bin/env python3
"""Seed fictional local data in an explicitly supplied, stopped iOS Simulator app."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import plistlib
import re
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--container', required=True, type=Path, help='Exact CoreSimulator application DATA container; app must be terminated first')
args = parser.parse_args()
container = args.container.expanduser().resolve()
if not re.search(r'/CoreSimulator/Devices/[A-Fa-f0-9-]+/data/Containers/Data/Application/[A-Fa-f0-9-]+$', str(container)):
    parser.error('Refusing non-Simulator application data container')
metadata = container / '.com.apple.mobile_container_manager.metadata.plist'
if not metadata.exists():
    parser.error('Container metadata missing')
with metadata.open('rb') as f:
    if plistlib.load(f).get('MCMMetadataIdentifier') != 'com.beaux.ultraedge':
        parser.error('Container does not belong to com.beaux.ultraedge')
storage = container / 'Library/Application Support/com.beaux.ultraedge/RCTAsyncLocalStorage_V1'
manifest_path = storage / 'manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
fixtures = Path(__file__).resolve().parent
values = json.loads((fixtures / 'moonridge-100.json').read_text())
gpx = container / 'Documents/gpx/fixture-moonridge-100.gpx'
values['@ultraedge/events'][0]['gpx_file_url'] = gpx.as_uri()
# Decode before any write. Merge fixture records, retaining unrelated local plans.
for key, incoming in list(values.items()):
    raw = manifest.get(key)
    if raw is None and key in manifest:
        raw = (storage / hashlib.md5(key.encode()).hexdigest()).read_text()
    previous = json.loads(raw) if raw is not None else ({} if isinstance(incoming, dict) else [])
    if isinstance(incoming, dict):
        values[key] = {**previous, **incoming}
    else:
        def identity(row):
            return row.get('id') or (row.get('eventId'), row.get('crewMemberId') or row.get('gearItemId'))
        ids = {identity(row) for row in incoming}
        values[key] = [row for row in previous if identity(row) not in ids] + incoming
backup = container / ('fixture-backup-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
backup.mkdir()
if storage.exists():
    shutil.copytree(storage, backup / 'RCTAsyncLocalStorage_V1')
if gpx.exists():
    shutil.copy2(gpx, backup / gpx.name)
storage.mkdir(parents=True, exist_ok=True)
gpx.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(fixtures / 'moonridge-100.gpx', gpx)
# Native AsyncStorage uses strings <= 1024 UTF-16 code units inline; larger
# values are UTF-8 files named MD5(key) and a null manifest value.
for key, value in values.items():
    raw = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    if len(raw.encode('utf-16-le')) // 2 <= 1024:
        manifest[key] = raw
    else:
        (storage / hashlib.md5(key.encode()).hexdigest()).write_text(raw)
        manifest[key] = None
pending = storage / 'manifest.fixture.tmp'
pending.write_text(json.dumps(manifest, ensure_ascii=False))
pending.replace(manifest_path)
print(f'Seeded fictional Moonridge 100. Backup: {backup}')
