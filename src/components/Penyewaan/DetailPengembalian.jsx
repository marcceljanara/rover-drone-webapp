import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailPengembalian.css";
import { formatTanggalDanWaktuIndonesia } from "../../utils/datetimeIndonesia";

const API_RETURNS   = "http://localhost:5000/v1/returns";
const API_ADDRESSES = "http://localhost:5000/v1/users/addresses";

export default function DetailReturnsUser() {
  const { id } = useParams();
  const navigate     = useNavigate();
  const token        = localStorage.getItem("accessToken");

  const [data,       setData]          = useState(null);
  const [error,      setError]         = useState("");

  /* ===== ganti alamat ===== */
  const [addrMode,   setAddrMode]      = useState(false);
  const [addresses,  setAddresses]     = useState([]);
  const [addrLoad,   setAddrLoad]      = useState(false);
  const [addrError,  setAddrError]     = useState("");
  const [selectedId, setSelectedId]    = useState("");

  /* ---------- fetch detail ---------- */
  const fetchDetail = useCallback(async () => {
    try {
      setError("");
      const res  = await fetch(`${API_RETURNS}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memuat detail");
      setData(json.data.return);
    } catch (e) {
      setError(e.message);
      setData(null);
    }
  }, [id, token]);

  /* ---------- fetch addresses when addrMode opened ---------- */
  const fetchAddresses = useCallback(async () => {
    try {
      setAddrError(""); setAddrLoad(true);
      const res  = await fetch(API_ADDRESSES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memuat daftar alamat");
      setAddresses(json.data.addresses || []);
    } catch (e) {
      setAddrError(e.message);
    } finally {
      setAddrLoad(false);
    }
  }, [token]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const startAddrEdit = () => {
    setSelectedId(data?.pickup_address_id || "");
    setAddrMode(true);
    if (addresses.length === 0) fetchAddresses();
  };

  /* ---------- simpan alamat ---------- */
  const handleAddrSave = async () => {
    try {
      if (!selectedId) return alert("Pilih alamat terlebih dahulu");
      const res  = await fetch(`${API_RETURNS}/${id}/address`, {
        method : "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newAddressId: selectedId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui alamat");
      alert(json.message || "Alamat penjemputan berhasil diperbarui");
      setAddrMode(false);
      fetchDetail();        // refresh detail
    } catch (e) {
      alert(e.message);
    }
  };

  const fmt = (t) => (t ? formatTanggalDanWaktuIndonesia(t) : "-");

  return (
    <div className="ret-detail-container">
      <h2 className="ret-detail-title">Detail Pengembalian</h2>

      {/* ===== pesan umum ===== */}
      {error ? (
        <p className="ret-error">{error}</p>
      ) : !data ? (
        <p className="ret-loading">Memuat detail…</p>
      ) : (
        <>
          {/* ===== tabel detail ===== */}
          <div className="ret-detail-table-wrapper">
            <table className="ret-detail-table">
              <tbody>
                <tr><td>ID Pengembalian</td><td>{data.id}</td></tr>
                <tr><td>Rental ID</td><td>{data.rental_id}</td></tr>
                <tr><td>Status</td><td>{data.status}</td></tr>
                <tr><td>Kurir / Layanan</td><td>{`${data.courier_name || "-"} / ${data.courier_service || "-"}`}</td></tr>
                <tr><td>No. Resi</td><td>{data.tracking_number || "-"}</td></tr>
                <tr><td>Alamat Lengkap</td><td>{data.full_address || "-"}</td></tr>
                <tr><td>Tanggal Dijemput</td><td>{fmt(data.picked_up_at)}</td></tr>
                <tr><td>Tanggal Dikembalikan</td><td>{fmt(data.returned_at)}</td></tr>
                <tr><td>Catatan</td><td>{data.notes || "-"}</td></tr>
                <tr><td>Dibuat</td><td>{fmt(data.created_at)}</td></tr>
                <tr><td>Diperbarui</td><td>{fmt(data.updated_at)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* ===== aksi ganti alamat ===== */}
          <div className="ret-detail-actions">
            {addrMode ? (
              <>
                {addrLoad ? (
                  <span className="ret-loading">Memuat daftar alamat…</span>
                ) : addrError ? (
                  <span className="ret-error">{addrError}</span>
                ) : (
                  <select
                    className="ret-inline-input"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">— pilih alamat —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {`${a.nama_penerima} • ${a.alamat_lengkap}, ${a.kelurahan}${a.is_default ? " (default)" : ""}`}
                      </option>
                    ))}
                  </select>
                )}

                <button className="ret-save-btn"   onClick={handleAddrSave}>Simpan Alamat</button>
                <button className="ret-cancel-btn" onClick={() => setAddrMode(false)}>Batal</button>
              </>
            ) : (
              <button className="ret-edit-btn" onClick={startAddrEdit}>
                Ganti Alamat Penjemputan
              </button>
            )}
          </div>
        </>
      )}

      <button onClick={() => navigate(-1)} className="ret-back-btn">
        Kembali
      </button>
    </div>
  );
}
