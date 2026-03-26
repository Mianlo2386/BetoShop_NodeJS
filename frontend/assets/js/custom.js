document.addEventListener("DOMContentLoaded", function () {
    const minusBtn = document.getElementById("btn-minus-post");
    const plusBtn = document.getElementById("btn-plus-post");
    const quantityDisplay = document.getElementById("var-value-post");
    const quantityInput = document.getElementById("product-quantity-post");

    minusBtn.addEventListener("click", function () {
        let currentQuantity = parseInt(quantityDisplay.textContent);
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityDisplay.textContent = currentQuantity;
            quantityInput.value = currentQuantity;
        }
    });

    plusBtn.addEventListener("click", function () {
        let currentQuantity = parseInt(quantityDisplay.textContent);
        currentQuantity++;
        quantityDisplay.textContent = currentQuantity;
        quantityInput.value = currentQuantity;
    });
});