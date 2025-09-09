// src/components/Addresses/Addresses.jsx
import React, { useState, useEffect, useCallback } from "react";
import { UilPlus, UilTimes, UilEye } from "@iconscout/react-unicons";
import "./Addresses.css";

const EMPTY = {
  namaPenerima: "",
  noHp: "",
  alamatLengkap: "",
  provinsi: "",
  kabupatenKota: "",
  kecamatan: "",
  kelurahan: "",
  kodePos: "",
  isDefault: false,
};

const Addresses = () => {
  /* ---------- State ---------- */
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail]       = useState(null);   // objek alamat detail
  const [showDetail, setShowDetail] = useState(false);
  const [editId, setEditId] = useState(null); // ID alamat yang sedang diedit
  const [deleteId, setDeleteId] = useState(null); // ID yang akan dihapus



  /* ---------- Data wilayah (ibnux) -------------- */
  const [provinces, setProvinces] = useState([]);
  const [kabupaten, setKabupaten] = useState([]);
  const [kecamatan, setKecamatan] = useState([]);
  const [kelurahan, setKelurahan] = useState([]);

  const [provId, setProvId] = useState("");
  const [kabId, setKabId]   = useState("");
  const [kecId, setKecId]   = useState("");

  /* ---------- Ambil alamat dari backend ---------- */
  const token = localStorage.getItem("accessToken");

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/v1/users/addresses",
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat alamat");
      setAddresses(data.data.addresses || []);
    } catch (err) { alert(err.message); }
  }, [token]);

  /* --- NEW: ambil detail alamat --- */
  const fetchAddressDetail = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/v1/users/addresses/${id}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail alamat");
      setDetail(data.data.address);
      setShowDetail(true);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  /* ---------- Ambil provinsi sekali ---------- */
  useEffect(() => {
    fetch("https://ibnux.github.io/data-indonesia/provinsi.json")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => alert("Tidak bisa memuat provinsi"));
  }, []);

  /* ---------- Dropdown wilayah (sama seperti sebelumnya) ---------- */
  useEffect(() => {
    if (!provId) return;
    fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${provId}.json`)
      .then((r) => r.json())
      .then(setKabupaten)
      .catch(() => alert("Gagal memuat kabupaten/kota"));
    setKabId(""); setKecId("");
    setKecamatan([]); setKelurahan([]);
    setForm((f) => ({ ...f, kabupatenKota: "", kecamatan: "", kelurahan: "", kodePos: "" }));
  }, [provId]);

  useEffect(() => {
    if (!kabId) return;
    fetch(`https://ibnux.github.io/data-indonesia/kecamatan/${kabId}.json`)
      .then((r) => r.json())
      .then(setKecamatan)
      .catch(() => alert("Gagal memuat kecamatan"));
    setKecId(""); setKelurahan([]);
    setForm((f) => ({ ...f, kecamatan: "", kelurahan: "", kodePos: "" }));
  }, [kabId]);

  useEffect(() => {
    if (!kecId) return;
    fetch(`https://ibnux.github.io/data-indonesia/kelurahan/${kecId}.json`)
      .then((r) => r.json())
      .then(setKelurahan)
      .catch(() => alert("Gagal memuat kelurahan"));
    setForm((f) => ({ ...f, kelurahan: "" }));
  }, [kecId]);

  /* ---------- Form handlers ---------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `http://localhost:5000/v1/users/addresses/${editId}`
      : "http://localhost:5000/v1/users/addresses";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menyimpan alamat");

    alert(data.message);
    await fetchAddresses();
    setForm(EMPTY);
    setShowForm(false);
    setEditId(null); // reset mode edit
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

/* --- Jadikan alamat default --- */
const setAsDefault = async (id) => {
  try {
    const res = await fetch(
      `http://localhost:5000/v1/users/addresses/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memperbarui default");

    alert(data.message);
    await fetchAddresses();      // refresh list
  } catch (err) {
    alert(err.message);
  }
};

const handleDeleteAddress = async () => {
  if (!deleteId) return;
  try {
    const res = await fetch(
      `http://localhost:5000/v1/users/addresses/${deleteId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menghapus alamat");

    alert(data.message); // atau pakai toast jika tersedia
    await fetchAddresses();
    setDeleteId(null); // tutup modal
  } catch (err) {
    alert(err.message);
  }
};

  /* ---------- JSX ---------- */
  return (
    <div className="addresses-page">
      <div className="addresses-header">
        <h2>Daftar Alamat</h2>
        <button className="add-address-btn" onClick={() => setShowForm(true)}>
          <UilPlus /> Alamat Baru
        </button>
      </div>

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          {[
            ["namaPenerima", "Nama Penerima"],
            ["noHp", "No. HP"],
            ["alamatLengkap", "Alamat Lengkap"],
          ].map(([k, l]) => (
            <div className="form-row" key={k}>
              <label>{l}</label>
              <input name={k} value={form[k]} onChange={handleChange} required />
            </div>
          ))}

          {/* Provinsi */}
          <div className="form-row">
            <label>Provinsi</label>
            <select
              value={provId}
              onChange={(e) => {
                const id = e.target.value;
                setProvId(id);
                const p = provinces.find((v) => v.id === id);
                setForm((f) => ({ ...f, provinsi: p ? p.nama : "" }));
              }}
              required
            >
              <option value="">-- Pilih Provinsi --</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          {/* Kabupaten */}
          <div className="form-row">
            <label>Kabupaten/Kota</label>
            <select
              value={kabId}
              onChange={(e) => {
                const id = e.target.value;
                setKabId(id);
                const k = kabupaten.find((v) => v.id === id);
                setForm((f) => ({ ...f, kabupatenKota: k ? k.nama : "" }));
              }}
              disabled={!kabupaten.length}
              required
            >
              <option value="">-- Pilih Kabupaten/Kota --</option>
              {kabupaten.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Kecamatan */}
          <div className="form-row">
            <label>Kecamatan</label>
            <select
              value={kecId}
              onChange={(e) => {
                const id = e.target.value;
                setKecId(id);
                const kc = kecamatan.find((v) => v.id === id);
                setForm((f) => ({ ...f, kecamatan: kc ? kc.nama : "" }));
              }}
              disabled={!kecamatan.length}
              required
            >
              <option value="">-- Pilih Kecamatan --</option>
              {kecamatan.map((kc) => (
                <option key={kc.id} value={kc.id}>{kc.nama}</option>
              ))}
            </select>
          </div>

          {/* Kelurahan */}
          <div className="form-row">
            <label>Kelurahan</label>
            <select
              value={form.kelurahan}
              onChange={(e) =>
                setForm((f) => ({ ...f, kelurahan: e.target.value }))
              }
              disabled={!kelurahan.length}
              required
            >
              <option value="">-- Pilih Kelurahan --</option>
              {kelurahan.map((kel) => (
                <option key={kel.id} value={kel.nama}>{kel.nama}</option>
              ))}
            </select>
          </div>

          {/* Kode Pos (manual) */}
          <div className="form-row">
            <label>Kode Pos</label>
            <input
              name="kodePos"
              value={form.kodePos}
              onChange={handleChange}
              required
              placeholder="Masukkan kode pos"
            />
          </div>

          {/* Default */}
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
              /> Jadikan alamat default
            </label>
          </div>

          {/* Aksi */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => {
            setShowForm(false);
            setForm(EMPTY);
            setEditId(null);
            }}>
            <UilTimes /> Batal
            </button>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Menyimpan..." : editId ? "Perbarui" : "Simpan"}
            </button>
          </div>
        </form>
      )}

{/* Daftar alamat */}
<ul className="address-list">
  {addresses.map((a) => (
    <li key={a.id} className={`address-item ${a.is_default ? "default" : ""}`}>
      <h3>
        {a.nama_penerima}
        {a.is_default && <span className="badge">Default</span>}
       <button
         className="detail-btn"
         title="Lihat detail"
         onClick={() => fetchAddressDetail(a.id)}
       >
         <UilEye size="18" />
       </button>
       <button
        className="detail-btn"
        title="Edit alamat"
        onClick={() => {
            setForm({
            namaPenerima: a.nama_penerima,
            noHp: a.no_hp,
            alamatLengkap: a.alamat_lengkap,
            provinsi: a.provinsi,
            kabupatenKota: a.kabupaten_kota,
            kecamatan: a.kecamatan,
            kelurahan: a.kelurahan,
            kodePos: a.kode_pos,
            isDefault: a.is_default,
            });

            // preselect wilayah
            const prov = provinces.find((p) => p.nama === a.provinsi);
            const kab = kabupaten.find((k) => k.nama === a.kabupaten_kota);
            const kec = kecamatan.find((kc) => kc.nama === a.kecamatan);

            if (prov) setProvId(prov.id);
            if (kab) setKabId(kab.id);
            if (kec) setKecId(kec.id);

            setEditId(a.id);
            setShowForm(true);
        }}
        >
        Edit
        </button>

        {/* --- Tombol Jadikan Utama --- */}
    {!a.is_default && (
      <button
        className="default-btn"
        title="Jadikan alamat utama"
        onClick={() => setAsDefault(a.id)}
      >
        Utama
      </button>
    )}
    <button
        className="delete-btn"
        title="Hapus alamat"
        onClick={() => setDeleteId(a.id)}
        >
        Hapus
    </button>


      </h3>
      <p>{a.alamat_lengkap}, {a.kelurahan}</p>
      <p>{a.no_hp}</p>
    </li>
  ))}
</ul>
         {/* ===== Panel / Modal Detail ===== */}
      {showDetail && detail && (
        <div className="detail-modal">
          <div className="detail-content">
            <button className="close-detail" onClick={() => setShowDetail(false)}>
              <UilTimes />
            </button>
            <h3>Detail Alamat</h3>
            <p><strong>Nama Penerima:</strong> {detail.nama_penerima}</p>
            <p><strong>No HP:</strong> {detail.no_hp}</p>
            <p><strong>Alamat Lengkap:</strong> {detail.alamat_lengkap}</p>
            <p><strong>Kelurahan:</strong> {detail.kelurahan}</p>
            <p><strong>Kecamatan:</strong> {detail.kecamatan}</p>
            <p><strong>Kab/Kota:</strong> {detail.kabupaten_kota}</p>
            <p><strong>Provinsi:</strong> {detail.provinsi}</p>
            <p><strong>Kode Pos:</strong> {detail.kode_pos}</p>
            {detail.is_default && <p><em>Alamat default</em></p>}
          </div>
        </div>
      )}
      {deleteId && (
  <div className="confirm-delete-modal">
    <div className="confirm-delete-box">
      <p>Yakin ingin menghapus alamat ini?</p>
      <div className="modal-actions">
        <button className="cancel-btn" onClick={() => setDeleteId(null)}>Batal</button>
        <button className="delete-btn" onClick={handleDeleteAddress}>Hapus</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Addresses;
