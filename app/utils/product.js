// default swatch option (first color)
export function getDefaultOption(product) {
  return (
    product.options.find((option) => option.name === 'Color')?.values[0] || null
  );
}

// selected variant of a product based on the selected swatch option
export function getSelectedVariant(product, selectedOption) {
  return selectedOption
    ? product.variants.nodes.find((variant) =>
        variant.selectedOptions.some(
          (option) =>
            option.name === 'Color' && option.value === selectedOption,
        ),
      )
    : null;
}

// selected image of a product based on the selected swatch option
export function getSelectedImage(product, selectedOption) {
  return selectedOption
    ? product.images.nodes.find((image) =>
        image.altText?.toLowerCase().includes(selectedOption.toLowerCase()),
      )
    : product.images.nodes[0];
}

// the following image due the hovering effect
export function getNextImage(images, currentImage) {
  if (!images || images.length === 0) return null;
  const currentIndex = images.indexOf(currentImage);
  return images[(currentIndex + 1) % images.length];
}
