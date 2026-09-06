jest.mock('expo-file-system/legacy',()=>({documentDirectory:'file:///first/Documents/',cacheDirectory:'file:///cache/',EncodingType:{Base64:'base64'},getInfoAsync:jest.fn(),readAsStringAsync:jest.fn(),makeDirectoryAsync:jest.fn(),copyAsync:jest.fn()}));
jest.mock('expo-crypto',()=>({randomUUID:()=> 'unique-file'}));
import * as FS from 'expo-file-system/legacy';
import { attachmentUri, saveAttachment, attachmentShareUri } from '../lib/attachments';
beforeEach(()=>{jest.clearAllMocks();(FS.getInfoAsync as jest.Mock).mockResolvedValue({exists:true,size:100});(FS.readAsStringAsync as jest.Mock).mockResolvedValue('JVBERi0=');});
test('persists a copied file with a sandbox-independent path and rebuilds its URI after an app update',async()=>{
 const attachment=await saveAttachment('file:///cache/race.pdf','Race guide.pdf','application/pdf');
 expect(attachment.path).toBe('unique-file.pdf');
 expect(FS.copyAsync).toHaveBeenCalledWith({from:'file:///cache/race.pdf',to:'file:///first/Documents/plan-attachments/unique-file.pdf'});
 (FS as any).documentDirectory='file:///updated/Documents/';
 expect(attachmentUri(attachment.path)).toBe('file:///updated/Documents/plan-attachments/unique-file.pdf');
});
test('rejects non-PDF content, empty/oversized files and unsafe paths before copying',async()=>{
 (FS.readAsStringAsync as jest.Mock).mockResolvedValue('not-a-pdf');
 await expect(saveAttachment('file:///bad','bad.pdf','application/pdf')).rejects.toThrow('not a PDF');
 (FS.getInfoAsync as jest.Mock).mockResolvedValue({exists:true,size:51*1024*1024});
 await expect(saveAttachment('file:///big','photo','image/jpeg')).rejects.toThrow('50 MB');
 (FS.getInfoAsync as jest.Mock).mockResolvedValue({exists:true,size:0});
 await expect(saveAttachment('file:///empty','photo','image/jpeg')).rejects.toThrow();
 expect(()=>attachmentUri('../private.pdf')).toThrow();
 expect(FS.copyAsync).not.toHaveBeenCalled();
});
test('copy failure rejects instead of returning an unusable saved attachment',async()=>{
 (FS.copyAsync as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
 await expect(saveAttachment('file:///photo','photo','image/jpeg')).rejects.toThrow('Disk full');
});

test('shares a readable safe filename rather than the internal attachment identifier',async()=>{
 const uri=await attachmentShareUri({path:'unique-file.pdf',name:'../Official guide.pdf',mimeType:'application/pdf'});
 expect(uri).toBe('file:///cache/guide-share-unique-file/.._Official guide.pdf');
 expect(FS.copyAsync).toHaveBeenCalledWith(expect.objectContaining({to:uri}));
});
