# Stripe Quick Start

Greitas vadovas, kaip pradėti naudoti Stripe integraciją.

## Žingsniai

### 1. Prisijunkite prie Stripe CLI

```bash
stripe login
```

### 2. Sinchronizuokite produktus su Stripe

```bash
npm run stripe:sync
```

Ši komanda sukurs produktus ir kainas Stripe dashboard'e iš jūsų lokalių paketų.

### 3. Paleiskite webhook listener'į

**Atidarykite naują terminalo langą** ir paleiskite:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Nukopijuokite webhook secret (prasideda `whsec_...`) ir įdėkite į `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Paleiskite aplikaciją

**Kitame terminalo lange:**

```bash
npm run dev
```

### 5. Testuokite

Atidarykite: http://localhost:3000/packages

Naudokite test card: `4242 4242 4242 4242`

---

**Pilną dokumentaciją rasite:** [STRIPE_SETUP.md](./STRIPE_SETUP.md)
