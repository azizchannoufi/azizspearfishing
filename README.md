# AZIZ Spearfishing

Cinematic athlete documentary site with a production Admin CMS.

## Develop

```bash
npm install
cp .env.example .env.local
# Fill in Firebase + Cloudinary values (see Setup below)
npm run bootstrap:admin
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Stack

- Next.js + Tailwind + TypeScript
- Firebase Authentication + Firestore
- Cloudinary (images)
- GSAP / Framer Motion / Lenis (public site)
- TipTap, Recharts, dnd-kit (admin)

## Setup (Firebase + Cloudinary)

### 1. Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Email/Password**.
3. Create a **Firestore** database (production mode).
4. Deploy rules and indexes from this repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Or paste [`firestore.rules`](firestore.rules) and [`firestore.indexes.json`](firestore.indexes.json) in the Firebase console.

5. Project settings → Your apps → Web app → copy config into `NEXT_PUBLIC_FIREBASE_*`.
6. Project settings → Service accounts → Generate new private key → map into:

```text
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Cloudinary

1. Create an account at [Cloudinary](https://cloudinary.com/).
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret** into `.env.local`.
3. Uploads use signed server signatures; the API secret never ships to the browser.

### 3. First admin user

```bash
npm run bootstrap:admin
```

Sets custom claim `{ admin: true }` and creates `users/{uid}`. Only users with this claim can access `/admin`.

### 4. Content

The CMS starts **empty**. Sign in to `/admin` and fill Homepage, Athlete, Gallery, Sponsors, etc. The public site hides sections until published/visible content exists.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run bootstrap:admin` | Create first admin + custom claim |
| `npm run lint` | ESLint |

## Security notes

- Never commit `.env.local` or service account JSON.
- Never put Cloudinary API secret or Firebase Admin credentials in client code.
- Firestore rules enforce admin custom claims; frontend route guards are not enough.
