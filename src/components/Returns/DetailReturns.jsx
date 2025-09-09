import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailReturns.css";
import { formatTanggalDanWaktuIndonesia } from "../../utils/datetimeIndonesia";

const API = "http://localhost:5000/v1/returns";

export default function DetailReturns() {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [editMode,   setEditMode]   = useState(false);   // edit info kurir
  const [statusMode, setStatusMode] = useState(false);   // edit status

  /* ==== state tambahan ==== */
  const [noteMode, setNoteMode]   = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const [form, setForm] = useState({
    courierName: "", courierService: "", trackingNumber: "",
    pickedUpAt : "", returnedAt   : ""
  });
  const [statusDraft, setStatusDraft] = useState("");

  /* ---------- fetch detail ---------- */
  const fetchDetail = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`${API}/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memuat detail");

      const r = json.data.return;
      setData(r);
      setNoteDraft(r.notes || "");
      setForm({
        courierName   : r.courier_name    || "",
        courierService: r.courier_service || "",
        trackingNumber: r.tracking_number || "",
        pickedUpAt    : r.picked_up_at ? r.picked_up_at.slice(0, 16) : "",
        returnedAt    : r.returned_at ? r.returned_at.slice(0, 16) : "",
      });
      setStatusDraft(r.status);
    } catch (e) {
      setError(e.message); setData(null);
    }
  }, [rentalId, token]);

  useEffect(() => { fetchDetail(); }, [fetchDetail, rentalId, token]);

  /* ---------- helpers ---------- */
  const fmt = (t) => (t ? formatTanggalDanWaktuIndonesia(t) : "-");
  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ---------- save info kurir ---------- */
  const handleInfoSave = async () => {
    try {
      const res = await fetch(`${API}/${data.id}`, {
        method : "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body   : JSON.stringify({
          courierName   : form.courierName,
          courierService: form.courierService,
          trackingNumber: form.trackingNumber,
          pickedUpAt    : form.pickedUpAt ? new Date(form.pickedUpAt).toISOString() : null,
          returnedAt    : form.returnedAt ? new Date(form.returnedAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui data");
      alert(json.message || "Berhasil diperbarui");
      setEditMode(false);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  /* ---------- save status ---------- */
  const handleStatusSave = async () => {
    try {
      const res = await fetch(`${API}/${data.id}/status`, {
        method : "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body   : JSON.stringify({ status: statusDraft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui status");
      alert(json.message || "Status berhasil diperbarui");
      setStatusMode(false);
      fetchDetail();
    } catch (e) { alert(e.message); }
  };

  /* ===== handler simpan catatan ===== */
const handleNoteSave = async () => {
  try {
    const res = await fetch(`${API}/${data.id}/note`, {
      method : "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note: noteDraft }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal memperbarui catatan");
    alert(json.message || "Catatan berhasil disimpan");
    setNoteMode(false);
    fetchDetail();
  } catch (e) {
    alert(e.message);
  }
};

  /* ---------- UI ---------- */
  return (
    <div className="ret-detail-container">
      <h2 className="ret-detail-title">Detail Pengembalian</h2>

      {error ? (
        <p className="ret-error">{error}</p>
      ) : !data ? (
        <p className="ret-loading">Memuat detail…</p>
      ) : (
        <div className="ret-detail-table-wrapper">
          <table className="ret-detail-table">
            <tbody>
              <tr><td>ID Pengembalian</td><td>{data.id}</td></tr>
              <tr><td>Rental ID</td><td>{data.rental_id}</td></tr>

              {/* ===== Status ===== */}
              <tr>
                <td>Status</td>
                <td>
                  {statusMode ? (
                    <select
                      className="ret-inline-input"
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                    >
                      {["requested","returning","returned","failed"].map((s)=>(
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : data.status}
                </td>
              </tr>

              {/* ===== Kurir & Resi ===== */}
              <tr>
                <td>Kurir / Layanan</td>
                <td>
                  {editMode ? (
                    <>
                      <input
                        className="ret-inline-input"
                        value={form.courierName}
                        onChange={(e) => handleChange("courierName", e.target.value)}
                        placeholder="Kurir"
                      />{" / "}
                      <input
                        className="ret-inline-input"
                        value={form.courierService}
                        onChange={(e) => handleChange("courierService", e.target.value)}
                        placeholder="Layanan"
                      />
                    </>
                  ) : `${data.courier_name || "-"} / ${data.courier_service || "-"}`}
                </td>
              </tr>

              <tr>
                <td>No. Resi</td>
                <td>
                  {editMode ? (
                    <input
                      className="ret-inline-input"
                      value={form.trackingNumber}
                      onChange={(e) => handleChange("trackingNumber", e.target.value)}
                    />
                  ) : data.tracking_number || "-"}
                </td>
              </tr>

              {/* ===== Info lainnya ===== */}
              <tr><td>Metode Pick-up</td>     <td>{data.pickup_method   || "-"}</td></tr>
              <tr><td>ID Alamat Pick-up</td>  <td>{data.pickup_address_id|| "-"}</td></tr>
              <tr><td>Nama Penerima</td>      <td>{data.nama_penerima   || "-"}</td></tr>
              <tr><td>No HP</td>              <td>{data.no_hp           || "-"}</td></tr>
              <tr><td>Alamat Lengkap</td>     <td>{data.full_address    || "-"}</td></tr>

              {/* ===== Tanggal ===== */}
              <tr>
                <td>Tanggal Dijemput</td>
                <td>
                  {editMode ? (
                    <input
                      type="datetime-local"
                      className="ret-inline-input"
                      value={form.pickedUpAt}
                      onChange={(e) => handleChange("pickedUpAt", e.target.value)}
                    />
                  ) : fmt(data.picked_up_at)}
                </td>
              </tr>

              <tr>
                <td>Tanggal Dikembalikan</td>
                <td>
                  {editMode ? (
                    <input
                      type="datetime-local"
                      className="ret-inline-input"
                      value={form.returnedAt}
                      onChange={(e) => handleChange("returnedAt", e.target.value)}
                    />
                  ) : fmt(data.returned_at)}
                </td>
              </tr>

              <tr>
                <td>Catatan</td>
                <td>
                    {noteMode ? (
                    <textarea
                        rows={3}
                        className="ret-inline-input"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                    />
                    ) : (data.notes || "-")}
                </td>
                </tr>

              <tr><td>Dibuat</td>  <td>{fmt(data.created_at)}</td></tr>
              <tr><td>Diperbarui</td><td>{fmt(data.updated_at)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Tombol Aksi ===== */}
      {data && (
        <div className="ret-detail-actions">
          {/* edit info kurir/resi */}
          {editMode ? (
            <>
              <button className="ret-save-btn"   onClick={handleInfoSave}>Simpan Info</button>
              <button className="ret-cancel-btn" onClick={()=>setEditMode(false)}>Batal</button>
            </>
          ) : (
            <button className="ret-edit-btn" onClick={()=>setEditMode(true)}>
              Edit Info Pengembalian
            </button>
          )}

          {/* edit status */}
          {statusMode ? (
            <>
              <button className="ret-save-btn"   onClick={handleStatusSave}>Simpan Status</button>
              <button className="ret-cancel-btn" onClick={()=>setStatusMode(false)}>Batal</button>
            </>
          ) : (
            <button className="ret-edit-btn" onClick={()=>setStatusMode(true)}>
              Ubah Status
            </button>
          )}
          {/* edit catatan */}
            {noteMode ? (
            <>
                <button className="ret-save-btn"   onClick={handleNoteSave}>Simpan Catatan</button>
                <button className="ret-cancel-btn" onClick={()=>setNoteMode(false)}>Batal</button>
            </>
            ) : (
            <button className="ret-edit-btn" onClick={()=>setNoteMode(true)}>
                Ubah / Tambah Catatan
            </button>
            )}

        </div>
      )}

      <button onClick={()=>navigate(-1)} className="ret-back-btn">
        Kembali
      </button>
    </div>
  );
}
