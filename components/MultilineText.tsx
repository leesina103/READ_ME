import { Fragment } from "react";

type Props = { lines: readonly string[] };

/** 여러 문장을 <br />로 이어 한 단락으로 보여줍니다. */
export function MultilineText({ lines }: Props) {
  return <p>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</p>;
}
