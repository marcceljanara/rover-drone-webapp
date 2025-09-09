import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Penyewaan.css';
import './Pengajuan.css';

function KelolaPenyewaan() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('accessToken');

  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'start_date', label: 'Tanggal Mulai' },
    { key: 'end_date', label: 'Tanggal Berakhir' },
    { key: 'rental_status', label: 'Status' },
    { key: 'total_cost', label: 'Biaya (Rp)' },
    { key: 'action', label: 'Aksi' },
  ];

  // Mapping status API → bahasa Indonesia
  const statusMap = {
    active: 'Sedang disewa',
    pending: 'Menunggu konfirmasi',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
    'awaiting-return': 'Menunggu Pengembalian',
  };

  // Fungsi helper untuk sort data terbaru -> lama
  const sortByStartDateDesc = (arr) =>
    [...arr].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  useEffect(() => {
    if (!token) {
      setError('Token tidak ditemukan. Silakan login terlebih dahulu.');
      setLoading(false);
      return;
    }

    const fetchRentals = async () => {
      try {
        const response = await fetch('http://localhost:5000/v1/rentals', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Gagal memuat data penyewaan.');

        setData(sortByStartDateDesc(result.data?.rentals || []));
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [token]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleAction = async (id) => {
    if (!token) return;
    try {
      const isAdmin = role === 'admin';
      const url = isAdmin
        ? `http://localhost:5000/v1/rentals/${id}`
        : `hhttp://localhost:5000/v1/rentals/${id}/cancel`;

      const options = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: !isAdmin ? JSON.stringify({ rentalStatus: 'cancelled' }) : null,
      };

      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mengubah status sewa.');

      setNotification(result.message);
      setShowNotification(true);

      setData((prev) =>
        sortByStartDateDesc(
          isAdmin
            ? prev.filter((item) => item.id !== id)
            : prev.map((item) =>
                item.id === id ? { ...item, rental_status: 'cancelled' } : item
              )
        )
      );
    } catch (err) {
      setNotification(err.message);
      setShowNotification(true);
    }
  };

  const handleComplete = async (id) => {
    if (!token) return;
    try {
      const response = await fetch(
        `http://localhost:5000/v1/rentals/${id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rentalStatus: 'completed' }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menyelesaikan sewa.');

      setNotification(result.message);
      setShowNotification(true);

      setData((prev) =>
        sortByStartDateDesc(
          prev.map((item) =>
            item.id === id ? { ...item, rental_status: 'completed' } : item
          )
        )
      );
    } catch (err) {
      setNotification(err.message);
      setShowNotification(true);
    }
  };

  const filteredData = data.filter((item) =>
    item.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <main className="container" role="main">
      <h2 className="page-title">Kelola Penyewaan Rover Drone</h2>

      <div className="search-add-bar">
        <input
          type="text"
          placeholder="Cari ID Penyewaan"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        {role === 'user' && (
          <button className="add-btn" onClick={() => navigate('/penyewaan/lanjutan')}>
            + Ajukan Penyewaan Baru
          </button>
        )}
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : error ? (
        <div className="notification error">{error}</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {allColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id}>
                    {allColumns.map((col) => {
                      const key = col.key;
                      const label = col.label;

                      if (key === 'action') {
                        return (
                          <td key="action" data-label={label}>
                            <div className="action-wrapper">
                              {role === 'admin' && (
                                <button
                                  className="action-btn admin"
                                  onClick={() => handleComplete(item.id)}
                                  disabled={item.rental_status !== 'active'}
                                >
                                  Selesaikan
                                </button>
                              )}
                              <button
                                className={`action-btn ${role}`}
                                onClick={() => handleAction(item.id)}
                                disabled={role === 'user' && item.rental_status !== 'pending'}
                              >
                                {role === 'admin' ? 'Hapus Sewa' : 'Batalkan'}
                              </button>
                            </div>
                          </td>
                        );
                      }

                      if (key === 'rental_status') {
                        return (
                          <td key="status" data-label={label}>
                            <span className={`status-badge status-${item.rental_status}`}>
                              {statusMap[item.rental_status] || item.rental_status}
                            </span>
                          </td>
                        );
                      }

                      if (key === 'start_date' || key === 'end_date') {
                        return (
                          <td key={key} data-label={label}>
                            {new Date(item[key]).toLocaleDateString('id-ID')}
                          </td>
                        );
                      }

                      if (key === 'total_cost') {
                        return (
                          <td key={key} data-label={label}>
                            {item[key]?.toLocaleString('id-ID')}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={key}
                          data-label={label}
                          className={key === 'id' ? 'clickable-id' : ''}
                          onClick={key === 'id' ? () => navigate(`/penyewaan/${item.id}`) : null}
                        >
                          {item[key]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              ←
            </button>
            <span>Halaman {currentPage} dari {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        </>
      )}

      {showNotification && (
        <div
          className={/gagal|error/i.test(notification) ? 'error-notification' : 'notification'}
          role="alert"
          aria-live="polite"
          style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        >
          {notification}
        </div>
      )}
    </main>
  );
}

export default KelolaPenyewaan;
