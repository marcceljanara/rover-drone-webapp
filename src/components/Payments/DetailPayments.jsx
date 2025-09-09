import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DetailPayments.css';
import { formatTanggalDanWaktuIndonesia } from '../../utils/datetimeIndonesia';

const DetailPembayaran = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:5000/v1/payments/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        setDetail(result.data?.payment);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/v1/payments/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert(result.message);
      navigate('/payments');
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="detail-container">
        <h2>Detail Pembayaran</h2>
        <p className="error">{error}</p>
        <button onClick={() => navigate(-1)}>Kembali</button>
      </div>
    );
  }

  if (!detail) {
    return <div className="detail-container">Memuat detail pembayaran...</div>;
  }

  return (
    <div className="detail-container">
      <h2>Detail Pembayaran</h2>
      <ul>
        <li><strong>ID:</strong> {detail.id}</li>
        <li><strong>Rental ID:</strong> {detail.rental_id}</li>
        <li><strong>Jumlah:</strong> {Number(detail.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
                      maximumFractionDigits: 0, })}</li>
        <li><strong>Status:</strong> {detail.payment_status}</li>
        <li><strong>Tanggal Pembayaran:</strong> {detail.payment_date ? formatTanggalDanWaktuIndonesia(detail.payment_date) : 'Belum dibayar'}</li>
        <li><strong>Metode:</strong> {detail.payment_method || 'Tidak tersedia'}</li>
        <li><strong>Jenis Pembayaran:</strong> {detail.payment_type === 'initial' ? 'Awal' : 'Perpanjangan'}</li>
        <li><strong>Deskripsi:</strong> {detail.transaction_description || 'Tidak tersedia'}</li>
        <li><strong>Dibuat Pada:</strong> {formatTanggalDanWaktuIndonesia(detail.created_at)}</li>
      </ul>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => navigate(-1)}>Kembali</button>
        <button className="btn-danger" onClick={() => setShowConfirm(true)}>Hapus Pembayaran</button>
      </div>

      {showConfirm && (
        <div className="confirm-modal">
          <div className="confirm-modal-content">
            <h3>Yakin ingin menghapus pembayaran ini?</h3>
            <div className="confirm-modal-buttons">
              <button className="btn-danger" onClick={handleDelete}>Yakin</button>
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPembayaran;
