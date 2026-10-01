const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/app/api/mesures/photo/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function run({signedIn=true,malformed=false,type='image/jpeg',size=1,missing=false,storage='ok',readable=true}={}) {
 const api={},calls=[];
 vm.runInNewContext(source,{exports:api,File,require:n=>{
  if(n==='next/server')return require('next/server');
  if(n==='@/lib/storage/photo-image')return {isReadablePhoto:async()=>readable};
  if(n==='@/lib/auth/server')return {getCurrentUser:async()=>signedIn?{id:'owner'}:null};
  if(n==='@/lib/storage/progress-photos')return {uploadProgressPhoto:async(id,file)=>{calls.push(id);assert.equal(id,'owner');assert.equal(file.type,type);if(storage==='throw')throw Error('private-internal-detail');return storage==='error'?{error:'private-internal-detail'}:{path:'owner/image.jpg'};}};
  throw Error(n);
 }});
 const form=new FormData();if(!missing)form.set('file',new File([new Uint8Array(size)],'test.jpg',{type}));
 const request=new Request('http://localhost/api/mesures/photo',{method:'POST',body:malformed?'broken':form});
 const res=await api.POST(request);return {status:res.status,body:await res.json(),calls};
}
(async()=>{
 for(const options of [{readable:false},{malformed:true},{missing:true},{type:'text/plain'},{size:0},{size:2097153}]){
  const r=await run(options);assert.equal(r.status,400);assert.equal(r.calls.length,0);
 }
 assert.equal((await run({signedIn:false,malformed:true})).status,401);
 for(const storage of ['throw','error']){const r=await run({storage});assert.equal(r.status,503);assert.equal(typeof r.body.error,'string');assert(!r.body.error.includes('private-internal-detail'));}
 for(const type of ['image/jpeg','image/png','image/webp']){const r=await run({type});assert.equal(r.status,201);assert.equal(r.body.path,'owner/image.jpg');}
 console.log('PASS progress photo route: malformed/empty/missing/oversized/invalid files, authentication, storage failures, 3 accepted formats; storage/auth simulated');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
