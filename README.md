# Flashcards Desktop

A desktop flashcard application for creating decks, generating cards from study material, and reviewing them with spaced repetition.

The application is built around local storage. Decks, cards, review history, and settings are kept in SQLite, so the main study workflow works without an account or a hosted backend. An internet connection is only needed when generating cards with LLM provider.

## Features

- Create and organize decks and categories
- Write plain, multiple-choice, and typed-answer cards
- Generate flashcards from pasted notes or a topic using LLMs
- Review and edit generated cards before saving them
- Study due cards using an SM-2-style spaced repetition schedule
- Track deck progress, due cards, review history, and study streaks
- Filter and search cards within a deck
- Store application data locally in SQLite
- Use light, dark, or system theme settings

## Built With

- Tauri 2
- React and TypeScript
- Vite
- SQLite
- Tailwind CSS and shadcn/ui
- TanStack Router and React Query
- Vitest and Testing Library

## Running Locally

You will need Node.js, pnpm, Rust, and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system.

Install the dependencies:

```sh
pnpm install
```

Start the desktop application in development mode:

```sh
pnpm tauri dev
```

To use card generation, open the application settings and add a LLM API key. The rest of the application can be used without one.

## Tests

Run the unit and component tests with:

```sh
pnpm test
```

Create a production build with:

```sh
pnpm tauri build
```

## Project Status

This is a portfolio project and is still under development. The main deck, card generation, and study workflows are implemented, while some planned features may still be incomplete.

## License

This project is available under the [MIT License](LICENSE).
