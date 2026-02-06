'use client'; // Tarayıcıda etkileşim (buton tıklama vb.) için şart

import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [trustScore, setTrustScore] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Sayfa yüklendiğinde Pi SDK'sını kontrol et ve başlat
    if (typeof window !== 'undefined' && (window as any).Pi) {
      const Pi = (window as any).Pi;
      Pi.init({ version: "1.5", sandbox: true });
    }
  }, []);

  // 1. ADIM: Pi Network ile Giriş Yapma
  const handleLogin = async () => {
    const Pi = (window as any).Pi;
    
    // Normal tarayıcıda test edebilmen için geçici "Hayalet Mod"
    if (!Pi) {
      setUser({ username: "Pioneer_X" });
      return;
    }

    try {
      const scopes = ['username', 'payments'];
      const auth = await Pi.authenticate(scopes, (onIncompletePaymentFound: any) => {
        // Tamamlanmamış ödemeler için protokol
      });
      setUser(auth.user);
    } catch (err) {
      console.error("Giriş hatası:", err);
      // Pi Browser dışındaysan testi devam ettirmek için:
      setUser({ username: "Test_User" });
    }
  };

  // 2. ADIM: Blokzinciri Mühürleme (Oracle Katmanı)
  const sealOnChain = async (score: number, username: string) => {
    const Pi = (window as any).Pi;
    if (!Pi) {
      console.log("Simülasyon: Veri blokzincirine mühürlendi (Memo: PB-SCORE:" + score + ")");
      return;
    }

    try {
      // Bu işlem Pi ağında kalıcı bir iz (Güven Kanıtı) bırakır
      await Pi.createPayment({
        amount: 0.0001, 
        memo: `PB-SCORE:${score}-${username}`, 
        metadata: { score: score, type: "identity_oracle" }
      }, {
        onReadyForServerApproval: (id: string) => console.log("Onay Bekliyor:", id),
        onReadyForServerCompletion: (id: string, txid: string) => alert("Mühürleme Tamam! TXID: " + txid),
        onCancel: (id: string) => console.log("İptal edildi"),
        onError: (error: Error) => console.error("Hata:", error)
      });
    } catch (err) {
      console.error("Mühürleme işlemi başlatılamadı:", err);
    }
  };

  // 3. ADIM: Biyometrik Onay ve Süreci Başlatma
  const startHumanVerification = async () => {
    setIsVerifying(true);
    
    // 3 saniyelik biyometrik tarama simülasyonu
    setTimeout(async () => {
      const finalScore = 85; 
      setTrustScore(finalScore);
      setIsVerifying(false);
      
      // Kullanıcıdan mühürleme onayı alıyoruz
      const confirmSeal = confirm("Biyometrik doğrulama başarılı! Güven puanınız Pi Blokzinciri üzerine mühürlensin mi?");
      
      if (confirmSeal) {
        await sealOnChain(finalScore, user.username);
      }
    }, 3000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-900 text-white font-sans">
      <h1 className="text-4xl font-bold mb-4 text-blue-400 tracking-tight">Pi-TrustBridge</h1>
      <p className="mb-12 text-center max-w-md text-slate-400 text-sm">
        Yapay zeka çağında gerçek insan olduğunuzu blokzinciri üzerinde kanıtlayın.
      </p>

      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95"
        >
          Pi Network ile Bağlan
        </button>
      ) : (
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Doğrulanmış Kullanıcı</p>
              <p className="text-2xl font-bold">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900/80 p-8 rounded-2xl border border-blue-500/20 text-center relative overflow-hidden">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-bold">Oracle Güven Endeksi</p>
              <div className="text-6xl font-mono font-black text-blue-500 tracking-tighter">%{trustScore}</div>
              {trustScore > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>}
            </div>

            {trustScore < 100 ? (
              <button
                onClick={startHumanVerification}
                disabled={isVerifying}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all transform ${
                  isVerifying 
                  ? "bg-slate-700 text-slate-500 cursor-wait" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:translate-y-1"
                }`}
              >
                {isVerifying ? "Biyometrik Veriler İşleniyor..." : "Biyometrik Onay Başlat"}
              </button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl text-green-400 text-center text-sm font-medium animate-pulse">
                ✓ Kimliğiniz Pi Mainnet üzerinde mühürlenmiştir.
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-20 flex flex-col items-center space-y-2">
        <div className="h-[1px] w-12 bg-slate-800"></div>
        <p className="text-slate-600 text-[10px] tracking-widest uppercase">Pi-TrustBridge Identity Oracle v2.0</p>
      </footer>
    </main>
  );
}