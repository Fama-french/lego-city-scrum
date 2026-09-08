import type { Category } from '../types/database'
import { categoryColor } from '../lib/colors'

export function CategoryTag({ category }: { category: Category }) {
  const color = categoryColor(category)
  return (
    <span className="category-tag" style={{ color, borderColor: color }}>
      {category}
    </span>
  )
}

export function CategoryTagList({ categories }: { categories: Category[] }) {
  return (
    <span>
      {categories.map((c) => (
        <CategoryTag key={c} category={c} />
      ))}
    </span>
  )
}
