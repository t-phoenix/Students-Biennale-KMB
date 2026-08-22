import { highlightSegments } from "../lib/catalogue/search";

type Props = {
  text: string;
  query: string;
};

/** Renders `text` with case-insensitive query matches wrapped in `<mark>`. */
export function HighlightText({ text, query }: Props) {
  const parts = highlightSegments(text, query);
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}
