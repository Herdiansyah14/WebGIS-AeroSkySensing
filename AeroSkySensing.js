// #################################### SCRIPT WEBGIS PEMANTAU KUALITAS UDARA ############################################
// ############################# KAWASAN AGLOMERASI JAKARTA TAHUN 2022 ######################################

// ############################# PENGATURAN TAMPILAN SETIAP HALAMAN ######################################################
// ############################# ATUR TAMPILAN BASEMAP UTAMA ############################################################

  ui.root.clear(0, Map);
  var uiMap = ui.Map();
  ui.root.widgets().add(uiMap);
  function mapSetUp() {
    uiMap.setOptions("HYBRID");
    uiMap.setCenter(120.20537067522494, -2.268410004950352, 4);
    uiMap.style().set("cursor", "crosshair");
    uiMap.drawingTools().set("shown", false);
  }
  mapSetUp();
  

// ############################# PEMBUATAN PANEL - PANEL YANG DIGUNAKAN ###################################################################

// Membuat Grafik Statistik Panel
  var grafikPanel = ui.Panel({
    style: {
      width: "23rem",
      position: "top-center",
    },
  });

// Membuat URL Unduh Panel
  var urlPanel = ui.Panel({
    style: {
      position: "bottom-left",
      padding: "8px 5px",
      width: "350px",
      height: "180px",
    },
  });

// Membuat Thumbnail Time-Seris Panel
  var thumbnailPanel = ui.Panel({
    style: {
      position: "bottom-right",
    },
  });

  var infoVisualisasiThumbnailLabel = ui.Label("Visualisasi Time-Series", {
    fontWeight: "bold",
    fontSize: "14px",
  });

// ############################# PEMBUATAN VARIABEL KOLEKSI CITRA SENTINEL 5P-TROPOMI ##############################

  function collection1() {
    var sentinelCO = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CO");
    return sentinelCO;
  }
  
  function collection2() {
    var sentinelNO2 = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2");
    return sentinelNO2;
  }
  
  function collection3() {
    var sentinelSO2 = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2");
    return sentinelSO2;
  }
  
  function collection4() {
    var sentinelOzon = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_O3");
    return sentinelOzon;
  }

// ############################# PENGATURAN PEMILIHAN CITRA ################################################

// Mengatur Fungsi untuk Pemilihan Citra Sesuai Parameter Terpilih (Jenis Polutan dan Rentang Waktu Perekaman)
var handleCitra = function (formatAwalTanggal, formatAkhirTanggal) {
  var col;
  var polutanMean;
  var faktorKonversi;

  // Melakukan Pemilihan Citra Sesuai Parameter Terpilih
  if (citraTerpilih === "Karbon Monoksida") {
    col = collection1()
      .select("CO_column_number_density")
      .filterDate(formatAwalTanggal, formatAkhirTanggal);
    faktorKonversi = (28.01 * 1e6) / 10000;
  } else if (citraTerpilih === "Nitrogen Dioksida") {
    col = collection2()
      .select("NO2_column_number_density")
      .filterDate(formatAwalTanggal, formatAkhirTanggal);
    faktorKonversi = (46.0055 * 1e6) / 10000;
  } else if (citraTerpilih === "Sulfur Dioksida") {
    col = collection3()
      .select("SO2_column_number_density")
      .filterDate(formatAwalTanggal, formatAkhirTanggal);
    faktorKonversi = (64.065 * 1e6) / 10000;
  } else if (citraTerpilih === "Ozon") {
    col = collection4()
      .select("O3_column_number_density")
      .filterDate(formatAwalTanggal, formatAkhirTanggal);
    faktorKonversi = (47.997 * 1e6) / 10000;
  } else {
    print("Invalid function selected: " + citraTerpilih);
  }

  // Melakukan Konversi Nilai Satuan Citra
  if (col && faktorKonversi) {
    polutanMean = col.map(function (citra) {
      var clipCitra = citra.clip(geometri);
      var konversiCitra = clipCitra.multiply(faktorKonversi);
      return konversiCitra.set(
        "system:time_start",
        citra.get("system:time_start")
      );
    });
  }
  
  // Melakukan Return Citra Col untuk Citra Asli dan Citra PolutanMean untuk Citra hasil Konversi
  return { col: col, polutanMean: polutanMean };
};

// ############################# VARIABEL DAN FUNGSI UNIVERSAL YANG DIGUNAKAN ###################################################################

// Membuat Variabel Pengaturan ROI
var drawingTools = Map.drawingTools();
var geometri = null;
var gambarGeometri = null;

// Mengatur Variabel Template
var drawingTools = uiMap.drawingTools();
var citraTerpilih = "Karbon Monoksida";
var startYear = ee.Date("2019-01-01");
var endYear = ee.Date("2024-03-31");

// Membuat Palet Warna untuk Visualisasi
var paletWarna = [
  "black", "blue", "purple", "cyan", "green", "yellow", "red",
];

function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: 1,
    palette: paletWarna,
  };
}

// Fungsi untuk Membuat Legenda Konsentrasi Polutan
function legendaPolutan() {
  setParamsROI();
  setParamsAset();
  setParamsAdmin();
  
  // Membuat Panel Legenda
  var legendaPolutanPanel = ui.Panel({
    style: {
      position: "bottom-left",
      padding: "8px 10px",
    },
  });
  
  // Melakukan Set Nilai Minimum dan Maksimum Citra
  var nilaiMin, nilaiMaks, jenisPolutan;
  switch (polutanTerpilihAdmin || polutanTerpilihROI || polutanTerpilihAset) {
    case "Karbon Monoksida":
      nilaiMin = 0;
      nilaiMaks = 0.05;
      jenisPolutan = "Karbon Monoksida";
      break;
    case "Nitrogen Dioksida":
      nilaiMin = 0;
      nilaiMaks = 0.0002;
      jenisPolutan = "Nitrogen Dioksida";
      break;
    case "Sulfur Dioksida":
      nilaiMin = 0;
      nilaiMaks = 0.0005;
      jenisPolutan = "Sulfur Dioksida";
      break;
    case "Ozon":
      nilaiMin = 0.112;
      nilaiMaks = 0.15;
      jenisPolutan = "Ozon";
      break;
  }

  // Menambahkan Judul Legenda
  var judulLegendaPolutan = ui.Label({
    value: "Konsentrasi Gas "+ jenisPolutan +" (mol/m²)",
    style: {
      fontWeight: "bold",
      fontSize: "14px",
      margin: "0 0 4px 0",
      padding: "0",
    },
  });
  legendaPolutanPanel.add(judulLegendaPolutan);

  // Mengatur Variabel Visualisasi Legenda
  var warnaLegenda = {
    min: nilaiMin,
    max: nilaiMaks,
    palette: paletWarna,
  };

  // Membuat Gambar Legenda untuk pengaturan nilai Minimal dan Maksimal pada label legenda
  var lon = ee.Image.pixelLonLat().select(0);
  var gradasi = lon
    .multiply((warnaLegenda.max - warnaLegenda.min) / 100.0)
    .add(warnaLegenda.min);
  var gambarLegenda = gradasi.visualize(warnaLegenda);
  
  // Membuat bar warna pada legenda
  var legendaThumbnail = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(paletWarna),
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
  });
  legendaPolutanPanel.add(legendaThumbnail);
  
  // membuat tulisan pada legenda dengan tiga angka
  var legendaLabels = ui.Panel({
    widgets: [
      ui.Label(warnaLegenda['min'], {margin: '4px 8px'}),
      ui.Label(
          (warnaLegenda['max'] / 2),
          {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(warnaLegenda['max'], {margin: '4px 8px'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  legendaPolutanPanel.add(legendaLabels);

  // Menambahkan Panel Polutan Legenda ke dalam Peta
  uiMap.add(legendaPolutanPanel);
}

// Fungsi untuk membuat Legenda Kualitas Udara
function legendaKualitasUdara() {
  // Membuat Panel dan Label yang digunakan untuk memuat Legenda
  var legendaKualitasUdaraPanel = ui.Panel({
    style: {
      position: "bottom-left",
      padding: "8px 10px",
    },
  });
  var judulLegendaKualitasUdara = ui.Label({
    value: "Kualitas Udara",
    style: {
      fontWeight: "bold",
      fontSize: "14px",
      margin: "0 0 4px 0",
      padding: "0",
    },
  });
  legendaKualitasUdaraPanel.add(judulLegendaKualitasUdara);
  // Membuat Kolom yang digunakan untuk menampung Warna Kualitas Udara dan Deskripsi Legenda
  var legendaKolomKualitasUdara = function (color, range) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: "#" + color,
        padding: "8px",
        margin: "0 6px 0 0",
      },
    });
    var description = ui.Label({
      value: range,
      style: {
        margin: "0 0 4px 6px",
      },
    });
    return ui.Panel({
      widgets: [
        ui.Panel({
          widgets: [colorBox],
          layout: ui.Panel.Layout.Flow("horizontal"),
        }),
        ui.Panel({
          widgets: [description],
          layout: ui.Panel.Layout.Flow("horizontal"),
        }),
      ],
      layout: ui.Panel.Layout.Flow("horizontal"),
    });
  };
  
  // Menentukan Warna Legenda Kualitas Udara
  var legendaWarnaKualitasUdara = [
    "006400",
    "0000FF",
    "FFFF00",
    "FF0000",
    "000000",
  ];
  
  // Menentukan Label Legenda Kualitas Udara dan Penambahan Legenda ke dalam Peta
  var infoLegendaKualitasUdara = [
    "Sangat Baik",
    "Baik",
    "Sedang",
    "Tidak Sehat",
    "Sangat Tidak Sehat",
  ];
  for (var i = 0; i < 5; i++) {
    legendaKualitasUdaraPanel.add(
      legendaKolomKualitasUdara(
        legendaWarnaKualitasUdara[i],
        infoLegendaKualitasUdara[i]
      )
    );
  }
  uiMap.add(legendaKualitasUdaraPanel);
}

// ############################# PENGATURAN TAMPILAN UI HALAMAN ROI #############################################

// Membuat Widgets Label, DateSlider, Select, dan Button untuk tampilan UI beserta dengan fungsinya
var judulROILabel = ui.Label("AeroSkySensing", {
  fontWeight: "bold",
  fontSize: "2rem",
  textAlign: "center",
});

var infoROILabel = ui.Label(
  "WebGIS Pemantau Kualitas Udara secara spasial memanfaatkan teknologi penginderaan jauh (Sentinel 5P-TROPOMI) dan berbasis komputasi awan.",
  {
    fontSize: "0.9rem",
    textAlign: "justify",
  }
);

var garisROISeparator1 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisROISeparator2 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisROISeparator3 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisROISeparator4 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisROISeparator5 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var petunjukROIButton = ui.Button({
  label: "Petunjuk Penggunaan WebGIS AeroSkySensing",
  style: { stretch: "horizontal", color: "black" },
});
var petunjukROIPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

petunjukROIButton.onClick(function () {
  if (petunjukROIPanel.style().get("shown")) {
    petunjukROIButton.setLabel("Petunjuk Penggunaan WebGIS AeroSkySensing");
    petunjukROIPanel.style().set("shown", false);
  } else {
    petunjukROIButton.setLabel("Sembunyikan Informasi");
    petunjukROIPanel.style().set("shown", true);
  }
});

var petunjukROILabel = ui.Panel([
  ui.Label("Petunjuk Penggunaan WebGIS AeroSkySensing:", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "15px 0 0 15px",
  }),
  ui.Label(
    "[Klik Disini] Buku Petunjuk Penggunaan WebGIS AeroSkySensing",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" },
    "https://drive.google.com/file/d/1cxjM0a59yc2PiwQnkKEV-MfnUTipsXK_/view?usp=sharing"
  ),
  ui.Label(
    "1. Untuk mengetahui kondisi kualitas udara menggunakan WebGIS ini terdapat beberapa parameter yang harus diisi, seperti Rentang Waktu, Jenis Gas Polutan dan Wilayah Kajian.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "2. Pada parameter Rentang Waktu, dapat diisi dengan memilih waktu awal perekaman dan akhir perekaman melalui DateSlider pada bagian 'Pilih Rentang Waktu Perekaman'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "3. Pada parameter Jenis Gas Polutan, dapat diisi dengan memilih jenis gas polutan yang terdiri dari Karbon Monoksida, Nitrogen Dioksida, Sulfur Dioksida dan Ozon pada bagian 'Pilih Jenis Gas Polutan'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "4. Pada parameter Wilayah Kajian, dapat diisi dengan menambahkan geometri yang disesuaikan dengan halaman yang dipilih (Region of Interest, Aset, Batas Administrasi) pada bagian 'Kelola Area Wilayah Kajian'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "5. Lakukan Analisis Konsentrasi Gas Polutan dengan Klik Tombol 'Submit dan Analisis Konsentrasi Polutan' pada bagian 'Analisis dan Visualisasi Konsentrasi Gas Polutan'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Konsentrasi Polutan'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "6. Lakukan Analisis Kualitas Udara dengan Klik Tombol 'Submit dan Analisis Kualitas Udara' pada bagian 'Analisis dan Visualisasi Kualitas Udara'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Kualitas Udara'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "7. Lakukan pengamatan dan analisis terhadap kondisi Konsentrasi Gas Polutan dan Kualitas Udara menggunakan fitur-fitur yang ada seperti ekstraksi nilai-nilai rata konsentrasi gas polutan melalui grafik yang akan muncul ketika melakukan analisis",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
]);
petunjukROIPanel.add(petunjukROILabel);

var peringatanROILabel = ui.Label(
  "[PERHATIAN] Sebelum melakukan Running, PASTIKAN Semua Parameter Terisi",
  {
    fontSize: "12px",
    textAlign: "center",
    color: "red",
  }
);

var infoParameterROILabel = ui.Label(
  "PARAMETER PEMANTAUAN KUALITAS UDARA",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
    textAlign: "center",
  }
);

var waktuROIButton = ui.Button({
  label: "RENTANG WAKTU PEREKAMAN",
  style: { stretch: "horizontal", color: "black" },
});
var waktuROIPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

waktuROIButton.onClick(function () {
  if (waktuROIPanel.style().get("shown")) {
    waktuROIButton.setLabel("RENTANG WAKTU PEREKAMAN");
    waktuROIPanel.style().set("shown", false);
  } else {
    waktuROIButton.setLabel("PILIH RENTANG WAKTU PEREKAMAN");
    waktuROIPanel.style().set("shown", true);
  }
});

var infoPemilihanTanggalROILabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan Rentang Waktu Perekaman",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/UOWG1he9fik"
);

var infoTanggalAwalROILabel = ui.Label("1. Waktu Awal Perekaman", {
  fontSize: "15px",
});

var awalTanggalROISlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: startYear,
  period: 1,
  style: { width: "300px" },
});

var infoTanggalAkhirROILabel = ui.Label("2. Waktu Akhir Perekaman ", {
  fontSize: "15px",
});

var akhirTanggalROISlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: endYear,
  period: 1,
  style: { width: "300px" },
});

waktuROIPanel.add(infoPemilihanTanggalROILabel);
waktuROIPanel.add(infoTanggalAwalROILabel);
waktuROIPanel.add(awalTanggalROISlider);
waktuROIPanel.add(infoTanggalAkhirROILabel);
waktuROIPanel.add(akhirTanggalROISlider);

var jenisROIButton = ui.Button({
  label: "JENIS GAS POLUTAN",
  style: { stretch: "horizontal", color: "black" },
});
var jenisROIPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

jenisROIButton.onClick(function () {
  if (jenisROIPanel.style().get("shown")) {
    jenisROIButton.setLabel("JENIS GAS POLUTAN");
    jenisROIPanel.style().set("shown", false);
  } else {
    jenisROIButton.setLabel("PILIH JENIS GAS POLUTAN");
    jenisROIPanel.style().set("shown", true);
  }
});

var infoJenisROILabel = ui.Label("Gas Polutan CO, NO₂, SO₂ dan O₃", {
  fontSize: "15px",
  fontWeight: "bold",
});

var parameterROIDropDown = ui.Select({
  items: ["Karbon Monoksida", "Nitrogen Dioksida", "Sulfur Dioksida", "Ozon"],
  placeholder: "Pilih Jenis Gas Polutan",
  onChange: function (selected) {
    citraTerpilih = selected;
  },
  style: { stretch: "horizontal" },
});

jenisROIPanel.add(infoJenisROILabel);
jenisROIPanel.add(parameterROIDropDown);

var areaROIButton = ui.Button({
  label: "AREA WILAYAH KAJIAN",
  style: { stretch: "horizontal", color: "black" },
});
var areaROIPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

areaROIButton.onClick(function () {
  if (areaROIPanel.style().get("shown")) {
    areaROIButton.setLabel("AREA WILAYAH KAJIAN");
    areaROIPanel.style().set("shown", false);
  } else {
    areaROIButton.setLabel("KELOLA AREA WILAYAH KAJIAN");
    areaROIPanel.style().set("shown", true);
  }
});

var infoPemilihanWilayahROILabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan/Pembuatan Area Wilayah Kajian",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/EZbCQK9gtYU"
);

var buatGeometriROIButton = ui.Button({
  label: "Buat Region of Interest",
  onClick: function () {
    buatGeometriROI();
    setGeometriROI();
  },
  style: { stretch: "horizontal" },
});

var hapusGeometriROIButton = ui.Button({
  label: "Hapus Region of Interest",
  onClick: function () {
    hapusGeometriROI();
  },
  style: { stretch: "horizontal" },
});

areaROIPanel.add(infoPemilihanWilayahROILabel);
areaROIPanel.add(buatGeometriROIButton);
areaROIPanel.add(hapusGeometriROIButton);

var judulkoordinatROILabel = ui.Label(
  "Kelola Koordinat untuk Analisis Dinamika Konsentrasi Polutan",
  {
    fontWeight: "bold",
    textAlign: "center",
  }
);

var infoKoordinatROILabel = ui.Label(
  "[Klik Disini] Video Tutorial Pengelolaan Koordinat untuk Analisis Statistik Konsentrasi Polutan (Grafik)",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/ZZhg-ZvSF1Q"
);

var infoLongitudeROILabel = ui.Label("1. Longitude", {
  fontSize: "12px",
});

var lonROITextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Longitude",
});

var infoLatitudeROILabel = ui.Label("2. Latitude", {
  fontSize: "12px",
});

var latROITextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Latitude",
});

var koordinatROIButton = ui.Button({
  label: "Kalkulasi Dinamika Konsentrasi",
  onClick: function () {
    grafikKoordinatROI();
  },
  style: { stretch: "horizontal" },
});

var komputasiROIButton = ui.Button({
  label: "KOMPUTASI DAN ANALISIS",
  style: { stretch: "horizontal", color: "black" },
});
var komputasiROIPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

komputasiROIButton.onClick(function () {
  if (komputasiROIPanel.style().get("shown")) {
    komputasiROIButton.setLabel("KOMPUTASI DAN ANALISIS");
    komputasiROIPanel.style().set("shown", false);
  } else {
    komputasiROIButton.setLabel("PILIH JENIS KOMPUTASI DAN ANALISIS");
    komputasiROIPanel.style().set("shown", true);
  }
});

var infoSubmitROILabel = ui.Label(
  "Komputasi dan Visualisasi Spasial",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
  }
);

var infoKlasifikasiROILabel = ui.Label(
  "[Klik Disini] Informasi Klasifikasi Kualitas Udara",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://drive.google.com/file/d/1aC6rH7uoVfM9oJCcroJ3zm24942G83fY/view?usp=sharing"
);

var komputasiROIDropDown = ui.Select({
  items: ["Konsentrasi Polutan", "Kualitas Udara"],
  placeholder: "Pilih Jenis Komputasi",
  onChange: function (selected) {},
  style: { stretch: "horizontal" },
});

var submitROIButton = ui.Button({
  label: "Submit dan Analisis",
  onClick: function () {
    setParamsROI();
    if (komputasiTerpilihROI === "Konsentrasi Polutan") {
        // Memotong Citra Menggunakan Geometri yang telah dibuat
      var geom = drawingTools.layers().get(0).toGeometry();
      if (geom) {
        geometri = geom;
        clipCitraROI();
      }
      uiMap.clear();
      uiMap.drawingTools().set("shown", true);
      grafikPanel.clear();
      ui.root.remove(grafikPanel);

      // Menampilkan Grafik Konsentrasi dan beberapa Widgets lainnya pada Grafik Panel
      var grafikKonsentrasiCitraROI = visualisasiGrafikCitraROI();
      var grafikKonsentrasiCitraKonversiROI = visualisasiGrafikCitraKonversiROI();
      grafikPanel.add(grafikKonsentrasiCitraROI);
      grafikPanel.add(grafikKonsentrasiCitraKonversiROI);
      grafikPanel.add(judulkoordinatROILabel);
      grafikPanel.add(infoKoordinatROILabel);
      grafikPanel.add(infoLongitudeROILabel);
      grafikPanel.add(lonROITextBox);
      grafikPanel.add(infoLatitudeROILabel);
      grafikPanel.add(latROITextBox);
      grafikPanel.add(koordinatROIButton);

      // Callback Onclick pada Peta untuk mengambil Koordinat dan Ekstraksi Kalkukasi Dinamika Konsentrasi
      uiMap.onClick(function (coords) {
      // Mengambil Nilai Koordinat ke dalam TextBox
      lonROITextBox.setValue(coords.lon.toFixed(5));
      latROITextBox.setValue(coords.lat.toFixed(5));
      var poinKlikROI = ee.Geometry.Point(coords.lon, coords.lat);
      var titik = ui.Map.Layer(poinKlikROI, {color: '000000'}, 'Titik Lokasi/Koordinat');
      uiMap.layers().set(1, titik);

      // Memanggil Fungsi set Parameter
      setParamsROI();

      var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
      var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

      // Memilih Citra sesuai Parameter Terpilih
      var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
      var col = hasilCitra.col;
      var polutanMean = hasilCitra.polutanMean;

      // Mengatur Nama Layer sesuai Parameter Terpilih
      var namaLayer;
      if (polutanTerpilihROI === "Karbon Monoksida") {
        namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
      } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
        namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
      } else if (polutanTerpilihROI === "Sulfur Dioksida") {
        namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
      } else if (polutanTerpilihROI === "Ozon") {
        namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
      } else {
        namaLayer = "Pilih Parameter Jenis Polutan";
      }
          
      var namaLayerKonversi;
      if (polutanTerpilihROI === "Karbon Monoksida") {
        namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
      } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
        namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
      } else if (polutanTerpilihROI === "Sulfur Dioksida") {
        namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
      } else if (polutanTerpilihROI === "Ozon") {
        namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
      } else {
        namaLayerKonversi = "Pilih Parameter Jenis Polutan";
      }

      // Membuat Grafik Time-Series Konsentrasi Gas Polutan
      var grafikCitraAsliROI = ui.Chart.image
        .series({
          imageCollection: col,
          region: poinKlikROI,
          reducer: ee.Reducer.mean(),
        })
        .setChartType("LineChart")
        .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (mol/m²)"])
        .setOptions({
          title: namaLayer,
          interpolateNulls: true,
          bestEffort: true,
          maxPixels: 1e10,
          hAxis: {
            title: "Waktu",
          },
          vAxis: {
            title: "Konsentrasi Gas (mol/m²)",
          },
          lineWidth: 2,
          pointSize: 3,
        });

      // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi
      var grafikCitraKonversiROI = ui.Chart.image
        .series({
          imageCollection: polutanMean,
          region: poinKlikROI,
          reducer: ee.Reducer.mean(),
        })
        .setChartType("LineChart")
        .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (µg/m³)"])
        .setOptions({
          title: namaLayerKonversi,
          interpolateNulls: true,
          bestEffort: true,
          maxPixels: 1e10,
          hAxis: {
            title: "Waktu",
          },
          vAxis: {
            title: "Konsentrasi Gas (µg/m³)",
          },
          lineWidth: 2,
          pointSize: 3,
        });

        grafikPanel.widgets().set(0, grafikCitraAsliROI);
        grafikPanel.widgets().set(1, grafikCitraKonversiROI);
      });
      uiMap.setOptions("HYBRID");
      ui.root.remove(urlPanel);
      ui.root.insert(0, grafikPanel);
      } else if (komputasiTerpilihROI === "Kualitas Udara") {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", true);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraROI();
      } else {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", true);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraROI();
      }
  },
  style: { stretch: "horizontal" },
});

var unduhCitraROIButton = ui.Button({
  label: "Unduh Data Spasial",
  onClick: function () {
    setParamsROI();
    if (komputasiTerpilihROI === "Konsentrasi Polutan") {
        unduhCitraROI();
        ui.root.remove(grafikPanel);
      } else if (komputasiTerpilihROI === "Kualitas Udara") {
        unduhCitraKualitasUdaraROI();
        ui.root.remove(grafikPanel);
      } else {
        unduhCitraKualitasUdaraROI();
        ui.root.remove(grafikPanel);
      }
  },
  style: { stretch: "horizontal" },
});

komputasiROIPanel.add(infoSubmitROILabel);
komputasiROIPanel.add(infoKlasifikasiROILabel);
komputasiROIPanel.add(komputasiROIDropDown);
komputasiROIPanel.add(submitROIButton);
komputasiROIPanel.add(unduhCitraROIButton);

var kembaliROIButton = ui.Button({
  label: "Kembali",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(adminPanel);
    ui.root.remove(asetPanel);
    ui.root.remove(grafikPanel);
    ui.root.remove(urlPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    hapusGeometriROI();
    petaUtamaWeb();
    uiMap.setOptions("HYBRID");
    ui.root.insert(0, utamaPanel);
  },
  style: { stretch: "horizontal" },
});

// ############################# PENGATURAN FUNGSI TANGGAL DAN JENIS HALAMAN ROI ######################################

// Deklarasi Variabel Universal Parameter
var awalWaktuROI, akhirWaktuROI, polutanTerpilihROI, komputasiTerpilihROI;

// Fungsi untuk set Parameter Waktu dan Jenis Polutan
function setParamsROI() {
  // Mengambil nilai variabel waktu
  var mulaiTanggalROIValue = awalTanggalROISlider.getValue()[0];
  var akhirTanggalROIValue = akhirTanggalROISlider.getValue()[0];

  // Melakukan Konversi Unix timestamp menjadi Date object
  awalWaktuROI = ee.Date(mulaiTanggalROIValue);
  akhirWaktuROI = ee.Date(akhirTanggalROIValue);

  // Mengambil nilai variabel Jenis Polutan
  polutanTerpilihROI = parameterROIDropDown.getValue();
  // Mengambil nilai variabel Jenis Komputasi
  komputasiTerpilihROI = komputasiROIDropDown.getValue();
}

// Memanggil setTanggal untuk menentukan data Tanggal
setParamsROI();

// ############################# PENGATURAN FUNGSI GEOMETRI HALAMAN ROI ######################################

// Fungsi untuk membuat Geometri
function buatGeometriROI() {
  drawingTools.clear();
  drawingTools.setShown(true);
  drawingTools.setShape("rectangle");
  drawingTools.draw();
}

// Fungsi untuk menghapus Geometri
function hapusGeometriROI() {
  drawingTools.clear();
  drawingTools.setShown(false);
}

// Fungsi untuk melakukan set Geometri yang dibuat
function setGeometriROI() {
  var geom = drawingTools.layers().get(0).toGeometry();
  if (geom) {
    geometri = geom;
  }
}

// ############################# PENGATURAN FUNGSI CLIP CITRA HALAMAN ROI ######################################

// Fungsi untuk memotong Citra
function clipCitraROI() {
  if (gambarGeometri) {
    // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
    setParamsROI();

    // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
    var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
    var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

    // Memanggil Citra yang sudah ditangani untuk dipotong sesuai area kajian
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var col = hasilCitra.col;
    var polutanMean = hasilCitra.polutanMean;
    var bounds = uiMap.getBounds();
    var geomBounds = ee.Geometry.Rectangle(bounds);
    if (col) {
      var clippedImage = col.filterBounds(geometri);
      Map.centerObject(geometri);
    }
  }
}

// ############################# PENGATURAN FUNGSI UNDUH CITRA HALAMAN ROI ######################################

// Fungsi untuk Unduh Citra
function unduhCitraROI() {
  var geom = drawingTools.layers().get(0).toGeometry();
  if (geom) {
    geometri = geom;

    // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
    setParamsROI();
    
    // Mengubah Format Tanggal dan Pengambilan String Informasi Tanggal
    var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd").getInfo();
    var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd").getInfo();

    // Mengambil Data Citra yang akan diunduh
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var col = hasilCitra.col;
    var polutanMean = hasilCitra.polutanMean;

    // Mengatur Penamaan Data yang diunduh agar tidak Spasi
    var ubahNama = polutanTerpilihROI.replace(/ /g, "_");
    var deskripsiAsli = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + formatAwalTanggal + "_" + formatAkhirTanggal;
    var deskripsiKonversi = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + "Terkonversi" +"_" + formatAwalTanggal + "_" + formatAkhirTanggal;

    // Mengambil Data Citra dengan Nilai Mean (Rata-Rata) (Asli dan Konversi)
    var meanCitraAsli = col.mean();
    var meanCitraKonversi = polutanMean.mean();

    // Memotong Citra dengan Geometri Terpilih (Asli dan Konversi)
    var clipCitraAsli = meanCitraAsli.clip(geometri);
    var clipCitraKonversi = meanCitraKonversi.clip(geometri);

    // Mendapatkan URL dari Hasil Export Citra Asli untuk di-Unduh
    var downloadUrlCitraAsli = clipCitraAsli.getDownloadURL({
      name: deskripsiAsli,
      scale: 1000,
      region: geometri,
      maxPixels: 1e10,
      fileFormat: "GeoTIFF",
    });

    // Mendapatkan URL dari Hasil Export Citra Konversi untuk di-Unduh
    var downloadUrlCitraKonversi = clipCitraKonversi.getDownloadURL({
      name: deskripsiKonversi,
      scale: 1000,
      region: geometri,
      maxPixels: 1e10,
      fileFormat: "GeoTIFF",
    });

    // Membuat Label untuk Unduh Data melalui Link URL
    var urlLabel = ui.Label("Klik Link untuk mulai Unduh: ", {
      fontWeight: "bold",
    });
    var unduhLinkCitraAsli = ui.Label({
      value:
        "• Link Unduh Citra Sentinel 5P " + polutanTerpilihROI + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (mol/m²)",
      targetUrl: downloadUrlCitraAsli,
    });
    var unduhLinkCitraKonversi = ui.Label({
      value:
        "• Link Unduh Citra Sentinel 5P " + polutanTerpilihROI + " Terkonversi " + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (ug/m3)",
      targetUrl: downloadUrlCitraKonversi,
    });

    // Menghapus Widgets yang ada pada URL Panel
    urlPanel.clear();
    ui.root.remove(urlPanel);

    // Menampilkan Link Unduhan pada URL Panel dan Menampilkan URL Panel pada Petanya
    urlPanel.add(urlLabel);
    urlPanel.add(unduhLinkCitraAsli);
    urlPanel.add(unduhLinkCitraKonversi);
    uiMap.remove(urlPanel);
    uiMap.add(urlPanel);
  }
}

// Fungsi untuk Unduh Hasil Kualitas Udara
function unduhCitraKualitasUdaraROI() {
  // Melakukan Pengaturan Geometri
  var geom = drawingTools.layers().get(0).toGeometry();
  if (geom) {
    geometri = geom;
    clipCitraROI();
  }
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Set Parameter
  setParamsROI();

  // Mengubah Format Tanggal dan Pengambilan String Informasi Tanggal
  var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd").getInfo();
  var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd").getInfo();

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (CO)
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (NO2)
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (SO2)
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (O3)
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);

  // Melakukan Overlay Kualitas Udara (CO, NO2, SO2, O3)
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var downloadUrlCO = kelasCO.getDownloadURL({
    name: "Kualitas Polutan Karbon Monoksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var downloadUrlNO2 = kelasNO2.getDownloadURL({
    name:
      "Kualitas Polutan Nitrogen Dioksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var downloadUrlSO2 = kelasSO2.getDownloadURL({
    name:
      "Kualitas Polutan Sulfur Dioksida_" + formatAwalTanggal + " " + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var downloadUrlO3 = kelasO3.getDownloadURL({
    name: "Kualitas Polutan Ozon_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var downloadUrlKualitasUdara = kelasKualitasUdara.getDownloadURL({
    name: "Kualitas Udara_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Membuat Label untuk Unduh Data melalui Link URL
  var urlLabel = ui.Label("Klik Link untuk mulai Unduh: ", {
    fontWeight: "bold",
  });
  var unduhLinkCO = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Karbon Monoksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: downloadUrlCO,
  });
  var unduhLinkNO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Nitrogen Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: downloadUrlNO2,
  });
  var unduhLinkSO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Sulfur Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: downloadUrlSO2,
  });
  var unduhLinkO3 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Ozon" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: downloadUrlO3,
  });
  var unduhLinkKualitasUdara = ui.Label({
    value:
      "• Link Unduh Data Kualitas Udara" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: downloadUrlKualitasUdara,
  });

  // Menghapus Widgets yang ada pada URL Panel
  urlPanel.clear();
  ui.root.remove(urlPanel);

  // Menampilkan URL Label Pada URL Panel untuk di-Unduh dan Menambahkan URL Panel Petanya
  urlPanel.add(urlLabel);
  urlPanel.add(unduhLinkCO);
  urlPanel.add(unduhLinkNO2);
  urlPanel.add(unduhLinkSO2);
  urlPanel.add(unduhLinkO3);
  urlPanel.add(unduhLinkKualitasUdara);
  uiMap.remove(urlPanel);
  uiMap.add(urlPanel);
}

// ############################# PENGATURAN FUNGSI GRAFIK DAN VISUALISASI CITRA HALAMAN ROI ######################################

// Fungsi untuk Membuat Grafik Konsentrasi Gas Polutan
var visualisasiGrafikCitraROI = function () {
  var geom = drawingTools.layers().get(0).toGeometry();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
  setParamsROI();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

  // Memilih Citra sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihROI === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihROI === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihROI === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: col,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Meakukan Set Nilai Minimum dan Maksimum Citra
  var nilaiMin, nilaiMaks;
  switch (polutanTerpilihROI) {
    case "Karbon Monoksida":
      nilaiMin = 0;
      nilaiMaks = 0.05;
      break;
    case "Nitrogen Dioksida":
      nilaiMin = 0;
      nilaiMaks = 0.0002;
      break;
    case "Sulfur Dioksida":
      nilaiMin = 0.0;
      nilaiMaks = 0.0005;
      break;
    case "Ozon":
      nilaiMin = 0.112;
      nilaiMaks = 0.15;
      break;
  }

  // Melakukan Set Parameter Visualisasi Citra
  var parameterVis = {
    min: nilaiMin,
    max: nilaiMaks,
    palette: paletWarna,
  };
  
  // Pembuatan Thumbnail Time-Series untuk Visualisasi Citra secara Time-Series
  // Mengatur Fungsi DOY pada Citra untuk digabungkan
  col = col.map(function (img) {
    var doy = ee.Date(img.get("system:time_start")).getRelative("day", "year");
    return img.set("doy", doy);
  });

  // Mengatur Tanggal Citra dan Proses Penggabungannya sesuai dengan DOY
  var tanggalCitra = col.filterDate(formatAwalTanggal, formatAkhirTanggal);
  var filter = ee.Filter.equals({ leftField: "doy", rightField: "doy" });
  var gabung = ee.Join.saveAll("doy_matches");
  var gabungCol = ee.ImageCollection(gabung.apply(tanggalCitra, col, filter));

  // Melakukan Komputasi Penggabungan Citra sesuai Parameter yang ditentukan (DOY) dan melakukan Reducer
  var komputasiCitra = gabungCol.map(function (img) {
    var doyCol = ee.ImageCollection.fromImages(img.get("doy_matches"));
    return doyCol.reduce(ee.Reducer.mean());
  });

  // Membuat RGB Tampilan Visual Time-Series
  var rgbVis = komputasiCitra.map(function (img) {
    return img.visualize(parameterVis).clip(geometri);
  });

  // Parameter Visual Gif Time-Series
  var gifParams = {
    region: geom,
    dimensions: 200,
    crs: "EPSG:4326",
    framesPerSecond: 10,
  };

  // Render Thumbnail dan Tampilkan Hasilnya dalam Peta
  var thumbnailKonsentrasiROI = ui.Thumbnail(rgbVis, gifParams);
  thumbnailPanel.clear();
  thumbnailPanel.add(infoVisualisasiThumbnailLabel);
  thumbnailPanel.add(thumbnailKonsentrasiROI);
  uiMap.add(thumbnailPanel);

  // Menambahkan Citra Hasil Visualisasi Ke Peta
  uiMap.addLayer(col.mean().clip(geometri), parameterVis, namaLayer);
  
  // Mengatur Tengah Peta sesuai dengan Geometri
  uiMap.centerObject(geometri);

  legendaPolutan(col);
  return chart;
};

// Fungsi untuk Visualisasi dan Membuat Grafik Time-SeriesS
var visualisasiGrafikCitraKonversiROI = function () {
  var geom = drawingTools.layers().get(0).toGeometry();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
  setParamsROI();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihROI === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Memilih Citra sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var polutanMean = hasilCitra.polutanMean;

  // Membuat Grafik Time-Series Rata-Rata Konsentrasi Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (µg/m³)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Melakukan Return Grafik
  return chart;
};

//############################# PENGATURAN FUNGSI KALKULASI DINAMIKA KONSENTRASI HALAMAN ROI ######################################

// Fungsi Ekstraksi Nilai Konsentrasi dari Citra menggunakan Titik Koordinat
function grafikKoordinatROI() {
  var koordinatLonROI = parseFloat(lonROITextBox.getValue());
  var koordinatLatROI = parseFloat(latROITextBox.getValue());
  var poinROI = ee.Geometry.Point(koordinatLonROI, koordinatLatROI);
  // uiMap.addLayer(poinROI, {color: '000000'}, 'Titik Lokasi/Koordinat');
  var titik = ui.Map.Layer(poinROI, {color: '000000'}, 'Titik Lokasi/Koordinat');
  uiMap.layers().set(1, titik);
  
  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsROI();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

  // Memilih Citra sesuai dengan Parameter yang telah dipilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;
  var polutanMean = hasilCitra.polutanMean;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihROI === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihROI === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihROI === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }
      
  var namaLayerKonversi;
  if (polutanTerpilihROI === "Karbon Monoksida") {
    namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Nitrogen Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Sulfur Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihROI === "Ozon") {
    namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayerKonversi = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var grafikCitraAsliROI = ui.Chart.image
    .series({
      imageCollection: col,
      region: poinROI,
      reducer: ee.Reducer.mean(),
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi 
  var grafikCitraKonversiROI = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: poinROI,
      reducer: ee.Reducer.mean(),
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihROI + " (µg/m³)"])
    .setOptions({
      title: namaLayerKonversi,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Menampilkan Grafik pada Grafik Panel
  grafikPanel.widgets().set(0, grafikCitraAsliROI);
  grafikPanel.widgets().set(1, grafikCitraKonversiROI);
}

//############################# PENGATURAN FUNGSI ANALISIS KUALITAS UDARA MENGGUNAKAN CITRA ######################################

// Fungsi untuk Analisis Kualitas Udara
function prosesAnalisisKualitasUdaraROI() {
  var geom = drawingTools.layers().get(0).toGeometry();
  if (geom) {
    geometri = geom;
    clipCitraROI();
  }
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsROI();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari 
  var formatAwalTanggal = awalWaktuROI.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuROI.format("YYYY-MM-dd");

  // Memanggil Koleksi Dataset dan Konversi Satuan CO
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset dan Konversi Satuan NO2
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan SO2
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan O3
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);
  uiMap.addLayer(
    kelasCO,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi CO"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);
  uiMap.addLayer(
    kelasNO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi NO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);
  uiMap.addLayer(
    kelasSO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi SO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);
  uiMap.addLayer(
    kelasO3,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi O3"
  );

  // Melakukan Overlay Parameter Kualitas Udara (CO, NO2, SO2, O3)
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);
  uiMap.addLayer(
    kelasKualitasUdara,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi Kualitas Udara"
  );
  
  // Mengatur Tengah Peta sesuai Geometri
  uiMap.centerObject(geometri);
  
  // Memanggil Fungsi Pembuatan Legenda Kualitas Udara
  legendaKualitasUdara();
}

// ############################# TAMPILAN PANEL PADA HALAMAN ROI ######################################

// Menyusun Widgets Pada Panel Halaman ROI
var roiPanel = ui.Panel({
  widgets: [
    judulROILabel,
    infoROILabel,
    petunjukROIButton,
    petunjukROIPanel,
    peringatanROILabel,
    garisROISeparator1,
    infoParameterROILabel,
    waktuROIButton,
    waktuROIPanel,
    garisROISeparator2,
    jenisROIButton,
    jenisROIPanel,
    garisROISeparator3,
    areaROIButton,
    areaROIPanel,
    garisROISeparator4,
    komputasiROIButton,
    komputasiROIPanel,
    garisROISeparator5,
    kembaliROIButton,
  ],
  style: {
    width: "21rem",
  },
});

// Menambahkan Tampilan Widget ROI ke dalam Panelnya
ui.root.insert(1, roiPanel);

// ############################# PENYUSUNAN LANDING START PANEL ############################################

var roiButton = ui.Button({
  label: "HALAMAN REGION OF INTEREST ",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(adminPanel);
    ui.root.remove(utamaPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    uiMap.setOptions("HYBRID");
    uiMap.setCenter(118.27177692522494, -1.3020938760942338, 5);
    ui.root.insert(1, roiPanel);
  },
  style: { stretch: "horizontal" },
});

var asetButton = ui.Button({
  label: "HALAMAN ASET",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(adminPanel);
    ui.root.remove(utamaPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    uiMap.setOptions("HYBRID");
    uiMap.setCenter(118.27177692522494, -1.3020938760942338, 5);
    ui.root.insert(1, asetPanel);
  },
  style: { stretch: "horizontal" },
});

var adminButton = ui.Button({
  label: "HALAMAN BATAS ADMINISTRASI",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(asetPanel);
    ui.root.remove(utamaPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    uiMap.setOptions("HYBRID");
    uiMap.setCenter(118.27177692522494, -1.3020938760942338, 5);
    ui.root.insert(1, adminPanel);
  },
  style: { stretch: "horizontal" },
});

// Melakukan Set Parameter Visualisasi Citra pada Landing Start 
var parameterVis = {
  min: 0,
  max: 0.1,
  palette: ["black", "blue", "purple", "cyan", "green", "yellow", "red"],
};

// Mengatur Koleksi Peta dan Geometri Landing Start
var geometriUtama = ee.FeatureCollection("users/herdiansyah/Indonesia");
var petaUtama = ee
  .ImageCollection("COPERNICUS/S5P/NRTI/L3_CO")
  .select("CO_column_number_density")
  .filterDate("2019-09-01", "2019-09-30");
uiMap.addLayer(
  petaUtama.mean().clip(geometriUtama),
  parameterVis,
  "WebGIS Pemantau Kualitas Udara"
);

// Fungsi untuk Menampilkan Peta Utama pada Landing Start ketika Klik Tombol Kembali pada setiap Halaman
function petaUtamaWeb() {
  // Melakukan Set Parameter Visualisasi Citra Konversi
  var parameterVis = {
    min: 0,
    max: 0.1,
    palette: ["black", "blue", "purple", "cyan", "green", "yellow", "red"],
  };

  // Mengatur Koleksi Peta dan Geometri Landing Start
  var geometriUtama = ee.FeatureCollection("users/herdiansyah/Indonesia");
  var petaUtama = ee
    .ImageCollection("COPERNICUS/S5P/NRTI/L3_CO")
    .select("CO_column_number_density")
    .filterDate("2019-09-01", "2019-09-30");
  uiMap.addLayer(
    petaUtama.mean().clip(geometriUtama),
    parameterVis,
    "WebGIS Pemantau Kualitas Udara"
  );
  uiMap.setCenter(120.20537067522494, -2.268410004950352, 4);
}

// Membuat Widgets Label, Panel dan Button pada Halaman Utama atau Landing Start
var petunjukUtamaButton = ui.Button({
  label: "Petunjuk Penggunaan WebGIS AeroSkySensing",
  style: { stretch: "horizontal", color: "black" },
});
var petunjukUtamaPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

petunjukUtamaButton.onClick(function () {
  if (petunjukUtamaPanel.style().get("shown")) {
    petunjukUtamaButton.setLabel("Petunjuk Penggunaan WebGIS AeroSkySensing");
    petunjukUtamaPanel.style().set("shown", false);
  } else {
    petunjukUtamaButton.setLabel("Sembunyikan Informasi");
    petunjukUtamaPanel.style().set("shown", true);
  }
});

var petunjukUtamaLabel = ui.Panel([
  ui.Label("Petunjuk Penggunaan WebGIS AeroSkySensing:", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "15px 0 0 15px",
  }),
  ui.Label(
    "[Klik Disini] Video Tutorial Penggunaan WebGIS AeroSkySensing",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" },
    "https://youtu.be/t_E0bKRAT9o"
  ),
  ui.Label(
    "1.  WebGIS AeroSkySensing ini dapat diakses melalui Web Browser melalui Laptop maupun Smartphone, namun disarankan diakses menggunakan Laptop.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "2. WebGIS AeroSkySensing memiliki 3 metode penggunaan yang didasarkan pada pemilihan wilayah kajian. Metode pemilihan wilayah kajian tersebut adalah Region of Interest, Aset Geometri pada GEE dan Batas Administrasi sesuai dengan wilayah kajian pada penelitian ini yaitu Kawasan Aglomerasi Jakarta.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "3. Untuk mengetahui kondisi kualitas udara menggunakan WebGIS ini terdapat beberapa parameter yang harus diisi, seperti Rentang Waktu, Jenis Gas Polutan dan Wilayah Kajian.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "4. Pada parameter Rentang Waktu, dapat diisi dengan memilih waktu awal perekaman dan akhir perekaman melalui DateSlider pada bagian 'Pilih Rentang Waktu Perekaman'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "5. Pada parameter Jenis Gas Polutan, dapat diisi dengan memilih jenis gas polutan yang terdiri dari Karbon Monoksida, Nitrogen Dioksida, Sulfur Dioksida dan Ozon pada bagian 'Pilih Jenis Gas Polutan'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "6. Pada parameter Wilayah Kajian, dapat diisi dengan menambahkan geometri yang disesuaikan dengan halaman yang dipilih (Region of Interest, Aset, Batas Administrasi) pada bagian 'Kelola Area Wilayah Kajian'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "7. Lakukan Analisis Konsentrasi Gas Polutan dengan Klik Tombol 'Submit dan Analisis Konsentrasi Polutan' pada bagian 'Analisis dan Visualisasi Konsentrasi Gas Polutan'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Konsentrasi Polutan'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "8. Lakukan Analisis Kualitas Udara dengan Klik Tombol 'Submit dan Analisis Kualitas Udara' pada bagian 'Analisis dan Visualisasi Kualitas Udara'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Kualitas Udara'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "9. Lakukan pengamatan dan analisis terhadap kondisi Konsentrasi Gas Polutan dan Kualitas Udara menggunakan fitur-fitur yang ada seperti ekstraksi nilai rata-rata konsentrasi gas polutan melalui grafik dan visualisasi time-series yang akan muncul ketika melakukan analisis.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
]);
petunjukUtamaPanel.add(petunjukUtamaLabel);

var judulAplikasiLabel = ui.Label("AEROSKYSENSING", {
  fontWeight: "bold",
  fontFamily: "Arial, sans-serif",
  fontSize: "3rem",
  textAlign: "justify",
  margin: "2px 0 2px 150px",
});

var judulUtamaLabel = ui.Label(
  "Pemantauan Spasial Kualitas Udara melalui WebGIS dengan Teknologi Penginderaan Jauh dan Komputasi Awan",
  {
    fontWeight: "bold",
    fontSize: "1.4rem",
    textAlign: "center",
  }
);

var infoUtamaLabel = ui.Label(
  "AeroSkySensing merupakan WebGIS yang dapat digunakan untuk memantau kualitas udara secara spasial dengan memanfaatkan teknologi penginderaan jauh Citra Sentinel 5P TROPOMI dan dibangun dengan teknologi Komputasi Awan Google Earth Engine. WebGIS ini memungkinkan untuk memvisualisasikan dan memetakan konsentrasi polutan serta kualitas udara, membuat data grafik konsentrasi polutan, dan mengekspor Citra tersebut sesuai dengan Region of Interest atau batas administrasi, jenis saluran dan waktu yang diinginkan oleh pengguna. WebGIS ini dapat memonitoring beberapa polutan udara seperti Karbon Monoksida, Nitrogen Dioksida, Sulfur Dioksida, dan Ozon.",
  { textAlign: "justify" }
);

var mulaiUtamaLabel = ui.Label(
  "Mulai jelajahi WebGIS ini dengan mengklik salah satu tombol di bawah ini:",
  {
    fontSize: "12px",
    textAlign: "center",
    color: "red",
  }
);

var credit = ui.Panel([
  ui.Label("Credits:", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "15px 0 0 12px",
  }),
  ui.Label(
    "● WebGIS AeroSkySensing ini dibuat dan dikembangkan oleh Herdiansyah dari Program Studi Sarjana Terapan Sistem Informasi, Departemen Teknologi Kebumian, Sekolah Vokasi, Universitas Gadjah Mada sebagai syarat Proyek Akhir (PA).",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "●Apabila terdapat pertanyaan atau saran mengenai WebGIS AeroSkySensing ini dapat menghubungi melalui email: herdiansyah@mail.ugm.ac.id atau melalui ",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "LinkedIn [KLIK Disini]",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" },
    "https://www.linkedin.com/in/herdiansyah-herdiansyah-9a7880148"
  ),
  ui.Label(""),
  ui.Label("Program Studi Sarjana Terapan Sistem Informasi Geografis", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "2px 0 2px 180px",
    textAlign: "justify",
  }),
  ui.Label("Departemen Teknologi Kebumian", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "2px 0 2px 250px",
    textAlign: "center",
  }),
  ui.Label("Sekolah Vokasi", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "2px 0 2px 290px",
    textAlign: "center",
  }),
  ui.Label("Universitas Gadjah Mada", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "2px 0 2px 265px",
    textAlign: "center",
  }),
  ui.Label("2024", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "2px 0 2px 315px",
    textAlign: "center",
  }),
  ui.Label(""),
]);

// Menyusun Widgets pada Tampilan Halaman Utama atau Landing Start
var utamaPanel = ui.Panel({
  widgets: [
    judulAplikasiLabel,
    judulUtamaLabel,
    infoUtamaLabel,
    petunjukUtamaButton,
    petunjukUtamaPanel,
    mulaiUtamaLabel,
  ],
  style: {
    width: "50%",
  },
});

var utamaButtonPanel = ui.Panel(
  [roiButton, asetButton, adminButton],
  ui.Panel.Layout.flow("horizontal")
);

utamaButtonPanel.style().set({
  margin: "10px",
});

utamaPanel.add(utamaButtonPanel);
utamaPanel.add(credit);

// Menampilkan Panel Halaman Utama ke Peta
ui.root.remove(roiPanel);
ui.root.insert(0, utamaPanel);

// ############################# PENGATURAN TAMPILAN UI HALAMAN ASET ######################################

// Membuat Widgets Label, DateSlider, Select, TextBox dan Button untuk tampilan UI beserta dengan fungsinya
var judulAsetLabel = ui.Label("AeroSkySensing", {
  fontWeight: "bold",
  fontSize: "2rem",
  textAlign: "center",
});

var infoAsetLabel = ui.Label(
  "WebGIS Pemantau Kualitas Udara secara spasial memanfaatkan teknologi penginderaan jauh (Sentinel 5P-TROPOMI) dan berbasis komputasi awan.",
  {
    fontSize: "0.9rem",
    textAlign: "justify",
  }
);

var garisAsetSeparator1 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAsetSeparator2 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAsetSeparator3 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAsetSeparator4 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAsetSeparator5 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var petunjukAsetButton = ui.Button({
  label: "Petunjuk Penggunaan WebGIS AeroSkySensing",
  style: { stretch: "horizontal", color: "black" },
});
var petunjukAsetPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

petunjukAsetButton.onClick(function () {
  if (petunjukAsetPanel.style().get("shown")) {
    petunjukAsetButton.setLabel("Petunjuk Penggunaan WebGIS AeroSkySensing");
    petunjukAsetPanel.style().set("shown", false);
  } else {
    petunjukAsetButton.setLabel("Sembunyikan Informasi");
    petunjukAsetPanel.style().set("shown", true);
  }
});

var petunjukAsetLabel = ui.Panel([
  ui.Label("Petunjuk Penggunaan WebGIS AeroSkySensing:", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "15px 0 0 15px",
  }),
  ui.Label(
    "[Klik Disini] Buku Petunjuk Penggunaan WebGIS AeroSkySensing",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" },
    "https://drive.google.com/file/d/1cxjM0a59yc2PiwQnkKEV-MfnUTipsXK_/view?usp=sharing"
  ),
  ui.Label(
    "1. Untuk mengetahui kondisi kualitas udara menggunakan WebGIS ini terdapat beberapa parameter yang harus diisi, seperti Rentang Waktu, Jenis Gas Polutan dan Wilayah Kajian.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "2. Pada parameter Rentang Waktu, dapat diisi dengan memilih waktu awal perekaman dan akhir perekaman melalui DateSlider pada bagian 'Pilih Rentang Waktu Perekaman'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "3. Pada parameter Jenis Gas Polutan, dapat diisi dengan memilih jenis gas polutan yang terdiri dari Karbon Monoksida, Nitrogen Dioksida, Sulfur Dioksida dan Ozon pada bagian 'Pilih Jenis Gas Polutan'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "4. Pada parameter Wilayah Kajian, dapat diisi dengan menambahkan geometri yang disesuaikan dengan halaman yang dipilih (Region of Interest, Aset, Batas Administrasi) pada bagian 'Kelola Area Wilayah Kajian'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "5. Lakukan Analisis Konsentrasi Gas Polutan dengan Klik Tombol 'Submit dan Analisis Konsentrasi Polutan' pada bagian 'Analisis dan Visualisasi Konsentrasi Gas Polutan'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Konsentrasi Polutan'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "6. Lakukan Analisis Kualitas Udara dengan Klik Tombol 'Submit dan Analisis Kualitas Udara' pada bagian 'Analisis dan Visualisasi Kualitas Udara'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Kualitas Udara'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "7. Lakukan pengamatan dan analisis terhadap kondisi Konsentrasi Gas Polutan dan Kualitas Udara menggunakan fitur-fitur yang ada seperti ekstraksi nilai-nilai rata konsentrasi gas polutan melalui grafik yang akan muncul ketika melakukan analisis",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
]);
petunjukAsetPanel.add(petunjukAsetLabel);

var peringatanAsetLabel = ui.Label(
  "[PERHATIAN] Sebelum melakukan Running, PASTIKAN Semua Parameter Terisi",
  {
    fontSize: "12px",
    textAlign: "center",
    color: "red",
  }
);

var infoParameterAsetLabel = ui.Label(
  "PARAMETER PEMANTAUAN KUALITAS UDARA",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
    textAlign: "center",
  }
);

var waktuAsetButton = ui.Button({
  label: "RENTANG WAKTU PEREKAMAN",
  style: { stretch: "horizontal", color: "black" },
});
var waktuAsetPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

waktuAsetButton.onClick(function () {
  if (waktuAsetPanel.style().get("shown")) {
    waktuAsetButton.setLabel("RENTANG WAKTU PEREKAMAN");
    waktuAsetPanel.style().set("shown", false);
  } else {
    waktuAsetButton.setLabel("PILIH RENTANG WAKTU PEREKAMAN");
    waktuAsetPanel.style().set("shown", true);
  }
});

var infoPemilihanTanggalAsetLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan Rentang Waktu Perekaman",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/UOWG1he9fik"
);

var infoTanggalAwalAsetLabel = ui.Label("1. Waktu Awal Perekaman", {
  fontSize: "15px",
});

var awalTanggalAsetSlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: startYear,
  period: 1,
  style: { width: "300px" },
});

var infoTanggalAkhirAsetLabel = ui.Label("2. Waktu Akhir Perekaman ", {
  fontSize: "15px",
});

var akhirTanggalAsetSlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: endYear,
  period: 1,
  style: { width: "300px" },
});

waktuAsetPanel.add(infoPemilihanTanggalAsetLabel);
waktuAsetPanel.add(infoTanggalAwalAsetLabel);
waktuAsetPanel.add(awalTanggalAsetSlider);
waktuAsetPanel.add(infoTanggalAkhirAsetLabel);
waktuAsetPanel.add(akhirTanggalAsetSlider);

var jenisAsetButton = ui.Button({
  label: "JENIS GAS POLUTAN",
  style: { stretch: "horizontal", color: "black" },
});
var jenisAsetPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

jenisAsetButton.onClick(function () {
  if (jenisAsetPanel.style().get("shown")) {
    jenisAsetButton.setLabel("JENIS GAS POLUTAN");
    jenisAsetPanel.style().set("shown", false);
  } else {
    jenisAsetButton.setLabel("PILIH JENIS GAS POLUTAN");
    jenisAsetPanel.style().set("shown", true);
  }
});

var infoJenisAsetLabel = ui.Label("Gas Polutan CO, NO₂, SO₂ dan O₃", {
  fontSize: "15px",
  fontWeight: "bold",
});

var parameterAsetDropDown = ui.Select({
  items: ["Karbon Monoksida", "Nitrogen Dioksida", "Sulfur Dioksida", "Ozon"],
  placeholder: "Pilih Jenis Gas Polutan",
  onChange: function (selected) {
    citraTerpilih = selected;
  },
  style: { stretch: "horizontal" },
});

jenisAsetPanel.add(infoJenisAsetLabel);
jenisAsetPanel.add(parameterAsetDropDown);

var areaAsetButton = ui.Button({
  label: "AREA WILAYAH KAJIAN",
  style: { stretch: "horizontal", color: "black" },
});
var areaAsetPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

areaAsetButton.onClick(function () {
  if (areaAsetPanel.style().get("shown")) {
    areaAsetButton.setLabel("AREA WILAYAH KAJIAN");
    areaAsetPanel.style().set("shown", false);
  } else {
    areaAsetButton.setLabel("KELOLA AREA WILAYAH KAJIAN");
    areaAsetPanel.style().set("shown", true);
  }
});

var infoPemilihanWilayahAsetLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan/Pembuatan Area Wilayah Kajian",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/w06iBY_xQ-w"
);

var tipeAsetDropDown = ui.Select({
  items: ["Legacy Asset (users/)", "Cloud Asset (ee-/)"],
  placeholder: "Pilih Jenis Aset Geometri GEE",
  onChange: function (selectedAset) {
    var tipeAsetTerpilih = selectedAset;
    if (selectedAset === "Legacy Asset (users/)") {
      asetInputTextBox.setValue("users/your_username/asset_name");
    } else if (selectedAset === "Cloud Asset (ee-/)") {
      asetInputTextBox.setValue("projects/ee-your_username/assets/asset_name");
    }
  },
  style: { stretch: "horizontal" },
});

var asetInputTextBox = ui.Textbox({
  style: { width: "300px" },
  placeholder: "Input Lokasi Penyimpanan Aset",
});

areaAsetPanel.add(infoPemilihanWilayahAsetLabel);
areaAsetPanel.add(tipeAsetDropDown);
areaAsetPanel.add(asetInputTextBox);

var judulkoordinatAsetLabel = ui.Label(
  "Kelola Koordinat untuk Analisis Dinamika Konsentrasi Polutan",
  {
    fontWeight: "bold",
    textAlign: "center",
  }
);

var infoKoordinatAsetLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pengelolaan Koordinat untuk Analisis Statistik Konsentrasi Polutan (Grafik)",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/ZZhg-ZvSF1Q"
);

var infoLongitudeAsetLabel = ui.Label("1. Longitude", {
  fontSize: "12px",
});

var lonAsetTextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Longitude",
});

var infoLatitudeAsetLabel = ui.Label("2. Latitude", {
  fontSize: "12px",
});

var latAsetTextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Latitude",
});

var koordinatAsetButton = ui.Button({
  label: "Kalkulasi Dinamika Konsentrasi",
  onClick: function () {
    grafikKoordinatAset();
  },
  style: { stretch: "horizontal" },
});

var komputasiAsetButton = ui.Button({
  label: "KOMPUTASI DAN ANALISIS",
  style: { stretch: "horizontal", color: "black" },
});
var komputasiAsetPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

komputasiAsetButton.onClick(function () {
  if (komputasiAsetPanel.style().get("shown")) {
    komputasiAsetButton.setLabel("KOMPUTASI DAN ANALISIS");
    komputasiAsetPanel.style().set("shown", false);
  } else {
    komputasiAsetButton.setLabel("PILIH JENIS KOMPUTASI DAN ANALISIS");
    komputasiAsetPanel.style().set("shown", true);
  }
});

var infoSubmitAsetLabel = ui.Label(
  "Komputasi dan Visualisasi Spasial",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
  }
);

var infoKlasifikasiAsetLabel = ui.Label(
  "[Klik Disini] Informasi Klasifikasi Kualitas Udara",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://drive.google.com/file/d/1aC6rH7uoVfM9oJCcroJ3zm24942G83fY/view?usp=sharing"
);

var komputasiAsetDropDown = ui.Select({
  items: ["Konsentrasi Polutan", "Kualitas Udara"],
  placeholder: "Pilih Jenis Komputasi",
  onChange: function (selected) {},
  style: { stretch: "horizontal" },
});

var submitAsetButton = ui.Button({
  label: "Submit dan Analisis",
  onClick: function () {
    setParamsAset();
    if (komputasiTerpilihAset === "Konsentrasi Polutan") {
        // Memanggil Data Geometri Hasil import untuk memotong Citra
        var geom = importAsetGeometri();
        if (geom) {
          geometri = geom;
          clipCitraAset();
        }
        uiMap.clear();
        uiMap.drawingTools().set("shown", false);
        grafikPanel.clear();
        ui.root.remove(grafikPanel);

        // Menambahkan Beberapa Widgets ke dalam Grafik Panel
        var grafikKonsentrasiCitraAset = visualisasiGrafikCitraAset();
        var grafikKonsentrasiCitraKonversiAset = visualisasiGrafikCitraKonversiAset();
        grafikPanel.add(grafikKonsentrasiCitraAset);
        grafikPanel.add(grafikKonsentrasiCitraKonversiAset);
        grafikPanel.add(judulkoordinatAsetLabel);
        grafikPanel.add(infoKoordinatAsetLabel);
        grafikPanel.add(infoLongitudeAsetLabel);
        grafikPanel.add(lonAsetTextBox);
        grafikPanel.add(infoLatitudeAsetLabel);
        grafikPanel.add(latAsetTextBox);
        grafikPanel.add(koordinatAsetButton);

        // Callback Onclick pada Peta untuk mengambil Koordinat dan Ekstraksi Kalkukasi Dinamika Konsentrasi
        uiMap.onClick(function (coords) {
          // Mengambil Nilai Koordinat ke dalam TextBox
          lonAsetTextBox.setValue(coords.lon.toFixed(5));
          latAsetTextBox.setValue(coords.lat.toFixed(5));
          var poinKlikAset = ee.Geometry.Point(coords.lon, coords.lat);
          var titik = ui.Map.Layer(poinKlikAset, {color: '000000'}, 'Titik Lokasi/Koordinat');
          uiMap.layers().set(2, titik);

          // Memanggil Fungsi Set Parameter Tanggal dan Jenis Polutan
          setParamsAset();
  
          var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
          var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");
  
          // Memilih Citra yang telah dipilih sesuai Parameter
          var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
          var col = hasilCitra.col;
          var polutanMean = hasilCitra.polutanMean;
  
          // Mengatur Nama Layer sesuai Parameter Terpilih
          var namaLayer;
          if (polutanTerpilihAset === "Karbon Monoksida") {
            namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
          } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
            namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
          } else if (polutanTerpilihAset === "Sulfur Dioksida") {
            namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
          } else if (polutanTerpilihAset === "Ozon") {
            namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
          } else {
            namaLayer = "Pilih Parameter Jenis Polutan";
          }
          
          var namaLayerKonversi;
          if (polutanTerpilihAset === "Karbon Monoksida") {
            namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
            namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAset === "Sulfur Dioksida") {
            namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAset === "Ozon") {
            namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
          } else {
            namaLayerKonversi = "Pilih Parameter Jenis Polutan";
          }
    
          // Membuat Grafik Time-Series Konsentrasi Gas Polutan
          var grafikCitraAsliAset = ui.Chart.image
            .series({
              imageCollection: col,
              region: poinKlikAset,
              reducer: ee.Reducer.mean(),
              scale: 1000,
            })
            .setChartType("LineChart")
            .setSeriesNames([
              "Konsentrasi Gas " + polutanTerpilihAset + " (mol/m²)",
            ])
            .setOptions({
              title: namaLayer,
              interpolateNulls: true,
              bestEffort: true,
              maxPixels: 1e10,
              hAxis: {
                title: "Waktu",
              },
              vAxis: {
                title: "Konsentrasi Gas (mol/m²)",
              },
              lineWidth: 2,
              pointSize: 3,
            });
    
          // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi
          var grafikCitraKonversiAset = ui.Chart.image
            .series({
              imageCollection: polutanMean,
              region: poinKlikAset,
              reducer: ee.Reducer.mean(),
              scale: 1000,
            })
            .setChartType("LineChart")
            .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAset + " (µg/m³)"])
            .setOptions({
              title: namaLayerKonversi,
              interpolateNulls: true,
              bestEffort: true,
              maxPixels: 1e10,
              hAxis: {
                title: "Waktu",
              },
              vAxis: {
                title: "Konsentrasi Gas (µg/m³)",
              },
              lineWidth: 2,
              pointSize: 3,
            });
    
          grafikPanel.widgets().set(0, grafikCitraAsliAset);
          grafikPanel.widgets().set(1, grafikCitraKonversiAset);
        });
        uiMap.setOptions("HYBRID");
        ui.root.remove(urlPanel);
        ui.root.insert(0, grafikPanel);
      } else if (komputasiTerpilihAset === "Kualitas Udara") {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", false);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraAset();
      } else {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", false);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraAset();
      }
  },
  style: { stretch: "horizontal" },
});

var unduhCitraAsetButton = ui.Button({
  label: "Unduh Data Spasial",
  onClick: function () {
    setParamsAset();
    if (komputasiTerpilihAset === "Konsentrasi Polutan") {
        unduhCitraAset();
        ui.root.remove(grafikPanel);
       } else if (komputasiTerpilihAset === "Kualitas Udara") {
        unduhCitraKualitasUdaraAset();
        ui.root.remove(grafikPanel);
       } else {
        unduhCitraKualitasUdaraAset();
        ui.root.remove(grafikPanel);
       }
  },
  style: { stretch: "horizontal" },
});

komputasiAsetPanel.add(infoSubmitAsetLabel);
komputasiAsetPanel.add(infoKlasifikasiAsetLabel);
komputasiAsetPanel.add(komputasiAsetDropDown);
komputasiAsetPanel.add(submitAsetButton);
komputasiAsetPanel.add(unduhCitraAsetButton);

var kembaliAsetButton = ui.Button({
  label: "Kembali",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(adminPanel);
    ui.root.remove(asetPanel);
    ui.root.remove(grafikPanel);
    ui.root.remove(urlPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    petaUtamaWeb();
    uiMap.setOptions("HYBRID");
    ui.root.insert(0, utamaPanel);
  },
  style: { stretch: "horizontal" },
});

// ############################# PENGATURAN FUNGSI TANGGAL DAN JENIS HALAMAN ROI ######################################

// Deklarasi Variabel Universal
var awalWaktuAset, akhirWaktuAset, polutanTerpilihAset, komputasiTerpilihAset;

// Fungsi untuk set Parameter Waktu dan Jenis Polutan
function setParamsAset() {
  // Mengambil nilai variabel waktu
  var mulaiTanggalAsetValue = awalTanggalAsetSlider.getValue()[0];
  var akhirTanggalAsetValue = akhirTanggalAsetSlider.getValue()[0];

  // Melakukan Konversi Unix timestamp menjadi Date object
  awalWaktuAset = ee.Date(mulaiTanggalAsetValue);
  akhirWaktuAset = ee.Date(akhirTanggalAsetValue);

  // Mengambil nilai variabel Jenis Polutan
  polutanTerpilihAset = parameterAsetDropDown.getValue();
  komputasiTerpilihAset = komputasiAsetDropDown.getValue();
}

// Memanggil setTanggal untuk menentukan data Tanggal
setParamsAset();

// ############################# PENGATURAN FUNGSI IMPORT GEOMETRI ASET PADA AKUN GEE HALAMAN ASET ######################################

// Deklarasi Variabel Global
var importedGeometri;

// Fungsi untuk Import Aset Geometri dari Akun GEE
function importAsetGeometri() {
  // Mengambil Nilai Aset dari Hasil Input
  var asetId = asetInputTextBox.getValue();
  asetId = ee.String(asetId);

  // Mengolah String Nilai Aset ke dalam Geometri/Feature Collection
  var aset = ee.FeatureCollection(asetId);
  geometri = aset.geometry();
  geometri = geometri.simplify({'maxError': 1000});
  
  // Melakukan Return Grafik 
  return geometri;
}

// ############################# PENGATURAN FUNGSI CLIP CITRA HALAMAN ASET ######################################

// Fungsi untuk Clip Citra menggunakan Parameter yang telah ditentukan
function clipCitraAset() {
  var geom = importAsetGeometri();
  if (geom) {
    // Memanggil Fungsi Set Parameter Tanggal dan Jenis Polutan
    setParamsAset();

    // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
    var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
    var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");

    // Memanggil Citra yang telah dipilih sesuai Parameter
    var col = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var bounds = uiMap.getBounds();
    var geomBounds = ee.Geometry.Rectangle(bounds);

    // Memanggil Fungsi HandleCitra untuk Pemrosesan
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    col = hasilCitra.col;
    var pollutantMean = hasilCitra.polutanMean;

    // Menagatur Tengah Peta sesuai Geometri
    Map.centerObject(geometri);
  }
}

// ############################# PENGATURAN FUNGSI UNDUH CITRA HALAMAN ASET ######################################

// Fungsi untuk Unduh Citra
function unduhCitraAset() {
  var geom = importAsetGeometri();
  if (geom) {
    geometri = geom;

    // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
    setParamsAset();

    // Mengubah Format Date Object menjadi Tahun-Bulan-Hari dan Mengambil String Informasi Tanggal
    var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd").getInfo();
    var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd").getInfo();

    // Memanggil Citra yang sudah ditangani untuk dipotong sesuai area kajian
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var col = hasilCitra.col;
    var polutanMean = hasilCitra.polutanMean;

    // Mengatur Penamaan Data yang diunduh untuk menghilangkan spasi
    var ubahNama = polutanTerpilihAset.replace(/ /g, "_"); // Replace spaces with underscores
    var deskripsiAsli = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + formatAwalTanggal + "_" + formatAkhirTanggal;
     var deskripsiKonversi = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + "Terkonversi" +"_" + formatAwalTanggal + "_" + formatAkhirTanggal;

    // Mengambil Data Citra dengan Nilai Mean (Rata-Rata) (Asli dan Konversi)
    var meanCitraAsli = col.mean();
    var meanCitraKonversi = polutanMean.mean();

    // Memotong Citra dengan Geometri Terpilih (Asli dan Konversi)
    var clipCitraAsli = meanCitraAsli.clip(geometri);
    var clipCitraKonversi = meanCitraKonversi.clip(geometri);

    // Mendapatkan URL dari Hasil Export Citra Asli untuk di-Unduh
    var downloadUrlCitraAsli = clipCitraAsli.getDownloadURL({
      name: deskripsiAsli,
      scale: 1000,
      region: geometri,
      fileFormat: "GeoTIFF",
    });

    // Mendapatkan URL dari Hasil Export Citra Konversi untuk di-Unduh
    var unduhUrlCitraKonversi = clipCitraKonversi.getDownloadURL({
      name: deskripsiKonversi,
      scale: 1000,
      region: geometri,
      maxPixels: 1e10,
      fileFormat: "GeoTIFF",
    });

    // Membuat Label untuk Unduh Data melalui Link URL
    var urlLabel = ui.Label("Click to Download: ");
    var unduhLinkCitraAsli = ui.Label({
      value:
        "Link Unduh Citra Sentinel 5P " + polutanTerpilihAset + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (mol/m²)",
      targetUrl: downloadUrlCitraAsli,
    });
    var unduhLinkCitraKonversi = ui.Label({
      value:
        "Link Unduh Citra Sentinel 5P " + polutanTerpilihAset + " Terkonversi " + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (ug/m3)",
      targetUrl: unduhUrlCitraKonversi,
    });

    // Menghapus Widgets yang ada pada URL Panel
    urlPanel.clear();
    ui.root.remove(urlPanel);

    // Menampilkan Link Unduhan pada URL Panel
    urlPanel.add(urlLabel);
    urlPanel.add(unduhLinkCitraAsli);
    urlPanel.add(unduhLinkCitraKonversi);

    // Menambahkan URL Panel ke Peta
    uiMap.remove(urlPanel);
    uiMap.add(urlPanel);
  }
}

// Fungsi untuk Unduh Hasil Kualitas Udara
function unduhCitraKualitasUdaraAset() {
  var geom = importAsetGeometri();
  if (geom) {
    geometri = geom;
    clipCitraROI();
  }
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAset();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari dan Mengambil String Informasi Tanggal
  var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd").getInfo();
  var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd").getInfo();

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (CO)
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (NO2)
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (SO2)
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (O3)
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);

  // Melakukan Overlay Kualitas Udara (CO, NO2, SO2, O3) 
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlCO = kelasCO.getDownloadURL({
    name: "Kualitas Polutan Karbon Monoksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlNO2 = kelasNO2.getDownloadURL({
    name:
      "Kualitas Polutan Nitrogen Dioksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlSO2 = kelasSO2.getDownloadURL({
    name:
      "Kualitas Polutan Sulfur Dioksida_" + formatAwalTanggal + " " + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlO3 = kelasO3.getDownloadURL({
    name: "Kualitas Polutan Ozon_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlKualitasUdara = kelasKualitasUdara.getDownloadURL({
    name: "Kualitas Udara_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Membuat Label untuk Unduh Data melalui Link URL
  var urlLabel = ui.Label("Klik Link untuk mulai Unduh: ", {
    fontWeight: "bold",
  });
  var unduhLinkCO = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Karbon Monoksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlCO,
  });
  var unduhLinkNO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Nitrogen Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlNO2,
  });
  var unduhLinkSO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Sulfur Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlSO2,
  });
  var unduhLinkO3 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Ozon" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlO3,
  });
  var unduhLinkKualitasUdara = ui.Label({
    value:
      "• Link Unduh Data Kualitas Udara" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlKualitasUdara,
  });

  // Menghapus Widgets yang ada pada URL Panel
  urlPanel.clear();
  ui.root.remove(urlPanel);

  // Menampilkan URL Label Pada URL Panel untuk di-Unduh dan Pengaturan Tampilan Peta
  urlPanel.add(urlLabel);
  urlPanel.add(unduhLinkCO);
  urlPanel.add(unduhLinkNO2);
  urlPanel.add(unduhLinkSO2);
  urlPanel.add(unduhLinkO3);
  urlPanel.add(unduhLinkKualitasUdara);
  uiMap.remove(urlPanel);
  uiMap.add(urlPanel);
}

// ############################# PENGATURAN FUNGSI GRAFIK DAN VISUALISASI CITRA HALAMAN ASET ######################################

// Fungsi untuk Membuat Grafik Konsentrasi Gas Polutan
var visualisasiGrafikCitraAset = function () {
  var geom = importAsetGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Set Parameter Tanggal dan Jenis Polutan
  setParamsAset();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");

  // Memanggil Citra sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAset === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihAset === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihAset === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: col,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAset + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Melakukan Set Nilai Minimum dan Maksimum Citra
  var nilaiMin, nilaiMaks;
  switch (polutanTerpilihAset) {
    case "Karbon Monoksida":
      nilaiMin = 0;
      nilaiMaks = 0.05;
      break;
    case "Nitrogen Dioksida":
      nilaiMin = 0;
      nilaiMaks = 0.0002;
      break;
    case "Sulfur Dioksida":
      nilaiMin = 0.0;
      nilaiMaks = 0.0005;
      break;
    case "Ozon":
      nilaiMin = 0.112;
      nilaiMaks = 0.15;
      break;
  }

  // MelakukanSet Parameter Visualisasi Citra
  var parameterVis = {
    min: nilaiMin,
    max: nilaiMaks,
    palette: paletWarna,
  };

  // Pembuatan Thumbnail Time-Series untuk Visualisasi Citra secara Time-Series
  // Mengatur Fungsi DOY pada Citra untuk digabungkan
  col = col.map(function (img) {
    var doy = ee.Date(img.get("system:time_start")).getRelative("day", "year");
    return img.set("doy", doy);
  });

  // Mengatur Tanggal Citra dan Proses Penggabungannya sesuai dengan DOY
  var tanggalCitra = col.filterDate(formatAwalTanggal, formatAkhirTanggal);
  var filter = ee.Filter.equals({ leftField: "doy", rightField: "doy" });
  var gabung = ee.Join.saveAll("doy_matches");
  var gabungCol = ee.ImageCollection(gabung.apply(tanggalCitra, col, filter));

  // Melakukan Komputasi Penggabungan Citra sesuai Parameter yang ditentukan (DOY) dan melakukan Reducer
  var komputasiCitra = gabungCol.map(function (img) {
    var doyCol = ee.ImageCollection.fromImages(img.get("doy_matches"));
    return doyCol.reduce(ee.Reducer.mean());
  });

  // Membuat RGB Tampilan Visual Time-Series
  var rgbVis = komputasiCitra.map(function (img) {
    return img.visualize(parameterVis).clip(geometri);
  });

  // Membuat Parameter Visual Gif Time-Series
  var gifParams = {
    region: geom,
    dimensions: 150,
    crs: "EPSG:4326",
    framesPerSecond: 10,
  };

  // Melakukan Render Thumbnail dan Tampilkan Hasilnya dalam Peta
  var thumbnailKonsentrasiAset = ui.Thumbnail(rgbVis, gifParams);

  thumbnailPanel.clear();
  thumbnailPanel.add(infoVisualisasiThumbnailLabel);
  thumbnailPanel.add(thumbnailKonsentrasiAset);
  uiMap.add(thumbnailPanel);

  // Menambahkan Citra Hasil Visualisasi Ke Peta dan Mengatur Tengah Peta sesuai Geometri
  uiMap.addLayer(col.mean().clip(geometri), parameterVis, namaLayer);
  
  // Menampilkan Batas Admin
  var emptyGeometri = ee.Image().byte();
  var outlineGeometri = emptyGeometri.paint({
    featureCollection: geometri,
    color: 1,
    width: 2});
  uiMap.addLayer(outlineGeometri, {palette: '000000'}, 'Batas Geometri');
  uiMap.centerObject(geometri);
  
  // Mengimplementasi Pembuatan Legenda Polutan menggunakan Citra Col
  legendaPolutan(col);
  
  // Melakukan Return Grafik
  return chart;
};

// Fungsi untuk Visualisasi dan Membuat Grafik Time-Series
var visualisasiGrafikCitraKonversiAset = function () {
  var geom = importAsetGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
  setParamsAset();

  // Mengubah Format Tanggal Menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAset === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Memilih Citra sesuai Parameter Terpilih
  var result = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var polutanMean = result.polutanMean;

  // Membuat Grafik Time-Series Rata-Rata Konsentrasi Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAset + " (µg/m³)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Melakukan Return Grafik
  return chart;
};

//############################# PENGATURAN FUNGSI TANGGAL DAN JENIS HALAMAN ROI ######################################

// Fungsi Ekstraksi Nilai Konsentrasi dari Citra menggunakan Titik Koordinat
function grafikKoordinatAset() {
  var koordinatLonAset = parseFloat(lonAsetTextBox.getValue());
  var koordinatLatAset = parseFloat(latAsetTextBox.getValue());
  var poinAset = ee.Geometry.Point(koordinatLonAset, koordinatLatAset);
  var titik = ui.Map.Layer(poinAset, {color: '000000'}, 'Titik Lokasi/Koordinat');
  uiMap.layers().set(2, titik);
  
  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAset();
  
  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");

  // Memilih Citra sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;
  var polutanMean = hasilCitra.polutanMean;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAset === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihAset === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihAset === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }
      
  var namaLayerKonversi;
  if (polutanTerpilihAset === "Karbon Monoksida") {
    namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Nitrogen Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Sulfur Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAset === "Ozon") {
    namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayerKonversi = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var grafikCitraAsliAset = ui.Chart.image
    .series({
      imageCollection: col,
      region: poinAset,
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAset + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi
  var grafikCitraKonversiAset = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: poinAset,
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAset + " (µg/m³)"])
    .setOptions({
      title: namaLayerKonversi,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Menampilkan grafik ke dalam Grafik Panel
  grafikPanel.widgets().set(0, grafikCitraAsliAset);
  grafikPanel.widgets().set(1, grafikCitraKonversiAset);
}

// ############################# PENGATURAN FUNGSI ANALISIS KUALITAS UDARA MENGGUNAKAN CITRA HALAMAN ASET ######################################

// Fungsi untuk Analisis Kualitas Udara
function prosesAnalisisKualitasUdaraAset() {
  var geom = importAsetGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAset();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAset.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAset.format("YYYY-MM-dd");

  // Memanggil Koleksi Dataset dan Konversi Satuan CO
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset dan Konversi Satuan NO2
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan SO2
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan O3
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);
  uiMap.addLayer(
    kelasCO,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi CO"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);
  uiMap.addLayer(
    kelasNO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi NO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);
  uiMap.addLayer(
    kelasSO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi SO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);
  uiMap.addLayer(
    kelasO3,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi O3"
  );

  // Melakukan Overlay Parameter Kualitas Udara (CO, NO2, SO2, O3)
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);
  uiMap.addLayer(
    kelasKualitasUdara,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi Kualitas Udara"
  );
  
  // Menampilkan Batas Admin
  var emptyGeometri = ee.Image().byte();
  var outlineGeometri = emptyGeometri.paint({
    featureCollection: geometri,
    color: 1,
    width: 2});
  uiMap.addLayer(outlineGeometri, {palette: '000000'}, 'Batas Geometri');
  
  // Mengatur Tengah Peta Sesuai Geometri
  uiMap.centerObject(geometri);
  
  // Memanggil Fungsi Pembuatan Legenda Kualitas Udara
  legendaKualitasUdara();
}

// ############################# PENGATURAN TAMPILAN PANEL PADA HALAMAN ASET ######################################

// Menyusun Tampilan Widgets Pada Panel Halaman Aset
var asetPanel = ui.Panel({
  widgets: [
    judulAsetLabel,
    infoAsetLabel,
    petunjukAsetButton,
    petunjukAsetPanel,
    peringatanAsetLabel,
    garisAsetSeparator1,
    infoParameterAsetLabel,
    waktuAsetButton,
    waktuAsetPanel,
    garisAsetSeparator2,
    jenisAsetButton,
    jenisAsetPanel,
    garisAsetSeparator3,
    areaAsetButton,
    areaAsetPanel,
    garisAsetSeparator4,
    komputasiAsetButton,
    komputasiAsetPanel,
    garisAsetSeparator5,
    kembaliAsetButton,
  ],
  style: {
    width: "21rem",
  },
});

//############################# PENGATURAN TAMPILAN UI HALAMAN BATAS ADMINISTRASI ######################################

// Membuat Widgets Label, DateSlider, Select, dan Button untuk tampilan UI beserta dengan fungsinya
var judulAdminLabel = ui.Label("AeroSkySensing", {
  fontWeight: "bold",
  fontSize: "2rem",
  textAlign: "center",
});

var infoAdminLabel = ui.Label(
  "WebGIS Pemantau Kualitas Udara secara spasial memanfaatkan teknologi penginderaan jauh (Sentinel 5P-TROPOMI) dan berbasis komputasi awan.",
  {
    fontSize: "0.9rem",
    textAlign: "justify",
  }
);

var garisAdminSeparator1 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAdminSeparator2 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAdminSeparator3 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAdminSeparator4 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var garisAdminSeparator5 = ui.Label(
  "_______________________________________________",
  {
    fontWeight: "bold",
    color: "blue",
  }
);

var petunjukAdminButton = ui.Button({
  label: "Petunjuk Penggunaan WebGIS AeroSkySensing",
  style: { stretch: "horizontal", color: "black" },
});
var petunjukAdminPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

petunjukAdminButton.onClick(function () {
  if (petunjukAdminPanel.style().get("shown")) {
    petunjukAdminButton.setLabel("Petunjuk Penggunaan WebGIS AeroSkySensing");
    petunjukAdminPanel.style().set("shown", false);
  } else {
    petunjukAdminButton.setLabel("Sembunyikan Informasi");
    petunjukAdminPanel.style().set("shown", true);
  }
});

var petunjukAdminLabel = ui.Panel([
  ui.Label("Petunjuk Penggunaan WebGIS AeroSkySensing:", {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "15px 0 0 15px",
  }),
  ui.Label(
    "[Klik Disini] Buku Petunjuk Penggunaan WebGIS AeroSkySensing",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" },
    "https://drive.google.com/file/d/1cxjM0a59yc2PiwQnkKEV-MfnUTipsXK_/view?usp=sharing"
  ),
  ui.Label(
    "1. Untuk mengetahui kondisi kualitas udara menggunakan WebGIS ini terdapat beberapa parameter yang harus diisi, seperti Rentang Waktu, Jenis Gas Polutan dan Wilayah Kajian.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "2. Pada parameter Rentang Waktu, dapat diisi dengan memilih waktu awal perekaman dan akhir perekaman melalui DateSlider pada bagian 'Pilih Rentang Waktu Perekaman'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "3. Pada parameter Jenis Gas Polutan, dapat diisi dengan memilih jenis gas polutan yang terdiri dari Karbon Monoksida, Nitrogen Dioksida, Sulfur Dioksida dan Ozon pada bagian 'Pilih Jenis Gas Polutan'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "4. Pada parameter Wilayah Kajian, dapat diisi dengan menambahkan geometri yang disesuaikan dengan halaman yang dipilih (Region of Interest, Aset, Batas Administrasi) pada bagian 'Kelola Area Wilayah Kajian'.",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "5. Lakukan Analisis Konsentrasi Gas Polutan dengan Klik Tombol 'Submit dan Analisis Konsentrasi Polutan' pada bagian 'Analisis dan Visualisasi Konsentrasi Gas Polutan'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Konsentrasi Polutan'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "6. Lakukan Analisis Kualitas Udara dengan Klik Tombol 'Submit dan Analisis Kualitas Udara' pada bagian 'Analisis dan Visualisasi Kualitas Udara'. Jika ingin mengunduh datanya dapat dilakukan dengan Klik tombol 'Unduh Data Kualitas Udara'",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
  ui.Label(
    "7. Lakukan pengamatan dan analisis terhadap kondisi Konsentrasi Gas Polutan dan Kualitas Udara menggunakan fitur-fitur yang ada seperti ekstraksi nilai-nilai rata konsentrasi gas polutan melalui grafik yang akan muncul ketika melakukan analisis",
    { fontSize: "12px", margin: "2px 15px 2px 15px", textAlign: "justify" }
  ),
]);
petunjukAdminPanel.add(petunjukAdminLabel);

var peringatanAdminLabel = ui.Label(
  "[PERHATIAN] Sebelum melakukan Running, PASTIKAN Semua Parameter Terisi",
  {
    fontSize: "12px",
    textAlign: "center",
    color: "red",
  }
);

var infoParameterAdminLabel = ui.Label(
  "PARAMETER PEMANTAUAN KUALITAS UDARA",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
    textAlign: "center",
  }
);

var waktuAdminButton = ui.Button({
  label: "RENTANG WAKTU PEREKAMAN",
  style: { stretch: "horizontal", color: "black" },
});
var waktuAdminPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

waktuAdminButton.onClick(function () {
  if (waktuAdminPanel.style().get("shown")) {
    waktuAdminButton.setLabel("RENTANG WAKTU PEREKAMAN");
    waktuAdminPanel.style().set("shown", false);
  } else {
    waktuAdminButton.setLabel("PILIH RENTANG WAKTU PEREKAMAN");
    waktuAdminPanel.style().set("shown", true);
  }
});

var infoPemilihanTanggalAdminLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan Rentang Waktu Perekaman",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/UOWG1he9fik"
);

var infoTanggalAwalAdminLabel = ui.Label("1. Waktu Awal Perekaman", {
  fontSize: "15px",
});

var awalTanggalAdminSlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: startYear,
  period: 1,
  style: { width: "300px" },
});

var infoTanggalAkhirAdminLabel = ui.Label("2. Waktu Akhir Perekaman ", {
  fontSize: "15px",
});

var akhirTanggalAdminSlider = ui.DateSlider({
  start: startYear,
  end: endYear,
  value: endYear,
  period: 1,
  style: { width: "300px" },
});

waktuAdminPanel.add(infoPemilihanTanggalAdminLabel);
waktuAdminPanel.add(infoTanggalAwalAdminLabel);
waktuAdminPanel.add(awalTanggalAdminSlider);
waktuAdminPanel.add(infoTanggalAkhirAdminLabel);
waktuAdminPanel.add(akhirTanggalAdminSlider);

var jenisAdminButton = ui.Button({
  label: "JENIS GAS POLUTAN",
  style: { stretch: "horizontal", color: "black" },
});
var jenisAdminPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

jenisAdminButton.onClick(function () {
  if (jenisAdminPanel.style().get("shown")) {
    jenisAdminButton.setLabel("JENIS GAS POLUTAN");
    jenisAdminPanel.style().set("shown", false);
  } else {
    jenisAdminButton.setLabel("PILIH JENIS GAS POLUTAN");
    jenisAdminPanel.style().set("shown", true);
  }
});

var infoJenisAdminLabel = ui.Label("Gas Polutan CO, NO₂, SO₂ dan O₃", {
  fontSize: "15px",
  fontWeight: "bold",
});

var parameterAdminDropDown = ui.Select({
  items: ["Karbon Monoksida", "Nitrogen Dioksida", "Sulfur Dioksida", "Ozon"],
  placeholder: "Pilih Jenis Gas Polutan",
  onChange: function (selected) {
    citraTerpilih = selected;
  },
  style: { stretch: "horizontal" },
});

jenisAdminPanel.add(infoJenisAdminLabel);
jenisAdminPanel.add(parameterAdminDropDown);

var areaAdminButton = ui.Button({
  label: "AREA WILAYAH KAJIAN",
  style: { stretch: "horizontal", color: "black" },
});
var areaAdminPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

areaAdminButton.onClick(function () {
  if (areaAdminPanel.style().get("shown")) {
    areaAdminButton.setLabel("AREA WILAYAH KAJIAN");
    areaAdminPanel.style().set("shown", false);
  } else {
    areaAdminButton.setLabel("KELOLA AREA WILAYAH KAJIAN");
    areaAdminPanel.style().set("shown", true);
  }
});

var infoPemilihanWilayahAdminLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pemilihan/Pembuatan Area Wilayah Kajian",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/pzmg2hGq3Lg"
);

var pilihAdminSelect = ui.Select({
  items: [
    "Kawasan Aglomerasi Jakarta",
    "Provinsi Daerah Khusus Jakarta",
    "Kota Adm. Jakarta Pusat",
    "Kota Adm. Jakarta Utara",
    "Kota Adm. Jakarta Timur",
    "Kota Adm. Jakarta Selatan",
    "Kota Adm. Jakarta Barat",
    "Kota Bekasi",
    "Kota Depok",
    "Kota Bogor",
    "Kota Tangerang",
    "Kota Tangerang Selatan",
    "Kabupaten Bekasi",
    "Kabupaten Bogor",
    "Kabupaten Tangerang",
    "Kabupaten Cianjur",
  ],
  placeholder: "Pilih Batas Administrasi",
  onChange: function (selected) {
    adminTerpilih = selected;
  },
  style: { stretch: "horizontal" },
});

var adminTerpilih = "Kawasan Aglomerasi Jakarta";

areaAdminPanel.add(infoPemilihanWilayahAdminLabel);
areaAdminPanel.add(pilihAdminSelect);

var judulkoordinatAdminLabel = ui.Label(
  "Kelola Koordinat untuk Analisis Dinamika Konsentrasi Polutan",
  {
    fontWeight: "bold",
    textAlign: "center",
  }
);

var infoKoordinatAdminLabel = ui.Label(
  "[Klik Disini] Video Tutorial Pengelolaan Koordinat untuk Analisis Statistik Konsentrasi Polutan (Grafik)",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://youtu.be/ZZhg-ZvSF1Q"
);

var infoLongitudeAdminLabel = ui.Label("1. Longitude", {
  fontSize: "12px",
});

var lonAdminTextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Longitude",
});

var infoLatitudeAdminLabel = ui.Label("2. Latitude", {
  fontSize: "12px",
});

var latAdminTextBox = ui.Textbox({
  style: { stretch: "horizontal" },
  placeholder: "Input Latitude",
});

var koordinatAdminButton = ui.Button({
  label: "Kalkulasi Dinamika Konsentrasi",
  onClick: function () {
    grafikKoordinatAdmin();
  },
  style: { stretch: "horizontal" },
});

var komputasiAdminButton = ui.Button({
  label: "KOMPUTASI DAN ANALISIS",
  style: { stretch: "horizontal", color: "black" },
});
var komputasiAdminPanel = ui.Panel(null, null, {
  stretch: "horizontal",
  shown: false,
});

komputasiAdminButton.onClick(function () {
  if (komputasiAdminPanel.style().get("shown")) {
    komputasiAdminButton.setLabel("KOMPUTASI DAN ANALISIS");
    komputasiAdminPanel.style().set("shown", false);
  } else {
    komputasiAdminButton.setLabel("PILIH JENIS KOMPUTASI DAN ANALISIS");
    komputasiAdminPanel.style().set("shown", true);
  }
});

var infoSubmitAdminLabel = ui.Label(
  "Komputasi dan Visualisasi Spasial",
  {
    fontWeight: "bold",
    fontSize: "1.2rem",
  }
);

var infoKlasifikasiAdminLabel = ui.Label(
  "[Klik Disini] Informasi Klasifikasi Kualitas Udara",
  {
    fontSize: "12px",
    margin: "2px 15px 2px 15px",
    textAlign: "justify",
  },
  "https://drive.google.com/file/d/1aC6rH7uoVfM9oJCcroJ3zm24942G83fY/view?usp=sharing"
);

var komputasiAdminDropDown = ui.Select({
  items: ["Konsentrasi Polutan", "Kualitas Udara"],
  placeholder: "Pilih Jenis Komputasi",
  onChange: function (selected) {},
  style: { stretch: "horizontal" },
});

var submitAdminButton = ui.Button({
  label: "Submit dan Analisis ",
  onClick: function () {
    setParamsAdmin();
    if (komputasiTerpilihAdmin === "Konsentrasi Polutan") {
        // Memanggil Data Geometri Hasil import untuk memotong Citra
        var geom = importBatasAdministrasiGeometri();
        if (geom) {
          geometri = geom;
          clipCitraAdmin();
        }
        uiMap.clear();
        uiMap.drawingTools().set("shown", false);
        grafikPanel.clear();
        ui.root.remove(grafikPanel);
    
        // Menambahkan Widgets ke dalam Grafik Panel
        var grafikKonsentrasiCitraAdmin = visualisasiGrafikCitraAdmin();
        var grafikKonsentrasiCitraKonversiAdmin =
          visualisasiGrafikCitraKonversiAdmin();
        grafikPanel.add(grafikKonsentrasiCitraAdmin);
        grafikPanel.add(grafikKonsentrasiCitraKonversiAdmin);
        grafikPanel.add(judulkoordinatAdminLabel);
        grafikPanel.add(infoKoordinatAdminLabel);
        grafikPanel.add(infoLongitudeAdminLabel);
        grafikPanel.add(lonAdminTextBox);
        grafikPanel.add(infoLatitudeAdminLabel);
        grafikPanel.add(latAdminTextBox);
        grafikPanel.add(koordinatAdminButton);
    
        // Callback Onclick pada Peta untuk mengambil Koordinat dan Ekstraksi Kalkukasi Dinamika Konsentrasi
        uiMap.onClick(function (coords) {
          // Mengambil Nilai Koordinat ke dalam TextBox
          lonAdminTextBox.setValue(coords.lon.toFixed(5));
          latAdminTextBox.setValue(coords.lat.toFixed(5));
          var poinKlikAdmin = ee.Geometry.Point(coords.lon, coords.lat);
          var titik = ui.Map.Layer(poinKlikAdmin, {color: '000000'}, 'Titik Lokasi/Koordinat');
          uiMap.layers().set(2, titik);
    
          // Memanggil Fungsi set Parameter Tanggal Perekaman dan Jenis Polutan
          setParamsAdmin();
    
          // Mengubah Format Date Object menjadi Tahun-Bulan-Hari dan Mengambil String Informasi Tanggal
          var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
          var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");
    
          // Memilih Citra sesuai Parameter Terpilih
          var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
          var col = hasilCitra.col;
          var polutanMean = hasilCitra.polutanMean;
    
          // Mengatur Nama Layer sesuai Parameter Terpilih
          var namaLayer;
          if (polutanTerpilihAdmin === "Karbon Monoksida") {
            namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
          } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
            namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
          } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
            namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
          } else if (polutanTerpilihAdmin === "Ozon") {
            namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
          } else {
            namaLayer = "Pilih Parameter Jenis Polutan";
          }
          
          var namaLayerKonversi;
          if (polutanTerpilihAdmin === "Karbon Monoksida") {
            namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
            namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
            namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
          } else if (polutanTerpilihAdmin === "Ozon") {
            namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
          } else {
            namaLayerKonversi = "Pilih Parameter Jenis Polutan";
          }
    
          // Membuat Grafik Time-Series Konsentrasi Gas Polutan
          var grafikCitraAsliAdmin = ui.Chart.image
            .series({
              imageCollection: col,
              region: poinKlikAdmin,
              reducer: ee.Reducer.mean(),
              scale: 1000,
            })
            .setChartType("LineChart")
            .setSeriesNames([
              "Konsentrasi Gas " + polutanTerpilihAdmin + " (mol/m²)",
            ])
            .setOptions({
              title: namaLayer,
              interpolateNulls: true,
              bestEffort: true,
              maxPixels: 1e10,
              hAxis: {
                title: "Waktu",
              },
              vAxis: {
                title: "Konsentrasi Gas (mol/m²)",
              },
              lineWidth: 2,
              pointSize: 3,
            });
    
          // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi
          var grafikCitraKonversiAdmin = ui.Chart.image
            .series({
              imageCollection: polutanMean,
              region: poinKlikAdmin,
              reducer: ee.Reducer.mean(),
              scale: 1000,
            })
            .setChartType("LineChart")
            .setSeriesNames([
              "Konsentrasi Gas " + polutanTerpilihAdmin + " (µg/m³)",
            ])
            .setOptions({
              title: namaLayerKonversi,
              interpolateNulls: true,
              bestEffort: true,
              maxPixels: 1e10,
              hAxis: {
                title: "Waktu",
              },
              vAxis: {
                title: "Konsentrasi Gas (µg/m³)",
              },
              lineWidth: 2,
              pointSize: 3,
            });
            
          // Menampilkan Grafik Pada Grafik Panel 
          grafikPanel.widgets().set(0, grafikCitraAsliAdmin);
          grafikPanel.widgets().set(1, grafikCitraKonversiAdmin);
        });
        uiMap.setOptions("HYBRID");
        ui.root.remove(urlPanel);
        ui.root.insert(0, grafikPanel);
      } else if (komputasiTerpilihAdmin === "Kualitas Udara") {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", false);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraAdmin();
      } else {
        uiMap.clear();
        uiMap.setOptions("HYBRID");
        uiMap.drawingTools().set("shown", false);
        ui.root.remove(grafikPanel);
        ui.root.remove(urlPanel);
        prosesAnalisisKualitasUdaraAdmin();
      }
  },
  style: { stretch: "horizontal" },
});

var unduhCitraAdminButton = ui.Button({
  label: "Unduh Data Spasial",
  onClick: function () {
    setParamsAdmin();
    if (komputasiTerpilihAdmin === "Konsentrasi Polutan") {
        unduhCitraAdmin();
        ui.root.remove(grafikPanel);
      } else if (komputasiTerpilihAdmin === "Kualitas Udara") {
        unduhCitraKualitasUdaraAdmin();
        ui.root.remove(grafikPanel);
      } else {
        unduhCitraKualitasUdaraAdmin();
        ui.root.remove(grafikPanel);
      }
  },
  style: { stretch: "horizontal" },
});

komputasiAdminPanel.add(infoSubmitAdminLabel);
komputasiAdminPanel.add(infoKlasifikasiAdminLabel);
komputasiAdminPanel.add(komputasiAdminDropDown);
komputasiAdminPanel.add(submitAdminButton);
komputasiAdminPanel.add(unduhCitraAdminButton);

var kembaliAdminButton = ui.Button({
  label: "Kembali",
  onClick: function () {
    ui.root.remove(roiPanel);
    ui.root.remove(adminPanel);
    ui.root.remove(asetPanel);
    ui.root.remove(grafikPanel);
    ui.root.remove(urlPanel);
    uiMap.clear();
    drawingTools.setShown(false);
    petaUtamaWeb();
    uiMap.setOptions("HYBRID");
    ui.root.insert(0, utamaPanel);
  },
  style: { stretch: "horizontal" },
});

//############################# PENGATURAN FUNGSI TANGGAL DAN JENIS HALAMAN ROI ######################################

// Deklarasi Variabel Universal
var awalWaktuAdmin, akhirWaktuAdmin, polutanTerpilihAdmin, komputasiTerpilihAdmin;

// Fungsi untuk set Parameter Waktu dan Jenis Polutan
function setParamsAdmin() {
  // Mengambil nilai variabel waktu
  var mulaiTanggalAdminValue = awalTanggalAdminSlider.getValue()[0];
  var akhirTanggalAdminValue = akhirTanggalAdminSlider.getValue()[0];

  // Melakukan Konversi Unix timestamp menjadi Date object
  awalWaktuAdmin = ee.Date(mulaiTanggalAdminValue);
  akhirWaktuAdmin = ee.Date(akhirTanggalAdminValue);

  // Mengambil nilai variabel Jenis Polutan
  polutanTerpilihAdmin = parameterAdminDropDown.getValue();
  komputasiTerpilihAdmin = komputasiAdminDropDown.getValue();
}

// Memanggil setTanggal untuk menentukan data Tanggal
setParamsAdmin();

// ############################# PENGATURAN FUNGSI IMPORT GEOMETRI HALAMAN BATAS ADMINISTRASI ######################################

// Deklarasi Variabel Universal untuk Import Geometri
var batasAdministrasiGeometri;

// Fungsi untuk meng-import geometri Batas Administrasi
function importBatasAdministrasiGeometri() {
  var borderId = pilihAdminSelect.getValue();
  var asetId;

  if (borderId === "Kawasan Aglomerasi Jakarta") {
    asetId = "users/herdiansyah/Aglomerasi_DKJ";
  } else if (borderId === "Provinsi Daerah Khusus Jakarta") {
    asetId = "users/herdiansyah/DKI_Jakarta";
  } else if (borderId === "Kota Adm. Jakarta Pusat") {
    asetId = "users/herdiansyah/Jakarta_Pusat";
  } else if (borderId === "Kota Adm. Jakarta Utara") {
    asetId = "users/herdiansyah/Jakarta_Utara";
  } else if (borderId === "Kota Adm. Jakarta Timur") {
    asetId = "users/herdiansyah/Jakarta_Timur";
  } else if (borderId === "Kota Adm. Jakarta Selatan") {
    asetId = "users/herdiansyah/Jakarta_Selatan";
  } else if (borderId === "Kota Adm. Jakarta Barat") {
    asetId = "users/herdiansyah/Jakarta_Barat";
  } else if (borderId === "Kota Bekasi") {
    asetId = "users/herdiansyah/Kota_Bekasi";
  } else if (borderId === "Kota Depok") {
    asetId = "users/herdiansyah/Kota_Depok";
  } else if (borderId === "Kota Bogor") {
    asetId = "users/herdiansyah/Kota_Bogor";
  } else if (borderId === "Kota Tangerang") {
    asetId = "users/herdiansyah/Kota_Tangerang";
  } else if (borderId === "Kota Tangerang Selatan") {
    asetId = "users/herdiansyah/Kota_Tangerang_Selatan";
  } else if (borderId === "Kabupaten Bekasi") {
    asetId = "users/herdiansyah/Kab_Bekasi";
  } else if (borderId === "Kabupaten Bogor") {
    asetId = "users/herdiansyah/Kab_Bogor";
  } else if (borderId === "Kabupaten Tangerang") {
    asetId = "users/herdiansyah/Kab_Tangerang";
  } else if (borderId === "Kabupaten Cianjur") {
    asetId = "users/herdiansyah/Kab_Cianjur";
  }

  // Melakukan Load Data Aset Batas Administrasi
  var asetBatasAdministrasi = ee.FeatureCollection(asetId);
  geometri = asetBatasAdministrasi.geometry();
  geometri = geometri.simplify({'maxError': 1000});
  return geometri;
}

// ############################# PENGATURAN FUNGSI CLIP CITRA HALAMAN BATAS ADMINISTRASI ######################################

// Fungsi untuk memotong Citra
function clipCitraAdmin() {
  var geom = importBatasAdministrasiGeometri();
  if (geom) {
    // Memanggil Fungsi Set Parameter
    setParamsAdmin();

    // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
    var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
    var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");

    // Memanggil Citra untuk dipotong sesuai Geometri
    var col = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var bounds = uiMap.getBounds();
    var geomBounds = ee.Geometry.Rectangle(bounds);

    // Memanggil Fungsi HandleCitra untuk Pemrosesan
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    col = hasilCitra.col;
    var polutanMean = hasilCitra.polutanMean;
    
    // Membuat Zoom In Peta Sesuai Geometri
    Map.centerObject(geometri);
  }
}

// ############################# PENGATURAN FUNGSI UNDUH CITRA PADA HALAMAN BATAS ADMINISTRASI ######################################

// Fungsi untuk Unduh Citra
function unduhCitraAdmin() {
  var geom = importBatasAdministrasiGeometri();
  if (geom) {
    geometri = geom;

    // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
    setParamsAdmin();

    // Mengubah Format Date Object menjadi Tahun-Bulan-Hari dan Mengambil String Informasi Tanggal
    var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd").getInfo();
    var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd").getInfo();

    // Mengambil Data Citra yang akan diunduh
    var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
    var col = hasilCitra.col;
    var polutanMean = hasilCitra.polutanMean;

    // Mengatur Penamaan Data yang diunduh agar tidak ada spasi
    var ubahNama = polutanTerpilihAdmin.replace(/ /g, "_"); // Replace spaces with underscores
    var deskripsiAsli = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + formatAwalTanggal + "_" + formatAkhirTanggal;
     var deskripsiKonversi = "Citra_Sentinel_5P" + "_" + ubahNama + "_" + "Terkonversi" +"_" + formatAwalTanggal + "_" + formatAkhirTanggal;

    // Mengambil Data Citra dengan Nilai Mean (Rata-Rata) (Asli dan Konversi)
    var meanCitraAsli = col.mean();
    var meanCitraKonversi = polutanMean.mean();

    // Memotong Citra dengan Geometri Terpilih (Asli dan Konversi)
    var clipCitraAsli = meanCitraAsli.clip(geometri);
    var clipCitraKonversi = meanCitraKonversi.clip(geometri);

    // Mendapatkan URL dari Hasil Export Citra Asli untuk di-Unduh
    var unduhUrlCitraAsli = clipCitraAsli.getDownloadURL({
      name: deskripsiAsli,
      scale: 1000,
      region: geometri,
      maxPixels: 1e10,
      fileFormat: "GeoTIFF",
    });

    // Mendapatkan URL dari Hasil Export Citra Konversi untuk di-Unduh
    var unduhUrlCitraKonversi = clipCitraKonversi.getDownloadURL({
      name: deskripsiKonversi,
      scale: 1000,
      region: geometri,
      maxPixels: 1e10,
      fileFormat: "GeoTIFF",
    });

    // Membuat Label untuk Unduh Data melalui Link URL
    var urlLabel = ui.Label("Klik Link untuk mulai Unduh: ", {
      fontWeight: "bold",
    });
    var unduhLinkCitraAsli = ui.Label({
      value:
        "• Link Unduh Citra Sentinel 5P " + polutanTerpilihAdmin + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (mol/m²)",
      targetUrl: unduhUrlCitraAsli,
    });
    var unduhLinkCitraKonversi = ui.Label({
      value:
        "• Link Unduh Citra Sentinel 5P " + polutanTerpilihAdmin + " Terkonversi " + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")" + " " + " (ug/m3)",
      targetUrl: unduhUrlCitraKonversi,
    });

    // Menghapus Widgets yang ada pada URL Panel
    urlPanel.clear();
    ui.root.remove(urlPanel);

    // Menampilkan Link Unduhan pada URL Panel
    urlPanel.add(urlLabel);
    urlPanel.add(unduhLinkCitraAsli);
    urlPanel.add(unduhLinkCitraKonversi);

    // Menambahkan URL Panel ke Peta
    uiMap.remove(urlPanel);
    uiMap.add(urlPanel);
  }
}

// Fungsi untuk Unduh Hasil Kualitas Udara
function unduhCitraKualitasUdaraAdmin() {
  // Melakukan Pengaturan Geometri
  var geom = importBatasAdministrasiGeometri();
  if (geom) {
    geometri = geom;
    clipCitraROI();
  }
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAdmin();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari dan Mengambil String Informasi Tanggal
  var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd").getInfo();
  var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd").getInfo();

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (CO)
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset Koleksi Dataset Citra Kualitas Udara (NO2)
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (SO2)
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset Citra Kualitas Udara (O3)
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);

  // Melakukan Overlay Parameter Kualitas Udara (CO, NO2, SO2, O3)
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlCO = kelasCO.getDownloadURL({
    name: "Kualitas Polutan Karbon Monoksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlNO2 = kelasNO2.getDownloadURL({
    name:
      "Kualitas Polutan Nitrogen Dioksida_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlSO2 = kelasSO2.getDownloadURL({
    name:
      "Kualitas Polutan Sulfur Dioksida_" + formatAwalTanggal + " " + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlO3 = kelasO3.getDownloadURL({
    name: "Kualitas Polutan Ozon_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Mendapatkan URL dari Hasil Export Citra Kualitas Udara SO2 untuk di-Unduh
  var unduhUrlKualitasUdara = kelasKualitasUdara.getDownloadURL({
    name: "Kualitas Udara_" + formatAwalTanggal + "_" + formatAkhirTanggal,
    scale: 1000,
    region: geometri,
    maxPixels: 1e10,
    fileFormat: "GeoTIFF",
  });

  // Membuat Label untuk Unduh Data melalui Link URL
  var urlLabel = ui.Label("Klik Link untuk mulai Unduh: ", {
    fontWeight: "bold",
  });
  var unduhLinkCO = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Karbon Monoksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlCO,
  });
  var unduhLinkNO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Nitrogen Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlNO2,
  });
  var unduhLinkSO2 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Sulfur Dioksida" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlSO2,
  });
  var unduhLinkO3 = ui.Label({
    value:
      "• Link Unduh Data Kualitas Polutan Ozon" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlO3,
  });
  var unduhLinkKualitasUdara = ui.Label({
    value:
      "• Link Unduh Data Kualitas Udara" + " " + "(" + formatAwalTanggal + ")" + "-" + "(" + formatAkhirTanggal + ")",
    targetUrl: unduhUrlKualitasUdara,
  });

  // Menghapus Widgets yang ada pada URL Panel
  urlPanel.clear();
  ui.root.remove(urlPanel);

  // Menampilkan URL Label Pada URL Panel untuk di-Unduh
  urlPanel.add(urlLabel);
  urlPanel.add(unduhLinkCO);
  urlPanel.add(unduhLinkNO2);
  urlPanel.add(unduhLinkSO2);
  urlPanel.add(unduhLinkO3);
  urlPanel.add(unduhLinkKualitasUdara);
  uiMap.remove(urlPanel);
  uiMap.add(urlPanel);
}

//############################# PENGATURAN FUNGSI GRAFIK DAN VISUALISASI CITRA HALAMAN BATAS ADMINISTRASI ######################################

// Fungsi untuk Membuat Grafik dan Visualisasi Konsentrasi Gas Polutan
var visualisasiGrafikCitraAdmin = function () {
  var geom = importBatasAdministrasiGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Set Parameter Tanggal dan Jenis Polutan
  setParamsAdmin();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");

  // Memilih Citra Sesuai dengan Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAdmin === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: col,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAdmin + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Melakukan Set Nilai Minimum dan Maksimum Citra
  var nilaiMin, nilaiMaks;
  switch (polutanTerpilihAdmin) {
    case "Karbon Monoksida":
      nilaiMin = 0;
      nilaiMaks = 0.05;
      break;
    case "Nitrogen Dioksida":
      nilaiMin = 0;
      nilaiMaks = 0.0002;
      break;
    case "Sulfur Dioksida":
      nilaiMin = 0.0;
      nilaiMaks = 0.0005;
      break;
    case "Ozon":
      nilaiMin = 0.112;
      nilaiMaks = 0.15;
      break;
  }

  // Melakukan Set Parameter Visualisasi Citra
  var parameterVis = {
    min: nilaiMin,
    max: nilaiMaks,
    palette: paletWarna,
  };

  // Pembuatan Thumbnail Time-Series untuk Visualisasi Citra secara Time-Series
  // Mengatur Fungsi DOY pada Citra untuk digabungkan
  col = col.map(function (img) {
    var doy = ee.Date(img.get("system:time_start")).getRelative("day", "year");
    return img.set("doy", doy);
  });

  // Mengatur Tanggal Citra dan Proses Penggabungannya sesuai dengan DOY
  var tanggalCitra = col.filterDate(formatAwalTanggal, formatAkhirTanggal);
  var filter = ee.Filter.equals({ leftField: "doy", rightField: "doy" });
  var gabung = ee.Join.saveAll("doy_matches");
  var gabungCol = ee.ImageCollection(gabung.apply(tanggalCitra, col, filter));

  // Melakukan Komputasi Penggabungan Citra sesuai Parameter yang ditentukan (DOY) dan melakukan Reducer
  var komputasiCitra = gabungCol.map(function (img) {
    var doyCol = ee.ImageCollection.fromImages(img.get("doy_matches"));
    return doyCol.reduce(ee.Reducer.mean());
  });

  // Membuat RGB Tampilan Visual Time-Series
  var rgbVis = komputasiCitra.map(function (img) {
    return img.visualize(parameterVis).clip(geometri);
  });

  // Membuat Parameter Visual Gif Time-Series
  var gifParams = {
    region: geometri,
    dimensions: 150,
    crs: "EPSG:4326",
    framesPerSecond: 10,
  };

  // Melakukan Render Thumbnail dan Tampilkan Hasilnya dalam Peta
  var thumbnailKonsentrasiAdmin = ui.Thumbnail(rgbVis, gifParams);

  thumbnailPanel.clear();
  thumbnailPanel.add(infoVisualisasiThumbnailLabel);
  thumbnailPanel.add(thumbnailKonsentrasiAdmin);
  uiMap.add(thumbnailPanel);

  // Menambahkan Citra Hasil Visualisasi Ke Peta
  uiMap.addLayer(col.mean().clip(geometri), parameterVis, namaLayer);
  
  // Menampilkan Batas Admin
  var emptyGeometri = ee.Image().byte();
  var outlineGeometri = emptyGeometri.paint({
    featureCollection: geometri,
    color: 1,
    width: 2});
  uiMap.addLayer(outlineGeometri, {palette: '000000'}, 'Batas Geometri');
  
  uiMap.centerObject(geometri);
  legendaPolutan(col);

  // Melakukan Return Grafik
  return chart;
};

// Fungsi untuk Visualisasi dan Membuat Grafik Time-Series
var visualisasiGrafikCitraKonversiAdmin = function () {
  var geom = importBatasAdministrasiGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi Parameter Waktu dan Jenis Polutan
  setParamsAdmin();

  // Mengubah Format Tanggal Menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAdmin === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }

  // Memilih Citra sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var polutanMean = hasilCitra.polutanMean;

  // Membuat Grafik Time-Series Rata-Rata Konsentrasi Polutan
  var chart = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: ee.FeatureCollection([feature]),
      reducer: ee.Reducer.mean(),
      scale: 1000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAdmin + " (µg/m³)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Melakukan Return Grafik
  return chart;
};

//############################# PENGATURAN FUNGSI KALKULASI KONSENTRASI POLUTAN HALAMAN ROI ######################################

// Fungsi Ekstraksi Nilai Konsentrasi dari Citra menggunakan Titik Koordinat
function grafikKoordinatAdmin() {
  var koordinatLonAdmin = parseFloat(lonAdminTextBox.getValue());
  var koordinatLatAdmin = parseFloat(latAdminTextBox.getValue());
  var poinAdmin = ee.Geometry.Point(koordinatLonAdmin, koordinatLatAdmin);
  var titik = ui.Map.Layer(poinAdmin, {color: '000000'}, 'Titik Lokasi/Koordinat');
  uiMap.layers().set(2, titik);
  
  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAdmin();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");

  // Memilih Citra Sesuai Parameter Terpilih
  var hasilCitra = handleCitra(formatAwalTanggal, formatAkhirTanggal);
  var col = hasilCitra.col;
  var polutanMean = hasilCitra.polutanMean;

  // Mengatur Nama Layer sesuai Parameter Terpilih
  var namaLayer;
  if (polutanTerpilihAdmin === "Karbon Monoksida") {
    namaLayer = "Konsentrasi Gas Karbon Monoksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
    namaLayer = "Konsentrasi Gas Nitrogen Dioksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
    namaLayer = "Konsentrasi Gas Sulfur Dioksida (mol/m²)";
  } else if (polutanTerpilihAdmin === "Ozon") {
    namaLayer = "Konsentrasi Gas Ozon (mol/m²)";
  } else {
    namaLayer = "Pilih Parameter Jenis Polutan";
  }
  
  var namaLayerKonversi;
  if (polutanTerpilihAdmin === "Karbon Monoksida") {
    namaLayerKonversi = "Konsentrasi Gas Karbon Monoksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Nitrogen Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Nitrogen Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Sulfur Dioksida") {
    namaLayerKonversi = "Konsentrasi Gas Sulfur Dioksida Terkonversi (µg/m³)";
  } else if (polutanTerpilihAdmin === "Ozon") {
    namaLayerKonversi = "Konsentrasi Gas Ozon Terkonversi (µg/m³)";
  } else {
    namaLayerKonversi = "Pilih Parameter Jenis Polutan";
  }

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan
  var grafikCitraAsliAdmin = ui.Chart.image
    .series({
      imageCollection: col,
      region: poinAdmin,
      reducer: ee.Reducer.mean(),
      scale: 10000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAdmin + " (mol/m²)"])
    .setOptions({
      title: namaLayer,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (mol/m²)",
      },
      lineWidth: 2,
      pointSize: 3,
    });

  // Membuat Grafik Time-Series Konsentrasi Gas Polutan Terkonversi
  var grafikCitraKonversiAdmin = ui.Chart.image
    .series({
      imageCollection: polutanMean,
      region: poinAdmin,
      reducer: ee.Reducer.mean(),
      scale: 10000,
    })
    .setChartType("LineChart")
    .setSeriesNames(["Konsentrasi Gas " + polutanTerpilihAdmin + " (µg/m³)"])
    .setOptions({
      title: namaLayerKonversi,
      interpolateNulls: true,
      bestEffort: true,
      maxPixels: 1e10,
      hAxis: {
        title: "Waktu",
      },
      vAxis: {
        title: "Konsentrasi Gas (µg/m³)",
      },
      lineWidth: 2,
      pointSize: 3,
    });
    
  // Menampilkan Grafik ke dalam Grafik Panel
  grafikPanel.widgets().set(0, grafikCitraAsliAdmin);
  grafikPanel.widgets().set(1, grafikCitraKonversiAdmin);
}

//############################# PENGATURAN FUNGSI ANALISIS KUALITAS UDARA MENGGUNAKAN CITRA HALAMAN BATAS ADMINISTRASI ######################################

// Fungsi untuk Analisis Kualitas Udara
function prosesAnalisisKualitasUdaraAdmin() {
  var geom = importBatasAdministrasiGeometri();
  var feature = ee.Feature(geom, {});

  // Memanggil Fungsi untuk set Parameter Waktu dan Jenis Polutan
  setParamsAdmin();

  // Mengubah Format Date Object menjadi Tahun-Bulan-Hari
  var formatAwalTanggal = awalWaktuAdmin.format("YYYY-MM-dd");
  var formatAkhirTanggal = akhirWaktuAdmin.format("YYYY-MM-dd");

  // Memanggil Koleksi Dataset dan Konversi Satuan CO
  var CO_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_CO")
    .select("CO_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiCO = (28.01 * 1e6) / 10000;
  var CO_MeanMikrogram = CO_Mean.multiply(faktorKonversiCO);

  // Memanggil Koleksi Dataset dan Konversi Satuan NO2
  var NO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2")
    .select("NO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiNO2 = (46.0055 * 1e6) / 10000;
  var NO2_MeanMikrogram = NO2_Mean.multiply(faktorKonversiNO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan SO2
  var SO2_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_SO2")
    .select("SO2_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiSO2 = (64.065 * 1e6) / 10000;
  var SO2_MeanMikrogram = SO2_Mean.multiply(faktorKonversiSO2);

  // Memanggil Koleksi Dataset dan Konversi Satuan O3
  var O3_Mean = ee
    .ImageCollection("COPERNICUS/S5P/OFFL/L3_O3")
    .select("O3_column_number_density")
    .filterDate(formatAwalTanggal, formatAkhirTanggal)
    .filterBounds(geometri)
    .mean()
    .clip(geometri);
  var faktorKonversiO3 = (47.997 * 1e6) / 10000;
  var O3_MeanMikrogram = O3_Mean.multiply(faktorKonversiO3);

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas CO
  var kelasCO = CO_MeanMikrogram.where(CO_MeanMikrogram.lte(13.38878), 1)
    .where(CO_MeanMikrogram.gt(13.38879).and(CO_MeanMikrogram.lte(26.69353)), 2)
    .where(CO_MeanMikrogram.gt(26.69354).and(CO_MeanMikrogram.lte(39.99828)), 3)
    .where(CO_MeanMikrogram.gt(39.99829).and(CO_MeanMikrogram.lte(69.99699)), 4)
    .where(CO_MeanMikrogram.gt(69.997), 5);
  uiMap.addLayer(
    kelasCO,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi CO"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas NO2
  var kelasNO2 = NO2_MeanMikrogram.where(NO2_MeanMikrogram.lte(0.1380165), 1)
    .where(NO2_MeanMikrogram.gt(0.1380166).and(NO2_MeanMikrogram.lte(0.2300275)), 2)
    .where(NO2_MeanMikrogram.gt(0.2300276).and(NO2_MeanMikrogram.lte(0.5060605)), 3)
    .where(NO2_MeanMikrogram.gt(0.5060606).and(NO2_MeanMikrogram.lte(1.196143)), 4)
    .where(NO2_MeanMikrogram.gt(1.196144), 5);
  uiMap.addLayer(
    kelasNO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi NO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas SO2
  var kelasSO2 = SO2_MeanMikrogram.where(SO2_MeanMikrogram.lte(0.192195), 1)
    .where(SO2_MeanMikrogram.gt(0.192196).and(SO2_MeanMikrogram.lte(0.38439)), 2)
    .where(SO2_MeanMikrogram.gt(0.38440).and(SO2_MeanMikrogram.lte(0.51252)), 3)
    .where(SO2_MeanMikrogram.gt(0.51253).and(SO2_MeanMikrogram.lte(1.2813)), 4)
    .where(SO2_MeanMikrogram.gt(1.2814), 5);
  uiMap.addLayer(
    kelasSO2,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi SO2"
  );

  // Melakukan Klasifikasi dan Visualisasi Kualitas Gas O3
  var kelasO3 = O3_MeanMikrogram.where(O3_MeanMikrogram.lte(0.47997), 1)
    .where(O3_MeanMikrogram.gt(0.47998).and(O3_MeanMikrogram.lte(1.007937)), 2)
    .where(O3_MeanMikrogram.gt(1.007938).and(O3_MeanMikrogram.lte(1.199925)), 3)
    .where(O3_MeanMikrogram.gt(1.199926).and(O3_MeanMikrogram.lte(1.583901)), 4)
    .where(O3_MeanMikrogram.gt(1.583902), 5);
  uiMap.addLayer(
    kelasO3,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi O3"
  );

  // Melakukan Overlay Parameter Kualitas Udara (CO, NO2, SO2, O3)
  var kualitasudara = kelasCO
    .add(kelasNO2)
    .add(kelasSO2)
    .add(kelasO3)
    .reduce(ee.Reducer.sum());

  // Melakukan Klasifikasi dan Visualisasi Kualitas Udara Hasil Overlay
  var kelasKualitasUdara = kualitasudara
    .where(kualitasudara.lte(4), 1)
    .where(kualitasudara.gt(4).and(kualitasudara.lte(8)), 2)
    .where(kualitasudara.gt(8).and(kualitasudara.lte(12)), 3)
    .where(kualitasudara.gt(12).and(kualitasudara.lte(16)), 4)
    .where(kualitasudara.gt(16), 5);
  uiMap.addLayer(
    kelasKualitasUdara,
    { min: 1, max: 5, palette: ["green", "blue", "yellow", "red", "black"] },
    "Klasifikasi Kualitas Udara"
  );
  
  // Menampilkan Batas Admin
  var emptyGeometri = ee.Image().byte();
  var outlineGeometri = emptyGeometri.paint({
    featureCollection: geometri,
    color: 1,
    width: 2});
  uiMap.addLayer(outlineGeometri, {palette: '000000'}, 'Batas Geometri');
  
  // Mengatur Zoom In Peta Sesuai Geometri 
  uiMap.centerObject(geometri);
  
  // Memanggil Fungsi Pembuatan Legenda Kualitas Udara
  legendaKualitasUdara();
}

// ############################# TAMPILAN PANEL PADA HALAMAN BATAS ADMINISTRASI ######################################

// Menyusun Tampilan Widgets Pada Panel Halaman Admin
var adminPanel = ui.Panel({
  widgets: [
    judulAdminLabel,
    infoAdminLabel,
    petunjukAdminButton,
    petunjukAdminPanel,
    peringatanAdminLabel,
    garisAdminSeparator1,
    infoParameterAdminLabel,
    waktuAdminButton,
    waktuAdminPanel,
    garisAdminSeparator2,
    jenisAdminButton,
    jenisAdminPanel,
    garisAdminSeparator3,
    areaAdminButton,
    areaAdminPanel,
    garisAdminSeparator4,
    komputasiAdminButton,
    komputasiAdminPanel,
    garisAdminSeparator5,
    kembaliAdminButton,
  ],
  style: {
    width: "21rem",
  },
});
