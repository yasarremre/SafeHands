# SafeHands v2: Manuel Test Rehberi

## 1. Hazırlık
Harici tarayıcında (Chrome/Edge) **[Freighter Wallet](https://www.freighter.app/)** eklentisinin kurulu olduğundan ve **Testnet** ağına bağlı olduğundan emin ol.
- **Localhost:** http://localhost:3000 adresini aç.
- **Connect Wallet:** Sağ üstteki butona basarak cüzdanını bağla.

## 2. Özellik 1: İş İptali (Cancel)
*Senaryo: İşveren parayı yatırdı ama vazgeçti.*

1.  **Create Job:** 
    -   Freelancer adresi gir (kendininkini girme, başka bir G... adresi salla veya arkadaşınınkini gir).
    -   Miktar gir (örn: 10 XLM).
    -   **"Lock Funds Now"** butonuna bas ve cüzdandan onayla.
2.  **Dashboard:** Sayfayı yenile. "Active Goals" altında yeni işi göreceksin.
3.  **Cancel Butonu:** 
    -   Henüz freelancer onaylamadığı için kartın üzerinde **"CANCEL & REFUND"** butonu çıkacak.
    -   Buna bas ve cüzdandan onayla.
4.  **Sonuç:** Para cüzdanına geri dönecek, kartın durumu "Cancelled" olacak.

## 3. Özellik 2: Hakem ve Anlaşmazlık (Dispute & Arbiter)
*Senaryo: İşveren memnun değil, hakem devreye giriyor.*

1.  **Create Job (Hakemli):**
    -   Freelancer adresi gir.
    -   **Arbiter Address** kısmına **kendi ikinci cüzdanını** (veya şu anki cüzdanını test için) gir.
    -   Miktar gir ve oluştur.
2.  **Dispute Başlat:** 
    -   Oluşturduğun işin kartında **"RAISE DISPUTE"** butonu göreceksin.
    -   Buna bas. Kartın durumu **"Disputed"** olacak (sarı renk).
3.  **Hakem Olarak Çöz (Resolve):**
    -   Eğer "Arbiter Address" olarak kendi cüzdanını girdiysen, kartta **"RESOLVE DISPUTE"** paneli açılacak.
    -   **"Winner"** kısmına Client adresini yapıştır.
    -   **"Award to Client"** butonuna bas.
4.  **Sonuç:** Para Client'a iade edilir, durum "Resolved" olur.

## 4. Özellik 3: Dashboard (Escrow Listesi)
Artık oluşturduğun veya dahil olduğun (Freelancer/Arbiter olarak) tüm işler **otomatik** olarak listeleniyor. 
Yeni bir iş oluşturunca sayfayı yenilemen yeterli.

---
**Not:** Eğer butonlar tepki vermiyorsa veya hata alırsan, `F12` ile konsolu kontrol et ve bana bildir.
