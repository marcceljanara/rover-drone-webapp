import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailPengiriman.css";
import { formatTanggalDanWaktuIndonesia } from "../../utils/datetimeIndonesia";

const BASE = "http://localhost:5000";

export default function DetailPengiriman() {
  const { rentalId } = useParams();     // ← param di <Route path="/pengiriman/:rentalId" ... />
  const navigate    = useNavigate();
  const token       = localStorage.getItem("accessToken");

  /* ──────────── state ──────────── */
  const [data,        setData]        = useState(null);
  const [shipmentId,  setShipmentId]  = useState("");
  const [error,       setError]       = useState("");

  /* edit kurir/resi */
  const [editMode,    setEditMode]    = useState(false);
  const [draft,       setDraft]       = useState({
    courierName: "", courierService: "", trackingNumber: "", notes: ""
  });

  /* edit status */
  const [statusMode,  setStatusMode]  = useState(false);
  const [statusDraft, setStatusDraft] = useState("");

  // Upload Bukti Pengiriman
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);


  /* ──────────── ambil detail pertama kali ──────────── */
  const fetchDetail = useCallback(async () => {
    try {
      setError("");
      const res  = await fetch(
        `hhttp://localhost:5000/v1/shipments/${rentalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memuat detail");

      const s = json.data.shipment;
      setData(s);
      setShipmentId(s.id);
      setDraft({
        courierName   : s.courier_name    || "",
        courierService: s.courier_service || "",
        trackingNumber: s.tracking_number || "",
        notes         : s.notes           || "",
      });
      setStatusDraft(s.shipping_status);
    } catch (e) {
      setError(e.message); setData(null);
    }
  }, [rentalId, token]);

  useEffect(() => { fetchDetail(); }, [fetchDetail, rentalId, token]);

  /* ──────────── aksi penyimpanan ──────────── */
  const handleInfoSave = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/v1/shipments/${shipmentId}/info`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui");
      alert(json.message || "Info kurir/resi diperbarui");
      setEditMode(false);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  const handleStatusSave = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/v1/shipments/${shipmentId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body  : JSON.stringify({ status: statusDraft }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui status");
      alert(json.message || "Status berhasil diperbarui");
      setStatusMode(false);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  /* ───── konfirmasi tanggal KIRIM aktual ───── */
  const handleKonfirmasiTanggalKirim = async () => {
    const now = new Date().toISOString().slice(0,19).replace("T"," ");
    try {
      const res = await fetch(
        `http://localhost:5000/v1/shipments/${shipmentId}/actual-shipping`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ date: now }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal konfirmasi kirim");
      alert(json.message);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  /* ───── konfirmasi tanggal SAMPAI aktual ───── */
  const handleKonfirmasiTanggalSampai = async () => {
    const now = new Date().toISOString().slice(0,19).replace("T"," ");
    try {
      const res = await fetch(
        `http://localhost:5000/v1/shipments/${shipmentId}/actual-delivery`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ date: now }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal konfirmasi sampai");
      alert(json.message);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  // Upload bukti pengiriman
  const handleUploadProof = async () => {
  if (!selectedFile) {
    alert("Pilih file gambar terlebih dahulu");
    return;
  }

  const formData = new FormData();
  formData.append("photo", selectedFile);

  try {
    setUploading(true);
    const res = await fetch(
      `http://localhost:5000/v1/shipments/${shipmentId}/delivery-proof`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal upload bukti pengiriman");
    alert(json.message || "Upload berhasil");
    setSelectedFile(null);
    fetchDetail();
  } catch (e) {
    alert(e.message);
  } finally {
    setUploading(false);
  }
};


  /* ──────────── tampilan ──────────── */
  return (
    <div className="ship-detail-container">
      <h2 className="ship-detail-title">Detail Pengiriman</h2>

      {error ? (
        <p className="ship-error">{error}</p>
      ) : !data ? (
        <p className="ship-loading">Memuat detail…</p>
      ) : (
        <>
          <div className="ship-detail-table-wrapper">
            <table className="ship-detail-table">
              <tbody>
                <tr><td>ID Pengiriman</td><td>{data.id}</td></tr>
                <tr><td>Rental ID</td><td>{data.rental_id}</td></tr>
                <tr><td>Nama Penerima</td><td>{data.nama_penerima}</td></tr>
                <tr><td>Nomor Telepon</td><td>{data.no_hp}</td></tr>
                <tr><td>Alamat Pengiriman</td><td>{data.full_address}</td></tr>

                {/* kurir / layanan */}
                <tr>
                  <td>Kurir / Layanan</td>
                  <td>
                    {editMode ? (
                      <>
                        <input value={draft.courierName}
                               onChange={e=>setDraft({...draft,courierName:e.target.value})}
                               className="ship-inline-input" />
                        {" / "}
                        <input value={draft.courierService}
                               onChange={e=>setDraft({...draft,courierService:e.target.value})}
                               className="ship-inline-input" />
                      </>
                    ) : `${data.courier_name} / ${data.courier_service}`}
                  </td>
                </tr>

                {/* resi */}
                <tr>
                  <td>No. Resi</td>
                  <td>
                    {editMode ? (
                      <input value={draft.trackingNumber}
                             onChange={e=>setDraft({...draft,trackingNumber:e.target.value})}
                             className="ship-inline-input" />
                    ) : (data.tracking_number || "-")}
                  </td>
                </tr>

                {/* status */}
                <tr>
                  <td>Status</td>
                  <td>
                    {statusMode ? (
                      <select value={statusDraft}
                              onChange={e=>setStatusDraft(e.target.value)}
                              className="ship-inline-input">
                        {["waiting","packed","shipped","delivered","failed"].map(s=>(
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : data.shipping_status}
                  </td>
                </tr>

                {/* tanggal2 */}
                <tr><td>Perkiraan Kirim</td><td>{formatTanggalDanWaktuIndonesia(data.estimated_shipping_date)}</td></tr>
                <tr><td>Perkiraan Sampai</td><td>{formatTanggalDanWaktuIndonesia(data.estimated_delivery_date)}</td></tr>

                <tr>
                  <td>Tgl Kirim Sebenarnya</td>
                  <td>
                    {data.actual_shipping_date
                      ? formatTanggalDanWaktuIndonesia(data.actual_shipping_date)
                      : <button className="ship-confirm-btn"
                                onClick={handleKonfirmasiTanggalKirim}>
                          Konfirmasi Tanggal Kirim
                        </button>}
                  </td>
                </tr>

                <tr>
                  <td>Tgl Sampai Sebenarnya</td>
                  <td>
                    {data.actual_delivery_date
                      ? formatTanggalDanWaktuIndonesia(data.actual_delivery_date)
                      : <button className="ship-confirm-btn"
                                onClick={handleKonfirmasiTanggalSampai}>
                          Konfirmasi Tanggal Sampai
                        </button>}
                  </td>
                </tr>

                {/* catatan */}
                <tr>
                  <td>Catatan</td>
                  <td>
                    {editMode ? (
                      <textarea rows={2}
                                value={draft.notes}
                                onChange={e=>setDraft({...draft,notes:e.target.value})}
                                className="ship-inline-input" />
                    ) : (data.notes || "-")}
                  </td>
                </tr>

                  {/* ====== Bukti Pengiriman ====== */}
                  <tr>
                    <td>Bukti Pengiriman</td>
                    <td>
                      {data.delivery_proof_url ? (           /* ← cek benar-benar ada */
                        <>
                          <a
                            href={`${BASE}${data.delivery_proof_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`${BASE}${data.delivery_proof_url}`}
                              alt="Bukti Pengiriman"
                              style={{
                                width: "120px",
                                height: "auto",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                            />
                          </a>
                        </>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            style={{ marginBottom: "6px" }}
                          />
                          <br />
                          <button
                            onClick={handleUploadProof}
                            className="ship-upload-btn"
                            disabled={uploading}
                          >
                            {uploading ? "Mengunggah..." : "Upload Bukti"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>



                <tr><td>Dibuat</td><td>{formatTanggalDanWaktuIndonesia(data.created_at)}</td></tr>
                <tr><td>Diperbarui</td><td>{formatTanggalDanWaktuIndonesia(data.updated_at)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* tombol aksi */}
          <div className="ship-detail-actions">
            {editMode ? (
              <>
                <button className="ship-save-btn" onClick={handleInfoSave}>Simpan Info</button>
                <button className="ship-cancel-btn" onClick={()=>setEditMode(false)}>Batal</button>
              </>
            ) : (
              <button className="ship-edit-btn"  onClick={()=>setEditMode(true)}>Edit Info</button>
            )}

            {statusMode ? (
              <>
                <button className="ship-save-btn" onClick={handleStatusSave}>Simpan Status</button>
                <button className="ship-cancel-btn" onClick={()=>setStatusMode(false)}>Batal</button>
              </>
            ) : (
              <button className="ship-edit-btn"  onClick={()=>setStatusMode(true)}>Ubah Status</button>
            )}
          </div>
        </>
      )}

      <button onClick={()=>navigate(-1)} className="ship-back-btn">Kembali</button>
    </div>
  );
}
