-- Edge-case: запрет удаления подарка при наличии взносов (вместо CASCADE, который молча стирает сборы)

ALTER TABLE public.contributions
  DROP CONSTRAINT IF EXISTS contributions_item_id_fkey;

ALTER TABLE public.contributions
  ADD CONSTRAINT contributions_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.wishlist_items(id) ON DELETE RESTRICT;
