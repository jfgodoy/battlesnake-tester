export function useAutoresize(el: HTMLInputElement): void {
  let old_value = el.value;
  el.addEventListener("input", () => {
    if (old_value.length > el.value.length) {
      el.style.width = "0";
    }
    el.style.width = `${el.scrollWidth}px`;
    old_value = el.value;
  });
}
