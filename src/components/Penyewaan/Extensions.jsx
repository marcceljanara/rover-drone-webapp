import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Extensions.css'; 

function DetailPerpanjangan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [extensions, setExtensions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExtensions = async () => {
      if (!token) {
        setError('Token tidak ditemukan. Silakan login.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/v1/rentals/${id}/extensions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Gagal memuat data perpanjangan.');

        setExtensions(result.data?.extensions || []);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExtensions();
  }, [id, token]);

  return (
    <main className="container">
      <h2>Riwayat Perpanjangan Sewa - ID {id}</h2>

      <div className="toolbar">
        <button onClick={() => navigate(-1)} className="back-button">← Kembali</button>
        <button
          onClick={() => navigate(`/penyewaan/${id}/extensions/pengajuan`)}
          className="action-btn add-extension"
        >
          + Ajukan Perpanjangan
        </button>
      </div>

      {loading ? (
        <p>Memuat data perpanjangan...</p>
      ) : error ? (
        <div className="notification error" role="alert">{error}</div>
      ) : extensions.length === 0 ? (
        <p>Tidak ada data perpanjangan untuk penyewaan ini.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table" role="table" aria-label="Tabel perpanjangan sewa">
            <thead>
              <tr>
                <th>ID</th>
                <th>Durasi (bulan)</th>
                <th>Tanggal Akhir Baru</th>
                <th>Biaya Tambahan (Rp)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((ext) => (
                <tr key={ext.id}>
                  <td data-label="ID">{ext.id}</td>
                  <td data-label="Durasi (bulan)">{ext.duration_months}</td>
                  <td data-label="Tanggal Akhir Baru">
                    {new Date(ext.new_end_date).toLocaleDateString('id-ID')}
                  </td>
                  <td data-label="Biaya Tambahan (Rp)">
                    {ext.amount.toLocaleString('id-ID')}
                  </td>
                  <td data-label="Status">
                    <span className={`status-badge status-${ext.status}`}>{ext.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default DetailPerpanjangan;
