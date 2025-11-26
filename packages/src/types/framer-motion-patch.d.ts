import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    onDrag?: never;
    onDragStart?: never;
    onDragEnd?: never;
    onDragCapture?: never;
  }
}
