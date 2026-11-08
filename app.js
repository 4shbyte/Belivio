// =====================================
// BELIVIO - JAVASCRIPT
// =====================================

const $ = (selector) => document.querySelector(selector);

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

// Format angka desimal
function formatNumber(number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2
  }).format(number);
}

// Mengamankan teks sebelum dimasukkan ke HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[char];
  });
}


// =====================================
// 1. QUICK DISCOUNT CALCULATOR
// =====================================

function calculateDiscount() {
  const price = Number($("#discountPrice").value);
  const discount = Number($("#discountPercent").value);

  const error = $("#discountError");
  const result = $("#discountResult");

  error.textContent = "";

  // Validasi harga
  if (
    $("#discountPrice").value.trim() === "" ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    error.textContent = "Masukkan harga asli yang lebih dari 0.";
    return;
  }

  // Validasi diskon
  if (
    $("#discountPercent").value.trim() === "" ||
    !Number.isFinite(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    error.textContent = "Masukkan diskon antara 0 sampai 100%.";
    return;
  }

  // Perhitungan
  const discountAmount = price * discount / 100;
  const finalPrice = price - discountAmount;

  // Menampilkan hasil
  result.innerHTML = `
    <div class="discount-output">

      <span class="result-caption">
        HARGA SETELAH DISKON
      </span>

      <div class="final-price">
        ${formatRupiah(finalPrice)}
      </div>

      <div class="result-detail">
        <span>Harga asli</span>
        <strong>${formatRupiah(price)}</strong>
      </div>

      <div class="result-detail">
        <span>Persentase diskon</span>
        <strong>${formatNumber(discount)}%</strong>
      </div>

      <div class="result-detail">
        <span>Potongan harga</span>
        <strong class="saving-text">
          - ${formatRupiah(discountAmount)}
        </strong>
      </div>

      <div class="result-detail">
        <span>Harga akhir</span>
        <strong>${formatRupiah(finalPrice)}</strong>
      </div>

      <div class="result-note">
        Kamu menghemat sebesar
        <strong>${formatRupiah(discountAmount)}</strong>
        dari harga awal produk.
      </div>

    </div>
  `;
}


// Tombol hitung diskon
$("#calculateDiscount").addEventListener("click", calculateDiscount);


// Reset kalkulator diskon
$("#resetDiscount").addEventListener("click", () => {
  $("#discountPrice").value = "";
  $("#discountPercent").value = "";
  $("#discountError").textContent = "";

  $("#discountResult").innerHTML = `
    <div class="result-placeholder">
      <div class="placeholder-icon">%</div>
      <h5>Hasil Perhitungan</h5>
      <p>
        Masukkan harga dan diskon untuk melihat
        hasil perhitungan di sini.
      </p>
    </div>
  `;
});


// =====================================
// 2. PRODUCT COMPARISON
// =====================================

function getProducts() {
  const products = [];

  for (let i = 1; i <= 3; i++) {
    const name = $(`#name${i}`).value.trim();
    const priceValue = $(`#price${i}`).value.trim();
    const quantityValue = $(`#quantity${i}`).value.trim();
    const discountValue = $(`#discount${i}`).value.trim();

    // Produk C boleh kosong.
    // Diskon default 0 tidak dianggap sebagai input produk.
    const hasRequiredInput = name || priceValue || quantityValue;

    if (i === 3 && !hasRequiredInput) {
      continue;
    }

    // Produk A dan B wajib diisi
    if (!name || !priceValue || !quantityValue) {
      throw new Error(
        `Lengkapi nama, harga, dan jumlah isi Produk ${String.fromCharCode(64 + i)}.`
      );
    }

    const price = Number(priceValue);
    const quantity = Number(quantityValue);

    // Jika diskon kosong, dianggap 0%
    const discount = discountValue === ""
      ? 0
      : Number(discountValue);

    // Validasi harga
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(
        `Harga Produk ${String.fromCharCode(64 + i)} harus lebih dari 0.`
      );
    }

    // Validasi jumlah
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
        `Jumlah isi Produk ${String.fromCharCode(64 + i)} harus lebih dari 0.`
      );
    }

    // Validasi diskon
    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      throw new Error(
        `Diskon Produk ${String.fromCharCode(64 + i)} harus antara 0 sampai 100%.`
      );
    }

    // Menghitung harga akhir
    const discountAmount = price * discount / 100;
    const finalPrice = price - discountAmount;

    // Menghitung harga per satuan
    const unitPrice = finalPrice / quantity;

    products.push({
      name,
      price,
      discount,
      discountAmount,
      finalPrice,
      quantity,
      unitPrice
    });
  }

  return products;
}


// =====================================
// 3. COMPARISON PROCESS
// =====================================

function compareProducts() {
  const error = $("#comparisonError");
  const result = $("#comparisonResult");

  error.textContent = "";
  result.innerHTML = "";

  try {
    const products = getProducts();

    const budgetValue = $("#budget").value.trim();
    const budget = budgetValue === ""
      ? null
      : Number(budgetValue);

    // Validasi jumlah produk
    if (products.length < 2) {
      throw new Error("Masukkan minimal 2 produk untuk dibandingkan.");
    }

    // Validasi anggaran
    if (
      budget !== null &&
      (!Number.isFinite(budget) || budget <= 0)
    ) {
      throw new Error("Anggaran harus lebih dari 0.");
    }

    const unit = $("#unit").value;

    // Urutkan berdasarkan harga per satuan
    const sortedProducts = [...products].sort(
      (a, b) => a.unitPrice - b.unitPrice
    );

    // Produk dengan harga per satuan terendah
    const lowestPrice = sortedProducts[0].unitPrice;

    // Mengambil produk yang memiliki harga satuan sama
    const winners = sortedProducts.filter(product =>
      Math.abs(product.unitPrice - lowestPrice) < 0.0000001
    );

    // Jika ada anggaran, tampilkan status setiap produk
    const withinBudget = budget === null
      ? []
      : products.filter(product => product.finalPrice <= budget);

    displayRecommendation(
      winners,
      sortedProducts,
      budget,
      withinBudget,
      unit
    );

    displayComparisonTable(
      sortedProducts,
      winners,
      budget,
      unit
    );

    displayInsight(
      products,
      winners,
      budget,
      withinBudget,
      unit
    );

  } catch (err) {
    error.textContent = err.message;
  }
}


// =====================================
// 4. RECOMMENDATION
// =====================================

function displayRecommendation(
  winners,
  products,
  budget,
  withinBudget,
  unit
) {
  const result = $("#comparisonResult");

  const winnerNames = winners
    .map(product => escapeHTML(product.name))
    .join(", ");

  const winnerPrice = formatNumber(winners[0].unitPrice);

  let recommendationText = "";

  if (winners.length > 1) {
    recommendationText =
      `${winnerNames} memiliki harga per satuan terendah yang sama, yaitu ${formatRupiah(winners[0].unitPrice)} per ${unit}.`;
  } else {
    recommendationText =
      `${winnerNames} memiliki harga per satuan paling rendah, yaitu ${formatRupiah(winners[0].unitPrice)} per ${unit}.`;
  }

  // Informasi anggaran
  if (budget !== null) {
    if (withinBudget.length === 0) {
      recommendationText +=
        " Namun, tidak ada produk yang sesuai dengan anggaranmu.";
    } else {
      const affordableWinners = winners.filter(
        product => product.finalPrice <= budget
      );

      if (affordableWinners.length > 0) {
        recommendationText +=
          ` Produk dengan harga satuan terbaik tersebut juga sesuai dengan anggaran ${formatRupiah(budget)}.`;
      } else {
        recommendationText +=
          ` Ada ${withinBudget.length} produk yang masih sesuai dengan anggaran, tetapi bukan pilihan dengan harga satuan terendah.`;
      }
    }
  }

  result.innerHTML = `
    <h4 class="result-section-title">
      Hasil Perbandingan
    </h4>

    <div class="recommendation-card">
      <span class="recommendation-label">
        HASIL ANALISIS BELIVIO
      </span>

      <h4>
        ${winners.length > 1
          ? "Beberapa Produk Memiliki Nilai Terbaik"
          : "Produk dengan Nilai Terbaik"
        }
      </h4>

      <p>${recommendationText}</p>
    </div>
  `;
}


// =====================================
// 5. COMPARISON TABLE
// =====================================

function displayComparisonTable(
  products,
  winners,
  budget,
  unit
) {
  const result = $("#comparisonResult");

  const rows = products.map(product => {
    const isWinner = winners.includes(product);

    let budgetStatus = "-";

    if (budget !== null) {
      budgetStatus = product.finalPrice <= budget
        ? `<span class="budget-ok">Sesuai</span>`
        : `<span class="budget-over">Melebihi</span>`;
    }

    return `
      <tr class="${isWinner ? "winner-row" : ""}">

        <td>
          <strong>${escapeHTML(product.name)}</strong>

          ${isWinner
            ? `<br><span class="winner-tag">Nilai terbaik</span>`
            : ""
          }
        </td>

        <td>${formatRupiah(product.price)}</td>

        <td>${formatNumber(product.discount)}%</td>

        <td>${formatRupiah(product.finalPrice)}</td>

        <td>${formatNumber(product.quantity)} ${unit}</td>

        <td>
          <strong>${formatRupiah(product.unitPrice)}</strong>
        </td>

        <td>${budgetStatus}</td>

      </tr>
    `;
  }).join("");

  result.innerHTML += `
    <h5 class="result-section-title mt-4">
      Detail Perbandingan Produk
    </h5>

    <div class="result-table-wrapper">

      <table class="result-table">

        <thead>
          <tr>
            <th>Produk</th>
            <th>Harga Awal</th>
            <th>Diskon</th>
            <th>Harga Akhir</th>
            <th>Jumlah Isi</th>
            <th>Harga / Satuan</th>
            <th>Status Anggaran</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>

    </div>
  `;
}


// =====================================
// 6. INSIGHT / ANALYSIS
// =====================================

function displayInsight(
  products,
  winners,
  budget,
  withinBudget,
  unit
) {
  const result = $("#comparisonResult");

  const lowest = Math.min(
    ...products.map(product => product.unitPrice)
  );

  const highest = Math.max(
    ...products.map(product => product.unitPrice)
  );

  const difference = highest - lowest;

  const mostExpensive = products.find(
    product => product.unitPrice === highest
  );

  let insight = `
    Berdasarkan perhitungan, harga per ${unit}
    paling rendah adalah ${formatRupiah(lowest)}.
    Sementara itu, selisih antara harga per satuan
    tertinggi dan terendah adalah ${formatRupiah(difference)}.
  `;

  if (mostExpensive && difference > 0.0000001) {
    insight += `
      Produk ${escapeHTML(mostExpensive.name)}
      memiliki harga per satuan paling tinggi.
    `;
  } else {
    insight += `
      Semua produk memiliki harga per satuan yang sama.
    `;
  }

  if (budget !== null) {
    insight += `
      Dari ${products.length} produk yang dibandingkan,
      ${withinBudget.length} produk sesuai dengan anggaran
      ${formatRupiah(budget)}.
    `;
  }

  result.innerHTML += `
    <div class="insight-card">

      <h6>Insight Perbandingan</h6>

      <p>${insight}</p>

    </div>

    <p class="result-note-small">
      Catatan: Rekomendasi didasarkan pada harga akhir
      per satuan. Produk dengan harga per satuan terendah
      belum tentu memiliki harga pembelian total terendah.
      Pastikan satuan produk yang dibandingkan sama.
    </p>
  `;
}


// =====================================
// 7. RESET COMPARISON
// =====================================

function resetComparison() {
  for (let i = 1; i <= 3; i++) {
    $(`#name${i}`).value = "";
    $(`#price${i}`).value = "";
    $(`#discount${i}`).value = "0";
    $(`#quantity${i}`).value = "";
  }

  $("#unit").value = "gram";
  $("#budget").value = "";

  $("#comparisonError").textContent = "";
  $("#comparisonResult").innerHTML = "";
}


// =====================================
// 8. EVENT LISTENERS
// =====================================

$("#compareButton").addEventListener(
  "click",
  compareProducts
);

$("#resetComparison").addEventListener(
  "click",
  resetComparison
);
