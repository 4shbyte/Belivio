// =====================================
// MEMBUAT PESANAN PER ORANG
// =====================================

function createOrderRow(itemName = "", amount = "") {
  const row = document.createElement("div");
  row.className = "order-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "form-control order-name";
  nameInput.placeholder = "Nama makanan/minuman";
  nameInput.value = itemName;

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.className = "form-control order-amount";
  amountInput.placeholder = "Harga (Rp)";
  amountInput.min = "0";
  amountInput.value = amount;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-order";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", "Hapus pesanan");

  removeButton.addEventListener("click", () => {
    const orderList = row.parentElement;

    if (orderList.children.length <= 1) {
      return;
    }

    row.remove();
    updateOrderRemoveButtons(orderList);
    updateCustomSubtotal();
    hideSplitResult();
  });

  nameInput.addEventListener("input", hideSplitResult);

  amountInput.addEventListener("input", () => {
    updateCustomSubtotal();
    hideSplitResult();
  });

  row.append(nameInput, amountInput, removeButton);

  return row;
}


// Membuat kartu orang
function createCustomPerson(name = "") {
  const card = document.createElement("div");
  card.className = "custom-person-card";

  const header = document.createElement("div");
  header.className = "custom-person-header";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "form-control custom-name";
  nameInput.placeholder = "Nama orang";
  nameInput.value = name;

  const removePerson = document.createElement("button");
  removePerson.type = "button";
  removePerson.className = "remove-person";
  removePerson.textContent = "×";
  removePerson.setAttribute("aria-label", "Hapus orang");

  removePerson.addEventListener("click", () => {
    if ($("#customPeopleList").children.length <= 2) {
      return;
    }

    card.remove();
    updateRemoveButtons("#customPeopleList");
    updateCustomSubtotal();
    hideSplitResult();
  });

  header.append(nameInput, removePerson);

  const orderList = document.createElement("div");
  orderList.className = "order-list";

  // Setiap orang minimal memiliki satu pesanan
  orderList.appendChild(createOrderRow());

  const addOrderButton = document.createElement("button");
  addOrderButton.type = "button";
  addOrderButton.className = "add-order-button";
  addOrderButton.textContent = "+ Tambah Pesanan";

  addOrderButton.addEventListener("click", () => {
    if (orderList.children.length >= 20) {
      $("#splitError").textContent = "Maksimal 20 pesanan untuk setiap orang.";
      return;
    }

    orderList.appendChild(createOrderRow());
    updateOrderRemoveButtons(orderList);
    hideSplitResult();
  });

  const personTotal = document.createElement("div");
  personTotal.className = "person-subtotal";

  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Total pesanan";

  const totalValue = document.createElement("strong");
  totalValue.className = "person-subtotal-value";
  totalValue.textContent = formatRupiah(0);

  personTotal.append(totalLabel, totalValue);

  nameInput.addEventListener("input", hideSplitResult);

  card.append(
    header,
    orderList,
    addOrderButton,
    personTotal
  );

  return card;
}


// Mengatur tombol hapus orang
function updateRemoveButtons(selector) {
  const rows = $$(selector + " > div");

  rows.forEach(row => {
    const button = row.querySelector(".remove-person");

    if (button) {
      button.disabled = rows.length <= 2;
    }
  });
}


// Mengatur tombol hapus pesanan
function updateOrderRemoveButtons(orderList) {
  const rows = [...orderList.children];

  rows.forEach(row => {
    const button = row.querySelector(".remove-order");

    if (button) {
      button.disabled = rows.length <= 1;
    }
  });
}


// Menghitung total pesanan setiap orang
function updateCustomSubtotal() {
  const cards = $$(".custom-person-card");
  let grandSubtotal = 0;

  cards.forEach(card => {
    const amounts = [...card.querySelectorAll(".order-amount")];

    const personTotal = amounts.reduce((sum, input) => {
      const value = input.value === "" ? 0 : Number(input.value);

      return sum + (
        Number.isFinite(value) && value > 0 ? value : 0
      );
    }, 0);

    card.querySelector(".person-subtotal-value").textContent =
      formatRupiah(personTotal);

    grandSubtotal += personTotal;
  });

  $("#customSubtotal").textContent = formatRupiah(grandSubtotal);
}


// Tombol tambah orang
$("#addCustomPerson").addEventListener("click", () => {
  const list = $("#customPeopleList");

  if (list.children.length >= 30) {
    $("#splitError").textContent = "Maksimal 30 orang.";
    return;
  }

  list.appendChild(
    createCustomPerson(`Orang ${list.children.length + 1}`)
  );

  updateRemoveButtons("#customPeopleList");
  updateCustomSubtotal();
  hideSplitResult();
});


// Mengambil data pesanan setiap orang
function getCustomPeople() {
  const cards = $$("#customPeopleList .custom-person-card");

  if (cards.length < 2) {
    throw new Error("Minimal harus ada dua orang.");
  }

  return cards.map((card, index) => {
    const name = card.querySelector(".custom-name").value.trim();

    const orderRows = [...card.querySelectorAll(".order-row")];

    const orders = orderRows.map((row, orderIndex) => {
      const itemName = row.querySelector(".order-name").value.trim();
      const amountText = row.querySelector(".order-amount").value;

      if (!itemName) {
        throw new Error(
          `Masukkan nama pesanan ke-${orderIndex + 1} untuk ${name || `Orang ${index + 1}`}.`
        );
      }

      if (amountText === "") {
        throw new Error(
          `Masukkan harga ${itemName}.`
        );
      }

      const amount = Number(amountText);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          `Harga ${itemName} harus lebih dari 0.`
        );
      }

      return {
        itemName,
        amount
      };
    });

    const subtotal = orders.reduce(
      (sum, order) => sum + order.amount,
      0
    );

    return {
      name: name || `Orang ${index + 1}`,
      orders,
      subtotal
    };
  });
}
