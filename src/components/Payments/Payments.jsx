import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Payments.css';

const itemsPerPage = 5;

const Payments = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const [glowingButton, setGlowingButton] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [formData, setFormData] = useState({
    paymentStatus: 'completed',
    paymentMethod: '',
    transactionDescription: '',
  });

  const navigate = useNavigate();

  // Ambil data pembayaran
  const fetchPayments = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:5000/v1/payments', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memuat data pembayaran');
      }

      const result = await response.json();

      // Mapping dan urutkan dari terbaru ke terlama
      const payments = result.data.payments
        .map(payment => ({
          id: payment.id?.toString() || '',
          rentalId: payment.rental_id?.toString() || 'null',
          amount: payment.amount,
          payment_status: payment.payment_status?.toString() || '',
        }))
        .sort((a, b) => Number(b.id) - Number(a.id)); // urutkan descending

      setData(payments);
    } catch (error) {
      alert(`Gagal memuat data: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleGlow = (id) => {
    setGlowingButton(id);
    setTimeout(() => setGlowingButton(null), 1000);
  };

  const handleSubmit = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:5000/v1/payments/${selectedPaymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setNotification(result.message);
      setShowModal(false);
      fetchPayments();
    } catch (error) {
      setNotification(`Error: ${error.message}`);
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredData = data.filter((item) => {
    const keyword = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(keyword) ||
      item.rentalId.toLowerCase().includes(keyword) ||
      item.payment_status.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container">
      <h2>Kelola Pembayaran Rover Drone</h2>

      <div className="search-add-bar">
        <input
          type="text"
          placeholder="Cari berdasarkan ID, Rental ID, atau Status"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {notification && <div className="notification">{notification}</div>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Rental Id</th>
              <th>Biaya</th>
              <th>Status Pembayaran</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>Data tidak ditemukan</td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr key={item.id}>
                  <td
                    data-label="Id"
                    className="clickable-id"
                    onClick={() => navigate(`/payments/${item.id}`)}
                    style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
                  >
                    {item.id}
                  </td>
                  <td data-label="Rental Id">{item.rentalId}</td>
                  <td data-label="Biaya">
                    {Number(item.amount).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td data-label="Status Pembayaran">{item.payment_status}</td>
                  <td data-label="Tindakan">
                    <button
                      className={`edit-btn ${glowingButton === item.id ? 'glow' : ''}`}
                      onClick={() => {
                        setSelectedPaymentId(item.id);
                        setShowModal(true);
                        handleGlow(item.id);
                      }}
                      disabled={['completed', 'failed'].includes(item.payment_status)}
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <span className="page-number">Halaman {currentPage} dari {totalPages}</span>
        <div className="pagination">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>←</button>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>→</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Pembayaran</h3>

            <label>Status Pembayaran</label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
            >
              <option value="completed">Completed</option>
            </select>

            <label>Metode Pembayaran</label>
            <input
              type="text"
              placeholder="Contoh: Transfer Bank"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            />

            <label>Deskripsi Transaksi</label>
            <textarea
              placeholder="Catatan atau detail transaksi"
              value={formData.transactionDescription}
              onChange={(e) => setFormData({ ...formData, transactionDescription: e.target.value })}
            />

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Batal</button>
              <button className="edit-btn" onClick={handleSubmit}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
