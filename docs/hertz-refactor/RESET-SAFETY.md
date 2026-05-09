# HERTZ Reset Safety

Refactor HERTZ memakai data baru dan data lama boleh dihapus karena belum production. Walau begitu, reset database tetap dianggap operasi destruktif.

## Aturan

- Jangan menjalankan reset production tanpa persetujuan eksplisit.
- Untuk Docker production, reset berarti menghapus volume/bind mount `DB_DATA_DIR`; ini harus dilakukan manual dan sadar.
- Migration `009_create_hertz_domain.sql` membuat domain `hertz_*` bersih, tetapi tidak otomatis menghapus tabel lama saat container start.
- Seed HERTZ baru boleh dijalankan setelah database kosong atau setelah migration selesai.

## Local Reset

1. Stop aplikasi.
2. Backup jika masih ada data yang ingin disimpan.
3. Reset database lokal atau hapus data testing lokal.
4. Jalankan migration.
5. Jalankan seed HERTZ.
6. Jalankan build/test.

## Production Guard

Destructive command seperti menghapus `data/postgres`, drop schema, atau recreate volume hanya boleh dilakukan setelah owner menulis instruksi eksplisit untuk reset production.
