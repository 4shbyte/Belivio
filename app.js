
const $ = (selector) => document.querySelector(selector);

const calculateBtn = $("#calculateBtn");
const resetBtn = $("#resetBtn");
const resultSection = $("#resultSection");
const errorMessage = $("#errorMessage");

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
};

const formatNumber = (number) => {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2
  }).format(number);
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

// MENGAMBIL DATA PRODUK
function getProducts() {
  const products = [];

  for (let i = 1; i <= 3; i++) {
    const name = $(`#name${i}`).value.trim();
    const priceValue = $(`#price${i}`).value.trim();
    const discountValue = $(`#discount${i}`).value.trim();
    const quantityValue = $(`#quantity${i}`).value.trim();

    const hasInput = name || priceValue || quantityValue;

    // Produk C boleh dikosongkan seluruhnya
    if (i === 3 && !hasInput) continue;

    if (!name || priceValue === "" || quantityValue === "") {
      throw new Error(`Lengkapi nama, harga, dan jumlah isi Produk ${String.fromCharCode(64 + i)}.`);
    }

    const price = Number(priceValue);
    const discount = discountValue === "" ? 0 : Number(discountValue);
    const quantity = Number(quantityValue);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Harga Produk ${String.fromCharCode(64 + i)} harus lebih dari 0.`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Jumlah isi Produk ${String.fromCharCode(64 + i)} harus lebih dari 0.`);
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      throw new Error(`Diskon Produk ${String.fromCharCode(64 + i)} harus antara 0 sampai 100%.`);
    }

    const discountAmount = price * discount / 100;
    const finalPrice = price - discountAmount;
    const unitPrice = finalPrice / quantity;

    products.push({
      name,
      price,
      discount,
      quantity,
      discountAmount,
      finalPrice,
      unitPrice
    });
  }

  if (products.length < 2) {
    throw new Error("Masukkan minimal dua produk untuk dibandingkan.");
  }

  return products;
}

// PROSES PERHITUNGAN
function compareProducts() {
  try {
    errorMessage.style.display = "none";

    const products = getProducts();
    const unit = $("#unit").value;
    const budgetValue = $("#budget").value.trim();

    let budget = null;

    if (budgetValue !== "") {
      budget = Number(budgetValue);

      if (!Number.isFinite(budget) || budget < 0) {
        throw new Error("Budget tidak boleh bernilai negatif.");
      }
    }

    // Urutkan produk berdasarkan harga per satuan
    const sortedProducts = [...products].sort(
      (a, b) => a.unitPrice - b.unitPrice
    );

    const winner = sortedProducts[0];
    const highest = sortedProducts[sortedProducts.length - 1];

    const unitDifference = highest.unitPrice - winner.unitPrice;

    const totalDiscount = products.reduce(
      (total, product) => total + product.discountAmount, 0
    );

    const totalSpending = products.reduce(
      (total, product) => total + product.finalPrice, 0
    );

    displayRecommendation(winner, unit, unitDifference);
    displaySummary(winner, totalDiscount, budget, unit);
    displayTable(products, winner, budget, unit);
    displayInsight(winner, highest, unitDifference, budget, unit);

    resultSection.classList.remove("d-none");

    // Notifikasi
    const toastElement = $("#successToast");
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();

    // Tampilkan hasil
    setTimeout(() => {
      resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.style.display = "block";
    resultSection.classList.add("d-none");
  }
}

// REKOMENDASI PRODUK
function displayRecommendation(winner, unit, difference) {
  $("#recommendation").innerHTML = `
    <div class="winner-icon">
      <i class="bi bi-trophy-fill"></i>
    </div>

    <div class="winner-info">
      <small>REKOMENDASI PALING HEMAT</small>
      <h3>${escapeHTML(winner.name)}</h3>
      <p>
        Harga per ${escapeHTML(unit)}:
        <strong>${formatRupiah(winner.unitPrice)}</strong>
        ${difference === 0 ? "• Harga per satuan setara dengan pilihan lainnya." : ""}
      </p>
    </div>
  `;
}

// RINGKASAN
function displaySummary(winner, totalDiscount, budget, unit) {
  let budgetText = "Tidak diatur";

  if (budget !== null) {
    budgetText = winner.finalPrice <= budget
      ? "Sesuai budget"
      : "Melebihi budget";
  }

  const budgetColor = budget !== null && winner.finalPrice > budget
    ? "#d97736"
    : "#169b69";

  $("#summaryCards").innerHTML = `
    <div class="col-md-4">
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-tags"></i>
        </div>
        <small>Harga paling hemat / ${escapeHTML(unit)}</small>
        <strong>${formatRupiah(winner.unitPrice)}</strong>
      </div>
    </div>

    <div class="col-md-4">
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-percent"></i>
        </div>
        <small>Total potongan dari semua produk</small>
        <strong>${formatRupiah(totalDiscount)}</strong>
      </div>
    </div>

    <div class="col-md-4">
      <div class="summary-card">
        <div class="summary-icon">
          <i class="bi bi-wallet2"></i>
        </div>
        <small>Status budget Produk termurah</small>
        <strong style="color:${budgetColor}">${budgetText}</strong>
      </div>
    </div>
  `;
}

// TABEL PERBANDINGAN
function displayTable(products, winner, budget, unit) {
  const tbody = $("#comparisonBody");

  tbody.innerHTML = products.map((product) => {
    const isWinner = product === winner;

    let budgetStatus = `
      <span class="table-badge">Tidak diatur</span>
    `;

    if (budget !== null) {
      budgetStatus = product.finalPrice <= budget
        ? `<span class="table-badge">Sesuai budget</span>`
        : `<span class="table-badge budget-warning">Melebihi budget</span>`;
    }

    return `
      <tr class="${isWinner ? "product-winner" : ""}">
        <td>
          <strong>${escapeHTML(product.name)}</strong>
          ${isWinner ? '<br><span class="table-badge mt-1">Paling hemat / satuan</span>' : ""}
        </td>

        <td>${formatRupiah(product.price)}</td>
        <td>${formatNumber(product.discount)}%</td>
        <td><strong>${formatRupiah(product.finalPrice)}</strong></td>
        <td>${formatRupiah(product.unitPrice)} / ${escapeHTML(unit)}</td>
        <td>${budgetStatus}</td>
      </tr>
    `;
  }).join("");
}

// PENJELASAN HASIL
function displayInsight(winner, highest, difference, budget, unit) {
  let message = "";

  if (difference === 0) {
    message = `Semua produk memiliki harga per ${unit} yang sama. Kamu bisa memilih berdasarkan merek, kualitas, ukuran kemasan, atau kebutuhan.`;
  } else {
    message = `${winner.name} memiliki harga per ${unit} paling rendah dibandingkan pilihan lainnya. Selisihnya mencapai ${formatRupiah(difference)} per ${unit} dibandingkan ${highest.name}.`;
  }

  if (budget !== null) {
    if (winner.finalPrice <= budget) {
      message += ` Harga akhir ${winner.name} sebesar ${formatRupiah(winner.finalPrice)} masih berada dalam budget ${formatRupiah(budget)}.`;
    } else {
      message += ` Namun, harga akhir ${winner.name} sebesar ${formatRupiah(winner.finalPrice)} masih melebihi budget ${formatRupiah(budget)}.`;
    }
  }

  $("#insightText").textContent = message;
}

// RESET
function resetCalculator() {
  for (let i = 1; i <= 3; i++) {
    $(`#name${i}`).value = "";
    $(`#price${i}`).value = "";
    $(`#discount${i}`).value = "0";
    $(`#quantity${i}`).value = "";
  }

  $("#unit").value = "gram";
  $("#budget").value = "";

  errorMessage.style.display = "none";
  resultSection.classList.add("d-none");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// EVENT LISTENER
calculateBtn.addEventListener("click", compareProducts);
resetBtn.addEventListener("click", resetCalculator);
