import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Returns.css";

const API = "http://localhost:5000/v1/returns";

export default function Returns() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchAllReturns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReturns(data.data.returns || []);
    } catch (e) {
      setError(e.message || "Gagal memuat daftar pengembalian");
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllReturns();
  }, [fetchAllReturns]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = returns.filter((r) =>
      `${r.id} ${r.rental_id} ${r.courier_name} ${r.tracking_number} ${r.status} ${r.created_at}`
        .toLowerCase()
        .includes(term)
    );
    setFilteredReturns(filtered);
    setCurrentPage(1);
  }, [searchTerm, returns]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

  return (
    <div className="ret-container">
      <h1 className="ret-title">Daftar Pengembalian</h1>

      <div className="ret-filter">
        <input
          type="text"
          placeholder="Cari berdasarkan ID, Rental ID, Kurir, Resi, Status, Tanggal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="ret-table-wrapper">
        {error && <p className="ret-error">{error}</p>}

        <table className="ret-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID Pengembalian</th>
              <th>Rental ID</th>
              <th>Kurir</th>
              <th>Resi</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="ret-loading">Memuat…</td>
              </tr>
            ) : currentItems.length ? (
              currentItems.map((r, i) => (
                <tr key={r.id}>
                  <td data-label="#">{indexOfFirstItem + i + 1}</td>
                  <td data-label="ID Pengembalian">
                    <span
                      onClick={() => navigate(`/returns/${r.rental_id}`)}
                      className="ret-link"
                    >
                      {r.id}
                    </span>
                  </td>
                  <td data-label="Rental ID">{r.rental_id}</td>
                  <td data-label="Kurir">{r.courier_name}</td>
                  <td data-label="Resi">{r.tracking_number}</td>
                  <td data-label="Status">{r.status}</td>
                  <td data-label="Created">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="ret-empty">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination SELALU tampil, tapi hanya aktif jika data > 5 */}
        <div className="ret-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || filteredReturns.length <= itemsPerPage}
          >
            ←
          </button>
          <span className="page-number">
            Halaman {String(currentPage).padStart(2, "0")}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || filteredReturns.length <= itemsPerPage}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
