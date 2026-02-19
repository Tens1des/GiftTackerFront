-- Запрет переполнения сбора: сумма взносов не может превысить цену подарка (price_cents)

CREATE OR REPLACE FUNCTION public.check_contribution_cap()
RETURNS TRIGGER AS $$
DECLARE
  target_cents INT;
  current_sum INT;
BEGIN
  SELECT wi.price_cents,
         (SELECT COALESCE(SUM(c.amount_cents), 0)::INT FROM public.contributions c WHERE c.item_id = NEW.item_id)
  INTO target_cents, current_sum
  FROM public.wishlist_items wi
  WHERE wi.id = NEW.item_id;
  IF target_cents IS NOT NULL AND target_cents > 0 THEN
    IF current_sum + NEW.amount_cents > target_cents THEN
      RAISE EXCEPTION 'contribution would exceed target amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_contribution_cap_trigger ON public.contributions;
CREATE TRIGGER check_contribution_cap_trigger
  BEFORE INSERT ON public.contributions
  FOR EACH ROW EXECUTE PROCEDURE public.check_contribution_cap();
