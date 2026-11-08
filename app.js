
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
};

const escapeHTML = (value) => {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
};

const getNumber = (selector) => {
  return Number($(selector).value);
};

const showError = (selector, message) => {
  $(selector).textContent = message;
};

const clearError = (selector) => {
  $(selector).textContent = "";
};

/* =========================
   KALKULATOR DISKON
========================= */

$("#calculateDiscount").addEventListener("click", () => {
  const price = getNumber("#discountPrice");
  const percent = getNumber("#discountPercent");

  clearError("#discountError");
  $("#discountResult").hidden = true;

  if ($("#discountPrice").value === "" || $("#discountPercent").value === "") {
    showError("#discountError", "Yuk, isi harga awal dan persentase diskonnya terlebih dahulu.");
    return;
  }

  if (!Number.isFinite(price) || !Number.isFinite(percent) ||
      price <= 0 || percent < 0 || percent > 100) {
    showError("#discountError", "Masukkan harga lebih dari 0 dan diskon antara 0–100%.");
    return;
  }

  const discountAmount = price * percent / 100;
  const finalPrice = price - discountAmount;

  $("#originalPriceResult").textContent = formatRupiah(price);
  $("#discountAmountResult").textContent = formatRupiah(discountAmount);
  $("#finalPriceResult").textContent = formatRupiah(finalPrice);
  $("#savingText").textContent = `Kamu menghemat ${formatRupiah(discountAmount)}!`;

  $("#discountResult").hidden = false;
});

$("#resetDiscount").addEventListener("click", () => {
  $("#discountPrice").value = "";
  $("#discountPercent").value = "";
  $("#discountResult").hidden = true;
  clearError("#discountError");
});

/* =========================
   PERBANDINGAN PRODUK
========================= */

$("#compareButton").addEventListener("click", () => {
  clearError("#comparisonError");
  $("#comparisonResult").hidden = true;

  const unit = $("#unit").value;
  const budgetValue = $("#budget").value;
  const budget = budgetValue === "" ? null : Number(budgetValue);

  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
    showError("#comparisonError", "Budget tidak boleh bernilai negatif.");
    return;
  }

  const products = [];

  for (let i = 1; i <= 3; i++) {
    const name = $(`#name${i}`).value.trim();
    const priceValue = $(`#price${i}`).value;
    const discountValue = $(`#discount${i}`).value;
    const quantityValue = $(`#quantity${i}`).value;

    const filled = name !== "" || priceValue !== "" ||
      discountValue !== "" || quantityValue !== "";

    if (!filled && i === 3) continue;

    if (!filled) {
      showError("#comparisonError", `Lengkapi data produk ${i}.`);
      return;
    }

    if (name === "" || priceValue === "" || quantityValue === "") {
      showError("#comparisonError", `Nama, harga, dan isi produk ${i} wajib diisi.`);
      return;
    }

    const price = Number(priceValue);
    const discount = discountValue === "" ? 0 : Number(discountValue);
    const quantity = Number(quantityValue);

    if (!Number.isFinite(price) || !Number.isFinite(discount) ||
        !Number.isFinite(quantity) || price <= 0 || quantity <= 0 ||
        discount < 0 || discount > 100) {
      showError("#comparisonError", `Periksa kembali angka pada produk ${i}.`);
      return;
    }

    const finalPrice = price - (price * discount / 100);
    const unitPrice = finalPrice / quantity;

    products.push({
      name,
      price,
      discount,
      quantity,
      finalPrice,
      unitPrice
    });
  }

  if (products.length < 2) {
    showError("#comparisonError", "Masukkan minimal dua produk untuk dibandingkan.");
    return;
  }

  const winner = products.reduce((best, current) =>
    current.unitPrice < best.unitPrice ? current : best
  );

  let html = "";

  products.forEach((product) => {
    const isWinner = product === winner;
    const withinBudget = budget === null || product.finalPrice <= budget;

    html += `
      <div class="comparison-result-card ${isWinner ? "winner" : ""}">
        <h5>${isWinner ? "🏆 " : ""}${escapeHTML(product.name)}
          ${isWinner ? "<span style='font-size:10px;color:#5288d3'>Pilihan paling hemat per satuan</span>" : ""}
        </h5>
        <div class="comparison-data">
          <div>
            <span>Harga setelah diskon</span>
            <strong>${formatRupiah(product.finalPrice)}</strong>
          </div>
          <div>
            <span>Harga per ${escapeHTML(unit)}</span>
            <strong>${formatRupiah(product.unitPrice)}</strong>
          </div>
          <div>
            <span>Jumlah isi</span>
            <strong>${product.quantity} ${escapeHTML(unit)}</strong>
          </div>
          <div>
            <span>Status budget</span>
            <strong>${withinBudget ? "Sesuai budget" : "Melebihi budget"}</strong>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    <div class="winner-note">
      💡 ${escapeHTML(winner.name)} memiliki harga per ${escapeHTML(unit)}
      paling rendah, yaitu ${formatRupiah(winner.unitPrice)}.
    </div>
  `;

  $("#comparisonResultContent").innerHTML = html;
  $("#comparisonResult").hidden = false;
});

$("#resetComparison").addEventListener("click", () => {
  for (let i = 1; i <= 3; i++) {
    $(`#name${i}`).value = "";
    $(`#price${i}`).value = "";
    $(`#discount${i}`).value = "";
    $(`#quantity${i}`).value = "";
  }

  $("#unit").value = "pcs";
  $("#budget").value = "";
  $("#comparisonResult").hidden = true;
  $("#comparisonResultContent").innerHTML = "";
  clearError("#comparisonError");
});

/* =========================
   SPLIT BILL - MODE
========================= */

let splitMode = "equal";

$$(".method-button").forEach((button) => {
  button.addEventListener("click", () => {
    splitMode = button.dataset.mode;

    $$(".method-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    $("#equalMode").hidden = splitMode !== "equal";
    $("#customMode").hidden = splitMode !== "custom";
    $("#splitResult").hidden = true;
    clearError("#splitError");
  });
});

/* =========================
   SPLIT BILL - BAGI RATA
========================= */

function createEqualPerson(name = "") {
  const row = document.createElement("div");
  row.className = "person-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control person-name";
  input.placeholder = "Nama orang";
  input.value = name;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-person";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Hapus orang");

  remove.addEventListener("click", () => {
    row.remove();
    updateEqualRemoveButtons();
  });

  row.append(input, remove);
  return row;
}

function updateEqualRemoveButtons() {
  const rows = $$("#equalPeopleList .person-row");

  rows.forEach((row) => {
    const button = row.querySelector(".remove-person");
    button.disabled = rows.length <= 2;
    button.style.opacity = rows.length <= 2 ? "0.4" : "1";
    button.style.cursor = rows.length <= 2 ? "not-allowed" : "pointer";
  });
}

$("#addEqualPerson").addEventListener("click", () => {
  $("#equalPeopleList").appendChild(createEqualPerson());
  updateEqualRemoveButtons();
});

function getEqualPeople() {
  const inputs = $$("#equalPeopleList .person-name");

  return inputs.map((input) => input.value.trim());
}

function distributeAmount(total, count) {
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from({ length: count }, (_, index) =>
    (base + (index < remainder ? 1 : 0)) / 100
  );
}

/* =========================
   SPLIT BILL - CUSTOM
========================= */

function createOrderRow(itemName = "", amount = "") {
  const row = document.createElement("div");
  row.className = "order-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "form-control order-name";
  nameInput.placeholder = "Nama pesanan";
  nameInput.value = itemName;

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.className = "form-control order-amount";
  amountInput.placeholder = "Harga";
  amountInput.min = "0";
  amountInput.value = amount;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-order";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", "Hapus pesanan");

  nameInput.addEventListener("input", updateCustomSubtotal);
  amountInput.addEventListener("input", updateCustomSubtotal);

  removeButton.addEventListener("click", () => {
    row.remove();
    updateOrderRemoveButtons(row.closest(".custom-person-card"));
    updateCustomSubtotal();
  });

  row.append(nameInput, amountInput, removeButton);
  return row;
}

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
    card.remove();
    updateCustomPersonRemoveButtons();
    updateCustomSubtotal();
  });

  header.append(nameInput, removePerson);

  const orderList = document.createElement("div");
  orderList.className = "order-list";
  orderList.appendChild(createOrderRow());

  const addOrderButton = document.createElement("button");
  addOrderButton.type = "button";
  addOrderButton.className = "add-order-button";
  addOrderButton.textContent = "＋ Tambah pesanan";

  addOrderButton.addEventListener("click", () => {
    orderList.appendChild(createOrderRow());
    updateOrderRemoveButtons(card);
    updateCustomSubtotal();
  });

  const personTotal = document.createElement("div");
  personTotal.className = "person-subtotal";

  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Subtotal";

  const totalValue = document.createElement("strong");
  totalValue.className = "person-subtotal-value";
  totalValue.textContent = formatRupiah(0);

  personTotal.append(totalLabel, totalValue);

  card.append(header, orderList, addOrderButton, personTotal);

  return card;
}

function updateOrderRemoveButtons(card) {
  if (!card) return;

  const rows = [...card.querySelectorAll(".order-row")];

  rows.forEach((row) => {
    const button = row.querySelector(".remove-order");
    button.disabled = rows.length <= 1;
    button.style.opacity = rows.length <= 1 ? "0.4" : "1";
    button.style.cursor = rows.length <= 1 ? "not-allowed" : "pointer";
  });
}

function updateCustomPersonRemoveButtons() {
  const cards = $$("#customPeopleList .custom-person-card");

  cards.forEach((card) => {
    const button = card.querySelector(".custom-person-header .remove-person");
    button.disabled = cards.length <= 2;
    button.style.opacity = cards.length <= 2 ? "0.4" : "1";
    button.style.cursor = cards.length <= 2 ? "not-allowed" : "pointer";
  });
}

function getPersonSubtotal(card) {
  return [...card.querySelectorAll(".order-amount")].reduce((sum, input) => {
    return sum + (input.value === "" ? 0 : Number(input.value));
  }, 0);
}

function updateCustomSubtotal() {
  const cards = $$("#customPeopleList .custom-person-card");
  let grandTotal = 0;

  cards.forEach((card) => {
    const subtotal = getPersonSubtotal(card);
    grandTotal += subtotal;

    const value = card.querySelector(".person-subtotal-value");
    value.textContent = formatRupiah(subtotal);
  });

  $("#customSubtotal").textContent = formatRupiah(grandTotal);
}

$("#addCustomPerson").addEventListener("click", () => {
  $("#customPeopleList").appendChild(createCustomPerson());
  updateCustomPersonRemoveButtons();
  updateCustomSubtotal();
});

function getCustomPeople() {
  const cards = $$("#customPeopleList .custom-person-card");

  return cards.map((card) => {
    const name = card.querySelector(".custom-name").value.trim();
    const rows = [...card.querySelectorAll(".order-row")];

    const orders = rows.map((row) => ({
      name: row.querySelector(".order-name").value.trim(),
      amount: row.querySelector(".order-amount").value === ""
        ? 0
        : Number(row.querySelector(".order-amount").value)
    }));

    return {
      name,
      orders,
      subtotal: orders.reduce((sum, order) => sum + order.amount, 0)
    };
  });
}

/* =========================
   HITUNG SPLIT BILL
========================= */

function calculateSplitBill() {
  clearError("#splitError");
  $("#splitResult").hidden = true;

  const extraValue = $("#extraFee").value;
  const extra = extraValue === "" ? 0 : Number(extraValue);

  if (!Number.isFinite(extra) || extra < 0) {
    showError("#splitError", "Biaya tambahan tidak boleh negatif.");
    return;
  }

  const billName = $("#billName").value.trim() || "Tagihan bersama";

  let people = [];
  let subtotal = 0;
  let methodText = "";

  if (splitMode === "equal") {
    const names = getEqualPeople();
    const totalValue = $("#equalTotal").value;

    if (names.length < 2) {
      showError("#splitError", "Minimal harus ada dua orang.");
      return;
    }

    if (names.some((name) => name === "")) {
      showError("#splitError", "Isi nama semua orang terlebih dahulu.");
      return;
    }

    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
      showError("#splitError", "Gunakan nama yang berbeda untuk setiap orang.");
      return;
    }

    if (totalValue === "") {
      showError("#splitError", "Masukkan total tagihan terlebih dahulu.");
      return;
    }

    subtotal = Number(totalValue);

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      showError("#splitError", "Total tagihan harus lebih dari 0.");
      return;
    }

    const grandTotal = subtotal + extra;
    const shares = distributeAmount(grandTotal, names.length);

    people = names.map((name, index) => ({
      name,
      amount: shares[index],
      detail: "Bagian tagihan"
    }));

    methodText = "Dibagi rata";
  } else {
    const customPeople = getCustomPeople();

    if (customPeople.length < 2) {
      showError("#splitError", "Tambahkan minimal dua orang.");
      return;
    }

    if (customPeople.some((person) => person.name === "")) {
      showError("#splitError", "Isi nama semua orang terlebih dahulu.");
      return;
    }

    if (new Set(customPeople.map((person) => person.name.toLowerCase())).size !== customPeople.length) {
      showError("#splitError", "Gunakan nama yang berbeda untuk setiap orang.");
      return;
    }

    for (const person of customPeople) {
      if (person.orders.length === 0 ||
          person.orders.some((order) => order.name === "")) {
        showError("#splitError", `Lengkapi nama pesanan milik ${person.name}.`);
        return;
      }

      if (person.orders.some((order) => !Number.isFinite(order.amount) || order.amount < 0)) {
        showError("#splitError", `Periksa harga pesanan milik ${person.name}.`);
        return;
      }
    }

    subtotal = customPeople.reduce((sum, person) => sum + person.subtotal, 0);

    if (subtotal <= 0) {
      showError("#splitError", "Masukkan minimal satu harga pesanan yang lebih dari 0.");
      return;
    }

    const grandTotal = subtotal + extra;

    // Biaya tambahan dibagi berdasarkan proporsi subtotal pesanan.
    const totalCents = Math.round(grandTotal * 100);
    const subtotalCents = Math.round(subtotal * 100);

    const rawShares = customPeople.map((person) => {
      return totalCents * Math.round(person.subtotal * 100) / subtotalCents;
    });

    const sharesCents = rawShares.map(Math.floor);
    let remainder = totalCents - sharesCents.reduce((sum, value) => sum + value, 0);

    const order = rawShares
      .map((value, index) => ({
        index,
        remainder: value - Math.floor(value)
      }))
      .sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remainder; i++) {
      sharesCents[order[i].index]++;
    }

    people = customPeople.map((person, index) => ({
      name: person.name,
      amount: sharesCents[index] / 100,
      detail: person.orders.map((item) => item.name).join(", ")
    }));

    methodText = "Sesuai pesanan + pembagian biaya tambahan proporsional";
  }

  const grandTotal = subtotal + extra;

  renderSplitResult({
    billName,
    subtotal,
    extra,
    grandTotal,
    people,
    methodText
  });
}

/* =========================
   TAMPILKAN HASIL
========================= */

function renderSplitResult(data) {
  $("#resultBillName").textContent = data.billName;
  $("#resultGrandTotal").textContent = formatRupiah(data.grandTotal);
  $("#resultMethod").textContent = data.methodText;
  $("#resultSubtotal").textContent = formatRupiah(data.subtotal);
  $("#resultExtra").textContent = formatRupiah(data.extra);

  const breakdown = $("#splitBreakdown");
  breakdown.innerHTML = "";

  data.people.forEach((person) => {
    const row = document.createElement("div");
    row.className = "breakdown-person";

    const name = document.createElement("span");
    name.textContent = person.name;

    const amount = document.createElement("strong");
    amount.textContent = formatRupiah(person.amount);

    row.append(name, amount);

    if (splitMode === "custom") {
      const detail = document.createElement("small");
      detail.textContent = person.detail;
      detail.style.display = "block";
      detail.style.color = "#8290a7";
      detail.style.fontSize = "10px";
      detail.style.marginTop = "4px";
      name.appendChild(detail);
    }

    breakdown.appendChild(row);
  });

  const checkTotal = data.people.reduce((sum, person) => sum + person.amount, 0);
  $("#resultCheckTotal").textContent = formatRupiah(checkTotal);

  $("#splitResult").hidden = false;
}

/* =========================
   RESET SPLIT BILL
========================= */

function resetSplitBill() {
  $("#billName").value = "";
  $("#extraFee").value = "";
  $("#equalTotal").value = "";

  $("#equalPeopleList").innerHTML = "";
  $("#equalPeopleList").append(
    createEqualPerson(),
    createEqualPerson()
  );
  updateEqualRemoveButtons();

  $("#customPeopleList").innerHTML = "";
  $("#customPeopleList").append(
    createCustomPerson(),
    createCustomPerson()
  );
  updateCustomPersonRemoveButtons();
  updateCustomSubtotal();

  splitMode = "equal";

  $$(".method-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === "equal");
  });

  $("#equalMode").hidden = false;
  $("#customMode").hidden = true;
  $("#splitResult").hidden = true;

  clearError("#splitError");
}

$("#calculateSplit").addEventListener("click", calculateSplitBill);
$("#resetSplit").addEventListener("click", resetSplitBill);

/* =========================
   INISIALISASI
========================= */

updateEqualRemoveButtons();

$("#customPeopleList").append(
  createCustomPerson(),
  createCustomPerson()
);

updateCustomPersonRemoveButtons();
updateCustomSubtotal();
