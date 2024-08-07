export const removeChildElements = (el: HTMLElement) => {
  const children = el?.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      children[i].remove();
    }
  }
};
