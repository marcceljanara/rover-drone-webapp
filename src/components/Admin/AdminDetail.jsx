import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatTanggalDanWaktuIndonesia } from '../../utils/datetimeIndonesia'; // perbaikan: fungsi ini tersedia
import './AdminDetail.css';

const AdminDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confNewPassword, setConfNewPassword] = useState('');
  const [notification, setNotification] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await fetch(`http://localhost:5000/v1/admin/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        setUser(result.data.user);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserDetail();
  }, [id, accessToken]);

  const handlePasswordUpdate = async () => {
    if (newPassword !== confNewPassword) {
      setNotification('Password dan konfirmasi tidak cocok');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/v1/admin/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword, confNewPassword }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setNotification(result.message);
      setShowModal(false);
      setNewPassword('');
      setConfNewPassword('');
    } catch (err) {
      setNotification(err.message);
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/v1/admin/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setNotification(result.message);
      setShowDeleteModal(false);
      setTimeout(() => {
        setNotification(null);
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setNotification(err.message);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (error) return <div className="user-detail-error">Gagal memuat data: {error}</div>;
  if (!user) return <div className="user-detail-loading">Memuat detail pengguna...</div>;

  return (
    <div className="user-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Kembali</button>

      {notification && <div className="notification">{notification}</div>}

      <div className="user-card">
        <h2>Detail Pengguna</h2>
        <div className="user-info">
          <div><strong>ID:</strong> <span>{user.id}</span></div>
          <div><strong>Username:</strong> <span>{user.username}</span></div>
          <div><strong>Nama Lengkap:</strong> <span>{user.fullname || '-'}</span></div>
          <div><strong>Email:</strong> <span>{user.email}</span></div>
          <div><strong>Status Verifikasi:</strong>
            <span className={user.is_verified ? 'verified' : 'not-verified'}>
              {user.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
            </span>
          </div>
          <div><strong>Role:</strong> <span>{user.role}</span></div>
          <div><strong>Dibuat Pada:</strong> <span>{formatTanggalDanWaktuIndonesia(user.created_at)}</span></div>
          <div><strong>Terakhir Diperbarui:</strong> <span>{formatTanggalDanWaktuIndonesia(user.updated_at)}</span></div>
        </div>

        <div className="action-buttons">
          <button className="change-pass-btn" onClick={() => setShowModal(true)}>🔒 Ubah Kata Sandi</button>
          <button className="delete-user-btn" onClick={() => setShowDeleteModal(true)}>🗑 Hapus Akun</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ubah Kata Sandi</h3>

            <label>Password Baru:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <i
                className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} eye-icon`}
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <label>Konfirmasi Password:</label>
            <div className="password-input-wrapper">
              <input
                type={showConfPassword ? 'text' : 'password'}
                value={confNewPassword}
                onChange={(e) => setConfNewPassword(e.target.value)}
              />
              <i
                className={`fa ${showConfPassword ? 'fa-eye-slash' : 'fa-eye'} eye-icon`}
                onClick={() => setShowConfPassword(!showConfPassword)}
              />
            </div>

            <div className="modal-actions">
              <button className="add-btn" onClick={handlePasswordUpdate}>Simpan</button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Konfirmasi Hapus Akun</h3>
            <p>Apakah kamu yakin ingin menghapus akun ini? Tindakan ini tidak bisa dibatalkan.</p>
            <div className="modal-actions">
              <button className="delete-btn" onClick={handleDeleteUser}>Ya, Hapus</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDetail;
