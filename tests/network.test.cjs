// No dependencies: node --test tests/network.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../ECCM.html'),'utf8').replace(/\r\n/g,'\n');
function fixture(){
  const ctx=vm.createContext({});
  vm.runInContext(html.split('/* ===================== NETWORK DOCUMENTATION ===================== */')[1].split('/* ===================== END NETWORK DOCUMENTATION ===================== */')[0],ctx);
  for(const name of ['keyFor','deepClone','uid','normalizeState','deviceById','speedToMbps','parseStpPriority','lowestStpPriority','escapeXml','portLabelDefault','getPortTerm','changePorts']){
    const match=html.match(new RegExp('function '+name+'\\([^]*?\\n}'));
    // Single-line helpers end before the next newline/function.
    const start=html.indexOf('function '+name+'('),line=html.slice(start).split('\n')[0];
    vm.runInContext(line.endsWith('}') ? line : match[0],ctx);
  }
  vm.runInContext(`var state={devices:[{id:'a',name:'Access',ports:8,dualLink:false,maxSpeed:'10 Gbit'},{id:'b',name:'Core',ports:4,dualLink:false}],links:[],portVlans:{'a:1:':20},portSpeeds:{},portAliases:{},reservedPorts:{},portLinkedToNames:{}}; function getMaxPortsSetting(){return 512;} var store={current:'Test',settings:{portTermMode:'port'}};normalizeState(state);`,ctx);
  return ctx;
}
const run=(ctx,code)=>JSON.parse(JSON.stringify(vm.runInContext(code,ctx)));
test('scripts parse',()=>{for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);});
test('port and VLAN lists expand, deduplicate and reject invalid input',()=>{
  const c=fixture();assert.deepEqual(run(c,"parseNumberList('1-3,2,8',8,'Ports')"),[1,2,3,8]);
  assert.equal(run(c,'compactNumbers([8,1,3,2,2])'),'1-3,8');
  for(const value of ['0','9','4-2','1.5','1,','1,,2','all','-1'])assert.throws(()=>vm.runInContext(`parseNumberList(${JSON.stringify(value)},8,'Ports')`,c));
});
test('legacy VLAN migration and explicit clearing do not resurrect legacy values',()=>{
  const c=fixture();assert.equal(run(c,"vlanSummary({deviceId:'a',port:1,sub:null})"),'Access 20');
  vm.runInContext("saveVlanConfig({deviceId:'a',port:1,sub:null},{mode:'trunk',native:10,tagged:[20,30,31]})",c);
  assert.equal(run(c,"vlanSummary({deviceId:'a',port:1,sub:null})"),'Trunk · native 10 · tagged 20,30-31');
  vm.runInContext("saveVlanConfig({deviceId:'a',port:1,sub:null},{mode:''})",c);
  assert.equal(run(c,"vlanSummary({deviceId:'a',port:1,sub:null})"),'VLAN unspecified');
});
test('groups use per-port capability and reject duplicate membership',()=>{
  const c=fixture();vm.runInContext("state.devices[0].portGroups=[{name:'Uplinks',ports:[7,8],maxSpeed:'25 Gbit',connector:'SFP28'}]",c);
  assert.equal(run(c,'portCapability(state.devices[0],7).maxSpeed'),'25 Gbit');
  assert.equal(run(c,'portCapability(state.devices[0],1).maxSpeed'),'10 Gbit');
  assert.throws(()=>vm.runInContext("validateGroups(state.devices[0],[{name:'A',ports:[1,2]},{name:'B',ports:[2,3]}],false)",c));
  assert.throws(()=>vm.runInContext("validateGroups(state.devices[0],[{name:'A',ports:[1]}],true)",c));
});
test('shrinking devices cleans metadata and leaves surviving bond members visible',()=>{
  const c=fixture();vm.runInContext("state.devices[0].portGroups=[{name:'Uplinks',ports:[7,8]}];state.devices[0].bonds=[{name:'bond0',ports:[7,8]}];state.portSpeeds['a:8:']='25 Gbit';state.portVlanConfigs['a:8:']={mode:'access',access:10};state.links=[{id:'link',a:{deviceId:'a',port:8},b:{deviceId:'b',port:1},cable:{id:'C1'}}];changePorts(state.devices[0],7)",c);
  assert.deepEqual(run(c,'state.devices[0].portGroups[0].ports'),[7]);
  assert.deepEqual(run(c,'state.devices[0].bonds[0].ports'),[7]);
  assert.equal(run(c,'state.links.length'),0);assert.deepEqual(run(c,'state.portSpeeds'),{});assert.deepEqual(run(c,'state.portVlanConfigs'),{});
});
test('templates copy reusable configuration with fresh identities, not topology or unique settings',()=>{
  const c=fixture();vm.runInContext("state.devices[0].stpPriority=4096;state.devices[0].portGroups=[{id:'group',name:'Uplinks',ports:[7,8],maxSpeed:'25 Gbit'}];state.devices[0].bonds=[{id:'bond',name:'bond0',ports:[7,8]}];state.portAliases['a:1:']='Customer';state.deviceTemplates.push(makeDeviceTemplate(state.devices[0],'Switch'));var copy=createDeviceFromTemplate(state.deviceTemplates[0].id,'Copy')",c);
  assert.equal(run(c,'copy.name'),'Copy');assert.equal(run(c,'copy.stpPriority'),null);assert.deepEqual(run(c,'copy.bonds'),[]);
  assert.equal(run(c,"vlanSummary({deviceId:copy.id,port:1,sub:null})"),'Access 20');
  assert.notEqual(run(c,'copy.portGroups[0].id'),'group');assert.equal(run(c,'Object.keys(state.portAliases).length'),1);
  vm.runInContext('copy.portGroups[0].ports.push(6)',c);assert.deepEqual(run(c,'state.deviceTemplates[0].device.portGroups[0].ports'),[7,8]);
});
test('label output escapes user text and produces two labels per cable',()=>{
  const c=fixture();const output=run(c,`cableLabelsHTML([{a:{deviceId:'a',port:1},b:{deviceId:'b',port:2},cable:{id:'<script>bad</script>',notes:'x'}}])`);
  assert.equal((output.match(/<article>/g)||[]).length,2);assert.ok(output.includes('&lt;script&gt;'));assert.ok(!output.includes('<script>bad'));
});
test('STP priority accepts only valid bridge priorities, including zero',()=>{
  const c=fixture();assert.equal(run(c,'parseStpPriority({stpPriority:0})'),0);for(const v of [-1,123,65536,4096.1])assert.equal(run(c,`parseStpPriority({stpPriority:${v}})`),null);
});

test('2U FHD assigns successive cassette pairs vertically and keeps empty slots',()=>{
  const c=fixture();
  assert.deepEqual(run(c,'defaultCassetteLayout({ports:72},2).slots'),[1,3,5,null,2,4,6,null]);
  assert.deepEqual(run(c,'defaultCassetteLayout({ports:24},1).slots'),[1,2,null,null]);
  assert.deepEqual(run(c,'cassetteRowPorts(2,true)'),[19,20,21,22,23,24]);
  assert.deepEqual(run(c,'cassetteRowPorts(2,false)'),[13,14,15,16,17,18]);
});
test('FHD validates size, complete cassette assignment and duplicates',()=>{
  const c=fixture();
  for(const code of [
    'validateCassetteLayout({ports:72},defaultCassetteLayout({ports:72},1))',
    'validateCassetteLayout({ports:73},defaultCassetteLayout({ports:73},2))',
    'validateCassetteLayout({ports:24},{rows:1,slots:[1,1,null,null]})',
    'validateCassetteLayout({ports:24},{rows:1,slots:[1,null,null,null]})',
    'validateCassetteLayout({ports:24},{rows:1,slots:[1,2,null,3]})'
  ])assert.throws(()=>vm.runInContext(code,c));
});
test('physical labels identify cassette, LC circuit and side without changing port IDs',()=>{
  const c=fixture();vm.runInContext('state.devices[0].ports=72;state.devices[0].cassetteLayout=defaultCassetteLayout(state.devices[0],2)',c);
  assert.equal(run(c,'portNameFor(state.devices[0],13,0)'),'C2-LC01 / Front');
  assert.equal(run(c,'portNameFor(state.devices[0],24,1,true)'),'LC12 R');
  assert.equal(run(c,'portNameFor(state.devices[0],72,null)'),'C6-LC12');
  vm.runInContext("state.devices[0].portNames={'a:13:0':'Custom name'}",c);
  assert.equal(run(c,'portNameFor(state.devices[0],13,0)'),'Custom name');
});
test('FHD resize preserves placed cassettes and rejects non-cassette increments',()=>{
  const c=fixture();vm.runInContext('state.devices[0].ports=72;state.devices[0].cassetteLayout=defaultCassetteLayout(state.devices[0],2)',c);
  assert.deepEqual(run(c,'resizedCassetteLayout(state.devices[0],48).slots'),[1,3,null,null,2,4,null,null]);
  assert.deepEqual(run(c,'resizedCassetteLayout(state.devices[0],96).slots'),[1,3,5,7,2,4,6,8]);
  assert.throws(()=>vm.runInContext('changePorts(state.devices[0],71)',c));
  assert.equal(run(c,'state.devices[0].ports'),72);
});
test('single-to-dual migration stages atomically and preserves link and port metadata',()=>{
  const c=fixture();vm.runInContext("state.portAliases['a:1:']='AP';state.portSpeeds['a:1:']='1 Gbit';state.devices[0].portNames={'a:1:':'Named'};state.links=[{id:'link',a:{deviceId:'a',port:1,sub:null},b:{deviceId:'b',port:2,sub:null},cable:{id:'C1'}}];var migrate=planDualLinkMigration(state.devices[0],true)",c);
  assert.equal(run(c,'state.links[0].a.sub'),null);
  vm.runInContext('migrate()',c);
  assert.equal(run(c,'state.links[0].a.sub'),0);assert.equal(run(c,'state.links[0].b.sub'),null);
  assert.equal(run(c,"state.portAliases['a:1:0']"),'AP');assert.equal(run(c,"state.portVlans['a:1:0']"),20);
  assert.equal(run(c,"state.devices[0].portNames['a:1:0']"),'Named');assert.equal(run(c,'state.links[0].cable.id'),'C1');
  assert.throws(()=>vm.runInContext('planDualLinkMigration(state.devices[0],false)',c));
});
test('side conflicts and bonds block migration without overwriting settings',()=>{
  const c=fixture();vm.runInContext("state.portAliases['a:1:']='old';state.portAliases['a:1:0']='existing'",c);
  assert.throws(()=>vm.runInContext('planDualLinkMigration(state.devices[0],true)',c));
  assert.equal(run(c,"state.portAliases['a:1:']"),'old');assert.equal(run(c,'state.devices[0].dualLink'),false);
  vm.runInContext("delete state.portAliases['a:1:0'];state.devices[0].bonds=[{name:'bond',ports:[1,2]}]",c);
  assert.throws(()=>vm.runInContext('planDualLinkMigration(state.devices[0],true)',c));
});
