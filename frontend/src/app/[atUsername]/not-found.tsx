import Link from 'next/link';

export default function PublicProfileNotFound() {
  return (
    <main style={{ minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
      <h1>Profil tidak ditemukan</h1>
      <p>Username tidak terdaftar atau belum diverifikasi.</p>
      <Link href="/hertz">Kembali ke HERTZ</Link>
    </main>
  );
}
