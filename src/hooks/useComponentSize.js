// Simple hook to export a given components dimensions
import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// TODO: add more comments, IE for props
const useComponentSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Init a new handler any time the component changes.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateSize = () => {
      if (ref.current) {
        const nextSize = {
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        };
        setSize((prevSize) =>
          prevSize.width === nextSize.width && prevSize.height === nextSize.height
            ? prevSize
            : nextSize,
        );
      }
    };

    updateSize();
    const rafId = window.requestAnimationFrame(updateSize);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined" && ref.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(ref.current);
    }

    window.addEventListener("resize", updateSize);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [ref]);

  return size;
};

export default useComponentSize;
