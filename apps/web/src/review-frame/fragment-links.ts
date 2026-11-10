/**
 * Run inside the artifact's srcdoc sandbox. Its injected content-domain base
 * is needed for resources, but fragment-only links belong to this document.
 * Listen after element/document handlers so authored and annotation gestures
 * that cancel a click keep ownership of it.
 *
 * A fragment link is followed as a same-document navigation of about:srcdoc by
 * assigning `location.hash`. The hash setter resolves against the document's
 * own URL, not the injected base, so nothing is requested from the content
 * host, while the browser still does everything an in-page link normally does:
 * `hashchange` fires (artifacts that switch tabs on it keep working), `:target`
 * styles apply, the indicated element or legacy named anchor is scrolled into
 * view. `history.replaceState` and
 * `location.replace` would resolve against the base and leave the document.
 *
 * This function is serialized into an inline script and must be self-contained.
 */
export function installFragmentLinks(): void {
  window.addEventListener("click", (event: MouseEvent): void => {
    if (
      event.defaultPrevented || event.button !== 0 || event.altKey
      || event.ctrlKey || event.metaKey || event.shiftKey
    ) return;
    const element = event.target;
    if (!(element instanceof Element)) return;
    // HTML links, and SVG links in charts and diagrams, which may still use
    // the legacy xlink:href attribute.
    const link = element.closest("a[href], a[*|href]");
    if (link === null || link.hasAttribute("download")) return;
    const target = link.getAttribute("target")
      ?? document.querySelector("base[target]")?.getAttribute("target")
      ?? "";
    if (target !== "" && target.toLowerCase() !== "_self") return;
    const href = (
      link.getAttribute("href")
      ?? link.getAttributeNS("http://www.w3.org/1999/xlink", "href")
    )?.trim();
    if (href === undefined || href === null || !href.startsWith("#")) return;

    // Missing and malformed targets must not navigate to the base URL either.
    event.preventDefault();
    try {
      window.location.hash = href;
      return;
    } catch {
      // Fall back to scrolling without a navigation.
    }
    let fragment = href.slice(1);
    try {
      fragment = decodeURIComponent(fragment);
    } catch {
      // An authored literal ID can contain an invalid percent escape.
    }
    if (fragment === "") {
      window.scrollTo(0, 0);
      return;
    }
    const destination = document.getElementById(fragment)
      ?? Array.from(document.getElementsByName(fragment)).find(
        (candidate) => candidate instanceof HTMLAnchorElement,
      );
    if (destination !== undefined && destination !== null) {
      destination.scrollIntoView();
      if (destination instanceof HTMLElement) destination.focus({preventScroll: true});
    } else if (fragment.toLowerCase() === "top") {
      window.scrollTo(0, 0);
    }
  });
}
