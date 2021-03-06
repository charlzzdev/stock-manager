(function() {
      class Item {
            constructor(group, name, type, id, amount, typeUnit, amountUnit, amountLimit, manufacturer) {
                  this.group = group;
                  this.name = name;
                  this.type = type;
                  this.id = id;
                  this.amount = amount;
                  this.typeUnit = typeUnit;
                  this.amountUnit = amountUnit;
                  this.amountLimit = amountLimit;
                  this.manufacturer = manufacturer;
            }
      }

      class UI {
            static listItem(item, itemId){
                  M.Collapsible.getInstance(document.querySelector('.collapsible')).open(UI.activeItem);
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                        <td class="editable" data-id=${itemId} data-field="manufacturer" contenteditable>${item.manufacturer}</td>
                        <td title="${item.manufacturer}" class="editable" data-id=${itemId} data-field="name" contenteditable>${item.name}</td>
                        <td><span class="editable" data-id=${itemId} data-field="type" contenteditable>${item.type}</span> ${item.typeUnit}</td>
                        <td><a class="modal-trigger image-trigger editable" data-id=${itemId} data-field="id" contenteditable href="#image">${item.id}</a></td>
                        <td id="${itemId}">
                              <a href="#amount" class="
                                    ${Auth.uid === 'vw2XmPhi0SY4EAowNUAimyFznDk2' ? 'modal-trigger' : ''}
                                    ${item.amount < item.amountLimit ? 'red-text' : ''}
                              edit">${item.amount} ${item.amountUnit}</a>
                              <i class="material-icons right red-text delete" style="cursor: pointer; ${Auth.uid === 'vw2XmPhi0SY4EAowNUAimyFznDk2' ? '' : 'display: none;'}">delete</i>
                  </td>`;
                  
                  if(document.getElementById(item.group) === null) {
                        const li = document.createElement('li');
                        li.id = item.group;
                        li.innerHTML = `
                              <div class="collapsible-header" style="position: relative;">${item.group}<i class="material-icons print" style="position:absolute; right: 0;">print</i></div>
                              <div class="collapsible-body">
                                    <table class="striped responsive-table">
                                          <thead>
                                                <tr><th>Gyártó</th><th>Megnevezés</th><th>Típus</th><th>Cikkszám</th><th>Raktár</th></tr>
                                          </thead>
                                          <tbody id="${item.group}-tbody">
                                                <tr>${tr.innerHTML}</tr>
                                          </tbody>
                                    </table>
                              </div>
                        `;

                        document.getElementById('item-list').appendChild(li);
                  } else {
                        document.getElementById(`${item.group}-tbody`).appendChild(tr);
                  }
            }

            static listManufacturers(manufacturers){
                  const wrapper = document.getElementById('manufacturer-select-wrapper');
                  wrapper.innerHTML = '';
                  const select = document.createElement('select');
                  select.id = 'manufacturer-select';

                  manufacturers.forEach(manufacturer => {
                        const option = document.createElement('option');
                        option.innerHTML = manufacturer;
                        select.appendChild(option);
                  });
                  wrapper.appendChild(select);
                  M.FormSelect.init(select);
                  select.addEventListener('change', (e) => {
                        Database.getItemsWhere("manufacturer", "==", e.target.value);
                  });
            }

            static hideElements(signInTrigger, signOutTrigger, deleteTrigger, itemFormTrigger, amountTrigger, underLimitTrigger, changesTrigger, searchTrigger, refreshTrigger, manufacturerSelectTrigger){
                  document.getElementById('sign-in-trigger').style.display = signInTrigger;
                  document.getElementById('sign-out-trigger').style.display = signOutTrigger;
                  Array.from(document.getElementsByClassName('delete')).forEach(element => element.style.display = deleteTrigger);
                  document.getElementById('item-form-trigger').style.display = itemFormTrigger;
                  Array.from(document.getElementsByClassName('edit')).forEach(element => element.className = amountTrigger);
                  document.getElementById('btn-under-limit').style.display = underLimitTrigger;
                  document.getElementById('changes-trigger').style.display = changesTrigger;
                  document.getElementById('search-trigger').style.display = searchTrigger;
                  document.getElementById('refresh-trigger').style.display = refreshTrigger;
                  document.getElementById('manufacturer-select-wrapper').style.display = manufacturerSelectTrigger;
            }

            static print(group){
                  UI.hideElements('', '', 'none', '', '');
                  const table = document.getElementById(`${group}-tbody`).parentElement;
                  const body = document.getElementsByTagName('body')[0];
                  table.children[0].children[0].innerHTML += '<th style="width: 100px;">Tényleges raktár</th>';
                  Array.from(table.children[1].children).forEach(element => element.innerHTML += '<td>__________</td>');
                  body.innerHTML = `<h5 style="margin-left: 20px;">${group}</h5> ${table.outerHTML}`;
                  print();
                  document.location.reload();
            }

            static clearItemList(){
                  document.getElementById('item-list').innerHTML = '';
            }
      }

      class Database {
            static getItems() {
                  Database.unsubscribeGetItemsWhere !== undefined ? Database.unsubscribeGetItemsWhere() : null;
                  firebase.firestore().settings({ timestampsInSnapshots: true });
                  Database.unsubscribeGetItems = firebase.firestore().collection('items').orderBy('group', 'asc').onSnapshot(snapshot => {
                        Database.loopAndDisplay(snapshot);
                        Database.getManufacturers(snapshot);
                  });
            }

            static getItemsWhere(searchCategory, searchParameter, searchTerm){
                  Database.unsubscribeGetItems();
                  Database.unsubscribeGetItemsWhere !== undefined ? Database.unsubscribeGetItemsWhere() : null;
                  if(searchTerm !== "Összes"){
                        Database.unsubscribeGetItemsWhere = firebase.firestore().collection('items').where(searchCategory, searchParameter, searchTerm).onSnapshot(snapshot => {
                              Database.loopAndDisplay(snapshot);
                        });
                  } else Database.getItems();
            }

            static getItemsUnderLimit(){
                  firebase.firestore().collection('items').orderBy('group', 'asc').get().then(snapshot => {
                        UI.clearItemList();
                        let hasItems = false;

                        snapshot.docs.forEach(doc => {
                              const item = doc.data();

                              if(item.amount < item.amountLimit) {
                                    UI.listItem(item, doc.id);
                                    hasItems = true;
                              };
                        });
                        if(!hasItems) M.toast({html: 'Semmi sincs limit alatt.', classes: 'red'});
                  });
            }

            static loopAndDisplay(snapshot){
                  UI.clearItemList();

                  snapshot.docs.forEach(doc => {
                        UI.listItem(doc.data(), doc.id);
                  });

                  document.querySelectorAll('.editable').forEach(field => {
                        const update = (e) => Database.updateField(e.target.dataset.id, e.target.dataset.field, e.target.innerHTML);

                        let edited = false;
                        field.addEventListener('blur', e => edited && update(e));
                        field.addEventListener('keydown', e => {
                              if(edited && e.key === 'Enter'){
                                    e.preventDefault();
                                    field.blur();
                              } else edited = true;
                        });
                  });
            }

            static updateField(id, field, newValue){
                  firebase.firestore().collection('items').doc(id).update({
                        [field]: newValue
                  }).then(() => {
                        M.toast({html: 'Sikeresen szerkesztve', classes: 'green'});
                  }).catch(() => {
                        M.toast({html: 'Sikertelen szerkesztés', classes: 'red'});
                  });
            }

            static getManufacturers(snapshot){
                  const manufacturers = ["Összes"];

                  snapshot.docs.forEach(doc => {
                        const currentManufacturer = doc.data().manufacturer;
                        if (manufacturers.includes(currentManufacturer) === false) manufacturers.push(currentManufacturer);
                  });
                  UI.listManufacturers(manufacturers);
            }

            static addItem(item) {
                  firebase.firestore().collection('items').add(item).then(() => {
                        M.toast({html: 'Sikeresen hozzáadva', classes: 'green'});
                        Database.addToChanges(item, 'add');
                  }).catch(() => {
                        M.toast({html: 'Sikertelen hozzáadás', classes: 'red'});
                  });
            }

            static deleteItem(itemId){
                  const changedItem = document.getElementById(itemId).parentElement;
                  firebase.firestore().collection('items').doc(itemId).delete().then(() => {
                        M.toast({html: 'Sikeresen törölve', classes: 'green'});
                        Database.addToChanges(changedItem.children, 'delete');
                        Storage.deleteImage(changedItem.children[2].children[0].innerHTML);
                  }).catch(() => {
                        M.toast({html: 'Sikertelen törlés', classes: 'red'});
                  });
            }

            static updateItem(itemId, amount){
                  const changedItem = document.getElementById(itemId).parentElement.children;
                  firebase.firestore().collection('items').doc(itemId).update({ amount }).then(() => {
                        M.toast({html: 'Sikeresen szerkesztve', classes: 'green'});
                        Database.addToChanges(changedItem, 'update', amount);
                  }).catch(() => {
                        M.toast({html: 'Sikertelen szerkesztés', classes: 'red'});
                  });
            }

            static getChanges(limit){
                  Database.unsubscribeGetChanges !== undefined ? Database.unsubscribeGetChanges() : null;
                  Database.unsubscribeGetChanges = firebase.firestore().collection('changes').orderBy('date', 'desc').limit(limit).onSnapshot(snapshot => {
                        const changes = document.getElementById('changes-tbody');
                        changes.innerHTML = '';
                        snapshot.docs.forEach(doc => {
                              const data = doc.data();
                              changes.innerHTML += `<tr>
                                    <td>${data.name}</td>
                                    <td>${data.type} ${data.typeUnit}</td>
                                    <td>${data.id}</td>
                                    <td>${data.amount}</td>
                                    <td>${data.date}</td>
                              </tr>`;
                        });
                  });
            }

            static addToChanges(item, action, amount){
                  const date = new Intl.DateTimeFormat('hu-HU', {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(new Date());
                  firebase.firestore().collection('changes').add(
                        action === 'add' ? {
                              name: item.name,
                              type: item.type,
                              typeUnit: item.typeUnit,
                              id: item.id,
                              amount: `<span class="green-text">Hozzáadva (${item.amount} ${item.amountUnit})</span>`,
                              date
                        } : {
                              name: item[1].innerHTML,
                              type: item[2].innerHTML.split(' ')[0],
                              typeUnit: item[2].innerHTML.split(' ')[1],
                              id: item[3].children[0].innerHTML,
                              amount: action === 'update' ? `<span class="red-text">${item[4].children[0].innerHTML}</span> → <span class="green-text">${amount} ${item[4].children[0].innerHTML.split(' ')[1]}</span>` : '<span class="red-text">Törölve</span>',
                              date
                        }
                  );
            }
      }

      class Auth {
            static signIn(email, password){
                  firebase.auth().signInWithEmailAndPassword(email, password)
                        .then(() => M.toast({html: 'Sikeres bejelentkezés', classes: 'green'}))
                        .catch(() => M.toast({html: 'Sikertelen bejelentkezés', classes: 'red'}));
            }

            static signOut(){
                  firebase.auth().signOut()
                        .then(() => M.toast({html: 'Sikeres kijelentkezés', classes: 'green'}))
                        .catch(() => M.toast({html: 'Sikertelen kijelentkezés', classes: 'red'}));
            }

            static getState(){
                  firebase.auth().onAuthStateChanged(user => {
                        if(user) {
                              Database.getItems();
                              Database.getChanges(5);
                              Auth.uid = user.uid;
                              UI.hideElements('none', '', '', '', 'modal-trigger edit', '', '', '', '', '');
                        } else {
                              Database.unsubscribeGetItems !== undefined ? Database.unsubscribeGetItems() : null;
                              Database.unsubscribeGetChanges !== undefined ? Database.unsubscribeGetChanges() : null;
                              Auth.uid = '';
                              UI.hideElements('', 'none', 'none', 'none', 'edit', 'none', 'none', 'none', 'none', 'none');
                              UI.clearItemList();
                              document.getElementById('changes-tbody').innerHTML = '';
                        }
                  });
            }
      }

      class Storage {
            static uploadImage(file, itemId){
                  if(file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png'){
                        firebase.storage().ref(`/idImages/${itemId}`).put(file)
                              .then(() => M.toast({html: 'Sikeres kép feltöltés', classes: 'green'}))
                              .catch(() => M.toast({html: 'Sikertelen kép feltöltés', classes: 'red'}));
                  } else M.toast({html: `Rossz fájl formátum: ${file.type.split('/')[1].toUpperCase()}. (Elfogadott: JPEG, JPG, PNG)`, classes: 'red'});
            }

            static getImage(name){
                  document.getElementById('image').src = '';
                  firebase.storage().ref('/idImages/').child(name).getDownloadURL()
                        .then(url => document.getElementById('image').src = url)
                        .catch(() => {
                              M.toast({html: `<p style="display: block;">${name} képe nem lett megtalálva</p> <input type="file" id="upload-image-after-error">`, classes: 'red'});
                              document.getElementById('upload-image-after-error').addEventListener('change', e => {
                                    Storage.uploadImage(e.target.files[0], name);
                              });
                        });
            }

            static deleteImage(name){
                  firebase.storage().ref('/idImages/').child(name).delete()
                        .then(() => M.toast({html: 'Sikeres kép törlés', classes: 'green'}))
                        .catch(() => M.toast({html: 'Sikertelen kép törlés', classes: 'red'}));
            }
      }



      document.addEventListener('DOMContentLoaded', () => {
            M.Collapsible.init(document.querySelectorAll('.collapsible'));
            M.Modal.init(document.querySelectorAll('.modal'));
            M.FormSelect.init(document.querySelectorAll('select'));
            firebase.initializeApp({apiKey: "AIzaSyB5Mei15xp6ykQUV2p59K1j8lrDk5jsFEI", authDomain: "precise-elektrik.firebaseapp.com", databaseURL: "https://precise-elektrik.firebaseio.com", projectId: "precise-elektrik", storageBucket: "precise-elektrik.appspot.com"});

            Auth.getState();
      });

      const itemForm = document.getElementById('item-form');
      itemForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const group = itemForm['item-group-input'].value.trim();
            const name = itemForm['item-name-input'].value;
            const type = itemForm['item-type-input'].value;
            const typeUnit = itemForm['type-unit'].value;
            const id = itemForm['item-id-input'].value;
            const amount = itemForm['item-amount-input'].valueAsNumber;
            const amountUnit = itemForm['amount-unit'].value;
            const amountLimit = itemForm['amount-limit'].valueAsNumber;
            const manufacturer = itemForm['manufacturer-input'].value.trim();
            const file = itemForm['item-file-input'].files[0];
            const item = new Item(group, name, type, id, amount, typeUnit, amountUnit, amountLimit, manufacturer);

            Database.addItem({ ...item });
            itemForm.reset();
            if(file !== undefined) Storage.uploadImage(file, id);
      });

      document.addEventListener('click', (e) => {
            const classList = e.target.classList;
            const id = e.target.id;

            if(classList.contains('delete') && confirm(`Biztos törlöd ${e.target.parentElement.parentElement.children[0].innerHTML}-t?`)){
                  Database.deleteItem(e.target.parentElement.id);
            }

            if(classList.contains('edit')){
                  amountForm.dataset.id = e.target.parentElement.id;
                  amountForm['edit-amount-input'].value = e.target.innerHTML.split(' ')[0];
                  amountForm['edit-amount-input'].focus();
            }

            if(classList.contains('collapsible-header')){
                  Array.from(e.target.parentElement.parentElement.children).forEach((item, key) => item.className === 'active' ? UI.activeItem = key : null);
                  itemForm['item-group-input'].value = e.target.innerHTML.split('<')[0];
            }

            if(classList.contains('changes-length')){
                  Auth.uid !== '' ? Database.getChanges(parseInt(e.target.innerHTML.split('<')[0])) : null;
            }

            if(id === 'sign-out-trigger') Auth.signOut();

            if(classList.contains('print')) UI.print(e.target.previousSibling.data);

            if(classList.contains('image-trigger')) Storage.getImage(e.target.innerHTML);

            if(id === 'item-form-trigger') document.getElementById('item-group-input').focus();

            if(id === 'sign-in-trigger') document.getElementById('email').focus();

            if(id === 'btn-under-limit') Database.getItemsUnderLimit();

            if(id === 'refresh-trigger') Database.getItems();
      });

      const amountForm = document.querySelector('.edit-amount-form');
      amountForm.addEventListener('submit', (e) => {
            e.preventDefault();

            Database.updateItem(e.target.dataset.id, e.target['edit-amount-input'].valueAsNumber);
            amountForm.reset();
      });

      const signInForm = document.getElementById('sign-in-form');
      signInForm.addEventListener('submit', (e) => {
            e.preventDefault();

            Auth.signIn(signInForm['email'].value, signInForm['password'].value);
            signInForm.reset();
      });

      const searchForm = document.getElementById('search-form');
      searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchCategory = document.getElementById('search-category').value;
            const searchTerm = document.getElementById('search-term').value;

            Database.getItemsWhere(searchCategory, "==", searchTerm);
            searchForm.reset();
      })
})();
