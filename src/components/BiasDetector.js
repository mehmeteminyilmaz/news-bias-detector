import React, { useState } from 'react';
import './BiasDetector.css';

function BiasDetector() {
  const [newsText, setNewsText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeNews = async () => {
    if (!newsText.trim()) {
      setError('Lütfen analiz edilecek bir haber metni girin.');
      return;
    }
    if (newsText.trim().split(' ').length < 20) {
      setError('Lütfen daha uzun bir metin girin (en az 20 kelime).');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Aşağıdaki haber metnini analiz et ve tam olarak bu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "siyasi_egilim": "Sol / Merkez-Sol / Merkez / Merkez-Sağ / Sağ",
  "taraflilik_skoru": 75,
  "dil_tonu": "Nötr / Duygusal / Manipülatif",
  "cerceveleme": ["teknik 1", "teknik 2", "teknik 3"],
  "guclu_kelimeler": ["kelime1", "kelime2", "kelime3", "kelime4"],
  "degerlendirme": "2-3 cümlelik genel değerlendirme",
  "tavsiye": "Okuyucuya 1 cümlelik tavsiye"
}

taraflilik_skoru: 0 = tamamen tarafsız, 100 = tamamen taraflı

Haber metni:
${newsText}`
              }]
            }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API hatası');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setResult(parsed);

    } catch (err) {
      setError('Bir hata oluştu: ' + err.message);
    }

    setLoading(false);
  };

  const clearAll = () => {
    setNewsText('');
    setResult(null);
    setError('');
  };

  const getScoreColor = (score) => {
    if (score <= 30) return '#22c55e';
    if (score <= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getEgilimColor = (egilim) => {
    if (egilim?.includes('Sol')) return '#3b82f6';
    if (egilim?.includes('Sağ')) return '#ef4444';
    return '#22c55e';
  };

  const wordCount = newsText.trim() === '' ? 0 : newsText.trim().split(/\s+/).length;

  return (
    <div className="bias-detector">
      {/* Header */}
      <div className="header">
        <div className="header-icon">📰</div>
        <h1>Haber Bias Dedektörü</h1>
        <p>Haberlerdeki taraflılığı, siyasi eğilimi ve manipülatif dil kullanımını yapay zeka ile analiz edin</p>
      </div>

      {/* Input */}
      <div className="input-section">
        <div className="input-header">
          <label>Haber metnini yapıştırın</label>
          <span className="word-count">{wordCount} kelime</span>
        </div>
        <textarea
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
          placeholder="Analiz etmek istediğiniz haber metnini buraya yapıştırın..."
          rows={10}
        />
        <div className="button-group">
          <button className="btn-primary" onClick={analyzeNews} disabled={loading}>
            {loading ? '⏳ Analiz ediliyor...' : '🔍 Analiz Et'}
          </button>
          <button className="btn-secondary" onClick={clearAll}>
            🗑️ Temizle
          </button>
        </div>
      </div>

      {/* Hata */}
      {error && <div className="error-box">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Yapay zeka haberi analiz ediyor...</p>
        </div>
      )}

      {/* Sonuçlar */}
      {result && !loading && (
        <div className="results">
          <h2>📊 Analiz Sonuçları</h2>

          {/* Üst Kartlar */}
          <div className="cards-grid">

            {/* Taraflılık Skoru */}
            <div className="card">
              <div className="card-title">Taraflılık Skoru</div>
              <div className="score-circle" style={{ borderColor: getScoreColor(result.taraflilik_skoru) }}>
                <span style={{ color: getScoreColor(result.taraflilik_skoru) }}>
                  {result.taraflilik_skoru}
                </span>
                <small>/100</small>
              </div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${result.taraflilik_skoru}%`,
                    backgroundColor: getScoreColor(result.taraflilik_skoru)
                  }}
                />
              </div>
            </div>

            {/* Siyasi Eğilim */}
            <div className="card">
              <div className="card-title">Siyasi Eğilim</div>
              <div className="egilim-badge" style={{ backgroundColor: getEgilimColor(result.siyasi_egilim) + '22', borderColor: getEgilimColor(result.siyasi_egilim), color: getEgilimColor(result.siyasi_egilim) }}>
                {result.siyasi_egilim}
              </div>
            </div>

            {/* Dil Tonu */}
            <div className="card">
              <div className="card-title">Dil Tonu</div>
              <div className={`ton-badge ton-${result.dil_tonu?.toLowerCase()}`}>
                {result.dil_tonu === 'Nötr' ? '😐' : result.dil_tonu === 'Duygusal' ? '😤' : '⚠️'} {result.dil_tonu}
              </div>
            </div>
          </div>

          {/* Çerçeveleme Teknikleri */}
          <div className="section-box">
            <h3>🎭 Çerçeveleme Teknikleri</h3>
            <div className="tags">
              {result.cerceveleme?.map((item, i) => (
                <span key={i} className="tag-orange">{item}</span>
              ))}
            </div>
          </div>

          {/* Güçlü Kelimeler */}
          <div className="section-box">
            <h3>💬 Dikkat Çekici Kelimeler</h3>
            <div className="tags">
              {result.guclu_kelimeler?.map((item, i) => (
                <span key={i} className="tag-red">{item}</span>
              ))}
            </div>
          </div>

          {/* Değerlendirme */}
          <div className="section-box">
            <h3>📝 Genel Değerlendirme</h3>
            <p className="degerlendirme-text">{result.degerlendirme}</p>
          </div>

          {/* Tavsiye */}
          <div className="tavsiye-box">
            <span>💡</span>
            <p>{result.tavsiye}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiasDetector;