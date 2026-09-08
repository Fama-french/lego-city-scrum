-- Allow a story to belong to more than one category (e.g. a community pool
-- is both "Entertainment" and "Public Services"). Replaces the single
-- `category` column with a `categories` array, keeping the same allowed
-- values and requiring at least one.

alter table stories add column if not exists categories text[];

update stories set categories = array[category] where categories is null and category is not null;

alter table stories alter column categories set default array['Other']::text[];
alter table stories alter column categories set not null;

alter table stories drop constraint if exists stories_category_check;
alter table stories add constraint stories_categories_valid check (
  coalesce(array_length(categories, 1), 0) >= 1
  and categories <@ array[
    'Safety', 'Housing', 'Transportation', 'Education', 'Entertainment',
    'Public Services', 'Community', 'Environment', 'Other'
  ]::text[]
);

alter table stories drop column if exists category;
