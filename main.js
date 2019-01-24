(function() {
      class Item {
            constructor(group, name, type, id, amount, typeUnit, amountUnit) {
                  this.group = group;
                  this.name = name;
                  this.type = type;
                  this.id = id;
                  this.amount = amount;
                  this.typeUnit = typeUnit;
                  this.amountUnit = amountUnit;
            }
      }

      class UI {
            static listItem(item, itemId){
                  M.Collapsible.getInstance(document.querySelector('.collapsible')).open(UI.activeItem);
                  const tr = document.createElement('tr');
                  tr.innerHTML = `<td>${item.name}</td>
                        <td>${item.type} ${item.typeUnit}</td>
                        <td><a class="modal-trigger image-trigger" href="#image">${item.id}</a></td>
                        <td id="${itemId}">
                              <a href="#amount" class="${Auth.uid === 'VJYk7J4B4CdE6NtoqBGrEVJggJ03' ? 'modal-trigger' : ''} edit">${item.amount} ${item.amountUnit}</a>
                              <i class="material-icons right red-text delete" style="cursor: pointer; ${Auth.uid === 'VJYk7J4B4CdE6NtoqBGrEVJggJ03' ? '' : 'display: none;'}">delete</i>
                  </td>`;
                  
                  if(document.getElementById(item.group) === null) {
                        const li = document.createElement('li');
                        li.id = item.group;
                        li.innerHTML = `
                              <div class="collapsible-header" style="position: relative;">${item.group}<i class="material-icons print" style="position:absolute; right: 0;">print</i></div>
                              <div class="collapsible-body">
                                    <table class="striped responsive-table">
                                          <thead>
                                                <tr><th>Megnevezés</th><th>Típus</th><th>Cikkszám</th><th>Raktár</th></tr>
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

            static hideElements(signInTrigger, signOutTrigger, deleteTrigger, itemFormTrigger, amountTrigger){
                  document.getElementById('sign-in-trigger').style.display = signInTrigger;
                  document.getElementById('sign-out-trigger').style.display = signOutTrigger;
                  Array.from(document.getElementsByClassName('delete')).forEach(element => element.style.display = deleteTrigger);
                  document.getElementById('item-form-trigger').style.display = itemFormTrigger;
                  Array.from(document.getElementsByClassName('edit')).forEach(element => element.className = amountTrigger);
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
      }

      class Database {
            static getItems() {
                  firebase.firestore().settings({ timestampsInSnapshots: true });
                  Database.unsubscribeGetItems = firebase.firestore().collection('items').onSnapshot(snapshot => {
                        document.getElementById('item-list').innerHTML = '';
                        snapshot.docs.forEach(doc => {
                              UI.listItem(doc.data(), doc.id);
                        });
                  });
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
                        let changes = document.getElementById('changes-tbody');
                        changes.innerHTML = '';
                        snapshot.docs.forEach(doc => {
                              let data = doc.data();
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
                              name: item[0].innerHTML,
                              type: item[1].innerHTML.split(' ')[0],
                              typeUnit: item[1].innerHTML.split(' ')[1],
                              id: item[2].children[0].innerHTML,
                              amount: action === 'update' ? `<span class="red-text">${item[3].children[0].innerHTML}</span> → <span class="green-text">${amount} ${item[3].children[0].innerHTML.split(' ')[1]}</span>` : '<span class="red-text">Törölve</span>',
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
                              UI.hideElements('none', '', '', '', 'modal-trigger edit');
                        } else {
                              Database.unsubscribeGetItems !== undefined ? Database.unsubscribeGetItems() : null;
                              Database.unsubscribeGetChanges !== undefined ? Database.unsubscribeGetChanges() : null;
                              Auth.uid = '';
                              UI.hideElements('', 'none', 'none', 'none', 'edit');
                              document.getElementById('item-list').innerHTML = '';
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
                  firebase.storage().ref('/idImages/').child(name).getDownloadURL()
                        .then(url => document.getElementById('image').src = url)
                        .catch(() => M.toast({html: `${name} képe nem lett megtalálva`, classes: 'red'}));
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
            const amount = itemForm['item-amount-input'].value;
            const amountUnit = itemForm['amount-unit'].value;
            const file = itemForm['item-file-input'].files[0];
            const item = new Item(group, name, type, id, amount, typeUnit, amountUnit);

            Database.addItem({ ...item });
            itemForm.reset();
            if(file !== undefined) Storage.uploadImage(file, id);
      });

      document.addEventListener('click', (e) => {
            if(e.target.classList.contains('delete') && confirm(`Biztos törlöd ${e.target.parentElement.parentElement.children[0].innerHTML}-t?`)){
                  Database.deleteItem(e.target.parentElement.id);
            }

            if(e.target.classList.contains('edit')){
                  amountForm.dataset.id = e.target.parentElement.id;
                  amountForm['edit-amount-input'].value = e.target.innerHTML.split(' ')[0];
            }

            if(e.target.classList.contains('collapsible-header')){
                  Array.from(e.target.parentElement.parentElement.children).forEach((item, key) => item.className === 'active' ? UI.activeItem = key : null);
                  itemForm['item-group-input'].value = e.target.innerHTML.split('<')[0];
            }

            if(e.target.classList.contains('changes-length')){
                  Auth.uid !== '' ? Database.getChanges(parseInt(e.target.innerHTML.split('<')[0])) : null;
            }

            if(e.target.id === 'sign-out-trigger') Auth.signOut();

            if(e.target.classList.contains('print')) UI.print(e.target.previousSibling.data);

            if(e.target.classList.contains('image-trigger')){
                  Storage.getImage(e.target.innerHTML);
            }
      });

      const amountForm = document.querySelector('.edit-amount-form');
      amountForm.addEventListener('submit', (e) => {
            e.preventDefault();

            Database.updateItem(e.target.dataset.id, e.target['edit-amount-input'].value);
            amountForm.reset();
      });

      const signInForm = document.getElementById('sign-in-form');
      signInForm.addEventListener('submit', (e) => {
            e.preventDefault();

            Auth.signIn(signInForm['email'].value, signInForm['password'].value);
            signInForm.reset();
      });
})();
