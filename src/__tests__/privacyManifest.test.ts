import fs from 'fs';
import path from 'path';
const root=path.resolve(__dirname,'../..');
test('local-only release declares no app data collection or tracking',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo.ios.privacyManifests;
 const native=fs.readFileSync(path.join(root,'ios/UltraEdge/PrivacyInfo.xcprivacy'),'utf8');
 expect(config.NSPrivacyTracking).toBe(false);
 expect(config.NSPrivacyCollectedDataTypes).toEqual([]);
 expect(native).toMatch(/<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/);
 expect(native).toContain('NSPrivacyAccessedAPICategoryUserDefaults');
});
