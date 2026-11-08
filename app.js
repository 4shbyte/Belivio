
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);

const formatUnitPrice = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2
  }).format(number);

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

// =====================================
// 1. KALKULATOR DISKON
// =====================================

$("#calculateDiscount").addEventListener("click", () => {
  const price = Number($("#discountPrice").value);
  const discount = Number($("#discountPercent").value);
  const error = $("#discountError");
  const result = $("#discountResult");

  error.textContent = "";

  if ($("#discountPrice").value === "" ||
      $("#discountPercent").value === "") {
    error.textContent = "Harga dan persentase diskon harus diisi.";
    return;
  }

  if (!Number.isFinite(price) || price <= 0) {
    error.textContent = "Harga awal harus lebih dari 0.";
    return;
  }

  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    error.textContent = "Diskon harus berada di antara 0 sampai 100%.";
    return;
  }

  const savings = price * discount / 100;
  const finalPrice = price - savings;

  result.innerHTML = `
    <span class="result-caption">HARGA SETELAH DISKON</span>
    <h3>${formatRupiah(finalPrice)}</h3>
    <p>Harga awal: ${formatRupiah(price)}</p>
    <p>Potongan harga: ${formatRupiah(savings)} (${discount}%)</p>
    <strong>Kamu menghemat ${formatRupiah(savings)}!</strong>
  `;
});

$("#resetDiscount").addEventListener("click", () => {
  $("#discountPrice").value = "";
  $("#discountPercent").value = "";
  $("#discountError").textContent = "";

  $("#discountResult").innerHTML = `
    <span class="result-caption">HARGA SETELAH DISKON</span>
    <h3>Rp0</h3>
    <p>Hasil perhitungan akan muncul di sini.</p>
  `;
});


// =====================================
// 2. PERBANDINGAN PRODUK
// =====================================

function getProducts() {
  const products = [];

  for (let i = 1; i <= 3; i++) {
    const name = $(`#name${i}`).value.trim();
    const priceText = $(`#price${i}`).value;
    const discountText = $(`#discount${i}`).value;
    const quantityText = $(`#quantity${i}`).value;

    const hasInput = name || priceText || quantityText;

    if (i === 3 && !hasInput) continue;

    if (!name || priceText === "" || quantityText === "") {
      throw new Error(`Lengkapi nama, harga, dan jumlah Produk ${String.fromCharCode(64 + i)}.`);
    }

    const price = Number(priceText);
    const discount = discountText === "" ? 0 : Number(discountText);
    const quantity = Number(quantityText);

    if (!Number.isFinite(price) || price <= 0 ||
        !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Harga dan jumlah produk harus lebih dari 0.");
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      throw new Error("Diskon harus berada di antara 0 sampai 100%.");
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
    throw new Error("Masukkan minimal dua produk untuk dibandingkan.");
  }

  return products;
}

function compareProducts() {
  const error = $("#comparisonError");
  const result = $("#comparisonResult");

  error.textContent = "";
  result.innerHTML = "";

  try {
    const products = getProducts();
    const budgetText = $("#budget").value;
    const budget = budgetText === "" ? null : Number(budgetText);
    const unit = $("#unit").value;

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
      throw new Error("Budget tidak boleh bernilai negatif.");
    }

    const lowest = Math.min(...products.map(p => p.unitPrice));
    const winners = products.filter(p => Math.abs(p.unitPrice - lowest) < 0.000001);

    const highest = Math.max(...products.map(p => p.unitPrice));
    const difference = highest - lowest;

    let winnerMessage;

    if (winners.length > 1) {
      winnerMessage = `Produk ${winners.map(p => escapeHTML(p.name)).join(" dan ")} memiliki harga per satuan paling ekonomis.`;
    } else {
      winnerMessage = `Produk ${escapeHTML(winners[0].name)} memiliki harga per satuan paling ekonomis.`;
    }

    const tableRows = products.map(product => {
      const isWinner = Math.abs(product.unitPrice - lowest) < 0.000001;
      const budgetStatus = budget === null
        ? "-"
        : product.finalPrice <= budget ? "Sesuai budget" : "Melebihi budget";

      return `
        <tr>
          <td>
            <strong>${escapeHTML(product.name)}</strong>
            ${isWinner ? '<br><span class="winner-tag">Paling ekonomis</span>' : ""}
          </td>
          <td>${formatRupiah(product.price)}</td>
          <td>${product.discount}%</td>
          <td>${formatRupiah(product.finalPrice)}</td>
          <td>${product.quantity} ${unit}</td>
          <td><strong>${formatUnitPrice(product.unitPrice)}</strong></td>
          <td>${budgetStatus}</td>
        </tr>
      `;
    }).join("");

    result.innerHTML = `
      <div class="recommendation-box">
        <strong>Rekomendasi Belivio</strong>
        <p class="mb-0">${winnerMessage}</p>
      </div>

      <div class="comparison-table">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Harga Awal</th>
              <th>Diskon</th>
              <th>Harga Akhir</th>
              <th>Jumlah</th>
              <th>Harga per ${unit}</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <div class="insight-box">
        <strong>Informasi Perbandingan</strong>
        <p class="mb-1">Harga per satuan terendah: ${formatUnitPrice(lowest)}</p>
        <p class="mb-1">Harga per satuan tertinggi: ${formatUnitPrice(highest)}</p>
        <p class="mb-0">Selisih harga per satuan: ${formatUnitPrice(difference)}</p>
      </div>
    `;
  } catch (err) {
    error.textContent = err.message;
  }
}

$("#compareButton").addEventListener("click", compareProducts);

$("#resetComparison").addEventListener("click", () => {
  for (let i = 1; i <= 3; i++) {
    $(`#name${i}`).value = "";
    $(`#price${i}`).value = "";
    $(`#discount${i}`).value = "";
    $(`#quantity${i}`).value = "";
  }

  $("#budget").value = "";
  $("#unit").value = "gram";
  $("#comparisonError").textContent = "";
  $("#comparisonResult").innerHTML = "";
});


// =====================================
// 3. SPLIT BILL
// =====================================

let splitMode = "equal";

// Mengubah metode pembagian
$$(".method-button").forEach(button => {
  button.addEventListener("click", () => {
    splitMode = button.dataset.mode;

    $$(".method-button").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    $("#equalMode").hidden = splitMode !== "equal";
    $("#customMode").hidden = splitMode !== "custom";

    $("#splitError").textContent = "";
    $("#splitResult").hidden = true;
  });
});


// Membuat baris orang untuk mode bagi rata
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
    updateRemoveButtons("#equalPeopleList");
    hideSplitResult();
  });

  row.append(input, remove);
  return row;
}


// Membuat baris orang untuk mode sesuai pesanan
function createCustomPerson(name = "", amount = "") {
  const row = document.createElement("div");
  row.className = "custom-person-row";

  const nameWrapper = document.createElement("div");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "form-control custom-name";
  nameInput.placeholder = "Nama orang";
  nameInput.value = name;
  nameWrapper.appendChild(nameInput);

  const amountWrapper = document.createElement("div");
  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.className = "form-control custom-amount";
  amountInput.placeholder = "Harga pesanan (Rp)";
  amountInput.min = "0";
  amountInput.value = amount;
  amountWrapper.appendChild(amountInput);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-person";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Hapus orang");

  remove.addEventListener("click", () => {
    row.remove();
    updateRemoveButtons("#customPeopleList");
    updateCustomSubtotal();
    hideSplitResult();
  });

  nameInput.addEventListener("input", hideSplitResult);
  amountInput.addEventListener("input", () => {
    updateCustomSubtotal();
    hideSplitResult();
  });

  row.append(nameWrapper, amountWrapper, remove);
  return row;
}


// Tombol tambah orang
$("#addEqualPerson").addEventListener("click", () => {
  const list = $("#equalPeopleList");

  if (list.children.length >= 30) {
    $("#splitError").textContent = "Maksimal 30 orang.";
    return;
  }

  list.appendChild(createEqualPerson(`Orang ${list.children.length + 1}`));
  updateRemoveButtons("#equalPeopleList");
  hideSplitResult();
});

$("#addCustomPerson").addEventListener("click", () => {
  const list = $("#customPeopleList");

  if (list.children.length >= 30) {
    $("#splitError").textContent = "Maksimal 30 orang.";
    return;
  }

  list.appendChild(createCustomPerson(`Orang ${list.children.length + 1}`));
  updateRemoveButtons("#customPeopleList");
  updateCustomSubtotal();
  hideSplitResult();
});


// Mengatur tombol hapus agar minimal ada 2 orang
function updateRemoveButtons(selector) {
  const rows = $$(selector + " > div");

  rows.forEach(row => {
    const button = row.querySelector(".remove-person");
    button.disabled = rows.length <= 2;
  });
}


// Menghitung total pesanan mode custom
function updateCustomSubtotal() {
  const amounts = $$(".custom-amount");

  const total = amounts.reduce((sum, input) => {
    return sum + (input.value === "" ? 0 : Number(input.value));
  }, 0);

  $("#customSubtotal").textContent = formatRupiah(total);
}


// Menyembunyikan hasil jika input berubah
function hideSplitResult() {
  $("#splitResult").hidden = true;
  $("#splitError").textContent = "";
}

$("#equalTotal").addEventListener("input", hideSplitResult);
$("#extraFee").addEventListener("input", hideSplitResult);
$("#billName").addEventListener("input", hideSplitResult);

$("#equalPeopleList").addEventListener("input", hideSplitResult);


// Membagi nominal dengan pembulatan rupiah
// Sisa pembulatan diberikan kepada beberapa orang pertama.
function distributeAmount(total, weights) {
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);

  if (weightTotal <= 0) {
    throw new Error("Total pesanan harus lebih dari 0.");
  }

  const exactAmounts = weights.map(weight =>
    total * weight / weightTotal
  );

  const amounts = exactAmounts.map(value => Math.floor(value));
  let remainder = total - amounts.reduce((sum, value) => sum + value, 0);

  const fractions = exactAmounts
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value)
    }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    amounts[fractions[i % fractions.length].index]++;
  }

  return amounts;
}


// Mengambil data orang dari mode bagi rata
function getEqualPeople() {
  const rows = $$("#equalPeopleList .person-row");

  if (rows.length < 2) {
    throw new Error("Minimal harus ada dua orang.");
  }

  return rows.map((row, index) => {
    const name = row.querySelector(".person-name").value.trim();

    return {
      name: name || `Orang ${index + 1}`,
      subtotal: 1
    };
  });
}


// Mengambil data orang dari mode sesuai pesanan
function getCustomPeople() {
  const rows = $$("#customPeopleList .custom-person-row");

  if (rows.length < 2) {
    throw new Error("Minimal harus ada dua orang.");
  }

  return rows.map((row, index) => {
    const name = row.querySelector(".custom-name").value.trim();
    const amountText = row.querySelector(".custom-amount").value;

    if (amountText === "") {
      throw new Error(`Masukkan harga pesanan ${name || `orang ${index + 1}`}.`);
    }

    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Harga pesanan tidak boleh negatif.");
    }

    return {
      name: name || `Orang ${index + 1}`,
      subtotal: amount
    };
  });
}


// Menghitung Split Bill
function calculateSplitBill() {
  const error = $("#splitError");
  const result = $("#splitResult");

  error.textContent = "";
  result.hidden = true;

  try {
    const extraText = $("#extraFee").value;
    const extraFee = extraText === "" ? 0 : Number(extraText);

    if (!Number.isFinite(extraFee) || extraFee < 0) {
      throw new Error("Biaya tambahan tidak boleh negatif.");
    }

    let people;
    let subtotal;

    if (splitMode === "equal") {
      people = getEqualPeople();

      const totalText = $("#equalTotal").value;

      if (totalText === "") {
        throw new Error("Masukkan total tagihan terlebih dahulu.");
      }

      subtotal = Number(totalText);

      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        throw new Error("Total tagihan harus lebih dari 0.");
      }

      // Membagi total tagihan termasuk biaya tambahan secara rata.
      const grandTotal = subtotal + extraFee;
      const shares = distributeAmount(
        grandTotal,
        people.map(() => 1)
      );

      people = people.map((person, index) => ({
        ...person,
        payment: shares[index],
        orderAmount: 0
      }));

      renderSplitResult({
        people,
        subtotal,
        extraFee,
        grandTotal,
        method: "Dibagi rata"
      });

      return;
    }

    people = getCustomPeople();
    subtotal = people.reduce((sum, person) => sum + person.subtotal, 0);

    if (subtotal <= 0) {
      throw new Error("Total pesanan harus lebih dari 0.");
    }

    const grandTotal = subtotal + extraFee;

    // Biaya tambahan dibagi secara proporsional
    // berdasarkan harga pesanan setiap orang.
    const extraShares = distributeAmount(
      extraFee,
      people.map(person => person.subtotal)
    );

    people = people.map((person, index) => ({
      ...person,
      payment: person.subtotal + extraShares[index],
      orderAmount: person.subtotal,
      extraShare: extraShares[index]
    }));

    renderSplitResult({
      people,
      subtotal,
      extraFee,
      grandTotal,
      method: "Sesuai pesanan"
    });

  } catch (err) {
    error.textContent = err.message;
  }
}


// Menampilkan hasil
function renderSplitResult(data) {
  const {
    people,
    subtotal,
    extraFee,
    grandTotal,
    method
  } = data;

  $("#resultBillName").textContent =
    $("#billName").value.trim() || "Rincian Tagihan";

  $("#resultGrandTotal").textContent = formatRupiah(grandTotal);
  $("#resultMethod").textContent = `Metode: ${method}`;
  $("#resultSubtotal").textContent = formatRupiah(subtotal);
  $("#resultExtra").textContent = formatRupiah(extraFee);
  $("#resultPeople").textContent = `${people.length} orang`;
  $("#resultCheckTotal").textContent = formatRupiah(
    people.reduce((sum, person) => sum + person.payment, 0)
  );

  const breakdown = people.map(person => {
    let detail = "";

    if (method === "Sesuai pesanan") {
      detail = `
        <small>
          Pesanan: ${formatRupiah(person.orderAmount)}
          · Biaya tambahan: ${formatRupiah(person.extraShare)}
        </small>
      `;
    } else {
      detail = `<small>Bagian dari total tagihan</small>`;
    }

    return `
      <div class="split-person-result">
        <div>
          <span>${escapeHTML(person.name)}</span>
          ${detail}
        </div>
        <strong>${formatRupiah(person.payment)}</strong>
      </div>
    `;
  }).join("");

  $("#splitBreakdown").innerHTML = breakdown;
  $("#splitResult").hidden = false;
}


// Tombol hitung
$("#calculateSplit").addEventListener("click", calculateSplitBill);


// Reset Split Bill
$("#resetSplit").addEventListener("click", () => {
  $("#billName").value = "";
  $("#extraFee").value = "0";
  $("#equalTotal").value = "";

  $("#equalPeopleList").innerHTML = "";
  $("#equalPeopleList").append(
    createEqualPerson("Orang 1"),
    createEqualPerson("Orang 2")
  );

  $("#customPeopleList").innerHTML = "";
  $("#customPeopleList").append(
    createCustomPerson("Orang 1"),
    createCustomPerson("Orang 2")
  );

  $("#splitError").textContent = "";
  $("#splitResult").hidden = true;

  updateRemoveButtons("#equalPeopleList");
  updateRemoveButtons("#customPeopleList");
  updateCustomSubtotal();

  splitMode = "equal";

  $$(".method-button").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === "equal");
  });

  $("#equalMode").hidden = false;
  $("#customMode").hidden = true;
});


// Inisialisasi tampilan awal
updateRemoveButtons("#equalPeopleList");
updateRemoveButtons("#customPeopleList");
updateCustomSubtotal();
