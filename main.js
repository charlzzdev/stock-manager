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
      static displayItems() {
            const list = [
                  {
                        group: 'first group',
                        name: 'first name',
                        type: 'first type',
                        id: 312,
                        amount: 456
                  },
                  {
                        group: 'first group',
                        name: 'third name',
                        type: 'third type',
                        id: 43534,
                        amount: 44556
                  },
                  {
                        group: 'second group',
                        name: 'second name',
                        type: 'second type',
                        id: 875,
                        amount: 985
                  }
            ];

            list.forEach(item => UI.listItem(item));
      }

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



document.addEventListener('DOMContentLoaded', () => {
      M.Collapsible.init(document.querySelectorAll('.collapsible'));
      M.Modal.init(document.querySelectorAll('.modal'));

      UI.displayItems();
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

      UI.listItem(item);
      itemForm.reset();
});
