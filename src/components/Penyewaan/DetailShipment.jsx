import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailShipment.css";
import { formatTanggalDanWaktuIndonesia } from "../../utils/datetimeIndonesia";

const API_HOST = "http://localhost:5000";

export default function DetailShipment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setError("");
        const res = await fetch(`${API_HOST}/v1/shipments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal memuat detail");
        setData(json.data.shipment);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchDetail();
  }, [id, token]);

  const getProofUrl = (url) =>
    !url ? "" : url.startsWith("http") ? url : `${API_HOST}${url}`;

  if (error)
    return (
      <div className="ship-detail-container">
        <p className="ship-error">{error}</p>
        <button onClick={() => navigate(-1)} className="ship-back-btn">
          Kembali
        </button>
      </div>
    );

  if (!data)
    return <div className="ship-detail-container">Memuat detail…</div>;

  const rows = [
    ["ID Pengiriman", data.id],
    ["Rental ID", data.rental_id],
    ["Alamat Pengiriman", data.full_address],
    ["Kurir / Layanan", `${data.courier_name} / ${data.courier_service}`],
    ["No. Resi", data.tracking_number || "-"],
    ["Status", data.shipping_status],
    ["Perkiraan Kirim", formatTanggalDanWaktuIndonesia(data.estimated_shipping_date)],
    ["Perkiraan Sampai", formatTanggalDanWaktuIndonesia(data.estimated_delivery_date)],
    ["Tgl Kirim Sebenarnya", data.actual_shipping_date ? formatTanggalDanWaktuIndonesia(data.actual_shipping_date) : "-"],
    ["Tgl Sampai Sebenarnya", data.actual_delivery_date ? formatTanggalDanWaktuIndonesia(data.actual_delivery_date) : "-"],
    ["Catatan", data.notes || "-"],
    ["Bukti Pengiriman", data.delivery_proof_url ? (
      <a href={getProofUrl(data.delivery_proof_url)} target="_blank" rel="noopener noreferrer">
        <img src={getProofUrl(data.delivery_proof_url)} alt="Bukti Pengiriman" className="ship-proof-img" />
      </a>
    ) : "-"],
    ["Dibuat", formatTanggalDanWaktuIndonesia(data.created_at)],
    ["Diperbarui", formatTanggalDanWaktuIndonesia(data.updated_at)],
  ];

  return (
    <div className="ship-detail-container">
      <h2 className="ship-detail-title">Detail Pengiriman</h2>
      <div className="ship-detail-table-wrapper">
        <table className="ship-detail-table">
          <tbody>
            {rows.map(([label, value], index) => (
              <tr key={index}>
                <td data-label={label}>{label}</td>
                <td data-label={label}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => navigate(-1)} className="ship-back-btn">Kembali</button>
    </div>
  );
}
