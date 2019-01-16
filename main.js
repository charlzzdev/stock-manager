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
      static listItem(item){
            if(document.getElementById(item.group) === null) {
                  const li = document.createElement('li');
                  li.id = item.group;
                  li.innerHTML = `
                        <div class="collapsible-header">${item.group}</div>
                        <div class="collapsible-body">
                              <table class="highlight">
                                    <thead>
                                          <tr><th>Megnevezés</th><th>Típus</th><th>Cikkszám</th><th>Raktár</th></tr>
                                    </thead>
                                    <tbody id="${item.group}-tbody">
                                          <tr><td>${item.name}</td><td>${item.type}</td><td>${item.id}</td><td><span class="amount">${item.amount}</span> db <a href="#amount" class="modal-trigger right">szerkeszt</a></td></tr>
                                    </tbody>
                              </table>
                        </div>
                  `;

                  document.getElementById('item-list').appendChild(li);
            } else {
                  const tr = document.createElement('tr');
                  tr.innerHTML = `<td>${item.name}</td><td>${item.type}</td><td>${item.id}</td><td><span class="amount">${item.amount}</span> db <a href="#amount" class="modal-trigger right">szerkeszt</a></td>`;

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
                        UI.listItem(doc.data());
                  });
            });
      }

      static addItem(item) {
            firebase.firestore().collection('items').add(item);

            Array.from(document.getElementById('item-list').children).forEach((value, key) => {
                  if(value.id === item.group) {
                        setTimeout(() => M.Collapsible.getInstance(document.getElementById('item-list')).open(key), 100)
                  }
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
