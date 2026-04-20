-- Update iOS boost product IDs and display names
update public.store_products
set product_id = 'circles.boost.lite.ios',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Lite"')
where product_id = 'circles.boost.small.ios';

update public.store_products
set product_id = 'circles.boost.plus.ios',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Plus"')
where product_id = 'circles.boost.medium.ios';

update public.store_products
set product_id = 'circles.boost.max.ios',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Max"')
where product_id = 'circles.boost.large.ios';

-- Update Android boost product IDs and display names
update public.store_products
set product_id = 'circles.boost.lite.android',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Lite"')
where product_id = 'circles.boost.small.android';

update public.store_products
set product_id = 'circles.boost.plus.android',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Plus"')
where product_id = 'circles.boost.medium.android';

update public.store_products
set product_id = 'circles.boost.max.android',
    metadata = jsonb_set(metadata, '{displayName}', '"Boost Max"')
where product_id = 'circles.boost.large.android';
