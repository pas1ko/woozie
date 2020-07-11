import * as React from "react";
import { HistoryAction, createUrl, changeState } from "./history";
import { To, createLocationUpdates } from "./location";
import { useLocation } from "./context";

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: To;
  replace?: boolean;
}

const Link: React.FC<LinkProps> = ({ to, replace, ...rest }) => {
  const lctn = useLocation();

  const { pathname, search, hash, state } = React.useMemo(
    () => createLocationUpdates(to, lctn),
    [to, lctn]
  );

  const url = React.useMemo(() => createUrl(pathname, search, hash), [
    pathname,
    search,
    hash,
  ]);

  const handleNavigate = React.useCallback(() => {
    const action =
      replace || url === createUrl(lctn.pathname, lctn.search, lctn.hash)
        ? HistoryAction.Replace
        : HistoryAction.Push;
    changeState(action, state, url);
  }, [replace, state, url, lctn]);

  return <LinkAnchor {...rest} href={url} onNavigate={handleNavigate} />;
};

export default Link;

interface LinkAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  onNavigate: () => void;
  onClick?: React.MouseEventHandler;
  target?: string;
}

const LinkAnchor: React.FC<LinkAnchorProps> = ({
  children,
  onNavigate,
  onClick,
  target,
  ...rest
}) => {
  const handleClick = React.useCallback(
    (evt) => {
      try {
        if (onClick) {
          onClick(evt);
        }
      } catch (err) {
        evt.preventDefault();
        throw err;
      }

      if (
        !evt.defaultPrevented && // onClick prevented default
        evt.button === 0 && // ignore everything but left clicks
        (!target || target === "_self") && // let browser handle "target=_blank" etc.
        !isModifiedEvent(evt) // ignore clicks with modifier keys
      ) {
        evt.preventDefault();
        onNavigate();
      }
    },
    [onClick, target, onNavigate]
  );

  return (
    <a onClick={handleClick} target={target} {...rest}>
      {children}
    </a>
  );
};

function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
