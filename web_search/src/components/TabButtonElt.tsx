import { FC, PropsWithChildren, useState } from "react";
import styled from "styled-components";
import { getMouseDirectionX } from "../helpers/getMouseDirection";

const TabButton = styled.button<{
  theme: { mousePos: number; selected: boolean };
}>`
  display: inline-flex;
  align-items: center;
  color: var(--vscode-input-foreground);
  display: inline-flex;
  justify-content: center;
  padding-bottom: 0.3rem;
  &[role="tab"],
  &[role="tab"]:focus,
  &[role="tab"]:hover {
    position: relative;
    z-index: 2;
    top: 2px;
    border: 0px solid transparent;
    background-color: transparent;
    font-weight: bolder;
    overflow: hidden;
    text-align: center;
    cursor: pointer;
  }

  &::before {
    content: "";
    position: absolute;
    z-index: 1;
    left: ${(props) => (props.theme.mousePos < 0 ? "0px" : null)};
    right: ${(props) => (props.theme.mousePos >= 0 ? "0px" : null)};
    bottom: 0;
    height: 0.1rem;
    width: ${(props) => (props.theme.selected ? "100%" : "0%")};
    background-color: var(--vscode-inputOption-activeBorder);
    transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }

  &:hover::before {
    width: 100%;
  }

  &[role="tab"][aria-selected="true"] {
    padding: 2px 2px 4px;
    margin-top: 0;
    border-width: 2px;
    border-top-width: 6px;
    background: hsla(var(--surface4-hsl) / 0.5);
  }

  &[role="tab"][aria-selected="false"] {
    border-bottom: 1px solid hsl(219deg 1% 72%);
  }

  &[role="tab"] span.focus {
    display: inline-block;
    padding: 4px 0.3rem;
    border: 2px solid transparent;
  }

  &[role="tab"]:hover span.focus {
    border: 2px solid var(--vscode-inputOption-activeBorder);
  }
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: Boolean;
}

export const TabButtonElt: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  selected,
  ...props
}) => {
  const [mousePos, setMousePos] = useState<number>();
  return (
    <TabButton
      theme={{
        selected,
        mousePos,
      }}
      onMouseEnter={(e) => {
        setMousePos(getMouseDirectionX(e, e.currentTarget));
      }}
      onMouseLeave={(e) => {
        setMousePos(getMouseDirectionX(e, e.currentTarget));
      }}
      {...props}
    >
      {children}
    </TabButton>
  );
};

export default TabButtonElt;
