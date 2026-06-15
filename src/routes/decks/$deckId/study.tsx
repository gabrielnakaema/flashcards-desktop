import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/decks/$deckId/study')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/decks/$deckId/study"!</div>
}
