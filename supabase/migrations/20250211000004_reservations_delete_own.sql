-- Unreserve только свой резерв: удалять можно только строку, где user_id = текущий пользователь
DROP POLICY IF EXISTS "reservations_delete_any" ON public.reservations;
CREATE POLICY "reservations_delete_own" ON public.reservations FOR DELETE
  USING (user_id = auth.uid());
