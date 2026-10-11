const filterButtons = [...document.querySelectorAll(".filter-button")];
const categoryCards = [...document.querySelectorAll(".category-card")];
const filterStatus = document.querySelector("#filter-status");

function filterCategories(filter) {
  let visibleCount = 0;

  for (const card of categoryCards) {
    const matches = filter === "all" || card.dataset.category === filter;
    card.hidden = !matches;
    visibleCount += Number(matches);
  }

  for (const button of filterButtons) {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  filterStatus.textContent = `${visibleCount} ${visibleCount === 1 ? "categoría" : "categorías"}`;
}

for (const button of filterButtons) {
  button.addEventListener("click", () => filterCategories(button.dataset.filter));
}