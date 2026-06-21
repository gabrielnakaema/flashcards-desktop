import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const activeLinkClasses = "bg-primary/10";
const inactiveLinkClasses = "hover:bg-primary/10 px-4 py-2 rounded-sm";

export const Header = () => {
  return (
    <header className="w-full px-8 py-4 flex items-center justify-between bg-muted border-b border-border backdrop-blur-sm">
      <Link to="/" className="text-primary font-bold text-xl hover:underline">
        Flashcards
      </Link>

      <nav>
        <ul className="flex items-center gap-4">
          <li>
            <Link
              to="/"
              className={inactiveLinkClasses}
              activeProps={{
                className: cn(inactiveLinkClasses, activeLinkClasses),
              }}
            >
              Decks
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={inactiveLinkClasses}
              activeProps={{
                className: cn(inactiveLinkClasses, activeLinkClasses),
              }}
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:outline-1 hover:outline-primary">
        <p className="text-primary text-sm font-bold">U</p>
      </div>
    </header>
  );
};
