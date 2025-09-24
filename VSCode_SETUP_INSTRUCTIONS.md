# Çalışma/Verimlilik Dashboard - VSCode Kurulum Kılavuzu

## Proje İndir ve Çalıştır

### 1. Gerekli Programlar
- Node.js (v16 veya üzeri) - [nodejs.org](https://nodejs.org) adresinden indirebilirsiniz
- VSCode - [code.visualstudio.com](https://code.visualstudio.com) adresinden indirebilirsiniz

### 2. Projeyi İndirin ve Açın
1. Projeyi Replit'ten indirin (Download as ZIP)
2. Dosyaları bilgisayarınızda bir klasöre çıkarın
3. VSCode'u açın
4. File → Open Folder ile proje klasörünü açın

### 3. Bağımlılıkları Yükleyin
VSCode'da Terminal açın (Ctrl+`) ve şu komutu çalıştırın:
```bash
npm install
```

### 4. Projeyi Başlatın
```bash
npm run dev
```

Proje http://localhost:5000 adresinde çalışmaya başlayacak.

## Hava Durumu API Kurulumu

### OpenWeather API Key Alma
1. [OpenWeatherMap](https://openweathermap.org/api) sitesine üye olun
2. API Keys bölümünden ücretsiz API key'inizi alın

### API Key'i Projeye Ekleme

#### Yöntem 1: Environment Variables (.env dosyası) - ÖNERİLEN
1. Proje ana klasöründe `.env` dosyası oluşturun
2. Dosyaya şunu ekleyin:
```
OPENWEATHER_API_KEY=your_api_key_here
```
3. `your_api_key_here` yerine gerçek API key'inizi yazın

#### Yöntem 2: Doğrudan Kod İçinde (Güvenli Değil)
`server/routes.ts` dosyasında, weather endpoint'inde:
```typescript
const OPENWEATHER_API_KEY = "your_api_key_here"; // Gerçek API key'inizi buraya yazın
```

### Güvenlik Notu
- API key'inizi asla GitHub'a yüklemeyin
- `.env` dosyasını `.gitignore` dosyasına ekleyin
- Production'da environment variables kullanın

## Yararlı VSCode Eklentileri
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Prettier - Code formatter
- TypeScript Importer
- Tailwind CSS IntelliSense

## Geliştirme Komutları
- `npm run dev` - Geliştirme sunucusunu başlat
- `npm run build` - Üretim için build al
- `npm start` - Üretim sunucusunu başlat
- `npm run check` - TypeScript tip kontrolü

## Sorun Giderme
1. **Port 5000 meşgul hatası**: Farklı bir port kullanın veya çalışan servisi durdurun
2. **Module not found**: `npm install` komutunu tekrar çalıştırın
3. **TypeScript hataları**: `npm run check` ile kontrol edin

Başarılı kurulum sonrası dashboard tam fonksiyonel olarak çalışacaktır!