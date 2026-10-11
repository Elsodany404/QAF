import { ReactNode } from "react";
type ButtonProps = {
  handler: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  disabled?: boolean;
};
function Button({ handler, children, disabled = false }: ButtonProps) {
  return (
    <button
      onClick={handler}
      disabled={disabled}
      className="premium-button premium-button-primary"
    >
      {children}
    </button>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}

function Text({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}

Button.Icon = Icon;
Button.Text = Text;

export { Button };
