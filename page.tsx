"use client";

import { useEffect, useState } from "react";

type PiUser = {
  username: string;
};

export default function Home() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Pi) {
      const Pi = (window as any).Pi;

      Pi.init({
        version: "2.0",
        sandbox: true, // 🔒 Testnet ONLY
      });
    }
  }, []);

  // 🔐 Pi Network Login
  const handleLogin = async () => {
    const Pi = (window as any).Pi;

    if (!Pi) {
      alert("Bu uygulama Pi Browser içinde çalışmalıdır.");
      return;
    }

    try {
      const auth = await Pi.authenticate(["username"], () => {});
      setUser(auth.user);
    } catch (err) {
      console.error("Pi login failed:", err);
      alert("Pi ile giriş başarısız.");
    }
  };

  // 🧬 Human Verification (şimdilik deterministic demo)
  const startVerification = () => {
    if (!user) return;

    setIsVerifying(true);

    setTimeout(() => {
      // ⚠️ Gerçek biyometri burada entegre edilecek
      const score = 85;
      setTrustScore(score);
      setIsVerifying(false);
    }, 3000);
  };

  // 🧱 Oracle Seal (Testnet Memo)
  const sealOnChain = async () => {
    const Pi = (window as any).Pi;
    if (!Pi || !user || trustScore === null) return;

    const expiry = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 gün

    const memo = `PTB|v1|${user.username}|${trustScore}|${expiry}`;

    try {
      await Pi.createPayment(
        {
          amount: 0.0001,
          memo,
          metadata: {
            type: "human-proof",
            score: trustScore,
            expires: expiry,
          },
        },
        {
          onReadyForServerApproval: () => {},
          onReadyForServerCompletion: () => {
            alert("Güven kanıtı Testnet üzerinde mühürlendi.");
          },
          onCancel: () => {},
          onError: (err: Error) => {
            console.error(err);
            alert("Mühürleme hatası.");
          },
        }
      );
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">
        Pi TrustBridge
      </h1>

      <p className="text-slate-400 text-sm mb-10 text-center max-w-md">
        Yapay zekâ çağında gerçek insan olduğunuzu Pi Network Testnet üzerinde
        kanıtlayın.
      </p>

      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-4 rounded-full"
        >
          Pi ile Bağlan
        </button>
      ) : (
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Doğrulanmış Kullanıcı
          </p>
          <p className="text-2xl font-bold mb-6">@{user.username}</p>

          {trustScore === null ? (
            <button
              onClick={startVerification}
              disabled={isVerifying}
              className={`w-full py-4 rounded-xl font-bold ${
                isVerifying
                  ? "bg-slate-700 text-slate-400"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isVerifying
                ? "Biyometrik Doğrulama Yapılıyor..."
                : "İnsan Doğrulamasını Başlat"}
            </button>
          ) : (
            <>
              <div className="text-center my-6">
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Güven Skoru
                </p>
                <p className="text-5xl font-mono font-black text-blue-400">
                  %{trustScore}
                </p>
              </div>

              <button
                onClick={sealOnChain}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 font-bold"
              >
                Testnet Üzerine Mühürle (90 Gün)
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
