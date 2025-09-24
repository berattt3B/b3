import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";

const YKS_QUOTES = [
  {
    quote: "Başarı, küçük çabaların tekrar edilmesi, gün be gün, saat be saat yapılan şeylerdir.",
    author: "Robert Collier"
  },
  {
    quote: "Eğitim geleceğin anahtarıdır. Yarın, bugün hazırlanan insanlarındır.",
    author: "Malcolm X"
  },
  {
    quote: "Zeka sabit değildir. Her gün biraz daha öğrenebilir ve gelişebiliriz.",
    author: "Carol Dweck"
  },
  {
    quote: "Başarı, hazırlanma fırsatı ile karşılaştığında ortaya çıkar.",
    author: "Bobby Unser"
  },
  {
    quote: "Hedefin yeterince büyükse, nasıllar önemli değildir.",
    author: "Jim Rohn"
  },
  {
    quote: "Öğrenme asla zihnin kapasitesini tüketmez.",
    author: "Leonardo da Vinci"
  },
  {
    quote: "Mükemmellik bir alışkanlıktır, tek seferlik bir davranış değil.",
    author: "Aristo"
  },
  {
    quote: "Bilgi güçtür. Bilgi özgürlüktür.",
    author: "Francis Bacon"
  },
  {
    quote: "Çalışkan olmak yetenekten daha önemlidir.",
    author: "Tim Notke"
  },
  {
    quote: "Her uzman bir zamanlar yeni başlayandı.",
    author: "Robin Sharma"
  },
  {
    quote: "Başarısızlık, yeniden başlamanın daha akıllı bir yoludur.",
    author: "Henry Ford"
  },
  {
    quote: "Disiplin özgürlük ile ağrı arasında köprüdür.",
    author: "Jim Rohn"
  },
  {
    quote: "Eğitim hayatın hazırlığı değil, hayatın ta kendisidir.",
    author: "John Dewey"
  },
  {
    quote: "Yarın yapmayı planladığınız şeyi bugün, bugün yapmayı planladığınız şeyi şimdi yapın.",
    author: "Benjamin Franklin"
  },
  {
    quote: "Başarı son nokta değil, başarısızlık ölümcül değil: önemli olan devam etme cesareti.",
    author: "Winston Churchill"
  },
  {
    quote: "Büyük hayaller kurmaktan korkmayın, çünkü büyük hayaller büyük insanlar yaratır.",
    author: "Mustafa Kemal Atatürk"
  },
  {
    quote: "İlim ilim bilmektir, ilim kendin bilmektir, sen kendini bilmezsen, bu nice okumaktır?",
    author: "Yunus Emre"
  },
  {
    quote: "Çalışmayan doymaz, çalışkan beklemez.",
    author: "Türk Atasözü"
  },
  {
    quote: "Sabır acıdır ama meyvesi tatlıdır.",
    author: "Hz. Ali"
  },
  {
    quote: "İmkansız, sadece büyük düşünmeyenlerin sözlüğünde vardır.",
    author: "Napoléon Bonaparte"
  },
  {
    quote: "Hayatta en hakiki mürşit ilimdir, fendir.",
    author: "Mustafa Kemal Atatürk"
  },
  {
    quote: "Ne kadar çok okursan, o kadar çok şey bilirsin. Ne kadar çok öğrenirsen, o kadar çok yere gidersin.",
    author: "Dr. Seuss"
  },
  {
    quote: "Eğitim, karanlıktan aydınlığa giden en kısa yoldur.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarının %90'ı ortaya çıkmakla ilgilidir.",
    author: "Woody Allen"
  },
  {
    quote: "Gelecek bugünden hazırlanır.",
    author: "Mustafa Kemal Atatürk"
  },
  {
    quote: "Zor günler güçlü insanlar yaratır.",
    author: "G. Michael Hopf"
  },
  {
    quote: "Sen yapabilirsin! İnan ve başar!",
    author: "Motivasyon"
  },
  {
    quote: "Her gün biraz daha iyileş, her gün biraz daha öğren.",
    author: "Türk Atasözü"
  },
  {
    quote: "Azim ve kararlılık her engeli aşar.",
    author: "Leonardo da Vinci"
  },
  {
    quote: "Başarı, başarısızlığa rağmen devam etme yetisidir.",
    author: "Charles Kettering"
  },
  {
    quote: "İyi bir öğrenci olmak için sadece dinlemek yetmez, anlamak gerekir.",
    author: "Einstein"
  },
  {
    quote: "Okumak ruha ne ise, egzersiz de vücuda odur.",
    author: "Joseph Addison"
  },
  {
    quote: "Zihin, kitap gibidir. Açılmazsa okunamaz.",
    author: "Çin Atasözü"
  },
  {
    quote: "Öğrenmek cesaret ister. Cesaretli ol!",
    author: "Motivasyon"
  },
  {
    quote: "Hedefiniz yeterince büyükse, yöntemler kendiliğinden bulunur.",
    author: "Zig Ziglar"
  },
  {
    quote: "İtaat eden değil, hürriyetini bilen nesilleri yetiştirin.",
    author: "Mustafa Kemal Atatürk"
  },
  {
    quote: "Okumak, konuşmak, yazmak - bunlar öğrenmenin üç temel taşıdır.",
    author: "Türk Eğitim Sistemi"
  },
  {
    quote: "Çok çalış, sabırlı ol, başaracaksın!",
    author: "Motivasyon"
  },
  {
    quote: "Her başarı hikayesi, bir hayalle başlar.",
    author: "Türk Atasözü"
  },
  {
    quote: "Zorluklar seni güçlendirir, kolaylıklar seni zayıflatır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Bugünün yorgunluğu, yarının başarısıdır.",
    author: "Motivasyon"
  },
  {
    quote: "Pes etmek, başarısızlığa giden en kısa yoldur.",
    author: "Einstein"
  },
  {
    quote: "Öğrenmek bir yolculuktur, varış noktası değil.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı sabır ister, sabır da kararlılık.",
    author: "Confucius"
  },
  {
    quote: "Her problem, içinde çözümünü barındırır.",
    author: "Einstein"
  },
  {
    quote: "İnanç dağları yerinden oynatır.",
    author: "İncil"
  },
  {
    quote: "Çalışmayan el, bereketli olmaz.",
    author: "Türk Atasözü"
  },
  {
    quote: "Yarın diye bir şey yoktur, bugün var olan tek gerçektir.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı, hazırlık ile fırsatın buluşmasıdır.",
    author: "Seneca"
  },
  {
    quote: "Okumak hayatı değiştirir, bilgi güç verir.",
    author: "Francis Bacon"
  },
  {
    quote: "Çalışkan eli bereketli kılar Tanrı.",
    author: "Türk Atasözü"
  },
  {
    quote: "İlerlemek için geriye bakmayı bırak.",
    author: "Motivasyon"
  },
  {
    quote: "Bugünkü çabanız, gelecekteki gururunuzdur.",
    author: "Motivasyon"
  },
  {
    quote: "Zeka önemlidir ama azim daha önemlidir.",
    author: "Angela Duckworth"
  },
  {
    quote: "Her yeni gün, yeni bir şans demektir.",
    author: "Motivasyon"
  },
  {
    quote: "Kendine inan, dünya da sana inanacak.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı merdiveni, eliniz cebinizde çıkılmaz.",
    author: "Henry Ford"
  },
  {
    quote: "Çaba göstermeyen kimse, zafer tadını bilemez.",
    author: "Türk Atasözü"
  },
  {
    quote: "Büyük hedefler, büyük cesaretler gerektirir.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek ömür boyu sürecek bir serüvendir.",
    author: "Motivasyon"
  },
  {
    quote: "Zorluklarla mücadele etmek, seni güçlendirir.",
    author: "Motivasyon"
  },
  {
    quote: "Her düşen tekrar kalkar, her kaybeden tekrar kazanır.",
    author: "Türk Atasözü"
  },
  {
    quote: "İradeniz kadarlık hedefleriniz olsun.",
    author: "Mustafa Kemal Atatürk"
  },
  {
    quote: "Bilgili insan güçlüdür, güçlü insan özgürdür.",
    author: "Bacon"
  },
  {
    quote: "Çalışkan insan kaderini değiştirebilir.",
    author: "Türk Atasözü"
  },
  {
    quote: "Sabır, en zor zamanların anahtarıdır.",
    author: "Hz. Ali"
  },
  {
    quote: "Hedefe giden yolda her adım önemlidir.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı, başarısızlıktan korkmamaktır.",
    author: "Michael Jordan"
  },
  {
    quote: "Öğrenmek isteyenin önünde engel yoktur.",
    author: "Türk Atasözü"
  },
  {
    quote: "Çaba eden, hedefine ulaşır.",
    author: "Motivasyon"
  },
  {
    quote: "Yarının liderleri, bugünün öğrencileridir.",
    author: "Motivasyon"
  },
  {
    quote: "Azimli olmayan hiçbir şey başaramaz.",
    author: "Samuel Johnson"
  },
  {
    quote: "Her yeni bilgi, seni daha güçlü yapar.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışmak ibadettir, öğrenmek zevktir.",
    author: "Türk Atasözü"
  },
  {
    quote: "İmkansız diye bir şey yoktur, sadece yetersiz çaba vardır.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı yolunda her engel, seni daha güçlü yapar.",
    author: "Motivasyon"
  },
  {
    quote: "Hedefinize odaklanın, yolunuzda ilerleyin.",
    author: "Motivasyon"
  },
  {
    quote: "Bugünkü fedakarlığınız, yarınki mutluluğunuzdur.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışan el dolu olur, tembel el boş kalır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Her başarılı insanın arkasında, büyük bir çaba vardır.",
    author: "Motivasyon"
  },
  {
    quote: "Eğitim almış bir zihin, asla işsiz kalmaz.",
    author: "Motivasyon"
  },
  {
    quote: "Vazgeçmeyin, çünkü büyük şeyler zaman alır.",
    author: "Motivasyon"
  },
  {
    quote: "İrade dağları yerinden oynatır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı planla gelir, şansla değil.",
    author: "Benjamin Franklin"
  },
  {
    quote: "Çalışkan olmak, şanslı olmaktan daha önemlidir.",
    author: "Gary Player"
  },
  {
    quote: "Bugün atılan her adım, geleceğin temelini atar.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek isteyenin yaşı yoktur.",
    author: "Türk Atasözü"
  },
  {
    quote: "Cesaret eksikliği, başarının en büyük düşmanıdır.",
    author: "Motivasyon"
  },
  {
    quote: "Her soru, sizi cevaba biraz daha yaklaştırır.",
    author: "Motivasyon"
  },
  {
    quote: "Şimdi sarf ettiğiniz emek, gelecekteki refahınızdır.",
    author: "Confucius"
  },
  {
    quote: "Kitap okuyan hiçbir zaman yalnız değildir.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı merdiveni, adım adım çıkılır.",
    author: "Motivasyon"
  },
  {
    quote: "Zorluklar sizi büyütür, kolaylıklar sizi küçültür.",
    author: "Motivasyon"
  },
  {
    quote: "Hedefleriniz kadar büyük yaşayın.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba eden asla pişman olmaz.",
    author: "Türk Atasözü"
  },
  {
    quote: "Bugünün yorgunluğu, yarının gururudur.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgili insan hiçbir zaman durağandır.",
    author: "Einstein"
  },
  {
    quote: "Öğrenmek yaşamın ta kendisidir.",
    author: "Dewey"
  },
  {
    quote: "Azim, her kapıyı açar.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı, gayret etmenin ödülüdür.",
    author: "Motivasyon"
  },
  {
    quote: "Her gün biraz daha iyi olmaya odaklanın.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışmak hem ibadettir hem de keyiftir.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarının anahtarı, doğru zamanda doğru çabadır.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek için geç kalmış diye bir şey yoktur.",
    author: "Nelson Mandela"
  },
  {
    quote: "Her soru, bir cevaba giden yoldur.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba göstermeyen, başarıyı tadamaz.",
    author: "Türk Atasözü"
  },
  {
    quote: "İlim öğrenmeye devam etmektir.",
    author: "Confucius"
  },
  {
    quote: "Bugünün çabası, yarının başarısıdır.",
    author: "Motivasyon"
  },
  {
    quote: "Hedefe giderken her adım değerlidir.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışkan el bereketli olur.",
    author: "İncil"
  },
  {
    quote: "Başarı yolunda vazgeçmek yasaktır.",
    author: "Motivasyon"
  },
  {
    quote: "Her zorluk, bir fırsatın habercisidir.",
    author: "Çin Atasözü"
  },
  {
    quote: "Öğrenmek özgürlüktür, bilgi güçtür.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba eden, hedefe ulaşır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Bugünün yorgunluğu, yarının enerjisidir.",
    author: "Motivasyon"
  },
  {
    quote: "Her sayfa çevirdiğinizde, geleceğinizi yazıyorsunuz.",
    author: "Motivasyon"
  },
  {
    quote: "Sebat eden, galip gelir.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı için çalışmaktan başka yol yoktur.",
    author: "Thomas Edison"
  },
  {
    quote: "Azim ile başarılmayacak hiçbir şey yoktur.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek, hayatın en büyük zevkidir.",
    author: "Aristoteles"
  },
  {
    quote: "Her gün yeni bir sayfa, yeni bir şans.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışkan ol, başarılı ol, mutlu ol.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgi birikimi, geleceğin anahtarıdır.",
    author: "Francis Bacon"
  },
  {
    quote: "Hedefiniz net olsun, çabanız sürekli olsun.",
    author: "Motivasyon"
  },
  {
    quote: "Zorluklar büyütür, kolaylıklar küçültür.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı, işe odaklanmakla gelir.",
    author: "Bill Gates"
  },
  {
    quote: "Çaba sarf etmeyen, zafer tadını bilmez.",
    author: "Motivasyon"
  },
  {
    quote: "Her adım sizi hedefinize biraz daha yaklaştırır.",
    author: "Motivasyon"
  },
  {
    quote: "Okumak yaşamı değiştirir, öğrenmek hayatı güzelleştirir.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı yolunda her günün kendine has değeri vardır.",
    author: "Motivasyon"
  },
  {
    quote: "Azimli olan, asla yenilmez.",
    author: "Napoléon Bonaparte"
  },
  {
    quote: "Çalışmanın karşılığı mutlaka alınır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Bugün ekilen tohum, yarın hasat edilir.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmekten korkmayın, bilmemekten korkun.",
    author: "Confucius"
  },
  {
    quote: "Her çaba, sizi hedefe bir adım daha yaklaştırır.",
    author: "Motivasyon"
  },
  {
    quote: "Başarı sabır ister, sabır da azim.",
    author: "Türk Atasözü"
  },
  {
    quote: "Çalışkan insan kaderini değiştirebilir.",
    author: "Motivasyon"
  },
  {
    quote: "Hedeflerinizi büyük tutun, çabalarınızı büyütün.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgi güçtür, öğrenmek mutluluktur.",
    author: "Francis Bacon"
  },
  {
    quote: "Her sayfa, yeni bir umut; her soru, yeni bir şans.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba gösterenin yolu açılır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı, hazırlanmış olanların eseridir.",
    author: "Louis Pasteur"
  },
  {
    quote: "Öğrenmek cesaret ister, bilmek sabır.",
    author: "Motivasyon"
  },
  {
    quote: "Her gün yeni bir fırsat, yeni bir başlangıç.",
    author: "Motivasyon"
  },
  {
    quote: "Azim, en büyük yetenektir.",
    author: "Grit"
  },
  {
    quote: "Çalışmanın meyvesi tatlıdır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Hedefine ulaşmak isteyenin durması yasak.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgi biriktiren, güç toplar.",
    author: "Francis Bacon"
  },
  {
    quote: "Her zorluk, sizi daha güçlü yapar.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba eden hiçbir zaman pişman olmaz.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı, tutarlı çabanın sonucudur.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek yaşamı zenginleştirir.",
    author: "John Dewey"
  },
  {
    quote: "Her adım sizi zirveye biraz daha yaklaştırır.",
    author: "Motivasyon"
  },
  {
    quote: "Azim dağları yerinden oynatır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Bugünkü eksiğiniz, yarınki eksiğiniz olmasın.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışmak hayatın en büyük zevkidir.",
    author: "Khalil Gibran"
  },
  {
    quote: "Başarıya giden yolda durmak yoktur.",
    author: "Motivasyon"
  },
  {
    quote: "Her kitap, yeni bir dünya demektir.",
    author: "Motivasyon"
  },
  {
    quote: "Sebat eden mutlaka kazanır.",
    author: "Türk Atasözü"
  },
  {
    quote: "Hedefleriniz kadar büyük hayaller kurun.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek, en değerli yatırımdır.",
    author: "Benjamin Franklin"
  },
  {
    quote: "Her çaba, sizi hedefe biraz daha yaklaştırır.",
    author: "Motivasyon"
  },
  {
    quote: "Çalışkan el bereketli olur, tembel el fakirleşir.",
    author: "Süleyman"
  },
  {
    quote: "Başarı, kesin kararlılığın ürünüdür.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgili olmak, güçlü olmaktır.",
    author: "Francis Bacon"
  },
  {
    quote: "Her gün biraz daha iyiye doğru.",
    author: "Motivasyon"
  },
  {
    quote: "Azim, dünyanın en büyük gücüdür.",
    author: "Türk Atasözü"
  },
  {
    quote: "Çalışma azmi, başarının garantisidir.",
    author: "Motivasyon"
  },
  {
    quote: "Hedefine odaklan, başaracaksın.",
    author: "Motivasyon"
  },
  {
    quote: "Öğrenmek yaşamın kendisidir.",
    author: "John Dewey"
  },
  {
    quote: "Her sayfa, yeni bir umut; her gün, yeni bir şans.",
    author: "Motivasyon"
  },
  {
    quote: "Çaba gösterenin yolu açık olur.",
    author: "Türk Atasözü"
  },
  {
    quote: "Başarı, istikrarlı çalışmanın meyvesidir.",
    author: "Motivasyon"
  },
  {
    quote: "Bilgi, özgürlüğe giden en kısa yoldur.",
    author: "Frederick Douglass"
  },
  {
    quote: "Her adım, zirveye biraz daha yaklaştırır.",
    author: "Motivasyon"
  }
];

export function MotivationalQuote() {
  const [location] = useLocation();
  const [currentQuote, setCurrentQuote] = useState(YKS_QUOTES[0]);

  // Change quote on location change or page refresh
  useEffect(() => {
    const getRandomQuote = () => {
      // Use a combination of current time, date, and location to generate a more random index
      const now = new Date();
      const timeComponent = now.getHours() * 60 + now.getMinutes();
      const dateComponent = now.getDate() * now.getMonth();
      const locationComponent = location.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const randomSeed = timeComponent + dateComponent + locationComponent + Math.floor(Date.now() / 1000);
      const randomIndex = randomSeed % YKS_QUOTES.length;
      return YKS_QUOTES[randomIndex];
    };

    setCurrentQuote(getRandomQuote());
  }, [location]); // This will trigger on navigation

  // Also change on component mount (page refresh)
  useEffect(() => {
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * YKS_QUOTES.length);
      return YKS_QUOTES[randomIndex];
    };

    setCurrentQuote(getRandomQuote());
  }, []); // This will trigger on page refresh

  return (
    <div className="text-center">
      <blockquote className="text-sm md:text-base font-medium text-foreground italic leading-relaxed">
        "{currentQuote.quote}"
      </blockquote>
      <cite className="text-xs text-muted-foreground mt-1 block">
        - {currentQuote.author}
      </cite>
    </div>
  );
}