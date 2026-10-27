import { Fragment, type ReactNode } from "react";

/**
 * A message with elements in its {placeholders}, such as a link in the
 * middle of a sentence: rich("Write to {email}.", { email: <a>…</a> }).
 * Each language keeps its own word order around the element.
 */
export function rich(
  message: string,
  elements: Record<string, ReactNode>,
): ReactNode {
  return message.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return (
      <Fragment key={index}>
        {key !== undefined && Object.hasOwn(elements, key)
          ? elements[key]
          : part}
      </Fragment>
    );
  });
}
