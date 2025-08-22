# fiexpress

Lightweight Express backend starter and dev dependencies.

## Hızlı başlat (degit)

Public şablonu doğrudan kopyalamak için:

```bash
npx degit developersailor/fiexpress my-app
cd my-app
npm install
```

## CLI: `create-fiexpress`

Yerel CLI, interaktif olarak veya flags ile projenizi oluşturmanıza yardımcı olur.

Interaktif:

```bash
npx create-fiexpress
```

Non-interaktif (örnek flags):

```bash
# basit flag desteği ile non-interaktif örnek
npx create-fiexpress --name my-backend --db postgres --orm prisma --dotenv yes --jwt yes --casl no --user yes --roles yes --ts yes
```

CLI şu opsiyonları sorar ve seçime göre scaffolding ekler:

- Database: none | mongo | postgres
- ORM: none | prisma | sequelize | drizzle
- dotenv: yes | no (adds `.env.example`)
- JWT auth: yes | no
- CASL: yes | no
- user routes: yes | no
- role-based helpers: yes | no
- TypeScript: yes | no

Seçimlerinizin sonucu olarak:

- ilgili ORM kütüphaneleri ve stub dosyaları (ör. `prisma/schema.prisma`, `src/db/*`)
- `.env.example` ve `src/auth` içinde JWT/CASL yardımcıları
- `src/routes/user.js` veya `.ts` stub
- `tsconfig.json` eklenecekse TypeScript devDependencies paketleri `package.json` içine eklenecektir

Not: Oluşturulan projede hemen çalıştırmak için generator minimal bir "app entry" (ör. `src/index.js` veya `src/index.ts`) ve `package.json` içinde `start` script ekler. Bununla birlikte `npm install` çalıştırılması gereklidir.

## Örnek akış

1. `npx create-fiexpress` çalıştırın.
2. Promptlarda `postgres`, `prisma`, `yes` (dotenv), `yes` (jwt), `yes` (casl), `yes` (user), `yes` (roles), `yes` (ts) gibi seçimler yapın.
3. Oluşturulan klasöre girip `npm install` çalıştırın.

## Yayınlama ve kullanım notları

- CLI'yi npm'e publish ederseniz kullanıcılar `npx create-fiexpress` ile doğrudan çalıştırabilir.
- Paket adının benzersiz olmasına dikkat edin (`package.json` içinde `name` alanı).
- Eğer şablon private ise `degit` erişimi için alternatif yöntem (git clone + remove .git) veya kullanıcının token sağlaması gerekir.

## Geliştirme fikirleri

- CLI'ye arg parsing (`--name`, `--orm`, `--db`, `--ts` vb.) ekleyip CI friendly yapabiliriz.
- Daha fazla auth scaffold (refresh tokens, OAuth, email verification) eklenebilir.

---

Bu repo generator amacıyla geliştirildi; isterseniz şimdi CLI'ye flag arg parsing ekleyip, non-interaktif kullanım ve tam smoke test yapayım.
