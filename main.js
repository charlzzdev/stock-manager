class Item {
      constructor(group, name, type, id, amount) {
            this.group = group;
            this.name = name;
            this.type = type;
            this.id = id;
            this.amount = amount;
      }
}

class UI {
      static listItem(item, itemId){
            M.Collapsible.getInstance(document.querySelector('.collapsible')).open(UI.activeItem);
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${item.name}</td><td>${item.type}</td><td>${item.id}</td><td id="${itemId}"><a href="#amount" class="modal-trigger edit">${item.amount} db</a><i class="material-icons right red-text delete" style="cursor: pointer;">delete</i></td>`;
            
            if(document.getElementById(item.group) === null) {
                  const li = document.createElement('li');
                  li.id = item.group;
                  li.innerHTML = `
                        <div class="collapsible-header">${item.group}</div>
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
}

class Database {
      static getItems() {
            firebase.firestore().settings({ timestampsInSnapshots: true });
            firebase.firestore().collection('items').onSnapshot(snapshot => {
                  document.getElementById('item-list').innerHTML = '';
                  snapshot.docs.forEach(doc => {
                        UI.listItem(doc.data(), doc.id);
                  });
            });
      }

      static addItem(item) {
            firebase.firestore().collection('items').add(item).then(() => {
                  M.toast({html: 'Sikeresen hozzáadva', classes: 'green'});
            }).catch(() => {
                  M.toast({html: 'Sikertelen hozzáadás', classes: 'red'});
            });
      }

      static deleteItem(itemId){
            firebase.firestore().collection('items').doc(itemId).delete().then(() => {
                  M.toast({html: 'Sikeresen törölve', classes: 'green'});
            }).catch(() => {
                  M.toast({html: 'Sikertelen törlés', classes: 'red'});
            });
      }

      static updateItem(itemId, amount){
            firebase.firestore().collection('items').doc(itemId).update({ amount }).then(() => {
                  M.toast({html: 'Sikeresen szerkesztve', classes: 'green'});
            }).catch(() => {
                  M.toast({html: 'Sikertelen szerkesztés', classes: 'red'});
            });
      }
}



document.addEventListener('DOMContentLoaded', () => {
      M.Collapsible.init(document.querySelectorAll('.collapsible'));
      M.Modal.init(document.querySelectorAll('.modal'));
      firebase.initializeApp({apiKey: "AIzaSyB5Mei15xp6ykQUV2p59K1j8lrDk5jsFEI", authDomain: "precise-elektrik.firebaseapp.com", databaseURL: "https://precise-elektrik.firebaseio.com", projectId: "precise-elektrik"});

      Database.getItems();
});

const itemForm = document.getElementById('item-form');
itemForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const group = itemForm['item-group-input'].value;
      const name = itemForm['item-name-input'].value;
      const type = itemForm['item-type-input'].value;
      const id = itemForm['item-id-input'].value;
      const amount = itemForm['item-amount-input'].value;
      const item = new Item(group, name, type, id, amount);

      Database.addItem({ ...item });
      itemForm.reset();
});

document.addEventListener('click', (e) => {
      if(e.target.classList.contains('delete') && confirm(`Biztos törlöd ${e.target.parentElement.parentElement.children[0].innerHTML}-t?`)){
            Database.deleteItem(e.target.parentElement.id);
      }

      if(e.target.classList.contains('edit')){
            amountForm.id = e.target.parentElement.id;
            amountForm['edit-amount-input'].value = e.target.innerHTML.split(' ')[0];
      }

      if(e.target.classList.contains('collapsible-header')){
            Array.from(e.target.parentElement.parentElement.children).forEach((item, key) => item.className === 'active' ? UI.activeItem = key : null);
            itemForm['item-group-input'].value = e.target.innerHTML;
      }
});

const amountForm = document.querySelector('.edit-amount-form');
amountForm.addEventListener('submit', (e) => {
      e.preventDefault();

      Database.updateItem(e.target.id, e.target['edit-amount-input'].value);
      amountForm.reset();
});
