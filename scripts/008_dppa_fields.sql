ALTER TABLE budget_items 
ADD COLUMN quantity_before integer,
ADD COLUMN unit_before text,
ADD COLUMN unit_price_before numeric,
ADD COLUMN total_price_before numeric;