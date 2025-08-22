# fiexpress

Lightweight Express backend starter and dev dependencies.

## Kullanım (degit ile)

Eğer projeyi degit ile klonlamak isterseniz:

```bash
npx degit fiskindal/fiexpress my-app
cd my-app
npm install
```

## `npm create` (yerel CLI)

Paket yüklendiğinde `create-fiexpress` adlı bir CLI sağlanır:

```bash
npx create-fiexpress
# veya global olarak kurup
npm i -g .
create-fiexpress
```

CLI sizi repo ve yeni dizin adı sorması için yönlendirir ve `degit` ile şablonu kopyalar.

## Notlar

- `degit` kullanıldığı için kaynak commit geçmişi kopyalanmaz, sadece dosyalar alınır.
- Eğer `npx create-fiexpress` çalışmazsa, `npx degit fiskindal/fiexpress my-app` komutunu kullanın.
