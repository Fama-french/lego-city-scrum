import { CATEGORIES, type Category } from '../types/database'
import { categoryColor } from '../lib/colors'

interface CategoryPickerProps {
  selected: Category[]
  onChange: (next: Category[]) => void
  label?: string
}

export function CategoryPicker({ selected, onChange, label = 'Categories' }: CategoryPickerProps) {
  function toggle(category: Category) {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category))
    } else {
      onChange([...selected, category])
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="category-picker">
        {CATEGORIES.map((category) => {
          const color = categoryColor(category)
          const active = selected.includes(category)
          return (
            <button
              key={category}
              type="button"
              className="category-chip"
              aria-pressed={active}
              onClick={() => toggle(category)}
              style={
                active
                  ? { background: color, borderColor: color, color: '#fff' }
                  : { background: 'transparent', borderColor: color, color }
              }
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}
