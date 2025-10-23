# Stripe Integration Setup Guide

Šis dokumentas paaiškina, kaip susikonfigūruoti Stripe mokėjimus su šiuo projektu.

## 1. Prisijungimas prie Stripe CLI

Pirmiausia, prisijunkite prie Stripe naudodami CLI:

```bash
stripe login
```

Ši komanda atidarys naršyklę, kur galėsite autorizuoti Stripe CLI su savo Stripe paskyra.

## 2. Produktų ir kainų sinchronizacija su Stripe

Sukurkite produktus ir kainas Stripe:

```bash
npm run stripe:sync
```

Šis script'as:
- Nuskaitys visus aktyvius paketus iš duomenų bazės
- Sukurs atitinkamus produktus Stripe dashboard'e
- Sukurs mėnesines ir metines kainas kiekvienam paketui
- Atnaujins duomenų bazės įrašus su Stripe ID

## 3. Webhook'ų konfigūracija (Development)

### Paleidimas lokaliai

Terminalе paleiskite:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**SVARBU:** Kai paleissite šią komandą, gausite webhook signing secret. Jis atrodys taip:

```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Atnaujinkite .env failą

Nukopijuokite webhook signing secret ir atnaujinkite `.env` failą:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Pastaba:** Kiekvieną kartą, kai paleisiate `stripe listen`, gausite naują webhook secret, todėl turėsite atnaujinti `.env` failą.

## 4. Aplikacijos paleidimas

Kitame terminalo lange paleiskite savo aplikaciją:

```bash
npm run dev
```

Jūsų aplikacija dabar turėtų veikti ant `http://localhost:3000`.

## 5. Paketų puslapio peržiūra

Atidarykite naršyklėje:

```
http://localhost:3000/packages
```

Čia pamatysite visus prieinamus paketus su mokėjimo mygtukais.

## 6. Testavimas

### Testuoti checkout'ą

1. Eikite į `/packages`
2. Pasirinkite komandą
3. Spauskite "Pirkti mėnesinį" arba "Pirkti metinį"
4. Būsite nukreipti į Stripe Checkout puslapį

### Stripe Test Card'ai

Naudokite šiuos test card numerius:

- **Sėkmingas mokėjimas:** `4242 4242 4242 4242`
- **Atmestas mokėjimas:** `4000 0000 0000 0002`
- **3D Secure reikalaujantis:** `4000 0025 0000 3155`

Bet kuri galiojimo data ateityje ir bet koks CVC kodas veiks.

### Webhook'ų tikrinimas

Stripe CLI terminale pamatysite visus webhook įvykius realiu laiku:

```
[200] POST http://localhost:3000/api/webhooks/stripe [evt_xxx]
```

Taip pat galite rankiniu būdu triggerinti įvykius:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

## 7. Production Setup

### Sukurkite webhook Stripe Dashboard'e

1. Eikite į [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Spauskite "+ Add endpoint"
3. Įveskite URL: `https://jūsų-domenas.com/api/webhooks/stripe`
4. Pasirinkite įvykius:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Nukopijuokite "Signing secret" ir pridėkite jį į production `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
```

## Apdorojami Webhook Įvykiai

Webhook handler apdoroja šiuos įvykius:

- **checkout.session.completed** - Aktyvuoja subscription po sėkmingo checkout
- **customer.subscription.created** - Sukuria naują subscription įrašą
- **customer.subscription.updated** - Atnaujina subscription statusą
- **customer.subscription.deleted** - Deaktyvuoja subscription
- **invoice.paid** - Žymi subscription kaip active
- **invoice.payment_failed** - Deaktyvuoja subscription

## API Endpoints

### GET /api/packages
Grąžina visus aktyvius paketus.

### POST /api/packages/checkout
Sukuria Stripe Checkout sesiją.

**Body:**
```json
{
  "teamId": "team-uuid",
  "packageSlug": "pro10",
  "annual": false
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### POST /api/webhooks/stripe
Priima Stripe webhook įvykius (tik Stripe).

## Troubleshooting

### Webhook nepasiekiamas

Įsitikinkite, kad:
- Aplikacija veikia ant `localhost:3000`
- `stripe listen` procesas yra paleistas
- `.env` faile yra teisingas `STRIPE_WEBHOOK_SECRET`

### Mokėjimas nepavyksta

Patikrinkite:
- Ar naudojate test card numerius
- Ar Stripe CLI rodo webhook įvykius
- Ar duomenų bazėje yra package su Stripe ID
- Console log'us aplikacijoje ir Stripe CLI

### Subscription neaktyvuojamas

Patikrinkite:
- Webhook logs Stripe CLI
- Server logs jūsų aplikacijoje
- Ar metadata laukai (teamId, packageId) yra teisingi

## Saugumo Pastabos

1. **Niekada necommitinkite** `.env` failo su tikrais API key'ais
2. Visada naudokite **test mode** development'e
3. Validuokite webhook signatures (jau implementuota)
4. Neleidžiame jokių operacijų be webhook signature validacijos
