import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTanggalIndonesia, formatTanggalDanWaktuIndonesia } from '../../utils/datetimeIndonesia';
import './Reports.css';

const itemsPerPage = 5;

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const [glowingButton, setGlowingButton] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  const fetchReports = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:5000/v1/reports', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal memuat data laporan');

      // Ambil data + sortir berdasarkan tanggal laporan terbaru
      const data = (result.data.reports || [])
        .map((report) => ({
          id: report.id,
          reportDate: report.report_date,
          totalTransactions: report.total_transactions,
          startDate: report.start_date,
          endDate: report.end_date,
        }))
        .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));

      setReports(data);
    } catch (error) {
      alert(`Gagal memuat laporan: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAdd = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:5000/v1/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menambahkan laporan');

      setNotification(result.message || 'Laporan berhasil ditambahkan');
      setTimeout(() => setNotification(null), 3000);
      setShowAddModal(false);
      setStartDate('');
      setEndDate('');
      await fetchReports();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:5000/v1/reports/${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menghapus laporan');

      setNotification(result.message || 'Laporan berhasil dihapus');
      setTimeout(() => setNotification(null), 3000);
      setShowDeleteModal(false);
      setDeleteId(null);
      await fetchReports();
    } catch (error) {
      alert(`Gagal menghapus: ${error.message}`);
      setShowDeleteModal(false);
    }
  };

  const handleGlow = (buttonType) => {
    setGlowingButton(buttonType);
    setTimeout(() => setGlowingButton(null), 1000);
  };

  const filteredData = reports.filter((item) =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container">
      <h2>Daftar Laporan Keuangan</h2>
      <div className="search-add-bar">
        <input
          type="text"
          placeholder="Cari ID Laporan"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={`add-btn ${glowingButton === 'add' ? 'glow' : ''}`}
          onClick={() => {
            setShowAddModal(true);
            handleGlow('add');
          }}
        >
          + Buat Laporan
        </button>
      </div>

      {notification && <div className="notification">{notification}</div>}

      <div className="table-wrapper">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tanggal Laporan</th>
              <th>Total Transaksi</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Akhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id}>
                <td data-label="ID" className="clickable-id" onClick={() => navigate(`/reports/${item.id}`)}>{item.id}</td>
                <td data-label="Tanggal Laporan">{formatTanggalDanWaktuIndonesia(item.reportDate)}</td>
                <td data-label="Total Transaksi">{item.totalTransactions}</td>
                <td data-label="Tanggal Mulai">{formatTanggalIndonesia(item.startDate)}</td>
                <td data-label="Tanggal Akhir">{formatTanggalIndonesia(item.endDate)}</td>
                <td data-label="Aksi">
                  <button className="delete-btn" onClick={() => confirmDelete(item.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <span>
          Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length}
        </span>
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ←
          </button>
          <span className="page-number">Halaman {String(currentPage).padStart(2, '0')}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      </div>

      {/* Modal Tambah */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Buat Laporan Baru</h3>
            <label>Tanggal Mulai:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label>Tanggal Akhir:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="modal-actions">
              <button onClick={handleAdd} className="add-btn">Buat</button>
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Konfirmasi Hapus</h3>
            <p>Apakah kamu yakin ingin menghapus laporan ini?</p>
            <div className="modal-actions">
              <button onClick={handleDelete} className="delete-btn">Hapus</button>
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
