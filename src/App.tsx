import { useTheme } from "@/hooks/use-theme";

function App() {
  useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      Hello world!
    </div>
  );
}

export default App;
