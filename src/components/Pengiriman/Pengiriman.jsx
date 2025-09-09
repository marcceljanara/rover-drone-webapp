import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Pengiriman.css";

const API = "http://localhost:5000/v1/shipments";
const itemsPerPage = 5;

export default function Shipments() {
  const token = localStorage.getItem("accessToken");
  const [shipments, setShipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memuat pengiriman");

        // Urutkan dari terbaru ke terlama
        const sortedShipments = (data.data.shipments || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setShipments(sortedShipments);
      } catch (e) {
        setError(e.message);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, [token]);

  const filtered = shipments.filter((s) => {
    const query = searchTerm.toLowerCase();
    return (
      s.id.toLowerCase().includes(query) ||
      s.courier_name?.toLowerCase().includes(query) ||
      s.tracking_number?.toLowerCase().includes(query) ||
      s.shipping_status?.toLowerCase().includes(query) ||
      new Date(s.created_at).toLocaleDateString("id-ID").includes(query)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="ship-container">
      <h1 className="ship-title">Daftar Pengiriman</h1>

      <div className="ship-filter">
        <input
          type="text"
          placeholder="Cari ID, Kurir, Resi, Status, Tanggal Buat"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="ship-table-wrapper">
        {error && <p className="ship-error">{error}</p>}

        <table className="ship-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID Pengiriman</th>
              <th>Kurir / Layanan</th>
              <th>Resi</th>
              <th>Status</th>
              <th>Tanggal Buat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="ship-loading">Memuat…</td>
              </tr>
            ) : currentData.length ? (
              currentData.map((s, i) => (
                <tr key={s.id}>
                  <td data-label="#"> {startIndex + i + 1} </td>
                  <td data-label="ID Pengiriman">
                    <button
                      onClick={() => navigate(`/pengiriman/${s.rental_id}`)}
                      className="ship-link"
                    >
                      {s.id}
                    </button>
                  </td>
                  <td data-label="Kurir / Layanan">
                    {s.courier_name} / {s.courier_service}
                  </td>
                  <td data-label="Resi">{s.tracking_number || "-"}</td>
                  <td data-label="Status">{s.shipping_status}</td>
                  <td data-label="Tanggal Buat">
                    {new Date(s.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="ship-empty">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ship-pagination">
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
          ←
        </button>
        <span>Halaman {currentPage} dari {totalPages || 1}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          → 
        </button>
      </div>
    </div>
  );
}
