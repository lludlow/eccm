// Run in an isolated browser session via agent-browser eval --stdin.
(async function(){
  const receipts=[];
  function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
  function same(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
  function assert(ok,message){if(!ok)throw new Error(message);receipts.push(message);}
  function button(name,scope=document.getElementById('networkDialog')){const b=[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===name);if(!b)throw new Error('Missing button '+name);b.click();}
  function control(name,scope=document.getElementById('networkDialog')){const label=[...scope.querySelectorAll('label')].find(l=>l.textContent.trim()===name);if(!label)throw new Error('Missing field '+name);return label.htmlFor?document.getElementById(label.htmlFor):label.querySelector('input');}
  function fill(name,value,scope){const c=control(name,scope);c.value=value;c.dispatchEvent(new Event('change',{bubbles:true}));}
  function check(name){control(name).click();}
  function save(){document.querySelector('#networkDialog form').requestSubmit();}
  function close(){document.getElementById('networkDialog')?.close();}
  const errors=[];window.addEventListener('error',e=>errors.push(e.message));
  // Isolated synthetic profile; never use these tests against an operator's browser storage.
  store.current='Browser QA';store.profiles={};store.profiles[store.current]=deepClone(defaultState);state=store.profiles[store.current];normalizeState(state);refreshProfileSelect();render();
  $('#devName').value='Access switch';$('#devPorts').value='8';$('#addBtn').click();
  $('#devName').value='Core switch';$('#devPorts').value='8';$('#addBtn').click();
  const d=state.devices[0],peer=state.devices[1];
  assert(state.devices.length===2,'Add device workflow');
  openGroupEditor(d,false);button('Add port group');
  fill('Group name','Access');fill('Member ports','1-6');fill('Connector','RJ45');fill('Maximum port speed','1 Gbit');
  button('Add port group');const groupBoxes=document.querySelectorAll('#networkDialog fieldset');
  fill('Group name','Uplinks',groupBoxes[1]);fill('Member ports','7-8',groupBoxes[1]);fill('Connector','SFP28',groupBoxes[1]);fill('Maximum port speed','25 Gbit',groupBoxes[1]);save();
  assert(d.portGroups.length===2 && portCapability(d,7).maxSpeed==='25 Gbit','Save mixed-capability port groups');
  openGroupEditor(d,false);const groupEdit=document.querySelectorAll('#networkDialog fieldset');fill('Member ports','6-8',groupEdit[1]);save();
  assert(document.querySelector('.form-error').textContent.includes('more than one') && d.portGroups[1].ports.join(',')==='7,8','Overlapping port groups rejected without mutation');close();
  openPortEditor(d);fill('Ports','1-8');check('Apply alias');fill('Alias','must not save');check('Apply speed');fill('Recorded link speed','25 Gbit');save();
  assert(document.querySelector('.form-error').textContent.includes('exceeds') && !state.portAliases[keyFor(d.id,1,null)],'Bulk capability error is atomic');close();
  openPortEditor(d);fill('Ports','7-8');check('Apply speed');fill('Recorded link speed','25 Gbit');check('Apply VLAN configuration');fill('Port mode','trunk');fill('Native / untagged VLAN','10');fill('Allowed tagged VLANs','20,30-32');save();
  assert(vlanSummary({deviceId:d.id,port:8}).includes('tagged 20,30-32'),'Bulk trunk VLAN settings');
  assert(speedFor(d.id,7,null)==='25 Gbit','Bulk speeds persisted');
  openPortEditor(d,{port:7,sub:null});fill('Alias','Retain');fill('Native / untagged VLAN','20');save();
  assert(document.querySelector('.form-error').textContent.includes('must not also') && !aliasFor(d.id,7,null),'Native/tagged overlap rejected atomically');close();
  openPortEditor(d,{port:1,sub:null});fill('Port mode','access');fill('Access VLAN','20');save();
  assert(state.portVlans[keyFor(d.id,1,null)]===20,'Access VLAN keeps legacy export compatibility');
  openGroupEditor(d,true);button('Add bond');fill('Group name','bond0');fill('Member ports','7-8');fill('Bond mode','lacp');save();
  assert(bondSummary({deviceId:d.id,port:7})==='bond0 (LACP)','Bond membership saved and summarized');
  connectPorts({deviceId:d.id,port:7,sub:null},{deviceId:peer.id,port:7,sub:null});
  const portNode=p=>document.querySelector('.port[data-device-id="'+d.id+'"][data-port="'+p+'"]');
  assert(portNode(7).querySelector('.port-bond-badge').textContent==='B1' && portNode(8).querySelector('.port-bond-badge').textContent==='B1' && !portNode(1).querySelector('.port-bond-badge'),'Linked and free bond members carry badges; nonmembers do not');
  let endpointCells=document.querySelectorAll('.conn-row .connection-port');
  assert(endpointCells[0].textContent.includes('bond0 (LACP)') && endpointCells[1].textContent.includes('No bond recorded'),'Connection table identifies one-sided bond configuration');
  openGroupEditor(peer,true);button('Add bond');fill('Group name','peer-uplink');fill('Member ports','7-8');fill('Bond mode','static');save();
  endpointCells=document.querySelectorAll('.conn-row .connection-port');
  assert(endpointCells[0].textContent.includes('bond0 (LACP)') && endpointCells[1].textContent.includes('peer-uplink (Static)'),'Each connection endpoint shows its own bond name and mode');
  openGroupEditor(d,true);button('Add bond');const secondBond=document.querySelectorAll('#networkDialog fieldset')[1];
  fill('Group name','backup',secondBond);fill('Member ports','3-4',secondBond);fill('Bond mode','static',secondBond);save();
  state.reservedPorts[keyFor(d.id,4,null)]='External member';render();
  assert(portNode(3).querySelector('.port-bond-badge').textContent==='B2' && portNode(3).getAttribute('aria-label').includes('backup (Static)'),'Multiple bonds have distinct visible and accessible markers');
  assert(document.querySelector('.reserved-row .connection-port').textContent.includes('B2 · backup (Static)'),'Reserved connections show bond membership');
  const link=state.links[0];openCableEditor(link);fill('Cable ID','CBL-001');fill('Medium','DAC');fill('Length (metres)','2.5');fill('Cable color','Black');fill('Notes','Uplink cable');save();
  assert(link.cable.id==='CBL-001' && cableSummary(link).includes('2.5 m'),'Cable editor saves metadata');
  $('#searchBox').value='CBL-001';renderConnections();assert($('#connBody').textContent.includes('CBL-001'),'Cable IDs are searchable');
  $('#searchBox').value='bond0';renderConnections();assert($('#connBody').textContent.includes('CBL-001'),'Bond names are searchable');$('#searchBox').value='';
  assert(buildDrawIOXml().includes('CBL-001') && buildDrawIOXml().includes('Trunk'),'Draw.io includes cable and VLAN metadata');
  assert(networkPrintDetails().includes('CBL-001') && networkPrintDetails().includes('SFP28'),'Print schedule includes cable and group metadata');
  assert((cableLabelsHTML([link]).match(/<article>/g)||[]).length===2,'Two printable end labels per cable');
  d.stpPriority=4096;peer.stpPriority=4096;render();
  assert([...document.querySelectorAll('.stp-badge')].every(n=>n.textContent.includes('Root candidate')),'Tied priorities show Root candidate, not confirmed ROOT');
  openSaveTemplate(d);fill('Template name','Mixed switch');save();
  $('#deviceTemplate').value=state.deviceTemplates[0].id;$('#deviceTemplate').dispatchEvent(new Event('change'));$('#devName').value='From template';$('#addBtn').click();
  const copy=state.devices[2];
  assert(copy.portGroups.length===2 && copy.id!==d.id && copy.bonds.length===0 && copy.stpPriority===null,'Template add has new identity and no unique topology');
  assert(vlanSummary({deviceId:copy.id,port:7}).includes('Trunk'),'Template port configuration remapped');
  $('#deviceTemplate').value='';$('#deviceTemplate').dispatchEvent(new Event('change'));
  $('#devName').value='Rack10 fiber enclosure';$('#devPorts').value='72';$('#addBtn').click();
  const fiber=state.devices[state.devices.length-1];
  $('#devName').value='Rack11 fiber panel';$('#devPorts').value='24';$('#addBtn').click();
  const remoteFiber=state.devices[state.devices.length-1];
  connectPorts({deviceId:fiber.id,port:13,sub:null},{deviceId:remoteFiber.id,port:1,sub:null});
  state.portAliases[keyFor(fiber.id,13,null)]='Server uplink';
  openLayoutModal(fiber.id);fill('Layout style','fhd');fill('Enclosure size','2');fill('Port sides','on');fill('C1 label','To Rack11');fill('C2 label','To Rack11');fill('C3 label','To Rack12');fill('C5 label','To Rack13');fill('C1 color','#2563eb');fill('C2 color','#f97316');save();
  const fiberLink=state.links[state.links.length-1];
  assert(fiber.dualLink && fiberLink.a.port===13 && fiberLink.a.sub===0 && state.portAliases[keyFor(fiber.id,13,0)]==='Server uplink','Layout enables dual link without unlinking existing circuits or losing aliases');
  let fiberCard=document.getElementById('dev-'+fiber.id);
  assert(fiberCard.querySelectorAll('.cassette-slot').length===8 && fiberCard.querySelectorAll('.cassette-slot.empty').length===2 && fiberCard.querySelectorAll('.port').length===144,'2U enclosure shows six populated cassettes, two empty slots and both sides of 72 ports');
  let cassette=fiberCard.querySelector('[data-cassette="1"]');
  assert(cassette.querySelectorAll('.cassette-port-row').length===2 && cassette.querySelector('.cassette-port-row').children.length===6 && cassette.querySelector('.port').dataset.port==='7','Cassette faceplate has two rows of six, starting with LC07 above LC01');
  assert(endpointLabel(fiberLink.a).includes('C2-LC01 / Front') && $('#connBody').textContent.includes('C2-LC01 / Front'),'Connections use cassette-local labels after side migration');
  const preservedLinks=deepClone(state.links);
  openLayoutModal(fiber.id);fill('Top slot 1','3');fill('Top slot 2','1');save();
  assert(fiber.cassetteLayout.slots[0]===3 && fiber.cassetteLayout.slots[1]===1 && same(state.links,preservedLinks),'Moving cassette slots preserves connection identities');
  let movedCassette=document.getElementById('dev-'+fiber.id).querySelector('[data-cassette="1"]');
  assert(movedCassette.dataset.slot==='2' && movedCassette.style.borderColor==='rgb(37, 99, 235)' && fiber.cassetteLayout.colors[2]==='#f97316','Cassette colors follow identity when slots move');
  openLayoutModal(fiber.id);fill('C1 color','#ffffff');close();
  assert(fiber.cassetteLayout.colors[1]==='#2563eb','Cancel discards cassette color edits');
  openLayoutModal(fiber.id);document.querySelector('[aria-label="Reset C1 color to default"]').click();save();
  assert(!fiber.cassetteLayout.colors[1] && !document.getElementById('dev-'+fiber.id).querySelector('[data-cassette="1"]').style.borderColor,'Default clears the cassette color');
  openLayoutModal(fiber.id);fill('C1 color','#2563eb');fill('Enclosure size','1');fill('Enclosure size','2');save();
  assert(fiber.cassetteLayout.colors[1]==='#2563eb' && fiber.cassetteLayout.colors[2]==='#f97316','Enclosure size changes preserve cassette colors');
  openLayoutModal(fiber.id);fill('Top slot 1','3');fill('Top slot 2','1');save();
  openLayoutModal(fiber.id);fill('Top slot 1','1');save();
  assert(document.querySelector('.form-error').textContent.includes('exactly one') && fiber.cassetteLayout.slots[0]===3,'Duplicate cassette placement rejected without mutation');close();
  openLayoutModal(fiber.id);fill('Layout style','standard');save();
  assert(!document.getElementById('dev-'+fiber.id).querySelector('.cassette-enclosure') && same(state.links,preservedLinks),'Switching to standard layout preserves connections');
  openLayoutModal(fiber.id);fill('Layout style','fhd');save();
  assert(fiber.cassetteLayout.slots[0]===3 && fiber.cassetteLayout.labels[1]==='To Rack11','Returning to FHD restores slot placement and labels');
  openLayoutModal(remoteFiber.id);fill('Layout style','fhd');fill('Port sides','on');save();
  assert(remoteFiber.cassetteLayout.rows===1 && document.getElementById('dev-'+remoteFiber.id).querySelectorAll('.cassette-slot.empty').length===2,'1U enclosure shows two cassettes and two blank panels');
  let confirmMessage='';const priorConfirm=window.confirm;window.confirm=message=>{confirmMessage=message;return true;};
  document.querySelector('#dev-'+fiber.id+' .port[data-port="14"][data-sub="1"]').click();
  document.querySelector('#dev-'+remoteFiber.id+' .port[data-port="2"][data-sub="1"]').click();
  window.confirm=priorConfirm;
  assert(confirmMessage.includes('C2-LC02 / Rear') && confirmMessage.includes('C1-LC02 / Rear') && state.links.length===preservedLinks.length+1,'Click-to-link uses physical names and connects rear endpoints');
  state.reservedPorts[keyFor(fiber.id,15,0)]='Future switch';render();
  assert(getReservedPortsForDevice(fiber.id).some(label=>label.includes('C2-LC03 / Front')) && $('#connBody').textContent.includes('C2-LC03 / Front'),'Reserved endpoints retain physical names in table and diagram export');
  assert(buildDrawIOXml().includes('C2-LC01 / Front') && cableLabelsHTML([fiberLink]).includes('C2-LC01 / Front'),'Draw.io and cable labels use physical cassette port names');
  openSaveTemplate(fiber);fill('Template name','FHD 2U enclosure');save();
  const fiberTemplate=state.deviceTemplates.find(t=>t.name==='FHD 2U enclosure');
  assert(same(fiberTemplate.device.cassetteLayout,fiber.cassetteLayout),'Templates retain physical cassette layout');
  d.portsPerRow=4;d.numbering='column-bt';render();
  let printHTML='';const originalOpen=window.open;
  window.open=()=>({document:{open(){},write(html){printHTML=html;},close(){}},focus(){},print(){},close(){}});
  $('#printSheet').click();window.open=originalOpen;
  const printDoc=new DOMParser().parseFromString(printHTML,'text/html');
  printDoc.querySelectorAll('script').forEach(script=>new Function(script.textContent));
  assert(printDoc.querySelectorAll('.cassette-enclosure').length===2 && printDoc.querySelectorAll('.cassette-slot.empty').length===4 && printDoc.body.textContent.includes('C2-LC01 / Front'),'Printed layout retains cassette blocks, blank slots and physical connection labels');
  assert(printDoc.querySelector('[data-cassette="1"]').style.borderColor==='rgb(37, 99, 235)' && printDoc.querySelector('[data-cassette="2"]').style.borderColor==='rgb(249, 115, 22)','Print retains cassette colors');
  assert(printDoc.querySelector('.port-bond-badge') && printDoc.querySelector('.connection-bond-badge').textContent.includes('LACP'),'Print retains faceplate and connection bond badges');
  assert(printDoc.querySelector('.port-row[data-columns="4"]') && printDoc.body.textContent.includes('CBL-001'),'Print layout preserves custom row counts and cable schedule');
  const snapshot=deepClone(state);
  // Capture actual export handlers, then feed their files through the real FileReader import handlers.
  let blob;const createURL=URL.createObjectURL,anchorClick=HTMLAnchorElement.prototype.click;
  URL.createObjectURL=b=>{blob=b;return createURL.call(URL,b);};HTMLAnchorElement.prototype.click=function(){};
  $('#exportProfileBtn').click();const exported=JSON.parse(await blob.text());
  $('#backupAllBtn').click();const backup=JSON.parse(await blob.text());
  URL.createObjectURL=createURL;HTMLAnchorElement.prototype.click=anchorClick;
  assert(exported.state.links[0].cable.id==='CBL-001','Actual profile export includes cable metadata');
  const oldPrompt=window.prompt;window.prompt=()=> 'Round trip';
  async function upload(input,data){
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(data)],'test.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change'));
    for(let i=0;i<100 && input.value;i++)await new Promise(resolve=>setTimeout(resolve,10));
    if(input.value)throw new Error('Import did not complete');
  }
  await upload($('#importProfileFile'),exported);window.prompt=oldPrompt;
  assert(store.current==='Round trip','Actual profile import completes');
  assert(same(state,snapshot),'Profile import round trip preserves all network metadata');
  await upload($('#restoreAllFile'),backup);
  assert(store.current==='Browser QA' && same(state,snapshot),'Full backup/restore round trip');
  // Cancel must not mutate configuration.
  openCableEditor(state.links[0]);fill('Cable ID','Cancelled');close();assert(state.links[0].cable.id==='CBL-001','Cable cancel leaves metadata unchanged');
  const dual={id:uid(),name:'Patch panel',ports:2,dualLink:true};state.devices.push(dual);normalizeState(state);
  openPortEditor(dual);fill('Ports','1-2');fill('Side','both');check('Apply VLAN configuration');fill('Port mode','access');fill('Access VLAN','99');save();
  assert([0,1].every(sub=>vlanConfig({deviceId:dual.id,port:2,sub}).access===99),'Dual-link bulk edits cover requested sides');
  openGroupEditor(dual,true);button('Add bond');fill('Group name','invalid');fill('Member ports','1-2');save();
  assert(document.querySelector('.form-error').textContent.includes('single-link'),'Dual-link patch panel cannot acquire a bond');close();
  assert(errors.length===0,'No runtime errors in tested workflows');
  saveStore();render();
  return {passed:receipts.length,receipts};
})()
