# 🗳️ Voting dApp

A decentralized voting application built on **Solana**.

## Tech Stack

* **Solana**
* **Anchor**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Bankrun**

## 📁 Structure

```text
├── anchor/     # Solana program & tests
└── web/        # React frontend
```

## Getting Started

### Install dependencies

```bash
cd anchor
yarn install

cd ../web
yarn install
```

### Run tests

```bash
cd anchor
anchor test
```

### Start frontend

```bash
cd web
yarn dev
```

## Testing

The Solana program is tested with **Anchor Bankrun** for fast local tests without running a validator.

## License

MIT
